import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const linkClass = ({ isActive }) =>
  `px-3 py-1.5 rounded-md text-sm ${isActive ? 'bg-[#1D2340] text-white' : 'text-[#1D2340] hover:bg-[#DDE1EE]'}`;

export default function AppLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-[#EEF1F6] text-[#1D2340] font-[IBM_Plex_Sans,system-ui,sans-serif]">
      <header className="border-b border-[#C9CEE0] bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3">
          <Link to="/dashboard" className="mr-4 font-[Bricolage_Grotesque,sans-serif] text-lg font-bold">
            Code Review Buddy
          </Link>
          <NavLink to="/reviews/new" className={linkClass}>New review</NavLink>
          <NavLink to="/dashboard" className={linkClass}>My reviews</NavLink>
          <span className="ml-auto hidden text-sm text-[#5B6385] sm:inline">{user.name}</span>
          <button onClick={logout} className="rounded-md border border-[#C9CEE0] px-3 py-1.5 text-sm">
            Log out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
