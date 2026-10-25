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

  it('should preserve route name in multiple route alternatives', () => {
    const candidateRoutes = [
      { id: 'r1', name: 'Primary Express Highway', distanceMeters: 40000, estimatedDurationSeconds: 2400, trafficDelaySeconds: 100 },
      { id: 'r2', name: 'City Arterial Corridor', distanceMeters: 38000, estimatedDurationSeconds: 3200, trafficDelaySeconds: 800 }
    ];

    const result = rankRoutes(candidateRoutes);
    assert.strictEqual(result.routes[0].name, 'Primary Express Highway');
    assert.strictEqual(result.routes[1].name, 'City Arterial Corridor');
  });

  it('should handle custom weights passed as string values safely without producing NaN', () => {
    const candidateRoutes = [
      { id: 'r1', distanceMeters: 40000, estimatedDurationSeconds: 2400, trafficDelaySeconds: 100 },
      { id: 'r2', distanceMeters: 38000, estimatedDurationSeconds: 3200, trafficDelaySeconds: 800 }
    ];

    const result = rankRoutes(candidateRoutes, { customWeights: { weightTime: '0.6', weightDelay: '0.3', weightDistance: '0.1' } });
    assert.ok(!isNaN(result.routes[0].rankingScore));
    assert.ok(!isNaN(result.routes[1].rankingScore));
    assert.strictEqual(result.routes[0].rankingScore > 0, true);
  });

  /* -------------------------------------------------------------
   * Phase 1 Specification Tests: Route-Ranking & Switch Threshold
   * ------------------------------------------------------------- */

  it('should NOT switch recommendation when alternative route saves less than max(3 min, 10% main route ETA)', () => {
    // Main route: 30 mins (1800s). Threshold is max(180s, 180s) = 180s (3 mins).
    // Alternative route saves only 45s (1755s).
    const candidateRoutes = [
      { id: 'main-arterial', isMainRoute: true, distanceMeters: 20000, estimatedDurationSeconds: 1800, trafficDelaySeconds: 300 },
      { id: 'narrow-bypass', distanceMeters: 22000, estimatedDurationSeconds: 1755, trafficDelaySeconds: 60 }
    ];

    const result = rankRoutes(candidateRoutes);
    // Main route should remain recommended because alternative did not clear the 3-min threshold
    assert.strictEqual(result.recommendedRouteId, 'main-arterial');
    const mainRoute = result.routes.find(r => r.id === 'main-arterial');
    const altRoute = result.routes.find(r => r.id === 'narrow-bypass');
    assert.strictEqual(mainRoute.isRecommended, true);
    assert.strictEqual(altRoute.isRecommended, false);
    assert.strictEqual(result.switchThreshold.switched, false);
    assert.ok(result.switchThreshold.thresholdSeconds >= 180);
    assert.ok(mainRoute.recommendationReasons.some(r => r.includes('stability threshold') || r.includes('Main route remains recommended')));
  });

  it('should switch recommendation when alternative route clears the switch threshold', () => {
    // Main route: 30 mins (1800s). Threshold is max(180s, 180s) = 180s (3 mins).
    // Alternative route saves 5 mins (300s -> 1500s).
    const candidateRoutes = [
      { id: 'main-arterial', isMainRoute: true, distanceMeters: 20000, estimatedDurationSeconds: 1800, trafficDelaySeconds: 400 },
      { id: 'express-ring', distanceMeters: 23000, estimatedDurationSeconds: 1500, trafficDelaySeconds: 50 }
    ];

    const result = rankRoutes(candidateRoutes);
    assert.strictEqual(result.recommendedRouteId, 'express-ring');
    const expressRoute = result.routes.find(r => r.id === 'express-ring');
    const mainRoute = result.routes.find(r => r.id === 'main-arterial');
    assert.strictEqual(expressRoute.isRecommended, true);
    assert.strictEqual(mainRoute.isRecommended, false);
    assert.strictEqual(result.switchThreshold.switched, true);
    assert.strictEqual(result.switchThreshold.timeSavedSeconds, 300);
  });

  it('should enforce 10% threshold on longer trips even when time savings exceeds 3 minutes', () => {
    // Long trip: Main route is 60 mins (3600s).
    // 10% threshold = 360s (6 mins). max(180s, 360s) = 360s.
    // Alternative saves 4 mins (240s -> 3360s).
    // 240s > 180s (3 mins), BUT 240s < 360s (10%). Should NOT switch.
    const candidateRoutes = [
      { id: 'main-highway', isMainRoute: true, distanceMeters: 75000, estimatedDurationSeconds: 3600, trafficDelaySeconds: 500 },
      { id: 'rural-detour', distanceMeters: 78000, estimatedDurationSeconds: 3360, trafficDelaySeconds: 100 }
    ];

    const result = rankRoutes(candidateRoutes);
    assert.strictEqual(result.recommendedRouteId, 'main-highway');
    const mainRoute = result.routes.find(r => r.id === 'main-highway');
    assert.strictEqual(mainRoute.isRecommended, true);
    assert.strictEqual(result.switchThreshold.switched, false);
    assert.strictEqual(result.switchThreshold.thresholdSeconds, 360);
  });

  it('should rank primarily by adjusted ETA without double-counting provider delay', () => {
    // Route 1 takes 2500s total (which includes 600s delay).
    // Route 2 takes 2700s total (which includes 100s delay).
    // Under pure ETA, Route 1 arrives earlier (2500s < 2700s).
    // It should not be double-penalized just because delay is higher if its total arrival is earlier.
    const candidateRoutes = [
      { id: 'route-earlier-arrival', distanceMeters: 30000, estimatedDurationSeconds: 2500, trafficDelaySeconds: 600 },
      { id: 'route-later-arrival', distanceMeters: 30000, estimatedDurationSeconds: 2700, trafficDelaySeconds: 100 }
    ];

    const result = rankRoutes(candidateRoutes);
    assert.strictEqual(result.routes[0].id, 'route-earlier-arrival');
    assert.strictEqual(result.routes[0].adjustedDurationSeconds, 2500);
    assert.strictEqual(result.routes[1].adjustedDurationSeconds, 2700);
  });

  it('should apply verified incident delay only when NOT already reflected in provider ETA', () => {
    // Route 1: 2000s duration. Route 2: 2400s duration.
    // Route 1 intersects an unreflected verified roadblock adding 600s delay (10 mins).
    // Route 1 adjusted duration becomes 2600s.
    // Route 2 now arrives earlier (2400s < 2600s).
    const candidateRoutes = [
      { id: 'route-1', isMainRoute: true, distanceMeters: 20000, estimatedDurationSeconds: 2000, trafficDelaySeconds: 100 },
      { id: 'route-2', distanceMeters: 22000, estimatedDurationSeconds: 2400, trafficDelaySeconds: 50 }
    ];

    const verifiedIncidents = [
      {
        id: 'inc-1',
        type: 'roadblock',
        estimatedImpactMinutes: 10,
        alreadyReflectedInProvider: false,
        affectsRouteIds: ['route-1']
      }
    ];

    const result = rankRoutes(candidateRoutes, { verifiedIncidents });
    const r1 = result.routes.find(r => r.id === 'route-1');
    const r2 = result.routes.find(r => r.id === 'route-2');

    assert.strictEqual(r1.adjustedDurationSeconds, 2600); // 2000 + 600
    assert.strictEqual(r1.incidentDelayAppliedSeconds, 600);
    assert.strictEqual(r2.adjustedDurationSeconds, 2400); // unaffected
    assert.strictEqual(r2.incidentDelayAppliedSeconds, 0);
  });

  it('should NEVER double-count a verified incident if provider ETA already reflects it', () => {
    const candidateRoutes = [
      { id: 'route-1', distanceMeters: 20000, estimatedDurationSeconds: 2600, trafficDelaySeconds: 700 }
    ];

    const verifiedIncidents = [
      {
        id: 'inc-already-in-eta',
        type: 'congestion',
        estimatedImpactMinutes: 10,
        alreadyReflectedInProvider: true,
        affectsRouteIds: ['route-1']
      }
    ];

    const result = rankRoutes(candidateRoutes, { verifiedIncidents });
    const r1 = result.routes[0];
    assert.strictEqual(r1.adjustedDurationSeconds, 2600); // unchanged
    assert.strictEqual(r1.incidentDelayAppliedSeconds, 0);
  });

  it('should include unverified reports with transparency disclaimer without affecting ranking', () => {
    const candidateRoutes = [
      { id: 'route-1', distanceMeters: 15000, estimatedDurationSeconds: 1200, trafficDelaySeconds: 50 },
      { id: 'route-2', distanceMeters: 18000, estimatedDurationSeconds: 1500, trafficDelaySeconds: 50 }
    ];

    const unverifiedReports = [
      { id: 'unv-1', type: 'waterlogging', status: 'Unverified', ageMinutes: 5 }
    ];

    const result = rankRoutes(candidateRoutes, { unverifiedReports });
    assert.strictEqual(result.routes[0].id, 'route-1');
    assert.strictEqual(result.routes[0].adjustedDurationSeconds, 1200);
    assert.ok(Array.isArray(result.unverifiedReports));
    assert.strictEqual(result.unverifiedReports.length, 1);
    assert.ok(result.unverifiedDisclaimer.includes('did not determine the route recommendation'));
  });
});

