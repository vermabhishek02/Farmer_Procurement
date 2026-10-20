"use client"

import { useCallback, useEffect, useState } from "react"
import { BellRing, Trash2, LogIn } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { cn } from "@/lib/utils"

const CROPS = ["Wheat", "Mustard", "Potato", "Onion", "Soybean", "Gram", "Rice", "Tomato"]
const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
interface Alert { id: number; crop: string; direction: "above" | "below"; targetPrice: number; bestPrice: number | null; bestMandi: string | null; triggered: boolean }
interface Msp { crop: string; msp: number; season: string }

export function PriceAlerts({ onLogin }: { onLogin: () => void }) {
  const { user, api } = useAuth()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [msp, setMsp] = useState<Msp[]>([])
  const [form, setForm] = useState({ crop: "Wheat", direction: "above", targetPrice: "" })
  const [err, setErr] = useState("")

  const load = useCallback(async () => {
    try { setMsp(await api<Msp[]>("/msp")) } catch {}
    if (user) try { setAlerts(await api<Alert[]>("/me/alerts")) } catch {}
  }, [user, api])
  useEffect(() => { load(); const id = setInterval(load, 15000); return () => clearInterval(id) }, [load])

  async function add(e: React.FormEvent) {
    e.preventDefault(); setErr("")
    try { await api("/me/alerts", { body: { ...form, targetPrice: Number(form.targetPrice) } }); setForm({ ...form, targetPrice: "" }); load() }
    catch (e) { setErr(e instanceof Error ? e.message : "Could not save alert") }
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><BellRing className="size-6" /></div>
          <div>
            <h2 className="text-lg font-bold">Price Alerts &amp; MSP</h2>
            <p className="mt-1 text-sm text-muted-foreground">Set a target price. We compare it with the best current mandi rate and flag it here as soon as it is hit.</p>
          </div>
        </div>

        {!user ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border p-4 text-sm">
            <span>Log in to create alerts.</span>
            <button onClick={onLogin} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground"><LogIn className="size-4" /> Login / Register</button>
          </div>
        ) : (
          <>
            <form onSubmit={add} className="mt-4 grid gap-3 sm:grid-cols-4">
              <select className={inputCls} value={form.crop} onChange={(e) => setForm({ ...form, crop: e.target.value })} aria-label="Crop">{CROPS.map((c) => <option key={c}>{c}</option>)}</select>
              <select className={inputCls} value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })} aria-label="Direction"><option value="above">Alert me when price rises to</option><option value="below">Alert me when price falls to</option></select>
              <input className={inputCls} inputMode="numeric" required placeholder="₹ per quintal" value={form.targetPrice} onChange={(e) => setForm({ ...form, targetPrice: e.target.value.replace(/\D/g, "") })} />
              <button className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Add alert</button>
            </form>
            {err && <p role="alert" className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>}
            <ul className="mt-4 space-y-2">
              {alerts.length === 0 && <li className="text-sm text-muted-foreground">No alerts yet.</li>}
              {alerts.map((a) => (
                <li key={a.id} className={cn("flex items-center justify-between gap-3 rounded-xl border p-3 text-sm", a.triggered ? "border-emerald-500/50 bg-emerald-500/10" : "border-border")}>
                  <div>
                    <p className="font-semibold">{a.crop} {a.direction === "above" ? "≥" : "≤"} ₹{a.targetPrice.toLocaleString("en-IN")}{a.triggered && <span className="ml-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] text-white">TARGET HIT</span>}</p>
                    <p className="text-xs text-muted-foreground">{a.bestPrice ? `${a.direction === "above" ? "Highest" : "Lowest"} now: ₹${a.bestPrice.toLocaleString("en-IN")} at ${a.bestMandi}` : "No price data"}</p>
                  </div>
                  <button aria-label="Delete alert" onClick={async () => { await api(`/me/alerts/${a.id}`, { method: "DELETE" }); load() }} className="rounded-md p-2 text-muted-foreground hover:bg-muted"><Trash2 className="size-4" /></button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <h3 className="font-semibold">Minimum Support Price (MSP)</h3>
        <p className="text-xs text-muted-foreground">Government floor price per quintal. Potato, onion and tomato have no central MSP.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {msp.map((m) => (
            <div key={m.crop} className="rounded-xl border border-border p-3 text-sm"><p className="font-semibold">{m.crop}</p><p className="text-lg font-bold text-primary">₹{m.msp.toLocaleString("en-IN")}</p><p className="text-xs text-muted-foreground">{m.season}</p></div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Rabi 2027-28 figures are from a single press report; the admin should confirm them against the official CACP/PIB notification (table <code>msp_rates</code>).</p>
      </div>
    </section>
  )
}
