const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const {
  createDatabase,
  haversineDistanceMeters,
  DEFAULT_EXPIRIES
} = require('../src/models/db');

describe('Persistent SQLite Storage Layer (db.js)', () => {
  let db;

  beforeEach(() => {
    // Use an isolated in-memory SQLite database for each test
    db = createDatabase(':memory:');
  });

  describe('haversineDistanceMeters', () => {
    it('should return 0 meters for identical coordinates', () => {
      const dist = haversineDistanceMeters(11.0168, 76.9558, 11.0168, 76.9558);
      assert.strictEqual(dist, 0);
    });

    it('should accurately calculate distance between Gandhipuram and Hope College (~4.8 km)', () => {
      // Gandhipuram: 11.0168, 76.9660 | Hope College: 11.0335, 77.0135
      const dist = haversineDistanceMeters(11.0168, 76.9660, 11.0335, 77.0135);
      // Roughly 5400-5600m
      assert.ok(dist >= 5000 && dist <= 6000, `Expected ~5.4km, got ${dist}m`);
    });

    it('should accurately calculate distance for 100m proximity', () => {
      // 0.0009 degrees latitude is ~100 meters
      const dist = haversineDistanceMeters(11.0000, 76.0000, 11.0009, 76.0000);
      assert.ok(dist >= 90 && dist <= 110, `Expected ~100m, got ${dist}m`);
    });
  });

  describe('Incident Reports CRUD & Constraints', () => {
    it('should create an unverified incident report with valid defaults', () => {
      const report = db.createReport({
        type: 'congestion',
        latitude: 11.0168,
        longitude: 76.9660,
        source: 'user'
      });

      assert.ok(report.id && typeof report.id === 'string');
      assert.strictEqual(report.type, 'congestion');
      assert.strictEqual(report.status, 'Unverified');
      assert.strictEqual(report.confirmationCount, 0);
      assert.strictEqual(report.denialCount, 0);
      assert.strictEqual(report.verificationReason, null);
      assert.ok(report.createdAt);
      assert.ok(report.expiresAt);

      // Verify default lifetime for congestion is 15 minutes (900s)
      const created = new Date(report.createdAt).getTime();
      const expires = new Date(report.expiresAt).getTime();
      const lifetimeMinutes = Math.round((expires - created) / 60000);
      assert.strictEqual(lifetimeMinutes, DEFAULT_EXPIRIES.congestion / 60);
    });

    it('should reject invalid incident types', () => {
      assert.throws(() => {
        db.createReport({
          type: 'invalid_alien_invasion',
          latitude: 11.0,
          longitude: 76.0
        });
      }, /CHECK constraint failed|Invalid incident type/);
    });

    it('should retrieve a report by ID', () => {
      const created = db.createReport({
        type: 'roadwork',
        latitude: 11.0200,
        longitude: 76.9700
      });

      const fetched = db.getReportById(created.id);
      assert.ok(fetched);
      assert.strictEqual(fetched.id, created.id);
      assert.strictEqual(fetched.type, 'roadwork');
    });

    it('should find nearby active reports within radius', () => {
      // Create one report in Gandhipuram
      const r1 = db.createReport({
        type: 'congestion',
        latitude: 11.0168,
        longitude: 76.9660
      });

      // Create one report 150m away
      const r2 = db.createReport({
        type: 'signal_failure',
        latitude: 11.0180,
        longitude: 76.9665
      });

      // Create one report in Coimbatore Airport (~10 km away)
      const r3 = db.createReport({
        type: 'waterlogging',
        latitude: 11.0300,
        longitude: 77.0434
      });

      // Query within 500m of Gandhipuram
      const nearby = db.findNearbyReports(11.0168, 76.9660, 500);
      const nearbyIds = nearby.map(r => r.id);

      assert.strictEqual(nearby.length, 2);
      assert.ok(nearbyIds.includes(r1.id));
      assert.ok(nearbyIds.includes(r2.id));
      assert.ok(!nearbyIds.includes(r3.id));
    });

    it('should detect duplicate reports of the same type within 100 meters', () => {
      const original = db.createReport({
        type: 'roadblock',
        latitude: 11.0168,
        longitude: 76.9660
      });

      // Same type 50 meters away
      const duplicate = db.findDuplicateReport('roadblock', 11.0172, 76.9660, 100);
      assert.ok(duplicate, 'Should find duplicate within 100m');
      assert.strictEqual(duplicate.id, original.id);

      // Different type 50 meters away -> NOT a duplicate
      const diffType = db.findDuplicateReport('waterlogging', 11.0172, 76.9660, 100);
      assert.strictEqual(diffType, null);

      // Same type 300 meters away -> NOT a duplicate
      const farAway = db.findDuplicateReport('roadblock', 11.0200, 76.9660, 100);
      assert.strictEqual(farAway, null);
    });
  });

  describe('Incident Voting & Lifecycle Transitions', () => {
    it('should record votes and atomically increment confirmationCount', () => {
      const report = db.createReport({
        type: 'signal_failure',
        latitude: 11.0168,
        longitude: 76.9660
      });

      // User 1 votes YES
      const vote1 = db.castVote(report.id, 'user-key-1', 'yes');
      assert.strictEqual(vote1.vote, 'yes');

      const afterVote1 = db.getReportById(report.id);
      assert.strictEqual(afterVote1.confirmationCount, 1);
      assert.strictEqual(afterVote1.denialCount, 0);
      assert.strictEqual(afterVote1.status, 'Unverified'); // needs 2 confirmations

      // User 2 votes YES -> should trigger automatic verification (Section 4.1)
      db.castVote(report.id, 'user-key-2', 'yes');
      const afterVote2 = db.getReportById(report.id);
      assert.strictEqual(afterVote2.confirmationCount, 2);
      assert.strictEqual(afterVote2.status, 'Verified');
      assert.strictEqual(afterVote2.verificationReason, 'community_confirmations');
    });

    it('should enforce unique constraint: one vote per user per report', () => {
      const report = db.createReport({
        type: 'congestion',
        latitude: 11.0168,
        longitude: 76.9660
      });

      // User 1 votes YES
      db.castVote(report.id, 'user-key-1', 'yes');

      // User 1 changes vote to NO (update, not duplicate row)
      db.castVote(report.id, 'user-key-1', 'no');

      const updated = db.getReportById(report.id);
      assert.strictEqual(updated.confirmationCount, 0);
      assert.strictEqual(updated.denialCount, 1);

      const allVotes = db.getVotesForReport(report.id);
      assert.strictEqual(allVotes.length, 1);
      assert.strictEqual(allVotes[0].vote, 'no');
    });

    it('should support verification via telemetry match', () => {
      const report = db.createReport({
        type: 'congestion',
        latitude: 11.0168,
        longitude: 76.9660
      });

      db.updateReportStatus(report.id, {
        status: 'Verified',
        verificationReason: 'telemetry_match',
        estimatedImpactMinutes: 8
      });

      const updated = db.getReportById(report.id);
      assert.strictEqual(updated.status, 'Verified');
      assert.strictEqual(updated.verificationReason, 'telemetry_match');
      assert.strictEqual(updated.estimatedImpactMinutes, 8);
    });

    it('should expire stale reports when expiry passes', () => {
      const report = db.createReport({
        type: 'congestion',
        latitude: 11.0168,
        longitude: 76.9660,
        expiresAt: new Date(Date.now() - 1000).toISOString() // already expired
      });

      const expiredCount = db.expireStaleReports();
      assert.ok(expiredCount >= 1);

      const fetched = db.getReportById(report.id);
      assert.strictEqual(fetched.status, 'Expired');
    });

    it('should resolve an incident and write audit fields', () => {
      const report = db.createReport({
        type: 'roadwork',
        latitude: 11.0168,
        longitude: 76.9660
      });

      db.resolveReport(report.id, 'Traffic Authority Admin');

      const resolved = db.getReportById(report.id);
      assert.strictEqual(resolved.status, 'Resolved');
      assert.strictEqual(resolved.resolvedBy, 'Traffic Authority Admin');
      assert.ok(resolved.resolvedAt);
    });
  });

  describe('Authority Hotspots & 7-Day Recurrence', () => {
    it('should return ranked active verified incidents and calculate 7-day recurrence', () => {
      // Verified incident with 15 min impact (high impact)
      const rHigh = db.createReport({
        type: 'roadblock',
        latitude: 11.0168,
        longitude: 76.9660,
        status: 'Verified',
        verificationReason: 'community_confirmations',
        confirmationCount: 5,
        estimatedImpactMinutes: 15
      });

      // Verified incident with 5 min impact (lower impact)
      const rLow = db.createReport({
        type: 'congestion',
        latitude: 11.0300,
        longitude: 77.0100,
        status: 'Verified',
        verificationReason: 'telemetry_match',
        confirmationCount: 2,
        estimatedImpactMinutes: 5
      });

      // Unverified incident (should be excluded from authority active hotspots)
      db.createReport({
        type: 'waterlogging',
        latitude: 11.0200,
        longitude: 76.9800,
        status: 'Unverified'
      });

      // Another resolved incident at the same Gandhipuram junction 2 days ago (recurrence check)
      const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();
      db.createReport({
        type: 'congestion',
        latitude: 11.0170, // ~25m away
        longitude: 76.9662,
        status: 'Resolved',
        createdAt: twoDaysAgo
      });

      const hotspots = db.getAuthorityHotspots(7);
      assert.strictEqual(hotspots.length, 2);

      // rHigh should be #1 because impact 15m > 5m
      assert.strictEqual(hotspots[0].id, rHigh.id);
      assert.strictEqual(hotspots[0].estimatedImpactMinutes, 15);
      // Recurrence at Gandhipuram should be 2 (current incident + the one 2 days ago)
      assert.ok(hotspots[0].recurrenceCount >= 2, `Expected recurrence >= 2, got ${hotspots[0].recurrenceCount}`);

      // rLow should be #2
      assert.strictEqual(hotspots[1].id, rLow.id);
    });
  });

  describe('Seeding Demo Corridor', () => {
    it('should seed realistic demo incidents for the Coimbatore corridor without throwing', () => {
      const seeded = db.seedDemoIncidents();
      assert.ok(Array.isArray(seeded));
      assert.ok(seeded.length >= 3);

      const active = db.listActiveReports();
      assert.ok(active.length >= 3);
      assert.ok(active.some(r => r.status === 'Verified'));
      assert.ok(active.some(r => r.status === 'Unverified'));
    });
  });
});
