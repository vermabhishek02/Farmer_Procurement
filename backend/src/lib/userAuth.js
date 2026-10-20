const crypto = require("node:crypto")
const sha = (s) => crypto.createHash("sha256").update(String(s)).digest("hex")
const SESSION_MS = 30 * 24 * 3600_000

const PUBLIC = "id, uid, role, name, phone, location, details, status, admin_note AS adminNote, created_at AS createdAt, phone_verified_at AS phoneVerifiedAt"

function createSession(db, userId) {
  const token = crypto.randomBytes(32).toString("hex")
  db.prepare("INSERT INTO user_sessions (token_hash,user_id,expires_at,created_at) VALUES (?,?,?,?)").run(sha(token), userId, Date.now() + SESSION_MS, Date.now())
  return token
}

function bearer(req) {
  const h = req.get("authorization") || ""
  return h.startsWith("Bearer ") ? h.slice(7) : ""
}

// requireUser(db) -> middleware; requireUser(db, {approved:true, roles:[...]}) adds checks.
function requireUser(db, opts = {}) {
  return (req, res, next) => {
    const t = bearer(req)
    const row = t && db.prepare(`SELECT r.*, s.expires_at AS sess_exp FROM user_sessions s JOIN registrations r ON r.id=s.user_id WHERE s.token_hash=?`).get(sha(t))
    if (!row || row.sess_exp < Date.now()) return res.status(401).json({ error: "Please log in with your mobile number." })
    if (opts.roles && !opts.roles.includes(row.role)) return res.status(403).json({ error: `This action is only for: ${opts.roles.join(", ")}.` })
    if (opts.approved && row.status !== "Approved")
      return res.status(403).json({ error: row.status === "Pending" ? "Your account is waiting for admin approval. You can use this once it is approved." : "Your registration was rejected. Contact support." })
    req.user = row
    req.sessionHash = sha(t)
    next()
  }
}

module.exports = { sha, createSession, requireUser, PUBLIC, bearer }
