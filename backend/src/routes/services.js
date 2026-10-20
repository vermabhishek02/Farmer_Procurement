const { Router } = require("express")

const STATUSES = ["Requested", "En Route", "Loaded", "Delivered"]

module.exports = (db) => {
  const r = Router()

  // ---- cold storages ----
  r.get("/cold-storages", (req, res) => {
    const { state } = req.query
    const rows = db
      .prepare(
        `SELECT id, name, location, state, capacity_tonnes AS capacityTonnes, open_pct AS openPct,
                price_per_quintal AS pricePerQuintal, distance_km AS distanceKm
         FROM cold_storages ${state && state !== "all" ? "WHERE state = ?" : ""} ORDER BY id`,
      )
      .all(...(state && state !== "all" ? [state] : []))
    const com = db.prepare("SELECT commodity FROM cold_storage_commodities WHERE cold_storage_id = ?")
    res.json(rows.map((c) => ({ ...c, commodities: com.all(c.id).map((x) => x.commodity) })))
  })

  // ---- buyers ----
  r.get("/buyers", (req, res) => {
    const rows = db
      .prepare("SELECT id, name, type, location, rating, verified, bid_price AS bidPrice FROM buyers ORDER BY id")
      .all()
    const com = db.prepare("SELECT commodity FROM buyer_commodities WHERE buyer_id = ?")
    let out = rows.map((b) => ({ ...b, verified: !!b.verified, buying: com.all(b.id).map((x) => x.commodity) }))
    if (req.query.commodity && req.query.commodity !== "all") out = out.filter((b) => b.buying.includes(req.query.commodity))
    res.json(out)
  })

  // ---- vehicles ----
  r.get("/vehicles", (_req, res) => {
    res.json(
      db
        .prepare("SELECT id, name, name_hi AS nameHi, capacity, rate_per_km AS ratePerKm, base_fare AS baseFare, icon FROM vehicles ORDER BY id")
        .all(),
    )
  })

  // ---- transport jobs ----
  const JOB_SELECT = `SELECT id, crop, quantity, pickup, destination, distance_km AS distanceKm, fare, date, status, farmer FROM transport_jobs`

  r.get("/transport-jobs", (_req, res) => {
    res.json(db.prepare(`${JOB_SELECT} ORDER BY CAST(SUBSTR(id, 2) AS INTEGER)`).all())
  })

  r.post("/transport-jobs", (req, res) => {
    const { crop, quantity, pickup, destination, distanceKm, fare, date, farmer } = req.body || {}
    if (!crop || !quantity || !pickup || !destination || !distanceKm || !fare || !date || !farmer)
      return res.status(400).json({ error: "crop, quantity, pickup, destination, distanceKm, fare, date, farmer are required" })
    const last = db.prepare("SELECT MAX(CAST(SUBSTR(id, 2) AS INTEGER)) n FROM transport_jobs").get().n || 0
    const id = `j${last + 1}`
    db.prepare(
      "INSERT INTO transport_jobs (id, crop, quantity, pickup, destination, distance_km, fare, date, status, farmer) VALUES (?,?,?,?,?,?,?,?,?,?)",
    ).run(id, crop, quantity, pickup, destination, distanceKm, fare, date, "Requested", farmer)
    res.status(201).json(db.prepare(`${JOB_SELECT} WHERE id = ?`).get(id))
  })

  r.patch("/transport-jobs/:id/status", (req, res) => {
    const { status } = req.body || {}
    if (!STATUSES.includes(status)) return res.status(400).json({ error: `status must be one of: ${STATUSES.join(", ")}` })
    const info = db.prepare("UPDATE transport_jobs SET status = ? WHERE id = ?").run(status, req.params.id)
    if (!info.changes) return res.status(404).json({ error: "Job not found" })
    res.json(db.prepare(`${JOB_SELECT} WHERE id = ?`).get(req.params.id))
  })

  return r
}
