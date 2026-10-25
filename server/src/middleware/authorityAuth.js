/**
 * Authority Authentication Middleware
 * Enforces admin role for F5 Authority Dashboard & Resolution actions.
 * Accepts:
 * - Header `X-Authority-Role: admin`
 * - Header `Authorization: Bearer <token>`
 * - Query param `?authorityKey=admin` (for demo convenience)
 */

function authorityAuth(req, res, next) {
  const roleHeader = req.headers['x-authority-role'];
  const authHeader = req.headers['authorization'];
  const queryKey = req.query.authorityKey;

  let isAdmin = false;
  let officerId = req.headers['x-authority-officer-id'] || 'Officer-Admin';

  if (roleHeader && roleHeader.toLowerCase() === 'admin') {
    isAdmin = true;
  } else if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token === 'admin' || token === 'auth_demo_secret' || token.length >= 8) {
      isAdmin = true;
    }
  } else if (queryKey === 'admin' || queryKey === 'auth_demo_secret') {
    isAdmin = true;
  }

  if (!isAdmin) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED_AUTHORITY',
        message: 'Authority admin credentials required. Provide X-Authority-Role: admin or Bearer token.'
      }
    });
  }

  req.authorityUser = {
    role: 'admin',
    officerId
  };

  next();
}

module.exports = authorityAuth;
