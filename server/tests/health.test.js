const { describe, it } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');

describe('GET /api/health', () => {
  it('should return 200 OK with healthy status and metadata', async () => {
    const res = await request(app).get('/api/health');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.status, 'healthy');
    assert.strictEqual(res.body.version, '1.0.0');
    assert.ok(typeof res.body.uptimeSeconds === 'number');
    assert.ok(res.body.provider !== undefined);
  });
});
