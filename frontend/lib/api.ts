import type { MandiPrice, PricePoint } from "@/lib/mock-data"

// Backend base URL — set NEXT_PUBLIC_API_URL in frontend/.env.local (see .env.example)
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`)
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`)
  return res.json() as Promise<T>
}

export const fetchMandiPrices = () => get<MandiPrice[]>("/api/prices")
export const fetchTickerPrices = () => get<MandiPrice[]>("/api/prices/ticker")

export async function fetchCommodityHistory(commodity: string, days: number): Promise<PricePoint[]> {
  const data = await get<{ points: { date: string; price: number }[] }>(
    `/api/analytics/history?commodity=${encodeURIComponent(commodity)}&days=${days}`,
  )
  return data.points.map((p) => ({
    date: new Date(p.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
    price: p.price,
  }))
}
