"use client"

import { useCallback, useEffect, useState } from "react"
import {
  ShieldCheck, LogOut, Users, Truck, Ticket, Database, LayoutDashboard, Check, X, Download, Search, RefreshCw,
  Sprout, ShoppingBasket, Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { StatCard } from "@/components/views/stat-card"
import { inr } from "@/lib/format"
import {
  adminFetch, adminDownload, AdminAuthError,
  type Registration, type TransportRequest, type AdminToken, type Summary,
} from "@/lib/admin-api"

type Tab = "overview" | "registrations" | "transport" | "tokens" | "database"

const STATUS_STYLE: Record<string, string> = {
  Pending: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  Requested: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  Booked: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  Approved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  Completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  "Checked In": "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  Rejected: "bg-destructive/15 text-destructive",
  Cancelled: "bg-destructive/15 text-destructive",
}

function Badge({ status }: { status: string }) {
  return (
    <span className={cn("inline-block rounded-full px-2 py-0.5 text-xs font-semibold", STATUS_STYLE[status] || "bg-muted text-muted-foreground")}>
      {status}
    </span>
  )
}

function ActionButtons({ onApprove, onReject, busy }: { onApprove: () => void; onReject: () => void; busy?: boolean }) {
  return (
    <div className="flex gap-2">
      <button type="button" disabled={busy} onClick={onApprove} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
        <Check className="size-3.5" /> Approve
      </button>
      <button type="button" disabled={busy} onClick={onReject} className="inline-flex items-center gap-1 rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50">
        <X className="size-3.5" /> Reject
      </button>
    </div>
  )
}

const selectCls = "rounded-lg border border-border bg-background px-3 py-2 text-sm"

export function AdminPanel({ token, email, onSignOut, onBack }: { token: string; email: string; onSignOut: () => void; onBack: () => void }) {
  const [tab, setTab] = useState<Tab>("overview")
  const [summary, setSummary] = useState<Summary | null>(null)
  const [error, setError] = useState("")

  // Any admin call that fails with 401 ends the session.
  const run = useCallback(
    async <T,>(path: string, init?: { method?: string; body?: unknown }): Promise<T> => {
      try {
        return await adminFetch<T>(token, path, init)
      } catch (e) {
        if (e instanceof AdminAuthError) onSignOut()
        throw e
      }
    },
    [token, onSignOut],
  )

  const loadSummary = useCallback(() => {
    run<Summary>("/admin/summary").then(setSummary).catch((e) => setError(e.message))
  }, [run])
  useEffect(loadSummary, [loadSummary])

  const pendingRegs = summary?.registrations.Pending || 0
  const pendingJobs = summary?.transport.Requested || 0

  const tabs: { id: Tab; label: string; icon: typeof Users; badge?: number }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "registrations", label: "Registrations", icon: Users, badge: pendingRegs },
    { id: "transport", label: "Transport requests", icon: Truck, badge: pendingJobs },
    { id: "tokens", label: "Queue tokens", icon: Ticket },
    { id: "database", label: "Database", icon: Database },
  ]

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="size-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onBack} className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">Back to site</button>
          <button type="button" onClick={onSignOut} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            <LogOut className="size-4" /> Sign Out
          </button>
        </div>
      </div>

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-border" role="tablist">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {t.label}
              {t.badge ? <span className="rounded-full bg-destructive px-1.5 text-[11px] font-bold text-white">{t.badge}</span> : null}
            </button>
          )
        })}
      </div>

      {error && <p role="alert" className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      <div className="mt-6">
        {tab === "overview" && <Overview summary={summary} go={setTab} />}
        {tab === "registrations" && <Registrations run={run} token={token} onChanged={loadSummary} />}
        {tab === "transport" && <TransportRequests run={run} token={token} onChanged={loadSummary} />}
        {tab === "tokens" && <Tokens run={run} token={token} onChanged={loadSummary} />}
        {tab === "database" && <DatabaseExplorer run={run} />}
      </div>
    </div>
  )
}

type Run = <T>(path: string, init?: { method?: string; body?: unknown }) => Promise<T>

function Overview({ summary, go }: { summary: Summary | null; go: (t: Tab) => void }) {
  if (!summary) return <p className="text-sm text-muted-foreground">Loading…</p>
  const approved = (role: string) => summary.registrationsByRole.find((r) => r.role === role)?.n || 0
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <button type="button" onClick={() => go("registrations")} className="text-left"><StatCard icon={Clock} label="Pending registrations" value={String(summary.registrations.Pending || 0)} hint="Tap to review" /></button>
        <button type="button" onClick={() => go("transport")} className="text-left"><StatCard icon={Truck} label="Pending transport requests" value={String(summary.transport.Requested || 0)} hint="Tap to review" /></button>
        <StatCard icon={Ticket} label="Today's mandi tokens" value={String(summary.todayTokens)} />
        <StatCard icon={Users} label="Approved users" value={String(summary.registrationsByRole.reduce((a, r) => a + r.n, 0))} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Sprout} label="Farmers" value={String(approved("farmer"))} />
        <StatCard icon={ShoppingBasket} label="Buyers" value={String(approved("buyer"))} />
        <StatCard icon={Truck} label="Transporters" value={String(approved("transporter"))} />
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold text-foreground">Recent admin actions</h2>
        {summary.recent.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No actions yet. Approvals and rejections will show up here.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {summary.recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="text-foreground"><b>{r.action.replace("_", " ")}</b> · {r.table_name}{r.record_id ? ` #${r.record_id}` : ""}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{r.created_at}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function useList<T>(run: Run, path: string) {
  const [rows, setRows] = useState<T[] | null>(null)
  const [error, setError] = useState("")
  const load = useCallback(() => {
    setError("")
    run<T[]>(path).then(setRows).catch((e) => setError(e.message))
  }, [run, path])
  useEffect(load, [load])
  return { rows, error, load, setError }
}

function Toolbar({ children, onRefresh, exportKey, token }: { children: React.ReactNode; onRefresh: () => void; exportKey?: string; token: string }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {children}
      <button type="button" onClick={onRefresh} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"><RefreshCw className="size-4" /> Refresh</button>
      {exportKey && (
        <button type="button" onClick={() => adminDownload(token, exportKey).catch(() => alert("Export failed"))} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"><Download className="size-4" /> CSV</button>
      )}
    </div>
  )
}

function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex min-w-48 flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3">
      <Search className="size-4 text-muted-foreground" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Search name, phone…" className="w-full bg-transparent py-2 text-sm outline-none" />
    </div>
  )
}

function Registrations({ run, token, onChanged }: { run: Run; token: string; onChanged: () => void }) {
  const [status, setStatus] = useState("Pending")
  const [role, setRole] = useState("all")
  const [q, setQ] = useState("")
  const [dq, setDq] = useState("")
  const [note, setNote] = useState("")
  const [selected, setSelected] = useState<number[]>([])
  const [busy, setBusy] = useState(false)
  useEffect(() => { const h = setTimeout(() => setDq(q), 300); return () => clearTimeout(h) }, [q])

  const { rows, error, load, setError } = useList<Registration>(run, `/admin/registrations?status=${status}&role=${role}&q=${encodeURIComponent(dq)}`)
  useEffect(() => setSelected([]), [rows])

  async function decide(ids: number[], next: "Approved" | "Rejected") {
    setBusy(true); setError("")
    try {
      if (ids.length === 1) await run(`/admin/registrations/${ids[0]}`, { method: "PATCH", body: { status: next, note } })
      else await run("/admin/registrations/bulk", { method: "POST", body: { ids, status: next, note } })
      load(); onChanged()
    } catch (e) { setError(e instanceof Error ? e.message : "Failed") }
    finally { setBusy(false) }
  }

  const pendingIds = (rows || []).filter((r) => r.status === "Pending").map((r) => r.id)

  return (
    <div>
      <Toolbar onRefresh={load} exportKey="registrations" token={token}>
        <select className={selectCls} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status"><option value="Pending">Pending</option><option value="Approved">Approved</option><option value="Rejected">Rejected</option><option value="all">All</option></select>
        <select className={selectCls} value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role"><option value="all">All roles</option><option value="farmer">Farmer</option><option value="buyer">Buyer</option><option value="seller">Seller</option><option value="transporter">Transporter</option></select>
        <SearchBox value={q} onChange={setQ} />
      </Toolbar>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="Note / reason (shown to the applicant, optional)" className="min-w-48 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
        <span className="text-xs text-muted-foreground">{selected.length} selected</span>
        <ActionButtons busy={busy || selected.length === 0} onApprove={() => decide(selected, "Approved")} onReject={() => decide(selected, "Rejected")} />
      </div>

      {error && <p role="alert" className="mb-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {!rows ? <p className="text-sm text-muted-foreground">Loading…</p> : rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No registrations here.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2"><input type="checkbox" aria-label="Select all pending" checked={pendingIds.length > 0 && pendingIds.every((i) => selected.includes(i))} onChange={(e) => setSelected(e.target.checked ? pendingIds : [])} className="accent-primary" /></th>
                <th className="px-3 py-2">Applicant</th><th className="px-3 py-2">Role</th><th className="px-3 py-2">Location / details</th><th className="px-3 py-2">Applied</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border align-top">
                  <td className="px-3 py-3">{r.status === "Pending" && <input type="checkbox" aria-label={`Select ${r.name}`} checked={selected.includes(r.id)} onChange={(e) => setSelected((s) => (e.target.checked ? [...s, r.id] : s.filter((x) => x !== r.id)))} className="accent-primary" />}</td>
                  <td className="px-3 py-3"><p className="font-semibold text-foreground">{r.name}</p><p className="text-xs text-muted-foreground">+91 {r.phone}{r.phoneVerifiedAt ? " ✓ OTP" : ""}</p>{r.uid && <p className="font-mono text-[11px] text-primary">{r.uid}</p>}</td>
                  <td className="px-3 py-3 capitalize">{r.role}</td>
                  <td className="max-w-64 px-3 py-3"><p>{r.location}</p>{r.details && <p className="text-xs text-muted-foreground">{r.details}</p>}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-muted-foreground">{r.createdAt}</td>
                  <td className="px-3 py-3"><Badge status={r.status} />{r.adminNote && <p className="mt-1 max-w-40 text-xs text-muted-foreground">{r.adminNote}</p>}</td>
                  <td className="px-3 py-3">
                    {r.status === "Pending" ? <ActionButtons busy={busy} onApprove={() => decide([r.id], "Approved")} onReject={() => decide([r.id], "Rejected")} />
                      : <button type="button" disabled={busy} onClick={() => run(`/admin/registrations/${r.id}`, { method: "PATCH", body: { status: "Pending" } }).then(() => { load(); onChanged() }).catch((e) => setError(e.message))} className="text-xs font-medium text-primary hover:underline">Reopen</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function TransportRequests({ run, token, onChanged }: { run: Run; token: string; onChanged: () => void }) {
  const [status, setStatus] = useState("Requested")
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const { rows, error, load, setError } = useList<TransportRequest>(run, `/admin/transport-requests?status=${status}`)

  async function decide(id: string, next: "Approved" | "Rejected") {
    setBusy(true); setError("")
    try { await run(`/admin/transport-requests/${id}`, { method: "PATCH", body: { status: next, note } }); load(); onChanged() }
    catch (e) { setError(e instanceof Error ? e.message : "Failed") }
    finally { setBusy(false) }
  }

  return (
    <div>
      <Toolbar onRefresh={load} exportKey="transport" token={token}>
        <select className={selectCls} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status"><option value="Requested">Pending</option><option value="Approved">Approved</option><option value="Rejected">Rejected</option><option value="all">All</option></select>
        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="Note / reason (optional)" className="min-w-48 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
      </Toolbar>
      {error && <p role="alert" className="mb-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {!rows ? <p className="text-sm text-muted-foreground">Loading…</p> : rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No transport requests here.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((j) => (
            <div key={j.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div><p className="font-semibold text-foreground">{j.crop} · {j.quantity} qtl</p><p className="text-xs text-muted-foreground">{j.farmer} · {j.date}</p></div>
                <Badge status={j.status === "Requested" ? "Pending" : j.status} />
              </div>
              <p className="mt-2 text-sm text-foreground">{j.pickup} → {j.destination}</p>
              <p className="text-xs text-muted-foreground">{j.distanceKm} km · {inr(j.fare)}</p>
              {j.adminNote && <p className="mt-1 text-xs text-muted-foreground">Note: {j.adminNote}</p>}
              {["Requested", "Approved", "Rejected"].includes(j.status) && (
                <div className="mt-3"><ActionButtons busy={busy} onApprove={() => decide(j.id, "Approved")} onReject={() => decide(j.id, "Rejected")} /></div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Tokens({ run, token, onChanged }: { run: Run; token: string; onChanged: () => void }) {
  const [status, setStatus] = useState("all")
  const [date, setDate] = useState("")
  const [q, setQ] = useState("")
  const [dq, setDq] = useState("")
  useEffect(() => { const h = setTimeout(() => setDq(q), 300); return () => clearTimeout(h) }, [q])
  const { rows, error, load, setError } = useList<AdminToken>(run, `/admin/tokens?status=${status}&date=${date}&q=${encodeURIComponent(dq)}`)

  async function setTokenStatus(id: number, next: AdminToken["status"]) {
    setError("")
    try { await run(`/admin/tokens/${id}`, { method: "PATCH", body: { status: next } }); load(); onChanged() }
    catch (e) { setError(e instanceof Error ? e.message : "Failed") }
  }

  return (
    <div>
      <Toolbar onRefresh={load} exportKey="tokens" token={token}>
        <select className={selectCls} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status"><option value="all">All</option><option>Booked</option><option>Checked In</option><option>Completed</option><option>Cancelled</option></select>
        <input type="date" className={selectCls} value={date} onChange={(e) => setDate(e.target.value)} aria-label="Sale date" />
        <SearchBox value={q} onChange={setQ} />
      </Toolbar>
      {error && <p role="alert" className="mb-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {!rows ? <p className="text-sm text-muted-foreground">Loading…</p> : rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No tokens found.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="px-3 py-2">Token</th><th className="px-3 py-2">Farmer</th><th className="px-3 py-2">Mandi / crop</th><th className="px-3 py-2">Slot</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Action</th></tr></thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="border-t border-border align-top">
                  <td className="whitespace-nowrap px-3 py-3 font-mono text-xs">{t.tokenCode}</td>
                  <td className="px-3 py-3"><p className="font-semibold text-foreground">{t.farmerName}</p><p className="text-xs text-muted-foreground">+91 {t.phone}</p></td>
                  <td className="px-3 py-3"><p>{t.mandiName}</p><p className="text-xs text-muted-foreground">{t.crop} · {t.quantityQtl} qtl</p></td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs">{t.saleDate}<br />{t.timeSlot}</td>
                  <td className="px-3 py-3"><Badge status={t.status} /></td>
                  <td className="px-3 py-3">
                    <select value={t.status} onChange={(e) => setTokenStatus(t.id, e.target.value as AdminToken["status"])} className="rounded-lg border border-border bg-background px-2 py-1 text-xs" aria-label={`Status of ${t.tokenCode}`}>
                      <option>Booked</option><option>Checked In</option><option>Completed</option><option>Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const TABLES = ["registrations", "mandi_tokens", "transport_jobs", "mandis", "mandi_prices", "price_history", "buyers", "cold_storages", "commodities", "states", "vehicles", "admin_audit_log"]

function DatabaseExplorer({ run }: { run: Run }) {
  const [table, setTable] = useState("registrations")
  const [counts, setCounts] = useState<Record<string, number> | null>(null)
  const [data, setData] = useState<{ table: string; rows: Record<string, unknown>[] } | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => { run<{ counts: Record<string, number> }>("/admin/overview").then((d) => setCounts(d.counts)).catch((e) => setError(e.message)) }, [run])

  async function loadTable() {
    setBusy(true); setError("")
    try { setData(await run(`/admin/database/${encodeURIComponent(table)}`)) }
    catch (e) { setError(e instanceof Error ? e.message : "Could not read table") }
    finally { setBusy(false) }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-base font-semibold text-foreground">Database Control Center</h2>
      <p className="mt-1 text-sm text-muted-foreground">Read-only view of the live database (max 500 rows per table; every read is logged).</p>
      {counts && <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-4">{(Object.entries(counts) as [string, number][]).map(([name, count]) => <div key={name} className="rounded-lg border border-border p-3"><p className="break-all text-xs text-muted-foreground">{name}</p><p className="mt-1 text-xl font-bold">{count.toLocaleString()}</p></div>)}</div>}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <select value={table} onChange={(e) => setTable(e.target.value)} className={selectCls}>{TABLES.map((t) => <option key={t}>{t}</option>)}</select>
        <button type="button" disabled={busy} onClick={loadTable} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">{busy ? "Loading…" : "View table records"}</button>
      </div>
      {error && <p role="alert" className="mt-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {data && (
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <p className="border-b border-border bg-muted px-3 py-2 text-sm font-semibold">{data.table} · {data.rows.length} rows</p>
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50"><tr>{Object.keys(data.rows[0] || {}).map((k) => <th key={k} className="whitespace-nowrap px-3 py-2">{k}</th>)}</tr></thead>
            <tbody>{data.rows.slice(0, 100).map((row, i) => <tr key={i} className="border-t border-border">{Object.values(row).map((v, j) => <td key={j} className="max-w-56 whitespace-nowrap px-3 py-2">{v === null ? "—" : String(v)}</td>)}</tr>)}</tbody>
          </table>
          {data.rows.length > 100 && <p className="p-2 text-xs text-muted-foreground">Showing first 100 rows in the UI.</p>}
        </div>
      )}
    </div>
  )
}
