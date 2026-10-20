"use client"

import type { View } from "@/components/app-root"
import { navItems } from "@/components/shell/nav-items"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export function BottomNav({ view, navigate }: { view: View; navigate: (v: View) => void }) {
  const { t } = useI18n()
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
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
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-full transition-colors",
                  active && "bg-primary/10",
                )}
              >
                <Icon className="size-5" />
              </span>
              {t(item.labelKey)}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
