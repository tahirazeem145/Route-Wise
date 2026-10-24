const { describe, it } = require('node:test');
const assert = require('node:assert');
const { rankRoutes } = require('../src/services/routeRankingService');

describe('Route Ranking Engine Service', () => {
  it('should rank route with lower travel time higher when distances are similar', () => {
    const candidateRoutes = [
      { id: 'route-A', distanceMeters: 50000, estimatedDurationSeconds: 4200, trafficDelaySeconds: 600 },
      { id: 'route-B', distanceMeters: 51000, estimatedDurationSeconds: 2800, trafficDelaySeconds: 100 }
    ];

    const result = rankRoutes(candidateRoutes);
    assert.strictEqual(result.recommendedRouteId, 'route-B');
    assert.strictEqual(result.routes[0].id, 'route-B');
    assert.strictEqual(result.routes[0].rank, 1);
    assert.strictEqual(result.routes[0].isRecommended, true);
    assert.strictEqual(result.routes[1].id, 'route-A');
    assert.strictEqual(result.routes[1].rank, 2);
  });

  it('should penalize routes with high traffic delay', () => {
    // Both 50 km, but route-1 has 25 mins delay while route-2 has 2 mins delay
    const candidateRoutes = [
      { id: 'congested', distanceMeters: 50000, estimatedDurationSeconds: 4500, trafficDelaySeconds: 1800 },
      { id: 'clear', distanceMeters: 55000, estimatedDurationSeconds: 3200, trafficDelaySeconds: 120 }
    ];

    const result = rankRoutes(candidateRoutes);
    assert.strictEqual(result.recommendedRouteId, 'clear');
    assert.ok(result.routes[0].recommendationReasons.length > 0);
  });

  it('should handle missing or null traffic delay data without crashing', () => {
    const candidateRoutes = [
      { id: 'r1', distanceMeters: 30000, estimatedDurationSeconds: 2000, trafficDelaySeconds: null },
      { id: 'r2', distanceMeters: 35000, estimatedDurationSeconds: 2500 }
    ];

    const result = rankRoutes(candidateRoutes);
    assert.ok(result.recommendedRouteId !== null);
    assert.strictEqual(result.routes.length, 2);
    assert.strictEqual(result.routes[0].trafficDelaySeconds, 0);
  });

  it('should handle missing geometry gracefully', () => {
    const candidateRoutes = [
      { id: 'r1', distanceMeters: 20000, estimatedDurationSeconds: 1500, trafficDelaySeconds: 0, geometry: null }
    ];

    const result = rankRoutes(candidateRoutes);
    assert.strictEqual(result.recommendedRouteId, 'r1');
    assert.deepStrictEqual(result.routes[0].geometry, []);
  });

  it('should handle single route correctly as sole alternative with 100 score', () => {
    const candidateRoutes = [
      { id: 'only-one', distanceMeters: 10000, estimatedDurationSeconds: 900, trafficDelaySeconds: 60 }
    ];

    const result = rankRoutes(candidateRoutes);
    assert.strictEqual(result.recommendedRouteId, 'only-one');
    assert.strictEqual(result.routes[0].rankingScore, 100);
    assert.strictEqual(result.routes[0].isRecommended, true);
  });

  it('should return deterministic results for identical inputs', () => {
    const candidateRoutes = [
      { id: 'r1', distanceMeters: 40000, estimatedDurationSeconds: 3000, trafficDelaySeconds: 200 },
      { id: 'r2', distanceMeters: 45000, estimatedDurationSeconds: 2900, trafficDelaySeconds: 100 }
    ];

    const run1 = rankRoutes(candidateRoutes);
    const run2 = rankRoutes(candidateRoutes);
    assert.deepStrictEqual(run1, run2);
  });
});
