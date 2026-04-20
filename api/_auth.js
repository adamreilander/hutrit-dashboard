// Shared auth + rate limit helper for all API endpoints
// Usage: if (!validateRequest(req, res)) return

const ipLog = new Map() // resets per cold start — effective for burst protection

const WINDOW_MS = 60 * 60 * 1000 // 1 hour
const MAX_PER_WINDOW = 15          // AI calls per IP per hour

export function validateRequest(req, res) {
  // 1. Token validation — skip if DASHBOARD_TOKEN not set (dev mode)
  const expected = process.env.DASHBOARD_TOKEN
  if (expected) {
    const token = req.headers['x-dashboard-token']
    if (token !== expected) {
      res.status(401).json({ error: 'No autorizado.' })
      return false
    }
  }

  // 2. IP rate limiting
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown'

  const now = Date.now()
  const rec = ipLog.get(ip) || { count: 0, since: now }

  if (now - rec.since > WINDOW_MS) {
    rec.count = 0
    rec.since = now
  }

  rec.count++
  ipLog.set(ip, rec)

  if (rec.count > MAX_PER_WINDOW) {
    res.status(429).json({ error: 'Límite de uso alcanzado. Intenta en una hora.' })
    return false
  }

  return true
}
