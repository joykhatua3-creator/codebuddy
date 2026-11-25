import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Flame, Code2, Brain, TrendingUp, AlertTriangle } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { teacherService } from '../../services';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import ScoreBadge from '../../components/ui/ScoreBadge';
import { getScoreColor, getLevelColor, formatDate, formatRelativeTime, getLanguageLabel, getLanguageBadgeClass } from '../../utils/helpers';

export default function StudentProgressPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProgress = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await teacherService.getStudentProgress(id);
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load student progress');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchProgress(); }, [fetchProgress]);

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>;
  if (error) return <ErrorMessage message={error} onRetry={fetchProgress} />;
  if (!data) return null;

  const { student, overview, scoreTrend = [], topics = [], recentReviews = [], quizzes = [] } = data;

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => navigate(-1)} className="btn btn-ghost p-2 mt-0.5"><ArrowLeft size={18} /></button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">{student.name}</h2>
          <p className="text-sm text-gray-500">{student.email} · Joined {formatDate(student.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-orange-500 font-semibold">
          <Flame size={16} />{student.streak} day streak
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Reviews', value: overview.totalReviews, icon: Code2, color: 'bg-blue-500' },
          { label: 'Avg Score', value: `${overview.avgScore}%`, icon: TrendingUp, color: 'bg-green-500' },
          { label: 'Quizzes Done', value: overview.totalQuizzes, icon: Brain, color: 'bg-purple-500' },
          { label: 'Weak Topics', value: overview.weakTopicsCount, icon: AlertTriangle, color: 'bg-red-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4 flex items-start gap-3">
            <div className={`p-2 rounded-lg ${color}`}><Icon size={16} className="text-white" /></div>
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Score trend */}
      <div className="card p-5">
        <h3 className="section-title mb-4">Score Trend</h3>
        {scoreTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={scoreTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => (d ? String(d).slice(5) : '')} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v}/100`, 'Score']} />
              <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : <p className="text-center text-gray-400 py-10 text-sm">No reviews yet</p>}
      </div>

      {/* Topic progress */}
      <div className="card p-5">
        <h3 className="section-title mb-4">Topic Progress</h3>
        {topics.length > 0 ? (
          <div className="space-y-3">
            {topics.map((t) => (
              <div key={t.topic}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium">{t.topic}</span>
                  <span className={`font-semibold ${getScoreColor(t.level)}`}>{t.level}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${getLevelColor(t.level)}`} style={{ width: `${t.level}%` }} />
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-gray-400 py-4 text-center">No topics tracked</p>}
      </div>

      {/* Reviews list */}
      <div className="card p-5">
        <h3 className="section-title mb-4">Recent Reviews</h3>
        {recentReviews.length > 0 ? (
          <div className="space-y-2">
            {recentReviews.map((r) => (
              <div key={r._id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                <ScoreBadge score={r.score} size="sm" />
                <div className="flex-1 min-w-0">
                  <span className={`badge text-xs rounded-full px-2 py-0.5 ${getLanguageBadgeClass(r.language)}`}>
                    {getLanguageLabel(r.language)}
                  </span>
                  <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(r.createdAt)}</p>
                </div>
                <span className="text-xs text-red-500">{r.bugs?.length || 0} bugs</span>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-gray-400 py-4 text-center">No reviews yet</p>}
      </div>

      {/* Quiz history */}
      {quizzes.length > 0 && (
        <div className="card p-5">
          <h3 className="section-title mb-4">Quiz History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-2 text-left font-semibold text-gray-600">Topics</th>
                  <th className="pb-2 text-center font-semibold text-gray-600">Score</th>
                  <th className="pb-2 text-center font-semibold text-gray-600">Correct</th>
                  <th className="pb-2 text-right font-semibold text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {quizzes.map((q) => (
                  <tr key={q._id} className="hover:bg-gray-50">
                    <td className="py-2.5 text-xs text-gray-600">{q.topics?.join(', ')}</td>
                    <td className="py-2.5 text-center">
                      <span className={`font-bold ${getScoreColor(q.score)}`}>{q.score}%</span>
                    </td>
                    <td className="py-2.5 text-center text-xs text-gray-500">
                      {q.correctCount}/{q.totalQuestions}
                    </td>
                    <td className="py-2.5 text-right text-xs text-gray-400">{formatDate(q.completedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
