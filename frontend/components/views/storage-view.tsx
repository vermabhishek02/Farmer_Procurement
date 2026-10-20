"use client"

import { useMemo, useState } from "react"
import { Snowflake, MapPin, CheckCircle2, Warehouse } from "lucide-react"
import { coldStorages, STATES } from "@/lib/mock-data"
import { useI18n } from "@/lib/i18n"
import { Field, Select, SectionTitle } from "@/components/views/fields"
import { StatCard } from "@/components/views/stat-card"
import { cn } from "@/lib/utils"

export function StorageView() {
  const { t } = useI18n()
  const [state, setState] = useState("all")
  const [bookedId, setBookedId] = useState<string | null>(null)

  const rows = useMemo(
    () => coldStorages.filter((c) => state === "all" || c.state === state),
    [state],
  )

  const totalOpen = coldStorages.reduce((s, c) => s + Math.round((c.capacityTonnes * c.openPct) / 100), 0)

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{t("storage_title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("mod_storage_desc")}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard icon={Warehouse} label={t("stores")} value={String(coldStorages.length)} />
        <StatCard
          icon={Snowflake}
          label={t("open_capacity")}
          value={`${totalOpen.toLocaleString("en-IN")} t`}
        />
      </div>

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionTitle title={t("storage_title")} />
          <div className="sm:w-56">
            <Field label={t("filter_state")}>
              <Select value={state} onChange={(e) => setState(e.target.value)}>
                <option value="all">{t("all")}</option>
                {STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((c) => {
            const booked = bookedId === c.id
            const openTonnes = Math.round((c.capacityTonnes * c.openPct) / 100)
            return (
              <div key={c.id} className="flex flex-col rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-foreground">{c.name}</h3>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3" />
                      {c.location}, {c.state} · {c.distanceKm} km
                    </p>
                  </div>
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Snowflake className="size-4" />
                  </span>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{t("open_capacity")}</span>
                    <span className="font-medium text-foreground">
                      {openTonnes.toLocaleString("en-IN")} t ({c.openPct}%)
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        c.openPct >= 50 ? "bg-primary" : c.openPct >= 25 ? "bg-accent" : "bg-destructive",
                      )}
                      style={{ width: `${c.openPct}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.commodities.map((com) => (
                    <span key={com} className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                      {com}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-sm">
                    <span className="font-bold text-foreground">₹{c.pricePerQuintal}</span>
                    <span className="text-xs text-muted-foreground">{t("per_quintal")}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setBookedId(booked ? null : c.id)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                      booked ? "bg-primary/10 text-primary" : "bg-primary text-primary-foreground hover:bg-primary/90",
                    )}
                  >
                    {booked ? <CheckCircle2 className="size-3.5" /> : null}
                    {booked ? t("verified") : t("book_slot")}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
