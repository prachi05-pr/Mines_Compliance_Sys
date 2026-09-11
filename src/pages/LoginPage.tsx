import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { UserRole } from '../types/index.js';
import { Shield, Lock, Mail, User as UserIcon, ArrowRight, CheckCircle, Database } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, signup, loginAsDemo } = useAuth();
  const navigate = useNavigate();

  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('MINE_OFFICER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let loggedInUser;
      if (isSignup) {
        loggedInUser = await signup({ name, email, password, role });
      } else {
        loggedInUser = await login(email, password);
      }

      if (loggedInUser.role === 'MINE_OFFICER') {
        navigate('/officer/dashboard');
      } else {
        navigate('/corporate/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (selectedRole: UserRole) => {
    setLoading(true);
    setError(null);
    try {
      const user = await loginAsDemo(selectedRole);
      if (user.role === 'MINE_OFFICER') navigate('/officer/dashboard');
      else navigate('/corporate/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-14 w-14 rounded-xl bg-amber-500/10 border border-amber-500/30 items-center justify-center text-amber-400 mb-3 shadow-inner">
          <Shield className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Ministry of Coal</h1>
        <p className="text-xs uppercase font-semibold tracking-wider text-amber-400 mt-1">
          SIH 2026 Problem Statement 26024
        </p>
        <h2 className="text-sm font-medium text-slate-400 mt-0.5">
          AI-Enabled Coal Mine Governance & Statutory Compliance
        </h2>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 shadow-xl rounded-xl sm:px-10">
          {/* Quick Demo Logins Section */}
          <div className="mb-6 p-3.5 bg-slate-800/80 rounded-lg border border-slate-700/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                Quick 1-Click Demo Logins
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Real MongoDB Data</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('MINE_OFFICER')}
                disabled={loading}
                className="px-2.5 py-2 text-left rounded bg-slate-900 hover:bg-slate-700/80 border border-slate-700 transition"
              >
                <div className="text-[11px] font-bold text-amber-400">Mine Officer</div>
                <div className="text-[10px] text-slate-400 truncate">officer@demo.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('CORPORATE_MANAGER')}
                disabled={loading}
                className="px-2.5 py-2 text-left rounded bg-slate-900 hover:bg-slate-700/80 border border-slate-700 transition"
              >
                <div className="text-[11px] font-bold text-amber-400">Corporate</div>
                <div className="text-[10px] text-slate-400 truncate">manager@demo.com</div>
              </button>
            </div>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-2 text-slate-500 font-medium">Or enter credentials</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Inspector Ramesh Roy"
                    className="block w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@demo.com"
                  className="block w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {isSignup && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Designated Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="MINE_OFFICER">Mine Officer (Assigned Mine)</option>
                  <option value="CORPORATE_MANAGER">Corporate Manager (Multi-Mine Enterprise)</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition shadow-md disabled:opacity-50 mt-2"
            >
              <span>{loading ? 'Authenticating...' : isSignup ? 'Create Account' : 'Sign In'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsSignup(!isSignup)}
              className="text-xs text-amber-400 hover:underline"
            >
              {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>

        {/* Database Assurance Footer */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Database className="h-3.5 w-3.5 text-emerald-400" />
          <span>Backed by live MongoDB Atlas & Mongoose Schemas</span>
        </div>
      </div>
    </div>
  );
};
