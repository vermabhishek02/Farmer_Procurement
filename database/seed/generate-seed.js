/**
 * Generates the JSON seed files in this folder.
 *
 *   node database/seed/generate-seed.js
 *
 * - 200 real APMC mandi locations across 14 states
 * - prices are SAMPLE / illustrative values (deterministic, seeded PRNG),
 *   NOT live rates. Swap them with a real feed (e.g. Agmarknet / data.gov.in)
 *   when you have one.
 * - the original 12 price rows from frontend/lib/mock-data.ts are kept as-is.
 */
const fs = require("fs")
const path = require("path")

const OUT = __dirname
const mock = JSON.parse(fs.readFileSync(path.join(OUT, "_mock-original.json"), "utf8"))

// ---------- deterministic PRNG ----------
function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rnd = mulberry32(2026)

// ---------- commodities ----------
const commodities = [
  { name: "Wheat", nameHi: "गेहूं", basePrice: 2425, volatility: 3 },
  { name: "Mustard", nameHi: "सरसों", basePrice: 5600, volatility: 4 },
  { name: "Potato", nameHi: "आलू", basePrice: 1200, volatility: 7 },
  { name: "Onion", nameHi: "प्याज", basePrice: 2200, volatility: 9 },
  { name: "Soybean", nameHi: "सोयाबीन", basePrice: 4500, volatility: 3 },
  { name: "Gram (Chana)", nameHi: "चना", basePrice: 5300, volatility: 3 },
  { name: "Rice", nameHi: "चावल", basePrice: 3900, volatility: 2.5 },
  { name: "Tomato", nameHi: "टमाटर", basePrice: 1600, volatility: 14 },
]
const cByName = Object.fromEntries(commodities.map((c) => [c.name, c]))

// ---------- states: crops grown + price factor ----------
const states = {
  "Uttar Pradesh": { code: "UP", factor: 1.0, crops: ["Wheat", "Potato", "Mustard", "Rice", "Onion", "Gram (Chana)"] },
  "Madhya Pradesh": { code: "MP", factor: 0.99, crops: ["Soybean", "Gram (Chana)", "Wheat", "Mustard", "Onion", "Potato"] },
  Punjab: { code: "PB", factor: 1.03, crops: ["Wheat", "Rice", "Potato", "Mustard", "Onion"] },
  Rajasthan: { code: "RJ", factor: 1.0, crops: ["Mustard", "Wheat", "Gram (Chana)", "Onion", "Soybean"] },
  Maharashtra: { code: "MH", factor: 1.02, crops: ["Onion", "Tomato", "Soybean", "Gram (Chana)", "Wheat", "Potato"] },
  Bihar: { code: "BR", factor: 0.96, crops: ["Potato", "Rice", "Wheat", "Onion", "Tomato", "Gram (Chana)"] },
  Haryana: { code: "HR", factor: 1.03, crops: ["Wheat", "Rice", "Mustard", "Potato", "Onion"] },
  Gujarat: { code: "GJ", factor: 1.02, crops: ["Wheat", "Onion", "Potato", "Gram (Chana)", "Mustard", "Tomato"] },
  "West Bengal": { code: "WB", factor: 0.98, crops: ["Potato", "Rice", "Tomato", "Onion", "Mustard"] },
  Karnataka: { code: "KA", factor: 1.01, crops: ["Tomato", "Onion", "Rice", "Gram (Chana)", "Soybean"] },
  Telangana: { code: "TG", factor: 1.0, crops: ["Rice", "Tomato", "Soybean", "Gram (Chana)", "Onion"] },
  "Andhra Pradesh": { code: "AP", factor: 1.0, crops: ["Rice", "Tomato", "Onion", "Gram (Chana)"] },
  Odisha: { code: "OD", factor: 0.97, crops: ["Rice", "Potato", "Tomato", "Onion"] },
  Chhattisgarh: { code: "CG", factor: 0.97, crops: ["Rice", "Gram (Chana)", "Soybean", "Potato"] },
}

// ---------- 200 mandis: "Mandi name|District" (district defaults to mandi name) ----------
const mandiList = {
  "Uttar Pradesh": [
    "Meerut", "Agra", "Mathura", "Lucknow", "Kanpur", "Varanasi", "Prayagraj", "Ghaziabad", "Dadri|Gautam Buddha Nagar", "Aligarh",
    "Bareilly", "Moradabad", "Saharanpur", "Muzaffarnagar", "Hapur", "Bulandshahr", "Etawah", "Firozabad", "Jhansi", "Gorakhpur",
    "Ayodhya", "Sitapur", "Hardoi", "Rampur", "Shahjahanpur", "Budaun", "Mainpuri", "Farrukhabad", "Basti", "Azamgarh",
  ],
  "Madhya Pradesh": [
    "Indore", "Ujjain", "Bhopal", "Gwalior", "Jabalpur", "Sagar", "Dewas", "Ratlam", "Mandsaur", "Neemuch",
    "Vidisha", "Narmadapuram", "Sehore", "Rewa", "Satna", "Chhindwara", "Khargone", "Dhar", "Shajapur", "Guna",
    "Morena", "Bhind", "Datia", "Damoh", "Betul",
  ],
  Punjab: [
    "Khanna|Ludhiana", "Amritsar", "Ludhiana", "Jalandhar", "Patiala", "Bathinda", "Moga", "Sangrur", "Firozpur", "Fazilka",
    "Muktsar", "Hoshiarpur", "Gurdaspur", "Kapurthala", "Barnala", "Mansa", "Faridkot", "Rajpura|Patiala", "Samana|Patiala", "Abohar|Fazilka",
  ],
  Rajasthan: [
    "Alwar", "Jaipur", "Kota", "Jodhpur", "Bikaner", "Ajmer", "Udaipur", "Sri Ganganagar", "Hanumangarh", "Bharatpur",
    "Sikar", "Jhunjhunu", "Bhilwara", "Chittorgarh", "Tonk", "Nagaur", "Pali", "Baran", "Jhalawar", "Bundi",
    "Dausa", "Sawai Madhopur",
  ],
  Maharashtra: [
    "Lasalgaon|Nashik", "Pune", "Nashik", "Nagpur", "Aurangabad", "Kolhapur", "Solapur", "Sangli", "Satara", "Ahmednagar",
    "Jalgaon", "Dhule", "Latur", "Akola", "Amravati", "Yavatmal", "Nanded", "Beed", "Pimpalgaon Baswant|Nashik", "Vashi|Mumbai",
    "Wardha", "Washim", "Buldhana", "Parbhani", "Osmanabad",
  ],
  Bihar: [
    "Patna", "Gaya", "Muzaffarpur", "Bhagalpur", "Darbhanga", "Purnia", "Samastipur", "Begusarai", "Arrah|Bhojpur", "Buxar",
    "Katihar", "Sasaram|Rohtas", "Siwan", "Chapra|Saran", "Hajipur|Vaishali",
  ],
  Haryana: [
    "Karnal", "Ambala", "Kurukshetra", "Sirsa", "Hisar", "Rohtak", "Panipat", "Sonipat", "Kaithal", "Jind",
    "Bhiwani", "Rewari", "Fatehabad", "Yamunanagar", "Gurugram",
  ],
  Gujarat: [
    "Ahmedabad", "Rajkot", "Unjha|Mehsana", "Gondal|Rajkot", "Surat", "Vadodara", "Junagadh", "Bhavnagar", "Mahuva|Bhavnagar", "Mehsana",
    "Palanpur|Banaskantha", "Deesa|Banaskantha", "Jamnagar", "Amreli", "Bhuj|Kutch",
  ],
  "West Bengal": [
    "Siliguri|Darjeeling", "Burdwan|Purba Bardhaman", "Singur|Hooghly", "Bankura", "Malda", "Cooch Behar", "Krishnanagar|Nadia", "Berhampore|Murshidabad", "Midnapore|Paschim Medinipur", "Koley Market|Kolkata",
  ],
  Karnataka: [
    "Yeshwanthpur|Bengaluru", "Hubballi|Dharwad", "Belagavi", "Davanagere", "Raichur", "Gadag", "Kalaburagi", "Mysuru",
  ],
  Telangana: ["Bowenpally|Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam"],
  "Andhra Pradesh": ["Guntur", "Kurnool", "Vijayawada|NTR", "Madanapalle|Annamayya", "Anantapur"],
  Odisha: ["Cuttack", "Bhubaneswar|Khordha"],
  Chhattisgarh: ["Raipur", "Bilaspur", "Durg"],
}

// ---------- build mandis ----------
const mandis = []
let mid = 0
for (const [state, list] of Object.entries(mandiList)) {
  for (const entry of list) {
    const [name, district] = entry.split("|")
    mid++
    mandis.push({
      id: mid,
      name: `${name} Mandi`,
      district: district || name,
      state,
      stateCode: states[state].code,
    })
  }
}
if (mandis.length !== 200) throw new Error(`Expected 200 mandis, got ${mandis.length}`)
const mandiByName = Object.fromEntries(mandis.map((m) => [m.name, m]))

// ---------- build price rows ----------
const round5 = (n) => Math.round(n / 5) * 5
const prices = []
const used = new Set()

// 1) original 12 rows, preserved exactly (ids m1..m12)
for (const p of mock.mandiPrices) {
  const m = mandiByName[p.mandi]
  if (!m) throw new Error("Original mandi missing from list: " + p.mandi)
  if (m.state !== p.state) throw new Error("State mismatch for " + p.mandi)
  prices.push({
    id: p.id,
    mandiId: m.id,
    commodity: p.commodity,
    price: p.price,
    prevPrice: p.prevPrice,
    changePct: p.changePct,
    trend: p.trend,
  })
  used.add(`${m.id}|${p.commodity}`)
}

// 2) generated rows: 3 crops per mandi (4 for bigger ones)
let n = prices.length
for (const m of mandis) {
  const st = states[m.state]
  const want = rnd() < 0.3 ? 4 : 3
  const pool = [...st.crops]
  // shuffle deterministically
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  let have = [...used].filter((k) => k.startsWith(`${m.id}|`)).length
  for (const crop of pool) {
    if (have >= want) break
    if (used.has(`${m.id}|${crop}`)) continue
    const c = cByName[crop]
    const price = round5(c.basePrice * st.factor * (0.92 + rnd() * 0.16))
    let pct = (rnd() * 2 - 1) * c.volatility
    pct = Math.round(pct * 10) / 10
    if (Math.abs(pct) < 0.3) pct = 0
    const prev = Math.round(price / (1 + pct / 100))
    n++
    prices.push({
      id: `m${n}`,
      mandiId: m.id,
      commodity: crop,
      price,
      prevPrice: prev,
      changePct: pct,
      trend: pct > 0 ? "up" : pct < 0 ? "down" : "flat",
    })
    used.add(`${m.id}|${crop}`)
    have++
  }
}

// ---------- 30-day price history for every price row ----------
const TODAY = "2026-09-22"
function history(base, seed, days = 30) {
  const r = mulberry32(seed)
  const phase1 = r() * 6
  const phase2 = r() * 6
  const out = []
  let price = base * 0.9
  const today = new Date(TODAY + "T00:00:00Z")
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setUTCDate(today.getUTCDate() - i)
    const wobble = Math.sin(i * 1.7 + phase1) * base * 0.02 + Math.cos(i * 0.9 + phase2) * base * 0.015
    price = Math.max(base * 0.8, price + wobble + base * 0.004)
    out.push([d.toISOString().slice(0, 10), Math.round(price)])
  }
  out[out.length - 1][1] = base
  return out
}
const priceHistory = []
prices.forEach((p, idx) => {
  for (const [date, price] of history(p.price, 1000 + idx)) {
    priceHistory.push({ priceId: p.id, date, price })
  }
})

// ---------- write files ----------
const write = (f, data) => fs.writeFileSync(path.join(OUT, f), JSON.stringify(data, null, 1) + "\n")
write("states.json", Object.entries(states).map(([name, s]) => ({ name, code: s.code })))
write("commodities.json", commodities)
write("mandis.json", mandis)
write("mandi_prices.json", prices)
// history is large: compact (array-of-arrays) to keep the file small
fs.writeFileSync(
  path.join(OUT, "price_history.json"),
  JSON.stringify(priceHistory.map((h) => [h.priceId, h.date, h.price])) + "\n",
)
write("cold_storages.json", mock.coldStorages)
write("buyers.json", mock.buyers)
write("vehicles.json", mock.vehicles)
write("transport_jobs.json", mock.transportJobs)

console.log(
  `mandis=${mandis.length} states=${Object.keys(states).length} commodities=${commodities.length} prices=${prices.length} history=${priceHistory.length}`,
)
