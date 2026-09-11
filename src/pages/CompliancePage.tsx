import React, { useEffect, useState } from 'react';
import { complianceApi, minesApi } from '../services/api.js';
import { Compliance, Mine } from '../types/index.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { useAuth } from '../context/AuthContext.js';
import {
  FileCheck,
  Search,
  Filter,
  AlertCircle,
  Clock,
  CheckCircle2,
  PlusCircle,
  Calendar,
} from 'lucide-react';

export const CompliancePage: React.FC = () => {
  const { user } = useAuth();
  const [compliances, setCompliances] = useState<Compliance[]>([]);
  const [mines, setMines] = useState<Mine[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [mineFilter, setMineFilter] = useState('ALL');

  // New Compliance Modal
  const [showModal, setShowModal] = useState(false);
  const [newMineId, setNewMineId] = useState('');
  const [newCategory, setNewCategory] = useState('SAFETY');
  const [newRequirement, setNewRequirement] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cRes, mRes] = await Promise.all([
        complianceApi.getAll(),
        minesApi.getAll(),
      ]);
      setCompliances(cRes.data);
      setMines(mRes.data);
      if (mRes.data.length > 0 && !newMineId) {
        setNewMineId(mRes.data[0]._id);
      }
    } catch (err) {
      console.error('Failed to load compliance records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMineId || !newRequirement || !newDueDate) {
      alert('Please fill all required fields');
      return;
    }

    try {
      setSubmitting(true);
      await complianceApi.create({
        mineId: newMineId,
        category: newCategory,
        requirement: newRequirement,
        dueDate: newDueDate,
        notes: newNotes,
        status: 'COMPLIANT',
      });
      setShowModal(false);
      setNewRequirement('');
      setNewNotes('');
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create statutory requirement');
    } finally {
      setSubmitting(false);
    }
  };

  const now = new Date().getTime();

  const filtered = compliances.filter((c) => {
    const mineObj = typeof c.mineId === 'object' ? c.mineId : null;
    const mineName = mineObj ? mineObj.name : '';
    const matchesSearch =
      c.requirement.toLowerCase().includes(search.toLowerCase()) ||
      mineName.toLowerCase().includes(search.toLowerCase()) ||
      c.notes?.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || c.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesMine =
      mineFilter === 'ALL' || (mineObj ? mineObj._id === mineFilter : c.mineId === mineFilter);

    return matchesSearch && matchesCategory && matchesStatus && matchesMine;
  });

  const overdueList = compliances.filter(
    (c) => new Date(c.dueDate).getTime() < now && c.status !== 'COMPLIANT'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileCheck className="h-6 w-6 text-amber-400" />
            <span>Statutory Compliance Tracker</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tracking DGMS, CMR 2017, and Environmental Clearance statutory requirements
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition shadow-sm"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Add Statutory Requirement</span>
        </button>
      </div>

      {/* Overdue Alert Banner if any */}
      {overdueList.length > 0 && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/80 flex items-center justify-between gap-3 text-red-200 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
            <div>
              <span className="font-bold">{overdueList.length} Statutory Requirements Overdue</span>
              <p className="text-red-300 text-[11px]">
                Immediate attention required to prevent statutory penalties and compliance score degradation.
              </p>
            </div>
          </div>
          <button
            onClick={() => setStatusFilter('OVERDUE')}
            className="px-3 py-1.5 rounded bg-red-900/60 hover:bg-red-800 text-white font-semibold text-xs border border-red-700 shrink-0"
          >
            View Overdue
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search requirements, notes, mines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
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

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 px-3 py-1.5 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLIANT">Compliant</option>
            <option value="PARTIALLY_COMPLIANT">Partially Compliant</option>
            <option value="NON_COMPLIANT">Non Compliant</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
      </div>

      {/* Compliance Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading statutory compliance records...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <CheckCircle2 className="h-8 w-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No records match filter</p>
            <p className="text-xs text-slate-500">All registered requirements conform to search parameters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Statutory Requirement</th>
                  <th className="py-3 px-4">Colliery</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Compliance Status</th>
                  <th className="py-3 px-4">Statutory Due Date</th>
                  <th className="py-3 px-4">Notes & Observations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filtered.map((c) => {
                  const mineObj = typeof c.mineId === 'object' ? c.mineId : null;
                  const isPast = new Date(c.dueDate).getTime() < now && c.status !== 'COMPLIANT';
                  return (
                    <tr key={c._id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-semibold text-white max-w-sm">
                        {c.requirement}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-200">{mineObj?.name}</div>
                        <div className="text-[10px] font-mono text-amber-400/80">{mineObj?.mineCode}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-amber-300 uppercase font-medium">{c.category}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={c.status} type="compliance" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className={`font-mono text-xs flex items-center gap-1.5 ${isPast ? 'text-red-400 font-bold' : 'text-slate-300'}`}>
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(c.dueDate).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px] max-w-xs truncate">
                        {c.notes || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Compliance Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-amber-400" />
                <span>Add Statutory Compliance Mandate</span>
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Target Coal Mine</label>
                <select
                  value={newMineId}
                  onChange={(e) => setNewMineId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                >
                  {mines.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.mineCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Statutory Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                >
                  <option value="SAFETY">Safety (DGMS / CMR 2017)</option>
                  <option value="ENVIRONMENT">Environment (Pollution Control Board)</option>
                  <option value="LABOUR">Labour (Workforce welfare & shifts)</option>
                  <option value="EQUIPMENT">Equipment (Heavy machinery & haulage)</option>
                  <option value="PRODUCTION">Production (Statutory quotas)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Mandate / Requirement Text</label>
                <textarea
                  rows={2}
                  required
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  placeholder="e.g. Quarterly slope stability audit by Central Institute of Mining and Fuel Research (CIMFR)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Statutory Due Date</label>
                <input
                  type="date"
                  required
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Compliance Notes</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Optional reference, circular, or DGMS Gazette number"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  {submitting ? 'Saving...' : 'Register Requirement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
