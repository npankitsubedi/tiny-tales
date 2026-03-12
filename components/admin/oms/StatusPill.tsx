import { OrderStatus } from "@prisma/client"

type FulfillmentStatus = OrderStatus
type PaymentStatus = "PAID" | "UNPAID" | "OVERDUE" | "CANCELLED"

const FULFILLMENT_CONFIG: Record<FulfillmentStatus, { label: string; className: string }> = {
    PENDING: { label: "Pending", className: "bg-amber-100 text-amber-800 border-amber-200" },
    CONFIRMED: { label: "Confirmed", className: "bg-blue-100 text-blue-800 border-blue-200" },
    PACKED: { label: "Packed", className: "bg-indigo-100 text-indigo-800 border-indigo-200" },
    SHIPPED: { label: "Shipped", className: "bg-purple-100 text-purple-800 border-purple-200" },
    OUT_FOR_DELIVERY: { label: "Out for Delivery", className: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200" },
    DELIVERED: { label: "Delivered", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    CANCELED: { label: "Cancelled", className: "bg-rose-100 text-rose-800 border-rose-200" },
    RETURNED: { label: "Returned", className: "bg-orange-100 text-orange-800 border-orange-200" },
}

const PAYMENT_CONFIG: Record<PaymentStatus, { label: string; className: string }> = {
    PAID: { label: "Paid", className: "bg-green-100 text-green-800 border-green-200" },
    UNPAID: { label: "Unpaid", className: "bg-gray-100 text-gray-600 border-gray-200" },
    OVERDUE: { label: "Overdue", className: "bg-rose-100 text-rose-800 border-rose-200" },
    CANCELLED: { label: "Cancelled", className: "bg-slate-100 text-slate-600 border-slate-200" },
}

export function FulfillmentPill({ status }: { status: FulfillmentStatus }) {
    const config = FULFILLMENT_CONFIG[status] ?? { label: status, className: "bg-slate-100 text-slate-600 border-slate-200" }
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.className}`}>
            {config.label}
        </span>
    )
}

export function PaymentPill({ status, method }: { status: PaymentStatus; method?: string }) {
    const config = PAYMENT_CONFIG[status] ?? { label: status, className: "bg-slate-100 text-slate-600 border-slate-200" }
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.className}`}>
            {config.label}
            {method && <span className="opacity-60">· {method}</span>}
        </span>
    )
}
