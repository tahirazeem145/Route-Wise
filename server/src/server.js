const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const { ensureDataFile } = require('./services/keyManagerService');

// Ensure data folder and initial dev key exist
ensureDataFile();

const server = app.listen(config.port, () => {
  logger.info('========================================================');
  logger.info(`  SmartRoute AI Backend running on http://localhost:${config.port}`);
  logger.info(`  Environment: ${config.nodeEnv}`);
  logger.info(`  Client Origin: ${config.clientOrigin}`);
  logger.info(`  TomTom API Key Configured: ${config.tomtom.hasKey ? 'YES (Live Provider)' : 'NO (Transparent Fallback Mode)'}`);
  logger.info('========================================================');
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down server...');
  server.close(() => {
    logger.info('Server terminated cleanly.');
    process.exit(0);
  });
});

module.exports = server;
