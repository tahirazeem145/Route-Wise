/**
 * Simple, clean structured logger that avoids exposing secrets or full keys.
 */
function sanitize(message) {
  if (typeof message !== 'string') {
    return message;
  }
  // Mask potential keys like sra_dev_... or tomtom keys
  return message.replace(/(sra_[a-z0-9_]{4})[a-z0-9_]{16,}/gi, '$1***');
}

const logger = {
  info: (...args) => {
    console.log(`[INFO]  ${new Date().toISOString()} -`, ...args.map(sanitize));
  },
  warn: (...args) => {
    console.warn(`[WARN]  ${new Date().toISOString()} -`, ...args.map(sanitize));
  },
  error: (...args) => {
    console.error(`[ERROR] ${new Date().toISOString()} -`, ...args.map(sanitize));
  },
  debug: (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEBUG] ${new Date().toISOString()} -`, ...args.map(sanitize));
    }
  }
};

module.exports = logger;
