import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute, { GuestRoute } from './ProtectedRoute';
import AppLayout from '../layouts/AppLayout';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ReviewHistory from '../pages/ReviewHistory';
import NewReview from '../pages/NewReview';
import ReviewDetail from '../pages/ReviewDetail';
import TeacherDashboard from '../pages/TeacherDashboard';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<ProtectedRoute roles={['student']} />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<ReviewHistory />} />
          <Route path="/reviews/new" element={<NewReview />} />
          <Route path="/reviews/:id" element={<ReviewDetail />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['teacher']} />}>
        <Route path="/teacher" element={<TeacherDashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
