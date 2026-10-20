const { Router } = require("express")
const crypto = require("node:crypto")

module.exports = (db) => {
  const r = Router()
  const SELECT = `SELECT t.id, t.token_code AS tokenCode, t.farmer_name AS farmerName,
    t.phone, t.mandi_id AS mandiId, m.name AS mandiName, m.district, s.name AS state,
    t.crop, t.quantity_qtl AS quantityQtl, t.sale_date AS saleDate, t.time_slot AS timeSlot,
    t.status, t.created_at AS createdAt
    FROM mandi_tokens t JOIN mandis m ON m.id=t.mandi_id JOIN states s ON s.id=m.state_id`

  // Book a time-slot token so farmers can arrive near their assigned selling window.
  r.post("/tokens", (req, res) => {
    const { farmerName, phone, mandiId, crop, quantityQtl, saleDate, timeSlot } = req.body || {}
    if (!farmerName?.trim() || !/^\d{10}$/.test(String(phone || "")) || !Number.isInteger(Number(mandiId)) ||
        !crop?.trim() || !Number.isFinite(Number(quantityQtl)) || Number(quantityQtl) <= 0 ||
        !/^\d{4}-\d{2}-\d{2}$/.test(String(saleDate || "")) || !timeSlot?.trim()) {
      return res.status(400).json({ error: "Enter farmer name, valid 10-digit phone, mandi, crop, positive quantity, date and time slot." })
    }
    const mandi = db.prepare("SELECT id FROM mandis WHERE id=?").get(Number(mandiId))
    if (!mandi) return res.status(400).json({ error: "Selected mandi does not exist." })
    // Keep each slot limited to 25 tokens to reduce crowding; cancelled tokens free a place.
    const count = db.prepare("SELECT COUNT(*) n FROM mandi_tokens WHERE mandi_id=? AND sale_date=? AND time_slot=? AND status!='Cancelled'").get(Number(mandiId), saleDate, timeSlot).n
    if (count >= 25) return res.status(409).json({ error: "This slot is full. Please select another time slot." })
    const day = saleDate.replaceAll("-", "")
    const suffix = crypto.randomBytes(3).toString("hex").toUpperCase()
    const tokenCode = `KS-${day}-${suffix}`
    const result = db.prepare(`INSERT INTO mandi_tokens (token_code,farmer_name,phone,mandi_id,crop,quantity_qtl,sale_date,time_slot)
      VALUES (?,?,?,?,?,?,?,?)`).run(tokenCode, farmerName.trim(), String(phone), Number(mandiId), crop.trim(), Number(quantityQtl), saleDate, timeSlot.trim())
    res.status(201).json(db.prepare(`${SELECT} WHERE t.id=?`).get(Number(result.lastInsertRowid)))
  })

  r.get("/tokens", (req, res) => {
    const phone = String(req.query.phone || "")
    if (!/^\d{10}$/.test(phone)) return res.status(400).json({ error: "Enter the phone number used for booking." })
    res.json(db.prepare(`${SELECT} WHERE t.phone=? ORDER BY t.sale_date DESC,t.id DESC`).all(phone))
  })
  return r
}
