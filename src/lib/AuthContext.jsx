import React, { createContext, useState, useContext, useEffect } from 'react';
import client, { setToken, clearToken, getToken } from '@/api/client';
import db, { clearAllOfflineData } from '@/lib/offline/db';
import { releaseDeviceLock } from '@/lib/offline/deviceLock';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    checkUserAuth();
  }, []);

  const checkUserAuth = async () => {
    const token = getToken();
    if (!token) {
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      return;
    }

    try {
      setIsLoadingAuth(true);
      const currentUser = await client.get('/auth/me');
      setUser(currentUser);
      setIsAuthenticated(true);

      // Update cached user
      try {
        await db.users.put(currentUser);
        localStorage.setItem('mpis_offline_user', JSON.stringify(currentUser));
      } catch { /* ignore */ }
    } catch (error) {
      // OFFLINE FALLBACK: if network error, use cached user
      if (error.message === 'Failed to fetch' || !navigator.onLine) {
        const cachedUser = localStorage.getItem('mpis_offline_user');
        if (cachedUser) {
          const parsed = JSON.parse(cachedUser);
          setUser(parsed);
          setIsAuthenticated(true);
          console.log('[Auth] Using cached user for offline mode');
          setIsLoadingAuth(false);
          return;
        }
      }

      console.error('User auth check failed:', error);
      setIsAuthenticated(false);
      clearToken();
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const login = async (email, password) => {
    const result = await client.post('/auth/login', { email, password });
    setToken(result.token);
    setUser(result.user);
    setIsAuthenticated(true);

    // Cache user data for offline auth
    try {
      await db.users.put(result.user);
      localStorage.setItem('mpis_offline_user', JSON.stringify(result.user));
    } catch { /* ignore */ }

    return result;
  };

  const logout = async () => {
    try {
      await releaseDeviceLock();
    } catch { /* ignore */ }

    try {
      await clearAllOfflineData();
    } catch { /* ignore */ }

    localStorage.removeItem('mpis_offline_user');
    setUser(null);
    setIsAuthenticated(false);
    clearToken();
    window.location.href = '/login';
  };

  const updateMe = async (data) => {
    const updatedUser = await client.put('/auth/me', data);
    setUser(updatedUser);
    return updatedUser;
  };

  const changePassword = async (currentPassword, newPassword) => {
    return client.put('/auth/change-password', { currentPassword, newPassword });
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      login,
      logout,
      updateMe,
      changePassword,
      checkUserAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
