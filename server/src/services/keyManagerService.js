const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');

const DATA_DIR = path.join(__dirname, '../../data');
const KEYS_FILE = path.join(DATA_DIR, 'keys.json');

function hashKey(rawKey) {
  return crypto.createHash('sha256').update(String(rawKey).trim()).digest('hex');
}

let keysCache = null;

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(KEYS_FILE)) {
    // Bootstrap an initial development key for out-of-the-box local hackathon testing
    const defaultDevKey = 'sra_dev_hackathon_demo_key_2026';
    const initialRecords = {
      [hashKey(defaultDevKey)]: {
        label: 'Default Hackathon Demo Key',
        prefix: 'sra_dev_hackathon...',
        createdAt: new Date().toISOString()
      }
    };
    fs.writeFileSync(KEYS_FILE, JSON.stringify(initialRecords, null, 2), 'utf8');
    keysCache = initialRecords;
    logger.info(`Bootstrapped initial local development API key: "${defaultDevKey}"`);
  }
}

function loadKeys(forceReload = false) {
  if (keysCache && !forceReload) {
    return keysCache;
  }
  ensureDataFile();
  try {
    const raw = fs.readFileSync(KEYS_FILE, 'utf8');
    keysCache = JSON.parse(raw);
    return keysCache;
  } catch (err) {
    logger.error('Failed to read keys.json, resetting to empty store:', err.message);
    keysCache = {};
    return keysCache;
  }
}

function saveKeys(keys) {
  ensureDataFile();
  keysCache = { ...keys };
  fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2), 'utf8');
}

/**
 * Validates a plaintext API key against stored SHA-256 hashes.
 */
function validateKey(rawKey) {
  if (!rawKey || typeof rawKey !== 'string') {
    return { valid: false, reason: 'Key is missing or invalid type' };
  }

  const trimmed = rawKey.trim();
  const hashed = hashKey(trimmed);
  const keys = loadKeys();

  if (keys[hashed]) {
    return {
      valid: true,
      label: keys[hashed].label,
      prefix: keys[hashed].prefix,
      createdAt: keys[hashed].createdAt
    };
  }

  return { valid: false, reason: 'Key not found or revoked' };
}

/**
 * Issues a new random development key, saves its hash, and returns the plaintext key ONCE.
 */
function generateKey(label = 'Developer Local Key') {
  ensureDataFile();
  const randomPart = crypto.randomBytes(16).toString('hex');
  const plaintextKey = `sra_dev_${randomPart}`;
  const hashed = hashKey(plaintextKey);
  const prefix = plaintextKey.slice(0, 12) + '...';

  const keys = loadKeys();
  keys[hashed] = {
    label,
    prefix,
    createdAt: new Date().toISOString()
  };

  saveKeys(keys);
  logger.info(`Generated new API key (${label}) with prefix ${prefix}`);

  return {
    key: plaintextKey,
    label,
    prefix,
    createdAt: keys[hashed].createdAt
  };
}

module.exports = {
  hashKey,
  validateKey,
  generateKey,
  ensureDataFile
};
