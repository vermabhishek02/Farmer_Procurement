import { API_URL } from "@/lib/api"

export class AdminAuthError extends Error {}

// Calls the protected admin API with the session token returned by POST /api/admin/login.
export async function adminFetch<T>(token: string, path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      method: init.method || "GET",
      headers: { Authorization: `Bearer ${token}`, ...(init.body ? { "Content-Type": "application/json" } : {}) },
      body: init.body ? JSON.stringify(init.body) : undefined,
    })
  } catch {
    throw new Error("Cannot reach the backend. Start it on port 5000.")
  }
  const data = await res.json().catch(() => ({}))
  if (res.status === 401) throw new AdminAuthError(data.error || "Session expired. Please sign in again.")
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data as T
}

export async function adminDownload(token: string, what: string) {
  const res = await fetch(`${API_URL}/api/admin/export/${what}`, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error("Export failed")
  const url = URL.createObjectURL(await res.blob())
  const a = document.createElement("a")
  a.href = url
  a.download = `${what}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export interface Registration {
  id: number
  role: "farmer" | "buyer" | "seller" | "transporter"
  uid?: string | null
  phoneVerifiedAt?: string | null
  name: string
  phone: string
  location: string
  details: string | null
  status: "Pending" | "Approved" | "Rejected"
  adminNote: string | null
  createdAt: string
  reviewedAt: string | null
}

export interface TransportRequest {
  id: string
  crop: string
  quantity: number
  pickup: string
  destination: string
  distanceKm: number
  fare: number
  date: string
  status: string
  farmer: string
  adminNote: string | null
}

export interface AdminToken {
  id: number
  tokenCode: string
  farmerName: string
  phone: string
  mandiName: string
  crop: string
  quantityQtl: number
  saleDate: string
  timeSlot: string
  status: "Booked" | "Checked In" | "Completed" | "Cancelled"
}

export interface Summary {
  registrations: Record<string, number>
  registrationsByRole: { role: string; n: number }[]
  transport: Record<string, number>
  tokens: Record<string, number>
  todayTokens: number
  recent: { id: number; action: string; table_name: string; record_id: string | null; created_at: string }[]
}
