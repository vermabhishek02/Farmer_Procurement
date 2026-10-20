// SMS / OTP delivery. Pick a provider with SMS_PROVIDER in backend/.env:
//   twilio-verify | msg91 | fast2sms | (unset = DEV MODE: OTP is printed in the server console)
//
// "managed" providers (twilio-verify) generate and check the code themselves.
// The others only deliver a code that WE generate and verify (hashed in the database).

const PROVIDER = (process.env.SMS_PROVIDER || "").toLowerCase().trim()
const e164 = (phone) => `+91${phone}`

async function post(url, { headers = {}, body, form } = {}) {
  const res = await fetch(url, {
    method: "POST",
    headers: form ? { "Content-Type": "application/x-www-form-urlencoded", ...headers } : { "Content-Type": "application/json", ...headers },
    body: form ? new URLSearchParams(form).toString() : JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data }
}

const providers = {
  "twilio-verify": {
    managed: true,
    needs: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_VERIFY_SERVICE_SID"],
    auth: () => ({ Authorization: "Basic " + Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64") }),
    async send(phone) {
      // OTP_CHANNELS=sms,whatsapp -> the same code goes to both. Succeeds if at least one channel works.
      const channels = (process.env.OTP_CHANNELS || "sms").split(",").map((c) => c.trim()).filter((c) => ["sms", "whatsapp"].includes(c))
      let lastErr, okCount = 0
      for (const Channel of channels.length ? channels : ["sms"]) {
        const r = await post(`https://verify.twilio.com/v2/Services/${process.env.TWILIO_VERIFY_SERVICE_SID}/Verifications`, {
          headers: this.auth(), form: { To: e164(phone), Channel },
        })
        if (r.ok) okCount++
        else { lastErr = r.data?.message || `Twilio error ${r.status}`; console.warn(`OTP via ${Channel} failed: ${lastErr}`) }
      }
      if (!okCount) throw new Error(lastErr)
    },
    async check(phone, code) {
      const r = await post(`https://verify.twilio.com/v2/Services/${process.env.TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`, {
        headers: this.auth(), form: { To: e164(phone), Code: code },
      })
      if (!r.ok && r.status !== 404) throw new Error(r.data?.message || `Twilio error ${r.status}`)
      return r.ok && r.data?.status === "approved"
    },
  },
  msg91: {
    managed: false,
    needs: ["MSG91_AUTH_KEY", "MSG91_TEMPLATE_ID"],
    async send(phone, code) {
      const q = new URLSearchParams({ template_id: process.env.MSG91_TEMPLATE_ID, mobile: `91${phone}`, authkey: process.env.MSG91_AUTH_KEY, otp: code })
      const r = await post(`https://control.msg91.com/api/v5/otp?${q}`, { body: {} })
      if (!r.ok || r.data?.type === "error") throw new Error(r.data?.message || `MSG91 error ${r.status}`)
    },
  },
  fast2sms: {
    managed: false,
    needs: ["FAST2SMS_API_KEY"],
    async send(phone, code) {
      const r = await post("https://www.fast2sms.com/dev/bulkV2", {
        headers: { authorization: process.env.FAST2SMS_API_KEY },
        body: { route: "otp", variables_values: code, numbers: phone },
      })
      if (!r.ok || r.data?.return === false) throw new Error(r.data?.message || `Fast2SMS error ${r.status}`)
    },
  },
}

const impl = providers[PROVIDER]
const missing = impl ? impl.needs.filter((k) => !process.env[k]) : []
if (PROVIDER && !impl) console.warn(`WARNING: unknown SMS_PROVIDER "${PROVIDER}". Falling back to DEV MODE.`)
if (impl && missing.length) console.warn(`WARNING: SMS_PROVIDER=${PROVIDER} but missing env: ${missing.join(", ")}. Falling back to DEV MODE.`)

const active = impl && !missing.length ? impl : null

module.exports = {
  devMode: !active,
  providerName: active ? PROVIDER : "dev-console",
  managed: !!active?.managed,
  send: (phone, code) => (active ? active.send(phone, code) : Promise.resolve()),
  check: (phone, code) => active.check(phone, code),
}
