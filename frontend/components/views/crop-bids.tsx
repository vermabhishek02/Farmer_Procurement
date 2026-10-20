"use client"

import { useCallback, useEffect, useState } from "react"
import { Gavel, Radio, ShieldCheck, Phone, LogIn, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { rawApi } from "@/lib/auth"
import { cn } from "@/lib/utils"

const CROPS = ["Wheat", "Mustard", "Potato", "Onion", "Soybean", "Gram", "Rice", "Tomato"]
const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`

interface Listing { id: number; crop: string; quantityQtl: number; askPrice: number; location: string; notes: string; status: string; createdAt: string; sellerName: string; sellerUid: string; bestBid: number | null; bidCount: number; mine: boolean; msp: number | null; aboveMsp: boolean | null }
interface MyListing extends Listing { bids: { id: number; price: number; note: string; status: string; buyerName: string; buyerUid: string; buyerPhone: string }[] }
interface MyBid { id: number; price: number; status: string; listingId: number; crop: string; quantityQtl: number; askPrice: number; listingStatus: string; sellerName: string; sellerPhone: string | null }

export function CropBids({ onLogin }: { onLogin: () => void }) {
  const { user, token, api } = useAuth()
  const [cropFilter, setCropFilter] = useState("all")
  const [listings, setListings] = useState<Listing[]>([])
  const [mine, setMine] = useState<{ listings: MyListing[]; bids: MyBid[] }>({ listings: [], bids: [] })
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [bidInput, setBidInput] = useState<Record<number, string>>({})
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ crop: "Wheat", quantityQtl: "", askPrice: "", location: "", notes: "" })

  const canSell = !!user && (user.role === "farmer" || user.role === "seller")
  const canBid = !!user && user.role === "buyer"
  const approved = user?.status === "Approved"

  const load = useCallback(async () => {
    try {
      const q = cropFilter === "all" ? "" : `?crop=${cropFilter}`
      setListings(await rawApi<Listing[]>(`/listings${q}`, {}, token))
      if (user) setMine(await api<{ listings: MyListing[]; bids: MyBid[] }>("/me/market"))
    } catch { /* keep the last data; the live badge simply keeps retrying */ }
  }, [cropFilter, token, user, api])

  useEffect(() => {
    load()
    const id = setInterval(load, 8000) // "live": refresh every 8 seconds
    return () => clearInterval(id)
  }, [load])

  const run = async (fn: () => Promise<unknown>, okText: string) => {
    setBusy(true); setMsg(null)
    try { await fn(); setMsg({ ok: true, text: okText }); await load() }
    catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : "Something went wrong" }) }
    finally { setBusy(false) }
  }

  const createListing = (e: React.FormEvent) => {
    e.preventDefault()
    run(async () => { await api("/listings", { body: { ...form, quantityQtl: Number(form.quantityQtl), askPrice: Number(form.askPrice) } }); setForm({ ...form, quantityQtl: "", askPrice: "", notes: "" }) }, "Your crop is now live. Buyers can bid on it.")
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Gavel className="size-6" /></div>
            <div>
              <h2 className="text-lg font-bold">Live Crop Bids</h2>
              <p className="mt-1 text-sm text-muted-foreground">Farmers list produce, verified buyers bid, you accept the best offer. Phone numbers are shared only after you accept.</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400"><Radio className="size-3.5 animate-pulse" /> Live · updates every 8s</span>
        </div>

        {!user && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border p-4 text-sm">
            <span>Log in with your mobile number to list crops or place bids.</span>
            <button onClick={onLogin} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground"><LogIn className="size-4" /> Login / Register</button>
          </div>
        )}
        {user && !approved && <p className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">Your ID <strong>{user.uid}</strong> is {user.status === "Pending" ? "waiting for admin approval" : "not approved"}. You can browse listings now; selling and bidding unlock after approval.</p>}
        {user && approved && !canSell && !canBid && <p className="mt-4 rounded-xl bg-muted p-3 text-sm">Listings and bids are for Farmer, Seller and Buyer accounts. You are registered as a {user.role}.</p>}
      </div>

      {canSell && approved && (
        <form onSubmit={createListing} className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2 sm:p-6">
          <h3 className="font-semibold sm:col-span-2">List your crop for sale</h3>
          <select className={inputCls} value={form.crop} onChange={(e) => setForm({ ...form, crop: e.target.value })} aria-label="Crop">{CROPS.map((c) => <option key={c}>{c}</option>)}</select>
          <input className={inputCls} inputMode="decimal" required placeholder="Quantity (quintals)" value={form.quantityQtl} onChange={(e) => setForm({ ...form, quantityQtl: e.target.value.replace(/[^\d.]/g, "") })} />
          <input className={inputCls} inputMode="numeric" required placeholder="Asking price (₹ per quintal)" value={form.askPrice} onChange={(e) => setForm({ ...form, askPrice: e.target.value.replace(/\D/g, "") })} />
          <input className={inputCls} required maxLength={120} placeholder="Pickup location (village, district)" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <input className={cn(inputCls, "sm:col-span-2")} maxLength={300} placeholder="Notes: grade, moisture, packing… (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <button disabled={busy} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60 sm:col-span-2">{busy ? "Posting…" : "Post listing"}</button>
        </form>
      )}

      {msg && <p role="status" className={cn("rounded-lg px-3 py-2 text-sm", msg.ok ? "bg-primary/10" : "bg-destructive/10 text-destructive")}>{msg.text}</p>}

      {/* my listings with incoming bids */}
      {mine.listings.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <h3 className="font-semibold">My listings &amp; incoming bids</h3>
          <div className="mt-3 space-y-3">
            {mine.listings.map((l) => (
              <div key={l.id} className="rounded-xl border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <p className="font-semibold">{l.crop} · {l.quantityQtl} qtl · ask {inr(l.askPrice)}</p>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold">{l.status}</span>
                </div>
                {l.bids.length === 0 ? <p className="mt-2 text-xs text-muted-foreground">No bids yet.</p> : (
                  <ul className="mt-2 divide-y divide-border">
                    {l.bids.map((b) => (
                      <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                        <span><strong>{inr(b.price)}</strong>/qtl · {b.buyerName} <span className="font-mono text-xs text-muted-foreground">{b.buyerUid}</span>{b.note ? ` — “${b.note}”` : ""}</span>
                        {b.status === "Accepted"
                          ? <a href={`tel:+91${b.buyerPhone}`} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"><Phone className="size-3.5" /> Call +91 {b.buyerPhone}</a>
                          : l.status === "Open" && <button disabled={busy} onClick={() => run(() => api(`/listings/${l.id}/accept/${b.id}`, { body: {} }), "Bid accepted. The buyer's number is now visible here.")} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60">Accept</button>}
                      </li>
                    ))}
                  </ul>
                )}
                {l.status === "Open" && <button disabled={busy} onClick={() => run(() => api(`/listings/${l.id}/cancel`, { body: {} }), "Listing cancelled.")} className="mt-2 text-xs text-destructive">Cancel listing</button>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* my bids */}
      {mine.bids.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <h3 className="font-semibold">My bids</h3>
          <ul className="mt-3 divide-y divide-border text-sm">
            {mine.bids.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>{b.crop} · {b.quantityQtl} qtl · my bid <strong>{inr(b.price)}</strong> (ask {inr(b.askPrice)})</span>
                <span className="flex items-center gap-2">
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold">{b.status}</span>
                  {b.status === "Accepted" && b.sellerPhone && <a href={`tel:+91${b.sellerPhone}`} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"><Phone className="size-3.5" /> {b.sellerName} · +91 {b.sellerPhone}</a>}
                  {b.status === "Pending" && <button onClick={() => run(() => api(`/bids/${b.id}`, { method: "DELETE" }), "Bid withdrawn.")} className="text-xs text-destructive">Withdraw</button>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* open market */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">Open listings ({listings.length})</h3>
          <select className="rounded-lg border border-border bg-background px-3 py-2 text-sm" value={cropFilter} onChange={(e) => setCropFilter(e.target.value)} aria-label="Filter crop">
            <option value="all">All crops</option>{CROPS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        {listings.length === 0 && <p className="mt-4 text-sm text-muted-foreground">No open listings right now. Check back soon{canSell && approved ? " or post the first one above" : ""}.</p>}
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {listings.map((l) => (
            <article key={l.id} className="rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-base font-bold">{l.crop} <span className="text-sm font-normal text-muted-foreground">· {l.quantityQtl} quintals</span></p>
                  <p className="text-xs text-muted-foreground">{l.sellerName} · <span className="font-mono">{l.sellerUid}</span> · {l.location}</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary"><ShieldCheck className="size-3" /> ID verified</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg bg-muted p-2"><p className="text-[11px] text-muted-foreground">Asking</p><p className="font-bold">{inr(l.askPrice)}</p></div>
                <div className="rounded-lg bg-muted p-2"><p className="text-[11px] text-muted-foreground">Best bid ({l.bidCount})</p><p className="font-bold">{l.bestBid ? inr(l.bestBid) : "—"}</p></div>
              </div>
              {l.msp && <p className={cn("mt-2 text-xs font-medium", l.aboveMsp ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400")}>MSP {inr(l.msp)} · asking price is {l.aboveMsp ? "at or above MSP" : "below MSP"}</p>}
              {l.notes && <p className="mt-1 text-xs text-muted-foreground">{l.notes}</p>}
              {canBid && approved && (
                <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); run(async () => { await api(`/listings/${l.id}/bids`, { body: { price: Number(bidInput[l.id]) } }); setBidInput({ ...bidInput, [l.id]: "" }) }, "Bid placed. It is live now.") }}>
                  <input className={inputCls} inputMode="numeric" required placeholder="Your bid ₹/qtl" value={bidInput[l.id] || ""} onChange={(e) => setBidInput({ ...bidInput, [l.id]: e.target.value.replace(/\D/g, "") })} />
                  <button disabled={busy} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60">{busy ? <Loader2 className="size-4 animate-spin" /> : <Gavel className="size-4" />} Bid</button>
                </form>
              )}
              {l.mine && <p className="mt-2 text-xs font-semibold text-primary">This is your listing</p>}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
