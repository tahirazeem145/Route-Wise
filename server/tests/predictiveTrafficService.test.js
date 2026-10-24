const { describe, it } = require('node:test');
const assert = require('node:assert');
const { predictRouteTraffic, getDiurnalTrafficFactor } = require('../src/services/predictiveTrafficService');

describe('Predictive Traffic ML Service', () => {
  it('should return continuous diurnal traffic factors between 0.1 and 1.0', () => {
    // 08:30 AM morning rush
    const morningRush = new Date('2026-10-24T08:30:00');
    const factorMorning = getDiurnalTrafficFactor(morningRush);
    assert.ok(factorMorning >= 0.8, `Expected morning rush factor >= 0.8, got ${factorMorning}`);

    // 02:00 AM late night
    const lateNight = new Date('2026-10-24T02:00:00');
    const factorNight = getDiurnalTrafficFactor(lateNight);
    assert.ok(factorNight <= 0.3, `Expected night factor <= 0.3, got ${factorNight}`);
  });

  it('should generate a 4-step forecast timeline (+0m, +15m, +30m, +45m)', () => {
    const route = {
      name: 'Primary Express Highway',
      distanceMeters: 200000,
      estimatedDurationSeconds: 12000,
      trafficDelaySeconds: 1800
    };

    const forecast = predictRouteTraffic(route);
    assert.strictEqual(forecast.horizonMinutes, 15);
    assert.strictEqual(forecast.timeline.length, 4);
    assert.strictEqual(forecast.timeline[0].offsetMinutes, 0);
    assert.strictEqual(forecast.timeline[1].offsetMinutes, 15);
    assert.strictEqual(forecast.timeline[2].offsetMinutes, 30);
    assert.strictEqual(forecast.timeline[3].offsetMinutes, 45);
  });

  it('should classify traffic trend, delta, and provide an actionable AI recommendation', () => {
    const route = {
      name: 'City Arterial Corridor',
      distanceMeters: 50000,
      estimatedDurationSeconds: 4000,
      trafficDelaySeconds: 1200
    };

    const forecast = predictRouteTraffic(route, { currentTime: new Date('2026-10-24T17:00:00') });
    assert.ok(['worsening', 'stable', 'clearing'].includes(forecast.trend));
    assert.ok(typeof forecast.recommendation === 'string' && forecast.recommendation.length > 10);
    assert.ok(forecast.confidenceScore >= 0.80 && forecast.confidenceScore <= 1.0);
    assert.ok(typeof forecast.predictedDelayMinutes === 'number');
  });

  it('should handle zero delay routes gracefully without negative values', () => {
    const route = {
      name: 'Clear Rural Route',
      distanceMeters: 80000,
      estimatedDurationSeconds: 4800,
      trafficDelaySeconds: 0
    };

    const forecast = predictRouteTraffic(route);
    assert.ok(forecast.predictedDelaySeconds >= 0);
    assert.ok(forecast.predictedDurationSeconds >= 4800);
  });
});
