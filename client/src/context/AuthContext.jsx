import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Verify token / session on mount
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const { data } = await authService.getMe();
        setUser(data.data);
        localStorage.setItem('user', JSON.stringify(data.data));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, []);

  const persistSession = useCallback((data) => {
    const { token, user: userData } = data.data;
    if (token) localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const login = useCallback(
    async (credentials) => {
      const { data } = await authService.login(credentials);
      return persistSession(data);
    },
    [persistSession]
  );

  const register = useCallback(
    async (formData) => {
      const { data } = await authService.register(formData);
      return persistSession(data);
    },
    [persistSession]
  );

  const demoLogin = useCallback(
    async (role = 'student') => {
      const { data } = await authService.demoLogin(role);
      return persistSession(data);
    },
    [persistSession]
  );

  const completeOAuthLogin = useCallback(async (token) => {
    if (token) localStorage.setItem('token', token);
    const { data } = await authService.getMe();
    const userData = data.data;
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Server logout error:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    }
  }, []);

  const updateUser = useCallback((updatedData) => {
    setUser((prev) => {
      const next = { ...prev, ...updatedData };
      localStorage.setItem('user', JSON.stringify(next));
      return next;
    });
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    demoLogin,
    completeOAuthLogin,
    logout,
    updateUser,
    isStudent: user?.role === 'student',
    isTeacher: user?.role === 'teacher',
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
