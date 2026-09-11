import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { minesApi } from '../services/api.js';
import { RiskBadge } from '../components/RiskBadge.js';
import { StatusBadge } from '../components/StatusBadge.js';
import {
  Layers,
  ArrowLeft,
  FileCheck,
  ClipboardCheck,
  AlertTriangle,
  Users,
  Bell,
  MapPin,
  Activity,
  Award,
  ShieldAlert,
} from 'lucide-react';

export const MineDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [mineData, setMineData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'compliance' | 'inspections' | 'violations' | 'contractors' | 'alerts'>('compliance');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMine() {
      if (!id) return;
      try {
        setLoading(true);
        const res = await minesApi.getById(id);
        setMineData(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || err.message || 'Failed to load mine dossier');
      } finally {
        setLoading(false);
      }
    }
    loadMine();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-r-transparent" />
          <p className="text-xs text-slate-400 font-medium">Aggregating colliery dossier from MongoDB collections...</p>
        </div>
      </div>
    );
  }

  if (error || !mineData) {
    return (
      <div className="p-6 bg-red-950/40 border border-red-800 rounded-xl text-red-200 space-y-3">
        <p className="font-semibold">Colliery Record Unavailable:</p>
        <p className="text-xs text-red-300">{error || 'Not found'}</p>
        <Link to="/mines" className="text-xs text-amber-400 hover:underline">
          &larr; Back to Coal Mines
        </Link>
      </div>
    );
  }

  const { mine, compliances, inspections, violations, contractors, alerts } = mineData;

  return (
    <div className="space-y-6">
      {/* Top Nav */}
      <div>
        <Link
          to="/mines"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Coal Mines</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-400 font-bold">
                {mine.mineCode}
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">{mine.name}</h1>
              <StatusBadge status={mine.operationalStatus} type="operational" />
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-slate-500" />
              <span>{mine.location}, {mine.district}, {mine.state}</span>
              <span>•</span>
              <span className="text-slate-300">{mine.mineType} Extraction Method</span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-medium uppercase">Colliery Risk</div>
              <div className="mt-0.5">
                <RiskBadge level={mine.riskLevel} size="md" />
              </div>
            </div>
            <div className="text-right border-l border-slate-800 pl-4">
              <div className="text-[10px] text-slate-400 font-medium uppercase">Compliance Score</div>
              <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5">
                {mine.complianceScore}%
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
            <span className="text-slate-400 block text-[10px] uppercase">Production Target</span>
            <span className="text-sm font-bold text-white font-mono">{mine.productionTarget} TPD</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
            <span className="text-slate-400 block text-[10px] uppercase">Actual Production</span>
            <span className="text-sm font-bold text-white font-mono">{mine.productionActual} TPD</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
            <span className="text-slate-400 block text-[10px] uppercase">Active Contractors</span>
            <span className="text-sm font-bold text-white font-mono">{contractors.length} Companies</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
            <span className="text-slate-400 block text-[10px] uppercase">Audits Conducted</span>
            <span className="text-sm font-bold text-white font-mono">{inspections.length} Inspections</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-800 flex items-center gap-1 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('compliance')}
          className={`flex items-center gap-2 px-4 py-2.5 font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'compliance'
              ? 'border-amber-400 text-amber-400 bg-amber-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCheck className="h-4 w-4" />
          <span>Statutory Compliance ({compliances.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('inspections')}
          className={`flex items-center gap-2 px-4 py-2.5 font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'inspections'
              ? 'border-amber-400 text-amber-400 bg-amber-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ClipboardCheck className="h-4 w-4" />
          <span>Field Inspections ({inspections.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('violations')}
          className={`flex items-center gap-2 px-4 py-2.5 font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'violations'
              ? 'border-amber-400 text-amber-400 bg-amber-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          <span>Violations ({violations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('contractors')}
          className={`flex items-center gap-2 px-4 py-2.5 font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'contractors'
              ? 'border-amber-400 text-amber-400 bg-amber-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Contractors ({contractors.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex items-center gap-2 px-4 py-2.5 font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'alerts'
              ? 'border-amber-400 text-amber-400 bg-amber-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bell className="h-4 w-4" />
          <span>Statutory Alerts ({alerts.length})</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        {/* COMPLIANCE TAB */}
        {activeTab === 'compliance' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white">Statutory Regulations Compliance List</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Statutory Requirement</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {compliances.map((c: any) => (
                    <tr key={c._id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-medium text-white max-w-sm">{c.requirement}</td>
                      <td className="py-3 px-3 font-mono text-amber-300">{c.category}</td>
                      <td className="py-3 px-3">
                        <StatusBadge status={c.status} type="compliance" />
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">
                        {new Date(c.dueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px]">{c.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* INSPECTIONS TAB */}
        {activeTab === 'inspections' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white">Field Inspection History</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Audit Date</th>
                    <th className="py-2.5 px-3">Audit Type</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Evaluated Risk</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {inspections.map((insp: any) => (
                    <tr key={insp._id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-mono text-slate-400">
                        {new Date(insp.inspectionDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 font-medium text-white">{insp.inspectionType}</td>
                      <td className="py-3 px-3">
                        <StatusBadge status={insp.status} type="inspection" />
                      </td>
                      <td className="py-3 px-3">
                        <RiskBadge level={insp.riskLevel} score={insp.riskScore} size="sm" />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          to={`/inspections/${insp._id}`}
                          className="text-amber-400 hover:underline font-semibold"
                        >
                          View &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIOLATIONS TAB */}
        {activeTab === 'violations' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white">Logged Statutory Violations</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Violation Type</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Severity</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Logged Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {violations.map((v: any) => (
                    <tr key={v._id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-bold font-mono text-white">
                        {v.violationType.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 px-3 font-mono text-amber-300">{v.category}</td>
                      <td className="py-3 px-3">
                        <RiskBadge level={v.severity} size="sm" />
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={v.status} type="violation" />
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">
                        {new Date(v.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CONTRACTORS TAB */}
        {activeTab === 'contractors' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white">Engaged Mining Contractors</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Contractor / Lead</th>
                    <th className="py-2.5 px-3">Company</th>
                    <th className="py-2.5 px-3">Service Category</th>
                    <th className="py-2.5 px-3">Workforce</th>
                    <th className="py-2.5 px-3">Compliance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {contractors.map((c: any) => (
                    <tr key={c._id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-semibold text-white">{c.name}</td>
                      <td className="py-3 px-3 text-slate-300">{c.company}</td>
                      <td className="py-3 px-3 text-slate-400">{c.category}</td>
                      <td className="py-3 px-3 font-mono text-amber-400">{c.workforceCount} Personnel</td>
                      <td className="py-3 px-3">
                        <StatusBadge status={c.complianceStatus} type="compliance" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ALERTS TAB */}
        {activeTab === 'alerts' && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-white">Statutory Surveillance Alerts</h2>
            {alerts.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No alerts on record for this mine.</p>
            ) : (
              alerts.map((a: any) => (
                <div key={a._id} className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">{a.title}</span>
                      <RiskBadge level={a.severity} size="sm" />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{a.message}</p>
                    <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                      {new Date(a.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{a.type}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
