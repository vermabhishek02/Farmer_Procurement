"use client"

import { useState } from "react"
import { Wheat, Truck, IndianRupee, Store, TrendingUp, Users, Gavel, BellRing } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { inr } from "@/lib/format"
import { farmerStats } from "@/lib/mock-data"
import { StatCard } from "@/components/views/stat-card"
import { PriceChecker } from "@/components/views/price-checker"
import { TokenBooking } from "@/components/views/token-booking"
import { TransportBooking } from "@/components/views/transport-booking"
import { BuyerMarketplace } from "@/components/views/buyer-marketplace"
import { CropBids } from "@/components/views/crop-bids"
import { PriceAlerts } from "@/components/views/price-alerts"
import { cn } from "@/lib/utils"

type Tab = "prices" | "bids" | "alerts" | "tokens" | "transport" | "buyers"

export function FarmerDashboard({ onLogin }: { onLogin: () => void }) {
  const { t } = useI18n()
  const [tab, setTab] = useState<Tab>("prices")

  const tabs: { id: Tab; label: string; icon: typeof TrendingUp }[] = [
    { id: "prices", label: t("price_checker"), icon: TrendingUp },
    { id: "bids", label: "Live Bids", icon: Gavel },
    { id: "alerts", label: "Alerts & MSP", icon: BellRing },
    { id: "tokens", label: "Mandi Token", icon: Store },
    { id: "transport", label: t("book_transport"), icon: Truck },
    { id: "buyers", label: t("marketplace"), icon: Users },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{t("farmer_dashboard")}</h1>
        <p className="mt-1 text-muted-foreground">{t("welcome")}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Wheat} label={t("stat_harvest")} value={`${farmerStats.registeredHarvest} qtl`} />
        <StatCard icon={Truck} label={t("stat_bookings")} value={String(farmerStats.activeBookings)} />
        <StatCard
          icon={IndianRupee}
          label={t("stat_earnings")}
          value={inr(farmerStats.estimatedEarnings, { compact: true })}
        />
        <StatCard icon={Store} label={t("stat_mandis")} value={String(farmerStats.favoriteMandis)} />
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1">
        {tabs.map((tb) => {
          const Icon = tb.icon
          const active = tab === tb.id
          return (
            <button
              key={tb.id}
              type="button"
              onClick={() => setTab(tb.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
              )}
            >
              <Icon className="size-4" />
              {tb.label}
            </button>
          )
        })}
      </div>

      {tab === "prices" && <PriceChecker />}
      {tab === "bids" && <CropBids onLogin={onLogin} />}
      {tab === "alerts" && <PriceAlerts onLogin={onLogin} />}
      {tab === "tokens" && <TokenBooking />}
      {tab === "transport" && <TransportBooking />}
      {tab === "buyers" && <BuyerMarketplace />}
    </div>
  )
}
