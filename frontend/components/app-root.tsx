"use client"

import { useEffect, useState } from "react"
import { I18nProvider, useI18n } from "@/lib/i18n"
import { AuthProvider } from "@/lib/auth"
import { Sidebar } from "@/components/shell/sidebar"
import { TopHeader } from "@/components/shell/top-header"
import { BottomNav } from "@/components/shell/bottom-nav"
import { LoginModal } from "@/components/shell/login-modal"
import { LandingPage } from "@/components/views/landing-page"
import { FarmerDashboard } from "@/components/views/farmer-dashboard"
import { TransporterDashboard } from "@/components/views/transporter-dashboard"
import { AnalyticsView } from "@/components/views/analytics-view"
import { StorageView } from "@/components/views/storage-view"
import { AdminLogin } from "@/components/views/admin-login"
import { AccountView } from "@/components/views/account-view"
import { VerifyModal } from "@/components/views/verify-modal"

export type View = "home" | "farmer" | "transport" | "analytics" | "storage" | "admin" | "account"

function Shell() {
  const [view, setView] = useState<View>("home")
  const [loginOpen, setLoginOpen] = useState(false)
  const [verifyUid, setVerifyUid] = useState<string | null>(null)
  const { t } = useI18n()

  // QR code on a Digital Kisan ID opens /?verify=KS-F-xxxxxxxx
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("verify")
    if (v) setVerifyUid(v.trim().slice(0, 20))
  }, [])

  const navigate = (v: View) => {
    setView(v)
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="flex">
        <Sidebar view={view} navigate={navigate} onLogin={() => setLoginOpen(true)} />
        <div className="flex min-h-dvh w-full flex-1 flex-col">
          <TopHeader view={view} onLogin={() => setLoginOpen(true)} navigate={navigate} />
          <main className="flex-1 pb-24 lg:pb-0">
            {view === "home" && <LandingPage navigate={navigate} onLogin={() => setLoginOpen(true)} />}
            {view === "farmer" && <FarmerDashboard onLogin={() => setLoginOpen(true)} />}
            {view === "transport" && <TransporterDashboard />}
            {view === "analytics" && <AnalyticsView />}
            {view === "storage" && <StorageView />}
            {view === "admin" && <AdminLogin navigate={navigate} />}
            {view === "account" && <AccountView onLogin={() => setLoginOpen(true)} />}
          </main>
          <footer className="hidden border-t border-border bg-card px-6 py-4 text-center text-sm text-muted-foreground lg:block">
            {t("appName")} — {t("tagline")} · © 2026
          </footer>
        </div>
      </div>
      <BottomNav view={view} navigate={navigate} />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      {verifyUid && <VerifyModal uid={verifyUid} onClose={() => { setVerifyUid(null); window.history.replaceState({}, "", window.location.pathname) }} />}
    </div>
  )
}

export function AppRoot() {
  return (
    <I18nProvider>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </I18nProvider>
  )
}
