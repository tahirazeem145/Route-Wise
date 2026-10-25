import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDistance,
  formatDuration,
  formatDelay,
  formatTime,
  getRouteComparison
} from '../src/utils/formatters.js';

describe('Client Formatters Utility Test Suite', () => {
  describe('formatDistance', () => {
    it('should format meters below 1 km with m unit', () => {
      assert.equal(formatDistance(750), '750 m');
    });

    it('should format kilometers with one decimal place', () => {
      assert.equal(formatDistance(212119), '212.1 km');
      assert.equal(formatDistance(1500), '1.5 km');
    });

    it('should handle zero and falsy distances gracefully', () => {
      assert.equal(formatDistance(0), '0 m');
      assert.equal(formatDistance(null), '0 km');
      assert.equal(formatDistance(undefined), '0 km');
    });
  });

  describe('formatDuration', () => {
    it('should format durations under 1 hour in minutes', () => {
      assert.equal(formatDuration(900), '15 min');
      assert.equal(formatDuration(2700), '45 min');
    });

    it('should format durations over 1 hour in hours and minutes', () => {
      assert.equal(formatDuration(14841), '4h 7m');
      assert.equal(formatDuration(7200), '2h');
    });

    it('should handle zero and falsy seconds gracefully', () => {
      assert.equal(formatDuration(0), '0 min');
      assert.equal(formatDuration(null), '0 min');
    });
  });

  describe('formatDelay', () => {
    it('should return null for zero or negative delays', () => {
      assert.equal(formatDelay(0), null);
      assert.equal(formatDelay(-10), null);
      assert.equal(formatDelay(null), null);
    });

    it('should format positive delay in minutes', () => {
      assert.equal(formatDelay(600), '+10 min delay');
      assert.equal(formatDelay(840), '+14 min delay');
    });
  });

  describe('formatTime', () => {
    it('should format ISO timestamp string to local time', () => {
      const formatted = formatTime('2026-10-24T12:00:00.000Z');
      assert.ok(typeof formatted === 'string' && formatted.length > 0);
    });

    it('should handle falsy and invalid timestamps gracefully', () => {
      assert.equal(formatTime(''), '');
      assert.equal(formatTime(null), '');
      assert.equal(formatTime('invalid-date-string'), 'invalid-date-string');
    });
  });

  describe('getRouteComparison', () => {
    const mockRoutes = [
      {
        id: 'route-1',
        rank: 1,
        isRecommended: true,
        rankingScore: 88,
        estimatedDurationSeconds: 14400, // 4h
        distanceMeters: 210000,
        trafficDelaySeconds: 0
      },
      {
        id: 'route-2',
        rank: 2,
        isRecommended: false,
        rankingScore: 72,
        estimatedDurationSeconds: 15300, // 4h 15m (+15m)
        distanceMeters: 235000, // +25km
        trafficDelaySeconds: 900
      }
    ];

    it('should generate fastest pick summary for recommended route #1', () => {
      const comp = getRouteComparison(mockRoutes[0], mockRoutes);
      assert.ok(comp.badge.includes('#1'));
      assert.ok(comp.summary.includes('faster') || comp.summary.includes('shorter') || comp.summary.includes('travel time'));
      assert.ok(Array.isArray(comp.comparisonChips));
      assert.ok(comp.comparisonChips.length > 0);
    });

    it('should generate delta explanation for alternative route #2', () => {
      const comp = getRouteComparison(mockRoutes[1], mockRoutes);
      assert.ok(comp.badge.includes('#2'));
      assert.ok(comp.summary.length > 0);
    });

    it('should handle single route gracefully as sole corridor', () => {
      const comp = getRouteComparison(mockRoutes[0], [mockRoutes[0]]);
      assert.ok(comp.badge.includes('Sole Route'));
    });
  });
});
