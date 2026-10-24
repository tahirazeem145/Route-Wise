const { describe, it } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');

describe('Traffic Tile Proxy Endpoints', () => {
  it('GET /api/traffic/status should return status and layer info', async () => {
    const res = await request(app).get('/api/traffic/status');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.trafficLayersAvailable));
    assert.ok(res.body.trafficLayersAvailable.includes('flow'));
  });

  it('GET /api/traffic/tiles/7/92/58.png should return image/png', async () => {
    const res = await request(app).get('/api/traffic/tiles/7/92/58.png');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['content-type'], 'image/png');
    assert.ok(res.body);
  });

  it('GET /api/traffic/incidents/7/92/58.png should return image/png', async () => {
    const res = await request(app).get('/api/traffic/incidents/7/92/58.png');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['content-type'], 'image/png');
    assert.ok(res.body);
  });
});
