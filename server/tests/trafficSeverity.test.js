const { describe, it } = require('node:test');
const assert = require('node:assert');
const { classifyTrafficSeverity, SEVERITY_LEVELS } = require('../src/services/trafficSeverityService');

describe('Traffic Severity Classification Service', () => {
  it('should classify zero delay as low traffic (green)', () => {
    const result = classifyTrafficSeverity(3600, 0);
    assert.strictEqual(result.severity, SEVERITY_LEVELS.LOW.severity);
    assert.strictEqual(result.color, '#22c55e');
    assert.strictEqual(result.delayRatio, 0);
  });

  it('should classify minor delay (<15%) as low traffic (green)', () => {
    // 3600 duration, 300 delay -> free-flow 3300 -> ratio 300/3300 = 0.091 (< 0.15)
    const result = classifyTrafficSeverity(3600, 300);
    assert.strictEqual(result.severity, 'low');
    assert.strictEqual(result.color, '#22c55e');
    assert.ok(result.delayRatio < 0.15);
  });

  it('should classify moderate delay (15% - 40%) as moderate traffic (yellow)', () => {
    // 3600 duration, 800 delay -> free-flow 2800 -> ratio 800/2800 = 0.286 (0.15 <= r < 0.40)
    const result = classifyTrafficSeverity(3600, 800);
    assert.strictEqual(result.severity, 'moderate');
    assert.strictEqual(result.color, '#eab308');
    assert.ok(result.delayRatio >= 0.15 && result.delayRatio < 0.40);
  });

  it('should classify severe delay (>=40%) as heavy traffic (red)', () => {
    // 3600 duration, 1500 delay -> free-flow 2100 -> ratio 1500/2100 = 0.714 (>= 0.40)
    const result = classifyTrafficSeverity(3600, 1500);
    assert.strictEqual(result.severity, 'heavy');
    assert.strictEqual(result.color, '#ef4444');
    assert.ok(result.delayRatio >= 0.40);
  });

  it('should handle zero or negative input durations gracefully', () => {
    const result = classifyTrafficSeverity(0, 0);
    assert.strictEqual(result.severity, 'low');
  });
});
