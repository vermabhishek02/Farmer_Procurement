"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { API_URL } from "@/lib/api"

export type Role = "farmer" | "buyer" | "seller" | "transporter"
export interface User {
  id: number
  uid: string
  role: Role
  name: string
  phone: string
  location: string
  details: string | null
  status: "Pending" | "Approved" | "Rejected"
  adminNote: string | null
  createdAt: string
  phoneVerifiedAt: string | null
}

const KEY = "ks_session"

interface AuthValue {
  user: User | null
  token: string | null
  loading: boolean
  signIn: (token: string, user: User) => void
  signOut: () => Promise<void>
  refresh: () => Promise<void>
  /** fetch against the API with the logged-in user's token; throws Error(message) on non-2xx */
  api: <T = unknown>(path: string, init?: { method?: string; body?: unknown }) => Promise<T>
}

const AuthContext = createContext<AuthValue | null>(null)

export async function rawApi<T>(path: string, init: { method?: string; body?: unknown } = {}, token?: string | null): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      method: init.method || (init.body ? "POST" : "GET"),
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: init.body ? JSON.stringify(init.body) : undefined,
    })
  } catch {
    throw new Error("Cannot reach the server. Please check that the backend is running.")
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error((data as { error?: string }).error || `Request failed (${res.status})`), { status: res.status, data })
  return data as T
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(KEY) : null
    if (!saved) { setLoading(false); return }
    rawApi<User>("/auth/me", {}, saved)
      .then((u) => { setToken(saved); setUser(u) })
      .catch((e) => { if ((e as { status?: number }).status === 401) window.localStorage.removeItem(KEY) })
      .finally(() => setLoading(false))
  }, [])

  const signIn = useCallback((t: string, u: User) => {
    window.localStorage.setItem(KEY, t)
    setToken(t)
    setUser(u)
  }, [])

  const signOut = useCallback(async () => {
    if (token) await rawApi("/auth/logout", { method: "POST", body: {} }, token).catch(() => {})
    window.localStorage.removeItem(KEY)
    setToken(null)
    setUser(null)
  }, [token])

  const refresh = useCallback(async () => {
    if (!token) return
    setUser(await rawApi<User>("/auth/me", {}, token))
  }, [token])

  const api = useCallback(
    async <T,>(path: string, init?: { method?: string; body?: unknown }) => {
      try {
        return await rawApi<T>(path, init, token)
      } catch (e) {
        if ((e as { status?: number }).status === 401) { window.localStorage.removeItem(KEY); setToken(null); setUser(null) }
        throw e
      }
    },
    [token],
  )

  return <AuthContext.Provider value={{ user, token, loading, signIn, signOut, refresh, api }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

export const roleLabel: Record<Role, string> = { farmer: "Farmer", buyer: "Buyer", seller: "Seller / Trader", transporter: "Transporter" }
