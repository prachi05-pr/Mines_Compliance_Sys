import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../services/api.js';
import { RiskBadge } from '../components/RiskBadge.js';
import { StatusBadge } from '../components/StatusBadge.js';
import {
  Building2,
  AlertTriangle,
  Award,
  Bell,
  Layers,
  BarChart3,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const CorporateDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await dashboardApi.getCorporate();
        setData(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || err.message || 'Failed to load corporate metrics');
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
          <p className="text-xs text-slate-400 font-medium">Aggregating multi-mine statutory database...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-950/40 border border-red-800 rounded-xl text-red-200 text-sm">
        <p className="font-semibold">Unable to load Corporate dashboard:</p>
        <p className="text-xs mt-1 text-red-300">{error}</p>
      </div>
    );
  }

  const { kpis, charts, recentAlerts, mines } = data;

  return (
    <div className="space-y-6">
      {/* Enterprise Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-amber-400" />
            <span>Corporate Governance Dashboard</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise portfolio analytics & multi-colliery statutory risk oversight
          </p>
        </div>
        <Link
          to="/mines"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition"
        >
          <Layers className="h-4 w-4 text-amber-400" />
          <span>All Managed Mines ({kpis.totalMines})</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total Mines */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-400 font-medium mb-1">Managed Mines</div>
          <div className="text-2xl font-bold text-white">{kpis.totalMines}</div>
          <div className="text-[11px] text-slate-400 mt-1">Active Collieres</div>
        </div>

        {/* Avg Compliance */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-400 font-medium mb-1">Avg Compliance</div>
          <div className="text-2xl font-bold text-emerald-400">{kpis.avgCompliance}%</div>
          <div className="text-[11px] text-emerald-400/80 mt-1">Corporate Index</div>
        </div>

        {/* High Risk Mines */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-400 font-medium mb-1">High Risk Units</div>
          <div className="text-2xl font-bold text-orange-400">{kpis.highRiskMines}</div>
          <div className="text-[11px] text-orange-400/80 mt-1">Action Priority</div>
        </div>

        {/* Critical Risk Mines */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-400 font-medium mb-1">Critical Units</div>
          <div className="text-2xl font-bold text-red-500">{kpis.criticalRiskMines}</div>
          <div className="text-[11px] text-red-400/80 mt-1">Intervention Mandate</div>
        </div>

        {/* Total Violations */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-400 font-medium mb-1">Total Infractions</div>
          <div className="text-2xl font-bold text-amber-400">{kpis.totalViolations}</div>
          <div className="text-[11px] text-amber-400/80 mt-1">Logged in DB</div>
        </div>

        {/* Audits Conducted */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-400 font-medium mb-1">Total Inspections</div>
          <div className="text-2xl font-bold text-blue-400">{kpis.totalInspections}</div>
          <div className="text-[11px] text-blue-400/80 mt-1">Audits to Date</div>
        </div>
      </div>

      {/* Comparative Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mine Compliance & Target vs Actual Comparison (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Mine-by-Mine Statutory Compliance Score</h2>
              <p className="text-xs text-slate-400">Benchmark comparison across operational blocks</p>
            </div>
            <BarChart3 className="h-4 w-4 text-amber-400" />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.mineComparison} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="mineCode" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', fontSize: '12px' }}
                />
                <Bar dataKey="complianceScore" fill="#10b981" radius={[4, 4, 0, 0]} name="Compliance Score (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Breakdown (1 col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Portfolio Risk Tiers</h2>
              <p className="text-xs text-slate-400">Mine distribution by statutory tier</p>
            </div>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.riskDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  label={({ name, value }) => (value > 0 ? `${name}: ${value}` : '')}
                  labelLine={false}
                >
                  {charts.riskDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Multi-Mine Drilldown Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white">Enterprise Mine Roster & Direct Drilldown</h2>
            <p className="text-xs text-slate-400">Select any colliery to view complete statutory records</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 font-semibold border-b border-slate-700">
              <tr>
                <th className="py-2.5 px-3">Mine Code</th>
                <th className="py-2.5 px-3">Mine Name</th>
                <th className="py-2.5 px-3">Operational Status</th>
                <th className="py-2.5 px-3">Compliance</th>
                <th className="py-2.5 px-3">Risk Level</th>
                <th className="py-2.5 px-3">Production (Act/Tgt)</th>
                <th className="py-2.5 px-3 text-right">Drilldown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {mines.map((m: any) => (
                <tr key={m.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 font-mono font-bold text-amber-400">{m.mineCode}</td>
                  <td className="py-3 px-3 font-medium text-white">{m.name}</td>
                  <td className="py-3 px-3">
                    <StatusBadge status={m.status} type="operational" />
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-emerald-400">{m.complianceScore}%</span>
                  </td>
                  <td className="py-3 px-3">
                    <RiskBadge level={m.riskLevel} size="sm" />
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-400">
                    {m.actual} / {m.target} TPD
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Link
                      to={`/mines/${m.id}`}
                      className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold hover:underline"
                    >
                      <span>Details</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
