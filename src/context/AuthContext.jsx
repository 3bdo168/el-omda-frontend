import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getAuthToken, setAuthToken, getStoredUser, setStoredUser } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser());
  const [token, setToken] = useState(getAuthToken());
  const [isLoading, setIsLoading] = useState(false);

  const extractAuthData = (res) => {
    const token = res?.data?.token || res?.token || null;
    const user = res?.data?.user || res?.user || null;
    return { token, user };
  };

  const saveAuth = (tokenVal, userVal) => {
    setToken(tokenVal);
    setUser(userVal);
    setAuthToken(tokenVal);
    setStoredUser(userVal);
  };

  // Verify stored session on app mount
  useEffect(() => {
    const verifySession = async () => {
      const storedToken = getAuthToken();
      if (!storedToken) return;

      try {
        const res = await api.getMe();
        const verifiedUser = res?.data || res?.user;
        if (verifiedUser) {
          setUser(verifiedUser);
          setStoredUser(verifiedUser);
        }
      } catch (err) {
        if (err.status === 401) {
          logout();
        }
      }
    };

    verifySession();
  }, []);

  const login = async (credential, password) => {
    setIsLoading(true);
    try {
      const res = await api.login(credential, password);
      const { token: authToken, user: authUser } = extractAuthData(res);

      if (!authToken || !authUser) {
        throw new Error(res?.message || 'لم يتم استلام بيانات تسجيل الدخول من الخادم');
      }

      saveAuth(authToken, authUser);
      return authUser;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    setIsLoading(true);
    try {
      const res = await api.register(userData);
      const { token: authToken, user: authUser } = extractAuthData(res);

      if (!authToken || !authUser) {
        throw new Error(res?.message || 'لم يتم استلام بيانات المستخدم بعد التسجيل');
      }

      saveAuth(authToken, authUser);
      return authUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    saveAuth(null, null);
  };

  /**
   * Secure role switcher — calls the protected backend endpoint.
   * Only works when the current user's JWT belongs to an OWNER.
   * The backend verifies the caller's role from the DB before issuing a new token.
   */
  const switchRole = async (targetRole) => {
    setIsLoading(true);
    try {
      const res = await api.switchRole(targetRole);
      const { token: authToken, user: authUser } = extractAuthData(res);

      if (!authToken || !authUser) {
        throw new Error('فشل تبديل الدور — بيانات غير مكتملة من الخادم');
      }

      saveAuth(authToken, authUser);
      return authUser;
    } catch (err) {
      console.error('Role switch failed:', err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        role: user?.role || 'GUEST',
        userType: user?.userType || 'CUSTOMER',
        isTrader: user?.userType === 'TRADER',
        isApprovedTrader: user?.userType === 'TRADER' && user?.approvalStatus === 'APPROVED',
        login,
        register,
        logout,
        switchRole,
      }}
    >
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
