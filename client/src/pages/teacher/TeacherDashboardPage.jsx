import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Users, Code2, TrendingUp, AlertTriangle, Eye, Search, Download } from 'lucide-react';
import { teacherService } from '../../services';
import { QUERY_KEYS } from '../../lib/queryClient';
import ErrorMessage from '../../components/ui/ErrorMessage';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
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
  const toast = useToast();
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');

  const { data: students = [], isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.teacherStudents,
    queryFn: async () => {
      const res = await teacherService.getStudents();
      return res.data.data || [];
    },
  });

  const { totalReviews, avgScore, needsHelp } = useMemo(() => {
    const reviewsSum = students.reduce((a, s) => a + s.totalReviews, 0);
    const active = students.filter((s) => s.totalReviews > 0);
    const avg =
      active.length > 0
        ? Math.round(active.reduce((a, s) => a + s.avgScore, 0) / active.length)
        : 0;
    const needing = active.filter((s) => s.avgScore < 60).length;
    return { totalReviews: reviewsSum, avgScore: avg, needsHelp: needing };
  }, [students]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }, [students, search]);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const res = await teacherService.exportCsv();
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'codebuddy-class-report.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({ type: 'success', message: 'Class report CSV exported!' });
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Failed to export CSV' });
    } finally {
      setExporting(false);
    }
  };

  if (isLoading && students.length === 0) {
    return <DashboardSkeleton cards={4} />;
  }

  return (
    <div className="space-y-5 w-full max-w-[1440px] mx-auto overflow-x-hidden">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Teacher Dashboard</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Monitor your students' learning progress</p>
        </div>
        <button
          onClick={handleExportCsv}
          disabled={exporting || students.length === 0}
          className="btn btn-secondary btn-sm gap-1.5"
        >
          <Download size={15} />
          <span>{exporting ? 'Exporting...' : 'Export Class CSV'}</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total Students" value={students.length} icon={Users} color="bg-cyan-500" />
        <StatCard label="Total Reviews" value={totalReviews} icon={Code2} color="bg-emerald-500" />
        <StatCard label="Avg Score" value={avgScore} icon={TrendingUp} color="bg-indigo-500" />
        <StatCard label="Needs Help (<60)" value={needsHelp} icon={AlertTriangle} color="bg-rose-500" />
      </div>

      {/* Student table */}
      <div className="card p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
          <h3 className="section-title">Students</h3>
          <div className="relative w-full sm:w-auto">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 w-full sm:w-56 min-h-[40px]" placeholder="Search students..." />
          </div>
        </div>

        {error ? (
          <ErrorMessage
            message={error.response?.data?.message || 'Failed to load students'}
            onRetry={refetch}
          />
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
