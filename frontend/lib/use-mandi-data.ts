"use client"

import { useEffect, useState } from "react"
import { mandiPrices as mockPrices, tickerPrices as mockTicker, STATES, COMMODITIES, type MandiPrice } from "@/lib/mock-data"
import { fetchMandiPrices, fetchTickerPrices } from "@/lib/api"

/**
 * Starts with the built-in mock data (so the UI renders instantly, exactly as before)
 * and swaps in the real data from the backend/database when it responds.
 * If the backend is not running, the mock data simply stays.
 */
export function useMandiPrices() {
  const [prices, setPrices] = useState<MandiPrice[]>(mockPrices)
  const [live, setLive] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchMandiPrices()
      .then((rows) => {
        if (!cancelled && rows.length) {
          setPrices(rows)
          setLive(true)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  // with the database there are 14 states, so build the state list from the data
  const states = live ? Array.from(new Set(prices.map((p) => p.state))).sort() : STATES
  return { prices, states, commodities: COMMODITIES, live }
}

export function useTickerPrices() {
  const [items, setItems] = useState<MandiPrice[]>(mockTicker)
  useEffect(() => {
    let cancelled = false
    fetchTickerPrices()
      .then((rows) => {
        if (!cancelled && rows.length) setItems(rows)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])
  return items
}
