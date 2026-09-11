import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { minesApi } from '../services/api.js';
import { Mine } from '../types/index.js';
import { RiskBadge } from '../components/RiskBadge.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { Layers, Search, Filter, ArrowRight, MapPin, Gauge } from 'lucide-react';

export const MinesPage: React.FC = () => {
  const [mines, setMines] = useState<Mine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');

  useEffect(() => {
    async function loadMines() {
      try {
        setLoading(true);
        const res = await minesApi.getAll();
        setMines(res.data);
      } catch (err) {
        console.error('Failed to load mines:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMines();
  }, []);

  const filteredMines = mines.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.mineCode.toLowerCase().includes(search.toLowerCase()) ||
      m.state.toLowerCase().includes(search.toLowerCase()) ||
      m.district.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || m.operationalStatus === statusFilter;
    const matchesRisk = riskFilter === 'ALL' || m.riskLevel === riskFilter;
    return matchesSearch && matchesStatus && matchesRisk;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Layers className="h-6 w-6 text-amber-400" />
          <span>National Coal Colliery Registry</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Registered statutory mine blocks, compliance indexing, and operational states
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search mine name, code, state..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 px-3 py-1.5 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Operational Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 px-3 py-1.5 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Risk Tiers</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="CRITICAL">Critical Risk</option>
          </select>
        </div>
      </div>

      {/* Mines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full p-12 text-center text-xs text-slate-400">
            Loading colliery blocks from MongoDB...
          </div>
        ) : filteredMines.length === 0 ? (
          <div className="col-span-full p-12 text-center text-xs text-slate-400">
            No coal mines matching search criteria.
          </div>
        ) : (
          filteredMines.map((mine) => (
            <div
              key={mine._id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-bold border border-slate-700">
                      {mine.mineCode}
                    </span>
                    <h2 className="text-base font-bold text-white mt-1.5">{mine.name}</h2>
                  </div>
                  <RiskBadge level={mine.riskLevel} size="sm" />
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span>
                    {mine.location}, {mine.district}, {mine.state}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Compliance</span>
                    <span className="text-base font-bold text-emerald-400 font-mono">
                      {mine.complianceScore}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Status</span>
                    <StatusBadge status={mine.operationalStatus} type="operational" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Production Target</span>
                    <span className="font-mono text-slate-300">{mine.productionTarget} TPD</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Actual Output</span>
                    <span className="font-mono text-slate-300">{mine.productionActual} TPD</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">{mine.mineType} Mining</span>
                <Link
                  to={`/mines/${mine._id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 hover:underline"
                >
                  <span>Comprehensive Dossier</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
