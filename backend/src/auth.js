const crypto = require("node:crypto")

// Server-side admin accounts. Set ADMIN_EMAIL / ADMIN_PASSWORD in the environment for real use.
// The defaults are demo-only credentials and a warning is printed when they are in use.
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@khetimandi.in").toLowerCase()
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123"
const usingDefaults = !process.env.ADMIN_PASSWORD

const SESSION_MS = 8 * 60 * 60 * 1000
const sessions = new Map() // token -> expiresAt
const attempts = new Map() // ip -> { count, resetAt }

const sha = (s) => crypto.createHash("sha256").update(String(s)).digest()
const safeEqual = (a, b) => crypto.timingSafeEqual(sha(a), sha(b))

function login(req, res) {
  const ip = req.ip || "unknown"
  const now = Date.now()
  const a = attempts.get(ip)
  if (a && a.resetAt > now && a.count >= 5)
    return res.status(429).json({ error: "Too many failed attempts. Try again in a few minutes." })

  const { email, password } = req.body || {}
  const ok = safeEqual(String(email || "").trim().toLowerCase(), ADMIN_EMAIL) & safeEqual(password || "", ADMIN_PASSWORD)
  if (!ok) {
    const cur = a && a.resetAt > now ? a : { count: 0, resetAt: now + 15 * 60 * 1000 }
    cur.count++
    attempts.set(ip, cur)
    return res.status(401).json({ error: "Invalid email or password." })
  }
  attempts.delete(ip)
  const token = crypto.randomBytes(32).toString("hex")
  sessions.set(token, now + SESSION_MS)
  res.json({ token, email: ADMIN_EMAIL, expiresInMs: SESSION_MS })
}

function tokenFrom(req) {
  const h = req.get("authorization") || ""
  return h.startsWith("Bearer ") ? h.slice(7) : ""
}

function logout(req, res) {
  sessions.delete(tokenFrom(req))
  res.json({ ok: true })
}

// Accepts a login session token, or the legacy ADMIN_API_KEY header.
function authorize(req, res, next) {
  const t = tokenFrom(req)
  const exp = t && sessions.get(t)
  if (exp && exp > Date.now()) return next()
  if (exp) sessions.delete(t)
  const key = process.env.ADMIN_API_KEY
  if (key && req.get("x-admin-key") && safeEqual(req.get("x-admin-key"), key)) return next()
  res.status(401).json({ error: "Admin authorization required. Please sign in again." })
}

module.exports = { login, logout, authorize, usingDefaults, ADMIN_EMAIL }
