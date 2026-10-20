"use client"

import { useState } from "react"
import { BadgeCheck, Star, CheckCircle2, MapPin } from "lucide-react"
import { buyers, COMMODITIES } from "@/lib/mock-data"
import { useI18n } from "@/lib/i18n"
import { Field, Select, TextInput, SectionTitle } from "@/components/views/fields"
import { cn } from "@/lib/utils"

export function BuyerMarketplace() {
  const { t } = useI18n()
  const [crop, setCrop] = useState(COMMODITIES[0])
  const [qty, setQty] = useState("50")
  const [price, setPrice] = useState("")
  const [listed, setListed] = useState(false)
  const [acceptedId, setAcceptedId] = useState<string | null>(null)

  return (
    <section className="grid gap-4 lg:grid-cols-5">
      {/* List crop */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 lg:col-span-2">
        <SectionTitle title={t("list_crop")} desc={t("mod_buyers_desc")} />
        {listed ? (
          <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-6 text-center">
            <CheckCircle2 className="size-10 text-primary" />
            <p className="text-sm font-semibold text-foreground">{t("listing_success")}</p>
            <button
              type="button"
              onClick={() => setListed(false)}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              {t("list_crop")}
            </button>
          </div>
        ) : (
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              setListed(true)
            }}
          >
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
              <TextInput inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, ""))} />
            </Field>
            <Field label={t("expected_price")}>
              <TextInput
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
                placeholder="2400"
              />
            </Field>
            <button
              type="submit"
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t("post_listing")}
            </button>
          </form>
        )}
      </div>

      {/* Buyers */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 lg:col-span-3">
        <SectionTitle title={t("verified_buyers")} />
        <div className="mt-4 space-y-3">
          {buyers.map((b) => {
            const accepted = acceptedId === b.id
            return (
              <div key={b.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{b.name}</h3>
                      {b.verified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                          <BadgeCheck className="size-3" />
                          {t("verified")}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{b.type}</span>
                      <span className="text-border">·</span>
                      <span className="inline-flex items-center gap-0.5">
                        <MapPin className="size-3" />
                        {b.location}
                      </span>
                      <span className="text-border">·</span>
                      <span className="inline-flex items-center gap-0.5 text-accent">
                        <Star className="size-3 fill-current" />
                        {b.rating}
                      </span>
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {b.buying.map((c) => (
                        <span key={c} className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{t("view_bid")}</p>
                    <p className="text-lg font-bold text-foreground">₹{b.bidPrice.toLocaleString("en-IN")}</p>
                    <button
                      type="button"
                      onClick={() => setAcceptedId(accepted ? null : b.id)}
                      className={cn(
                        "mt-1 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                        accepted
                          ? "bg-primary/10 text-primary"
                          : "bg-primary text-primary-foreground hover:bg-primary/90",
                      )}
                    >
                      {accepted ? <CheckCircle2 className="size-3.5" /> : null}
                      {accepted ? t("verified") : t("accept_bid")}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
