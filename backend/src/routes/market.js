const { Router } = require("express")
const { notifyAdmin } = require("../lib/notify")
const { requireUser, bearer, sha } = require("../lib/userAuth")

const CROPS = ["Wheat", "Mustard", "Potato", "Onion", "Soybean", "Gram", "Rice", "Tomato"]
const mask = (p) => `${p.slice(0, 2)}••••••${p.slice(-2)}`

module.exports = (db) => {
  const r = Router()
  const approvedSeller = requireUser(db, { approved: true, roles: ["farmer", "seller"] })
  const approvedBuyer = requireUser(db, { approved: true, roles: ["buyer"] })
  const anyUser = requireUser(db)
  const msp = () => Object.fromEntries(db.prepare("SELECT crop, msp, season FROM msp_rates").all().map((m) => [m.crop, m]))

  // ---------- MSP ----------
  r.get("/msp", (_req, res) => res.json(db.prepare("SELECT crop, msp, season, updated_at AS updatedAt FROM msp_rates ORDER BY crop").all()))

  // ---------- listings & live bids ----------
  const LISTING = `SELECT l.id, l.crop, l.quantity_qtl AS quantityQtl, l.ask_price AS askPrice, l.location, l.notes, l.status,
      l.created_at AS createdAt, u.name AS sellerName, u.uid AS sellerUid, u.id AS sellerId,
      (SELECT MAX(price) FROM bids b WHERE b.listing_id=l.id AND b.status='Pending') AS bestBid,
      (SELECT COUNT(*) FROM bids b WHERE b.listing_id=l.id AND b.status='Pending') AS bidCount
      FROM listings l JOIN registrations u ON u.id=l.seller_id`

  function shape(l, viewerId) {
    const m = msp()[l.crop]
    return {
      id: l.id, crop: l.crop, quantityQtl: l.quantityQtl, askPrice: l.askPrice, location: l.location, notes: l.notes, status: l.status,
      createdAt: l.createdAt, sellerName: l.sellerName.split(" ")[0], sellerUid: l.sellerUid, bestBid: l.bestBid, bidCount: l.bidCount,
      mine: viewerId === l.sellerId,
      msp: m ? m.msp : null, aboveMsp: m ? l.askPrice >= m.msp : null,
    }
  }
  const viewerId = (req) => {
    const t = bearer(req)
    return t ? db.prepare("SELECT user_id FROM user_sessions WHERE token_hash=? AND expires_at>?").get(sha(t), Date.now())?.user_id : undefined
  }

  r.get("/listings", (req, res) => {
    const { crop, status } = req.query
    const where = [], args = []
    where.push("l.status=?"); args.push(status === "Sold" ? "Sold" : "Open")
    if (crop && CROPS.includes(crop)) { where.push("l.crop=?"); args.push(crop) }
    const v = viewerId(req)
    res.json(db.prepare(`${LISTING} WHERE ${where.join(" AND ")} ORDER BY l.id DESC LIMIT 100`).all(...args).map((l) => shape(l, v)))
  })

  r.post("/listings", approvedSeller, (req, res) => {
    const { crop, quantityQtl, askPrice, location, notes } = req.body || {}
    if (!CROPS.includes(crop) || !(Number(quantityQtl) > 0) || !(Number(askPrice) > 0) || !location?.trim())
      return res.status(400).json({ error: "Choose a crop and enter quantity, asking price (₹/quintal) and pickup location." })
    if (Number(quantityQtl) > 100000 || Number(askPrice) > 1000000) return res.status(400).json({ error: "Quantity or price looks too large." })
    const info = db.prepare("INSERT INTO listings (seller_id,crop,quantity_qtl,ask_price,location,notes) VALUES (?,?,?,?,?,?)")
      .run(req.user.id, crop, Number(quantityQtl), Math.round(Number(askPrice)), location.trim().slice(0, 120), String(notes || "").trim().slice(0, 300))
    notifyAdmin(`New listing: ${crop} ${quantityQtl} qtl @ Rs${askPrice} by ${req.user.uid}.`)
    res.status(201).json(shape(db.prepare(`${LISTING} WHERE l.id=?`).get(Number(info.lastInsertRowid)), req.user.id))
  })

  r.post("/listings/:id/bids", approvedBuyer, (req, res) => {
    const l = db.prepare("SELECT * FROM listings WHERE id=?").get(Number(req.params.id))
    if (!l) return res.status(404).json({ error: "Listing not found." })
    if (l.status !== "Open") return res.status(409).json({ error: "This listing is no longer open." })
    const price = Math.round(Number(req.body?.price))
    if (!(price > 0) || price > 1000000) return res.status(400).json({ error: "Enter your bid in ₹ per quintal." })
    db.exec("BEGIN")
    try {
      db.prepare("UPDATE bids SET status='Withdrawn' WHERE listing_id=? AND buyer_id=? AND status='Pending'").run(l.id, req.user.id)
      db.prepare("INSERT INTO bids (listing_id,buyer_id,price,note) VALUES (?,?,?,?)").run(l.id, req.user.id, price, String(req.body?.note || "").trim().slice(0, 200))
      db.exec("COMMIT")
    } catch (e) { db.exec("ROLLBACK"); throw e }
    res.status(201).json({ ok: true })
  })

  const ownListing = (req, res) => {
    const l = db.prepare("SELECT * FROM listings WHERE id=?").get(Number(req.params.id))
    if (!l) { res.status(404).json({ error: "Listing not found." }); return null }
    if (l.seller_id !== req.user.id) { res.status(403).json({ error: "This is not your listing." }); return null }
    return l
  }

  r.post("/listings/:id/accept/:bidId", approvedSeller, (req, res) => {
    const l = ownListing(req, res); if (!l) return
    if (l.status !== "Open") return res.status(409).json({ error: "Listing is already closed." })
    const bid = db.prepare("SELECT * FROM bids WHERE id=? AND listing_id=? AND status='Pending'").get(Number(req.params.bidId), l.id)
    if (!bid) return res.status(404).json({ error: "Bid not found or no longer active." })
    db.exec("BEGIN")
    try {
      db.prepare("UPDATE bids SET status='Accepted' WHERE id=?").run(bid.id)
      db.prepare("UPDATE bids SET status='Rejected' WHERE listing_id=? AND id!=? AND status='Pending'").run(l.id, bid.id)
      db.prepare("UPDATE listings SET status='Sold', accepted_bid_id=? WHERE id=?").run(bid.id, l.id)
      db.exec("COMMIT")
    } catch (e) { db.exec("ROLLBACK"); throw e }
    const buyer = db.prepare("SELECT name, phone, uid FROM registrations WHERE id=?").get(bid.buyer_id)
    res.json({ ok: true, buyer, price: bid.price })
  })

  r.post("/listings/:id/cancel", approvedSeller, (req, res) => {
    const l = ownListing(req, res); if (!l) return
    if (l.status !== "Open") return res.status(409).json({ error: "Only open listings can be cancelled." })
    db.prepare("UPDATE listings SET status='Cancelled' WHERE id=?").run(l.id)
    db.prepare("UPDATE bids SET status='Rejected' WHERE listing_id=? AND status='Pending'").run(l.id)
    res.json({ ok: true })
  })

  r.delete("/bids/:id", approvedBuyer, (req, res) => {
    const info = db.prepare("UPDATE bids SET status='Withdrawn' WHERE id=? AND buyer_id=? AND status='Pending'").run(Number(req.params.id), req.user.id)
    if (!info.changes) return res.status(404).json({ error: "Bid not found or already decided." })
    res.json({ ok: true })
  })

  // My deals: for sellers = my listings with all bids; for buyers = my bids. Contact numbers are revealed ONLY after a bid is accepted.
  r.get("/me/market", anyUser, (req, res) => {
    const u = req.user
    const listings = db.prepare(`${LISTING} WHERE l.seller_id=? ORDER BY l.id DESC LIMIT 100`).all(u.id).map((l) => {
      const bids = db.prepare(`SELECT b.id, b.price, b.note, b.status, b.created_at AS createdAt, x.name AS buyerName, x.uid AS buyerUid, x.phone AS buyerPhone
        FROM bids b JOIN registrations x ON x.id=b.buyer_id WHERE b.listing_id=? AND b.status IN ('Pending','Accepted') ORDER BY b.price DESC`).all(l.id)
        .map((b) => ({ ...b, buyerPhone: b.status === "Accepted" ? b.buyerPhone : mask(b.buyerPhone) }))
      return { ...shape(l, u.id), bids }
    })
    const bids = db.prepare(`SELECT b.id, b.price, b.status, b.created_at AS createdAt, l.id AS listingId, l.crop, l.quantity_qtl AS quantityQtl, l.ask_price AS askPrice,
        l.status AS listingStatus, s.name AS sellerName, s.phone AS sellerPhone
        FROM bids b JOIN listings l ON l.id=b.listing_id JOIN registrations s ON s.id=l.seller_id WHERE b.buyer_id=? ORDER BY b.id DESC LIMIT 100`).all(u.id)
      .map((b) => ({ ...b, sellerPhone: b.status === "Accepted" ? b.sellerPhone : null }))
    res.json({ listings, bids })
  })

  // ---------- price alerts ----------
  function evaluate(a) {
    const row = db.prepare(`SELECT mp.price, m.name AS mandi, m.district FROM mandi_prices mp
      JOIN commodities c ON c.id=mp.commodity_id JOIN mandis m ON m.id=mp.mandi_id
      WHERE c.name=? ORDER BY mp.price ${a.direction === "above" ? "DESC" : "ASC"} LIMIT 1`).get(a.crop)
    const hit = row ? (a.direction === "above" ? row.price >= a.target_price : row.price <= a.target_price) : false
    return { id: a.id, crop: a.crop, direction: a.direction, targetPrice: a.target_price, createdAt: a.created_at,
      bestPrice: row?.price ?? null, bestMandi: row ? `${row.mandi}, ${row.district}` : null, triggered: hit }
  }
  r.get("/me/alerts", anyUser, (req, res) =>
    res.json(db.prepare("SELECT * FROM price_alerts WHERE user_id=? ORDER BY id DESC").all(req.user.id).map(evaluate)))
  r.post("/me/alerts", anyUser, (req, res) => {
    const { crop, direction, targetPrice } = req.body || {}
    if (!CROPS.includes(crop) || !["above", "below"].includes(direction) || !(Number(targetPrice) > 0))
      return res.status(400).json({ error: "Choose a crop, direction and target price." })
    if (db.prepare("SELECT COUNT(*) n FROM price_alerts WHERE user_id=?").get(req.user.id).n >= 20) return res.status(400).json({ error: "You can keep up to 20 alerts." })
    const info = db.prepare("INSERT INTO price_alerts (user_id,crop,direction,target_price) VALUES (?,?,?,?)").run(req.user.id, crop, direction, Math.round(Number(targetPrice)))
    res.status(201).json(evaluate(db.prepare("SELECT * FROM price_alerts WHERE id=?").get(Number(info.lastInsertRowid))))
  })
  r.delete("/me/alerts/:id", anyUser, (req, res) => {
    const info = db.prepare("DELETE FROM price_alerts WHERE id=? AND user_id=?").run(Number(req.params.id), req.user.id)
    if (!info.changes) return res.status(404).json({ error: "Alert not found." })
    res.json({ ok: true })
  })
  return r
}
