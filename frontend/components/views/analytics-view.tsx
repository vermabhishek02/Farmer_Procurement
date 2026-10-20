"use client"

import { useEffect, useMemo, useState } from "react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { TrendingUp, ArrowUp, ArrowDown, Activity } from "lucide-react"
import { mandiPrices, priceHistory, COMMODITIES, type PricePoint } from "@/lib/mock-data"
import { fetchCommodityHistory } from "@/lib/api"
import { useI18n } from "@/lib/i18n"
import { Field, Select, SectionTitle } from "@/components/views/fields"
import { StatCard } from "@/components/views/stat-card"

export function AnalyticsView() {
  const { t } = useI18n()
  const [commodity, setCommodity] = useState(COMMODITIES[0])
  const [days, setDays] = useState(30)

  const base = useMemo(() => {
    const match = mandiPrices.find((p) => p.commodity === commodity)
    return match?.price ?? 2500
  }, [commodity])

  const fallback = useMemo(() => priceHistory(base, days), [base, days])
  // real history from the database (average across all mandis); falls back to the built-in data if the backend is offline
  const [remote, setRemote] = useState<PricePoint[] | null>(null)
  useEffect(() => {
    let cancelled = false
    setRemote(null)
    fetchCommodityHistory(commodity, days)
      .then((pts) => {
        if (!cancelled && pts.length) setRemote(pts)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [commodity, days])
  const data = remote ?? fallback

  const { avg, high, low } = useMemo(() => {
    const prices = data.map((d) => d.price)
    return {
      avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      high: Math.max(...prices),
      low: Math.min(...prices),
    }
  }, [data])

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{t("analytics_title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("mod_predictor_desc")}</p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionTitle title={t("price_trends")} />
          <div className="flex items-end gap-3">
            <Field label={t("filter_commodity")}>
              <Select value={commodity} onChange={(e) => setCommodity(e.target.value)}>
                {COMMODITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="flex rounded-lg border border-border p-0.5">
              {[7, 30].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors " +
                    (days === d ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")
                  }
                >
                  {d === 7 ? t("range_7") : t("range_30")}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                tickLine={false}
                axisLine={{ stroke: "var(--color-border)" }}
                minTickGap={24}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                width={56}
                tickFormatter={(v) => `₹${v}`}
                domain={["dataMin - 100", "dataMax + 100"]}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  fontSize: 12,
                  color: "var(--color-popover-foreground)",
                }}
                labelStyle={{ color: "var(--color-muted-foreground)" }}
                formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, commodity]}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="var(--color-primary)"
                strokeWidth={2.5}
                fill="url(#priceFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard icon={Activity} label={t("avg_price")} value={`₹${avg.toLocaleString("en-IN")}`} />
        <StatCard icon={ArrowUp} label={t("high_price")} value={`₹${high.toLocaleString("en-IN")}`} />
        <StatCard icon={ArrowDown} label={t("low_price")} value={`₹${low.toLocaleString("en-IN")}`} />
      </div>

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <SectionTitle title={t("modules_title")} />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {mandiPrices.slice(0, 6).map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl border border-border p-4">
              <div>
                <p className="text-sm font-semibold text-foreground">{p.commodity}</p>
                <p className="text-xs text-muted-foreground">{p.mandi}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-foreground">₹{p.price.toLocaleString("en-IN")}</p>
                <p
                  className={
                    "flex items-center justify-end gap-0.5 text-xs font-medium " +
                    (p.trend === "down" ? "text-destructive" : "text-primary")
                  }
                >
                  <TrendingUp className="size-3" />
                  {p.changePct > 0 ? "+" : ""}
                  {p.changePct}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
