import { GoogleGenAI } from '@google/genai';

export interface AiAnalysisInput {
  mineId: string;
  inspectionText: string;
  operationalData?: {
    production?: number;
    attendance?: number;
    downtimeHours?: number;
    safetyIncidents?: number;
  };
}

export interface AiAnalysisResult {
  category: 'SAFETY' | 'ENVIRONMENT' | 'LABOUR' | 'PRODUCTION' | 'EQUIPMENT' | 'OTHER';
  violationType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  explanation: string;
  suggestedAction?: string;
}

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
    if (!geminiClient) {
      geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return geminiClient;
  }
  return null;
}

/**
 * Domain-specific rule & NLP classifier for Coal Mine statutory governance.
 * Handles Ministry of Coal guidelines, DGMS (Directorate General of Mines Safety),
 * and CMR (Coal Mines Regulations 2017).
 */
export function domainNlpClassifier(text: string): AiAnalysisResult {
  const t = text.toLowerCase();

  // Satisfactory baseline check
  if (
    (t.includes('verified satisfactory') || t.includes('found satisfactory') || t.includes('all statutory checks') || t.includes('satisfactory')) &&
    !t.includes('issue_observed') &&
    !t.includes('accident_occurred') &&
    !t.includes('danger') &&
    !t.includes('hazard') &&
    !t.includes('fail') &&
    !t.includes('seepage') &&
    !t.includes('methane') &&
    !t.includes('abnormal')
  ) {
    return {
      category: 'SAFETY',
      violationType: 'STATUTORY_SURVEILLANCE_VERIFIED',
      severity: 'LOW',
      confidence: 0.95,
      explanation:
        'All statutory underground safety observations inspected and verified satisfactory under DGMS Coal Mines Regulations.',
    };
  }

  // Accidents / Dangerous Occurrences (Zero Tolerance, Critical)
  if (
    t.includes('accident_occurred') ||
    t.includes('accident') ||
    t.includes('dangerous occurrence') ||
    t.includes('fatality') ||
    t.includes('serious injury')
  ) {
    return {
      category: 'SAFETY',
      violationType: 'STATUTORY_ACCIDENT_OCCURRENCE',
      severity: 'CRITICAL',
      confidence: 0.98,
      explanation:
        'Dangerous occurrence or statutory accident recorded during the shift under Coal Mines Regulations, 2017. Immediate inquiry and regulatory notice required.',
    };
  }

  // Water Seepage / Inundation Hazard (Critical)
  if (
    t.includes('seepage') ||
    t.includes('inundation') ||
    t.includes('flooding') ||
    t.includes('water accumulation') ||
    t.includes('abnormal water')
  ) {
    return {
      category: 'SAFETY',
      violationType: 'WATER_INUNDATION_SEEPAGE_HAZARD',
      severity: 'CRITICAL',
      confidence: 0.95,
      explanation:
        'Abnormal water seepage detected in underground working area, presenting imminent inundation risk and strata destabilization under statutory mining guidelines.',
    };
  }

  // Safety Critical: Gas, Methane, Ventilation, Strata Roof / Sides, Timber Supports
  if (
    t.includes('methane') ||
    t.includes('inflammable') ||
    t.includes('noxious') ||
    t.includes('fire damp') ||
    t.includes('ventilation') ||
    t.includes('gas')
  ) {
    return {
      category: 'SAFETY',
      violationType: 'HAZARDOUS_GAS_VENTILATION_FAILURE',
      severity: 'CRITICAL',
      confidence: 0.96,
      explanation:
        'Ventilation inadequacy or noxious/inflammable gas presence detected in underground working face, threatening life-safety and explosive accumulation limits.',
    };
  }

  if (
    t.includes('roof fall') ||
    t.includes('roof and sides') ||
    t.includes('sides') ||
    t.includes('strata') ||
    t.includes('support') ||
    t.includes('timber') ||
    t.includes('prop') ||
    t.includes('chock') ||
    t.includes('slope collapse')
  ) {
    return {
      category: 'SAFETY',
      violationType: 'STRATA_CONTROL_ROOF_FAILURE',
      severity: 'CRITICAL',
      confidence: 0.94,
      explanation:
        'Adverse roof/sides condition or deficient timber/support installation in underground roadways violating Strata Management and Support Plan under CMR 2017.',
    };
  }

  // Fencing around dangerous places
  if (
    t.includes('fencing') ||
    t.includes('fence') ||
    t.includes('unfenced') ||
    t.includes('dangerous place')
  ) {
    return {
      category: 'SAFETY',
      violationType: 'UNPROTECTED_DANGEROUS_OPENING_FENCING',
      severity: 'HIGH',
      confidence: 0.92,
      explanation:
        'Fencing surrounding dangerous places or unworked underground galleries damaged or missing, violating Regulation 137 of CMR 2017.',
    };
  }

  // Coal Dust & Stone Dusting
  if (
    t.includes('coal dust') ||
    t.includes('stone dusting') ||
    t.includes('stone dust')
  ) {
    return {
      category: 'SAFETY',
      violationType: 'COAL_DUST_EXPLOSION_HAZARD',
      severity: 'HIGH',
      confidence: 0.93,
      explanation:
        'Deficient stone dusting or hazardous coal dust accumulation detected in underground roadways, presenting severe coal dust propagation and explosion risk.',
    };
  }

  // General Dangers / Actions
  if (
    t.includes('danger') ||
    t.includes('hazard') ||
    t.includes('threat')
  ) {
    return {
      category: 'SAFETY',
      violationType: 'UNRESOLVED_UNDERGROUND_HAZARD',
      severity: 'HIGH',
      confidence: 0.91,
      explanation:
        'Unresolved danger observed during Sirdar inspection requiring immediate remedial action to restore safe working conditions.',
    };
  }

  // Safety High: PPE, Guards, Unsafe electrical, Heights
  if (
    t.includes('protective equipment') ||
    t.includes('ppe') ||
    t.includes('helmet') ||
    t.includes('boots') ||
    t.includes('goggles') ||
    t.includes('without required') ||
    t.includes('no harness') ||
    t.includes('guard missing') ||
    t.includes('unguarded')
  ) {
    return {
      category: 'SAFETY',
      violationType: t.includes('guard') ? 'UNGUARDED_MACHINERY_HAZARD' : 'PPE_NON_COMPLIANCE',
      severity: 'HIGH',
      confidence: 0.92,
      explanation:
        'Workers or equipment operating without statutory personal protective gear or mechanical interlock guards, directly exposing personnel to crush, impact, or inhalation risks.',
    };
  }

  // Environment: Dust, Water discharge, Fly ash, Effluent, Emission, Forest clearance
  if (
    t.includes('dust') ||
    t.includes('water discharge') ||
    t.includes('pollution') ||
    t.includes('effluent') ||
    t.includes('sprinkler') ||
    t.includes('tailing') ||
    t.includes('slurry') ||
    t.includes('overburden dump') ||
    t.includes('emission')
  ) {
    const isDust = t.includes('dust') || t.includes('sprinkler');
    return {
      category: 'ENVIRONMENT',
      violationType: isDust ? 'DUST_SUPPRESSION_FAILURE' : 'UNAUTHORIZED_EFFLUENT_DISCHARGE',
      severity: isDust ? 'MEDIUM' : 'HIGH',
      confidence: 0.89,
      explanation:
        'Environmental non-compliance detected: failure of continuous water mist suppression or improper industrial water drainage violating statutory pollution control standards.',
    };
  }

  // Labour: Overtime, Wages, Medical exam, Unauthorized subcontracting, Attendance, Minors
  if (
    t.includes('attendance') ||
    t.includes('wage') ||
    t.includes('shift') ||
    t.includes('contractor workforce') ||
    t.includes('overtime') ||
    t.includes('unregistered worker') ||
    t.includes('medical') ||
    t.includes('labour') ||
    t.includes('labor')
  ) {
    return {
      category: 'LABOUR',
      violationType: t.includes('unregistered') || t.includes('contractor')
        ? 'UNAUTHORIZED_SUBCONTRACT_WORKFORCE'
        : 'STATUTORY_REST_OVERTIME_VIOLATION',
      severity: 'MEDIUM',
      confidence: 0.87,
      explanation:
        'Breach of Mines Act statutory welfare, shift limit regulations, or unaccounted contractor personnel working without proper statutory onboarding passes.',
    };
  }

  // Equipment: HEMM (Heavy Earth Moving Machinery), Dumper, Shovel, Dragline, Conveyor, Brakes
  if (
    t.includes('downtime') ||
    t.includes('conveyor') ||
    t.includes('dumper') ||
    t.includes('shovel') ||
    t.includes('dragline') ||
    t.includes('brake') ||
    t.includes('hydraulic') ||
    t.includes('breakdown') ||
    t.includes('maintenance overdue')
  ) {
    return {
      category: 'EQUIPMENT',
      violationType: t.includes('brake') ? 'CRITICAL_BRAKE_SYSTEM_DEFECT' : 'HEMM_MAINTENANCE_OVERDUE',
      severity: t.includes('brake') ? 'HIGH' : 'MEDIUM',
      confidence: 0.88,
      explanation:
        'Heavy mechanical or transport equipment operating under sub-optimal or degraded maintenance status, elevating operational shutdown and runaway machine risks.',
    };
  }

  // Production: Target deficit, extraction pace, illegal bypass
  if (
    t.includes('production') ||
    t.includes('tonnage') ||
    t.includes('target') ||
    t.includes('bottleneck') ||
    t.includes('bench') ||
    t.includes('haul road')
  ) {
    return {
      category: 'PRODUCTION',
      violationType: 'HAUL_ROAD_BOTTLENECK_DISRUPTION',
      severity: 'MEDIUM',
      confidence: 0.84,
      explanation:
        'Haul road degradation or material extraction bottleneck compromising daily scheduled coal dispatch targets.',
    };
  }

  // Default fallback if generalized observation
  return {
    category: 'SAFETY',
    violationType: 'GENERAL_STATUTORY_SAFETY_DEFICIT',
    severity: 'MEDIUM',
    confidence: 0.78,
    explanation:
      'Field observations indicate sub-optimal adherence to mine safety and operational protocols under statutory surveillance.',
  };
}

export class AiService {
  /**
   * Main analysis function: uses Gemini AI if API key is provided, otherwise robust domain NLP classifier.
   */
  static async analyzeInspection(input: AiAnalysisInput): Promise<AiAnalysisResult> {
    const ai = getGeminiClient();

    if (ai) {
      try {
        const prompt = `You are a Senior Mine Safety & Statutory Compliance Inspector for the Ministry of Coal, Government of India.
Analyze the following mine inspection field observation and operational metrics.
Observation: "${input.inspectionText}"
Operational Metrics: ${JSON.stringify(input.operationalData || {})}

Classify the potential statutory violation.
Respond ONLY with valid JSON in this exact structure:
{
  "category": "SAFETY" | "ENVIRONMENT" | "LABOUR" | "PRODUCTION" | "EQUIPMENT" | "OTHER",
  "violationType": "UPPERCASE_SNAKE_CASE_IDENTIFIER",
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "confidence": 0.85,
  "explanation": "Concise factual reason for this finding based on coal mine regulations."
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        const rawText = response.text || '';
        const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        if (parsed.category && parsed.violationType && parsed.severity && typeof parsed.confidence === 'number') {
          return {
            category: parsed.category,
            violationType: parsed.violationType,
            severity: parsed.severity,
            confidence: Math.min(1, Math.max(0, parsed.confidence)),
            explanation: parsed.explanation || 'Identified by AI statutory compliance model.',
          };
        }
      } catch (err: any) {
        console.warn('Gemini API call failed or parsing error, using domain NLP classifier fallback:', err.message);
      }
    }

    // High performance domain NLP engine fallback
    return domainNlpClassifier(input.inspectionText);
  }
}
