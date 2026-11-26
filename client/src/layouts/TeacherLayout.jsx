import { useState, Suspense } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Bot, LayoutDashboard, Users, LogOut, Sun, Moon, Bell, Menu, ChevronDown, ClipboardList } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { RouteContentSkeleton } from '../components/ui/Skeleton';

const NAV = [
  { to: '/teacher', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/teacher/students', label: 'Students', icon: Users },
  { to: '/teacher/assignments', label: 'Assignments', icon: ClipboardList },
];

const TeacherSidebarContent = ({ user, onNavigate, onLogout }) => (
  <div className="flex flex-col h-full">
    <div className="flex items-center gap-2.5 px-4 py-5 border-b border-gray-200">
      <div className="p-1.5 bg-primary-600 rounded-lg"><Bot size={18} className="text-white" /></div>
      <div>
        <span className="text-sm font-bold text-gray-900 block">Code Review</span>
        <span className="text-xs text-green-600 font-semibold">Teacher Portal</span>
      </div>
    </div>
    <nav className="flex-1 p-3 space-y-0.5">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} onClick={onNavigate}
          className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link'}>
          <Icon size={16} /><span>{label}</span>
        </NavLink>
      ))}
    </nav>
    <div className="p-3 border-t border-gray-200">
      <div className="px-3 py-2 mb-2">
        <p className="text-xs font-medium text-gray-900 truncate">{user?.name}</p>
        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
      </div>
      <button onClick={onLogout} className="sidebar-link w-full text-red-600 hover:bg-red-50 hover:text-red-700">
        <LogOut size={16} /><span>Logout</span>
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
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-gray-200 shrink-0">
        <TeacherSidebarContent user={user} onNavigate={() => setSidebarOpen(false)} onLogout={handleLogout} />
      </aside>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-50 flex flex-col w-56 h-full bg-white border-r border-gray-200">
            <TeacherSidebarContent user={user} onNavigate={() => setSidebarOpen(false)} onLogout={handleLogout} />
          </aside>
        </div>
      )}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden btn btn-ghost p-1.5"><Menu size={20} /></button>
          <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full">Teacher</span>
          <div className="flex-1" />
          <button onClick={toggleTheme} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} className="btn btn-ghost p-2 rounded-lg">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="relative">
            <button
              onClick={() => { setNotifOpen((p) => !p); setUserMenuOpen(false); }}
              className="btn btn-ghost p-2 rounded-lg relative"
              title="Teacher Updates"
            >
              <Bell size={18} />
            </button>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg p-3 z-50 space-y-2">
                  <p className="text-xs font-semibold text-gray-900 dark:text-slate-100">Teacher Portal</p>
                  <div className="text-xs text-gray-700 bg-primary-50/70 dark:bg-slate-800 dark:text-slate-100 p-2.5 rounded-md border border-primary-100 dark:border-slate-700">
                    Review student rosters, average scores, and weak-topic trends from the Students view.
                  </div>
                  <button
                    onClick={() => { navigate('/teacher/students'); setNotifOpen(false); }}
                    className="w-full text-left text-xs text-primary-600 dark:text-primary-400 font-medium hover:underline"
                  >
                    View All Students →
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="relative">
            <button onClick={() => { setUserMenuOpen((p) => !p); setNotifOpen(false); }} className="flex items-center gap-2 btn btn-ghost px-2 py-1.5">
              <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">{initials}</div>
              <ChevronDown size={14} className="text-gray-400" />
            </button>
            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg py-1 z-50">
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2">
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
