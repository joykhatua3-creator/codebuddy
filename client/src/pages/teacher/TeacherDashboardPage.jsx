import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Code2, TrendingUp, AlertTriangle, Eye, Search } from 'lucide-react';
import { teacherService } from '../../services';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import { getScoreColor } from '../../utils/helpers';

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="card p-5 flex items-start gap-4">
    <div className={`p-2.5 rounded-lg ${color}`}><Icon size={20} className="text-white" /></div>
    <div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-0.5">{value ?? '—'}</p>
    </div>
  </div>
);

export default function TeacherDashboardPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await teacherService.getStudents();
      setStudents(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const totalReviews = students.reduce((a, s) => a + s.totalReviews, 0);
  const activeStudents = students.filter((s) => s.totalReviews > 0);
  const avgScore = activeStudents.length > 0
    ? Math.round(activeStudents.reduce((a, s) => a + s.avgScore, 0) / activeStudents.length) : 0;
  const needsHelp = activeStudents.filter((s) => s.avgScore < 60).length;

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Teacher Dashboard</h2>
        <p className="text-sm text-gray-500 mt-0.5">Monitor your students' learning progress</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={students.length} icon={Users} color="bg-blue-500" />
        <StatCard label="Total Reviews" value={totalReviews} icon={Code2} color="bg-green-500" />
        <StatCard label="Avg Score" value={avgScore} icon={TrendingUp} color="bg-purple-500" />
        <StatCard label="Needs Help (<60)" value={needsHelp} icon={AlertTriangle} color="bg-red-500" />
      </div>

      {/* Student table */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="section-title">Students</h3>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 w-56" placeholder="Search students..." />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchStudents} />
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-10 text-sm">No students found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  {['Student', 'Email', 'Reviews', 'Avg Score', 'Weakest Topic', 'Quizzes', ''].map((h) => (
                    <th key={h} className="pb-2.5 pr-4 font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50">
                    <td className="py-3 pr-4 font-medium text-gray-900 whitespace-nowrap">{s.name}</td>
                    <td className="py-3 pr-4 text-gray-500 text-xs">{s.email}</td>
                    <td className="py-3 pr-4 text-center">{s.totalReviews}</td>
                    <td className="py-3 pr-4">
                      <span className={`font-semibold ${getScoreColor(s.avgScore)}`}>{s.avgScore}%</span>
                    </td>
                    <td className="py-3 pr-4 text-xs text-gray-500 max-w-[120px] truncate">{s.weakestTopic}</td>
                    <td className="py-3 pr-4 text-center">{s.totalQuizzes}</td>
                    <td className="py-3">
                      <button onClick={() => navigate(`/teacher/students/${s._id}`)}
                        className="btn btn-secondary btn-sm gap-1">
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
