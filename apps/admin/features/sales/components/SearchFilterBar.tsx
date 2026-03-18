"use client"

import { useCallback, useTransition } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Search, SlidersHorizontal, X } from "lucide-react"

const STATUSES: { value: string; label: string }[] = [
    { value: "", label: "All Statuses" },
    { value: "PENDING", label: "Pending" },
    { value: "CONFIRMED", label: "Confirmed" },
    { value: "PACKED", label: "Packed" },
    { value: "SHIPPED", label: "Shipped" },
    { value: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
    { value: "DELIVERED", label: "Delivered" },
    { value: "CANCELED", label: "Cancelled" },
]

const PAYMENTS: { value: string; label: string }[] = [
    { value: "", label: "All Payments" },
    { value: "PAID", label: "Paid" },
    { value: "UNPAID", label: "Unpaid" },
]

export default function SearchFilterBar() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    const q = searchParams.get("q") ?? ""
    const status = searchParams.get("status") ?? ""
    const payment = searchParams.get("payment") ?? ""

    const updateParam = useCallback(
        (key: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString())
            if (value) {
                params.set(key, value)
            } else {
                params.delete(key)
            }
            // Reset to page 1 whenever filter changes
            params.delete("page")
            startTransition(() => {
                router.push(`${pathname}?${params.toString()}`)
            })
        },
        [router, pathname, searchParams]
    )

    const clearAll = () => {
        startTransition(() => {
            router.push(pathname)
        })
    }

    const hasFilters = q || status || payment

    return (
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
                <Search
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors ${isPending ? "text-orange-500 animate-pulse" : "text-slate-400"}`}
                />
                <input
                    type="text"
                    placeholder="Search by order ID, customer name, or phone…"
                    defaultValue={q}
                    onChange={(e) => updateParam("q", e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all placeholder:text-slate-400"
                />
            </div>

            {/* Status Filter */}
            <div className="relative">
                <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <select
                    value={status}
                    onChange={(e) => updateParam("status", e.target.value)}
                    className="pl-8 pr-8 py-2.5 text-sm bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all appearance-none cursor-pointer"
                >
                    {STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                </select>
            </div>

            {/* Payment Filter */}
            <div className="relative">
                <select
                    value={payment}
                    onChange={(e) => updateParam("payment", e.target.value)}
                    className="pl-4 pr-8 py-2.5 text-sm bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all appearance-none cursor-pointer"
                >
                    {PAYMENTS.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                </select>
            </div>

            {/* Clear All */}
            {hasFilters && (
                <button
                    onClick={clearAll}
                    className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-2xl border border-slate-200 transition-all"
                >
                    <X className="w-3.5 h-3.5" />
                    Clear
                </button>
            )}
        </div>
    )
}
