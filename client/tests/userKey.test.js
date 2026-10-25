import test from 'node:test';
import assert from 'node:assert/strict';
import { getAnonymousUserKey } from '../src/utils/userKey.js';

test('Anonymous User Key Utility Test Suite', async (t) => {
  await t.test('should return pseudonymous user key', () => {
    // When window is undefined (Node environment)
    const key = getAnonymousUserKey();
    assert.ok(typeof key === 'string');
    assert.ok(key.length > 0);
  });

  await t.test('should persist in localStorage mock when available', () => {
    const store = new Map();
    globalThis.window = {};
    globalThis.localStorage = {
      getItem: (k) => store.get(k) || null,
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear()
    };

    try {
      const key1 = getAnonymousUserKey();
      assert.ok(key1.startsWith('usr_'));
      const key2 = getAnonymousUserKey();
      assert.strictEqual(key1, key2, 'Should return the identical stored user key on subsequent invocations');
    } finally {
      delete globalThis.window;
      delete globalThis.localStorage;
    }
  });
});
