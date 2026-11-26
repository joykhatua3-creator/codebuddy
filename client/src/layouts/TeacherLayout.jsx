import { useState, Suspense } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Sun, Moon, Bell, Menu, ChevronDown, ClipboardList } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { RouteContentSkeleton } from '../components/ui/Skeleton';

const NAV = [
  { to: '/teacher', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/teacher/students', label: 'Students', icon: Users },
  { to: '/teacher/assignments', label: 'Assignments', icon: ClipboardList },
];

const TeacherSidebarContent = ({ user, onNavigate, onLogout }) => (
  <div className="flex flex-col h-full bg-white dark:bg-[#111116]">
    <div className="flex items-center gap-2.5 px-4 py-5 border-b border-[#E5DFD5] dark:border-white/[0.08]">
      <Link to="/" className="flex items-center gap-2.5">
        <span className="font-mono text-xs font-bold px-2 py-1.5 rounded-lg bg-[#E85D3F]/10 text-[#E85D3F] dark:bg-orange-500/15 dark:text-orange-400 border border-[#E85D3F]/20 dark:border-orange-500/25">
          &lt;/&gt;
        </span>
        <div>
          <span className="text-sm font-bold text-[#141210] dark:text-[#F8FAFC] block">CodeBuddy</span>
          <span className="text-[11px] font-mono text-[#10B981] dark:text-[#34D399] font-medium">Teacher Portal</span>
        </div>
      </Link>
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
    <div className="p-3 border-t border-[#E5DFD5] dark:border-white/[0.08]">
      <div className="px-3 py-2 mb-1.5 rounded-xl bg-[#F7F4EE] dark:bg-white/[0.03] border border-[#E5DFD5] dark:border-white/[0.06]">
        <p className="text-xs font-semibold text-[#141210] dark:text-[#F8FAFC] truncate">{user?.name}</p>
        <p className="text-[11px] text-[#57534E] dark:text-[#94A3B8] truncate">{user?.email}</p>
      </div>
      <button
        onClick={onLogout}
        className="sidebar-link w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700"
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'T';
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-[#F7F4EE] dark:bg-[#0D0D11] overflow-hidden">
      <aside className="hidden lg:flex flex-col w-56 bg-white dark:bg-[#111116] border-r border-[#E5DFD5] dark:border-white/[0.08] shrink-0">
        <TeacherSidebarContent user={user} onNavigate={() => setSidebarOpen(false)} onLogout={handleLogout} />
      </aside>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-50 flex flex-col w-56 h-full bg-white dark:bg-[#111116] border-r border-[#E5DFD5] dark:border-white/[0.08]">
            <TeacherSidebarContent user={user} onNavigate={() => setSidebarOpen(false)} onLogout={handleLogout} />
          </aside>
        </div>
      )}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="flex items-center gap-3 px-4 lg:px-6 py-3 bg-white dark:bg-[#111116] border-b border-[#E5DFD5] dark:border-white/[0.08] shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden btn btn-ghost p-1.5"><Menu size={20} /></button>
          <span className="badge-green text-xs font-mono">Teacher</span>
          <div className="flex-1" />
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Warm Paper Light Mode' : 'Switch to Matte Obsidian Dark Mode'}
            className="btn btn-ghost p-2 rounded-xl"
          >
            {theme === 'dark' ? <Sun size={17} className="text-orange-400" /> : <Moon size={17} />}
          </button>
          <div className="relative">
            <button
              onClick={() => { setNotifOpen((p) => !p); setUserMenuOpen(false); }}
              className="btn btn-ghost p-2 rounded-xl relative"
              title="Teacher Updates"
            >
              <Bell size={17} />
            </button>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-full mt-1.5 w-64 bg-white dark:bg-[#16161D] border border-[#E5DFD5] dark:border-white/[0.08] rounded-xl shadow-xl p-3 z-50 space-y-2">
                  <p className="text-xs font-semibold text-[#141210] dark:text-[#F8FAFC]">Teacher Portal</p>
                  <div className="text-xs text-[#141210] dark:text-[#F8FAFC] bg-[#F7F4EE] dark:bg-white/[0.04] p-2.5 rounded-lg border border-[#E5DFD5] dark:border-white/[0.08]">
                    Review student rosters, average scores, and weak-topic trends from the Students view.
                  </div>
                  <button
                    onClick={() => { navigate('/teacher/students'); setNotifOpen(false); }}
                    className="w-full text-left text-xs text-[#E85D3F] dark:text-orange-400 font-medium hover:underline"
                  >
                    View All Students →
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="relative">
            <button onClick={() => { setUserMenuOpen((p) => !p); setNotifOpen(false); }} className="flex items-center gap-2 btn btn-ghost px-2 py-1.5 rounded-xl">
              <div className="w-7 h-7 rounded-full bg-[#10B981] dark:bg-[#34D399] flex items-center justify-center text-white dark:text-[#0D0D11] text-xs font-bold">{initials}</div>
              <ChevronDown size={14} className="text-[#57534E] dark:text-[#94A3B8]" />
            </button>
            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-[#16161D] border border-[#E5DFD5] dark:border-white/[0.08] rounded-xl shadow-xl py-1 z-50">
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2">
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 scrollbar-thin">
          <Suspense fallback={<RouteContentSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
