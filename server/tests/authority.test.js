const { describe, it, before, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { getDatabase } = require('../src/models/db');

describe('F5 Authority Hotspot & Incident Resolution API Suite', () => {
  let db;

  before(() => {
    db = getDatabase();
  });

  beforeEach(() => {
    // Clean tables for predictable test runs
    db.rawDb.exec('DELETE FROM incident_votes; DELETE FROM incident_reports;');
  });

  describe('GET /api/authority/hotspots - Auth Protection', () => {
    it('should return 401 when authority credentials are missing', async () => {
      const res = await request(app)
        .get('/api/authority/hotspots')
        .expect(401);

      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error.code, 'UNAUTHORIZED_AUTHORITY');
    });

    it('should return 401 when invalid role header is passed', async () => {
      const res = await request(app)
        .get('/api/authority/hotspots')
        .set('X-Authority-Role', 'guest')
        .expect(401);

      assert.strictEqual(res.body.success, false);
    });

    it('should return 200 and ranked hotspots when valid admin role is provided', async () => {
      // Create seed verified incidents
      db.createReport({
        id: 'inc-auth-1',
        type: 'roadblock',
        latitude: 11.0185,
        longitude: 76.9672,
        status: 'Verified',
        verificationReason: 'community_confirmations',
        confirmationCount: 5,
        estimatedImpactMinutes: 20
      });

      db.createReport({
        id: 'inc-auth-2',
        type: 'congestion',
        latitude: 11.0200,
        longitude: 76.9700,
        status: 'Verified',
        verificationReason: 'telemetry_speed_drop',
        confirmationCount: 3,
        estimatedImpactMinutes: 10
      });

      // An unverified incident should not appear in authority verified hotspots
      db.createReport({
        id: 'inc-auth-unverified',
        type: 'waterlogging',
        latitude: 11.0300,
        longitude: 76.9800,
        status: 'Unverified',
        confirmationCount: 1
      });

      const res = await request(app)
        .get('/api/authority/hotspots?windowDays=7')
        .set('X-Authority-Role', 'admin')
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.count, 2);
      assert.strictEqual(res.body.hotspots.length, 2);

      // Ranked by estimatedImpactMinutes DESC: 20 min before 10 min
      assert.strictEqual(res.body.hotspots[0].id, 'inc-auth-1');
      assert.strictEqual(res.body.hotspots[0].estimatedImpactMinutes, 20);
      assert.ok(res.body.hotspots[0].recurrenceCount >= 1);
      assert.strictEqual(res.body.hotspots[0].recurrenceWindowDays, 7);
      assert.strictEqual(res.body.hotspots[1].id, 'inc-auth-2');
    });
  });

  describe('POST /api/authority/reports/:id/resolve - Incident Resolution', () => {
    it('should return 401 if unauthenticated', async () => {
      await request(app)
        .post('/api/authority/reports/inc-123/resolve')
        .send({ resolvedBy: 'Officer Rao' })
        .expect(401);
    });

    it('should return 404 for non-existent incident', async () => {
      const res = await request(app)
        .post('/api/authority/reports/inc-non-existent/resolve')
        .set('X-Authority-Role', 'admin')
        .send({ resolvedBy: 'Officer Rao' })
        .expect(404);

      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error.code, 'REPORT_NOT_FOUND');
    });

    it('should resolve active incident and update audit fields', async () => {
      db.createReport({
        id: 'inc-to-clear',
        type: 'roadwork',
        latitude: 11.0250,
        longitude: 76.9650,
        status: 'Verified',
        confirmationCount: 4
      });

      const res = await request(app)
        .post('/api/authority/reports/inc-to-clear/resolve')
        .set('X-Authority-Role', 'admin')
        .set('X-Authority-Officer-Id', 'OFFICER-4412')
        .send({ resolvedBy: 'Inspector Vijay' })
        .expect(200);

      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.resolvedId, 'inc-to-clear');
      assert.strictEqual(res.body.status, 'Resolved');
      assert.strictEqual(res.body.resolvedBy, 'Inspector Vijay');
      assert.ok(res.body.resolvedAt);

      // Verify in database that status changed to Resolved
      const updated = db.getReportById('inc-to-clear');
      assert.strictEqual(updated.status, 'Resolved');
      assert.strictEqual(updated.resolvedBy, 'Inspector Vijay');
      assert.ok(updated.resolvedAt);

      // Should no longer appear in active verified hotspots
      const hotspotsRes = await request(app)
        .get('/api/authority/hotspots')
        .set('X-Authority-Role', 'admin')
        .expect(200);

      assert.strictEqual(hotspotsRes.body.count, 0);
    });
  });
});
