export type Trend = "up" | "down" | "flat"

export interface MandiPrice {
  id: string
  commodity: string
  commodityHi: string
  state: string
  district: string
  mandi: string
  price: number // INR per quintal
  prevPrice: number
  unit: string
  trend: Trend
  changePct: number
  updated: string
}

export interface PricePoint {
  date: string
  price: number
}

export interface ColdStorage {
  id: string
  name: string
  location: string
  state: string
  capacityTonnes: number
  openPct: number
  pricePerQuintal: number
  commodities: string[]
  distanceKm: number
}

export interface Vehicle {
  id: string
  name: string
  nameHi: string
  capacity: string
  ratePerKm: number
  baseFare: number
  icon: "mini-truck" | "tractor" | "truck" | "cold-van"
}

export interface Buyer {
  id: string
  name: string
  type: string
  location: string
  rating: number
  verified: boolean
  buying: string[]
  bidPrice: number
}

export interface TransportJob {
  id: string
  crop: string
  quantity: number
  pickup: string
  destination: string
  distanceKm: number
  fare: number
  date: string
  status: "Requested" | "En Route" | "Loaded" | "Delivered"
  farmer: string
}

export const STATES = ["Uttar Pradesh", "Madhya Pradesh", "Punjab", "Rajasthan", "Maharashtra", "Bihar"]

export const COMMODITIES = ["Wheat", "Mustard", "Potato", "Onion", "Soybean", "Gram (Chana)", "Rice", "Tomato"]

export const mandiPrices: MandiPrice[] = [
  { id: "m1", commodity: "Wheat", commodityHi: "गेहूं", state: "Uttar Pradesh", district: "Meerut", mandi: "Meerut Mandi", price: 2425, prevPrice: 2380, unit: "quintal", trend: "up", changePct: 1.9, updated: "Today, 9:00 AM" },
  { id: "m2", commodity: "Mustard", commodityHi: "सरसों", state: "Rajasthan", district: "Alwar", mandi: "Alwar Mandi", price: 5680, prevPrice: 5810, unit: "quintal", trend: "down", changePct: -2.2, updated: "Today, 9:00 AM" },
  { id: "m3", commodity: "Potato", commodityHi: "आलू", state: "Uttar Pradesh", district: "Agra", mandi: "Agra Mandi", price: 1240, prevPrice: 1180, unit: "quintal", trend: "up", changePct: 5.1, updated: "Today, 8:30 AM" },
  { id: "m4", commodity: "Onion", commodityHi: "प्याज", state: "Maharashtra", district: "Nashik", mandi: "Lasalgaon Mandi", price: 2150, prevPrice: 2320, unit: "quintal", trend: "down", changePct: -7.3, updated: "Today, 8:45 AM" },
  { id: "m5", commodity: "Soybean", commodityHi: "सोयाबीन", state: "Madhya Pradesh", district: "Indore", mandi: "Indore Mandi", price: 4560, prevPrice: 4560, unit: "quintal", trend: "flat", changePct: 0, updated: "Today, 9:10 AM" },
  { id: "m6", commodity: "Gram (Chana)", commodityHi: "चना", state: "Madhya Pradesh", district: "Ujjain", mandi: "Ujjain Mandi", price: 5320, prevPrice: 5210, unit: "quintal", trend: "up", changePct: 2.1, updated: "Today, 9:00 AM" },
  { id: "m7", commodity: "Wheat", commodityHi: "गेहूं", state: "Punjab", district: "Ludhiana", mandi: "Khanna Mandi", price: 2510, prevPrice: 2495, unit: "quintal", trend: "up", changePct: 0.6, updated: "Today, 8:20 AM" },
  { id: "m8", commodity: "Rice", commodityHi: "चावल", state: "Punjab", district: "Amritsar", mandi: "Amritsar Mandi", price: 3890, prevPrice: 3950, unit: "quintal", trend: "down", changePct: -1.5, updated: "Today, 9:05 AM" },
  { id: "m9", commodity: "Tomato", commodityHi: "टमाटर", state: "Maharashtra", district: "Pune", mandi: "Pune Mandi", price: 1650, prevPrice: 1420, unit: "quintal", trend: "up", changePct: 16.2, updated: "Today, 8:15 AM" },
  { id: "m10", commodity: "Onion", commodityHi: "प्याज", state: "Rajasthan", district: "Jaipur", mandi: "Jaipur Mandi", price: 2280, prevPrice: 2210, unit: "quintal", trend: "up", changePct: 3.2, updated: "Today, 9:00 AM" },
  { id: "m11", commodity: "Potato", commodityHi: "आलू", state: "Bihar", district: "Patna", mandi: "Patna Mandi", price: 1090, prevPrice: 1150, unit: "quintal", trend: "down", changePct: -5.2, updated: "Today, 8:50 AM" },
  { id: "m12", commodity: "Mustard", commodityHi: "सरसों", state: "Uttar Pradesh", district: "Mathura", mandi: "Mathura Mandi", price: 5540, prevPrice: 5490, unit: "quintal", trend: "up", changePct: 0.9, updated: "Today, 9:00 AM" },
]

// Ticker-friendly subset
export const tickerPrices = mandiPrices.slice(0, 10)

export function priceHistory(base: number, days: number): PricePoint[] {
  const points: PricePoint[] = []
  let price = base * 0.9
  const today = new Date("2026-09-22")
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    // deterministic pseudo-random walk
    const wobble = Math.sin(i * 1.7) * base * 0.02 + Math.cos(i * 0.9) * base * 0.015
    price = Math.max(base * 0.8, price + wobble + base * 0.004)
    points.push({
      date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      price: Math.round(price),
    })
  }
  // ensure ends near base
  points[points.length - 1].price = base
  return points
}

export const vehicles: Vehicle[] = [
  { id: "v1", name: "Mini Truck", nameHi: "मिनी ट्रक", capacity: "Up to 30 quintals", ratePerKm: 22, baseFare: 500, icon: "mini-truck" },
  { id: "v2", name: "Tractor Trolley", nameHi: "ट्रैक्टर ट्रॉली", capacity: "Up to 50 quintals", ratePerKm: 18, baseFare: 400, icon: "tractor" },
  { id: "v3", name: "6-Wheeler Truck", nameHi: "6-व्हीलर ट्रक", capacity: "Up to 120 quintals", ratePerKm: 35, baseFare: 900, icon: "truck" },
  { id: "v4", name: "Cold Storage Van", nameHi: "कोल्ड स्टोरेज वैन", capacity: "Up to 40 quintals", ratePerKm: 42, baseFare: 1200, icon: "cold-van" },
]

export const coldStorages: ColdStorage[] = [
  { id: "c1", name: "Kisan Cold Chain", location: "Agra", state: "Uttar Pradesh", capacityTonnes: 5000, openPct: 40, pricePerQuintal: 32, commodities: ["Potato", "Onion"], distanceKm: 12 },
  { id: "c2", name: "Annapurna Storage", location: "Indore", state: "Madhya Pradesh", capacityTonnes: 8000, openPct: 18, pricePerQuintal: 28, commodities: ["Soybean", "Gram (Chana)", "Wheat"], distanceKm: 24 },
  { id: "c3", name: "Green Valley Cold", location: "Nashik", state: "Maharashtra", capacityTonnes: 6500, openPct: 62, pricePerQuintal: 36, commodities: ["Onion", "Tomato"], distanceKm: 8 },
  { id: "c4", name: "Punjab Agri Freeze", location: "Ludhiana", state: "Punjab", capacityTonnes: 12000, openPct: 25, pricePerQuintal: 30, commodities: ["Potato", "Wheat"], distanceKm: 31 },
  { id: "c5", name: "Marwar Cold Hub", location: "Jaipur", state: "Rajasthan", capacityTonnes: 4200, openPct: 55, pricePerQuintal: 34, commodities: ["Mustard", "Onion"], distanceKm: 19 },
  { id: "c6", name: "Ganga Cold Store", location: "Patna", state: "Bihar", capacityTonnes: 3600, openPct: 47, pricePerQuintal: 26, commodities: ["Potato", "Tomato"], distanceKm: 15 },
]

export const buyers: Buyer[] = [
  { id: "b1", name: "AgroFresh Exports", type: "Exporter", location: "Delhi", rating: 4.8, verified: true, buying: ["Wheat", "Mustard"], bidPrice: 2480 },
  { id: "b2", name: "BigBasket Sourcing", type: "Retail Chain", location: "Mumbai", rating: 4.6, verified: true, buying: ["Onion", "Potato", "Tomato"], bidPrice: 2260 },
  { id: "b3", name: "Patanjali Foods", type: "Processor", location: "Haridwar", rating: 4.7, verified: true, buying: ["Mustard", "Soybean"], bidPrice: 5720 },
  { id: "b4", name: "Local Wholesaler - Reddy", type: "Wholesaler", location: "Hyderabad", rating: 4.2, verified: false, buying: ["Rice", "Gram (Chana)"], bidPrice: 3920 },
]

export const transportJobs: TransportJob[] = [
  { id: "j1", crop: "Wheat", quantity: 45, pickup: "Village Sisauli, Muzaffarnagar", destination: "Meerut Mandi", distanceKm: 62, fare: 1864, date: "23 Sep 2026", status: "Requested", farmer: "Ramesh Kumar" },
  { id: "j2", crop: "Potato", quantity: 30, pickup: "Farm 12, Agra", destination: "Agra Mandi", distanceKm: 14, fare: 808, date: "23 Sep 2026", status: "Requested", farmer: "Suresh Yadav" },
  { id: "j3", crop: "Mustard", quantity: 55, pickup: "Alwar Rural", destination: "Alwar Mandi", distanceKm: 28, fare: 904, date: "22 Sep 2026", status: "En Route", farmer: "Mahesh Sharma" },
  { id: "j4", crop: "Onion", quantity: 80, pickup: "Lasalgaon", destination: "Nashik Cold Chain", distanceKm: 22, fare: 2124, date: "22 Sep 2026", status: "Loaded", farmer: "Vijay Patil" },
  { id: "j5", crop: "Soybean", quantity: 40, pickup: "Dewas", destination: "Indore Mandi", distanceKm: 38, fare: 1084, date: "21 Sep 2026", status: "Delivered", farmer: "Anil Verma" },
]

export const farmerStats = {
  registeredHarvest: 320, // quintals
  activeBookings: 3,
  estimatedEarnings: 784500, // INR
  favoriteMandis: 5,
}
