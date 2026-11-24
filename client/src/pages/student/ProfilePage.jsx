import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Shield, Calendar, Flame, Lock, Save, Trash2, KeyRound } from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import { authService } from '../../services';
import { useToast } from '../../components/ui/Toast';
import ConfirmModal from '../../components/ui/ConfirmModal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const toast = useToast();

  const [name, setName] = useState(user?.name || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast({ type: 'error', message: 'Name cannot be empty' });
    setUpdatingProfile(true);
    try {
      const res = await authService.updateProfile({ name: name.trim() });
      updateUser(res.data.data);
      toast({ type: 'success', message: 'Profile name updated successfully!' });
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Failed to update profile' });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      return toast({ type: 'error', message: 'New password must be at least 6 characters' });
    }
    if (newPassword !== confirmPassword) {
      return toast({ type: 'error', message: 'Passwords do not match' });
    }
    setUpdatingPassword(true);
    try {
      await authService.updatePassword({ currentPassword, newPassword });
      toast({ type: 'success', message: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Failed to change password' });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await authService.deleteAccount();
      toast({ type: 'success', message: 'Account deleted. Goodbye!' });
      logout();
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Failed to delete account' });
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">My Profile & Account</h2>
        <p className="text-sm text-gray-500 mt-0.5">Manage your personal details, credentials, and settings</p>
      </div>

      {/* Avatar card */}
      <div className="card p-6 flex flex-col sm:flex-row items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-primary-600 flex items-center justify-center text-white text-2xl font-bold shrink-0 shadow-sm">
          {initials}
        </div>
        <div className="text-center sm:text-left flex-1">
          <h3 className="text-xl font-bold text-gray-900">{user?.name}</h3>
          <p className="text-gray-500 text-sm">{user?.email}</p>
          <span className={`badge mt-2 ${user?.role === 'teacher' ? 'bg-green-100 text-green-700' : 'badge-blue'}`}>
            {user?.role === 'teacher' ? '👨‍🏫 Teacher' : '🎓 Student'}
          </span>
        </div>
      </div>

      {/* Account Info Stats */}
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

      {/* Edit Profile Form */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <User size={18} className="text-primary-600" />
          <h4 className="font-semibold text-gray-900">Update Profile Details</h4>
        </div>
        <form onSubmit={handleUpdateName} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input
              type="text"
              className="input mt-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
            />
          </div>
          <div>
            <label className="label">Email Address (Read-only)</label>
            <input
              type="email"
              className="input mt-1 bg-gray-50 text-gray-500 cursor-not-allowed"
              value={user?.email || ''}
              disabled
            />
          </div>
          <button type="submit" disabled={updatingProfile} className="btn btn-primary gap-2">
            {updatingProfile ? <LoadingSpinner size="sm" /> : <Save size={16} />}
            Save Changes
          </button>
        </form>
      </div>

      {/* Change Password Form */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <KeyRound size={18} className="text-primary-600" />
          <h4 className="font-semibold text-gray-900">Change Password</h4>
        </div>
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input
              type="password"
              className="input mt-1"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              required
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">New Password</label>
              <input
                type="password"
                className="input mt-1"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
              />
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input
                type="password"
                className="input mt-1"
                value={confirmPassword}
                onChange={(e) => confirmPassword !== e.target.value && setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
              />
            </div>
          </div>
          <button type="submit" disabled={updatingPassword} className="btn btn-secondary gap-2">
            {updatingPassword ? <LoadingSpinner size="sm" /> : <Lock size={16} />}
            Update Password
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="card p-6 border-red-200 bg-red-50/40 space-y-3">
        <div className="flex items-center gap-2 text-red-700">
          <Trash2 size={18} />
          <h4 className="font-semibold">Danger Zone</h4>
        </div>
        <p className="text-sm text-gray-600">
          Permanently delete your account, saved reviews, learning roadmap, and quiz progress. This action cannot be undone.
        </p>
        <div>
          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            className="btn btn-danger gap-2"
          >
            <Trash2 size={16} />
            Delete Account
          </button>
        </div>
      </div>

      {/* Confirm Delete Account Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        danger
        title="Delete Account?"
        message="Are you sure you want to permanently delete your Code Review Buddy account? All your history, quizzes, and roadmap will be removed."
        confirmLabel={deleting ? 'Deleting...' : 'Yes, Delete Account'}
        onConfirm={handleDeleteAccount}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
}
