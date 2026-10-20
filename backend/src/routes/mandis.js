const { Router } = require("express")

module.exports = (db) => {
  const r = Router()

  r.get("/states", (_req, res) => {
    res.json(db.prepare("SELECT name, code FROM states ORDER BY name").all())
  })

  r.get("/commodities", (_req, res) => {
    res.json(db.prepare("SELECT name, name_hi AS nameHi, base_price AS basePrice, unit FROM commodities ORDER BY id").all())
  })

  // GET /api/mandis?state=&q=&limit=&offset=
  r.get("/mandis", (req, res) => {
    const { state, q } = req.query
    const where = []
    const args = []
    if (state && state !== "all") (where.push("s.name = ?"), args.push(state))
    if (q) {
      where.push("(m.name LIKE ? OR m.district LIKE ?)")
      const like = `%${String(q).trim()}%`
      args.push(like, like)
    }
    const limit = Math.min(Number(req.query.limit) || 200, 200)
    const offset = Number(req.query.offset) || 0
    const total = db
      .prepare(`SELECT COUNT(*) n FROM mandis m JOIN states s ON s.id = m.state_id ${where.length ? "WHERE " + where.join(" AND ") : ""}`)
      .get(...args).n
    const items = db
      .prepare(
        `SELECT m.id, m.name, m.district, s.name AS state, s.code AS stateCode,
                (SELECT COUNT(*) FROM mandi_prices p WHERE p.mandi_id = m.id) AS commodityCount
         FROM mandis m JOIN states s ON s.id = m.state_id
         ${where.length ? "WHERE " + where.join(" AND ") : ""}
         ORDER BY m.id LIMIT ? OFFSET ?`,
      )
      .all(...args, limit, offset)
    res.json({ total, items })
  })

  // GET /api/mandis/:id  (mandi + all its commodity prices)
  r.get("/mandis/:id", (req, res) => {
    const m = db
      .prepare("SELECT m.id, m.name, m.district, s.name AS state FROM mandis m JOIN states s ON s.id = m.state_id WHERE m.id = ?")
      .get(Number(req.params.id))
    if (!m) return res.status(404).json({ error: "Mandi not found" })
    const prices = db
      .prepare(
        `SELECT p.id, c.name AS commodity, c.name_hi AS commodityHi, p.price, p.prev_price AS prevPrice, p.trend, p.change_pct AS changePct
         FROM mandi_prices p JOIN commodities c ON c.id = p.commodity_id WHERE p.mandi_id = ? ORDER BY c.id`,
      )
      .all(m.id)
    res.json({ ...m, prices })
  })

  return r
}
