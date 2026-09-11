import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import {
  LayoutDashboard,
  Layers,
  ClipboardCheck,
  AlertTriangle,
  FileCheck,
  Users,
  Bell,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role;

  const getDashboardPath = () => {
    if (role === 'MINE_OFFICER') return '/officer/dashboard';
    return '/corporate/dashboard';
  };

  const navItems = [
    {
      name: 'Dashboard',
      path: getDashboardPath(),
      icon: LayoutDashboard,
      roles: ['MINE_OFFICER', 'CORPORATE_MANAGER'],
    },
    {
      name: 'Coal Mines',
      path: '/mines',
      icon: Layers,
      roles: ['MINE_OFFICER', 'CORPORATE_MANAGER'],
    },
    {
      name: 'Inspections',
      path: '/inspections',
      icon: ClipboardCheck,
      roles: ['MINE_OFFICER', 'CORPORATE_MANAGER'],
    },
    {
      name: 'Violations',
      path: '/violations',
      icon: AlertTriangle,
      roles: ['MINE_OFFICER', 'CORPORATE_MANAGER'],
    },
    {
      name: 'Compliance',
      path: '/compliance',
      icon: FileCheck,
      roles: ['MINE_OFFICER', 'CORPORATE_MANAGER'],
    },
    {
      name: 'Contractors',
      path: '/contractors',
      icon: Users,
      roles: ['MINE_OFFICER', 'CORPORATE_MANAGER'],
    },
    {
      name: 'Alert Center',
      path: '/alerts',
      icon: Bell,
      roles: ['MINE_OFFICER', 'CORPORATE_MANAGER'],
    },
  ];

  const visibleItems = navItems.filter((item) => role && item.roles.includes(role));

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        {/* Role Scope Notice */}
        <div className="px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-800">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Statutory Role</div>
          <div className="text-xs font-semibold text-amber-400 mt-0.5">
            {role === 'MINE_OFFICER' ? 'Mine Safety Officer' : 'Corporate Manager'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {role === 'MINE_OFFICER' ? 'Assigned Pit Surveillance' : 'Enterprise Portfolio Oversight'}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
