import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { alertsApi, minesApi } from '../services/api.js';
import { Alert, Mine } from '../types/index.js';
import { RiskBadge } from '../components/RiskBadge.js';
import { Bell, Search, CheckCheck, Check, Filter, AlertTriangle, AlertCircle } from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [mines, setMines] = useState<Mine[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [severityFilter, setSeverityFilter] = useState(searchParams.get('severity') || 'ALL');
  const [readFilter, setReadFilter] = useState('ALL');
  const [mineFilter, setMineFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [aRes, mRes] = await Promise.all([
        alertsApi.getAll(),
        minesApi.getAll(),
      ]);
      setAlerts(aRes.data);
      setMines(mRes.data);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await alertsApi.markAsRead(id);
      setAlerts((prev) =>
        prev.map((a) => (a._id === id ? { ...a, isRead: true } : a))
      );
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await alertsApi.markAllAsRead();
      setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all alerts as read:', err);
    }
  };

  const filtered = alerts.filter((a) => {
    const mineObj = typeof a.mineId === 'object' ? a.mineId : null;
    const mineName = mineObj ? mineObj.name : '';

    const matchesSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.message.toLowerCase().includes(search.toLowerCase()) ||
      mineName.toLowerCase().includes(search.toLowerCase()) ||
      a.type.toLowerCase().includes(search.toLowerCase());

    const matchesSeverity = severityFilter === 'ALL' || a.severity === severityFilter;
    const matchesRead =
      readFilter === 'ALL' || (readFilter === 'UNREAD' ? !a.isRead : a.isRead);
    const matchesMine =
      mineFilter === 'ALL' || (mineObj ? mineObj._id === mineFilter : a.mineId === mineFilter);

    return matchesSearch && matchesSeverity && matchesRead && matchesMine;
  });

  const unreadTotal = alerts.filter((a) => !a.isRead).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="h-6 w-6 text-amber-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">
              Statutory Surveillance Alert Center
            </h1>
            {unreadTotal > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-600/90 text-white font-mono text-xs font-bold">
                {unreadTotal} Unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time notifications for critical risk escalations, recurring violations, and anomalies
          </p>
        </div>

        {unreadTotal > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            <CheckCheck className="h-4 w-4 text-emerald-400" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search alert title, keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={mineFilter}
            onChange={(e) => setMineFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 px-3 py-1.5 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Coal Mines</option>
            {mines.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name} ({m.mineCode})
              </option>
            ))}
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 px-3 py-1.5 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={readFilter}
            onChange={(e) => setReadFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 px-3 py-1.5 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Status</option>
            <option value="UNREAD">Unread Only</option>
            <option value="READ">Read Only</option>
          </select>
        </div>
      </div>

      {/* Alerts Stream */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-xl">
            Loading alerts...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2 bg-slate-900 border border-slate-800 rounded-xl">
            <Bell className="h-8 w-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No alerts found</p>
            <p className="text-xs text-slate-500">No alerts match your current filter settings.</p>
          </div>
        ) : (
          filtered.map((alert) => {
            const mineObj = typeof alert.mineId === 'object' ? alert.mineId : null;
            return (
              <div
                key={alert._id}
                className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  !alert.isRead
                    ? 'bg-slate-900/90 border-slate-700 shadow-md ring-1 ring-amber-500/20'
                    : 'bg-slate-950/60 border-slate-800/80 opacity-80'
                }`}
              >
                <div className="space-y-1 max-w-3xl">
                  <div className="flex items-center gap-2">
                    {!alert.isRead && (
                      <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0 animate-ping" />
                    )}
                    <h2 className="text-sm font-bold text-white">{alert.title}</h2>
                    <RiskBadge level={alert.severity} size="sm" />
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 uppercase">
                      {alert.type.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{alert.message}</p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                    <span className="font-semibold text-amber-400">
                      {mineObj?.name || 'All Colleries'} {mineObj?.mineCode ? `(${mineObj.mineCode})` : ''}
                    </span>
                    <span>•</span>
                    <span>{new Date(alert.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center justify-end">
                  {!alert.isRead ? (
                    <button
                      onClick={() => handleMarkAsRead(alert._id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-amber-400 transition"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Mark Read</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-500 font-mono">Acknowledged</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
