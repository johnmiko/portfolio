/**
 * Extracted math functions from Mold component
 */

interface Medication {
  id: string;
  name: string;
  description: string;
  minTime: number; // minutes
  optimalTime: number; // minutes
  relativeTo?: string; // id of previous med
  efficiency?: { [time: number]: number }; // time in minutes -> efficiency %
}

/**
 * Calculate efficiency at a given elapsed time using linear interpolation
 */
export function getEfficiency(med: Medication, elapsed: number): number {
  if (!med.efficiency) return 100;

  const times = Object.keys(med.efficiency).map(Number).sort((a, b) => a - b);

  // If elapsed is before the first time point, return 0
  if (elapsed < times[0]) return 0;

  // If elapsed is at or beyond the last time point, return the last efficiency
  if (elapsed >= times[times.length - 1]) return med.efficiency[times[times.length - 1]];

  // Find the two time points to interpolate between
  for (let i = 0; i < times.length - 1; i++) {
    const time1 = times[i];
    const time2 = times[i + 1];
    const efficiency1 = med.efficiency[time1];
    const efficiency2 = med.efficiency[time2];

    if (elapsed >= time1 && elapsed < time2) {
      // Linear interpolation: y = y1 + (x - x1) * (y2 - y1) / (x2 - x1)
      const interpolatedEfficiency = efficiency1 + (elapsed - time1) * (efficiency2 - efficiency1) / (time2 - time1);
      return Math.round(interpolatedEfficiency);
    }
  }

  return 0;
}

/**
 * Get the time (in minutes) needed to reach a target efficiency
 */
export function getTimeForEfficiency(med: Medication, eff: number): number {
  if (!med.efficiency) {
    // Fallback: scale linearly between minTime (0 eff) and optimalTime (100 eff)
    const minutes = Math.round((eff / 100) * (med.optimalTime || med.minTime || 0));
    return Math.max(med.minTime || 0, minutes);
  }

  const points = Object.keys(med.efficiency)
    .map(Number)
    .sort((a, b) => a - b);
  const effAt = (t: number) => med.efficiency![t];

  // If target efficiency is below first point, clamp to first time
  if (eff <= effAt(points[0])) {
    return Math.max(points[0], med.minTime || 0);
  }
  // If target efficiency is above/equal to last point, clamp to last time
  if (eff >= effAt(points[points.length - 1])) {
    return Math.max(points[points.length - 1], med.minTime || 0);
  }

  // Find segment where eff1 <= eff < eff2 and inverse-interpolate time
  for (let i = 0; i < points.length - 1; i++) {
    const t1 = points[i];
    const t2 = points[i + 1];
    const e1 = effAt(t1);
    const e2 = effAt(t2);
    if (eff >= e1 && eff <= e2) {
      const time = t1 + ((eff - e1) * (t2 - t1)) / (e2 - e1);
      return Math.max(Math.round(time), med.minTime || 0);
    }
  }

  return Math.max(med.minTime || 0, points[points.length - 1]);
}

/**
 * Calculate elapsed time in minutes between two dates
 */
export function getElapsedMinutes(startTime: Date, currentTime: Date): number {
  return (currentTime.getTime() - startTime.getTime()) / 1000 / 60;
}

/**
 * Calculate total fiber in grams from supplement counts
 */
export function calculateTotalFiber(
  proteinShakeCount: number,
  phggCount: number,
  chiaSeedsCount: number
): number {
  return proteinShakeCount * 5 + phggCount * 5 + chiaSeedsCount * 2.5;
}

/**
 * Determine fiber effectiveness level based on total grams
 */
export function getFiberEffectiveness(total: number): { level: string; description: string } {
  if (total < 5) return { level: 'None', description: 'Not enough fiber. Aim for at least 5g.' };
  if (total < 10) return { level: 'Minimal', description: 'Barely moves stool. High chance toxins sit longer. ~10–20% effective for clearance.' };
  if (total < 15) return { level: 'Slight', description: 'Slight help. Still slow transit for most people. ~30% effective.' };
  if (total < 20) return { level: 'Starting', description: 'Minimum where things start working. Some benefit. ~50% effective.' };
  if (total < 25) return { level: 'Decent', description: 'Decent. Many people okay here. Still suboptimal with binders. ~65–70%.' };
  if (total < 30) return { level: 'Solid', description: 'Solid baseline. Low reabsorption risk. ~80%.' };
  if (total < 35) return { level: 'Sweet Spot', description: 'Sweet spot for most. Good speed, good consistency. ~90%.' };
  return { level: 'Excellent', description: 'Still good if tolerated. Marginal gains over 30 g. ~92–95%.' };
}

/**
 * Calculate meal time minutes offset based on efficiency and remaining medication efficiency
 */
export function calculateMealTimeOffset(
  efficiencyPercent: number,
  remainingMedicationEfficiencyFraction: number,
  baseWaitMinutes: number = 30
): number {
  const effFraction = efficiencyPercent / 100;
  const remaining = Math.max(0, Math.round(baseWaitMinutes * (1 - effFraction * remainingMedicationEfficiencyFraction)));
  return remaining;
}
