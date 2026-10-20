import { Truck, Tractor, Snowflake, type LucideProps } from "lucide-react"
import type { Vehicle } from "@/lib/mock-data"

export function VehicleIcon({ icon, ...props }: { icon: Vehicle["icon"] } & LucideProps) {
  switch (icon) {
    case "tractor":
      return <Tractor {...props} />
    case "cold-van":
      return <Snowflake {...props} />
    case "mini-truck":
    case "truck":
    default:
      return <Truck {...props} />
  }
}
