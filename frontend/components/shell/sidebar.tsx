"use client"

import { LogIn, ShieldCheck } from "lucide-react"
import type { View } from "@/components/app-root"
import { navItems } from "@/components/shell/nav-items"
import { Brand } from "@/components/shell/brand"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export function Sidebar({
  view,
  navigate,
  onLogin,
}: {
  view: View
  navigate: (v: View) => void
  onLogin: () => void
}) {
  const { t } = useI18n()

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex">
      <div className="border-b border-sidebar-border px-5 py-5">
        <Brand variant="dark" />
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = view === item.view
          return (
            <button
              key={item.view}
              type="button"
              onClick={() => navigate(item.view)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="size-4.5" />
              {t(item.labelKey)}
            </button>
          )
        })}
      </nav>
      <div className="space-y-2 border-t border-sidebar-border p-3">
        <button
          type="button"
          onClick={() => navigate("admin")}
          aria-current={view === "admin" ? "page" : undefined}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-lg border border-sidebar-border px-3 py-2.5 text-sm font-semibold transition-colors",
            view === "admin"
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/90 hover:bg-sidebar-accent/50",
          )}
        >
          <ShieldCheck className="size-4" />
          {t("admin_portal")}
        </button>
        <button
          type="button"
          onClick={onLogin}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
        >
          <LogIn className="size-4" />
          {t("cta_login")}
        </button>
      </div>
    </aside>
  )
}
