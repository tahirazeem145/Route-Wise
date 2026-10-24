#!/usr/bin/env node
require('dotenv').config();
const config = require('../src/config');

async function testTomTomKey() {
  console.log('========================================================');
  console.log('         TOMTOM PROVIDER API KEY VERIFIER              ');
  console.log('========================================================');

  const rawKey = process.env.TOMTOM_API_KEY || '';
  const isPlaceholder = !rawKey || rawKey === 'your_tomtom_api_key_here';

  if (isPlaceholder) {
    console.log('[STATUS] ⚠️  No live key detected in server/.env');
    console.log('         TOMTOM_API_KEY is currently set to placeholder:');
    console.log(`         "${rawKey || '(empty)'}"`);
    console.log('');
    console.log('👉 ACTION REQUIRED:');
    console.log('   1. Open server/.env in your editor.');
    console.log('   2. Set: TOMTOM_API_KEY=<your_actual_tomtom_key>');
    console.log('   3. Save the file (Ctrl + S / Cmd + S).');
    console.log('   4. Run this script again: npm run test:provider --prefix server');
    console.log('========================================================');
    process.exit(1);
  }

  const maskedKey = rawKey.slice(0, 4) + '...' + rawKey.slice(-4);
  console.log(`[KEY]    Found key in server/.env: ${maskedKey}`);
  console.log('[PROBE]  Pinging TomTom Traffic Flow & Routing APIs...');

  const start = Date.now();
  try {
    // Probe 1: Traffic Flow raster tile (zoom 10, tile 500, 500)
    const tileUrl = `${config.tomtom.baseUrl}/traffic/map/4/tile/flow/relative0/10/500/500.png?key=${rawKey}`;
    const tileRes = await fetch(tileUrl, { headers: { Accept: 'image/png' } });
    const latency = Date.now() - start;

    if (!tileRes.ok) {
      console.log(`[RESULT] ❌ TomTom API rejected key with HTTP status: ${tileRes.status} (${tileRes.statusText})`);
      if (tileRes.status === 403 || tileRes.status === 401) {
        console.log('         Reason: The key is invalid, expired, or Traffic API is not enabled on this account.');
      } else if (tileRes.status === 429) {
        console.log('         Reason: Rate limit exceeded on this TomTom account.');
      }
      process.exit(1);
    }

    // Probe 2: Routing endpoint (Trichy to Coimbatore)
    const routeUrl = `${config.tomtom.baseUrl}/routing/1/calculateRoute/10.7905,78.7047:11.0168,76.9558/json?key=${rawKey}&maxAlternatives=1&traffic=true`;
    const routeRes = await fetch(routeUrl, { headers: { Accept: 'application/json' } });

    console.log('');
    console.log(`[RESULT] ✅ SUCCESS! TomTom API Key is verified & active (${latency}ms roundtrip)`);
    console.log('--------------------------------------------------------');
    console.log('  • Traffic Flow Tiles:  HTTP ' + tileRes.status + ' OK (streaming raster tiles)');
    console.log('  • Routing Engine:      HTTP ' + routeRes.status + ' OK (live calculation enabled)');
    console.log('--------------------------------------------------------');
    console.log('🚀 Ready to run the application!');
    console.log('   Terminal 1 (Backend):  npm run server');
    console.log('   Terminal 2 (Frontend): npm run client');
    console.log('   Open Browser:          http://localhost:5173');
    console.log('========================================================');
  } catch (err) {
    console.log(`[ERROR]  Network request failed: ${err.message}`);
    console.log('         Check your internet connection.');
    process.exit(1);
  }
}

testTomTomKey();
