"use client"

import Image from "next/image"
import {
  TrendingUp,
  Truck,
  Users,
  Snowflake,
  LineChart,
  ArrowRight,
  MapPin,
  Handshake,
  IndianRupee,
} from "lucide-react"
import type { View } from "@/components/app-root"
import { useI18n } from "@/lib/i18n"
import { PriceTicker } from "@/components/views/price-ticker"

export function LandingPage({
  navigate,
  onLogin,
}: {
  navigate: (v: View) => void
  onLogin: () => void
}) {
  const { t } = useI18n()

  const modules = [
    { icon: TrendingUp, title: t("mod_rates"), desc: t("mod_rates_desc"), view: "farmer" as View },
    { icon: Truck, title: t("mod_transport"), desc: t("mod_transport_desc"), view: "farmer" as View },
    { icon: Users, title: t("mod_buyers"), desc: t("mod_buyers_desc"), view: "farmer" as View },
    { icon: Snowflake, title: t("mod_storage"), desc: t("mod_storage_desc"), view: "storage" as View },
    { icon: LineChart, title: t("mod_predictor"), desc: t("mod_predictor_desc"), view: "analytics" as View },
  ]

  const steps = [
    { icon: MapPin, title: t("mod_rates"), desc: t("mod_rates_desc") },
    { icon: Handshake, title: t("mod_buyers"), desc: t("mod_buyers_desc") },
    { icon: Truck, title: t("mod_transport"), desc: t("mod_transport_desc") },
    { icon: IndianRupee, title: t("stat_earnings"), desc: t("mod_predictor_desc") },
  ]

  return (
    <div>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src="/images/hero-farm.png"
            alt="Indian farmer using a phone in a wheat field with a produce truck heading to market"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/40" />
        </div>
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <span className="size-1.5 rounded-full bg-primary" />
              {t("appName")}
            </span>
            <h1 className="mt-4 text-balance text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {t("hero_title")}
            </h1>
            <p className="mt-4 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
              {t("hero_subtitle")}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate("farmer")}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                <TrendingUp className="size-4" />
                {t("cta_mandi")}
              </button>
              <button
                type="button"
                onClick={() => navigate("farmer")}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <Truck className="size-4" />
                {t("cta_transport")}
              </button>
              <button
                type="button"
                onClick={onLogin}
                className="inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
              >
                {t("cta_login")}
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Live price ticker */}
      <PriceTicker />

      {/* Modules */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{t("modules_title")}</h2>
          <p className="mt-2 text-muted-foreground">{t("modules_subtitle")}</p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => {
            const Icon = m.icon
            return (
              <button
                key={m.title}
                type="button"
                onClick={() => navigate(m.view)}
                className="group flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-6 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="size-5" />
                </span>
                <h3 className="text-base font-semibold text-foreground">{m.title}</h3>
                <p className="text-sm text-muted-foreground">{m.desc}</p>
                <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-medium text-primary">
                  {t("cta_mandi")}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("tagline")}
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => {
              const Icon = s.icon
              return (
                <div key={s.title} className="relative flex flex-col items-center text-center">
                  <span className="flex size-14 items-center justify-center rounded-full border-2 border-primary/30 bg-card text-primary">
                    <Icon className="size-6" />
                  </span>
                  <span className="mt-3 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <h3 className="mt-2 text-sm font-semibold text-foreground">{s.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{s.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex flex-col items-center gap-5 rounded-3xl bg-primary px-6 py-12 text-center text-primary-foreground sm:px-12">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("hero_title")}</h2>
          <p className="max-w-xl text-primary-foreground/90">{t("hero_subtitle")}</p>
          <button
            type="button"
            onClick={onLogin}
            className="inline-flex items-center gap-2 rounded-lg bg-card px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-card/90"
          >
            {t("cta_login")}
            <ArrowRight className="size-4" />
          </button>
        </div>
      </section>
    </div>
  )
}
