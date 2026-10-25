const buckets = new Map();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 30;

function orderRateLimit(req, res, next) {
  const key = req.user?.uid || req.ip || 'unknown';
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.startedAt >= WINDOW_MS) {
    buckets.set(key, { startedAt: now, count: 1 });
    return next();
  }
  if (bucket.count >= MAX_REQUESTS) {
    return res.status(429).json({ error: 'Bạn gửi quá nhiều đơn trong một phút. Vui lòng thử lại sau.' });
  }
  bucket.count += 1;
  return next();
}

module.exports = { orderRateLimit };
