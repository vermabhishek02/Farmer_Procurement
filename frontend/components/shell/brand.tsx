"use client"

import { Wheat } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export function Brand({ variant = "light" }: { variant?: "light" | "dark" }) {
  const { t } = useI18n()
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={cn(
          "flex size-9 items-center justify-center rounded-lg",
          variant === "dark" ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground",
        )}
      >
        <Wheat className="size-5" />
      </div>
      <div className="leading-tight">
        <p className={cn("text-sm font-bold", variant === "dark" ? "text-sidebar-foreground" : "text-foreground")}>
          {t("appName")}
        </p>
        <p className={cn("text-[11px]", variant === "dark" ? "text-sidebar-foreground/70" : "text-muted-foreground")}>
          {t("tagline")}
        </p>
      </div>
    </div>
  )
}
