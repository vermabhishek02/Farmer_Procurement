/**
 * Creates database/kisan.db from database/schema.sql + database/seed/*.json
 *   npm run seed
 */
const fs = require("fs")
const path = require("path")
const { DatabaseSync } = require("node:sqlite")

const DB_DIR = path.join(__dirname, "..", "..", "database")
const DB_PATH = process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : path.join(DB_DIR, "kisan.db")
const seed = (f) => JSON.parse(fs.readFileSync(path.join(DB_DIR, "seed", f), "utf8"))

for (const ext of ["", "-wal", "-shm"]) if (fs.existsSync(DB_PATH + ext)) fs.unlinkSync(DB_PATH + ext)

const db = new DatabaseSync(DB_PATH)
db.exec("PRAGMA foreign_keys = ON")
db.exec(fs.readFileSync(path.join(DB_DIR, "schema.sql"), "utf8"))

const states = seed("states.json")
const commodities = seed("commodities.json")
const mandis = seed("mandis.json")
const prices = seed("mandi_prices.json")
const history = seed("price_history.json")

// "Today, 9:00 AM"-style timestamp: today at 09:00 local time
const updatedAt = new Date()
updatedAt.setHours(9, 0, 0, 0)
const UPDATED = updatedAt.toISOString()

db.exec("BEGIN")
try {
  const insState = db.prepare("INSERT INTO states (name, code) VALUES (?, ?)")
  const stateId = {}
  for (const s of states) stateId[s.name] = Number(insState.run(s.name, s.code).lastInsertRowid)

  const insCom = db.prepare("INSERT INTO commodities (name, name_hi, base_price) VALUES (?, ?, ?)")
  const comId = {}
  for (const c of commodities) comId[c.name] = Number(insCom.run(c.name, c.nameHi, c.basePrice).lastInsertRowid)

  const insMandi = db.prepare("INSERT INTO mandis (id, name, district, state_id) VALUES (?, ?, ?, ?)")
  for (const m of mandis) insMandi.run(m.id, m.name, m.district, stateId[m.state])

  const insPrice = db.prepare(
    "INSERT INTO mandi_prices (id, mandi_id, commodity_id, price, prev_price, change_pct, trend, updated_at) VALUES (?,?,?,?,?,?,?,?)",
  )
  for (const p of prices) insPrice.run(p.id, p.mandiId, comId[p.commodity], p.price, p.prevPrice, p.changePct, p.trend, UPDATED)

  const insHist = db.prepare("INSERT INTO price_history (price_id, date, price) VALUES (?,?,?)")
  for (const [pid, date, price] of history) insHist.run(pid, date, price)

  const insCold = db.prepare(
    "INSERT INTO cold_storages (id, name, location, state, capacity_tonnes, open_pct, price_per_quintal, distance_km) VALUES (?,?,?,?,?,?,?,?)",
  )
  const insColdC = db.prepare("INSERT INTO cold_storage_commodities (cold_storage_id, commodity) VALUES (?,?)")
  for (const c of seed("cold_storages.json")) {
    insCold.run(c.id, c.name, c.location, c.state, c.capacityTonnes, c.openPct, c.pricePerQuintal, c.distanceKm)
    for (const k of c.commodities) insColdC.run(c.id, k)
  }

  const insBuyer = db.prepare("INSERT INTO buyers (id, name, type, location, rating, verified, bid_price) VALUES (?,?,?,?,?,?,?)")
  const insBuyerC = db.prepare("INSERT INTO buyer_commodities (buyer_id, commodity) VALUES (?,?)")
  for (const b of seed("buyers.json")) {
    insBuyer.run(b.id, b.name, b.type, b.location, b.rating, b.verified ? 1 : 0, b.bidPrice)
    for (const k of b.buying) insBuyerC.run(b.id, k)
  }

  const insVeh = db.prepare("INSERT INTO vehicles (id, name, name_hi, capacity, rate_per_km, base_fare, icon) VALUES (?,?,?,?,?,?,?)")
  for (const v of seed("vehicles.json")) insVeh.run(v.id, v.name, v.nameHi, v.capacity, v.ratePerKm, v.baseFare, v.icon)

  const insJob = db.prepare(
    "INSERT INTO transport_jobs (id, crop, quantity, pickup, destination, distance_km, fare, date, status, farmer) VALUES (?,?,?,?,?,?,?,?,?,?)",
  )
  for (const j of seed("transport_jobs.json")) insJob.run(j.id, j.crop, j.quantity, j.pickup, j.destination, j.distanceKm, j.fare, j.date, j.status, j.farmer)
db.exec("COMMIT")
} catch (e) {
  db.exec("ROLLBACK")
  throw e
}

const count = (t) => db.prepare(`SELECT COUNT(*) n FROM ${t}`).get().n
console.log(`Seeded ${DB_PATH}`)
for (const t of ["states", "commodities", "mandis", "mandi_prices", "price_history", "cold_storages", "buyers", "vehicles", "transport_jobs"])
  console.log(`  ${t.padEnd(14)} ${count(t)}`)
db.close()
