import { useState, Suspense } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, Code2, History, Map, Brain, BarChart2, User,
  LogOut, Sun, Moon, Bell, Menu, ChevronDown, ClipboardList,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { RouteContentSkeleton } from '../components/ui/Skeleton';

const NAV = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/code-review', label: 'Code Review', icon: Code2 },
  { to: '/dashboard/assignments', label: 'Assignments', icon: ClipboardList },
  { to: '/dashboard/history', label: 'Review History', icon: History },
  { to: '/dashboard/roadmap', label: 'Learning Roadmap', icon: Map },
  { to: '/dashboard/quiz', label: 'Practice Quizzes', icon: Brain },
  { to: '/dashboard/progress', label: 'My Progress', icon: BarChart2 },
  { to: '/dashboard/profile', label: 'Profile', icon: User },
];

const StudentSidebarContent = ({ user, onNavigate, onLogout }) => (
  <div className="flex flex-col h-full bg-white/65 dark:bg-[#0B1120]/75 backdrop-blur-2xl">
    {/* Logo */}
    <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/70 dark:border-white/10">
      <Link to="/" className="flex items-center gap-2.5 group">
        <span className="font-mono text-xs font-bold px-2.5 py-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-sm">
          &lt;/&gt;
        </span>
        <div>
          <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight block">
            CodeBuddy
          </span>
          <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-300 font-medium">
            Lucid Studio
          </span>
        </div>
      </Link>
    </div>

    {/* Nav links */}
    <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) => (isActive ? 'sidebar-link-active' : 'sidebar-link')}
        >
          <Icon size={16} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>

    {/* Logout */}
    <div className="p-3 border-t border-white/70 dark:border-white/10">
      <div className="px-3 py-2 mb-1.5 rounded-xl bg-white/60 dark:bg-white/[0.05] border border-white/80 dark:border-white/10">
        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user?.name}</p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
      </div>
      <button
        onClick={onLogout}
        className="sidebar-link w-full text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 hover:text-rose-700 dark:hover:text-rose-300"
      >
        <LogOut size={16} />
        <span>Logout</span>
      </button>
    </div>
  </div>
);

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'S';

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-transparent overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r border-white/70 dark:border-white/10 shrink-0">
        <StudentSidebarContent user={user} onNavigate={() => setSidebarOpen(false)} onLogout={handleLogout} />
      </aside>

      {/* Mobile slide-over drawer (< 768px) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-50 flex flex-col w-56 h-full border-r border-white/70 dark:border-white/10">
            <StudentSidebarContent user={user} onNavigate={() => setSidebarOpen(false)} onLogout={handleLogout} />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="flex items-center gap-3 px-4 lg:px-6 py-3 bg-white/60 dark:bg-[#0B1120]/70 backdrop-blur-xl border-b border-white/70 dark:border-white/10 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden btn btn-ghost p-1.5">
            <Menu size={20} />
          </button>

          <div className="flex-1" />

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Lucid Light Mode' : 'Switch to Deep Lucid Dark Mode'}
            className="liquid-pill p-2 text-xs"
          >
            {theme === 'dark' ? <Sun size={16} className="text-cyan-300" /> : <Moon size={16} className="text-indigo-600" />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setNotifOpen((p) => !p); setUserMenuOpen(false); }}
              className="liquid-pill p-2 relative"
              title="Learning Status"
            >
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-cyan-500 rounded-full" />
            </button>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-64 liquid-glass p-3 z-50 space-y-2">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">Learning Updates</p>
                  <div className="text-xs text-slate-800 dark:text-slate-100 bg-cyan-500/10 p-2.5 rounded-xl border border-cyan-400/25">
                    🔥 Current Streak: <strong>{user?.streak || 0} days</strong>. Keep submitting code reviews or quizzes!
                  </div>
                  <button
                    onClick={() => { navigate('/dashboard/roadmap'); setNotifOpen(false); }}
                    className="w-full text-left text-xs text-cyan-600 dark:text-cyan-300 font-medium hover:underline"
                  >
                    View Personalized Roadmap →
                  </button>
                </div>
              </>
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => { setUserMenuOpen((p) => !p); setNotifOpen(false); }}
              className="liquid-pill px-2.5 py-1.5 flex items-center gap-2"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                {initials}
              </div>
              <span className="hidden sm:block text-xs font-semibold text-slate-800 dark:text-slate-100 max-w-[100px] truncate">
                {user?.name}
              </span>
              <ChevronDown size={14} className="text-slate-500 dark:text-slate-400" />
            </button>
            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-44 liquid-glass py-1 z-50">
                  <button
                    onClick={() => { navigate('/dashboard/profile'); setUserMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-800 dark:text-slate-100 hover:bg-white/60 dark:hover:bg-white/[0.06] flex items-center gap-2"
                  >
                    <User size={14} /> Profile
                  </button>
                  <div className="border-t border-white/60 dark:border-white/10 my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 scrollbar-thin">
          <Suspense fallback={<RouteContentSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
