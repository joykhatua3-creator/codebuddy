'use client';

import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Flame, Code2, Brain, TrendingUp } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { teacherService } from '@/lib/clientApi';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import ScoreBadge from '@/components/ui/ScoreBadge';
import { getScoreColor, getLevelColor, formatDate, getLanguageLabel, getLanguageBadgeClass } from '@/lib/helpers';

export default function StudentProgressPage({ params }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
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

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>;
  if (error) return <ErrorMessage message={error} onRetry={fetchProgress} />;
  if (!data) return null;

  const { student, stats, scoreTrend = [], topics = [], recentReviews = [], recentQuizzes = [] } = data;

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="flex items-start gap-3">
        <Link href="/teacher/students" className="btn btn-ghost p-2 mt-0.5">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">{student.name}</h2>
          <p className="text-sm text-gray-500">{student.email} · Joined {formatDate(student.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-orange-500 font-semibold">
          <Flame size={16} />{student.streak} day streak
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card p-4">
          <span className="text-xs text-gray-500 font-medium">Total Reviews</span>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{stats.totalReviews}</p>
        </div>
        <div className="card p-4">
          <span className="text-xs text-gray-500 font-medium">Avg Review Score</span>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{stats.avgScore}%</p>
        </div>
        <div className="card p-4">
          <span className="text-xs text-gray-500 font-medium">Quizzes Done</span>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{stats.totalQuizzes}</p>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="section-title mb-4">Score Trend</h3>
        {scoreTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={scoreTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v}/100`, 'Score']} />
              <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-gray-400 py-8 text-center">No reviews recorded yet</p>
        )}
      </div>

      <div className="card p-5">
        <h3 className="section-title mb-4">Topic Proficiencies</h3>
        {topics.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {topics.map((t) => (
              <div key={t._id} className="p-3 rounded-lg bg-gray-50 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-800">{t.topic}</span>
                <span className={`badge ${getLevelColor(t.level)} text-white`}>{t.level}%</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 py-6 text-center">No topic data available yet</p>
        )}
      </div>
    </div>
  );
}
