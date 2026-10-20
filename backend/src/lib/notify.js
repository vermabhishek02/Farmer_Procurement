// Admin alerts: SMS + WhatsApp to ADMIN_PHONE (e.g. new registration waiting for approval).
// Needs Twilio: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_FROM (your Twilio number)
// and TWILIO_WHATSAPP_FROM (e.g. whatsapp:+14155238886 sandbox or your approved WhatsApp sender).
// Without these, alerts are only printed in the server console.
const ADMIN_PHONE = (process.env.ADMIN_PHONE || "").replace(/\D/g, "").slice(-10)

async function twilioMessage(to, from, body) {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: { Authorization: "Basic " + Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || `Twilio ${res.status}`)
}

function notifyAdmin(text) {
  if (!ADMIN_PHONE) return
  const msg = `[Kheti Se Mandi Tak] ${text}`
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_FROM, TWILIO_WHATSAPP_FROM } = process.env
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) { console.log(`[ADMIN ALERT → +91${ADMIN_PHONE}] ${text}  (Twilio not configured, not sent)`); return }
  const jobs = []
  if (TWILIO_SMS_FROM) jobs.push(["SMS", twilioMessage(`+91${ADMIN_PHONE}`, TWILIO_SMS_FROM, msg)])
  if (TWILIO_WHATSAPP_FROM) jobs.push(["WhatsApp", twilioMessage(`whatsapp:+91${ADMIN_PHONE}`, TWILIO_WHATSAPP_FROM, msg)])
  if (!jobs.length) console.log(`[ADMIN ALERT] ${text}  (set TWILIO_SMS_FROM / TWILIO_WHATSAPP_FROM to send)`)
  for (const [name, p] of jobs) p.catch((e) => console.error(`Admin ${name} alert failed:`, e.message)) // never block the request
}

module.exports = { notifyAdmin }
