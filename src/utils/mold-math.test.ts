import { describe, it, expect } from 'vitest';
import {
  getEfficiency,
  getTimeForEfficiency,
  getElapsedMinutes,
  calculateTotalFiber,
  getFiberEffectiveness,
  calculateMealTimeOffset,
} from './mold-math';

interface Medication {
  id: string;
  name: string;
  description: string;
  minTime: number;
  optimalTime: number;
  relativeTo?: string;
  efficiency?: { [time: number]: number };
}

describe('Mold.tsx math functions', () => {
  describe('getEfficiency', () => {
    const testMed: Medication = {
      id: 'batch1',
      name: 'Test Med',
      description: 'test',
      minTime: 0,
      optimalTime: 30,
      efficiency: { 0: 60, 10: 75, 20: 88, 30: 100 },
    };

    it('returns 0 for elapsed time before first data point', () => {
      expect(getEfficiency(testMed, -5)).toBe(0);
    });

    it('returns exact value at data points', () => {
      expect(getEfficiency(testMed, 0)).toBe(60);
      expect(getEfficiency(testMed, 10)).toBe(75);
      expect(getEfficiency(testMed, 30)).toBe(100);
    });

    it('interpolates between data points', () => {
      expect(getEfficiency(testMed, 5)).toBe(68); // (60 + 75) / 2 ≈ 67.5, rounded to 68
      expect(getEfficiency(testMed, 15)).toBe(82); // interpolated between 75 and 88
    });

    it('returns last value for elapsed >= last data point', () => {
      expect(getEfficiency(testMed, 40)).toBe(100);
      expect(getEfficiency(testMed, 60)).toBe(100);
    });

    it('returns 100 for medication with no efficiency data', () => {
      const medNoData: Medication = {
        id: 'test',
        name: 'test',
        description: 'test',
        minTime: 0,
        optimalTime: 30,
      };
      expect(getEfficiency(medNoData, 15)).toBe(100);
    });
  });

  describe('getTimeForEfficiency', () => {
    const testMed: Medication = {
      id: 'batch1',
      name: 'Test Med',
      description: 'test',
      minTime: 0,
      optimalTime: 30,
      efficiency: { 0: 60, 10: 75, 20: 88, 30: 100 },
    };

    it('returns first time point for eff <= first efficiency', () => {
      expect(getTimeForEfficiency(testMed, 50)).toBe(0); // 50 <= 60
    });

    it('returns last time point for eff >= last efficiency', () => {
      expect(getTimeForEfficiency(testMed, 100)).toBe(30);
      expect(getTimeForEfficiency(testMed, 120)).toBe(30);
    });

    it('inverse-interpolates time for intermediate efficiency', () => {
      const result = getTimeForEfficiency(testMed, 75);
      expect(result).toBeGreaterThanOrEqual(10);
      expect(result).toBeLessThanOrEqual(10);
    });

    it('respects minTime floor', () => {
      const medWithMinTime: Medication = {
        id: 'test',
        name: 'test',
        description: 'test',
        minTime: 5,
        optimalTime: 30,
        efficiency: { 0: 60, 10: 75, 20: 88, 30: 100 },
      };
      const result = getTimeForEfficiency(medWithMinTime, 50);
      expect(result).toBeGreaterThanOrEqual(5);
    });

    it('handles fallback: linear scale for no efficiency data', () => {
      const medNoEffData: Medication = {
        id: 'test',
        name: 'test',
        description: 'test',
        minTime: 0,
        optimalTime: 100,
      };
      expect(getTimeForEfficiency(medNoEffData, 50)).toBe(50);
      expect(getTimeForEfficiency(medNoEffData, 100)).toBe(100);
    });
  });

  describe('getElapsedMinutes', () => {
    it('calculates elapsed time correctly', () => {
      const start = new Date('2025-01-01T10:00:00Z');
      const end = new Date('2025-01-01T10:30:00Z');
      expect(getElapsedMinutes(start, end)).toBe(30);
    });

    it('returns 0 if times are same', () => {
      const time = new Date('2025-01-01T10:00:00Z');
      expect(getElapsedMinutes(time, time)).toBe(0);
    });

    it('handles negative elapsed (time went backwards)', () => {
      const start = new Date('2025-01-01T10:30:00Z');
      const end = new Date('2025-01-01T10:00:00Z');
      expect(getElapsedMinutes(start, end)).toBe(-30);
    });
  });

  describe('calculateTotalFiber', () => {
    it('sums fiber from all three sources', () => {
      // 2 protein shakes (5g each) + 1 phgg (5g) + 2 chia seeds (2.5g each)
      expect(calculateTotalFiber(2, 1, 2)).toBe(2 * 5 + 1 * 5 + 2 * 2.5);
      expect(calculateTotalFiber(2, 1, 2)).toBe(20);
    });

    it('returns 0 when all counts are 0', () => {
      expect(calculateTotalFiber(0, 0, 0)).toBe(0);
    });

    it('handles individual sources', () => {
      expect(calculateTotalFiber(1, 0, 0)).toBe(5); // 1 protein shake
      expect(calculateTotalFiber(0, 1, 0)).toBe(5); // 1 phgg
      expect(calculateTotalFiber(0, 0, 1)).toBe(2.5); // 1 chia seed
    });
  });

  describe('getFiberEffectiveness', () => {
    it('returns None for < 5g', () => {
      expect(getFiberEffectiveness(4)).toEqual({
        level: 'None',
        description: 'Not enough fiber. Aim for at least 5g.',
      });
    });

    it('returns Minimal for 5–9g', () => {
      expect(getFiberEffectiveness(7)).toEqual({
        level: 'Minimal',
        description: 'Barely moves stool. High chance toxins sit longer. ~10–20% effective for clearance.',
      });
    });

    it('returns Slight for 10–14g', () => {
      expect(getFiberEffectiveness(12)).toEqual({
        level: 'Slight',
        description: 'Slight help. Still slow transit for most people. ~30% effective.',
      });
    });

    it('returns Sweet Spot for 30–34g', () => {
      expect(getFiberEffectiveness(32)).toEqual({
        level: 'Sweet Spot',
        description: 'Sweet spot for most. Good speed, good consistency. ~90%.',
      });
    });

    it('returns Excellent for >= 35g', () => {
      expect(getFiberEffectiveness(40)).toEqual({
        level: 'Excellent',
        description: 'Still good if tolerated. Marginal gains over 30 g. ~92–95%.',
      });
    });
  });

  describe('calculateMealTimeOffset', () => {
    it('calculates offset at 0% efficiency', () => {
      expect(calculateMealTimeOffset(0, 0.75, 30)).toBe(30);
    });

    it('calculates offset at 100% efficiency', () => {
      // At 100% efficiency with 0.75 remaining fraction: 30 * (1 - 1.0 * 0.75) = 30 * 0.25 = 7.5 ≈ 8
      expect(calculateMealTimeOffset(100, 0.75, 30)).toBe(8);
    });

    it('calculates offset at 50% efficiency', () => {
      const result = calculateMealTimeOffset(50, 0.75, 30);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(30);
    });

    it('respects different remaining medication efficiency fractions', () => {
      const at75 = calculateMealTimeOffset(50, 0.75, 30);
      const at90 = calculateMealTimeOffset(50, 0.9, 30);
      const at100 = calculateMealTimeOffset(50, 1.0, 30);

      // Higher fraction → more reduction → lower offset
      expect(at100).toBeLessThan(at90);
      expect(at90).toBeLessThan(at75);
    });

    it('handles custom base wait minutes', () => {
      const base30 = calculateMealTimeOffset(50, 0.75, 30);
      const base60 = calculateMealTimeOffset(50, 0.75, 60);
      expect(base60).toBeGreaterThan(base30);
    });
  });
});
