import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Calendar, Code2, CheckCircle2, Eye } from 'lucide-react';
import { assignmentService } from '../../services';
import { QUERY_KEYS } from '../../lib/queryClient';
import ErrorMessage from '../../components/ui/ErrorMessage';
import EmptyState from '../../components/ui/EmptyState';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { formatDate, getLanguageLabel, getLanguageBadgeClass } from '../../utils/helpers';

export default function StudentAssignmentsPage() {
  const navigate = useNavigate();
  const [nowTimestamp] = useState(() => Date.now());

  const { data: assignments = [], isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.studentAssignments,
    queryFn: async () => {
      const res = await assignmentService.getAll();
      return res.data.data || [];
    },
  });

  return (
    <div className="space-y-5 w-full max-w-[1440px] mx-auto overflow-x-hidden">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">Coding Assignments</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
          Solve teacher-assigned coding prompts in the Code Review Studio and track mentor feedback
        </p>
      </div>

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
          title="No assignments posted yet"
          description="When your instructor assigns coding exercises, they will appear here ready to solve."
        />
      ) : (
        <div className="space-y-4">
          {assignments.map((a) => {
            const sub = a.mySubmission;
            const isPastDue = new Date(a.dueDate).getTime() < nowTimestamp;

            return (
              <div key={a._id} className="card p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`badge text-xs font-mono ${getLanguageBadgeClass(a.language)}`}>
                        {getLanguageLabel(a.language)}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                          isPastDue
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                            : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        <Calendar size={12} /> Due {formatDate(a.dueDate)}
                      </span>
                      {sub ? (
                        <span className="badge badge-green gap-1">
                          <CheckCircle2 size={12} /> Submitted · {sub.score}%
                        </span>
                      ) : (
                        <span className="badge badge-yellow">Pending</span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">{a.title}</h3>
                    {a.teacher?.name && (
                      <p className="text-xs text-gray-400 dark:text-slate-400">Assigned by {a.teacher.name}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {sub && (
                      <button
                        onClick={() => navigate(`/dashboard/review/${sub._id}`)}
                        className="btn btn-secondary btn-sm gap-1.5"
                      >
                        <Eye size={14} /> View Review
                      </button>
                    )}
                    <button
                      onClick={() =>
                        navigate('/dashboard/code-review', {
                          state: {
                            language: a.language,
                            starterCode: a.starterCode || undefined,
                            assignmentId: a._id,
                            assignmentTitle: a.title,
                          },
                        })
                      }
                      className="btn btn-primary btn-sm gap-1.5"
                    >
                      <Code2 size={14} /> {sub ? 'Resubmit' : 'Solve & Submit'}
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed bg-gray-50 dark:bg-slate-800/80 p-3.5 rounded-lg border border-gray-100 dark:border-slate-700">
                  {a.description}
                </p>

                {sub?.teacherFeedback?.comment && (
                  <div className="text-xs p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200">
                    <strong>Mentor Feedback:</strong> {sub.teacherFeedback.comment}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
