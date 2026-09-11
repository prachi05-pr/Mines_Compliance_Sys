import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { inspectionsApi, violationsApi } from '../services/api.js';
import { RiskBadge } from '../components/RiskBadge.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { useAuth } from '../context/AuthContext.js';
import {
  ClipboardCheck,
  Sparkles,
  History,
  AlertOctagon,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  RefreshCw,
  UserCheck,
  Activity,
  Layers,
  FileText,
  Clock,
  AlertTriangle,
} from 'lucide-react';

export const InspectionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [inspection, setInspection] = useState<any>(null);
  const [violations, setViolations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [validating, setValidating] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await inspectionsApi.getById(id);
      setInspection(res.data.inspection);
      setViolations(res.data.violations || []);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch inspection details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleRunAiAnalysis = async () => {
    if (!id) return;
    try {
      setAnalyzing(true);
      setError(null);
      await inspectionsApi.analyze(id);
      setActionSuccess('AI statutory analysis and risk scoring completed!');
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'AI analysis execution failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirmViolation = async (violationId: string) => {
    try {
      setValidating(true);
      setError(null);
      await violationsApi.confirm(violationId);
      setActionSuccess('Violation validated and confirmed by statutory inspector.');
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to confirm violation');
    } finally {
      setValidating(false);
    }
  };

  const handleRejectViolation = async (violationId: string) => {
    try {
      setValidating(true);
      setError(null);
      await violationsApi.reject(violationId);
      setActionSuccess('AI recommendation rejected. No statutory violation created.');
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to reject violation');
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-r-transparent" />
          <p className="text-xs text-slate-400 font-medium">Loading statutory inspection details...</p>
        </div>
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="p-6 bg-red-950/40 border border-red-800 rounded-xl text-red-200 space-y-3">
        <p className="font-semibold">Inspection Record Unavailable:</p>
        <p className="text-xs text-red-300">{error || 'Record not found.'}</p>
        <Link to="/inspections" className="text-xs text-amber-400 hover:underline inline-block">
          &larr; Back to Inspections
        </Link>
      </div>
    );
  }

  const aiAnalysis = inspection.aiAnalysis;
  const operationalData = inspection.operationalData || {};
  const checklist = inspection.checklist || [];

  const isFormIVA =
    inspection.formType === 'FORM_IV_A' ||
    Array.isArray(inspection.formObservations) ||
    Array.isArray(inspection.observations);

  const formObservationsList: any[] = Array.isArray(inspection.formObservations)
    ? inspection.formObservations
    : Array.isArray(inspection.observations)
    ? inspection.observations
    : [];

  const renderObservationStatusBadge = (status: string) => {
    switch (status) {
      case 'SATISFACTORY':
        return (
          <span className="px-2.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-400 font-mono text-[10px] font-bold">
            SATISFACTORY
          </span>
        );
      case 'ISSUE_OBSERVED':
        return (
          <span className="px-2.5 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-amber-400 font-mono text-[10px] font-bold">
            ISSUE OBSERVED
          </span>
        );
      case 'NO_ACCIDENT':
        return (
          <span className="px-2.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-400 font-mono text-[10px] font-bold">
            NO ACCIDENT / OCCURRENCE
          </span>
        );
      case 'ACCIDENT_OCCURRED':
        return (
          <span className="px-2.5 py-0.5 rounded bg-red-950/80 border border-red-800 text-red-400 font-mono text-[10px] font-bold animate-pulse">
            ACCIDENT / OCCURRENCE
          </span>
        );
      case 'NOT_OBSERVED_NA':
        return (
          <span className="px-2.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 font-mono text-[10px] font-medium">
            NOT OBSERVED / N.A.
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 font-mono text-[10px]">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/inspections"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Inspections</span>
        </Link>

        {(!aiAnalysis || inspection.status === 'DRAFT') && (
          <button
            onClick={handleRunAiAnalysis}
            disabled={analyzing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow"
          >
            <Sparkles className={`h-4 w-4 ${analyzing ? 'animate-spin' : ''}`} />
            <span>{analyzing ? 'Analyzing Observations...' : 'Run AI Analysis & Risk Engine'}</span>
          </button>
        )}
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-950/50 border border-emerald-800 rounded-lg text-emerald-300 text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {actionSuccess}
          </span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Primary Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-white tracking-tight">{inspection.inspectionType}</h1>
              {inspection.shift && (
                <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold font-mono">
                  {inspection.shift} Shift
                </span>
              )}
              <StatusBadge status={inspection.status} type="inspection" />
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
              <span className="text-amber-400 font-semibold">{inspection.mineId?.name}</span>
              <span>({inspection.mineId?.mineCode})</span>
              <span>•</span>
              <span>Audit Date: {new Date(inspection.inspectionDate).toLocaleDateString()}</span>
              {inspection.submissionTime && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-mono text-slate-300">
                    <Clock className="h-3 w-3 text-amber-400" />
                    <span>Submitted: {inspection.submissionTime}</span>
                  </span>
                </>
              )}
              <span>•</span>
              <span>Auditor / Sirdar: {inspection.officerId?.name || 'Certified Mining Sirdar'}</span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-medium uppercase">Overall Statutory Risk</div>
              <div className="mt-0.5">
                <RiskBadge level={inspection.riskLevel} score={inspection.riskScore} size="lg" />
              </div>
            </div>
          </div>
        </div>

        {/* Observations Section */}
        {isFormIVA && formObservationsList.length > 0 ? (
          <div className="space-y-3 pt-1">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <ClipboardCheck className="h-3.5 w-3.5 text-amber-400" />
              <span>Form IV-A Statutory Safety Observations (8 Mandatory Clauses)</span>
            </h2>
            <div className="space-y-2.5">
              {formObservationsList.map((obs: any, idx: number) => {
                const hasIssue =
                  obs.status === 'ISSUE_OBSERVED' || obs.status === 'ACCIDENT_OCCURRED';
                return (
                  <div
                    key={obs.section || idx}
                    className={`p-3.5 rounded-lg border transition text-xs ${
                      hasIssue
                        ? 'bg-amber-950/20 border-amber-800/60 shadow-sm'
                        : 'bg-slate-950/70 border-slate-800/90'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-800 font-mono text-[10px] font-bold text-amber-400 border border-slate-700">
                          {obs.number || `0${idx + 1}`}
                        </span>
                        <span className="font-bold text-white text-sm">{obs.title}</span>
                        <span className="text-slate-400 text-[11px] hidden md:inline">
                          — {obs.description}
                        </span>
                      </div>
                      <div>{renderObservationStatusBadge(obs.status)}</div>
                    </div>

                    {obs.details && (
                      <div className="mt-2 pl-0 sm:pl-7">
                        <div className="p-2.5 rounded bg-slate-900/90 border border-slate-800/80 text-slate-200 text-xs font-sans leading-relaxed">
                          <span className="text-slate-400 font-mono text-[10px] block uppercase mb-0.5">
                            Recorded Observation Details:
                          </span>
                          {obs.details}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-amber-400" />
              <span>Inspector Field Observations</span>
            </h2>
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
              {typeof inspection.observations === 'string'
                ? inspection.observations
                : 'No written observations recorded.'}
            </div>

            {/* Operational Telemetry Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Daily Production</span>
                <span className="text-base font-bold text-white font-mono">{operationalData.production}</span>
                <span className="text-[10px] text-slate-400 ml-1">Tonnes</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Attendance Ratio</span>
                <span className="text-base font-bold text-white font-mono">{operationalData.attendance}%</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Equipment Downtime</span>
                <span className="text-base font-bold text-white font-mono">{operationalData.downtimeHours}</span>
                <span className="text-[10px] text-slate-400 ml-1">Hours</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Reported Safety Incidents</span>
                <span className={`text-base font-bold font-mono ${operationalData.safetyIncidents > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {operationalData.safetyIncidents}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Statutory Pipeline Results Grid */}
      {aiAnalysis ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 1. AI Finding Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <h2 className="text-sm font-bold text-white">AI Finding Classification</h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                {(aiAnalysis.confidence * 100).toFixed(0)}% Confidence
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Category & Finding Type</span>
                <div className="font-bold text-white text-sm mt-0.5 font-mono">
                  {aiAnalysis.violationType.replace(/_/g, ' ')}
                </div>
                <div className="text-[11px] text-amber-400 font-medium">{aiAnalysis.category} STATUTE</div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Calculated Severity</span>
                <div className="mt-1">
                  <RiskBadge level={aiAnalysis.severity} size="sm" />
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Statutory Context</span>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed bg-slate-950 p-2.5 rounded border border-slate-800">
                  {aiAnalysis.explanation}
                </p>
              </div>
            </div>
          </div>

          {/* 2. Historical Recurrence & Operational Anomaly Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            {/* Recurrence Subsection */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <History className="h-4 w-4 text-blue-400" />
                <h2 className="text-sm font-bold text-white">Historical Recurrence</h2>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Previous Occurrences (90d):</span>
                  <span className="font-mono font-bold text-white">
                    {aiAnalysis.recurrence?.previousOccurrences ?? 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Recurrence Risk Tier:</span>
                  <span className="font-semibold text-amber-400">
                    {aiAnalysis.recurrence?.recurrenceLevel ?? 'LOW'}
                  </span>
                </div>
              </div>
            </div>

            {/* Anomaly Subsection */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertOctagon className="h-4 w-4 text-orange-400" />
                <h2 className="text-sm font-bold text-white">Operational Anomaly</h2>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Anomaly Detected:</span>
                  <span className={`font-semibold ${aiAnalysis.anomaly?.detected ? 'text-red-400' : 'text-emerald-400'}`}>
                    {aiAnalysis.anomaly?.detected ? 'YES - DEVIATION' : 'NO ANOMALY'}
                  </span>
                </div>
                {aiAnalysis.anomaly?.detected && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Affected Metric:</span>
                      <span className="font-mono text-slate-200">{aiAnalysis.anomaly.metric}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Deviation Percentage:</span>
                      <span className="font-mono text-red-400">
                        {aiAnalysis.anomaly.deviationPercentage.toFixed(1)}%
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 3. Explainable Risk Score & Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white">Explainable Risk Engine</h2>
            </div>

            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-medium">Calculated Score</span>
                <div className="text-2xl font-bold font-mono text-white">
                  {inspection.riskScore} <span className="text-xs text-slate-500">/ 100</span>
                </div>
              </div>
              <RiskBadge level={inspection.riskLevel} size="md" />
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-medium block mb-1.5">
                Statutory Reasoning (Explainable AI):
              </span>
              <ul className="space-y-1.5 text-[11px] text-slate-300">
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>AI Severity Finding: {aiAnalysis.severity} severity classification</span>
                </li>
                {aiAnalysis.recurrence && aiAnalysis.recurrence.previousOccurrences > 0 && (
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>Historical Recurrence: {aiAnalysis.recurrence.previousOccurrences} prior violations recorded</span>
                  </li>
                )}
                {aiAnalysis.anomaly?.detected && (
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>Operational Anomaly: {aiAnalysis.anomaly.deviationPercentage.toFixed(0)}% deviation in {aiAnalysis.anomaly.metric}</span>
                  </li>
                )}
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>Colliery Compliance Baseline: {inspection.mineId?.complianceScore ?? 80}%</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-xl text-center space-y-3">
          <Sparkles className="h-8 w-8 text-amber-400 mx-auto" />
          <h2 className="text-sm font-bold text-white">AI Analysis Not Yet Triggered</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Execute the AI Surveillance pipeline to classify observation text, check historical recurrence, detect operational anomalies, and calculate explainable statutory risk.
          </p>
          <button
            onClick={handleRunAiAnalysis}
            disabled={analyzing}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition"
          >
            {analyzing ? 'Analyzing...' : 'Execute AI Pipeline'}
          </button>
        </div>
      )}

      {/* HUMAN VALIDATION SECTION */}
      {/* Rule 6 & Section 12 Mandate: AI creates AI_SUGGESTED. Confirmed violation can only be created after human validation! */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-bold text-white">Statutory Human Validation (Officer in the Loop)</h2>
              <p className="text-xs text-slate-400">
                Rule 6: AI suggestions must be validated by authorized Mine Officers before legal confirmation
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono uppercase bg-slate-800 px-2 py-0.5 rounded text-slate-300">
            {violations.length} Finding(s) Linked
          </span>
        </div>

        {violations.length === 0 ? (
          <p className="text-xs text-slate-500 italic">
            No violation recommendations generated yet. Run the AI pipeline to analyze field observations.
          </p>
        ) : (
          <div className="space-y-3">
            {violations.map((viol) => (
              <div
                key={viol._id}
                className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white font-mono">
                      {viol.violationType.replace(/_/g, ' ')}
                    </span>
                    <StatusBadge status={viol.status} type="violation" />
                    <RiskBadge level={viol.severity} size="sm" />
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">{viol.description}</p>
                  {viol.status === 'CONFIRMED' && (
                    <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>
                        Statutorily Confirmed by {viol.confirmedBy?.name || 'Mine Officer'} on{' '}
                        {new Date(viol.confirmedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {viol.status === 'REJECTED' && (
                    <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-1">
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Rejected by Field Officer on {new Date(viol.confirmedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {viol.status === 'AI_SUGGESTED' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleRejectViolation(viol._id)}
                      disabled={validating}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-950/60 hover:text-red-300 text-slate-400 text-xs font-semibold border border-slate-700 transition"
                    >
                      Reject Finding
                    </button>
                    <button
                      onClick={() => handleConfirmViolation(viol._id)}
                      disabled={validating}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
                    >
                      Confirm Violation
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Safety Checklist Items (Only for legacy inspections) */}
      {!isFormIVA && checklist && checklist.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-amber-400" />
            <span>Statutory Checklist Audited</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {checklist.map((item: any, idx: number) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border flex items-center justify-between ${
                  item.passed
                    ? 'bg-slate-950 border-slate-800 text-slate-300'
                    : 'bg-red-950/30 border-red-800/40 text-red-200'
                }`}
              >
                <span>{item.item}</span>
                <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                  item.passed ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'
                }`}>
                  {item.passed ? 'PASSED' : 'FAILED'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
