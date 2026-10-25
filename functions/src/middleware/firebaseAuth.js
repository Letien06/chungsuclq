const { getAuth } = require('firebase-admin/auth');

function getBearerToken(req) {
  const header = String(req.headers.authorization || '');
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

/** Verify a Firebase ID token and expose the decoded user on req.user. */
async function requireFirebaseUser(req, res, next) {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Yêu cầu đăng nhập Google để tiếp tục.' });
  }

  try {
    const user = await getAuth().verifyIdToken(token);
    if (!user.email) {
      return res.status(403).json({ error: 'Tài khoản cần có email để đặt đơn.' });
    }
    req.user = user;
    return next();
  } catch (error) {
    console.warn('[Auth] Invalid Firebase ID token:', error.code || error.message);
    return res.status(401).json({ error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
  }
}

function isAdminRequest(req, config) {
  const password = req.headers['x-admin-password'] || req.query.adminPassword;
  return Boolean(password && password === config.adminPassword);
}

/** Allow the admin dashboard or a signed-in Firebase user. */
function requireAdminOrFirebaseUser(config) {
  return async (req, res, next) => {
    if (isAdminRequest(req, config)) {
      req.isAdmin = true;
      return next();
    }
    return requireFirebaseUser(req, res, next);
  };
}

module.exports = { getBearerToken, requireFirebaseUser, requireAdminOrFirebaseUser, isAdminRequest };
