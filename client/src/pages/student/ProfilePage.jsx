import { useAuth } from '../../context/AuthContext';
import { User, Mail, Shield, Calendar, Flame, Code2 } from 'lucide-react';
import { formatDate } from '../../utils/helpers';

export default function ProfilePage() {
  const { user } = useAuth();

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">My Profile</h2>
        <p className="text-sm text-gray-500 mt-0.5">Your account information</p>
      </div>

      {/* Avatar card */}
      <div className="card p-6 flex flex-col sm:flex-row items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-primary-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
          {initials}
        </div>
        <div className="text-center sm:text-left">
          <h3 className="text-xl font-bold text-gray-900">{user?.name}</h3>
          <p className="text-gray-500 text-sm">{user?.email}</p>
          <span className={`badge mt-2 ${user?.role === 'teacher' ? 'bg-green-100 text-green-700' : 'badge-blue'}`}>
            {user?.role === 'teacher' ? '👨‍🏫 Teacher' : '🎓 Student'}
          </span>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { icon: User, label: 'Full Name', value: user?.name },
          { icon: Mail, label: 'Email Address', value: user?.email },
          { icon: Shield, label: 'Role', value: user?.role === 'teacher' ? 'Teacher' : 'Student' },
          { icon: Calendar, label: 'Member Since', value: formatDate(user?.createdAt) },
          { icon: Flame, label: 'Learning Streak', value: `${user?.streak || 0} days` },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="card p-4 flex items-start gap-3">
            <div className="p-2 bg-gray-100 rounded-lg shrink-0">
              <Icon size={16} className="text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{label}</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{value || '—'}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-4 bg-blue-50 border border-blue-200">
        <p className="text-sm text-blue-700 font-medium">💡 Profile editing will be available in a future update.</p>
        <p className="text-xs text-blue-600 mt-1">Your learning data and progress are always saved automatically.</p>
      </div>
    </div>
  );
}
