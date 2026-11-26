import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { warmUpBackend } from './services';
import ProtectedRoute from './routes/ProtectedRoute';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Layouts
import StudentLayout from './layouts/StudentLayout';
import TeacherLayout from './layouts/TeacherLayout';

// Auth Pages (Lazy loaded for fast initial app render)
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));

// Student Pages (Lazy loaded chunks)
const DashboardPage = lazy(() => import('./pages/student/DashboardPage'));
const CodeReviewPage = lazy(() => import('./pages/student/CodeReviewPage'));
const ReviewDetailPage = lazy(() => import('./pages/student/ReviewDetailPage'));
const ReviewHistoryPage = lazy(() => import('./pages/student/ReviewHistoryPage'));
const RoadmapPage = lazy(() => import('./pages/student/RoadmapPage'));
const QuizPage = lazy(() => import('./pages/student/QuizPage'));
const QuizResultPage = lazy(() => import('./pages/student/QuizResultPage'));
const ProgressPage = lazy(() => import('./pages/student/ProgressPage'));
const ProfilePage = lazy(() => import('./pages/student/ProfilePage'));
const StudentAssignmentsPage = lazy(() => import('./pages/student/StudentAssignmentsPage'));

// Teacher Pages (Lazy loaded chunks)
const TeacherDashboardPage = lazy(() => import('./pages/teacher/TeacherDashboardPage'));
const StudentsPage = lazy(() => import('./pages/teacher/StudentsPage'));
const StudentProgressPage = lazy(() => import('./pages/teacher/StudentProgressPage'));
const TeacherAssignmentsPage = lazy(() => import('./pages/teacher/TeacherAssignmentsPage'));
const TeacherReviewDetailPage = lazy(() => import('./pages/teacher/TeacherReviewDetailPage'));

// Public page (Lazy)
const LandingPage = lazy(() => import('./pages/LandingPage'));

const PageFallback = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 space-y-3">
    <LoadingSpinner size="lg" />
    <p className="text-sm text-gray-500 font-medium">Loading...</p>
  </div>
);

function App() {
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    warmUpBackend();
  }, []);

  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to={user?.role === 'teacher' ? '/teacher' : '/dashboard'} replace />
            ) : (
              <LoginPage />
            )
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? (
              <Navigate to={user?.role === 'teacher' ? '/teacher' : '/dashboard'} replace />
            ) : (
              <RegisterPage />
            )
          }
        />

        {/* Student routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="code-review" element={<CodeReviewPage />} />
          <Route path="review/:id" element={<ReviewDetailPage />} />
          <Route path="history" element={<ReviewHistoryPage />} />
          <Route path="roadmap" element={<RoadmapPage />} />
          <Route path="quiz" element={<QuizPage />} />
          <Route path="quiz/result/:id" element={<QuizResultPage />} />
          <Route path="assignments" element={<StudentAssignmentsPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Teacher routes */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute requiredRole="teacher">
              <TeacherLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<TeacherDashboardPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="students/:id" element={<StudentProgressPage />} />
          <Route path="assignments" element={<TeacherAssignmentsPage />} />
          <Route path="reviews/:id" element={<TeacherReviewDetailPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
