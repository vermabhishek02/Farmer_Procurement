const { Router } = require("express")

// "Today, 9:00 AM" style label (same format the UI mock data used)
function label(iso) {
  const d = new Date(iso)
  const now = new Date()
  const time = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase()
  const sameDay = d.toDateString() === now.toDateString()
  const day = sameDay ? "Today" : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
  return `${day}, ${time}`
}

const BASE = `
  SELECT p.id, c.name AS commodity, c.name_hi AS commodityHi, s.name AS state, m.district,
         m.name AS mandi, p.price, p.prev_price AS prevPrice, c.unit, p.trend,
         p.change_pct AS changePct, p.updated_at AS updatedAt
  FROM mandi_prices p
  JOIN mandis m ON m.id = p.mandi_id
  JOIN states s ON s.id = m.state_id
  JOIN commodities c ON c.id = p.commodity_id`

const shape = ({ updatedAt, ...r }) => ({ ...r, updated: label(updatedAt) })

module.exports = (db) => {
  const r = Router()

  // GET /api/prices?state=&commodity=&q=&mandi=&limit=&offset=
  r.get("/prices", (req, res) => {
    const { state, commodity, q, mandi } = req.query
    const where = []
    const args = []
    if (state && state !== "all") (where.push("s.name = ?"), args.push(state))
    if (commodity && commodity !== "all") (where.push("c.name = ?"), args.push(commodity))
    if (mandi) (where.push("m.id = ?"), args.push(Number(mandi)))
    if (q) {
      where.push("(c.name LIKE ? OR c.name_hi LIKE ? OR m.name LIKE ? OR m.district LIKE ?)")
      const like = `%${String(q).trim()}%`
      args.push(like, like, like, like)
    }
    const limit = Math.min(Number(req.query.limit) || 1000, 1000)
    const offset = Number(req.query.offset) || 0
    const sql = `${BASE} ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY CAST(SUBSTR(p.id, 2) AS INTEGER) LIMIT ? OFFSET ?`
    const rows = db.prepare(sql).all(...args, limit, offset).map(shape)
    res.json(rows)
  })

  // GET /api/prices/ticker  (first 10, same as the old tickerPrices)
  r.get("/prices/ticker", (_req, res) => {
    const rows = db.prepare(`${BASE} ORDER BY CAST(SUBSTR(p.id, 2) AS INTEGER) LIMIT 10`).all().map(shape)
    res.json(rows)
  })

  // GET /api/prices/:id/history?days=30
  r.get("/prices/:id/history", (req, res) => {
    const days = Math.min(Number(req.query.days) || 30, 30)
    const rows = db
      .prepare(
        `SELECT date, price FROM (SELECT date, price FROM price_history WHERE price_id = ? ORDER BY date DESC LIMIT ?) ORDER BY date`,
      )
      .all(req.params.id, days)
    if (!rows.length) return res.status(404).json({ error: "Price not found" })
    res.json(rows)
  })

  // GET /api/analytics/history?commodity=Wheat&days=30  -> average across all mandis per day
  r.get("/analytics/history", (req, res) => {
    const commodity = req.query.commodity
    const days = Math.min(Number(req.query.days) || 30, 30)
    if (!commodity) return res.status(400).json({ error: "commodity is required" })
    const points = db
      .prepare(
        `SELECT date, ROUND(AVG(price)) AS price FROM (
           SELECT h.date, h.price FROM price_history h
           JOIN mandi_prices p ON p.id = h.price_id
           JOIN commodities c ON c.id = p.commodity_id
           WHERE c.name = ?
         ) GROUP BY date ORDER BY date DESC LIMIT ?`,
      )
      .all(commodity, days)
      .reverse()
    if (!points.length) return res.status(404).json({ error: "Commodity not found" })
    res.json({ commodity, days, points })
  })

  return r
}
