require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  
  tomtom: {
    apiKey: process.env.TOMTOM_API_KEY || '',
    baseUrl: process.env.TOMTOM_BASE_URL || 'https://api.tomtom.com',
    timeoutMs: parseInt(process.env.TIMEOUT_MS, 10) || 8000,
    hasKey: Boolean(process.env.TOMTOM_API_KEY && process.env.TOMTOM_API_KEY !== 'your_tomtom_api_key_here')
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 60
  },

  ranking: {
    weightTime: parseFloat(process.env.WEIGHT_TIME) || 0.5,
    weightDelay: parseFloat(process.env.WEIGHT_DELAY) || 0.3,
    weightDistance: parseFloat(process.env.WEIGHT_DISTANCE) || 0.2
  }
};

module.exports = config;
