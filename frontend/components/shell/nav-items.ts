import { Home, Sprout, Truck, LineChart, Snowflake, type LucideIcon } from "lucide-react"
import type { View } from "@/components/app-root"

export interface NavItem {
  view: View
  labelKey: "nav_home" | "nav_farmer" | "nav_transport" | "nav_analytics" | "nav_storage"
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  { view: "home", labelKey: "nav_home", icon: Home },
  { view: "farmer", labelKey: "nav_farmer", icon: Sprout },
  { view: "transport", labelKey: "nav_transport", icon: Truck },
  { view: "analytics", labelKey: "nav_analytics", icon: LineChart },
  { view: "storage", labelKey: "nav_storage", icon: Snowflake },
]
