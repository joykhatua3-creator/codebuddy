import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardList, Plus, Calendar, Users, Eye, Trash2, ChevronDown, ChevronUp,
} from 'lucide-react';
import { assignmentService } from '../../services';
import { QUERY_KEYS } from '../../lib/queryClient';
import ErrorMessage from '../../components/ui/ErrorMessage';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmModal from '../../components/ui/ConfirmModal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import { ALL_LANGUAGES, formatDate, getLanguageLabel, getLanguageBadgeClass, getScoreColor } from '../../utils/helpers';

const getDefaultDueDate = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

export default function TeacherAssignmentsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: assignments = [], isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.teacherAssignments,
    queryFn: async () => {
      const res = await assignmentService.getAll();
      return res.data.data || [];
    },
  });

  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(() => ({
    title: '',
    language: 'javascript',
    description: '',
    starterCode: '',
    dueDate: getDefaultDueDate(),
  }));

  const [expandedId, setExpandedId] = useState(null);
  const [submissionsByAssignment, setSubmissionsByAssignment] = useState({});
  const [loadingSubsId, setLoadingSubsId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (form.title.trim().length < 3 || form.description.trim().length < 10) {
      return toast({
        type: 'error',
        message: 'Title (3+ chars) and problem description (10+ chars) are required',
      });
    }
    setCreating(true);
    try {
      await assignmentService.create({
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
      });
      toast({ type: 'success', message: 'Assignment created successfully!' });
      setForm({
        title: '',
        language: 'javascript',
        description: '',
        starterCode: '',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.teacherAssignments });
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Failed to create assignment' });
    } finally {
      setCreating(false);
    }
  };

  const toggleSubmissions = async (assignmentId) => {
    if (expandedId === assignmentId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(assignmentId);
    setLoadingSubsId(assignmentId);
    try {
      const subs = await queryClient.fetchQuery({
        queryKey: QUERY_KEYS.assignmentSubmissions(assignmentId),
        queryFn: async () => {
          const res = await assignmentService.getSubmissions(assignmentId);
          return res.data.data.submissions || [];
        },
        staleTime: 1000 * 60,
      });
      setSubmissionsByAssignment((prev) => ({
        ...prev,
        [assignmentId]: subs,
      }));
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Failed to load submissions' });
    } finally {
      setLoadingSubsId(null);
    }
  };

  const handleDelete = async () => {
    try {
      await assignmentService.delete(deleteId);
      setDeleteId(null);
      toast({ type: 'success', message: 'Assignment deleted' });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.teacherAssignments });
    } catch {
      toast({ type: 'error', message: 'Failed to delete assignment' });
    }
  };

  return (
    <div className="space-y-5 w-full max-w-[1440px] mx-auto overflow-x-hidden">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">Assignments &amp; Submissions</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            Create coding prompts for students and inspect submitted reviews &amp; scores
          </p>
        </div>
        <button onClick={() => setShowForm((p) => !p)} className="btn btn-primary gap-1.5">
          <Plus size={16} /> {showForm ? 'Close Form' : 'New Assignment'}
        </button>
      </div>

      {/* Create Assignment Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="card p-5 space-y-4">
          <h3 className="section-title">Create Coding Assignment</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Title</label>
              <input
                type="text"
                className="input"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g., Implement Two Sum with O(n) Map"
                required
              />
            </div>
            <div>
              <label className="label">Language</label>
              <select
                className="input"
                value={form.language}
                onChange={(e) => setForm((p) => ({ ...p, language: e.target.value }))}
              >
                {ALL_LANGUAGES.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Problem Description</label>
              <textarea
                rows={3}
                className="input"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Describe requirements, edge cases, and expected behavior..."
                required
              />
            </div>
            <div>
              <label className="label">Due Date</label>
              <input
                type="date"
                className="input"
                value={form.dueDate}
                onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Optional Starter Code</label>
            <textarea
              rows={3}
              className="input font-mono text-xs"
              value={form.starterCode}
              onChange={(e) => setForm((p) => ({ ...p, starterCode: e.target.value }))}
              placeholder="// Optional boilerplate shown to students"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary btn-sm">
              Cancel
            </button>
            <button type="submit" disabled={creating} className="btn btn-primary btn-sm gap-1.5">
              {creating ? <><LoadingSpinner size="sm" /> Creating...</> : 'Publish Assignment'}
            </button>
          </div>
        </form>
      )}

      {/* Assignments List */}
      {isLoading && assignments.length === 0 ? (
        <ListSkeleton count={3} />
      ) : error ? (
        <ErrorMessage
          message={error.response?.data?.message || 'Failed to load assignments'}
          onRetry={refetch}
        />
      ) : assignments.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No assignments created yet"
          description="Create your first coding prompt to assign work and track student submissions."
          actionLabel="Create Assignment"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="space-y-4">
          {assignments.map((a) => {
            const isOpen = expandedId === a._id;
            const subs = submissionsByAssignment[a._id] || [];

            return (
              <div key={a._id} className="card overflow-hidden">
                <div className="p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`badge text-xs font-mono ${getLanguageBadgeClass(a.language)}`}>
                          {getLanguageLabel(a.language)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
                          <Calendar size={12} /> Due {formatDate(a.dueDate)}
                        </span>
                        <span className="badge badge-blue gap-1">
                          <Users size={11} /> {a.submissionCount} submission{a.submissionCount !== 1 ? 's' : ''}
                        </span>
                        {a.avgScore != null && (
                          <span className={`text-xs font-bold ${getScoreColor(a.avgScore)}`}>
                            Avg: {a.avgScore}%
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">{a.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-slate-300">{a.description}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleSubmissions(a._id)}
                        className="btn btn-secondary btn-sm gap-1"
                      >
                        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        <span>Submissions</span>
                      </button>
                      <button
                        onClick={() => setDeleteId(a._id)}
                        className="btn btn-ghost btn-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 p-2"
                        title="Delete Assignment"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/60 p-4">
                    {loadingSubsId === a._id ? (
                      <div className="flex justify-center py-6"><LoadingSpinner size="md" /></div>
                    ) : subs.length === 0 ? (
                      <p className="text-xs text-gray-500 dark:text-slate-400 text-center py-4">
                        No student submissions for this assignment yet.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-slate-700 text-left text-xs text-gray-500 dark:text-slate-400">
                              <th className="pb-2 pr-4 font-semibold">Student</th>
                              <th className="pb-2 pr-4 font-semibold">Email</th>
                              <th className="pb-2 pr-4 font-semibold">Score</th>
                              <th className="pb-2 pr-4 font-semibold">Bugs</th>
                              <th className="pb-2 pr-4 font-semibold">Mentor Feedback</th>
                              <th className="pb-2 font-semibold text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200/70 dark:divide-slate-700">
                            {subs.map((s) => (
                              <tr key={s._id}>
                                <td className="py-2.5 pr-4 font-medium text-gray-900 dark:text-slate-100">
                                  {s.student?.name || 'Student'}
                                </td>
                                <td className="py-2.5 pr-4 text-xs text-gray-500 dark:text-slate-400">
                                  {s.student?.email}
                                </td>
                                <td className="py-2.5 pr-4 font-bold">
                                  <span className={getScoreColor(s.score)}>{s.score}%</span>
                                </td>
                                <td className="py-2.5 pr-4 text-xs">
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${
                                      s.bugCount === 0
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                        : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                    }`}
                                  >
                                    {s.bugCount} bug{s.bugCount !== 1 ? 's' : ''}
                                  </span>
                                </td>
                                <td className="py-2.5 pr-4 text-xs text-gray-500 dark:text-slate-400">
                                  {s.teacherFeedback?.comment ? 'Reviewed ✓' : 'Pending'}
                                </td>
                                <td className="py-2.5 text-right">
                                  <button
                                    onClick={() => navigate(`/teacher/reviews/${s._id}`)}
                                    className="btn btn-secondary btn-sm gap-1"
                                  >
                                    <Eye size={13} /> Grade &amp; Feedback
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        danger
        title="Delete Assignment"
        message="Are you sure you want to delete this assignment? Student reviews will stay in history."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
