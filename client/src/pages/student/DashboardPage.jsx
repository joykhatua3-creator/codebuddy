import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Code2, AlertTriangle, Brain, Flame, TrendingUp,
  Map, CheckCircle2,
} from 'lucide-react';
import {
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { progressService } from '../../services';
import ErrorMessage from '../../components/ui/ErrorMessage';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { getScoreColor, getScoreLabel, getLevelColor } from '../../utils/helpers';

const StatCard = ({ label, value, icon: Icon, color, sub }) => (
  <div className="card p-5 flex items-start gap-4">
    <div className={`p-2.5 rounded-lg ${color}`}>
      <Icon size={20} className="text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-0.5">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchProgress = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await progressService.get();
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProgress(); }, [fetchProgress]);

  if (loading) return <DashboardSkeleton cards={5} />;

  if (error) return <ErrorMessage message={error} onRetry={fetchProgress} />;

  const { overview, scoreTrend = [], topics = [], weakestTopics = [], recentQuizzes = [] } = data || {};
  const unmasteredWeakTopics = weakestTopics.filter((t) => (t.level ?? 0) < 75);

  // Radar data: top 6 topics
  const radarData = topics.slice(0, 6).map((t) => ({
    topic: t.topic.length > 12 ? t.topic.slice(0, 12) + '…' : t.topic,
    level: t.level,
  }));

  // Quiz bar data
  const quizBarData = recentQuizzes.slice().reverse().map((q, i) => ({
    name: `Quiz ${i + 1}`,
    score: q.score || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Overview</h2>
        <p className="text-sm text-gray-500 mt-0.5">Your learning progress at a glance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Reviews" value={overview?.totalReviews} icon={Code2} color="bg-blue-500" />
        <StatCard label="Avg Quality Score" value={overview?.avgScore} icon={TrendingUp} color="bg-green-500" sub={getScoreLabel(overview?.avgScore || 0)} />
        <StatCard label="Weak Topics" value={overview?.weakTopicsCount} icon={AlertTriangle} color="bg-yellow-500" />
        <StatCard label="Quizzes Done" value={overview?.totalQuizzes} icon={Brain} color="bg-purple-500" />
        <StatCard label="Day Streak" value={overview?.streak} icon={Flame} color="bg-orange-500" sub="consecutive days" />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Line chart */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="section-title mb-4">Score Trend</h3>
          {scoreTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={scoreTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => (d ? String(d).slice(5) : '')} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v}/100`, 'Score']} />
                <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              Submit code reviews to see your score trend
            </div>
          )}
        </div>

        {/* Radar chart */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Topic Strengths</h3>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="topic" tick={{ fontSize: 10 }} />
                <Radar dataKey="level" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm text-center">
              Complete reviews to see topic strengths
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Weakest topics */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Weakest Concepts</h3>
          {unmasteredWeakTopics.length > 0 ? (
            <div className="space-y-3">
              {unmasteredWeakTopics.map((t) => (
                <div key={t.topic}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 dark:text-slate-200 truncate">{t.topic}</span>
                    <span className={getScoreColor(t.level)}>{t.level}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${getLevelColor(t.level)}`} style={{ width: `${t.level}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-6 px-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50">
              <CheckCircle2 size={22} className="text-emerald-600 dark:text-emerald-400 mb-1.5" />
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                No weak concepts detected yet—great job!
              </p>
            </div>
          )}
        </div>

        {/* Quiz bar chart */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Recent Quiz Scores</h3>
          {quizBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={quizBarData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v}%`, 'Score']} />
                <Bar dataKey="score" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm text-center">
              No quizzes taken yet
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: 'Submit Code Review', icon: Code2, to: '/dashboard/code-review', color: 'btn-primary' },
              { label: 'Take a Quiz', icon: Brain, to: '/dashboard/quiz', color: 'btn-secondary' },
              { label: 'View Roadmap', icon: Map, to: '/dashboard/roadmap', color: 'btn-secondary' },
            ].map(({ label, icon: Icon, to, color }) => (
              <button key={label} onClick={() => navigate(to)}
                className={`btn ${color} w-full justify-start gap-2`}>
                <Icon size={16} />{label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
