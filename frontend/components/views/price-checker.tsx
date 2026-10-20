"use client"

import { useMemo, useState } from "react"
import { TrendingUp, TrendingDown, Minus, Search } from "lucide-react"
import { useMandiPrices } from "@/lib/use-mandi-data"
import { useI18n } from "@/lib/i18n"
import { Field, Select, TextInput, SectionTitle } from "@/components/views/fields"
import { cn } from "@/lib/utils"

export function PriceChecker() {
  const { t, lang } = useI18n()
  const { prices: mandiPrices, states: STATES, commodities: COMMODITIES } = useMandiPrices()
  const [state, setState] = useState("all")
  const [commodity, setCommodity] = useState("all")
  const [query, setQuery] = useState("")

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return mandiPrices.filter((p) => {
      if (state !== "all" && p.state !== state) return false
      if (commodity !== "all" && p.commodity !== commodity) return false
      if (q && !`${p.commodity} ${p.commodityHi} ${p.mandi} ${p.district}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [mandiPrices, state, commodity, query])

  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
      <SectionTitle title={t("price_checker")} desc={t("mod_rates_desc")} />

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
        <Field label={t("filter_commodity")}>
          <Select value={commodity} onChange={(e) => setCommodity(e.target.value)}>
            <option value="all">{t("all")}</option>
            {COMMODITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        <div className="sm:col-span-2">
          <Field label={t("search_ph")}>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <TextInput
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("search_ph")}
                className="pl-9"
              />
            </div>
          </Field>
        </div>
      </div>

      {/* Desktop table */}
      <div className="mt-5 hidden overflow-hidden rounded-xl border border-border md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">{t("col_commodity")}</th>
              <th className="px-4 py-3 font-medium">{t("col_mandi")}</th>
              <th className="px-4 py-3 font-medium">{t("col_state")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("col_price")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("col_change")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-muted/40">
                <td className="px-4 py-3 font-medium text-foreground">
                  {lang === "hi" ? p.commodityHi : p.commodity}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{p.mandi}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.state}</td>
                <td className="px-4 py-3 text-right font-semibold text-foreground">
                  ₹{p.price.toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-3 text-right">
                  <ChangeBadge trend={p.trend} pct={p.changePct} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  {t("no_results")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="mt-5 space-y-3 md:hidden">
        {rows.map((p) => (
          <div key={p.id} className="rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">{lang === "hi" ? p.commodityHi : p.commodity}</span>
              <ChangeBadge trend={p.trend} pct={p.changePct} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {p.mandi} · {p.state}
            </p>
            <p className="mt-2 text-xl font-bold text-foreground">₹{p.price.toLocaleString("en-IN")}</p>
          </div>
        ))}
        {rows.length === 0 && <p className="py-8 text-center text-muted-foreground">{t("no_results")}</p>}
      </div>
    </section>
  )
}

function ChangeBadge({ trend, pct }: { trend: "up" | "down" | "flat"; pct: number }) {
  const Icon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        trend === "up" && "bg-primary/10 text-primary",
        trend === "down" && "bg-destructive/10 text-destructive",
        trend === "flat" && "bg-muted text-muted-foreground",
      )}
    >
      <Icon className="size-3" />
      {pct > 0 ? "+" : ""}
      {pct}%
    </span>
  )
}
