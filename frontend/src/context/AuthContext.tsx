import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import API from '../services/api';
import { UserProfile, UserRole } from '../types';

type AuthUser = {
  id: string;
  _id?: string;
  uid?: string;
  name?: string;
  fullName?: string;
  displayName?: string;
  email: string;
  phone?: string;
  phoneNumber?: string;
  role: UserRole;
  whatsappEnabled?: boolean;
  createdAt?: string | number;
};

type LoginInput = {
  email: string;
  password: string;
};

type SignupInput = LoginInput & {
  name: string;
  fullName?: string;
  role?: UserRole;
  phone?: string;
};

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  login: (input: LoginInput) => Promise<UserProfile>;
  signup: (input: SignupInput) => Promise<UserProfile>;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

const TOKEN_KEY = 'barberflow_token';
const AuthContext = createContext<AuthContextType | undefined>(undefined);

const toRole = (role?: string): UserRole => {
  if (role === UserRole.OWNER) return UserRole.OWNER;
  if (role === UserRole.ADMIN) return UserRole.ADMIN;
  return UserRole.CUSTOMER;
};

const toTimestamp = (value?: string | number) => {
  if (typeof value === 'number') return value;
  if (value) {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return Date.now();
};

const mapProfile = (authUser: AuthUser): UserProfile => ({
  uid: authUser.uid || authUser.id || authUser._id || authUser.email,
  phoneNumber: authUser.phoneNumber || authUser.phone || authUser.email,
  displayName: authUser.displayName || authUser.fullName || authUser.name || authUser.email,
  email: authUser.email,
  role: toRole(authUser.role),
  whatsappEnabled: Boolean(authUser.whatsappEnabled),
  createdAt: toTimestamp(authUser.createdAt),
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const applyAuth = (token: string, authUser: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, token);
    const nextUser = { ...authUser, role: toRole(authUser.role) };
    setUser(nextUser);
    setProfile(mapProfile(nextUser));
    return mapProfile(nextUser);
  };

  const clearAuth = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setProfile(null);
  };

  const refreshUser = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      clearAuth();
      setLoading(false);
      return;
    }

    try {
      const res = await API.get('/auth/me');
      const nextUser = res.data.user as AuthUser;
      setUser({ ...nextUser, role: toRole(nextUser.role) });
      setProfile(mapProfile(nextUser));
    } catch {
      clearAuth();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (input: LoginInput) => {
    const res = await API.post('/auth/login', input);
    return applyAuth(res.data.token, res.data.user);
  };

  const signup = async (input: SignupInput) => {
    const res = await API.post('/auth/signup', input);
    return applyAuth(res.data.token, res.data.user);
  };

  const signOut = async () => {
    try {
      await API.post('/auth/logout');
    } catch {
      // Local logout should still work if the server is unavailable.
    } finally {
      clearAuth();
    }
  };

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      isAdmin: profile?.role === UserRole.ADMIN,
      isOwner: profile?.role === UserRole.OWNER,
      login,
      signup,
      refreshUser,
      signOut,
    }),
    [user, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
