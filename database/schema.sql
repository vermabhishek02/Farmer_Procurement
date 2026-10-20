-- Kheti Se Mandi Tak — SQLite schema
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS states (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  name  TEXT NOT NULL UNIQUE,
  code  TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS commodities (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL UNIQUE,
  name_hi     TEXT NOT NULL,
  base_price  INTEGER NOT NULL,      -- INR per quintal (reference)
  unit        TEXT NOT NULL DEFAULT 'quintal'
);

-- 200 mandis (APMC markets)
CREATE TABLE IF NOT EXISTS mandis (
  id        INTEGER PRIMARY KEY,
  name      TEXT NOT NULL UNIQUE,
  district  TEXT NOT NULL,
  state_id  INTEGER NOT NULL REFERENCES states(id)
);
CREATE INDEX IF NOT EXISTS idx_mandis_state ON mandis(state_id);

-- latest price of a commodity in a mandi
CREATE TABLE IF NOT EXISTS mandi_prices (
  id            TEXT PRIMARY KEY,    -- "m1", "m2", ... (same ids as the frontend mock data)
  mandi_id      INTEGER NOT NULL REFERENCES mandis(id),
  commodity_id  INTEGER NOT NULL REFERENCES commodities(id),
  price         INTEGER NOT NULL,    -- INR per quintal
  prev_price    INTEGER NOT NULL,
  change_pct    REAL NOT NULL DEFAULT 0,
  trend         TEXT NOT NULL CHECK (trend IN ('up','down','flat')),
  updated_at    TEXT NOT NULL,       -- ISO timestamp
  UNIQUE (mandi_id, commodity_id)
);
CREATE INDEX IF NOT EXISTS idx_prices_commodity ON mandi_prices(commodity_id);

CREATE TABLE IF NOT EXISTS price_history (
  price_id  TEXT NOT NULL REFERENCES mandi_prices(id),
  date      TEXT NOT NULL,           -- YYYY-MM-DD
  price     INTEGER NOT NULL,
  PRIMARY KEY (price_id, date)
);
CREATE INDEX IF NOT EXISTS idx_history_date ON price_history(date);

CREATE TABLE IF NOT EXISTS cold_storages (
  id                 TEXT PRIMARY KEY,
  name               TEXT NOT NULL,
  location           TEXT NOT NULL,
  state              TEXT NOT NULL,
  capacity_tonnes    INTEGER NOT NULL,
  open_pct           INTEGER NOT NULL,
  price_per_quintal  INTEGER NOT NULL,
  distance_km        INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS cold_storage_commodities (
  cold_storage_id  TEXT NOT NULL REFERENCES cold_storages(id),
  commodity        TEXT NOT NULL,
  PRIMARY KEY (cold_storage_id, commodity)
);

CREATE TABLE IF NOT EXISTS buyers (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  type       TEXT NOT NULL,
  location   TEXT NOT NULL,
  rating     REAL NOT NULL,
  verified   INTEGER NOT NULL DEFAULT 0,
  bid_price  INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS buyer_commodities (
  buyer_id   TEXT NOT NULL REFERENCES buyers(id),
  commodity  TEXT NOT NULL,
  PRIMARY KEY (buyer_id, commodity)
);

CREATE TABLE IF NOT EXISTS vehicles (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  name_hi       TEXT NOT NULL,
  capacity      TEXT NOT NULL,
  rate_per_km   INTEGER NOT NULL,
  base_fare     INTEGER NOT NULL,
  icon          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transport_jobs (
  id           TEXT PRIMARY KEY,
  crop         TEXT NOT NULL,
  quantity     INTEGER NOT NULL,
  pickup       TEXT NOT NULL,
  destination  TEXT NOT NULL,
  distance_km  INTEGER NOT NULL,
  fare         INTEGER NOT NULL,
  date         TEXT NOT NULL,
  status       TEXT NOT NULL CHECK (status IN ('Requested','Approved','Rejected','En Route','Loaded','Delivered')),
  farmer       TEXT NOT NULL,
  admin_note   TEXT
);

-- Farmer queue tokens: book an arrival window before bringing produce to the mandi.
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
CREATE INDEX IF NOT EXISTS idx_mandi_tokens_phone ON mandi_tokens(phone);
CREATE INDEX IF NOT EXISTS idx_mandi_tokens_slot ON mandi_tokens(mandi_id, sale_date, time_slot, status);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Account requests from farmers / buyers / transporters; an admin approves or rejects them.
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
