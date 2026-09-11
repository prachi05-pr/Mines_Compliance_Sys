import React, { useEffect, useState } from 'react';
import { contractorsApi, minesApi } from '../services/api.js';
import { Contractor, Mine } from '../types/index.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { useAuth } from '../context/AuthContext.js';
import { Users, Search, PlusCircle, Building2, UserCheck, ShieldCheck } from 'lucide-react';

export const ContractorsPage: React.FC = () => {
  const { user } = useAuth();
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [mines, setMines] = useState<Mine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [formMineId, setFormMineId] = useState('');
  const [formName, setFormName] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formCategory, setFormCategory] = useState('Haulage & Transportation');
  const [formWorkforce, setFormWorkforce] = useState('45');
  const [formStatus, setFormStatus] = useState('ACTIVE');
  const [formCompliance, setFormCompliance] = useState('COMPLIANT');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cRes, mRes] = await Promise.all([
        contractorsApi.getAll(),
        minesApi.getAll(),
      ]);
      setContractors(cRes.data);
      setMines(mRes.data);
      if (mRes.data.length > 0 && !formMineId) {
        setFormMineId(mRes.data[0]._id);
      }
    } catch (err) {
      console.error('Failed to load contractors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMineId || !formName || !formCompany) {
      alert('Please fill all required fields');
      return;
    }

    try {
      setSubmitting(true);
      await contractorsApi.create({
        mineId: formMineId,
        name: formName,
        company: formCompany,
        category: formCategory,
        workforceCount: Number(formWorkforce) || 0,
        status: formStatus,
        complianceStatus: formCompliance,
      });
      setShowModal(false);
      setFormName('');
      setFormCompany('');
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create contractor');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = contractors.filter((c) => {
    const mineObj = typeof c.mineId === 'object' ? c.mineId : null;
    const mineName = mineObj ? mineObj.name : '';
    return (
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase()) ||
      mineName.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-amber-400" />
            <span>Colliery Contractor Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registered contracting partners, workforce counts, and safety compliance status
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition shadow-sm"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Register Contractor</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search contractor, company, service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading contractors from MongoDB...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Users className="h-8 w-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No contractors found</p>
            <p className="text-xs text-slate-500">Register new mining service companies to monitor workforce safety.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Contractor / Supervisor</th>
                  <th className="py-3 px-4">Company Entity</th>
                  <th className="py-3 px-4">Assigned Coal Mine</th>
                  <th className="py-3 px-4">Service Category</th>
                  <th className="py-3 px-4">Active Workforce</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Safety Compliance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filtered.map((c) => {
                  const mineObj = typeof c.mineId === 'object' ? c.mineId : null;
                  return (
                    <tr key={c._id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-bold text-white">
                        {c.name}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-200">
                        {c.company}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-300 font-medium">{mineObj?.name}</div>
                        <div className="text-[10px] font-mono text-amber-400/80">{mineObj?.mineCode}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {c.category}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                        {c.workforceCount} Personnel
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={c.status} type="operational" />
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={c.complianceStatus} type="compliance" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-amber-400" />
                <span>Register Mining Contractor Entity</span>
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
                <label className="block text-slate-300 font-medium mb-1">Assigned Coal Mine</label>
                <select
                  value={formMineId}
                  onChange={(e) => setFormMineId(e.target.value)}
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
                <label className="block text-slate-300 font-medium mb-1">Contractor Lead / Representative</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Rajesh Khurana"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Company / Entity Name</label>
                <input
                  type="text"
                  required
                  value={formCompany}
                  onChange={(e) => setFormCompany(e.target.value)}
                  placeholder="e.g. Apex Heavy Earthmovers Pvt Ltd"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Service Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  >
                    <option value="Haulage & Transportation">Haulage & Transportation</option>
                    <option value="Heavy Machinery Maintenance">Heavy Machinery Maintenance</option>
                    <option value="Blasting & Explosives Support">Blasting & Explosives Support</option>
                    <option value="Dust Suppression & Environmental">Dust Suppression & Environmental</option>
                    <option value="General Mine Construction">General Mine Construction</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Workforce Count</label>
                  <input
                    type="number"
                    required
                    value={formWorkforce}
                    onChange={(e) => setFormWorkforce(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Operational Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Safety Compliance</label>
                  <select
                    value={formCompliance}
                    onChange={(e) => setFormCompliance(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  >
                    <option value="COMPLIANT">COMPLIANT</option>
                    <option value="PARTIALLY_COMPLIANT">PARTIALLY COMPLIANT</option>
                    <option value="NON_COMPLIANT">NON COMPLIANT</option>
                  </select>
                </div>
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
                  {submitting ? 'Registering...' : 'Register Contractor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
