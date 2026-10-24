const { describe, it, before, beforeEach } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const { getDatabase } = require('../src/models/db');
const { _resetRateLimits } = require('../src/controllers/incidentController');

describe('F4 Community Incident Reports API Endpoints', () => {
  let db;

  before(() => {
    db = getDatabase();
  });

  beforeEach(() => {
    _resetRateLimits();
    db.rawDb.exec('DELETE FROM incident_votes; DELETE FROM incident_reports;');
  });

  describe('POST /api/reports', () => {
    it('should return 400 when incident type is invalid or missing', async () => {
      const res = await request(app)
        .post('/api/reports')
        .send({
          type: 'ufo_sighting',
          latitude: 11.0168,
          longitude: 76.9660,
          anonymousUserKey: 'user-key-test'
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.error.message.includes('Invalid incident type'));
    });

    it('should return 400 when latitude or longitude is missing or out of bounds', async () => {
      const res = await request(app)
        .post('/api/reports')
        .send({
          type: 'congestion',
          latitude: 95.0, // invalid latitude > 90
          longitude: 76.9660,
          anonymousUserKey: 'user-key-test'
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
    });

    it('should return 400 when anonymousUserKey is missing', async () => {
      const res = await request(app)
        .post('/api/reports')
        .send({
          type: 'congestion',
          latitude: 11.0168,
          longitude: 76.9660
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
    });

    it('should create an unverified incident report and return receipt', async () => {
      const res = await request(app)
        .post('/api/reports')
        .send({
          type: 'signal_failure',
          latitude: 11.0250,
          longitude: 76.9800,
          anonymousUserKey: 'user-reporter-1'
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      const data = res.body;
      assert.ok(data.id);
      assert.strictEqual(data.status, 'Unverified');
      assert.strictEqual(data.type, 'signal_failure');
      assert.strictEqual(data.confirmationCount, 0);
      assert.ok(data.createdAt);
      assert.ok(data.expiresAt);
    });

    it('should merge duplicate report within 100m of the same type and increment confirmations', async () => {
      // 1. First report at location
      const res1 = await request(app)
        .post('/api/reports')
        .send({
          type: 'waterlogging',
          latitude: 11.0400,
          longitude: 77.0200,
          anonymousUserKey: 'user-reporter-a'
        });
      assert.strictEqual(res1.status, 201);
      const originalId = res1.body.id;

      // 2. Second report 30m away of same type by another user
      const res2 = await request(app)
        .post('/api/reports')
        .send({
          type: 'waterlogging',
          latitude: 11.0402, // ~22m away
          longitude: 77.0201,
          anonymousUserKey: 'user-reporter-b'
        });

      assert.strictEqual(res2.status, 200);
      assert.strictEqual(res2.body.success, true);
      assert.strictEqual(res2.body.isDuplicateMerged, true);
      assert.strictEqual(res2.body.id, originalId);
      assert.strictEqual(res2.body.confirmationCount, 1);
    });
  });

  describe('GET /api/reports/nearby', () => {
    it('should return 400 when lat or lng query parameter is missing', async () => {
      const res = await request(app)
        .get('/api/reports/nearby?lat=11.0168'); // missing lng

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
    });

    it('should return nearby active incidents with status, age, and distance', async () => {
      // Seed an incident at Gandhipuram
      const createRes = await request(app)
        .post('/api/reports')
        .send({
          type: 'congestion',
          latitude: 11.0168,
          longitude: 76.9660,
          anonymousUserKey: 'user-nearby-test'
        });
      assert.strictEqual(createRes.status, 201);

      const res = await request(app)
        .get('/api/reports/nearby?lat=11.0170&lng=76.9662&radiusM=1000');

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.reports));
      assert.ok(res.body.reports.length > 0);

      const item = res.body.reports[0];
      assert.ok(item.id);
      assert.ok(item.type);
      assert.ok(item.status);
      assert.ok(typeof item.distanceMeters === 'number');
      assert.ok(typeof item.ageMinutes === 'number');
    });
  });

  describe('POST /api/reports/:id/votes', () => {
    it('should return 400 for invalid vote value', async () => {
      const res = await request(app)
        .post('/api/reports/some-id/votes')
        .send({
          vote: 'maybe',
          anonymousUserKey: 'user-voter-1'
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
    });

    it('should record confirmation vote and transition to Verified at 2 confirmations', async () => {
      // Create new unverified report
      const rep = await request(app)
        .post('/api/reports')
        .send({
          type: 'roadblock',
          latitude: 11.0500,
          longitude: 76.9900,
          anonymousUserKey: 'reporter-unique-vote'
        });
      const reportId = rep.body.id;

      // Voter 1 casts YES
      const v1 = await request(app)
        .post(`/api/reports/${reportId}/votes`)
        .send({
          vote: 'yes',
          anonymousUserKey: 'voter-alpha'
        });
      assert.strictEqual(v1.status, 200);
      assert.strictEqual(v1.body.confirmationCount, 1);
      assert.strictEqual(v1.body.status, 'Unverified');

      // Voter 2 casts YES -> auto-verifies
      const v2 = await request(app)
        .post(`/api/reports/${reportId}/votes`)
        .send({
          vote: 'yes',
          anonymousUserKey: 'voter-beta'
        });
      assert.strictEqual(v2.status, 200);
      assert.strictEqual(v2.body.confirmationCount, 2);
      assert.strictEqual(v2.body.status, 'Verified');
      assert.strictEqual(v2.body.verificationReason, 'community_confirmations');
    });

    it('should update existing vote without creating duplicate row when user votes again', async () => {
      const rep = await request(app)
        .post('/api/reports')
        .send({
          type: 'procession',
          latitude: 11.0600,
          longitude: 76.9800,
          anonymousUserKey: 'reporter-re-vote'
        });
      const reportId = rep.body.id;

      // User votes YES
      await request(app)
        .post(`/api/reports/${reportId}/votes`)
        .send({
          vote: 'yes',
          anonymousUserKey: 'user-switch-vote'
        });

      // User changes mind and votes NO
      const v2 = await request(app)
        .post(`/api/reports/${reportId}/votes`)
        .send({
          vote: 'no',
          anonymousUserKey: 'user-switch-vote'
        });

      assert.strictEqual(v2.status, 200);
      assert.strictEqual(v2.body.confirmationCount, 0);
      assert.strictEqual(v2.body.denialCount, 1);
    });
  });
});

