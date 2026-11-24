'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { progressService } from '@/lib/clientApi';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { getLevelColor } from '@/lib/helpers';

export default function ProgressPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProgress = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await progressService.get();
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load progress');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>;
  if (error) return <ErrorMessage message={error} onRetry={fetchProgress} />;

  const { scoreTrend = [], topics = [], recentQuizzes = [] } = data || {};
  const quizChartData = recentQuizzes.slice().reverse().map((q, i) => ({ name: `Q${i+1}`, score: q.score || 0 }));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-gray-900">My Progress</h2>
        <p className="text-sm text-gray-500 mt-0.5">Detailed analytics of your learning journey</p>
      </div>

      <div className="card p-5">
        <h3 className="section-title mb-4">Score Trend Over Time</h3>
        {scoreTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={scoreTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v}/100`, 'Score']} />
              <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : <p className="text-center text-gray-400 py-12 text-sm">No reviews yet</p>}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <h3 className="section-title mb-4">Topic Strengths Radar</h3>
          {topics.length >= 3 ? (
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={topics.slice(0, 8).map((t) => ({ topic: t.topic.split(' ')[0], level: t.level }))}>
                <PolarGrid />
                <PolarAngleAxis dataKey="topic" tick={{ fontSize: 10 }} />
                <Radar dataKey="level" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-gray-400 py-12 text-sm">Submit more reviews to unlock topic radar</p>}
        </div>

        <div className="card p-5">
          <h3 className="section-title mb-4">Quiz Performance</h3>
          {quizChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={quizChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v}%`, 'Score']} />
                <Bar dataKey="score" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-gray-400 py-12 text-sm">No quizzes completed yet</p>}
        </div>
      </div>
    </div>
  );
}
