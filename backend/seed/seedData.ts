import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Mine } from '../models/Mine.js';
import { Compliance } from '../models/Compliance.js';
import { Contractor } from '../models/Contractor.js';
import { Inspection } from '../models/Inspection.js';
import { Violation } from '../models/Violation.js';
import { Alert } from '../models/Alert.js';
import { hashPassword } from '../services/authService.js';

/**
 * SYNTHETIC DEMO DATA SEED SCRIPT
 * Ministry of Coal - Problem Statement 26024 (SIH 2026)
 *
 * All records generated below are strictly SYNTHETIC DEMO DATA for development and demonstration.
 */
export async function seedDatabase(force = false) {
  try {
    const existingUsers = await User.countDocuments();
    const existingFormIVA = await Inspection.countDocuments({ formType: 'FORM_IV_A' });
    if (existingUsers > 0 && existingFormIVA > 0 && !force) {
      console.log('Database already contains records with Form IV-A. Skipping seed.');
      return;
    }

    console.log('--- Initializing SYNTHETIC DEMO DATA generation ---');

    // Clean existing collections
    await Promise.all([
      User.deleteMany({}),
      Mine.deleteMany({}),
      Compliance.deleteMany({}),
      Contractor.deleteMany({}),
      Inspection.deleteMany({}),
      Violation.deleteMany({}),
      Alert.deleteMany({}),
    ]);

    // 1. Create Synthetic Coal Mines
    const mineAId = new mongoose.Types.ObjectId();
    const mineBId = new mongoose.Types.ObjectId();
    const mineCId = new mongoose.Types.ObjectId();
    const mineDId = new mongoose.Types.ObjectId();

    const mines = [
      new Mine({
        _id: mineAId,
        name: 'Dhanbad Horizon Open-Cast Mine',
        mineCode: 'JH-DHN-001',
        location: 'Jharia Coalfield, Sector 4',
        state: 'Jharkhand',
        district: 'Dhanbad',
        mineType: 'Open-Cast',
        productionTarget: 1200,
        productionActual: 850,
        operationalStatus: 'ACTIVE',
        complianceScore: 72,
        riskLevel: 'HIGH',
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      }),
      new Mine({
        _id: mineBId,
        name: 'Raniganj Deep Seam Underground Colliery',
        mineCode: 'WB-RNG-002',
        location: 'Asansol Coal Belt',
        state: 'West Bengal',
        district: 'Paschim Bardhaman',
        mineType: 'Underground',
        productionTarget: 950,
        productionActual: 930,
        operationalStatus: 'ACTIVE',
        complianceScore: 94,
        riskLevel: 'LOW',
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      }),
      new Mine({
        _id: mineCId,
        name: 'Singrauli Super Open-Cast Block',
        mineCode: 'MP-SNG-003',
        location: 'Northern Coalfield Perimeter',
        state: 'Madhya Pradesh',
        district: 'Singrauli',
        mineType: 'Open-Cast',
        productionTarget: 1600,
        productionActual: 1050,
        operationalStatus: 'MAINTENANCE',
        complianceScore: 54,
        riskLevel: 'CRITICAL',
        createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
      }),
      new Mine({
        _id: mineDId,
        name: 'Korba Central Coalfield Seam-V',
        mineCode: 'CG-KRB-004',
        location: 'Dipka Area',
        state: 'Chhattisgarh',
        district: 'Korba',
        mineType: 'Open-Cast',
        productionTarget: 1400,
        productionActual: 1320,
        operationalStatus: 'ACTIVE',
        complianceScore: 84,
        riskLevel: 'MEDIUM',
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      }),
    ];

    await Mine.insertMany(mines);
    console.log('✓ Synthetic Mines seeded (4 units)');

    // 2. Create Users with Demarcated RBAC & Mine Assignment
    const officerId = new mongoose.Types.ObjectId();
    const managerId = new mongoose.Types.ObjectId();

    const users = [
      new User({
        _id: officerId,
        name: 'Rajesh Sharma (Mine Safety Officer)',
        email: 'officer@demo.com',
        password: hashPassword('Demo@123'),
        role: 'MINE_OFFICER',
        mineIds: [mineAId], // Assigned specifically to Mine A (Dhanbad)
        createdAt: new Date(),
      }),
      new User({
        _id: managerId,
        name: 'Pooja Verma (Corporate General Manager)',
        email: 'manager@demo.com',
        password: hashPassword('Demo@123'),
        role: 'CORPORATE_MANAGER',
        mineIds: [mineAId, mineBId, mineCId, mineDId], // Multi-mine enterprise scope
        createdAt: new Date(),
      }),
    ];

    await User.insertMany(users);
    console.log('✓ Synthetic Users seeded (Officer, Corporate Manager)');

    // 3. Create Statutory Compliance Records
    const compliances = [
      new Compliance({
        mineId: mineAId,
        category: 'SAFETY',
        requirement: 'Mandatory Quarterly Slope Stability Radar Surveillance (DGMS Tech Cir. 04/2021)',
        status: 'NON_COMPLIANT',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Due soon
        lastUpdated: new Date(),
        notes: 'High bench tension crack monitoring pending geotechnical clearance.',
      }),
      new Compliance({
        mineId: mineAId,
        category: 'ENVIRONMENT',
        requirement: 'Effluent Treatment Plant (ETP) Continuous PH & TSS Telemetry Link to SPCB',
        status: 'OVERDUE',
        dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // Overdue
        lastUpdated: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        notes: 'Discharge telemetry sensor failed calibration inspection.',
      }),
      new Compliance({
        mineId: mineAId,
        category: 'LABOUR',
        requirement: 'PME (Periodical Medical Examination) of 100% Active Underground and Pit Workforce',
        status: 'PARTIALLY_COMPLIANT',
        dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        lastUpdated: new Date(),
        notes: '78 of 120 shift operators completed audiometry and spirometry.',
      }),
      new Compliance({
        mineId: mineAId,
        category: 'EQUIPMENT',
        requirement: 'Automatic Fire Detection and Suppression System (AFDSS) in 240T Dumpers',
        status: 'COMPLIANT',
        dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        lastUpdated: new Date(),
        notes: 'All 8 dumpers certified by OEM engineer.',
      }),
      // Mine B Compliances
      new Compliance({
        mineId: mineBId,
        category: 'SAFETY',
        requirement: 'Tele-monitoring of Methane CH4 & Carbon Monoxide in Return Airway Seam #3',
        status: 'COMPLIANT',
        dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        lastUpdated: new Date(),
        notes: 'Gas sensors zero-drift calibrated and continuous telemetry active.',
      }),
      new Compliance({
        mineId: mineBId,
        category: 'LABOUR',
        requirement: 'Mines Vocational Training (VT) Certification for 100% Contractual Loaders',
        status: 'COMPLIANT',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        lastUpdated: new Date(),
        notes: 'Annual refresher batch completed.',
      }),
      // Mine C Compliances
      new Compliance({
        mineId: mineCId,
        category: 'SAFETY',
        requirement: 'Overburden Dump Height-to-Width Ratio and Terraced Bench Slope Stability',
        status: 'OVERDUE',
        dueDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        lastUpdated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        notes: 'Dump slope exceeds 38-degree angle of repose without terracing.',
      }),
      new Compliance({
        mineId: mineCId,
        category: 'ENVIRONMENT',
        requirement: 'Water Mist Cannon High-Pressure Continuous Suppression along 5km Coal Haul Road',
        status: 'NON_COMPLIANT',
        dueDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        lastUpdated: new Date(),
        notes: 'Pumping pipeline breach reported near weighbridge #2.',
      }),
    ];

    await Compliance.insertMany(compliances);
    console.log('✓ Synthetic Statutory Compliance records seeded');

    // 4. Create Mining Contractors
    const contractors = [
      new Contractor({
        mineId: mineAId,
        name: 'Hindustan Heavy Earthmoving Works Ltd',
        company: 'HHEW Infra Consortia',
        category: 'Heavy Earth Moving & Excavation',
        workforceCount: 145,
        status: 'ACTIVE',
        complianceStatus: 'PARTIALLY_COMPLIANT',
      }),
      new Contractor({
        mineId: mineAId,
        name: 'Eastern Coal Logistics & Transport Co.',
        company: 'ECLT Fleet Solutions',
        category: 'Haulage & Rake Loading',
        workforceCount: 88,
        status: 'ACTIVE',
        complianceStatus: 'COMPLIANT',
      }),
      new Contractor({
        mineId: mineBId,
        name: 'Apex Strata Underground Drilling Corp',
        company: 'Apex Geotech International',
        category: 'Roof Bolting & Longwall Drilling',
        workforceCount: 65,
        status: 'ACTIVE',
        complianceStatus: 'COMPLIANT',
      }),
      new Contractor({
        mineId: mineCId,
        name: 'Singrauli Pit Blasting & Explosives Crew',
        company: 'Shakti Industrial Blasting Ltd',
        category: 'Controlled Rock Blasting',
        workforceCount: 42,
        status: 'ACTIVE',
        complianceStatus: 'NON_COMPLIANT',
      }),
    ];

    await Contractor.insertMany(contractors);
    console.log('✓ Synthetic Contractors seeded');

    // 5. Create Realistic Inspections (Form IV-A – Sirdar's Daily Report)
    const pastInspection1Id = new mongoose.Types.ObjectId();
    const pastInspection2Id = new mongoose.Types.ObjectId();

    const inspections = [
      new Inspection({
        _id: pastInspection1Id,
        mineId: mineAId,
        officerId: officerId,
        formType: 'FORM_IV_A',
        shift: '1ST',
        submissionTime: '07:15',
        inspectionDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
        inspectionType: "Form IV-A – Sirdar's Daily Report",
        checklist: [],
        observations: [
          {
            section: 'ROOF_AND_SIDES',
            number: '01',
            title: 'Roof and Sides',
            description: 'Condition of roof and sides in the working places and roadways',
            status: 'ISSUE_OBSERVED',
            details: 'Spalling observed along South Dip 4 development heading. Side support prop spacing exceeded 1.5m statutory allowance under Coal Mines Regulations 2017.',
          },
          {
            section: 'VENTILATION',
            number: '02',
            title: 'Ventilation',
            description: 'State of ventilation and presence of noxious or inflammable gases',
            status: 'SATISFACTORY',
            details: 'Air velocity measured at 48 m/min in return split. Methane CH4 detected at 0.12%, well within permissible statutory safety limits.',
          },
          {
            section: 'COAL_DUST',
            number: '03',
            title: 'Coal Dust',
            description: 'Condition of coal dust and stone dusting',
            status: 'ISSUE_OBSERVED',
            details: 'Heavy fine coal dust deposition on belt conveyor gallery transfer chute #2. Water spray manifold nozzles choked; stone dusting overdue by 120m.',
          },
          {
            section: 'FENCING',
            number: '04',
            title: 'Fencing',
            description: 'State of fencing around dangerous places',
            status: 'SATISFACTORY',
            details: 'Disused unventilated gallery fencing and statutory danger notice boards inspected and found secure with locking chains.',
          },
          {
            section: 'WATER',
            number: '05',
            title: 'Water',
            description: 'Any abnormal seepage of water',
            status: 'SATISFACTORY',
            details: 'Normal sump collection; auxiliary submersible pump operating in regular automated cycle with no water logging.',
          },
          {
            section: 'SUPPORT',
            number: '06',
            title: 'Support',
            description: 'Availability and condition of timber/supports',
            status: 'ISSUE_OBSERVED',
            details: 'Roof bolting density inadequate near junction 3. Three mechanical anchor bolts showed signs of torque slippage.',
          },
          {
            section: 'DANGERS_AND_ACTIONS',
            number: '07',
            title: 'Dangers & Actions',
            description: 'Any other danger observed and action taken to remove the same',
            status: 'ISSUE_OBSERVED',
            details: 'Observed contract laborers operating near highwall without mandatory reflective vests and steel-toe protective boots. Work halted immediately; issued personal protective equipment and notified Overman.',
          },
          {
            section: 'ACCIDENTS',
            number: '08',
            title: 'Accidents',
            description: 'Any accident or dangerous occurrence during the shift',
            status: 'NO_ACCIDENT',
            details: 'No accidents or reportable dangerous occurrences reported during shift hours.',
          },
        ],
        operationalData: {
          production: 820,
          attendance: 72,
          downtimeHours: 14,
          safetyIncidents: 1,
        },
        status: 'COMPLETED',
        aiAnalysis: {
          category: 'SAFETY',
          violationType: 'PPE_NON_COMPLIANCE',
          severity: 'HIGH',
          confidence: 0.94,
          explanation:
            'Field personnel operating in heavy excavation zone without statutory personal protective equipment (boots, high-vis vests), directly violating CMR 2017 Regulation 182.',
          recurrence: {
            previousOccurrences: 3,
            recurrenceLevel: 'HIGH',
            lastOccurrence: new Date(Date.now() - 36 * 24 * 60 * 60 * 1000),
          },
          anomaly: {
            detected: true,
            metric: 'downtimeHours',
            currentValue: 14,
            baselineValue: 4,
            deviationPercentage: 250,
          },
        },
        riskScore: 78,
        riskLevel: 'CRITICAL',
        createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
      }),
      new Inspection({
        _id: pastInspection2Id,
        mineId: mineAId,
        officerId: officerId,
        formType: 'FORM_IV_A',
        shift: '2ND',
        submissionTime: '15:20',
        inspectionDate: new Date(Date.now() - 36 * 24 * 60 * 60 * 1000),
        inspectionType: "Form IV-A – Sirdar's Daily Report",
        checklist: [],
        observations: [
          {
            section: 'ROOF_AND_SIDES',
            number: '01',
            title: 'Roof and Sides',
            description: 'Condition of roof and sides in the working places and roadways',
            status: 'SATISFACTORY',
            details: 'Roof and side strata sound throughout travelling roadways and working faces.',
          },
          {
            section: 'VENTILATION',
            number: '02',
            title: 'Ventilation',
            description: 'State of ventilation and presence of noxious or inflammable gases',
            status: 'SATISFACTORY',
            details: 'Ventilation brattice screens intact. Air quantity 1,450 cu m/min. No inflammable gas detected with flame safety lamp.',
          },
          {
            section: 'COAL_DUST',
            number: '03',
            title: 'Coal Dust',
            description: 'Condition of coal dust and stone dusting',
            status: 'SATISFACTORY',
            details: 'Water mist suppression operating continuously. Incombustible dust barrier zones verified.',
          },
          {
            section: 'FENCING',
            number: '04',
            title: 'Fencing',
            description: 'State of fencing around dangerous places',
            status: 'SATISFACTORY',
            details: 'Substation and goaf isolation fencings verified in good order.',
          },
          {
            section: 'WATER',
            number: '05',
            title: 'Water',
            description: 'Any abnormal seepage of water',
            status: 'SATISFACTORY',
            details: 'Dry seam conditions; drainage channels clear with no water accumulation.',
          },
          {
            section: 'SUPPORT',
            number: '06',
            title: 'Support',
            description: 'Availability and condition of timber/supports',
            status: 'SATISFACTORY',
            details: 'Steel arch supports and resin bolts secure and conforming to Systematic Support Rules (SSR).',
          },
          {
            section: 'DANGERS_AND_ACTIONS',
            number: '07',
            title: 'Dangers & Actions',
            description: 'Any other danger observed and action taken to remove the same',
            status: 'ISSUE_OBSERVED',
            details: 'Noted PPE non-compliance among night shift coal haulers missing certified safety helmets and respirators. Issued verbal warning and replenished safety gear.',
          },
          {
            section: 'ACCIDENTS',
            number: '08',
            title: 'Accidents',
            description: 'Any accident or dangerous occurrence during the shift',
            status: 'NO_ACCIDENT',
            details: 'No accidents or injuries reported during shift hours.',
          },
        ],
        operationalData: {
          production: 980,
          attendance: 88,
          downtimeHours: 6,
          safetyIncidents: 0,
        },
        status: 'COMPLETED',
        aiAnalysis: {
          category: 'SAFETY',
          violationType: 'PPE_NON_COMPLIANCE',
          severity: 'MEDIUM',
          confidence: 0.88,
          explanation: 'Night shift personnel missing protective gear.',
          recurrence: {
            previousOccurrences: 2,
            recurrenceLevel: 'MEDIUM',
            lastOccurrence: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          },
        },
        riskScore: 54,
        riskLevel: 'HIGH',
        createdAt: new Date(Date.now() - 36 * 24 * 60 * 60 * 1000),
      }),
    ];

    await Inspection.insertMany(inspections);
    console.log('✓ Synthetic Inspections seeded');

    // 6. Create Violations (Both CONFIRMED and AI_SUGGESTED)
    const confirmedViolationId = new mongoose.Types.ObjectId();
    const violations = [
      new Violation({
        _id: confirmedViolationId,
        mineId: mineAId,
        inspectionId: pastInspection1Id,
        category: 'SAFETY',
        violationType: 'PPE_NON_COMPLIANCE',
        description: 'Mandatory PPE violation: Workers shoveling near heavy excavator without steel-toe boots & high-vis apparel.',
        severity: 'HIGH',
        confidence: 0.94,
        status: 'CONFIRMED',
        confirmedBy: officerId,
        confirmedAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
      }),
      new Violation({
        mineId: mineAId,
        inspectionId: pastInspection2Id,
        category: 'SAFETY',
        violationType: 'PPE_NON_COMPLIANCE',
        description: 'Prior violation: Lack of certified safety helmets and respirators in pit zone.',
        severity: 'MEDIUM',
        confidence: 0.88,
        status: 'CONFIRMED',
        confirmedBy: officerId,
        confirmedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 36 * 24 * 60 * 60 * 1000),
      }),
      new Violation({
        mineId: mineCId,
        inspectionId: pastInspection1Id,
        category: 'ENVIRONMENT',
        violationType: 'DUST_SUPPRESSION_FAILURE',
        description: 'Continuous particulate emissions exceeding 500 ug/m3 due to broken dust mist manifold.',
        severity: 'CRITICAL',
        confidence: 0.92,
        status: 'CONFIRMED',
        confirmedBy: officerId,
        confirmedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      }),
    ];

    await Violation.insertMany(violations);
    console.log('✓ Synthetic Violations seeded');

    // 7. Create Alerts
    const alerts = [
      new Alert({
        userId: officerId,
        mineId: mineAId,
        type: 'CRITICAL_RISK',
        title: 'Critical Risk Threshold Exceeded',
        message: 'Dhanbad Horizon Open-Cast calculated risk score reached 78/100 (CRITICAL). Statutory intervention mandated.',
        severity: 'CRITICAL',
        relatedEntityId: pastInspection1Id,
        isRead: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      }),
      new Alert({
        userId: officerId,
        mineId: mineAId,
        type: 'RECURRING_VIOLATION',
        title: 'Recurring Violation: PPE NON COMPLIANCE',
        message: 'Category SAFETY has recorded 3 recurring infractions over the last 60 days. Systemic workforce auditing required.',
        severity: 'HIGH',
        relatedEntityId: confirmedViolationId,
        isRead: false,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      }),
      new Alert({
        userId: officerId,
        mineId: mineAId,
        type: 'COMPLIANCE_OVERDUE',
        title: 'Statutory Compliance Overdue: ETP Telemetry',
        message: 'Effluent Treatment Plant telemetry connection to SPCB is 10 days overdue.',
        severity: 'HIGH',
        isRead: false,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      }),
      new Alert({
        userId: officerId,
        mineId: mineAId,
        type: 'DOWNTIME_ANOMALY',
        title: 'Severe Equipment Downtime Spike',
        message: 'Equipment downtime reached 14 hrs (250% above shift tolerance baseline of 4 hrs).',
        severity: 'HIGH',
        relatedEntityId: pastInspection1Id,
        isRead: true,
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      }),
      new Alert({
        userId: null,
        mineId: mineCId,
        type: 'CRITICAL_RISK',
        title: 'Singrauli Super Colliery Risk Escalation',
        message: 'Mine risk status escalated to CRITICAL due to unaddressed terraced bench slope stability non-compliance.',
        severity: 'CRITICAL',
        isRead: false,
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      }),
    ];

    await Alert.insertMany(alerts);
    console.log('✓ Synthetic Alerts seeded (5 alerts)');
    console.log('--- SYNTHETIC DEMO DATA INITIALIZATION COMPLETE ---');
  } catch (err: any) {
    console.error('Error during synthetic database seed:', err.message);
  }
}
