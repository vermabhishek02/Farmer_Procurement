"use client"

import { useEffect, useState, type FormEvent } from "react"
import { TicketCheck, Clock3, MapPin, RefreshCw } from "lucide-react"
import { API_URL } from "@/lib/api"
import { useAuth } from "@/lib/auth"

const CROPS = ["Wheat", "Mustard", "Potato", "Onion", "Soybean", "Gram", "Rice", "Tomato"]
const SLOTS = ["08:00-10:00", "10:00-12:00", "12:00-14:00", "14:00-16:00"]
type Mandi = { id: number; name: string; district: string; state: string }
type Token = { tokenCode: string; farmerName: string; mandiName: string; district: string; state: string; crop: string; quantityQtl: number; saleDate: string; timeSlot: string; status: string }

export function TokenBooking() {
  const { user } = useAuth()
  const [mandis, setMandis] = useState<Mandi[]>([])
  const [farmerName, setFarmerName] = useState("")
  const [phone, setPhone] = useState("")
  const [mandiId, setMandiId] = useState("")
  const [crop, setCrop] = useState("Wheat")
  const [quantityQtl, setQuantityQtl] = useState("10")
  const [saleDate, setSaleDate] = useState(new Date().toLocaleDateString("en-CA"))
  const [timeSlot, setTimeSlot] = useState(SLOTS[0])
  const [tokens, setTokens] = useState<Token[]>([])
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)

  // logged-in users get their verified name and number filled in
  useEffect(() => { if (user) { setFarmerName(user.name); setPhone(user.phone) } }, [user])

  useEffect(() => { fetch(`${API_URL}/api/mandis?limit=200`).then(r => r.json()).then(d => { setMandis(d.items || []); if (d.items?.length) setMandiId(String(d.items[0].id)) }).catch(() => setMessage("Backend is not connected. Start the backend on port 5000 to book real tokens.")) }, [])

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("")
    try {
      const res = await fetch(`${API_URL}/api/tokens`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ farmerName, phone, mandiId: Number(mandiId), crop, quantityQtl: Number(quantityQtl), saleDate, timeSlot }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Token booking failed")
      setMessage(`Token booked successfully: ${data.tokenCode}. Save this token and arrive during your slot.`)
      setTokens(prev => [data, ...prev]); if (!user) { setFarmerName(""); setPhone("") }
    } catch (err) { setMessage(err instanceof Error ? err.message : "Could not book token") } finally { setBusy(false) }
  }

  async function lookup() {
    if (!/^\d{10}$/.test(phone)) { setMessage("Enter your 10-digit phone number to find bookings."); return }
    try { const r = await fetch(`${API_URL}/api/tokens?phone=${encodeURIComponent(phone)}`); const d = await r.json(); if (!r.ok) throw new Error(d.error); setTokens(d); setMessage(d.length ? `${d.length} booking(s) found.` : "No bookings found for this number.") }
    catch (err) { setMessage(err instanceof Error ? err.message : "Could not fetch tokens") }
  }

  return <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
    <div className="flex items-start gap-3"><div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><TicketCheck className="size-6" /></div><div><h2 className="text-lg font-bold">Mandi Queue Token</h2><p className="mt-1 text-sm text-muted-foreground">Book a selling slot before leaving home, reduce waiting and avoid overcrowding at the mandi.</p></div></div>
    <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-medium">Farmer name<input required value={farmerName} onChange={e=>setFarmerName(e.target.value)} className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 font-normal" placeholder="Enter full name" /></label>
      <label className="text-sm font-medium">Mobile number<input required inputMode="numeric" pattern="[0-9]{10}" maxLength={10} value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g, ""))} className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 font-normal" placeholder="10-digit mobile number" /></label>
      <label className="text-sm font-medium sm:col-span-2">Mandi<select required value={mandiId} onChange={e=>setMandiId(e.target.value)} className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 font-normal">{mandis.map(m=><option key={m.id} value={m.id}>{m.name} — {m.district}, {m.state}</option>)}</select></label>
      <label className="text-sm font-medium">Crop<select value={crop} onChange={e=>setCrop(e.target.value)} className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 font-normal">{CROPS.map(c=><option key={c}>{c}</option>)}</select></label>
      <label className="text-sm font-medium">Quantity (quintals)<input required type="number" min="0.1" step="0.1" value={quantityQtl} onChange={e=>setQuantityQtl(e.target.value)} className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 font-normal" /></label>
      <label className="text-sm font-medium">Selling date<input required type="date" min={new Date().toLocaleDateString("en-CA")} value={saleDate} onChange={e=>setSaleDate(e.target.value)} className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 font-normal" /></label>
      <label className="text-sm font-medium">Arrival time slot<select value={timeSlot} onChange={e=>setTimeSlot(e.target.value)} className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 font-normal">{SLOTS.map(s=><option key={s}>{s}</option>)}</select></label>
      <button disabled={busy || !mandis.length} className="sm:col-span-2 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-60">{busy ? "Booking…" : "Generate Mandi Token"}</button>
    </form>
    <div className="mt-4 flex flex-wrap items-center gap-2"><button type="button" onClick={lookup} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium"><RefreshCw className="size-4"/>Find my tokens by phone</button><span className="text-xs text-muted-foreground">For lookup, enter the same phone number above.</span></div>
    {message && <p role="status" className="mt-4 rounded-lg bg-muted p-3 text-sm">{message}</p>}
    {tokens.length > 0 && <div className="mt-5 space-y-3">{tokens.map(t=><div key={t.tokenCode} className="rounded-xl border border-border p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs text-muted-foreground">Your token number</p><p className="text-xl font-bold text-primary">{t.tokenCode}</p></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold">{t.status}</span></div><div className="mt-3 grid gap-2 text-sm sm:grid-cols-2"><p className="flex items-center gap-2"><MapPin className="size-4 text-muted-foreground"/>{t.mandiName}, {t.district}</p><p>{t.crop} · {t.quantityQtl} quintals</p><p className="flex items-center gap-2"><Clock3 className="size-4 text-muted-foreground"/>{t.saleDate} · {t.timeSlot}</p><p>Farmer: {t.farmerName}</p></div></div>)}</div>}
    <p className="mt-4 text-xs text-muted-foreground">Prototype note: slots are limited to 25 bookings each. The token reserves an arrival window; mandi staff still need to verify the farmer and crop at arrival.</p>
  </section>
}
