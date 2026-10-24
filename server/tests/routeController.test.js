const { describe, it } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');

const VALID_KEY = 'sra_dev_hackathon_demo_key_2026';

describe('Route Controller Endpoints', () => {
  it('should return 400 when source is missing', async () => {
    const res = await request(app)
      .post('/api/routes/recommend')
      .set('X-API-Key', VALID_KEY)
      .send({ destination: 'Coimbatore' });

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.error.code, 'MISSING_SOURCE');
  });

  it('should return 400 when destination is missing', async () => {
    const res = await request(app)
      .post('/api/routes/recommend')
      .set('X-API-Key', VALID_KEY)
      .send({ source: 'Tiruchirappalli' });

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.error.code, 'MISSING_DESTINATION');
  });

  it('should return 400 when body is empty', async () => {
    const res = await request(app)
      .post('/api/routes/recommend')
      .set('X-API-Key', VALID_KEY)
      .send({});

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.error.code, 'INVALID_REQUEST_BODY');
  });

  it('should return 400 when source and destination are identical', async () => {
    const res = await request(app)
      .post('/api/routes/recommend')
      .set('X-API-Key', VALID_KEY)
      .send({ source: 'Chennai', destination: 'Chennai' });

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.error.code, 'IDENTICAL_LOCATIONS');
  });

  it('should return 200 with ranked routes between Tiruchirappalli and Coimbatore', async () => {
    const res = await request(app)
      .post('/api/routes/recommend')
      .set('X-API-Key', VALID_KEY)
      .send({
        source: 'Tiruchirappalli',
        destination: 'Coimbatore'
      });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.source.coordinates.lat);
    assert.ok(res.body.source.coordinates.lng);
    assert.ok(res.body.destination.coordinates.lat);
    assert.ok(res.body.destination.coordinates.lng);
    assert.ok(res.body.recommendedRouteId);
    assert.ok(Array.isArray(res.body.routes));
    assert.ok(res.body.routes.length > 0);

    const recommended = res.body.routes.find(r => r.id === res.body.recommendedRouteId);
    assert.ok(recommended);
    assert.strictEqual(recommended.isRecommended, true);
    assert.ok(recommended.recommendationReasons.length > 0);
    assert.ok(Array.isArray(recommended.geometry));
  });

  it('should support direct coordinate objects as source and destination', async () => {
    const res = await request(app)
      .post('/api/routes/recommend')
      .set('X-API-Key', VALID_KEY)
      .send({
        source: { lat: 10.7905, lng: 78.7047, name: 'Trichy Junction' },
        destination: { lat: 11.0168, lng: 76.9558, name: 'Coimbatore Central' }
      });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.source.name, 'Trichy Junction');
    assert.strictEqual(res.body.destination.name, 'Coimbatore Central');
  });

  it('should refresh routes successfully via POST /api/routes/refresh', async () => {
    const res = await request(app)
      .post('/api/routes/refresh')
      .set('X-API-Key', VALID_KEY)
      .send({
        source: 'Salem',
        destination: 'Bangalore'
      });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.isRefreshed, true);
    assert.ok(res.body.routes.length > 0);
  });
});
