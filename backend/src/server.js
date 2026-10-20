try { process.loadEnvFile(require("path").join(__dirname, "..", ".env")) } catch {} // load backend/.env if present
const express = require("express")
const cors = require("cors")
const { open, DB_PATH } = require("./db")
const { usingDefaults } = require("./auth")
const sms = require("./lib/sms")

const PORT = Number(process.env.PORT) || 5000
const db = open()

const app = express()
app.use(cors({ origin: process.env.CORS_ORIGIN || true }))
app.use(express.json())

// Queue tokens and audit log are initialized safely on every startup.
db.exec(`
  CREATE TABLE IF NOT EXISTS mandi_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_code TEXT NOT NULL UNIQUE,
    farmer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    mandi_id INTEGER NOT NULL REFERENCES mandis(id),
    crop TEXT NOT NULL,
    quantity_qtl REAL NOT NULL CHECK(quantity_qtl > 0),
    sale_date TEXT NOT NULL,
    time_slot TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Booked' CHECK(status IN ('Booked','Checked In','Completed','Cancelled')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL CHECK(role IN ('farmer','buyer','transporter')),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    location TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending','Approved','Rejected')),
    admin_note TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);
  CREATE INDEX IF NOT EXISTS idx_registrations_phone ON registrations(phone);
  CREATE TABLE IF NOT EXISTS admin_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`)

require("./migrate")(db)

// transport_jobs: allow admin 'Approved'/'Rejected' statuses and an admin note (older DBs have a stricter CHECK).
const jobsSql = db.prepare("SELECT sql FROM sqlite_master WHERE name='transport_jobs'").get()?.sql || ""
if (jobsSql && !jobsSql.includes("'Rejected'")) {
  db.exec("PRAGMA foreign_keys = OFF")
  db.exec(`
    BEGIN;
    CREATE TABLE transport_jobs_new (
      id TEXT PRIMARY KEY, crop TEXT NOT NULL, quantity INTEGER NOT NULL, pickup TEXT NOT NULL, destination TEXT NOT NULL,
      distance_km INTEGER NOT NULL, fare INTEGER NOT NULL, date TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('Requested','Approved','Rejected','En Route','Loaded','Delivered')),
      farmer TEXT NOT NULL, admin_note TEXT
    );
    INSERT INTO transport_jobs_new (id,crop,quantity,pickup,destination,distance_km,fare,date,status,farmer)
      SELECT id,crop,quantity,pickup,destination,distance_km,fare,date,status,farmer FROM transport_jobs;
    DROP TABLE transport_jobs;
    ALTER TABLE transport_jobs_new RENAME TO transport_jobs;
    COMMIT;
  `)
  db.exec("PRAGMA foreign_keys = ON")
}

app.get("/api/health", (_req, res) => {
  const n = db.prepare("SELECT COUNT(*) n FROM mandis").get().n
  res.json({ ok: true, mandis: n, db: DB_PATH })
})

app.use("/api", require("./routes/prices")(db))
app.use("/api", require("./routes/mandis")(db))
app.use("/api", require("./routes/services")(db))

app.use("/api", require("./routes/tokens")(db))
app.use("/api", require("./routes/registrations")(db))
app.use("/api", require("./routes/auth")(db))
app.use("/api", require("./routes/market")(db))
app.use("/api", require("./routes/admin")(db))

app.use((_req, res) => res.status(404).json({ error: "Not found" }))
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: "Internal server error" })
})

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}  (db: ${DB_PATH})`)
  console.log(sms.devMode ? "OTP mode: DEV (codes printed here, no real SMS). Set SMS_PROVIDER for real SMS." : `OTP mode: real SMS via ${sms.providerName}`)
  if (usingDefaults) console.warn("WARNING: using demo admin login (admin@khetimandi.in / admin123). Set ADMIN_EMAIL and ADMIN_PASSWORD before deploying.")
})
