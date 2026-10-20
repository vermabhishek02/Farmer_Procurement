const { newUid } = require("./lib/ids")

// Idempotent upgrade of an existing kisan.db. Safe to run on every start.
module.exports = function migrate(db) {
  // 1) registrations becomes the user table: add 'seller' role + uid + verification columns.
  const regSql = db.prepare("SELECT sql FROM sqlite_master WHERE name='registrations'").get()?.sql || ""
  if (regSql && !regSql.includes("'seller'")) {
    db.exec("PRAGMA foreign_keys = OFF")
    db.exec(`
      BEGIN;
      CREATE TABLE registrations_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role TEXT NOT NULL CHECK(role IN ('farmer','buyer','seller','transporter')),
        name TEXT NOT NULL, phone TEXT NOT NULL, location TEXT NOT NULL, details TEXT,
        status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending','Approved','Rejected')),
        admin_note TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, reviewed_at TEXT,
        uid TEXT, phone_verified_at TEXT, last_login_at TEXT
      );
      INSERT INTO registrations_new (id,role,name,phone,location,details,status,admin_note,created_at,reviewed_at)
        SELECT id,role,name,phone,location,details,status,admin_note,created_at,reviewed_at FROM registrations;
      DROP TABLE registrations;
      ALTER TABLE registrations_new RENAME TO registrations;
      COMMIT;
    `)
    db.exec("PRAGMA foreign_keys = ON")
  }
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);
    CREATE INDEX IF NOT EXISTS idx_registrations_phone ON registrations(phone);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_registrations_uid ON registrations(uid);
  `)
  // Legacy rows (made before OTP existed) get an ID but stay "unverified phone".
  const exists = (u) => !!db.prepare("SELECT 1 FROM registrations WHERE uid=?").get(u)
  for (const row of db.prepare("SELECT id, role FROM registrations WHERE uid IS NULL").all())
    db.prepare("UPDATE registrations SET uid=? WHERE id=?").run(newUid(row.role, exists), row.id)

  // 2) OTP, sessions, marketplace, alerts, MSP
  db.exec(`
    CREATE TABLE IF NOT EXISTS otp_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT, phone TEXT NOT NULL, purpose TEXT NOT NULL,
      code_hash TEXT, attempts INTEGER NOT NULL DEFAULT 0, expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_codes(phone, created_at);
    CREATE TABLE IF NOT EXISTS phone_proofs (
      token_hash TEXT PRIMARY KEY, phone TEXT NOT NULL, expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS user_sessions (
      token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seller_id INTEGER NOT NULL REFERENCES registrations(id),
      crop TEXT NOT NULL, quantity_qtl REAL NOT NULL CHECK(quantity_qtl > 0),
      ask_price INTEGER NOT NULL CHECK(ask_price > 0), location TEXT NOT NULL, notes TEXT,
      status TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open','Sold','Cancelled')),
      accepted_bid_id INTEGER, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status, crop);
    CREATE TABLE IF NOT EXISTS bids (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL REFERENCES listings(id),
      buyer_id INTEGER NOT NULL REFERENCES registrations(id),
      price INTEGER NOT NULL CHECK(price > 0), note TEXT,
      status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending','Accepted','Rejected','Withdrawn')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_bids_listing ON bids(listing_id, status);
    CREATE TABLE IF NOT EXISTS price_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
      crop TEXT NOT NULL, direction TEXT NOT NULL CHECK(direction IN ('above','below')),
      target_price INTEGER NOT NULL CHECK(target_price > 0), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS msp_rates (
      crop TEXT PRIMARY KEY, msp INTEGER NOT NULL, season TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `)
  // MSP (Rs/quintal). Kharif 2026-27 and Rabi RMS 2026-27/2027-28 per PIB / press reports. Admin should re-verify each season.
  // Potato, onion and tomato have no central MSP so are intentionally absent.
  const ins = db.prepare("INSERT OR IGNORE INTO msp_rates (crop, msp, season) VALUES (?,?,?)")
  for (const [c, m, s] of [["Rice", 2441, "Kharif 2026-27 (paddy common)"], ["Soybean", 5708, "Kharif 2026-27"],
    ["Wheat", 2610, "Rabi 2027-28"], ["Gram", 5958, "Rabi 2027-28"], ["Mustard", 6613, "Rabi 2027-28"]]) ins.run(c, m, s)
  // cleanup expired auth data
  const t = Date.now()
  db.prepare("DELETE FROM otp_codes WHERE expires_at < ?").run(t - 3600_000)
  db.prepare("DELETE FROM phone_proofs WHERE expires_at < ?").run(t)
  db.prepare("DELETE FROM user_sessions WHERE expires_at < ?").run(t)
}
