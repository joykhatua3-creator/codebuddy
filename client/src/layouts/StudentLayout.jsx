import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Bot, LayoutDashboard, Code2, History, Map, Brain, BarChart2, User,
  LogOut, Sun, Moon, Bell, Menu, ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const NAV = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/code-review', label: 'Code Review', icon: Code2 },
  { to: '/dashboard/history', label: 'Review History', icon: History },
  { to: '/dashboard/roadmap', label: 'Learning Roadmap', icon: Map },
  { to: '/dashboard/quiz', label: 'Practice Quizzes', icon: Brain },
  { to: '/dashboard/progress', label: 'My Progress', icon: BarChart2 },
  { to: '/dashboard/profile', label: 'Profile', icon: User },
];

const StudentSidebarContent = ({ user, onNavigate, onLogout }) => (
  <div className="flex flex-col h-full">
    {/* Logo */}
    <div className="flex items-center gap-2.5 px-4 py-5 border-b border-gray-200">
      <div className="p-1.5 bg-primary-600 rounded-lg"><Bot size={18} className="text-white" /></div>
      <div>
        <span className="text-sm font-bold text-gray-900 leading-tight block">Code Review</span>
        <span className="text-xs text-primary-600 font-semibold">Buddy</span>
      </div>
    </div>

    {/* Nav links */}
    <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto scrollbar-thin">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link'}
        >
          <Icon size={16} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>

    {/* Logout */}
    <div className="p-3 border-t border-gray-200">
      <div className="px-3 py-2 mb-2">
        <p className="text-xs font-medium text-gray-900 truncate">{user?.name}</p>
        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
      </div>
      <button onClick={onLogout} className="sidebar-link w-full text-red-600 hover:bg-red-50 hover:text-red-700">
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
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-gray-200 shrink-0">
        <StudentSidebarContent user={user} onNavigate={() => setSidebarOpen(false)} onLogout={handleLogout} />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-50 flex flex-col w-56 h-full bg-white border-r border-gray-200">
            <StudentSidebarContent user={user} onNavigate={() => setSidebarOpen(false)} onLogout={handleLogout} />
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden btn btn-ghost p-1.5">
            <Menu size={20} />
          </button>

          <div className="flex-1" />

          {/* Theme toggle */}
          <button onClick={toggleTheme} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} className="btn btn-ghost p-2 rounded-lg">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setNotifOpen((p) => !p); setUserMenuOpen(false); }}
              className="btn btn-ghost p-2 rounded-lg relative"
              title="Learning Status"
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary-600 rounded-full" />
            </button>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 space-y-2">
                  <p className="text-xs font-semibold text-gray-900">Learning Updates</p>
                  <div className="text-xs text-gray-600 bg-primary-50/70 p-2 rounded-md">
                    🔥 Current Streak: <strong>{user?.streak || 0} days</strong>. Keep submitting code reviews or quizzes!
                  </div>
                  <button
                    onClick={() => { navigate('/dashboard/roadmap'); setNotifOpen(false); }}
                    className="w-full text-left text-xs text-primary-600 font-medium hover:underline"
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
              className="flex items-center gap-2 btn btn-ghost px-2 py-1.5"
            >
              <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">
                {initials}
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[100px] truncate">{user?.name}</span>
              <ChevronDown size={14} className="text-gray-400" />
            </button>
            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                  <button onClick={() => { navigate('/dashboard/profile'); setUserMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <User size={14} /> Profile
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                  <button onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
