'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Code2, AlertTriangle, Brain, Flame, TrendingUp,
  ArrowRight, Map, Plus
} from 'lucide-react';
import {
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { progressService } from '@/lib/clientApi';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import ScoreBadge from '@/components/ui/ScoreBadge';
import { getScoreLabel, getScoreColor, getLevelColor, getLanguageLabel, formatRelativeTime } from '@/lib/helpers';

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
  const router = useRouter();

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

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) return <ErrorMessage message={error} onRetry={fetchProgress} />;

  const { overview, scoreTrend = [], topics = [], weakestTopics = [], recentQuizzes = [] } = data || {};

  const radarData = topics.slice(0, 6).map((t) => ({
    topic: t.topic.length > 12 ? t.topic.slice(0, 12) + '…' : t.topic,
    level: t.level,
  }));

  const quizBarData = recentQuizzes.slice().reverse().map((q, i) => ({
    name: `Quiz ${i + 1}`,
    score: q.score || 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Overview</h2>
          <p className="text-sm text-gray-500 mt-0.5">Your learning progress at a glance</p>
        </div>
        <Link href="/dashboard/code-review" className="btn btn-primary gap-1.5">
          <Plus size={16} /> New Code Review
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Reviews" value={overview?.totalReviews} icon={Code2} color="bg-blue-500" />
        <StatCard label="Avg Quality Score" value={overview?.avgScore} icon={TrendingUp} color="bg-green-500" sub={getScoreLabel(overview?.avgScore || 0)} />
        <StatCard label="Weak Topics" value={overview?.weakTopicsCount} icon={AlertTriangle} color="bg-yellow-500" />
        <StatCard label="Quizzes Done" value={overview?.totalQuizzes} icon={Brain} color="bg-purple-500" />
        <StatCard label="Day Streak" value={overview?.streak} icon={Flame} color="bg-orange-500" sub="consecutive days" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <h3 className="section-title mb-4">Score Trend</h3>
          {scoreTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={scoreTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v}/100`, 'Score']} />
                <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-sm">
              <Code2 size={32} className="mb-2 text-gray-300" />
              <p>No reviews yet. Submit your first code to see score trends!</p>
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="section-title mb-4">Topic Strengths</h3>
          {radarData.length >= 3 ? (
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="topic" tick={{ fontSize: 10 }} />
                <Radar dataKey="level" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-sm text-center">
              <Brain size={32} className="mb-2 text-gray-300" />
              <p>Submit reviews covering more topics to generate a skill radar.</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-title">Weak Topics to Practice</h3>
            <Link href="/dashboard/roadmap" className="text-xs text-primary-600 font-medium hover:underline flex items-center gap-1">
              View Roadmap <ArrowRight size={12} />
            </Link>
          </div>
          {weakestTopics.length > 0 ? (
            <div className="space-y-3">
              {weakestTopics.map((t) => (
                <div key={t._id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <span className="text-sm font-medium text-gray-800">{t.topic}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div className={`h-full ${getLevelColor(t.level)}`} style={{ width: `${t.level}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-gray-600 w-8 text-right">{t.level}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-6 text-center">No weak topics recorded yet!</p>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-title">Recent Quizzes</h3>
            <Link href="/dashboard/quiz" className="text-xs text-primary-600 font-medium hover:underline flex items-center gap-1">
              Take Quiz <ArrowRight size={12} />
            </Link>
          </div>
          {quizBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={quizBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v}%`, 'Score']} />
                <Bar dataKey="score" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 py-6 text-center">No quizzes completed yet. Test yourself!</p>
          )}
        </div>
      </div>
    </div>
  );
}
