import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { alertsApi, systemApi } from '../services/api.js';
import { UserRole } from '../types/index.js';
import { Bell, LogOut, Shield, RefreshCw, UserCheck, CheckCircle2 } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, loginAsDemo } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      try {
        const alertRes = await alertsApi.getAll({ isRead: false });
        setUnreadCount(alertRes.data.length);
      } catch (err) {
        // silent fallback
      }
    }

    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleSeed = async () => {
    try {
      setIsSeeding(true);
      await systemApi.seedDatabase();
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 3000);
      window.location.reload();
    } catch (err) {
      alert('Failed to re-seed database.');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleRoleSwitch = async (role: UserRole) => {
    await loginAsDemo(role);
    if (role === 'MINE_OFFICER') navigate('/officer/dashboard');
    else navigate('/corporate/dashboard');
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Gov Emblem */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">COAL-GOV AI</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Ministry of Coal • Statutory Surveillance Platform
            </p>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-3">
          {/* Quick Demo Role Switcher */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
            <span className="text-[11px] text-slate-400 px-2 flex items-center gap-1">
              <UserCheck className="h-3 w-3" /> Demo Switch:
            </span>
            <button
              onClick={() => handleRoleSwitch('MINE_OFFICER')}
              className={`text-xs px-2 py-0.5 rounded transition ${
                user?.role === 'MINE_OFFICER'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
              title="Switch to Mine Safety Officer"
            >
              Officer
            </button>
            <button
              onClick={() => handleRoleSwitch('CORPORATE_MANAGER')}
              className={`text-xs px-2 py-0.5 rounded transition ${
                user?.role === 'CORPORATE_MANAGER'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
              title="Switch to Corporate General Manager"
            >
              Corporate
            </button>
          </div>

          {/* Seed Demo Data Button */}
          <button
            onClick={handleSeed}
            disabled={isSeeding}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 transition"
            title="Reset to clean synthetic demo data"
          >
            {seedSuccess ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <RefreshCw className={`h-3.5 w-3.5 ${isSeeding ? 'animate-spin text-amber-400' : ''}`} />
            )}
            <span className="hidden sm:inline">Reset Seed</span>
          </button>

          {/* Alerts Bell */}
          <Link
            to="/alerts"
            className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition"
            title="Statutory Alerts Center"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-red-600 text-[10px] font-bold text-white flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>

          {/* User Profile Pill */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="hidden sm:block text-right">
                <div className="text-xs font-semibold text-white truncate max-w-[140px]">{user.name}</div>
                <div className="text-[10px] font-mono text-amber-400 uppercase tracking-tight">
                  {user.role.replace(/_/g, ' ')}
                </div>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-lg bg-slate-800 hover:bg-red-950/60 hover:text-red-400 border border-slate-700 text-slate-400 transition"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
