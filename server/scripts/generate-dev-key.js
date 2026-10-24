#!/usr/bin/env node
const { generateKey } = require('../src/services/keyManagerService');

const label = process.argv[2] || `Local Dev Key (${new Date().toLocaleTimeString()})`;
const result = generateKey(label);

console.log('========================================================');
console.log('           SMARTROUTE AI - NEW API KEY ISSUED          ');
console.log('========================================================');
console.log(`Label:       ${result.label}`);
console.log(`API Key:     ${result.key}`);
console.log(`Created At:  ${result.createdAt}`);
console.log('');
console.log('NOTICE: Save this key now! The server only stores the');
console.log('SHA-256 cryptographic hash and cannot reveal it again.');
console.log('========================================================');
