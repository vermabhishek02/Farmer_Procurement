"use client"

import { useState } from "react"
import { BadgeCheck, Clock, XCircle, Copy, LogOut, Pencil, Check, Sprout, ShoppingBasket, Store, Truck, LogIn } from "lucide-react"
import { useAuth, roleLabel, type Role } from "@/lib/auth"
import { API_URL } from "@/lib/api"
import { cn } from "@/lib/utils"

const icons: Record<Role, typeof Sprout> = { farmer: Sprout, buyer: ShoppingBasket, seller: Store, transporter: Truck }
const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"

export function AccountView({ onLogin }: { onLogin: () => void }) {
  const { user, loading, signOut, api, refresh } = useAuth()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: "", location: "", details: "" })
  const [msg, setMsg] = useState("")
  const [copied, setCopied] = useState(false)

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading…</div>
  if (!user)
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h2 className="text-xl font-bold">Your Digital Kisan ID</h2>
        <p className="mt-2 text-sm text-muted-foreground">Log in with your mobile number to see your unique ID card, listings and bids.</p>
        <button onClick={onLogin} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"><LogIn className="size-4" /> Login / Register</button>
      </div>
    )

  const Icon = icons[user.role]
  const status = {
    Approved: { icon: BadgeCheck, cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400", text: "Verified" },
    Pending: { icon: Clock, cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400", text: "Awaiting admin approval" },
    Rejected: { icon: XCircle, cls: "bg-destructive/15 text-destructive", text: "Rejected" },
  }[user.status]
  const SIcon = status.icon
  const qr = `${API_URL}/api/verify/${user.uid}/qr.svg?base=${encodeURIComponent(typeof window !== "undefined" ? window.location.origin : "")}`

  async function save(e: React.FormEvent) {
    e.preventDefault()
    try { await api("/auth/me", { method: "PATCH", body: form }); await refresh(); setEditing(false); setMsg("Profile updated.") }
    catch (err) { setMsg(err instanceof Error ? err.message : "Could not update") }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-2xl font-bold tracking-tight">My Account</h1>

      {/* Digital ID card */}
      <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary to-primary/70 p-5 text-primary-foreground shadow-lg sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest opacity-80">Kheti Se Mandi Tak · Digital Kisan ID</p>
            <p className="mt-4 flex items-center gap-2 text-sm opacity-90"><Icon className="size-4" /> {roleLabel[user.role]}</p>
            <h2 className="mt-1 truncate text-2xl font-bold">{user.name}</h2>
            <p className="mt-0.5 text-sm opacity-90">{user.location}</p>
            <p className="mt-0.5 text-sm opacity-90">+91 {user.phone.slice(0, 5)} {user.phone.slice(5)}</p>
            <div className="mt-4 flex items-center gap-2">
              <span className="rounded-lg bg-white/15 px-3 py-1.5 font-mono text-lg font-bold tracking-wider">{user.uid}</span>
              <button type="button" aria-label="Copy ID" onClick={() => { navigator.clipboard?.writeText(user.uid); setCopied(true); setTimeout(() => setCopied(false), 1500) }} className="rounded-md p-1.5 hover:bg-white/15">
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </button>
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt={`QR code for ${user.uid}`} width={104} height={104} className="shrink-0 rounded-lg bg-white p-1.5" />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className={cn("inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 font-semibold", status.cls)}><SIcon className="size-3.5" /> {status.text}</span>
          <span className="opacity-80">Member since {user.createdAt.slice(0, 10)} · {user.phoneVerifiedAt ? "Mobile verified by OTP" : "Mobile not yet verified"}</span>
        </div>
      </div>

      {user.status === "Pending" && <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">Your ID is created. An admin must approve it before you can list crops or place bids. You can still use mandi prices, tokens, transport and price alerts.</p>}
      {user.status === "Rejected" && <p className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm">Your registration was rejected{user.adminNote ? `: ${user.adminNote}` : "."}</p>}
      <p className="text-xs text-muted-foreground">Anyone can scan the QR to check that this ID is real. Only your name initial, role, location and status are shown, never your phone number.</p>

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Profile</h3>
          {!editing && <button onClick={() => { setForm({ name: user.name, location: user.location, details: user.details || "" }); setEditing(true); setMsg("") }} className="inline-flex items-center gap-1.5 text-sm text-primary"><Pencil className="size-3.5" /> Edit</button>}
        </div>
        {editing ? (
          <form onSubmit={save} className="mt-3 space-y-3">
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={80} required placeholder="Full name" />
            <input className={inputCls} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} maxLength={120} required placeholder="Village / city, district" />
            <input className={inputCls} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} maxLength={300} placeholder="Details (crops, business, vehicle…)" />
            <div className="flex gap-2">
              <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Save</button>
              <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button>
            </div>
          </form>
        ) : (
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div><dt className="text-xs text-muted-foreground">Name</dt><dd>{user.name}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Location</dt><dd>{user.location}</dd></div>
            <div className="sm:col-span-2"><dt className="text-xs text-muted-foreground">Details</dt><dd>{user.details || "—"}</dd></div>
          </dl>
        )}
        {msg && <p role="status" className="mt-3 text-sm text-muted-foreground">{msg}</p>}
      </section>

      <button onClick={() => signOut()} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"><LogOut className="size-4" /> Log out</button>
    </div>
  )
}
