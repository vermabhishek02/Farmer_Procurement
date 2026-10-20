const { Router } = require("express")
const crypto = require("node:crypto")
const sms = require("../lib/sms")
const { newUid, validUid } = require("../lib/ids")
const { notifyAdmin } = require("../lib/notify")
const { sha, createSession, requireUser, PUBLIC } = require("../lib/userAuth")

const ROLES = ["farmer", "buyer", "seller", "transporter"]
const OTP_TTL = 5 * 60_000, COOLDOWN = 30_000, MAX_PER_HOUR = 5, MAX_ATTEMPTS = 5
const SECRET = process.env.OTP_SECRET || crypto.randomBytes(32).toString("hex") // set OTP_SECRET to survive restarts
const hmac = (phone, code) => crypto.createHmac("sha256", SECRET).update(`${phone}:${code}`).digest("hex")
const phoneOk = (p) => /^[6-9]\d{9}$/.test(String(p || "")) // valid Indian mobile numbers start with 6-9
const ipHits = new Map()

module.exports = (db) => {
  const r = Router()
  const byPhone = (phone) => db.prepare("SELECT * FROM registrations WHERE phone=? AND status!='Rejected' ORDER BY id DESC").get(phone)

  function ipLimited(ip) {
    const now = Date.now(), h = ipHits.get(ip)
    if (!h || h.reset < now) { ipHits.set(ip, { n: 1, reset: now + 3600_000 }); return false }
    return ++h.n > 20
  }

  r.post("/auth/otp/send", async (req, res, next) => {
    try {
      const { phone, purpose } = req.body || {}
      if (!phoneOk(phone)) return res.status(400).json({ error: "Enter a valid 10-digit Indian mobile number." })
      if (!["login", "register"].includes(purpose)) return res.status(400).json({ error: "Invalid purpose." })
      if (ipLimited(req.ip)) return res.status(429).json({ error: "Too many OTP requests. Try again later." })

      const existing = byPhone(phone)
      if (purpose === "login" && !existing) return res.status(404).json({ error: "This number is not registered. Please register first." })
      if (purpose === "register" && existing) return res.status(409).json({ error: "This number already has an account. Please log in." })

      const now = Date.now()
      const last = db.prepare("SELECT created_at FROM otp_codes WHERE phone=? ORDER BY id DESC LIMIT 1").get(phone)
      if (last && now - last.created_at < COOLDOWN)
        return res.status(429).json({ error: `Please wait ${Math.ceil((COOLDOWN - (now - last.created_at)) / 1000)}s before requesting another OTP.`, retryAfterSec: Math.ceil((COOLDOWN - (now - last.created_at)) / 1000) })
      const hourly = db.prepare("SELECT COUNT(*) n FROM otp_codes WHERE phone=? AND created_at > ?").get(phone, now - 3600_000).n
      if (hourly >= MAX_PER_HOUR) return res.status(429).json({ error: "Too many OTPs for this number. Try again in an hour." })

      const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0")
      try { await sms.send(phone, code) }
      catch (e) { console.error("SMS send failed:", e.message); return res.status(502).json({ error: "Could not send the SMS right now. Please try again." }) }

      db.prepare("DELETE FROM otp_codes WHERE phone=? AND purpose=?").run(phone, purpose)
      db.prepare("INSERT INTO otp_codes (phone,purpose,code_hash,expires_at,created_at) VALUES (?,?,?,?,?)")
        .run(phone, purpose, sms.managed ? null : hmac(phone, code), now + OTP_TTL, now)

      const out = { ok: true, expiresInSec: OTP_TTL / 1000, resendAfterSec: COOLDOWN / 1000, provider: sms.providerName }
      if (sms.devMode) {
        console.log(`[DEV OTP] +91${phone} → ${code}  (no SMS provider configured; set SMS_PROVIDER to send real SMS)`)
        if (process.env.NODE_ENV !== "production") out.devOtp = code
      }
      res.json(out)
    } catch (e) { next(e) }
  })

  r.post("/auth/otp/verify", async (req, res, next) => {
    try {
      const { phone, otp, purpose } = req.body || {}
      if (!phoneOk(phone) || !/^\d{6}$/.test(String(otp || "")) || !["login", "register"].includes(purpose))
        return res.status(400).json({ error: "Enter the 6-digit OTP." })
      const row = db.prepare("SELECT * FROM otp_codes WHERE phone=? AND purpose=? ORDER BY id DESC LIMIT 1").get(phone, purpose)
      if (!row || row.expires_at < Date.now()) return res.status(400).json({ error: "OTP expired. Please request a new one." })
      if (row.attempts >= MAX_ATTEMPTS) return res.status(429).json({ error: "Too many wrong attempts. Request a new OTP." })

      let good
      if (sms.managed) good = await sms.check(phone, String(otp))
      else {
        const a = Buffer.from(hmac(phone, String(otp))), b = Buffer.from(row.code_hash)
        good = a.length === b.length && crypto.timingSafeEqual(a, b)
      }
      if (!good) {
        db.prepare("UPDATE otp_codes SET attempts=attempts+1 WHERE id=?").run(row.id)
        return res.status(400).json({ error: `Wrong OTP. ${MAX_ATTEMPTS - row.attempts - 1} attempt(s) left.` })
      }
      db.prepare("DELETE FROM otp_codes WHERE phone=? AND purpose=?").run(phone, purpose)

      if (purpose === "register") {
        const proof = crypto.randomBytes(24).toString("hex")
        db.prepare("INSERT INTO phone_proofs (token_hash,phone,expires_at) VALUES (?,?,?)").run(sha(proof), phone, Date.now() + 15 * 60_000)
        return res.json({ ok: true, proofToken: proof })
      }
      const user = byPhone(phone)
      if (!user) return res.status(404).json({ error: "Account not found." })
      db.prepare("UPDATE registrations SET last_login_at=?, phone_verified_at=COALESCE(phone_verified_at, ?) WHERE id=?").run(new Date().toISOString(), new Date().toISOString(), user.id)
      res.json({ ok: true, token: createSession(db, user.id), user: db.prepare(`SELECT ${PUBLIC} FROM registrations WHERE id=?`).get(user.id) })
    } catch (e) { next(e) }
  })

  // Create the account: only possible with a proof that this phone number just passed OTP.
  r.post("/auth/register", (req, res) => {
    const { proofToken, role, name, location, details } = req.body || {}
    if (!ROLES.includes(role) || !name?.trim() || !location?.trim()) return res.status(400).json({ error: "Choose a role and enter your name and location." })
    const proof = db.prepare("SELECT * FROM phone_proofs WHERE token_hash=?").get(sha(proofToken || ""))
    if (!proof || proof.expires_at < Date.now()) return res.status(400).json({ error: "Phone verification expired. Please verify your number again." })
    if (byPhone(proof.phone)) return res.status(409).json({ error: "This number already has an account. Please log in." })
    const exists = (u) => !!db.prepare("SELECT 1 FROM registrations WHERE uid=?").get(u)
    const uid = newUid(role, exists)
    const now = new Date().toISOString()
    const info = db.prepare("INSERT INTO registrations (role,name,phone,location,details,uid,phone_verified_at,last_login_at) VALUES (?,?,?,?,?,?,?,?)")
      .run(role, name.trim().slice(0, 80), proof.phone, location.trim().slice(0, 120), String(details || "").trim().slice(0, 300), uid, now, now)
    db.prepare("DELETE FROM phone_proofs WHERE token_hash=?").run(proof.token_hash)
    const id = Number(info.lastInsertRowid)
    notifyAdmin(`New ${role} registration awaiting approval: ${name.trim().slice(0, 40)}, ${location.trim().slice(0, 40)} (${uid}).`)
    res.status(201).json({ token: createSession(db, id), user: db.prepare(`SELECT ${PUBLIC} FROM registrations WHERE id=?`).get(id) })
  })

  r.get("/auth/me", requireUser(db), (req, res) => res.json(db.prepare(`SELECT ${PUBLIC} FROM registrations WHERE id=?`).get(req.user.id)))
  r.patch("/auth/me", requireUser(db), (req, res) => {
    const { name, location, details } = req.body || {}
    if (!name?.trim() || !location?.trim()) return res.status(400).json({ error: "Name and location are required." })
    db.prepare("UPDATE registrations SET name=?, location=?, details=? WHERE id=?").run(name.trim().slice(0, 80), location.trim().slice(0, 120), String(details || "").trim().slice(0, 300), req.user.id)
    res.json(db.prepare(`SELECT ${PUBLIC} FROM registrations WHERE id=?`).get(req.user.id))
  })
  r.post("/auth/logout", requireUser(db), (req, res) => {
    db.prepare("DELETE FROM user_sessions WHERE token_hash=?").run(req.sessionHash)
    res.json({ ok: true })
  })

  // Public ID verification (what the QR on the Digital Kisan ID card opens). Phone is never exposed.
  r.get("/verify/:uid", (req, res) => {
    if (!validUid(req.params.uid)) return res.status(404).json({ valid: false, error: "Invalid ID format." })
    const u = db.prepare("SELECT uid, role, name, location, status, created_at AS since FROM registrations WHERE uid=?").get(req.params.uid)
    if (!u) return res.status(404).json({ valid: false, error: "No such ID." })
    res.json({ valid: true, ...u, name: u.name.split(" ").map((w, i) => (i === 0 ? w : w[0] + ".")).join(" ") })
  })
  r.get("/verify/:uid/qr.svg", async (req, res, next) => {
    try {
      if (!validUid(req.params.uid)) return res.status(404).end()
      const q = /^https?:\/\/[\w.:-]+$/.test(String(req.query.base || "")) ? String(req.query.base) : ""
      const base = (process.env.PUBLIC_APP_URL || q || "http://localhost:3000").replace(/\/$/, "")
      const svg = await require("qrcode").toString(`${base}/?verify=${req.params.uid}`, { type: "svg", margin: 1, width: 180 })
      res.type("image/svg+xml").send(svg)
    } catch (e) { next(e) }
  })
  return r
}
