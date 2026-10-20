"use client"

import { useEffect, useState } from "react"
import { BadgeCheck, XCircle, X } from "lucide-react"
import { rawApi, roleLabel, type Role } from "@/lib/auth"

interface Result { valid: boolean; uid?: string; role?: Role; name?: string; location?: string; status?: string; since?: string; error?: string }

/** Opens when the site is visited as /?verify=KS-F-12345678 (the QR code on a Digital Kisan ID). */
export function VerifyModal({ uid, onClose }: { uid: string; onClose: () => void }) {
  const [res, setRes] = useState<Result | null>(null)
  useEffect(() => {
    rawApi<Result>(`/verify/${encodeURIComponent(uid)}`).then(setRes).catch((e) => setRes({ valid: false, error: e instanceof Error ? e.message : "Could not verify" }))
  }, [uid])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label="ID verification" className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-xl">
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:bg-muted"><X className="size-5" /></button>
        <p className="font-mono text-sm font-bold">{uid}</p>
        {!res ? <p className="mt-6 text-sm text-muted-foreground">Checking…</p> : res.valid ? (
          <>
            <BadgeCheck className="mx-auto mt-4 size-14 text-emerald-600" />
            <p className="mt-2 text-lg font-bold">Genuine Kisan ID</p>
            <p className="mt-3 text-sm">{res.name} · {res.role && roleLabel[res.role]}</p>
            <p className="text-sm text-muted-foreground">{res.location}</p>
            <p className="mt-2 text-xs text-muted-foreground">Status: <strong>{res.status === "Approved" ? "Admin-approved" : res.status}</strong> · since {res.since?.slice(0, 10)}</p>
          </>
        ) : (
          <>
            <XCircle className="mx-auto mt-4 size-14 text-destructive" />
            <p className="mt-2 text-lg font-bold">Not a valid ID</p>
            <p className="mt-1 text-sm text-muted-foreground">{res.error}</p>
          </>
        )}
      </div>
    </div>
  )
}
