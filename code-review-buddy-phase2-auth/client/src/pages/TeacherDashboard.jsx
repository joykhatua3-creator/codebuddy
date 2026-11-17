import { useAuth } from '../context/AuthContext';

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Teacher dashboard: {user.name}</h1>
      <p className="mt-2 text-[#5B6385]">Student analytics arrive in a later phase.</p>
      <button onClick={logout} className="mt-6 rounded-md border border-[#C9CEE0] px-4 py-2">Log out</button>
    </div>
  );
}
