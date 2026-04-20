// Client-side daily usage tracker (localStorage)
// Prevents casual abuse without requiring a backend session

const STORAGE_KEY = 'hutrit_daily_usage'
const DAILY_LIMIT = parseInt(import.meta.env.VITE_DAILY_LIMIT || '5', 10)

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function readUsage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { count: 0, date: todayStr() }
    const parsed = JSON.parse(raw)
    // Reset if it's a new day
    if (parsed.date !== todayStr()) return { count: 0, date: todayStr() }
    return parsed
  } catch {
    return { count: 0, date: todayStr() }
  }
}

/** Returns { allowed: bool, remaining: number } */
export function checkRateLimit() {
  const usage = readUsage()
  return {
    allowed: usage.count < DAILY_LIMIT,
    remaining: Math.max(0, DAILY_LIMIT - usage.count),
  }
}

/** Call after a successful AI generation */
export function recordUsage() {
  const usage = readUsage()
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ count: usage.count + 1, date: todayStr() })
  )
}

/** Returns the dashboard token for API requests */
export function getDashboardToken() {
  return import.meta.env.VITE_DASHBOARD_TOKEN || ''
}
