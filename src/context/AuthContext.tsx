import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/index.js';
import { authApi } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (data: any) => Promise<User>;
  logout: () => void;
  loginAsDemo: (role: UserRole) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('coal_gov_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('coal_gov_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await authApi.getMe();
        setUser(res.data.user);
      } catch (err) {
        console.warn('Stored token invalid or expired, clearing session.');
        localStorage.removeItem('coal_gov_token');
        localStorage.removeItem('coal_gov_user');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await authApi.login({ email, password });
    const { token: receivedToken, user: receivedUser } = res.data;
    localStorage.setItem('coal_gov_token', receivedToken);
    localStorage.setItem('coal_gov_user', JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const signup = async (data: any): Promise<User> => {
    const res = await authApi.signup(data);
    const { token: receivedToken, user: receivedUser } = res.data;
    localStorage.setItem('coal_gov_token', receivedToken);
    localStorage.setItem('coal_gov_user', JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const logout = () => {
    localStorage.removeItem('coal_gov_token');
    localStorage.removeItem('coal_gov_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const loginAsDemo = async (role: UserRole): Promise<User> => {
    let email = 'officer@demo.com';
    if (role === 'CORPORATE_MANAGER') email = 'manager@demo.com';
    return login(email, 'Demo@123');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, loginAsDemo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
