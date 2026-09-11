import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../services/api.js';
import { RiskBadge } from '../components/RiskBadge.js';
import { StatusBadge } from '../components/StatusBadge.js';
import {
  ShieldAlert,
  ClipboardList,
  AlertTriangle,
  Award,
  Bell,
  PlusCircle,
  TrendingUp,
  Activity,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';

export const OfficerDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await dashboardApi.getOfficer();
        setData(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-r-transparent" />
          <p className="text-xs text-slate-400 font-medium">Fetching real mine metrics from MongoDB...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-950/40 border border-red-800 rounded-xl text-red-200 text-sm">
        <p className="font-semibold">Unable to load Mine Officer dashboard:</p>
        <p className="text-xs mt-1 text-red-300">{error || 'No mine assignment found for this officer.'}</p>
      </div>
    );
  }

  const { mine, kpis, charts, recentAlerts, recentInspections } = data;

  return (
    <div className="space-y-6">
      {/* Mine Profile Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">{mine?.name || 'Assigned Coal Mine'}</h1>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-400 font-semibold">
              {mine?.mineCode}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
            <span>{mine?.location}, {mine?.district}, {mine?.state}</span>
            <span>•</span>
            <span className="text-slate-300 font-medium">{mine?.mineType} Mine</span>
            <span>•</span>
            <span className="text-emerald-400 font-medium">Status: {mine?.operationalStatus}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/inspections?new=true"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition shadow-sm"
          >
            <PlusCircle className="h-4 w-4" />
            <span>New Statutory Inspection</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Mine Compliance Score */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Compliance Rating</span>
            <Award className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{kpis.complianceScore}%</span>
            <span className="text-[11px] text-emerald-400 font-medium">Statutory</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3">
            <div
              className={`h-1.5 rounded-full ${
                kpis.complianceScore >= 80
                  ? 'bg-emerald-500'
                  : kpis.complianceScore >= 60
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${kpis.complianceScore}%` }}
            />
          </div>
        </div>

        {/* Current Risk Level */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Evaluated Risk</span>
            <ShieldAlert className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-1">
            <RiskBadge level={kpis.riskLevel} size="md" />
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Continuous AI & incident synthesis</p>
        </div>

        {/* Open Violations */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Open Violations</span>
            <AlertTriangle className="h-4 w-4 text-orange-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{kpis.openViolationsCount}</span>
            <span className="text-[11px] text-orange-400 font-medium">Active</span>
          </div>
          <Link to="/violations" className="text-[11px] text-amber-400 hover:underline block mt-2">
            Review findings &rarr;
          </Link>
        </div>

        {/* Pending Inspections */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Pending Review</span>
            <ClipboardList className="h-4 w-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{kpis.pendingInspectionsCount}</span>
            <span className="text-[11px] text-blue-400 font-medium">Audits</span>
          </div>
          <Link to="/inspections" className="text-[11px] text-amber-400 hover:underline block mt-2">
            Complete validations &rarr;
          </Link>
        </div>

        {/* Critical Alerts */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Critical Alerts</span>
            <Bell className="h-4 w-4 text-red-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-red-400">{kpis.criticalAlertsCount}</span>
            <span className="text-[11px] text-red-400 font-medium">Unread</span>
          </div>
          <Link to="/alerts?severity=CRITICAL" className="text-[11px] text-red-400 hover:underline block mt-2">
            Alert center &rarr;
          </Link>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Violations by Category */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Violations by Statutory Category</h2>
              <p className="text-xs text-slate-400">Distribution across Coal Mines Regulations</p>
            </div>
            <span className="text-xs font-mono text-slate-400">MongoDB Aggregated</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.violationsByCategory} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="category" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Violations" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Operational & Risk Score Timeline */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Inspection Risk & Production Trend</h2>
              <p className="text-xs text-slate-400">Chronological history of evaluated risk scores</p>
            </div>
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="riskScore" stroke="#ef4444" strokeWidth={2} name="Risk Score (0-100)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Split: Recent Inspections & Active Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Inspections Table (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white">Recent Pit Inspections</h2>
            </div>
            <Link to="/inspections" className="text-xs text-amber-400 hover:underline">
              View all ({recentInspections.length})
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 font-semibold border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Audit Type</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Risk</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {recentInspections.map((insp: any) => (
                  <tr key={insp._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-mono text-slate-400">
                      {new Date(insp.inspectionDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 font-medium text-white truncate max-w-[200px]">
                      {insp.inspectionType}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={insp.status} type="inspection" />
                    </td>
                    <td className="py-3 px-3">
                      <RiskBadge level={insp.riskLevel} score={insp.riskScore} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to={`/inspections/${insp._id}`}
                        className="text-amber-400 hover:text-amber-300 font-medium hover:underline"
                      >
                        Inspect &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Priority Alerts Feed (1 col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-red-400" />
              <h2 className="text-sm font-bold text-white">Priority Statutory Alerts</h2>
            </div>
            <Link to="/alerts" className="text-xs text-amber-400 hover:underline">
              Alert Center
            </Link>
          </div>

          <div className="space-y-3">
            {recentAlerts.slice(0, 4).map((alert: any) => (
              <div
                key={alert._id}
                className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/80 hover:border-slate-600 transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-white truncate">{alert.title}</span>
                  <RiskBadge level={alert.severity} size="sm" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {alert.message}
                </p>
                <div className="text-[10px] text-slate-400 mt-2 flex items-center justify-between">
                  <span>{new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="font-mono text-amber-400/80">{alert.type.replace(/_/g, ' ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
