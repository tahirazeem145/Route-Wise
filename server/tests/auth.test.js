const { describe, it } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');

describe('API Key Authentication Middleware', () => {
  it('should reject request when X-API-Key header is missing', async () => {
    const res = await request(app)
      .get('/api/developer/status');
    
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'MISSING_API_KEY');
  });

  it('should reject request when X-API-Key is invalid', async () => {
    const res = await request(app)
      .get('/api/developer/status')
      .set('X-API-Key', 'invalid_random_key_12345');

    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'INVALID_API_KEY');
  });

  it('should authenticate successfully with valid dev key', async () => {
    const res = await request(app)
      .get('/api/developer/status')
      .set('X-API-Key', 'sra_dev_hackathon_demo_key_2026');

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.auth.authenticated, true);
  });
});
