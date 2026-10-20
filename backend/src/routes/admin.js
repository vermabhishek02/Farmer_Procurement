const { Router } = require("express")
const { login, logout, authorize } = require("../auth")

module.exports = (db) => {
  const r = Router()
  const allowed = new Set(["states","commodities","mandis","mandi_prices","price_history","cold_storages","cold_storage_commodities","buyers","buyer_commodities","vehicles","transport_jobs","mandi_tokens","registrations","admin_audit_log","listings","bids","price_alerts","msp_rates"])

  const audit = (action, table, id) =>
    db.prepare("INSERT INTO admin_audit_log(action,table_name,record_id) VALUES(?,?,?)").run(action, table, id == null ? null : String(id))
  const now = () => new Date().toISOString().slice(0, 19).replace("T", " ")
  const like = (q) => `%${String(q).replace(/[%_]/g, "")}%`

  r.post("/admin/login", login)
  r.post("/admin/logout", logout)

  // ---------- dashboard numbers ----------
  r.get("/admin/summary", authorize, (_req, res) => {
    const one = (sql) => db.prepare(sql).get().n
    const byStatus = (table) => Object.fromEntries(db.prepare(`SELECT status, COUNT(*) n FROM ${table} GROUP BY status`).all().map((x) => [x.status, x.n]))
    res.json({
      registrations: byStatus("registrations"),
      registrationsByRole: db.prepare("SELECT role, COUNT(*) n FROM registrations WHERE status='Approved' GROUP BY role").all(),
      transport: byStatus("transport_jobs"),
      tokens: byStatus("mandi_tokens"),
      todayTokens: one(`SELECT COUNT(*) n FROM mandi_tokens WHERE sale_date = date('now','localtime') AND status!='Cancelled'`),
      recent: db.prepare("SELECT * FROM admin_audit_log WHERE action != 'READ' ORDER BY id DESC LIMIT 8").all(),
    })
  })

  // ---------- registrations ----------
  r.get("/admin/registrations", authorize, (req, res) => {
    const { status, role, q } = req.query
    const where = [], args = []
    if (status && status !== "all") { where.push("status=?"); args.push(status) }
    if (role && role !== "all") { where.push("role=?"); args.push(role) }
    if (q) { where.push("(name LIKE ? OR phone LIKE ? OR location LIKE ? OR uid LIKE ?)"); args.push(like(q), like(q), like(q), like(q)) }
    res.json(
      db.prepare(`SELECT id, uid, phone_verified_at AS phoneVerifiedAt, role, name, phone, location, details, status, admin_note AS adminNote, created_at AS createdAt, reviewed_at AS reviewedAt
        FROM registrations ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY (status='Pending') DESC, id DESC LIMIT 500`).all(...args),
    )
  })

  const REG_STATUSES = ["Approved", "Rejected", "Pending"]
  function decideRegistration(id, status, note) {
    const info = db.prepare("UPDATE registrations SET status=?, admin_note=?, reviewed_at=? WHERE id=?").run(status, note || null, now(), id)
    if (info.changes) audit(status.toUpperCase(), "registrations", id)
    return info.changes
  }

  r.patch("/admin/registrations/:id", authorize, (req, res) => {
    const { status, note } = req.body || {}
    if (!REG_STATUSES.includes(status)) return res.status(400).json({ error: `status must be one of: ${REG_STATUSES.join(", ")}` })
    if (!decideRegistration(Number(req.params.id), status, String(note || "").slice(0, 300))) return res.status(404).json({ error: "Registration not found" })
    res.json(db.prepare("SELECT id, status, admin_note AS adminNote, reviewed_at AS reviewedAt FROM registrations WHERE id=?").get(Number(req.params.id)))
  })

  // approve / reject many at once
  r.post("/admin/registrations/bulk", authorize, (req, res) => {
    const { ids, status, note } = req.body || {}
    if (!Array.isArray(ids) || !ids.length || ids.length > 200) return res.status(400).json({ error: "Select 1 to 200 registrations." })
    if (!["Approved", "Rejected"].includes(status)) return res.status(400).json({ error: "status must be Approved or Rejected" })
    let changed = 0
    db.exec("BEGIN")
    try { for (const id of ids) changed += decideRegistration(Number(id), status, String(note || "").slice(0, 300)); db.exec("COMMIT") }
    catch (e) { db.exec("ROLLBACK"); throw e }
    res.json({ updated: changed })
  })

  // ---------- transport requests ----------
  const JOB = `SELECT id, crop, quantity, pickup, destination, distance_km AS distanceKm, fare, date, status, farmer, admin_note AS adminNote FROM transport_jobs`
  r.get("/admin/transport-requests", authorize, (req, res) => {
    const { status } = req.query
    const has = status && status !== "all"
    res.json(db.prepare(`${JOB} ${has ? "WHERE status=?" : ""} ORDER BY (status='Requested') DESC, CAST(SUBSTR(id,2) AS INTEGER) DESC LIMIT 500`).all(...(has ? [status] : [])))
  })
  r.patch("/admin/transport-requests/:id", authorize, (req, res) => {
    const { status, note } = req.body || {}
    if (!["Approved", "Rejected"].includes(status)) return res.status(400).json({ error: "status must be Approved or Rejected" })
    const cur = db.prepare("SELECT status FROM transport_jobs WHERE id=?").get(req.params.id)
    if (!cur) return res.status(404).json({ error: "Request not found" })
    if (!["Requested", "Approved", "Rejected"].includes(cur.status)) return res.status(409).json({ error: `Job is already ${cur.status}; it can no longer be approved or rejected.` })
    db.prepare("UPDATE transport_jobs SET status=?, admin_note=? WHERE id=?").run(status, String(note || "").slice(0, 300) || null, req.params.id)
    audit(status.toUpperCase(), "transport_jobs", req.params.id)
    res.json(db.prepare(`${JOB} WHERE id=?`).get(req.params.id))
  })

  // ---------- queue tokens ----------
  const TOKEN = `SELECT t.id, t.token_code AS tokenCode, t.farmer_name AS farmerName, t.phone, m.name AS mandiName, t.crop,
    t.quantity_qtl AS quantityQtl, t.sale_date AS saleDate, t.time_slot AS timeSlot, t.status, t.created_at AS createdAt
    FROM mandi_tokens t JOIN mandis m ON m.id=t.mandi_id`
  r.get("/admin/tokens", authorize, (req, res) => {
    const { status, date, q } = req.query
    const where = [], args = []
    if (status && status !== "all") { where.push("t.status=?"); args.push(status) }
    if (date) { where.push("t.sale_date=?"); args.push(date) }
    if (q) { where.push("(t.token_code LIKE ? OR t.farmer_name LIKE ? OR t.phone LIKE ?)"); args.push(like(q), like(q), like(q)) }
    res.json(db.prepare(`${TOKEN} ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY t.sale_date DESC, t.id DESC LIMIT 500`).all(...args))
  })
  r.patch("/admin/tokens/:id", authorize, (req, res) => {
    const { status } = req.body || {}
    if (!["Booked", "Checked In", "Completed", "Cancelled"].includes(status)) return res.status(400).json({ error: "Invalid token status." })
    const info = db.prepare("UPDATE mandi_tokens SET status=? WHERE id=?").run(status, Number(req.params.id))
    if (!info.changes) return res.status(404).json({ error: "Token not found" })
    audit(status.toUpperCase().replace(" ", "_"), "mandi_tokens", req.params.id)
    res.json(db.prepare(`${TOKEN} WHERE t.id=?`).get(Number(req.params.id)))
  })

  // ---------- CSV export ----------
  r.get("/admin/export/:what", authorize, (req, res) => {
    const sources = { registrations: "SELECT id,role,name,phone,location,details,status,admin_note,created_at,reviewed_at FROM registrations ORDER BY id", tokens: "SELECT * FROM mandi_tokens ORDER BY id", transport: "SELECT * FROM transport_jobs ORDER BY id" }
    const sql = sources[req.params.what]
    if (!sql) return res.status(404).json({ error: "Unknown export" })
    const rows = db.prepare(sql).all()
    const esc = (v) => { let s = v == null ? "" : String(v); if (/^[=+\-@]/.test(s)) s = "'" + s; return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
    const cols = rows.length ? Object.keys(rows[0]) : []
    audit("EXPORT", req.params.what, null)
    res.type("text/csv").set("Content-Disposition", `attachment; filename="${req.params.what}.csv"`).send([cols.join(","), ...rows.map((x) => cols.map((c) => esc(x[c])).join(","))].join("\n"))
  })

  // ---------- read-only database explorer (unchanged) ----------
  r.get("/admin/overview", authorize, (_req, res) => {
    const tables = [...allowed].filter((t) => t !== "admin_audit_log")
    res.json({ counts: Object.fromEntries(tables.map((t) => [t, db.prepare(`SELECT COUNT(*) n FROM "${t}"`).get().n])) })
  })
  r.get("/admin/database/:table", authorize, (req, res) => {
    const table = req.params.table
    if (!allowed.has(table)) return res.status(400).json({ error: "Table is not available through this endpoint." })
    const rows = db.prepare(`SELECT * FROM "${table}" LIMIT 500`).all()
    audit("READ", table, null)
    res.json({ table, limit: 500, rows })
  })
  r.get("/admin/audit-log", authorize, (_req, res) => {
    res.json(db.prepare("SELECT * FROM admin_audit_log ORDER BY id DESC LIMIT 200").all())
  })
  return r
}
