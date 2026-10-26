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
  return Boolean(req.isAdmin);
}

function requireAdminGoogleUser(config) {
  return async (req, res, next) => {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ error: 'Đăng nhập Google bằng tài khoản admin để tiếp tục.' });
    try {
      const user = await getAuth().verifyIdToken(token);
      const email = String(user.email || '').trim().toLowerCase();
      const allowed = Array.isArray(config.adminGoogleEmails) && config.adminGoogleEmails.includes(email);
      if (!allowed || user.email_verified === false) {
        return res.status(403).json({ error: 'Tài khoản Google này không có quyền quản trị.' });
      }
      req.user = user;
      req.isAdmin = true;
      return next();
    } catch (error) {
      console.warn('[AdminAuth] Invalid Firebase ID token:', error.code || error.message);
      return res.status(401).json({ error: 'Phiên Google admin không hợp lệ hoặc đã hết hạn.' });
    }
  };
}

function requireAdminOrFirebaseUser(config) {
  return async (req, res, next) => {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ error: 'Yêu cầu đăng nhập Google để tiếp tục.' });
    try {
      const user = await getAuth().verifyIdToken(token);
      if (!user.email) return res.status(403).json({ error: 'Tài khoản cần có email để tiếp tục.' });
      req.user = user;
      req.isAdmin = Array.isArray(config.adminGoogleEmails)
        && config.adminGoogleEmails.includes(String(user.email).trim().toLowerCase())
        && user.email_verified !== false;
      return next();
    } catch (error) {
      return res.status(401).json({ error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
    }
  };
}

module.exports = { getBearerToken, requireFirebaseUser, requireAdminGoogleUser, requireAdminOrFirebaseUser, isAdminRequest };
