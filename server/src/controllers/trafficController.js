const config = require('../config');
const logger = require('../utils/logger');
const https = require('https');

// 1x1 transparent PNG buffer for fallback when provider is offline or key missing
const TRANSPARENT_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
);

/**
 * Proxy TomTom Traffic Flow and Incident tiles.
 * Secures the provider API key entirely on the server.
 */
async function getTrafficFlowTile(req, res) {
  const { z, x, y } = req.params;

  if (!config.tomtom.hasKey) {
    // Return transparent tile gracefully without breaking the map with 404s
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=120');
    return res.end(TRANSPARENT_PNG);
  }

  // TomTom Traffic Flow relative tile URL
  // style: relative0 (colors relative to free-flow: green, yellow, orange, red)
  const tomtomTileUrl = `${config.tomtom.baseUrl}/traffic/map/4/tile/flow/relative0/${z}/${x}/${y}.png?key=${config.tomtom.apiKey}&thickness=10`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const providerRes = await fetch(tomtomTileUrl, {
      signal: controller.signal,
      headers: { 'Accept': 'image/png' }
    });

    if (providerRes.ok) {
      const buffer = await providerRes.arrayBuffer();
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=60'); // Cache for 60s
      return res.end(Buffer.from(buffer));
    }

    // If TomTom returns 404, 403, or rate limit: return transparent tile
    res.setHeader('Content-Type', 'image/png');
    return res.end(TRANSPARENT_PNG);
  } catch (err) {
    logger.warn(`Traffic tile proxy error for ${z}/${x}/${y}: ${err.message}`);
    res.setHeader('Content-Type', 'image/png');
    return res.end(TRANSPARENT_PNG);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function getTrafficIncidentsTile(req, res) {
  const { z, x, y } = req.params;

  if (!config.tomtom.hasKey) {
    res.setHeader('Content-Type', 'image/png');
    return res.end(TRANSPARENT_PNG);
  }

  const tomtomTileUrl = `${config.tomtom.baseUrl}/traffic/map/4/tile/incidents/s0/${z}/${x}/${y}.png?key=${config.tomtom.apiKey}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const providerRes = await fetch(tomtomTileUrl, {
      signal: controller.signal,
      headers: { 'Accept': 'image/png' }
    });

    if (providerRes.ok) {
      const buffer = await providerRes.arrayBuffer();
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=60');
      return res.end(Buffer.from(buffer));
    }

    res.setHeader('Content-Type', 'image/png');
    return res.end(TRANSPARENT_PNG);
  } catch (err) {
    res.setHeader('Content-Type', 'image/png');
    return res.end(TRANSPARENT_PNG);
  } finally {
    clearTimeout(timeoutId);
  }
}

function getTrafficStatus(req, res) {
  res.json({
    success: true,
    trafficLayersAvailable: ['flow', 'incidents'],
    realKeyConfigured: config.tomtom.hasKey,
    tileEndpointPattern: '/api/traffic/tiles/:z/:x/:y.png',
    refreshRateSeconds: 60,
    timestamp: new Date().toISOString()
  });
}

const fs = require('fs');
const path = require('path');

async function setTomTomKey(req, res) {
  const { apiKey } = req.body || {};
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 8) {
    return res.status(400).json({
      success: false,
      error: { message: 'Please provide a valid TomTom API key.' }
    });
  }

  const cleanKey = apiKey.trim();

  // Test against TomTom traffic flow tile
  const testUrl = `https://api.tomtom.com/traffic/map/4/tile/flow/relative0/10/500/500.png?key=${cleanKey}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const testRes = await fetch(testUrl, {
      signal: controller.signal,
      headers: { 'Accept': 'image/png' }
    });

    if (!testRes.ok) {
      return res.status(400).json({
        success: false,
        error: { message: `TomTom API rejected key with HTTP ${testRes.status}. Please check your Developer Portal key.` }
      });
    }

    // Key is verified! Update runtime configuration
    config.tomtom.apiKey = cleanKey;
    config.tomtom.hasKey = true;

    // Persist to server/.env so it survives restarts (create from .env.example if missing)
    try {
      const envPath = path.resolve(__dirname, '../../.env');
      const envExamplePath = path.resolve(__dirname, '../../.env.example');
      let envContent = '';

      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      } else if (fs.existsSync(envExamplePath)) {
        envContent = fs.readFileSync(envExamplePath, 'utf8');
      }

      if (envContent.includes('TOMTOM_API_KEY=')) {
        envContent = envContent.replace(/TOMTOM_API_KEY=.*/, `TOMTOM_API_KEY=${cleanKey}`);
      } else {
        envContent += `\nTOMTOM_API_KEY=${cleanKey}\n`;
      }
      fs.writeFileSync(envPath, envContent, 'utf8');
    } catch (fsErr) {
      logger.warn(`Could not persist TOMTOM_API_KEY to .env: ${fsErr.message}`);
    }

    logger.info('Live TomTom API key configured and activated successfully');
    return res.json({
      success: true,
      message: 'TomTom API Key verified! Live traffic heatmap raster layer is now streaming.',
      realKeyConfigured: true
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: { message: `Verification failed: ${err.message}` }
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function removeTomTomKey(req, res) {
  config.tomtom.apiKey = '';
  config.tomtom.hasKey = false;
  try {
    const envPath = path.resolve(__dirname, '../../.env');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      envContent = envContent.replace(/TOMTOM_API_KEY=.*/, `TOMTOM_API_KEY=`);
      fs.writeFileSync(envPath, envContent, 'utf8');
    }
  } catch (e) {
    // Ignore error
  }
  return res.json({
    success: true,
    message: 'Reset to simulated demo traffic mode.',
    realKeyConfigured: false
  });
}

module.exports = {
  getTrafficFlowTile,
  getTrafficIncidentsTile,
  getTrafficStatus,
  setTomTomKey,
  removeTomTomKey
};

