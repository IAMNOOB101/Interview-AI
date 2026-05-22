// Simple in-process rate limiter — for production use redis-backed rate limiting (e.g. rate-limiter-flexible)
const hits = new Map();

export const rateLimit = ({ windowMs = 60_000, max = 30, message = "Too many requests" } = {}) => {
  return (req, res, next) => {
    const key = req.ip || "unknown";
    const now = Date.now();
    const entry = hits.get(key) || { count: 0, start: now };

    if (now - entry.start > windowMs) {
      entry.count = 1;
      entry.start = now;
    } else {
      entry.count++;
    }
    hits.set(key, entry);

    if (entry.count > max) {
      return res.status(429).json({ message });
    }
    next();
  };
};
