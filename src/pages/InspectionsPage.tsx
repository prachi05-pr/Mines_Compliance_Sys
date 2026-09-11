import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { inspectionsApi, minesApi } from '../services/api.js';
import { Inspection, Mine } from '../types/index.js';
import { RiskBadge } from '../components/RiskBadge.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { useAuth } from '../context/AuthContext.js';
import {
  ClipboardCheck,
  PlusCircle,
  Sparkles,
  Search,
  Filter,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Lock,
} from 'lucide-react';

interface FormObservationState {
  section: string;
  number: string;
  title: string;
  description: string;
  status: 'SATISFACTORY' | 'ISSUE_OBSERVED' | 'NOT_OBSERVED_NA' | 'NO_ACCIDENT' | 'ACCIDENT_OCCURRED';
  details: string;
}

const DEFAULT_STATUTORY_OBSERVATIONS: FormObservationState[] = [
  {
    section: 'ROOF_AND_SIDES',
    number: '01',
    title: 'Roof and Sides',
    description: 'Condition of roof and sides in the working places and roadways',
    status: 'SATISFACTORY',
    details: '',
  },
  {
    section: 'VENTILATION',
    number: '02',
    title: 'Ventilation',
    description: 'State of ventilation and presence of noxious or inflammable gases',
    status: 'SATISFACTORY',
    details: '',
  },
  {
    section: 'COAL_DUST',
    number: '03',
    title: 'Coal Dust',
    description: 'Condition of coal dust and stone dusting',
    status: 'SATISFACTORY',
    details: '',
  },
  {
    section: 'FENCING',
    number: '04',
    title: 'Fencing',
    description: 'State of fencing around dangerous places',
    status: 'SATISFACTORY',
    details: '',
  },
  {
    section: 'WATER',
    number: '05',
    title: 'Water',
    description: 'Any abnormal seepage of water',
    status: 'SATISFACTORY',
    details: '',
  },
  {
    section: 'SUPPORT',
    number: '06',
    title: 'Support',
    description: 'Availability and condition of timber/supports',
    status: 'SATISFACTORY',
    details: '',
  },
  {
    section: 'DANGERS_AND_ACTIONS',
    number: '07',
    title: 'Dangers & Actions',
    description: 'Any other danger observed and action taken to remove the same',
    status: 'SATISFACTORY',
    details: '',
  },
  {
    section: 'ACCIDENTS',
    number: '08',
    title: 'Accidents',
    description: 'Any accident or dangerous occurrence during the shift',
    status: 'NO_ACCIDENT',
    details: '',
  },
];

export const InspectionsPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [mines, setMines] = useState<Mine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // New Form IV-A Modal State
  const [showModal, setShowModal] = useState(searchParams.get('new') === 'true');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form IV-A Fields
  const [formMineId, setFormMineId] = useState('');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formShift, setFormShift] = useState<'1ST' | '2ND' | '3RD'>('1ST');
  const [formObservations, setFormObservations] = useState<FormObservationState[]>(DEFAULT_STATUTORY_OBSERVATIONS);

  const loadData = async () => {
    try {
      setLoading(true);
      const [inspRes, mineRes] = await Promise.all([
        inspectionsApi.getAll(),
        minesApi.getAll(),
      ]);
      setInspections(inspRes.data);
      setMines(mineRes.data);
      if (mineRes.data.length > 0 && !formMineId) {
        setFormMineId(mineRes.data[0]._id);
      }
    } catch (err: any) {
      console.error('Failed to load inspections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = (index: number, newStatus: any) => {
    setFormObservations((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], status: newStatus };
      return updated;
    });
  };

  const handleDetailsChange = (index: number, newDetails: string) => {
    setFormObservations((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], details: newDetails };
      return updated;
    });
  };

  const handleCreateInspection = async (autoAnalyze: boolean) => {
    if (!formMineId) {
      setSubmitError('Please select a target coal mine.');
      return;
    }
    if (!formDate) {
      setSubmitError('Please select an inspection date.');
      return;
    }
    if (!formShift) {
      setSubmitError('Please select an inspection shift.');
      return;
    }

    if (autoAnalyze) {
      // Validate that every observation flagged with an issue has mandatory details
      for (const obs of formObservations) {
        if (obs.section !== 'ACCIDENTS' && obs.status === 'ISSUE_OBSERVED' && !obs.details.trim()) {
          setSubmitError(`Please provide detailed observations for "${obs.number}. ${obs.title}" before submitting.`);
          return;
        }
        if (obs.section === 'DANGERS_AND_ACTIONS' && obs.status === 'ISSUE_OBSERVED' && !obs.details.trim()) {
          setSubmitError('Please describe the danger observed and action taken to remove the same for "07. Dangers & Actions".');
          return;
        }
        if (obs.section === 'ACCIDENTS' && obs.status === 'ACCIDENT_OCCURRED' && !obs.details.trim()) {
          setSubmitError('Please provide a description of the accident or dangerous occurrence for "08. Accidents".');
          return;
        }
      }
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      const now = new Date();
      const submissionTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

      const payload = {
        mineId: formMineId,
        formType: 'FORM_IV_A',
        date: formDate,
        shift: formShift,
        submissionTime,
        inspectionType: "Form IV-A – Sirdar's Daily Report",
        observations: formObservations,
        autoAnalyze,
      };

      const res = await inspectionsApi.create(payload);
      setShowModal(false);
      searchParams.delete('new');
      setSearchParams(searchParams);
      await loadData();

      // Open newly created inspection detail directly
      const newId = res.data.inspection?._id || res.data._id;
      if (newId) {
        window.location.href = `/inspections/${newId}`;
      }
    } catch (err: any) {
      setSubmitError(err.response?.data?.error || err.message || 'Failed to submit inspection report');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePopulateSampleIssue = () => {
    setFormObservations([
      {
        section: 'ROOF_AND_SIDES',
        number: '01',
        title: 'Roof and Sides',
        description: 'Condition of roof and sides in the working places and roadways',
        status: 'ISSUE_OBSERVED',
        details: 'Side spalling and micro-cracks noticed along 4th East Haulage roadway between pillar 12 and 14. Support reinforcement recommended.',
      },
      {
        section: 'VENTILATION',
        number: '02',
        title: 'Ventilation',
        description: 'State of ventilation and presence of noxious or inflammable gases',
        status: 'ISSUE_OBSERVED',
        details: 'CH4 (methane) detected at 1.1% in return airway heading 3. Auxiliary ventilation velocity low (1.2 m/s). Gas tested with certified methanometer.',
      },
      {
        section: 'COAL_DUST',
        number: '03',
        title: 'Coal Dust',
        description: 'Condition of coal dust and stone dusting',
        status: 'SATISFACTORY',
        details: 'Stone dusting fresh; water spraying jets active at transfer points.',
      },
      {
        section: 'FENCING',
        number: '04',
        title: 'Fencing',
        description: 'State of fencing around dangerous places',
        status: 'SATISFACTORY',
        details: 'All unworked gallery barricades and warning notices intact.',
      },
      {
        section: 'WATER',
        number: '05',
        title: 'Water',
        description: 'Any abnormal seepage of water',
        status: 'SATISFACTORY',
        details: 'Normal sump collection; no abnormal seepage detected.',
      },
      {
        section: 'SUPPORT',
        number: '06',
        title: 'Support',
        description: 'Availability and condition of timber/supports',
        status: 'SATISFACTORY',
        details: 'Adequate timber props and cross-bars in stock at underground sub-depot.',
      },
      {
        section: 'DANGERS_AND_ACTIONS',
        number: '07',
        title: 'Dangers & Actions',
        description: 'Any other danger observed and action taken to remove the same',
        status: 'ISSUE_OBSERVED',
        details: 'Defective ventilation curtain at cross-cut 5 repaired immediately by timber gang. Ventilation restored before shift handover.',
      },
      {
        section: 'ACCIDENTS',
        number: '08',
        title: 'Accidents',
        description: 'Any accident or dangerous occurrence during the shift',
        status: 'NO_ACCIDENT',
        details: '',
      },
    ]);
  };

  const filteredInspections = inspections.filter((insp) => {
    const mineName = typeof insp.mineId === 'object' ? insp.mineId.name : '';
    let obsText = '';
    if (typeof insp.observations === 'string') {
      obsText = insp.observations;
    } else if (Array.isArray(insp.observations)) {
      obsText = insp.observations.map((o: any) => o.details || o.title || '').join(' ');
    }
    const matchesSearch =
      mineName.toLowerCase().includes(search.toLowerCase()) ||
      insp.inspectionType.toLowerCase().includes(search.toLowerCase()) ||
      obsText.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || insp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-amber-400" />
            <span>Statutory Field Inspections</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Standardized audits, NLP finding extraction, and human validation pipeline
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition shadow-sm"
        >
          <PlusCircle className="h-4 w-4" />
          <span>New Sirdar Report (Form IV-A)</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by mine, type, or observations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 px-3 py-1.5 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Audit Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="UNDER_REVIEW">Under Review (AI Analyzed)</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Inspections Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading statutory inspection records...</div>
        ) : filteredInspections.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <ClipboardCheck className="h-8 w-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No inspections found</p>
            <p className="text-xs text-slate-500">Record a new inspection audit to trigger the AI statutory pipeline.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Audit Date</th>
                  <th className="py-3 px-4">Coal Mine</th>
                  <th className="py-3 px-4">Audit Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Statutory Risk</th>
                  <th className="py-3 px-4">AI Findings</th>
                  <th className="py-3 px-4 text-right">Surveillance Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredInspections.map((insp) => {
                  const mineObj = typeof insp.mineId === 'object' ? insp.mineId : null;
                  return (
                    <tr key={insp._id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {new Date(insp.inspectionDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{mineObj?.name || 'Assigned Mine'}</div>
                        <div className="text-[10px] font-mono text-amber-400/80">
                          {mineObj?.mineCode} • {mineObj?.state}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-200">
                        {insp.inspectionType}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={insp.status} type="inspection" />
                      </td>
                      <td className="py-3.5 px-4">
                        <RiskBadge level={insp.riskLevel} score={insp.riskScore} size="sm" />
                      </td>
                      <td className="py-3.5 px-4">
                        {insp.aiAnalysis ? (
                          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                            <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                            <span className="truncate max-w-[150px] font-mono text-[11px]">
                              {insp.aiAnalysis.violationType.replace(/_/g, ' ')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">No AI findings</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/inspections/${insp._id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 hover:text-amber-300 font-semibold transition"
                        >
                          <span>Review Audit</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FORM IV-A: SIRDAR'S DAILY REPORT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-4xl w-full p-5 sm:p-6 space-y-5 shadow-2xl my-6 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-mono font-bold tracking-wider uppercase">
                    Statutory Regulation Form
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">CMR 2017</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white mt-1">
                  Form IV-A: Sirdar&apos;s Daily Report
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Belowground Mine Daily Safety Report
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-xl font-bold p-1 transition"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            {submitError && (
              <div className="p-3 bg-red-950/60 border border-red-800 rounded-lg text-red-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="space-y-5 text-xs">
              {/* SECTION 1: BASIC REPORT INFORMATION */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4 space-y-3.5">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <ClipboardCheck className="h-4 w-4 text-amber-400" />
                  <span>Basic Report Information</span>
                </h3>

                {/* Row 1: Target Coal Mine & Report Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Target Coal Mine <span className="text-amber-400">*</span>
                    </label>
                    <select
                      value={formMineId}
                      onChange={(e) => setFormMineId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-500"
                    >
                      {mines.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.name} ({m.mineCode}) • {m.state}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Report Type (Statutory Format)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value="Form IV-A – Sirdar's Daily Report"
                        className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800/80 rounded-lg text-slate-300 font-medium cursor-not-allowed focus:outline-none"
                      />
                      <div className="absolute right-3 top-2.5 flex items-center gap-1 text-[10px] text-amber-400 font-mono">
                        <Lock className="h-3 w-3" />
                        <span>Fixed</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 2: Date, Shift & Automatic Submission Time */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Inspection Date <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Shift <span className="text-amber-400">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['1ST', '2ND', '3RD'] as const).map((shift) => (
                        <button
                          key={shift}
                          type="button"
                          onClick={() => setFormShift(shift)}
                          className={`py-2 px-1 text-center rounded-lg font-medium transition text-xs border ${
                            formShift === shift
                              ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm'
                              : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-850'
                          }`}
                        >
                          {shift === '1ST' ? '1st Shift' : shift === '2ND' ? '2nd Shift' : '3rd Shift'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1 flex items-center justify-between">
                      <span>Submission Time</span>
                      <span className="text-amber-400 text-[10px] font-mono">Auto</span>
                    </label>
                    <div className="px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-slate-300 font-mono text-xs flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">Auto-recorded at submit</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* STATUTORY SAFETY OBSERVATIONS */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <ClipboardCheck className="h-4 w-4 text-amber-400" />
                      <span>Statutory Safety Observations (8 Mandatory Clauses)</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Standard belowground safety parameters under Coal Mines Regulations, 2017
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handlePopulateSampleIssue}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded transition self-start sm:self-auto"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Insert Sample Statutory Issue (CH4 & Strata)</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {formObservations.map((obs, idx) => {
                    const isAccidentSection = obs.section === 'ACCIDENTS';
                    const isDangersSection = obs.section === 'DANGERS_AND_ACTIONS';
                    const hasIssue =
                      obs.status === 'ISSUE_OBSERVED' || obs.status === 'ACCIDENT_OCCURRED';

                    return (
                      <div
                        key={obs.section}
                        className={`rounded-xl border transition p-4 ${
                          hasIssue
                            ? 'bg-amber-950/20 border-amber-800/60 shadow-sm'
                            : 'bg-slate-950/70 border-slate-800/90'
                        }`}
                      >
                        {/* Observation Header */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-slate-800 font-mono text-[11px] font-bold text-amber-400 border border-slate-700">
                                {obs.number}
                              </span>
                              <h4 className="font-bold text-sm text-white">{obs.title}</h4>
                            </div>
                            <p className="text-[11px] text-slate-400 pl-8 leading-snug">
                              {obs.description}
                            </p>
                          </div>

                          {/* Status Selector */}
                          <div className="sm:shrink-0 pl-8 sm:pl-0">
                            {isAccidentSection ? (
                              <div className="inline-flex rounded-lg border border-slate-800 p-0.5 bg-slate-900">
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(idx, 'NO_ACCIDENT')}
                                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition ${
                                    obs.status === 'NO_ACCIDENT'
                                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                                      : 'text-slate-400 hover:text-white'
                                  }`}
                                >
                                  No Accident / Occurrence
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(idx, 'ACCIDENT_OCCURRED')}
                                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition ${
                                    obs.status === 'ACCIDENT_OCCURRED'
                                      ? 'bg-red-500 text-white font-bold shadow-sm'
                                      : 'text-slate-400 hover:text-red-300'
                                  }`}
                                >
                                  Accident / Occurrence
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(idx, 'NOT_OBSERVED_NA')}
                                  className={`px-2 py-1 text-[11px] font-medium rounded-md transition ${
                                    obs.status === 'NOT_OBSERVED_NA'
                                      ? 'bg-slate-700 text-white font-bold shadow-sm'
                                      : 'text-slate-400 hover:text-white'
                                  }`}
                                >
                                  N.A.
                                </button>
                              </div>
                            ) : (
                              <div className="inline-flex rounded-lg border border-slate-800 p-0.5 bg-slate-900">
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(idx, 'SATISFACTORY')}
                                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition ${
                                    obs.status === 'SATISFACTORY'
                                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                                      : 'text-slate-400 hover:text-white'
                                  }`}
                                >
                                  Satisfactory
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(idx, 'ISSUE_OBSERVED')}
                                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition ${
                                    obs.status === 'ISSUE_OBSERVED'
                                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                                      : 'text-slate-400 hover:text-amber-300'
                                  }`}
                                >
                                  Issue Observed
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(idx, 'NOT_OBSERVED_NA')}
                                  className={`px-2 py-1 text-[11px] font-medium rounded-md transition ${
                                    obs.status === 'NOT_OBSERVED_NA'
                                      ? 'bg-slate-700 text-white font-bold shadow-sm'
                                      : 'text-slate-400 hover:text-white'
                                  }`}
                                >
                                  N.A.
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Detailed Observation Textarea */}
                        <div className="pl-0 sm:pl-8 mt-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
                              <span>Observation Details & Corrective Sirdar Action</span>
                              {hasIssue && (
                                <span className="text-amber-400 text-[10px] font-mono font-bold">
                                  *Required for Issue
                                </span>
                              )}
                            </label>
                          </div>

                          <textarea
                            rows={isAccidentSection && hasIssue ? 4 : 2}
                            value={obs.details}
                            onChange={(e) => handleDetailsChange(idx, e.target.value)}
                            placeholder={
                              isAccidentSection
                                ? 'Describe the accident or dangerous occurrence...'
                                : isDangersSection
                                ? 'Describe the danger observed and action taken to remove the danger...'
                                : `Enter detailed field observations for ${obs.title.toLowerCase()} (e.g. location, measurements, equipment)...`
                            }
                            className={`w-full px-3 py-2 bg-slate-900 rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none transition ${
                              hasIssue
                                ? 'border border-amber-500/70 focus:border-amber-400 bg-amber-950/10'
                                : 'border border-slate-800 focus:border-amber-500'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <div className="text-[11px] text-slate-400">
                <span className="font-semibold text-slate-300">Statutory Notice:</span> Submitted
                Form IV-A reports are archived and evaluated by the NLP AI risk classification pipeline.
              </div>

              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleCreateInspection(true)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{submitting ? 'Executing Pipeline...' : 'Submit & Analyze with AI'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
