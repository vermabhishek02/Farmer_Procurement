"use client"

import { Languages } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export function LanguageToggle({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { lang, setLang } = useI18n()
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border p-0.5",
        tone === "dark" ? "border-sidebar-border bg-sidebar-accent/40" : "border-border bg-card",
      )}
    >
      <Languages className={cn("ml-1.5 size-3.5", tone === "dark" ? "text-sidebar-foreground/70" : "text-muted-foreground")} />
      {(["en", "hi"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
            lang === l
              ? "bg-primary text-primary-foreground"
              : tone === "dark"
                ? "text-sidebar-foreground/70 hover:text-sidebar-foreground"
                : "text-muted-foreground hover:text-foreground",
          )}
        >
          {l === "en" ? "EN" : "हिं"}
        </button>
      ))}
    </div>
  )
}
