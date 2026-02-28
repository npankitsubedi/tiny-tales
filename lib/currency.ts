/**
 * Currency formatting utilities for Tiny Tales
 * Default: Nepalese Rupee (NPR)
 */

/**
 * Format an amount as NPR (रु) using Nepali locale
 */
export function formatNPR(amount: number): string {
    return new Intl.NumberFormat("ne-NP", {
        style: "currency",
        currency: "NPR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount)
}

/**
 * Format as USD for international customers
 */
export function formatUSD(amount: number): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
    }).format(amount)
}

/**
 * Compact display format: "रु 1,200" (no decimals for display cards)
 */
export function formatNPRCompact(amount: number): string {
    return `रु ${new Intl.NumberFormat("en-NP", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)}`
}

/**
 * Plain "Rs. 1,200.00" label format (for invoices, order summaries)
 */
export function formatRs(amount: number): string {
    return `Rs. ${new Intl.NumberFormat("en-NP", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount)}`
}
