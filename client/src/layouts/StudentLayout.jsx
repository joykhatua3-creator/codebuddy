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
  <div className="flex flex-col h-full bg-white dark:bg-[#111116]">
    {/* Logo */}
    <div className="flex items-center gap-2.5 px-4 py-5 border-b border-[#E5DFD5] dark:border-white/[0.08]">
      <Link to="/" className="flex items-center gap-2.5 group">
        <span className="font-mono text-xs font-bold px-2 py-1.5 rounded-lg bg-[#E85D3F]/10 text-[#E85D3F] dark:bg-orange-500/15 dark:text-orange-400 border border-[#E85D3F]/20 dark:border-orange-500/25">
          &lt;/&gt;
        </span>
        <div>
          <span className="text-sm font-bold text-[#141210] dark:text-[#F8FAFC] leading-tight block">
            CodeBuddy
          </span>
          <span className="text-[11px] font-mono text-[#E85D3F] dark:text-orange-400 font-medium">
            Study Studio
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
    <div className="p-3 border-t border-[#E5DFD5] dark:border-white/[0.08]">
      <div className="px-3 py-2 mb-1.5 rounded-xl bg-[#F7F4EE] dark:bg-white/[0.03] border border-[#E5DFD5] dark:border-white/[0.06]">
        <p className="text-xs font-semibold text-[#141210] dark:text-[#F8FAFC] truncate">{user?.name}</p>
        <p className="text-[11px] text-[#57534E] dark:text-[#94A3B8] truncate">{user?.email}</p>
      </div>
      <button
        onClick={onLogout}
        className="sidebar-link w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 dark:hover:text-red-300"
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
    <div className="flex h-screen bg-[#F7F4EE] dark:bg-[#0D0D11] overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-white dark:bg-[#111116] border-r border-[#E5DFD5] dark:border-white/[0.08] shrink-0">
        <StudentSidebarContent user={user} onNavigate={() => setSidebarOpen(false)} onLogout={handleLogout} />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-50 flex flex-col w-56 h-full bg-white dark:bg-[#111116] border-r border-[#E5DFD5] dark:border-white/[0.08]">
            <StudentSidebarContent user={user} onNavigate={() => setSidebarOpen(false)} onLogout={handleLogout} />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="flex items-center gap-3 px-4 lg:px-6 py-3 bg-white dark:bg-[#111116] border-b border-[#E5DFD5] dark:border-white/[0.08] shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden btn btn-ghost p-1.5">
            <Menu size={20} />
          </button>

          <div className="flex-1" />

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Warm Paper Light Mode' : 'Switch to Matte Obsidian Dark Mode'}
            className="btn btn-ghost p-2 rounded-xl text-xs gap-1.5"
          >
            {theme === 'dark' ? <Sun size={17} className="text-orange-400" /> : <Moon size={17} />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setNotifOpen((p) => !p); setUserMenuOpen(false); }}
              className="btn btn-ghost p-2 rounded-xl relative"
              title="Learning Status"
            >
              <Bell size={17} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#E85D3F] dark:bg-[#F97316] rounded-full" />
            </button>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-full mt-1.5 w-64 bg-white dark:bg-[#16161D] border border-[#E5DFD5] dark:border-white/[0.08] rounded-xl shadow-xl p-3 z-50 space-y-2">
                  <p className="text-xs font-semibold text-[#141210] dark:text-[#F8FAFC]">Learning Updates</p>
                  <div className="text-xs text-[#141210] dark:text-[#F8FAFC] bg-[#F7F4EE] dark:bg-white/[0.04] p-2.5 rounded-lg border border-[#E5DFD5] dark:border-white/[0.08]">
                    🔥 Current Streak: <strong>{user?.streak || 0} days</strong>. Keep submitting code reviews or quizzes!
                  </div>
                  <button
                    onClick={() => { navigate('/dashboard/roadmap'); setNotifOpen(false); }}
                    className="w-full text-left text-xs text-[#E85D3F] dark:text-orange-400 font-medium hover:underline"
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
              className="flex items-center gap-2 btn btn-ghost px-2 py-1.5 rounded-xl"
            >
              <div className="w-7 h-7 rounded-full bg-[#E85D3F] dark:bg-[#F97316] flex items-center justify-center text-white dark:text-[#0D0D11] text-xs font-bold">
                {initials}
              </div>
              <span className="hidden sm:block text-sm font-medium text-[#141210] dark:text-[#F8FAFC] max-w-[100px] truncate">
                {user?.name}
              </span>
              <ChevronDown size={14} className="text-[#57534E] dark:text-[#94A3B8]" />
            </button>
            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-[#16161D] border border-[#E5DFD5] dark:border-white/[0.08] rounded-xl shadow-xl py-1 z-50">
                  <button
                    onClick={() => { navigate('/dashboard/profile'); setUserMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-[#141210] dark:text-[#F8FAFC] hover:bg-[#F7F4EE] dark:hover:bg-white/[0.04] flex items-center gap-2"
                  >
                    <User size={14} /> Profile
                  </button>
                  <div className="border-t border-[#E5DFD5] dark:border-white/[0.08] my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2"
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 scrollbar-thin">
          <Suspense fallback={<RouteContentSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
