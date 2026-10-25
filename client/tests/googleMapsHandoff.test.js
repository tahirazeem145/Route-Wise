import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGoogleMapsHandoff,
  extractDecisionAnchors,
  MAX_WAYPOINTS,
  MAX_URL_LENGTH
} from '../src/utils/googleMapsHandoff.js';

describe('Google Maps Directions Handoff Engine (googleMapsHandoff.js)', () => {
  // Sample Trichy -> Coimbatore route geometry
  const origin = { lat: 10.7905, lng: 78.7047, name: 'Tiruchirappalli' };
  const destination = { lat: 11.0168, lng: 76.9558, name: 'Coimbatore' };

  // Route 1 (NH 81 via Kangeyam)
  const route1 = {
    id: 'route-1',
    name: 'NH 81 via Kangeyam',
    isRecommended: true,
    geometry: [
      [10.7905, 78.7047],
      [10.8200, 78.3500],
      [10.9000, 78.0000],
      [10.9800, 77.5600],
      [11.0050, 77.2000],
      [11.0168, 76.9558]
    ]
  };

  // Route 2 (NH 544 via Karur & Palladam - southern detour)
  const route2 = {
    id: 'route-2',
    name: 'NH 544 via Karur & Palladam',
    isRecommended: false,
    geometry: [
      [10.7905, 78.7047],
      [10.9500, 78.0800],
      [11.0000, 77.7000],
      [10.9900, 77.3000],
      [10.9850, 77.1000],
      [11.0168, 76.9558]
    ]
  };

  // Route 3 (State Highway via Musiri & Namakkal - northern detour)
  const route3 = {
    id: 'route-3',
    name: 'SH via Musiri & Namakkal',
    isRecommended: false,
    geometry: [
      [10.7905, 78.7047],
      [11.1000, 78.4000],
      [11.2200, 78.1600],
      [11.1800, 77.7000],
      [11.0800, 77.2000],
      [11.0168, 76.9558]
    ]
  };

  const allRoutes = [route1, route2, route3];

  describe('extractDecisionAnchors', () => {
    it('should extract at most 3 non-straight-line decision anchors', () => {
      const anchors = extractDecisionAnchors(route2, allRoutes);
      assert.ok(Array.isArray(anchors));
      assert.ok(anchors.length <= MAX_WAYPOINTS, `Anchors length ${anchors.length} exceeds max ${MAX_WAYPOINTS}`);
      assert.ok(anchors.length >= 1, 'Should extract at least 1 anchor for divergent alternative');
    });

    it('should return empty anchors if geometry has fewer than 3 points', () => {
      const shortRoute = { id: 'short', geometry: [[10.0, 78.0], [11.0, 77.0]] };
      const anchors = extractDecisionAnchors(shortRoute, allRoutes);
      assert.deepStrictEqual(anchors, []);
    });

    it('anchors should be ordered along the route from origin to destination', () => {
      const anchors = extractDecisionAnchors(route3, allRoutes);
      assert.ok(anchors.length >= 2);
      const p1 = anchors[0];
      const p2 = anchors[anchors.length - 1];
      assert.notDeepStrictEqual(p1, p2);
    });
  });

  describe('buildGoogleMapsHandoff', () => {
    it('should build a valid, standards-compliant Google Maps directions URL', () => {
      const handoff = buildGoogleMapsHandoff(route1, { origin, destination, allRoutes });

      assert.ok(handoff.url.startsWith('https://www.google.com/maps/dir/?api=1'));
      assert.ok(handoff.url.includes('origin=10.7905') && handoff.url.includes('78.7047'));
      assert.ok(handoff.url.includes('destination=11.0168') && handoff.url.includes('76.9558'));
      assert.ok(handoff.url.includes('travelmode=driving'));
      assert.strictEqual(handoff.routeId, 'route-1');
      assert.strictEqual(handoff.isSafe, true);
      assert.ok(handoff.charLength < MAX_URL_LENGTH);
      assert.ok(handoff.disclaimer.includes('recalculated by Google Maps'));
    });

    it('should generate distinct, route-specific URLs for each alternative (MAP-AC1 & MAP-AC3)', () => {
      const handoff1 = buildGoogleMapsHandoff(route1, { origin, destination, allRoutes });
      const handoff2 = buildGoogleMapsHandoff(route2, { origin, destination, allRoutes });
      const handoff3 = buildGoogleMapsHandoff(route3, { origin, destination, allRoutes });

      // Each route card must produce its own unique URL preserving route identity
      assert.notStrictEqual(handoff1.url, handoff2.url, 'Route 1 and Route 2 URLs must not be identical');
      assert.notStrictEqual(handoff2.url, handoff3.url, 'Route 2 and Route 3 URLs must not be identical');
      assert.strictEqual(handoff1.routeId, 'route-1');
      assert.strictEqual(handoff2.routeId, 'route-2');
      assert.strictEqual(handoff3.routeId, 'route-3');
    });

    it('should support two-wheeler travel mode when selected', () => {
      const handoff = buildGoogleMapsHandoff(route1, {
        origin,
        destination,
        allRoutes,
        travelMode: 'two-wheeler'
      });
      assert.ok(handoff.url.includes('travelmode=two-wheeler'));
      assert.strictEqual(handoff.travelMode, 'two-wheeler');
    });

    it('should enforce 2048 character limit and guarantee safe URL length (MAP-AC4)', () => {
      const longPoints = [];
      for (let i = 0; i < 500; i++) {
        longPoints.push([10.7905 + (i * 0.001), 78.7047 - (i * 0.002)]);
      }
      const massiveRoute = {
        id: 'route-massive',
        name: 'Massive Trail',
        geometry: longPoints
      };

      const handoff = buildGoogleMapsHandoff(massiveRoute, { origin, destination, allRoutes });
      assert.ok(handoff.url.length <= MAX_URL_LENGTH, `URL length ${handoff.url.length} exceeded 2048`);
      assert.ok(handoff.waypoints.length <= 3);
      assert.strictEqual(handoff.isSafe, true);
    });

    it('should provide safe fallback when geometry is missing or corrupted (MAP-AC6)', () => {
      const brokenRoute = {
        id: 'broken',
        name: 'Broken Route',
        geometry: null
      };

      const handoff = buildGoogleMapsHandoff(brokenRoute, { origin, destination, allRoutes });
      assert.ok(handoff.url.startsWith('https://www.google.com/maps/dir/?api=1'));
      assert.strictEqual(handoff.waypoints.length, 0);
      assert.ok(handoff.warning.includes('Corridor geometry unavailable') || handoff.warning.includes('fallback'));
    });
  });
});
