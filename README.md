# Kheti Se Mandi Tak (miniproject2026)

Farmer app: mandi prices, transport booking, cold storage, buyers, analytics, queue-token booking, and a protected admin database explorer.

```
miniproject2026/
├── frontend/   Next.js app (original project, same UI)
├── backend/    Express REST API (reads the SQLite database)
└── database/   schema.sql + seed JSON (200 mandis) + kisan.db (ready-made)
```

## Run

Backend (port 5000) — needs Node 22.13+ (uses the built-in `node:sqlite`, no native packages to compile):

```bash
cd backend
npm install
npm start            # http://localhost:5000/api/health
```

Frontend (port 3000), in a second terminal:

```bash
cd frontend
pnpm install         # or: npm install --legacy-peer-deps react-is
cp .env.example .env.local
pnpm dev             # http://localhost:3000
```

If the backend is not running, the frontend falls back to the built-in mock data (`frontend/lib/mock-data.ts`), so nothing breaks.

## New features: Mandi Queue Token and Admin Database Control Center

- Farmers can book a mandi arrival token by entering name, 10-digit mobile, mandi, crop, quantity, selling date and time slot.
- Token codes look like `KS-YYYYMMDD-XXXXXX`; each mandi/date/time slot accepts up to 25 active bookings. Farmers can look up tokens using the booking phone number.
- Admin dashboard includes a live database overview and read-only table explorer. It shows record counts and can inspect up to 500 rows per table (the UI displays the first 100 rows at a time).
- Admin API requires the server-side `ADMIN_API_KEY` environment variable and the matching key entered in the dashboard. Never commit this key or expose it in frontend environment variables. If the key is not configured, protected endpoints deny access.
- Table reads are recorded in `admin_audit_log`. This prototype intentionally offers read-only database browsing, not arbitrary SQL or delete/edit access from the browser.
- Admin login is now checked by the backend (`POST /api/admin/login`, 5 failed tries per 15 min per IP, 8-hour in-memory session token). Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `backend/.env`/environment; without them the demo login `admin@khetimandi.in` / `admin123` is used and a warning is printed. Single admin account only; sessions reset when the server restarts.
- Queue tokens are a prototype and do not automatically notify mandi staff or guarantee sale; staff must verify the farmer on arrival.

## Admin approvals (registrations & requests)

The **Admin** button is in the top header (all screens) and the **Admin Portal** button is at the bottom of the desktop sidebar. Both open the admin login.

Open the **Admin Portal**, sign in, and use the tabs:

- **Registrations** — farmers / buyers / transporters apply from *Login → Register* in the site header. Admin sees them as *Pending*, can approve or reject one or many (checkbox + bulk), add a note/reason, search/filter, reopen a decision and export CSV. Applicants can check their status with their phone number.
- **Transport requests** — requests booked from the Farmer → Transport tab arrive here as *Pending*; admin approves or rejects with a note.
- **Queue tokens** — search by token/farmer/phone/date and set status (Booked → Checked In → Completed / Cancelled); CSV export.
- **Overview** — pending counts, today's tokens, approved users per role, and recent admin actions (all decisions are written to `admin_audit_log`).
- **Database** — the existing read-only explorer (no more pasting an API key; it uses the login session).

Existing databases are upgraded automatically on server start (new `registrations` table; `transport_jobs` gets `Approved`/`Rejected` statuses and an `admin_note` column).

## Mobile OTP login, unique IDs and new platform features

**Real OTP registration / login (4 roles: Farmer, Buyer, Seller, Transporter)**

1. Enter a 10-digit Indian mobile number (must start 6-9) -> server sends a 6-digit OTP.
2. Enter the OTP -> for *Register* you then fill name/location and receive a unique **Kisan ID** (`KS-F-48293716`: F/B/S/T = role, 7 random digits + Luhn check digit). For *Login* you are signed in (30-day session, stored hashed in the database).
3. New accounts are `Pending` until an admin approves them in the Admin Portal (it now shows each user's ID and "OTP verified" mark). Pending users can log in, use prices/tokens/transport/alerts; listing crops and bidding need approval.

Security: OTPs are HMAC-hashed, expire in 5 minutes, allow 5 wrong tries, 30 s resend cooldown, 5 OTPs per phone per hour and 20 per IP per hour. The old public `POST /api/registrations` (no OTP) was removed; accounts can only be created with a fresh OTP proof.

**To send REAL SMS** set `SMS_PROVIDER` in `backend/.env` (see `.env.example`): `twilio-verify`, `msg91` (needs DLT template) or `fast2sms`. With no provider the server runs in **DEV MODE**: the OTP is printed in the backend console and shown in the login box (never when `NODE_ENV=production`). The provider code paths were written to each provider's documented API but could not be tested against live accounts here, so do one real test after adding your keys.

**New features inspired by Kisan Suvidha / e-NAM / Kisan Setu-style platforms**

- **Digital Kisan ID card + QR** (My Account): scan the QR (or open `/?verify=KS-F-...`) to check an ID is genuine; only name initial, role, location and status are shown, never the phone.
- **Live Crop Bids** (Farmer -> Live Bids): approved farmers/sellers list crops with an asking price, approved buyers bid, the farmer accepts one bid. Buyer and seller phone numbers stay hidden until a bid is accepted. Board refreshes every 8 s. Each listing shows whether the ask is at/above MSP.
- **Price Alerts & MSP** (Farmer -> Alerts & MSP): target-price alerts per crop checked against the best current mandi rate (in-app; no SMS alerts yet), plus an MSP reference table (`msp_rates`). MSP values: kharif 2026-27 (paddy 2,441, soybean 5,708) and rabi (wheat 2,610, gram 5,958, mustard 6,613 for RMS 2027-28; the last three come from one press report, so confirm against the official notification).
- Mandi Token form pre-fills your verified name and number when logged in.

New endpoints: `POST /api/auth/otp/send`, `POST /api/auth/otp/verify`, `POST /api/auth/register`, `GET/PATCH /api/auth/me`, `POST /api/auth/logout`, `GET /api/verify/:uid`, `GET /api/verify/:uid/qr.svg`, `GET/POST /api/listings`, `POST /api/listings/:id/bids`, `POST /api/listings/:id/accept/:bidId`, `POST /api/listings/:id/cancel`, `DELETE /api/bids/:id`, `GET /api/me/market`, `GET/POST/DELETE /api/me/alerts`, `GET /api/msp`. The database upgrades itself on start (adds the `seller` role, IDs and new tables).

## Database

SQLite (via Node's built-in `node:sqlite`), file `database/kisan.db` (already included). Rebuild it any time:

```bash
cd backend && npm run seed
```

| table | rows | notes |
|---|---|---|
| states | 14 | |
| commodities | 8 | Wheat, Mustard, Potato, Onion, Soybean, Gram, Rice, Tomato |
| **mandis** | **200** | real APMC mandi locations (name, district, state) |
| mandi_prices | 669 | latest price per mandi x commodity (first 12 = original mock rows) |
| price_history | 20,070 | 30 days per price row |
| cold_storages, buyers, vehicles, transport_jobs | 6 / 4 / 4 / 5 | moved from mock data |

> **Note:** mandi names/districts/states are real, but the **prices are sample (generated) values**, not live rates.
> To use real rates, replace `database/seed/mandi_prices.json` (or write a job that pulls from Agmarknet / data.gov.in).
> `node database/seed/generate-seed.js` regenerates the seed JSON files.

## API

| endpoint | description |
|---|---|
| `GET /api/health` | status |
| `GET /api/states`, `/api/commodities` | lookups |
| `GET /api/mandis?state=&q=&limit=&offset=` | list of the 200 mandis |
| `GET /api/mandis/:id` | one mandi + its prices |
| `GET /api/prices?state=&commodity=&q=&mandi=` | mandi bhav (same shape as the frontend `MandiPrice`) |
| `GET /api/prices/ticker` | top 10 for the ticker |
| `GET /api/prices/:id/history?days=30` | history of one price row |
| `GET /api/analytics/history?commodity=Wheat&days=30` | avg price per day across mandis |
| `GET /api/cold-storages?state=` | cold storages |
| `GET /api/buyers?commodity=` | buyers |
| `GET /api/vehicles` | vehicles |
| `GET/POST /api/transport-jobs`, `PATCH /api/transport-jobs/:id/status` | transport jobs |
| `POST /api/tokens` | book a queue token and arrival slot |
| `GET /api/tokens?phone=10DIGITNUMBER` | find a farmer's tokens by booking phone |
| `POST /api/registrations`, `GET /api/registrations/status?phone=` | apply for an account / check approval status |
| `POST /api/admin/login`, `POST /api/admin/logout` | admin session (`Authorization: Bearer <token>`) |
| `GET /api/admin/summary` | pending counts + recent admin actions |
| `GET /api/admin/registrations?status=&role=&q=`, `PATCH /api/admin/registrations/:id`, `POST /api/admin/registrations/bulk` | review registrations (`{status:"Approved"\|"Rejected"\|"Pending", note}`) |
| `GET /api/admin/transport-requests`, `PATCH /api/admin/transport-requests/:id` | approve / reject transport requests |
| `GET /api/admin/tokens`, `PATCH /api/admin/tokens/:id` | manage queue tokens |
| `GET /api/admin/export/registrations\|tokens\|transport` | CSV download |
| `GET /api/admin/overview` | protected database table counts (`x-admin-key`) |
| `GET /api/admin/database/:table` | protected read-only table rows, max 500 (`x-admin-key`) |
| `GET /api/admin/audit-log` | protected recent table-read audit log (`x-admin-key`) |

## What changed in the frontend

Nothing was removed. Added `lib/api.ts` and `lib/use-mandi-data.ts`; `price-checker`, `price-ticker` and `analytics-view` now load data from the API (with the old mock data as fallback). Everything else is untouched.
