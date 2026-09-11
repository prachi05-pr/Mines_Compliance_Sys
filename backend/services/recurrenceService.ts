import { Violation } from '../models/Violation.js';
import mongoose, { Types } from 'mongoose';

export interface RecurrenceAnalysis {
  previousOccurrences: number;
  recurrenceLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  lastOccurrence: Date | null;
  daysSinceLastOccurrence: number | null;
}

export class RecurrenceService {
  /**
   * Evaluates historical recurrence of identical or categorized violations in the same mine.
   */
  static async evaluateRecurrence(
    mineId: Types.ObjectId | string,
    category: string,
    violationType: string
  ): Promise<RecurrenceAnalysis> {
    const mineObjId = new mongoose.Types.ObjectId(mineId);

    // Search for confirmed violations for this mine with matching violationType or category
    const previousViolations = await Violation.find({
      mineId: mineObjId,
      $or: [{ violationType }, { category: category as any }],
      status: 'CONFIRMED',
    }).sort({ createdAt: -1 });

    const count = previousViolations.length;

    let recurrenceLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' = 'NONE';
    if (count >= 4) {
      recurrenceLevel = 'HIGH';
    } else if (count >= 2) {
      recurrenceLevel = 'MEDIUM';
    } else if (count === 1) {
      recurrenceLevel = 'LOW';
    }

    const last = previousViolations.length > 0 ? previousViolations[0].createdAt : null;
    const daysSinceLast = last ? Math.floor((Date.now() - new Date(last).getTime()) / (1000 * 60 * 60 * 24)) : null;

    return {
      previousOccurrences: count,
      recurrenceLevel,
      lastOccurrence: last,
      daysSinceLastOccurrence: daysSinceLast,
    };
  }
}
