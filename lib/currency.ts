/**
 * Currency formatting utilities for Tiny Tales
 * All output is hardcoded to "Rs." (Nepalese Rupees) prefix.
 * Uses manual comma formatting — no Intl.NumberFormat with locale side effects.
 */

function addCommas(intPart: string): string {
    // Standard comma grouping: 1,234,567
    return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

/**
 * Format an amount as "Rs. 1,200.00"
 */
export function formatRs(amount: number): string {
    const fixed = Math.abs(amount).toFixed(2)
    const [intPart, decPart] = fixed.split(".")
    const sign = amount < 0 ? "-" : ""
    return `${sign}Rs. ${addCommas(intPart)}.${decPart}`
}

/**
 * Compact display format: "Rs. 1,200" (no decimals — for stat cards)
 */
export function formatRsCompact(amount: number): string {
    const rounded = Math.round(Math.abs(amount)).toString()
    const sign = amount < 0 ? "-" : ""
    return `${sign}Rs. ${addCommas(rounded)}`
}
