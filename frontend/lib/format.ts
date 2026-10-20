export function inr(value: number, opts: { compact?: boolean } = {}): string {
  if (opts.compact && value >= 100000) {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`
    return `₹${(value / 100000).toFixed(2)} L`
  }
  return `₹${value.toLocaleString("en-IN")}`
}
