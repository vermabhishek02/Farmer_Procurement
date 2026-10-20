const { Router } = require("express")

module.exports = (db) => {
  const r = Router()

  // Registration now happens only through OTP-verified POST /api/auth/register.

  // Public: let the applicant check whether the admin has approved them.
  r.get("/registrations/status", (req, res) => {
    const phone = String(req.query.phone || "")
    if (!/^\d{10}$/.test(phone)) return res.status(400).json({ error: "Enter the 10-digit phone number used for registration." })
    res.json(
      db.prepare("SELECT id, role, name, status, admin_note AS adminNote, created_at AS createdAt, reviewed_at AS reviewedAt FROM registrations WHERE phone=? ORDER BY id DESC").all(phone),
    )
  })
  return r
}
