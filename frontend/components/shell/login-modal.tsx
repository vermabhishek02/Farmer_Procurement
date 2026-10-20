"use client"

import { useEffect, useRef, useState } from "react"
import { X, Phone, Sprout, ShoppingBasket, Truck, Store, ShieldCheck, Loader2, ArrowLeft } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useAuth, rawApi, roleLabel, type Role, type User } from "@/lib/auth"
import { cn } from "@/lib/utils"

type Step = "phone" | "otp" | "details"
const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"

export function LoginModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone?: () => void }) {
  const { t } = useI18n()
  const { signIn } = useAuth()
  const [mode, setMode] = useState<"login" | "register">("login")
  const [step, setStep] = useState<Step>("phone")
  const [role, setRole] = useState<Role>("farmer")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [proof, setProof] = useState("")
  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [details, setDetails] = useState("")
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState("")
  const [devOtp, setDevOtp] = useState("")
  const [resendIn, setResendIn] = useState(0)
  const otpRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setMode("login"); setStep("phone"); setPhone(""); setOtp(""); setProof(""); setName(""); setLocation(""); setDetails(""); setErr(""); setDevOtp(""); setResendIn(0)
  }, [open])

  useEffect(() => {
    if (resendIn <= 0) return
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [resendIn])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose() }
    if (open) document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  useEffect(() => { if (step === "otp") otpRef.current?.focus() }, [step])

  if (!open) return null

  const phoneValid = /^[6-9]\d{9}$/.test(phone)
  const finish = (token: string, user: User) => { signIn(token, user); onDone?.(); onClose() }

  async function sendOtp() {
    setBusy(true); setErr("")
    try {
      const r = await rawApi<{ devOtp?: string; resendAfterSec: number }>("/auth/otp/send", { body: { phone, purpose: mode } })
      setDevOtp(r.devOtp || ""); setOtp(""); setResendIn(r.resendAfterSec); setStep("otp")
    } catch (e) {
      const d = (e as { data?: { retryAfterSec?: number } }).data
      if (d?.retryAfterSec) { setResendIn(d.retryAfterSec); setStep("otp") }
      setErr(e instanceof Error ? e.message : "Could not send OTP")
    } finally { setBusy(false) }
  }

  async function verifyOtp() {
    setBusy(true); setErr("")
    try {
      if (mode === "login") {
        const r = await rawApi<{ token: string; user: User }>("/auth/otp/verify", { body: { phone, otp, purpose: "login" } })
        finish(r.token, r.user)
      } else {
        const r = await rawApi<{ proofToken: string }>("/auth/otp/verify", { body: { phone, otp, purpose: "register" } })
        setProof(r.proofToken); setStep("details")
      }
    } catch (e) { setErr(e instanceof Error ? e.message : "Verification failed") }
    finally { setBusy(false) }
  }

  async function register(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("")
    try {
      const r = await rawApi<{ token: string; user: User }>("/auth/register", { body: { proofToken: proof, role, name, location, details } })
      finish(r.token, r.user)
    } catch (e) { setErr(e instanceof Error ? e.message : "Registration failed") }
    finally { setBusy(false) }
  }

  const roles: { id: Role; icon: typeof Sprout }[] = [
    { id: "farmer", icon: Sprout }, { id: "buyer", icon: ShoppingBasket }, { id: "seller", icon: Store }, { id: "transporter", icon: Truck },
  ]
  const detailsLabel = role === "farmer" ? "Crops grown / land size (optional)" : role === "buyer" ? "Business name & commodities (optional)" : role === "seller" ? "Shop / trade name & products (optional)" : "Vehicle type & number (optional)"

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label={t("cta_login")} className="relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-border bg-card p-6 shadow-xl sm:rounded-2xl">
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <X className="size-5" />
        </button>

        <h2 className="text-xl font-bold text-foreground">{t("login_welcome")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">Secure sign-in with a one-time password sent to your mobile.</p>

        {step === "phone" && (
          <div className="mt-4 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-sm font-medium" role="tablist">
            {(["login", "register"] as const).map((m) => (
              <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setErr("") }}
                className={cn("rounded-md py-1.5 transition-colors", mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>
                {m === "login" ? "Login" : "Register"}
              </button>
            ))}
          </div>
        )}

        {mode === "register" && step === "phone" && (
          <>
            <p className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("login_choose_role")}</p>
            <div className="grid grid-cols-4 gap-2">
              {roles.map((r) => {
                const Icon = r.icon, active = role === r.id
                return (
                  <button key={r.id} type="button" onClick={() => setRole(r.id)} aria-pressed={active}
                    className={cn("flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-[11px] font-medium transition-colors", active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground")}>
                    <Icon className="size-5" />
                    {r.id === "seller" ? "Seller" : roleLabel[r.id]}
                  </button>
                )
              })}
            </div>
          </>
        )}

        {step === "phone" && (
          <form className="mt-5 space-y-3" onSubmit={(e) => { e.preventDefault(); if (phoneValid) sendOtp() }}>
            <label className="block text-sm font-medium text-foreground" htmlFor="phone">{t("login_phone")}</label>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 focus-within:border-primary">
              <Phone className="size-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">+91</span>
              <input id="phone" inputMode="numeric" autoComplete="tel-national" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="98765 43210" className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground" />
            </div>
            {phone.length === 10 && !phoneValid && <p className="text-xs text-destructive">Indian mobile numbers start with 6, 7, 8 or 9.</p>}
            <button type="submit" disabled={!phoneValid || busy} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
              {busy && <Loader2 className="size-4 animate-spin" />} {t("login_send_otp")}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form className="mt-5 space-y-3" onSubmit={(e) => { e.preventDefault(); if (otp.length === 6) verifyOtp() }}>
            <button type="button" onClick={() => { setStep("phone"); setErr("") }} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" /> Change number</button>
            <p className="text-sm font-medium text-foreground">Enter the 6-digit OTP sent to +91 {phone}</p>
            <input ref={otpRef} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="••••••" aria-label="OTP" className="w-full rounded-lg border border-border bg-background px-3 py-3 text-center text-2xl font-bold tracking-[0.5em] outline-none focus:border-primary" />
            {devOtp && (
              <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-foreground">
                <strong>Dev mode</strong> — no SMS provider is configured on the server, so no text message was sent. Your OTP is <button type="button" className="font-bold underline" onClick={() => setOtp(devOtp)}>{devOtp}</button>.
              </p>
            )}
            <button type="submit" disabled={otp.length < 6 || busy} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
              {busy && <Loader2 className="size-4 animate-spin" />} {t("login_verify")}
            </button>
            <button type="button" disabled={resendIn > 0 || busy} onClick={sendOtp} className="w-full text-sm text-primary disabled:text-muted-foreground">
              {resendIn > 0 ? `Resend OTP in ${resendIn}s` : "Resend OTP"}
            </button>
          </form>
        )}

        {step === "details" && (
          <form className="mt-5 space-y-3" onSubmit={register}>
            <p className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm text-foreground"><ShieldCheck className="size-4 text-primary" /> +91 {phone} verified as {roleLabel[role]}</p>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" maxLength={80} required className={inputCls} />
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Village / city, district" maxLength={120} required className={inputCls} />
            <input value={details} onChange={(e) => setDetails(e.target.value)} placeholder={detailsLabel} maxLength={300} className={inputCls} />
            <button type="submit" disabled={busy || !name.trim() || !location.trim()} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
              {busy && <Loader2 className="size-4 animate-spin" />} Create my Kisan ID
            </button>
            <p className="text-[11px] text-muted-foreground">You get your unique ID instantly. An admin approves new accounts before you can list crops or place bids.</p>
          </form>
        )}

        {err && <p role="alert" className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>}
      </div>
    </div>
  )
}
