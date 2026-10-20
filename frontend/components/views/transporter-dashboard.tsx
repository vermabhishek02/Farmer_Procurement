"use client"

import { useState } from "react"
import { IndianRupee, PackageCheck, MapPin, ArrowRight, Boxes } from "lucide-react"
import { transportJobs as initialJobs, type TransportJob } from "@/lib/mock-data"
import { useI18n } from "@/lib/i18n"
import { inr } from "@/lib/format"
import { StatCard } from "@/components/views/stat-card"
import { cn } from "@/lib/utils"

const STATUS_FLOW: TransportJob["status"][] = ["Requested", "En Route", "Loaded", "Delivered"]

export function TransporterDashboard() {
  const { t } = useI18n()
  const [jobs, setJobs] = useState<TransportJob[]>(initialJobs)

  const statusLabel = (s: TransportJob["status"]) =>
    s === "Requested" ? t("st_requested") : s === "En Route" ? t("st_enroute") : s === "Loaded" ? t("st_loaded") : t("st_delivered")

  const pending = jobs.filter((j) => j.status === "Requested")
  const active = jobs.filter((j) => j.status !== "Requested")

  const acceptJob = (id: string) =>
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status: "En Route" } : j)))

  const advance = (id: string) =>
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== id) return j
        const idx = STATUS_FLOW.indexOf(j.status)
        const next = STATUS_FLOW[Math.min(idx + 1, STATUS_FLOW.length - 1)]
        return { ...j, status: next }
      }),
    )

  const earnings = active.reduce((sum, j) => sum + j.fare, 0)
  const completed = jobs.filter((j) => j.status === "Delivered").length

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{t("transporter_dashboard")}</h1>
        <p className="mt-1 text-muted-foreground">{t("tagline")}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard icon={IndianRupee} label={t("earnings_today")} value={inr(earnings)} />
        <StatCard icon={PackageCheck} label={t("jobs_completed")} value={String(completed)} />
        <StatCard icon={Boxes} label={t("active_jobs")} value={String(active.length)} />
      </div>

      {/* Pending */}
      <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <h2 className="text-lg font-bold text-foreground">{t("pending_requests")}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {pending.map((j) => (
            <div key={j.id} className="rounded-xl border border-border p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">
                  {j.crop} · {j.quantity} qtl
                </span>
                <span className="text-sm font-bold text-primary">{inr(j.fare)}</span>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" />
                <span className="truncate">{j.pickup}</span>
                <ArrowRight className="size-3 shrink-0" />
                <span className="truncate">{j.destination}</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("farmer_label")}: {j.farmer} · {j.distanceKm} km · {j.date}
              </p>
              <button
                type="button"
                onClick={() => acceptJob(j.id)}
                className="mt-3 w-full rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {t("accept_job")}
              </button>
            </div>
          ))}
          {pending.length === 0 && (
            <p className="py-6 text-sm text-muted-foreground">{t("no_results")}</p>
          )}
        </div>
      </section>

      {/* Active */}
      <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <h2 className="text-lg font-bold text-foreground">{t("active_jobs")}</h2>
        <div className="mt-4 space-y-3">
          {active.map((j) => {
            const idx = STATUS_FLOW.indexOf(j.status)
            const delivered = j.status === "Delivered"
            return (
              <div key={j.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-foreground">
                    {j.crop} · {j.quantity} qtl
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      delivered ? "bg-primary/10 text-primary" : "bg-accent/15 text-accent-foreground",
                    )}
                  >
                    {statusLabel(j.status)}
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="size-3.5 shrink-0" />
                  <span className="truncate">{j.pickup}</span>
                  <ArrowRight className="size-3 shrink-0" />
                  <span className="truncate">{j.destination}</span>
                </p>

                {/* progress */}
                <div className="mt-3 flex items-center gap-1">
                  {STATUS_FLOW.map((s, i) => (
                    <div key={s} className="flex flex-1 items-center gap-1">
                      <div
                        className={cn(
                          "h-1.5 flex-1 rounded-full",
                          i <= idx ? "bg-primary" : "bg-muted",
                        )}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                  <span>{t("st_requested")}</span>
                  <span>{t("st_delivered")}</span>
                </div>

                {!delivered && (
                  <button
                    type="button"
                    onClick={() => advance(j.id)}
                    className="mt-3 w-full rounded-lg border border-border bg-card py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                  >
                    {t("update_status")}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
