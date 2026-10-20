"use client"

import { useMemo, useState } from "react"
import { CheckCircle2 } from "lucide-react"
import { vehicles, COMMODITIES } from "@/lib/mock-data"
import { useI18n } from "@/lib/i18n"
import { inr } from "@/lib/format"
import { Field, Select, TextInput, SectionTitle } from "@/components/views/fields"
import { VehicleIcon } from "@/components/views/vehicle-icon"
import { cn } from "@/lib/utils"
import { API_URL } from "@/lib/api"

export function TransportBooking() {
  const { t, lang } = useI18n()
  const [crop, setCrop] = useState(COMMODITIES[0])
  const [qty, setQty] = useState("30")
  const [pickup, setPickup] = useState("")
  const [target, setTarget] = useState("")
  const [distance, setDistance] = useState("40")
  const [vehicleId, setVehicleId] = useState(vehicles[0].id)
  const [confirmed, setConfirmed] = useState(false)
  const [farmerName, setFarmerName] = useState("")
  const [date, setDate] = useState("")
  const [sendError, setSendError] = useState("")

  const selectedVehicle = vehicles.find((v) => v.id === vehicleId) ?? vehicles[0]
  const km = Math.max(0, Number(distance) || 0)
  const fare = useMemo(() => selectedVehicle.baseFare + selectedVehicle.ratePerKm * km, [selectedVehicle, km])

  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
      <SectionTitle title={t("book_transport")} desc={t("mod_transport_desc")} />

      {confirmed ? (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-8 text-center">
          <CheckCircle2 className="size-12 text-primary" />
          <p className="text-base font-semibold text-foreground">{t("booking_success")}</p>
          <p className="text-sm text-muted-foreground">
            {crop} · {qty} qtl · {inr(fare)}
          </p>
          {sendError && <p className="text-xs text-destructive">{sendError}</p>}
          <button
            type="button"
            onClick={() => setConfirmed(false)}
            className="mt-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            {t("book_transport")}
          </button>
        </div>
      ) : (
        <form
          className="mt-4 grid gap-4 lg:grid-cols-5"
          onSubmit={async (e) => {
            e.preventDefault()
            setSendError("")
            // Send the request to the backend so an admin can approve or reject it. Offline: keep the old demo behaviour.
            try {
              const res = await fetch(`${API_URL}/api/transport-jobs`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  crop, quantity: Number(qty) || 1, pickup: pickup || "—", destination: target || "—",
                  distanceKm: km || 1, fare, date: date || new Date().toISOString().slice(0, 10), farmer: farmerName.trim() || "Farmer",
                }),
              })
              if (!res.ok) throw new Error()
            } catch {
              setSendError("Backend not connected — request was not saved for admin approval.")
            }
            setConfirmed(true)
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:col-span-3">
            <Field label={t("f_crop")}>
              <Select value={crop} onChange={(e) => setCrop(e.target.value)}>
                {COMMODITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("f_qty")}>
              <TextInput
                inputMode="numeric"
                value={qty}
                onChange={(e) => setQty(e.target.value.replace(/\D/g, ""))}
              />
            </Field>
            <Field label={t("f_pickup")}>
              <TextInput value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="Village, District" />
            </Field>
            <Field label={t("f_target")}>
              <TextInput value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Mandi name" />
            </Field>
            <Field label={t("f_date")}>
              <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Farmer name">
              <TextInput value={farmerName} onChange={(e) => setFarmerName(e.target.value)} placeholder="Your name" />
            </Field>
            <Field label={t("f_distance")}>
              <TextInput
                inputMode="numeric"
                value={distance}
                onChange={(e) => setDistance(e.target.value.replace(/\D/g, ""))}
              />
            </Field>
          </div>

          <div className="lg:col-span-2">
            <p className="mb-2 text-xs font-medium text-muted-foreground">{t("select_vehicle")}</p>
            <div className="space-y-2">
              {vehicles.map((v) => {
                const active = v.id === vehicleId
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVehicleId(v.id)}
                    aria-pressed={active}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                      active ? "border-primary bg-primary/10" : "border-border hover:border-primary/40",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-lg",
                        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                      )}
                    >
                      <VehicleIcon icon={v.icon} className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-foreground">
                        {lang === "hi" ? v.nameHi : v.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">{v.capacity}</span>
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">₹{v.ratePerKm}/km</span>
                  </button>
                )
              })}
            </div>

            <div className="mt-3 flex items-center justify-between rounded-xl border border-border bg-muted/40 p-4">
              <span className="text-sm text-muted-foreground">{t("fare_estimate")}</span>
              <span className="text-xl font-bold text-foreground">{inr(fare)}</span>
            </div>
            <button
              type="submit"
              className="mt-3 w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t("confirm_booking")}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
