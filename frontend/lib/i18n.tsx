"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export type Lang = "en" | "hi"

type Dict = Record<string, { en: string; hi: string }>

const dict: Dict = {
  appName: { en: "Kheti Se Mandi Tak", hi: "खेती से मंडी तक" },
  tagline: { en: "From Farm to Market", hi: "खेत से बाज़ार तक" },

  // Nav
  nav_home: { en: "Home", hi: "होम" },
  nav_farmer: { en: "Farmer", hi: "किसान" },
  nav_transport: { en: "Transport", hi: "परिवहन" },
  nav_analytics: { en: "Analytics", hi: "विश्लेषण" },
  nav_storage: { en: "Storage", hi: "भंडारण" },

  // Hero
  hero_title: { en: "From Your Farm to the Right Market — At the Best Price", hi: "आपके खेत से सही बाज़ार तक — सर्वोत्तम मूल्य पर" },
  hero_subtitle: {
    en: "Live mandi rates, on-demand transport, and direct buyer connections. Everything a farmer needs, in one place.",
    hi: "लाइव मंडी भाव, ऑन-डिमांड परिवहन, और सीधे खरीदारों से जुड़ाव। किसान की हर ज़रूरत, एक ही जगह।",
  },
  cta_mandi: { en: "Check Mandi Bhav", hi: "मंडी भाव देखें" },
  cta_transport: { en: "Book Transport", hi: "परिवहन बुक करें" },
  cta_login: { en: "Farmer Login", hi: "किसान लॉगिन" },
  live_prices: { en: "Live Mandi Prices", hi: "लाइव मंडी भाव" },

  // Modules
  modules_title: { en: "Everything You Need", hi: "आपकी हर ज़रूरत" },
  modules_subtitle: { en: "Powerful tools built for the Indian farmer", hi: "भारतीय किसान के लिए बनाए गए सशक्त उपकरण" },
  mod_rates: { en: "Live Mandi Rates", hi: "लाइव मंडी भाव" },
  mod_rates_desc: { en: "Real-time crop prices across states and districts.", hi: "राज्यों और ज़िलों में रियल-टाइम फसल मूल्य।" },
  mod_transport: { en: "Farm-to-Mandi Transport", hi: "खेत से मंडी परिवहन" },
  mod_transport_desc: { en: "Book trucks, tractors and cold vans in minutes.", hi: "मिनटों में ट्रक, ट्रैक्टर और कोल्ड वैन बुक करें।" },
  mod_buyers: { en: "Direct Buyer Connect", hi: "सीधे खरीदार से जुड़ें" },
  mod_buyers_desc: { en: "Sell directly to verified buyers with live bids.", hi: "लाइव बोली के साथ सीधे सत्यापित खरीदारों को बेचें।" },
  mod_storage: { en: "Cold Storage Finder", hi: "कोल्ड स्टोरेज खोजें" },
  mod_storage_desc: { en: "Find nearby storage with open capacity.", hi: "खाली क्षमता वाले नज़दीकी भंडारण खोजें।" },
  mod_predictor: { en: "Price Predictor", hi: "मूल्य पूर्वानुमान" },
  mod_predictor_desc: { en: "Forecast trends before you sell.", hi: "बेचने से पहले रुझान का अनुमान लगाएं।" },

  // Farmer dashboard
  farmer_dashboard: { en: "Farmer Dashboard", hi: "किसान डैशबोर्ड" },
  welcome: { en: "Welcome back, Ramesh", hi: "वापसी पर स्वागत है, रमेश" },
  stat_harvest: { en: "Registered Harvest", hi: "पंजीकृत उपज" },
  stat_bookings: { en: "Active Logistics Bookings", hi: "सक्रिय परिवहन बुकिंग" },
  stat_earnings: { en: "Estimated Earnings", hi: "अनुमानित आय" },
  stat_mandis: { en: "Favorite Mandis", hi: "पसंदीदा मंडियां" },

  price_checker: { en: "Mandi Price Checker", hi: "मंडी भाव जांचक" },
  filter_state: { en: "State", hi: "राज्य" },
  filter_district: { en: "District", hi: "ज़िला" },
  filter_commodity: { en: "Commodity", hi: "फसल" },
  search_ph: { en: "Search commodity or mandi...", hi: "फसल या मंडी खोजें..." },
  all: { en: "All", hi: "सभी" },
  col_commodity: { en: "Commodity", hi: "फसल" },
  col_mandi: { en: "Mandi", hi: "मंडी" },
  col_state: { en: "State", hi: "राज्य" },
  col_price: { en: "Price (₹/qtl)", hi: "मूल्य (₹/क्विंटल)" },
  col_change: { en: "Change", hi: "बदलाव" },
  no_results: { en: "No prices match your filters.", hi: "आपके फ़िल्टर से कोई भाव मेल नहीं खाता।" },

  book_transport: { en: "Transport Booking", hi: "परिवहन बुकिंग" },
  f_crop: { en: "Crop Type", hi: "फसल का प्रकार" },
  f_qty: { en: "Quantity (Quintals)", hi: "मात्रा (क्विंटल)" },
  f_pickup: { en: "Pickup Location", hi: "पिकअप स्थान" },
  f_target: { en: "Target Mandi", hi: "लक्ष्य मंडी" },
  f_date: { en: "Pickup Date", hi: "पिकअप तिथि" },
  f_distance: { en: "Distance (km)", hi: "दूरी (किमी)" },
  select_vehicle: { en: "Select Vehicle", hi: "वाहन चुनें" },
  fare_estimate: { en: "Estimated Fare", hi: "अनुमानित किराया" },
  confirm_booking: { en: "Confirm Booking", hi: "बुकिंग पुष्टि करें" },
  booking_success: { en: "Booking confirmed! A transporter will accept shortly.", hi: "बुकिंग पुष्टि! एक ट्रांसपोर्टर जल्द ही स्वीकार करेगा।" },

  marketplace: { en: "Direct Buyer Marketplace", hi: "सीधा खरीदार बाज़ार" },
  list_crop: { en: "List Your Crop", hi: "अपनी फसल सूचीबद्ध करें" },
  expected_price: { en: "Expected Price (₹/qtl)", hi: "अपेक्षित मूल्य (₹/क्विंटल)" },
  post_listing: { en: "Post Listing", hi: "सूची पोस्ट करें" },
  verified_buyers: { en: "Verified Buyers & Bids", hi: "सत्यापित खरीदार और बोली" },
  verified: { en: "Verified", hi: "सत्यापित" },
  view_bid: { en: "Current Bid", hi: "मौजूदा बोली" },
  accept_bid: { en: "Accept Bid", hi: "बोली स्वीकारें" },
  listing_success: { en: "Crop listed! Buyers can now bid.", hi: "फसल सूचीबद्ध! अब खरीदार बोली लगा सकते हैं।" },

  // Transporter
  transporter_dashboard: { en: "Transporter & Driver Dashboard", hi: "ट्रांसपोर्टर और ड्राइवर डैशबोर्ड" },
  pending_requests: { en: "Pending Transport Requests", hi: "लंबित परिवहन अनुरोध" },
  active_jobs: { en: "Active Jobs", hi: "सक्रिय कार्य" },
  accept_job: { en: "Accept Job", hi: "कार्य स्वीकारें" },
  route: { en: "Route", hi: "मार्ग" },
  update_status: { en: "Update Status", hi: "स्थिति अपडेट करें" },
  st_requested: { en: "Requested", hi: "अनुरोधित" },
  st_enroute: { en: "En Route", hi: "रास्ते में" },
  st_loaded: { en: "Loaded", hi: "लोड किया गय���" },
  st_delivered: { en: "Delivered", hi: "पहुंचा दिया" },
  farmer_label: { en: "Farmer", hi: "किसान" },
  earnings_today: { en: "Earnings Today", hi: "आज की कमाई" },
  jobs_completed: { en: "Jobs Completed", hi: "पूर्ण कार्य" },

  // Analytics
  analytics_title: { en: "Mandi Analytics", hi: "मंडी विश्लेषण" },
  price_trends: { en: "Commodity Price Trends", hi: "फसल मूल्य रुझान" },
  range_7: { en: "7 Days", hi: "7 दिन" },
  range_30: { en: "30 Days", hi: "30 दिन" },
  avg_price: { en: "Average", hi: "औसत" },
  high_price: { en: "High", hi: "उच्च" },
  low_price: { en: "Low", hi: "निम्न" },
  storage_title: { en: "Cold Storage Finder", hi: "कोल्ड स्टोरेज खोजक" },
  open_capacity: { en: "open capacity", hi: "खाली क्षमता" },
  per_quintal: { en: "/quintal", hi: "/क्विंटल" },
  book_slot: { en: "Book Slot", hi: "स्लॉट बुक करें" },
  stores: { en: "Stores", hi: "स्टोर" },

  // Login
  login_title: { en: "Farmer Login", hi: "किसान लॉगिन" },
  mobile: { en: "Mobile Number", hi: "मोबाइल नंबर" },
  send_otp: { en: "Send OTP", hi: "OTP भेजें" },
  language: { en: "Language", hi: "भाषा" },
  login_welcome: { en: "Welcome to Kheti Se Mandi Tak", hi: "खेती से मंडी तक में आपका स्वागत है" },
  login_sub: { en: "Login to access mandi rates, transport and buyers.", hi: "मंडी भाव, परिवहन और खरीदारों तक पहुंचने के लिए लॉगिन करें।" },
  login_choose_role: { en: "I am a", hi: "मैं हूं" },
  role_farmer: { en: "Farmer", hi: "किसान" },
  role_buyer: { en: "Buyer", hi: "खरीदार" },
  role_transporter: { en: "Transporter", hi: "ट्रांसपोर्टर" },
  login_phone: { en: "Mobile Number", hi: "मोबाइल नंबर" },
  login_send_otp: { en: "Send OTP", hi: "OTP भेजें" },
  login_otp_sent: { en: "OTP sent to your mobile", hi: "आपके मोबाइल पर OTP भेजा गया" },
  login_verify: { en: "Verify & Continue", hi: "सत्यापित करें और आगे बढ़ें" },
  login_demo_note: { en: "Demo mode — no real OTP is sent.", hi: "डेमो मोड — कोई वास्तविक OTP नहीं भेजा जाता।" },

  // Admin
  admin_login: { en: "Admin Login", hi: "एडमिन लॉगिन" },
  admin_portal: { en: "Admin Portal", hi: "एडमिन पोर्टल" },
  admin_sub: { en: "Sign in to manage mandis, users and logistics.", hi: "मंडियों, उपयोगकर्ताओं और परिवहन को प्रबंधित करने के लिए साइन इन करें।" },
  admin_email: { en: "Email Address", hi: "ईमेल पता" },
  admin_password: { en: "Password", hi: "पासवर्ड" },
  admin_signin: { en: "Sign In", hi: "साइन इन करें" },
  admin_remember: { en: "Keep me signed in", hi: "मुझे साइन इन रखें" },
  admin_forgot: { en: "Forgot password?", hi: "पासवर्ड भूल गए?" },
  admin_invalid: { en: "Invalid email or password.", hi: "अमान्य ईमेल या पासवर्ड।" },
  admin_demo_note: { en: "Demo: admin@khetimandi.in / admin123", hi: "डेमो: admin@khetimandi.in / admin123" },
  admin_secure: { en: "Secured admin access", hi: "सुरक्षित एडमिन पहुंच" },
  admin_back: { en: "Back to site", hi: "साइट पर वापस जाएं" },
  admin_welcome: { en: "Admin Dashboard", hi: "एडमिन डैशबोर्ड" },
  admin_signout: { en: "Sign Out", hi: "साइन आउट" },
  admin_stat_farmers: { en: "Registered Farmers", hi: "पंजीकृत किसान" },
  admin_stat_transporters: { en: "Active Transporters", hi: "सक्रिय ट्रांसपोर्टर" },
  admin_stat_listings: { en: "Live Crop Listings", hi: "लाइव फसल सूची" },
  admin_stat_mandis: { en: "Connected Mandis", hi: "जुड़ी मंडियां" },
  admin_recent: { en: "Recent Activity", hi: "हाल की गतिविधि" },
  account_title: { en: "My Account", hi: "मेरा खाता" },
  footer_admin: { en: "Admin", hi: "एडमिन" },
}

interface I18nContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: keyof typeof dict) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en")
  const t = (key: keyof typeof dict) => dict[key]?.[lang] ?? String(key)
  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used within I18nProvider")
  return ctx
}
