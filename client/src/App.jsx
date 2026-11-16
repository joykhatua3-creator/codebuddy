import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';

// Layouts
import StudentLayout from './layouts/StudentLayout';
import TeacherLayout from './layouts/TeacherLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Student Pages
import DashboardPage from './pages/student/DashboardPage';
import CodeReviewPage from './pages/student/CodeReviewPage';
import ReviewDetailPage from './pages/student/ReviewDetailPage';
import ReviewHistoryPage from './pages/student/ReviewHistoryPage';
import RoadmapPage from './pages/student/RoadmapPage';
import QuizPage from './pages/student/QuizPage';
import QuizResultPage from './pages/student/QuizResultPage';
import ProgressPage from './pages/student/ProgressPage';
import ProfilePage from './pages/student/ProfilePage';

// Teacher Pages
import TeacherDashboardPage from './pages/teacher/TeacherDashboardPage';
import StudentsPage from './pages/teacher/StudentsPage';
import StudentProgressPage from './pages/teacher/StudentProgressPage';

// Public page
import LandingPage from './pages/LandingPage';

function App() {
  const { isAuthenticated, user } = useAuth();

  return (
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
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
