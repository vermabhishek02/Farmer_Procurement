const crypto = require("node:crypto")

const LETTER = { farmer: "F", buyer: "B", seller: "S", transporter: "T" }

// Luhn check digit so a mistyped ID can be rejected without a database lookup.
function luhn(digits) {
  let sum = 0
  for (let i = digits.length - 1, dbl = true; i >= 0; i--, dbl = !dbl) {
    let d = Number(digits[i])
    if (dbl) { d *= 2; if (d > 9) d -= 9 }
    sum += d
  }
  return String((10 - (sum % 10)) % 10)
}

// KS-F-48293716 = Kheti Se mandi, Farmer, 7 random digits + 1 check digit
function newUid(role, exists) {
  for (let i = 0; i < 20; i++) {
    const body = String(crypto.randomInt(0, 10_000_000)).padStart(7, "0")
    const uid = `KS-${LETTER[role]}-${body}${luhn(body)}`
    if (!exists(uid)) return uid
  }
  throw new Error("Could not allocate a unique ID")
}

const validUid = (uid) => {
  const m = /^KS-([FBST])-(\d{7})(\d)$/.exec(String(uid || ""))
  return !!m && luhn(m[2]) === m[3]
}

module.exports = { newUid, validUid, LETTER }
