"use client"

import { useCallback, useState } from "react"
import { ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import type { View } from "@/components/app-root"
import { AdminPanel } from "@/components/views/admin-panel"
import { API_URL } from "@/lib/api"

export function AdminLogin({ navigate }: { navigate: (v: View) => void }) {
  const { t } = useI18n()
  // The session token lives in memory only: refreshing the page signs the admin out.
  const [session, setSession] = useState<{ token: string; email: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState("")

  const signOut = useCallback(() => {
    setSession((s) => {
      if (s) fetch(`${API_URL}/api/admin/logout`, { method: "POST", headers: { Authorization: `Bearer ${s.token}` } }).catch(() => {})
      return null
    })
    setPassword("")
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError("")
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || t("admin_invalid"))
      setSession({ token: data.token, email: data.email })
    } catch (err) {
      setError(err instanceof TypeError ? "Cannot reach the backend. Start it on port 5000." : err instanceof Error ? err.message : t("admin_invalid"))
    } finally {
      setBusy(false)
    }
  }

  if (session) {
    return <AdminPanel token={session.token} email={session.email} onSignOut={signOut} onBack={() => navigate("home")} />
  }

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={() => navigate("home")}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t("admin_back")}
        </button>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="size-7" />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-foreground">{t("admin_portal")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("admin_sub")}</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="admin-email" className="mb-1.5 block text-sm font-medium text-foreground">
                {t("admin_email")}
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/20">
                <Mail className="size-4 text-muted-foreground" />
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError("")
                  }}
                  placeholder="admin@khetimandi.in"
                  className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="mb-1.5 block text-sm font-medium text-foreground">
                {t("admin_password")}
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/20">
                <Lock className="size-4 text-muted-foreground" />
                <input
                  id="admin-password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError("")
                  }}
                  placeholder="••••••••"
                  className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-muted-foreground">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="size-4 rounded border-border accent-primary"
                />
                {t("admin_remember")}
              </label>
              <button type="button" className="font-medium text-primary transition-colors hover:text-primary/80">
                {t("admin_forgot")}
              </button>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {busy ? "…" : t("admin_signin")}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5" />
            {t("admin_secure")}
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">{t("admin_demo_note")}</p>
        </div>
      </div>
    </div>
  )
}
