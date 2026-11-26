import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authService } from '../services';
import { queryClient } from '../lib/queryClient';

const AuthContext = createContext(null);

const readCachedUser = () => {
  try {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const isTokenLikelyValid = (token) => {
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return !payload.exp || payload.exp * 1000 > Date.now() + 5000;
  } catch {
    return true;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    if (!token || !isTokenLikelyValid(token)) return null;
    return readCachedUser();
  });
  const [loading, setLoading] = useState(() => {
    const token = localStorage.getItem('token');
    if (!token || !isTokenLikelyValid(token)) return false;
    // Unblock initial render immediately when a valid unexpired cached session exists
    return !readCachedUser();
  });

  // Verify token / refresh user profile silently on mount
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      if (!token || !isTokenLikelyValid(token)) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const { data } = await authService.getMe();
        setUser(data.data);
        localStorage.setItem('user', JSON.stringify(data.data));
      } catch (err) {
        // Clear session on invalid/expired credentials; keep cached user only if network error while offline
        if (err?.response?.status === 401 || err?.response?.status === 403 || !readCachedUser()) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, []);

  const persistSession = useCallback((data) => {
    queryClient.clear();
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
    queryClient.clear();
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
      queryClient.clear();
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

  const value = useMemo(
    () => ({
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
    }),
    [user, loading, login, register, demoLogin, completeOAuthLogin, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
