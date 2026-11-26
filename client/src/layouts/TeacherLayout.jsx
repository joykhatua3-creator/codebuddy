import { useState, Suspense } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Sun, Moon, Bell, Menu, X, ChevronDown, ClipboardList } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { RouteContentSkeleton } from '../components/ui/Skeleton';
import AuroraBackdrop from '../components/ui/AuroraBackdrop';

const NAV = [
  { to: '/teacher', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/teacher/students', label: 'Students', icon: Users },
  { to: '/teacher/assignments', label: 'Assignments', icon: ClipboardList },
];

const getTeacherMobileTitle = (pathname) => {
  if (pathname.startsWith('/teacher/students')) return 'Students';
  if (pathname.startsWith('/teacher/assignments')) return 'Assignments';
  if (pathname.startsWith('/teacher/reviews')) return 'Review Inspection';
  return 'Teacher Dashboard';
};

const TeacherSidebarContent = ({ user, onNavigate, onLogout, showClose = false }) => (
  <div className="flex flex-col h-full bg-white/75 dark:bg-[#0B1120]/85 backdrop-blur-2xl">
    <div className="flex items-center justify-between gap-2 px-4 py-4 border-b border-white/70 dark:border-white/10">
      <Link to="/" onClick={onNavigate} className="flex items-center gap-2.5 min-w-0">
        <span className="font-mono text-xs font-bold px-2.5 py-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-sm shrink-0">
          &lt;/&gt;
        </span>
        <div className="min-w-0">
          <span className="text-sm font-bold text-slate-900 dark:text-white block truncate">CodeBuddy</span>
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-300 font-medium block">Teacher Portal</span>
        </div>
      </Link>
      {showClose && (
        <button
          type="button"
          onClick={onNavigate}
          aria-label="Close navigation drawer"
          className="lg:hidden p-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-white/10"
        >
          <X size={18} />
        </button>
      )}
    </div>
    <nav className="flex-1 p-3 space-y-1">
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
    <div className="p-3 border-t border-white/70 dark:border-white/10">
      <div className="px-3 py-2 mb-1.5 rounded-xl bg-white/65 dark:bg-white/[0.05] border border-white/80 dark:border-white/10">
        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user?.name}</p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
      </div>
      <button
        onClick={onLogout}
        className="sidebar-link w-full text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 hover:text-rose-700"
      >
        <LogOut size={16} />
        <span>Logout</span>
      </button>
    </div>
  </div>
);

export default function TeacherLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'T';
  const pageTitle = getTeacherMobileTitle(location.pathname);
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="relative flex min-h-screen lg:h-screen overflow-x-hidden lg:overflow-hidden">
      <AuroraBackdrop />

      <aside className="hidden lg:flex flex-col w-56 border-r border-white/70 dark:border-white/10 shrink-0">
        <TeacherSidebarContent user={user} onNavigate={() => setSidebarOpen(false)} onLogout={handleLogout} />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-10 flex flex-col w-64 max-w-[80vw] h-full border-r border-white/75 dark:border-white/15 shadow-2xl">
            <TeacherSidebarContent
              user={user}
              showClose
              onNavigate={() => setSidebarOpen(false)}
              onLogout={handleLogout}
            />
          </aside>
        </div>
      )}

      <div className="flex flex-col flex-1 min-w-0">
        <header className="sticky top-0 z-30 flex items-center gap-2 sm:gap-3 px-3 sm:px-5 lg:px-6 py-2.5 sm:py-3 bg-white/70 dark:bg-[#0B1120]/75 backdrop-blur-xl border-b border-white/75 dark:border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
            className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/80 dark:bg-white/[0.08] border border-white/85 dark:border-white/15 text-slate-700 dark:text-slate-200 shrink-0"
          >
            <Menu size={18} />
          </button>
          <span className="lg:hidden text-sm font-bold text-slate-900 dark:text-white truncate">
            {pageTitle}
          </span>
          <span className="hidden lg:inline-flex badge-green text-xs font-mono">Teacher</span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Lucid Light Mode' : 'Switch to Deep Lucid Dark Mode'}
            className="liquid-pill p-2 shrink-0"
          >
            {theme === 'dark' ? <Sun size={16} className="text-cyan-300" /> : <Moon size={16} className="text-indigo-600" />}
          </button>
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => { setNotifOpen((p) => !p); setUserMenuOpen(false); }}
              className="liquid-pill p-2 relative"
              title="Teacher Updates"
            >
              <Bell size={16} />
            </button>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-64 max-w-[85vw] liquid-glass p-3 z-50 space-y-2">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">Teacher Portal</p>
                  <div className="text-xs text-slate-800 dark:text-slate-100 bg-cyan-500/10 p-2.5 rounded-xl border border-cyan-400/25">
                    Review student rosters, average scores, and weak-topic trends from the Students view.
                  </div>
                  <button
                    onClick={() => { navigate('/teacher/students'); setNotifOpen(false); }}
                    className="w-full text-left text-xs text-cyan-600 dark:text-cyan-300 font-medium hover:underline"
                  >
                    View All Students →
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="relative shrink-0">
            <button onClick={() => { setUserMenuOpen((p) => !p); setNotifOpen(false); }} className="liquid-pill px-2 sm:px-2.5 py-1.5 flex items-center gap-1.5 sm:gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shrink-0">{initials}</div>
              <ChevronDown size={14} className="text-slate-500 dark:text-slate-400" />
            </button>
            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-44 liquid-glass py-1 z-50">
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center gap-2">
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </header>
        <main className="flex-1 lg:overflow-y-auto overflow-x-hidden p-3 sm:p-5 lg:p-6 scrollbar-thin">
          <Suspense fallback={<RouteContentSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
