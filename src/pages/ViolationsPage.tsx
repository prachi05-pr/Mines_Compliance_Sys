import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { violationsApi, minesApi } from '../services/api.js';
import { Violation, Mine } from '../types/index.js';
import { RiskBadge } from '../components/RiskBadge.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { useAuth } from '../context/AuthContext.js';
import {
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

export const ViolationsPage: React.FC = () => {
  const { user } = useAuth();
  const [violations, setViolations] = useState<Violation[]>([]);
  const [mines, setMines] = useState<Mine[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [mineFilter, setMineFilter] = useState('ALL');

  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [vRes, mRes] = await Promise.all([
        violationsApi.getAll(),
        minesApi.getAll(),
      ]);
      setViolations(vRes.data);
      setMines(mRes.data);
    } catch (err) {
      console.error('Failed to load violations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConfirm = async (id: string) => {
    try {
      setConfirmingId(id);
      await violationsApi.confirm(id);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to confirm violation');
    } finally {
      setConfirmingId(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setConfirmingId(id);
      await violationsApi.reject(id);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reject finding');
    } finally {
      setConfirmingId(null);
    }
  };

  const filteredViolations = violations.filter((v) => {
    const mineObj = typeof v.mineId === 'object' ? v.mineId : null;
    const mineName = mineObj ? mineObj.name : '';
    const matchesSearch =
      v.violationType.toLowerCase().includes(search.toLowerCase()) ||
      v.description.toLowerCase().includes(search.toLowerCase()) ||
      mineName.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || v.category === categoryFilter;
    const matchesSeverity = severityFilter === 'ALL' || v.severity === severityFilter;
    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    const matchesMine =
      mineFilter === 'ALL' || (mineObj ? mineObj._id === mineFilter : v.mineId === mineFilter);

    return matchesSearch && matchesCategory && matchesSeverity && matchesStatus && matchesMine;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-amber-400" />
          <span>Statutory Violations & Infractions</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Full audit trail of AI-identified and human-validated breaches under Coal Mines Regulations
        </p>
      </div>

      {/* Filter Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search breaches, mines, keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Mine Filter */}
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

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 px-3 py-1.5 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Categories</option>
              <option value="SAFETY">Safety</option>
              <option value="ENVIRONMENT">Environment</option>
              <option value="LABOUR">Labour</option>
              <option value="EQUIPMENT">Equipment</option>
              <option value="PRODUCTION">Production</option>
            </select>

            {/* Severity Filter */}
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

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 px-3 py-1.5 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="AI_SUGGESTED">AI Suggested (Unconfirmed)</option>
              <option value="CONFIRMED">Confirmed Violations</option>
              <option value="REJECTED">Rejected Findings</option>
            </select>
          </div>
        </div>
      </div>

      {/* Violations List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading statutory violation records...</div>
        ) : filteredViolations.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <ShieldAlert className="h-8 w-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No violations match the current filter</p>
            <p className="text-xs text-slate-500">All colliery findings conform to statutory thresholds.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Violation Type & Detail</th>
                  <th className="py-3 px-4">Mine Location</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status & Validation</th>
                  <th className="py-3 px-4">Logged Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredViolations.map((v) => {
                  const mineObj = typeof v.mineId === 'object' ? v.mineId : null;
                  const confirmedObj = typeof v.confirmedBy === 'object' ? v.confirmedBy : null;
                  return (
                    <tr key={v._id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="font-bold text-white text-sm font-mono">
                          {v.violationType.replace(/_/g, ' ')}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {v.description}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{mineObj?.name}</div>
                        <div className="text-[10px] font-mono text-amber-400/80">
                          {mineObj?.mineCode} • {mineObj?.state}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-amber-300 uppercase font-medium">{v.category}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <RiskBadge level={v.severity} size="sm" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <StatusBadge status={v.status} type="violation" />
                          {v.status === 'CONFIRMED' && (
                            <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>By {confirmedObj?.name || 'Officer'}</span>
                            </div>
                          )}
                          {v.status === 'REJECTED' && (
                            <div className="text-[10px] text-slate-500 flex items-center gap-1">
                              <XCircle className="h-3 w-3" />
                              <span>Rejected</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {new Date(v.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {v.status === 'AI_SUGGESTED' && user?.role !== 'CORPORATE_MANAGER' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleReject(v._id)}
                              disabled={confirmingId === v._id}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-300 text-[11px] font-medium border border-slate-700 transition"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleConfirm(v._id)}
                              disabled={confirmingId === v._id}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition shadow-sm"
                            >
                              Confirm
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Resolved</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
