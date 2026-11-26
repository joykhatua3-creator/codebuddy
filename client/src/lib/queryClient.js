import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const QUERY_KEYS = {
  progress: ['progress'],
  reviewsRoot: ['reviews'],
  reviewsList: (params) => ['reviews', 'list', params],
  reviewDetail: (id) => ['reviews', 'detail', id],
  roadmap: ['roadmap'],
  studentAssignments: ['assignments', 'student'],
  teacherAssignments: ['assignments', 'teacher'],
  assignmentSubmissions: (id) => ['assignments', 'submissions', id],
  teacherStudents: ['teacher', 'students'],
  teacherStudentProgress: (id) => ['teacher', 'student-progress', id],
  quizResult: (id) => ['quiz', 'result', id],
  oauthProviders: ['auth', 'oauth-providers'],
};
