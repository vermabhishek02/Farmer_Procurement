"use client"

import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { useTickerPrices } from "@/lib/use-mandi-data"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export function PriceTicker() {
  const { t, lang } = useI18n()
  const tickerPrices = useTickerPrices()
  const items = [...tickerPrices, ...tickerPrices]

  return (
    <div className="relative overflow-hidden border-y border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-1.5 sm:border-b-0 sm:border-r sm:absolute sm:inset-y-0 sm:left-0 sm:z-10 sm:border-b-0 sm:bg-primary sm:px-4">
        <span className="flex size-2 items-center justify-center">
          <span className="size-2 animate-ping rounded-full bg-accent opacity-75" />
          <span className="absolute size-2 rounded-full bg-accent" />
        </span>
        <span className="text-xs font-bold uppercase tracking-wide text-primary sm:text-primary-foreground">
          {t("live_prices")}
        </span>
      </div>
      <div className="group flex overflow-hidden sm:pl-40">
        <div className="flex shrink-0 animate-[ticker_40s_linear_infinite] items-center gap-6 py-2.5 pr-6 group-hover:[animation-play-state:paused]">
          {items.map((p, i) => {
            const Icon = p.trend === "up" ? TrendingUp : p.trend === "down" ? TrendingDown : Minus
            return (
              <div key={`${p.id}-${i}`} className="flex items-center gap-2 whitespace-nowrap text-sm">
                <span className="font-semibold text-foreground">{lang === "hi" ? p.commodityHi : p.commodity}</span>
                <span className="text-muted-foreground">₹{p.price.toLocaleString("en-IN")}</span>
                <span
                  className={cn(
                    "flex items-center gap-0.5 text-xs font-medium",
                    p.trend === "up" && "text-primary",
                    p.trend === "down" && "text-destructive",
                    p.trend === "flat" && "text-muted-foreground",
                  )}
                >
                  <Icon className="size-3" />
                  {p.changePct > 0 ? "+" : ""}
                  {p.changePct}%
                </span>
                <span className="text-border">|</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
