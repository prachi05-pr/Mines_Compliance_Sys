export type UserRole = 'MINE_OFFICER' | 'CORPORATE_MANAGER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  mineIds: string[];
  createdAt?: string;
}

export type OperationalStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Mine {
  _id: string;
  name: string;
  mineCode: string;
  location: string;
  state: string;
  district: string;
  mineType: string;
  productionTarget: number;
  productionActual: number;
  operationalStatus: OperationalStatus;
  complianceScore: number;
  riskLevel: RiskLevel;
  createdAt: string;
}

export type ComplianceCategory = 'SAFETY' | 'ENVIRONMENT' | 'LABOUR' | 'PRODUCTION' | 'EQUIPMENT' | 'OTHER';
export type ComplianceStatus = 'COMPLIANT' | 'PARTIALLY_COMPLIANT' | 'NON_COMPLIANT' | 'OVERDUE';

export interface Compliance {
  _id: string;
  mineId: string | Mine;
  category: ComplianceCategory;
  requirement: string;
  status: ComplianceStatus;
  dueDate: string;
  lastUpdated: string;
  notes: string;
  createdAt: string;
}

export type ContractorStatus = 'ACTIVE' | 'INACTIVE';
export type ContractorComplianceStatus = 'COMPLIANT' | 'PARTIALLY_COMPLIANT' | 'NON_COMPLIANT';

export interface Contractor {
  _id: string;
  mineId: string | Mine;
  name: string;
  company: string;
  category: string;
  workforceCount: number;
  status: ContractorStatus;
  complianceStatus: ContractorComplianceStatus;
  createdAt: string;
}

export type InspectionStatus = 'DRAFT' | 'AI_ANALYZED' | 'UNDER_REVIEW' | 'COMPLETED';

export type ShiftType = '1ST' | '2ND' | '3RD';

export type ObservationSection =
  | 'ROOF_AND_SIDES'
  | 'VENTILATION'
  | 'COAL_DUST'
  | 'FENCING'
  | 'WATER'
  | 'SUPPORT'
  | 'DANGERS_AND_ACTIONS'
  | 'ACCIDENTS';

export type ObservationStatus =
  | 'SATISFACTORY'
  | 'ISSUE_OBSERVED'
  | 'NOT_OBSERVED_NA'
  | 'NO_ACCIDENT'
  | 'ACCIDENT_OCCURRED';

export interface FormIVObservation {
  section: ObservationSection;
  number: string;
  title: string;
  description: string;
  status: ObservationStatus;
  details: string;
}

export interface FormIVTimings {
  first: string;
  second?: string;
  third?: string;
}

export interface InspectionOperationalData {
  production?: number;
  attendance?: number;
  downtimeHours?: number;
  safetyIncidents?: number;
}

export interface InspectionAiAnalysis {
  category: string;
  violationType: string;
  severity: string;
  confidence: number;
  explanation: string;
  recurrence?: {
    previousOccurrences: number;
    recurrenceLevel: string;
    lastOccurrence?: string | null;
  };
  anomaly?: {
    detected: boolean;
    metric: string;
    currentValue: number;
    baselineValue: number;
    deviationPercentage: number;
  };
}

export interface Inspection {
  _id: string;
  mineId: string | Mine;
  officerId: string | { _id: string; name: string; email: string };
  formType?: string;
  shift?: ShiftType;
  submissionTime?: string;
  inspectionTimings?: FormIVTimings;
  inspectionDate: string;
  inspectionType: string;
  checklist?: Array<{ item: string; passed: boolean; remarks?: string }>;
  observations?: any;
  formObservations?: FormIVObservation[];
  operationalData?: InspectionOperationalData;
  status: InspectionStatus;
  aiAnalysis?: InspectionAiAnalysis | null;
  riskScore: number;
  riskLevel: RiskLevel;
  createdAt: string;
}

export type ViolationCategory = 'SAFETY' | 'ENVIRONMENT' | 'LABOUR' | 'PRODUCTION' | 'EQUIPMENT' | 'OTHER';
export type ViolationSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ViolationStatus = 'AI_SUGGESTED' | 'CONFIRMED' | 'REJECTED';

export interface Violation {
  _id: string;
  mineId: string | Mine;
  inspectionId: string | Inspection;
  category: ViolationCategory;
  violationType: string;
  description: string;
  severity: ViolationSeverity;
  confidence: number;
  status: ViolationStatus;
  confirmedBy?: string | { _id: string; name: string; email: string; role: string } | null;
  confirmedAt?: string | null;
  createdAt: string;
}

export type AlertType =
  | 'CRITICAL_RISK'
  | 'HIGH_RISK'
  | 'RECURRING_VIOLATION'
  | 'COMPLIANCE_DEADLINE'
  | 'COMPLIANCE_OVERDUE'
  | 'OPERATIONAL_ANOMALY'
  | 'ATTENDANCE_ANOMALY'
  | 'DOWNTIME_ANOMALY'
  | 'NEW_VIOLATION'
  | 'AI_ANALYSIS_PENDING'
  | 'AI_SERVICE_FAILURE'
  | 'INSPECTION_REVIEW_PENDING'
  | 'MULTIPLE_VIOLATIONS'
  | 'MINE_RISK_ESCALATION'
  | 'COMPLIANCE_SCORE_DROP';

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Alert {
  _id: string;
  userId?: string | null;
  mineId: string | Mine;
  type: AlertType;
  title: string;
  message: string;
  severity: AlertSeverity;
  relatedEntityId?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface DbStatus {
  status: string;
  readyState: number;
  isAtlas: boolean;
  host: string;
  dbName: string;
}
