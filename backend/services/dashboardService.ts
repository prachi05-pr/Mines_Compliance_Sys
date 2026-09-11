import { Mine } from '../models/Mine.js';
import { Compliance } from '../models/Compliance.js';
import { Inspection } from '../models/Inspection.js';
import { Violation } from '../models/Violation.js';
import { Alert } from '../models/Alert.js';
import mongoose, { Types } from 'mongoose';

export class DashboardService {
  /**
   * Mine Officer Dashboard: metrics and charts scoped to authorized mine(s).
   */
  static async getOfficerDashboard(mineIds: Types.ObjectId[] | string[]) {
    const objectIds = mineIds.map((id) => new mongoose.Types.ObjectId(id));
    const primaryMineId = objectIds[0];

    const mine = primaryMineId ? await Mine.findById(primaryMineId) : null;
    const complianceScore = mine?.complianceScore || 0;
    const riskLevel = mine?.riskLevel || 'LOW';

    // Counts from MongoDB
    const [
      openViolationsCount,
      pendingInspectionsCount,
      criticalAlertsCount,
      recentAlerts,
      recentInspections,
      violationsByCategoryAgg,
      compliances,
    ] = await Promise.all([
      Violation.countDocuments({
        mineId: { $in: objectIds },
        status: { $in: ['AI_SUGGESTED', 'CONFIRMED'] },
      }),
      Inspection.countDocuments({
        mineId: { $in: objectIds },
        status: { $in: ['DRAFT', 'AI_ANALYZED', 'UNDER_REVIEW'] },
      }),
      Alert.countDocuments({
        mineId: { $in: objectIds },
        severity: 'CRITICAL',
        isRead: false,
      }),
      Alert.find({ mineId: { $in: objectIds } })
        .sort({ createdAt: -1 })
        .limit(6),
      Inspection.find({ mineId: { $in: objectIds } })
        .populate('mineId', 'name mineCode')
        .sort({ createdAt: -1 })
        .limit(6),
      Violation.aggregate([
        { $match: { mineId: { $in: objectIds } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
      Compliance.find({ mineId: { $in: objectIds } }),
    ]);

    // Format violations by category
    const categoryMap: Record<string, number> = {
      SAFETY: 0,
      ENVIRONMENT: 0,
      LABOUR: 0,
      PRODUCTION: 0,
      EQUIPMENT: 0,
      OTHER: 0,
    };
    violationsByCategoryAgg.forEach((v) => {
      if (categoryMap[v._id] !== undefined) categoryMap[v._id] = v.count;
    });

    const violationsByCategory = Object.keys(categoryMap).map((cat) => ({
      category: cat,
      count: categoryMap[cat],
    }));

    // Compliance breakdown
    const complianceStatusCounts = {
      COMPLIANT: 0,
      PARTIALLY_COMPLIANT: 0,
      NON_COMPLIANT: 0,
      OVERDUE: 0,
    };
    compliances.forEach((c) => {
      if (complianceStatusCounts[c.status] !== undefined) {
        complianceStatusCounts[c.status]++;
      }
    });

    // Recent inspections timeline for charts
    const inspectionsTrend = await Inspection.find({ mineId: { $in: objectIds } })
      .sort({ createdAt: -1 })
      .limit(8)
      .select('inspectionDate riskScore operationalData status');

    const timelineData = inspectionsTrend
      .map((insp) => ({
        date: new Date(insp.inspectionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        riskScore: insp.riskScore,
        production: insp.operationalData?.production || 0,
        attendance: insp.operationalData?.attendance || 0,
        downtime: insp.operationalData?.downtimeHours || 0,
      }))
      .reverse();

    return {
      mine: mine
        ? {
            id: mine._id,
            name: mine.name,
            mineCode: mine.mineCode,
            location: mine.location,
            state: mine.state,
            operationalStatus: mine.operationalStatus,
            complianceScore: mine.complianceScore,
            riskLevel: mine.riskLevel,
            productionTarget: mine.productionTarget,
            productionActual: mine.productionActual,
          }
        : null,
      kpis: {
        complianceScore,
        riskLevel,
        openViolationsCount,
        pendingInspectionsCount,
        criticalAlertsCount,
      },
      charts: {
        violationsByCategory,
        complianceStatusCounts,
        timelineData,
      },
      recentAlerts,
      recentInspections,
    };
  }

  /**
   * Corporate Manager Dashboard: multi-mine comparisons, risk distribution, organization aggregation.
   */
  static async getCorporateDashboard(accessibleMineIds?: Types.ObjectId[] | string[]) {
    const query = accessibleMineIds && accessibleMineIds.length > 0
      ? { _id: { $in: accessibleMineIds.map((id) => new mongoose.Types.ObjectId(id)) } }
      : {};

    const mines = await Mine.find(query);
    const mineIds = mines.map((m) => m._id);

    const [totalViolations, totalInspections, recentAlerts, violationsByCategoryAgg] = await Promise.all([
      Violation.countDocuments({ mineId: { $in: mineIds } }),
      Inspection.countDocuments({ mineId: { $in: mineIds } }),
      Alert.find({ mineId: { $in: mineIds } })
        .populate('mineId', 'name mineCode')
        .sort({ createdAt: -1 })
        .limit(8),
      Violation.aggregate([
        { $match: { mineId: { $in: mineIds } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
    ]);

    const totalMines = mines.length;
    const avgCompliance =
      totalMines > 0 ? Math.round(mines.reduce((acc, m) => acc + (m.complianceScore || 0), 0) / totalMines) : 0;
    const highRiskMines = mines.filter((m) => m.riskLevel === 'HIGH').length;
    const criticalRiskMines = mines.filter((m) => m.riskLevel === 'CRITICAL').length;
    const mediumRiskMines = mines.filter((m) => m.riskLevel === 'MEDIUM').length;
    const lowRiskMines = mines.filter((m) => m.riskLevel === 'LOW').length;

    // Charts: Mine Risk & Compliance Comparison
    const mineComparison = mines.map((m) => ({
      id: m._id,
      name: m.name,
      mineCode: m.mineCode,
      complianceScore: m.complianceScore,
      riskLevel: m.riskLevel,
      target: m.productionTarget,
      actual: m.productionActual,
      status: m.operationalStatus,
    }));

    const categoryDistribution = violationsByCategoryAgg.map((v) => ({
      category: v._id,
      count: v.count,
    }));

    return {
      kpis: {
        totalMines,
        avgCompliance,
        highRiskMines,
        criticalRiskMines,
        mediumRiskMines,
        lowRiskMines,
        totalViolations,
        totalInspections,
      },
      charts: {
        mineComparison,
        categoryDistribution,
        riskDistribution: [
          { name: 'Low Risk', value: lowRiskMines, color: '#16a34a' },
          { name: 'Medium Risk', value: mediumRiskMines, color: '#eab308' },
          { name: 'High Risk', value: highRiskMines, color: '#f97316' },
          { name: 'Critical Risk', value: criticalRiskMines, color: '#dc2626' },
        ],
      },
      recentAlerts,
      mines: mineComparison,
    };
  }
}
