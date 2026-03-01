"use client"

import { useState } from "react"
import { OrderStatus } from "@prisma/client"
import { CheckCircle2, Package, Truck, MapPin, XCircle, RefreshCcw, Banknote } from "lucide-react"
import { formatRs } from "@/lib/currency"
import toast from "react-hot-toast"

type PipelineOrder = {
    id: string
    customerName: string | null
    totalAmount: string
    status: OrderStatus
    createdAt: Date
    paymentMethod: string
    invoice?: { status: string } | null
}

interface OrderPipelineProps {
    initialOrders: PipelineOrder[]
    onStatusChange: (orderId: string, newStatus: OrderStatus) => Promise<boolean>
    onOrderClick: (orderId: string) => void
    onCapturePayment: (orderId: string) => void
}

const STATUS_ORDER: OrderStatus[] = [
    OrderStatus.PENDING,
    OrderStatus.CONFIRMED,
    OrderStatus.PACKED,
    OrderStatus.SHIPPED,
    OrderStatus.OUT_FOR_DELIVERY,
    OrderStatus.DELIVERED
]

const STATUS_CONFIG: Record<OrderStatus, { label: string, color: string, nextAction?: string, nextStatus?: OrderStatus, icon: any }> = {
    PENDING: { label: "Pending", color: "bg-amber-100 text-amber-800", nextAction: "Confirm Order", nextStatus: "CONFIRMED", icon: ClockIcon },
    CONFIRMED: { label: "Confirmed", color: "bg-blue-100 text-blue-800", nextAction: "Mark Packed", nextStatus: "PACKED", icon: CheckCircle2 },
    PACKED: { label: "Packed", color: "bg-indigo-100 text-indigo-800", nextAction: "Mark Shipped", nextStatus: "SHIPPED", icon: Package },
    SHIPPED: { label: "Shipped", color: "bg-purple-100 text-purple-800", nextAction: "Out for Delivery", nextStatus: "OUT_FOR_DELIVERY", icon: Truck },
    OUT_FOR_DELIVERY: { label: "Out for Delivery", color: "bg-fuchsia-100 text-fuchsia-800", nextAction: "Mark Delivered", nextStatus: "DELIVERED", icon: MapPin },
    DELIVERED: { label: "Delivered", color: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
    CANCELED: { label: "Canceled", color: "bg-slate-200 text-slate-800", icon: XCircle },
    RETURNED: { label: "Returned", color: "bg-orange-100 text-orange-800", icon: RefreshCcw }
}

function ClockIcon(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
    )
}

export default function OrderPipeline({ initialOrders, onStatusChange, onOrderClick, onCapturePayment }: OrderPipelineProps) {
    const [orders, setOrders] = useState(initialOrders)
    const [loadingId, setLoadingId] = useState<string | null>(null)

    const handleProgress = async (e: React.MouseEvent, order: PipelineOrder) => {
        e.stopPropagation()
        const config = STATUS_CONFIG[order.status]
        if (!config.nextStatus) return

        setLoadingId(order.id)
        const success = await onStatusChange(order.id, config.nextStatus)
        if (success) {
            setOrders(orders.map(o => o.id === order.id ? { ...o, status: config.nextStatus! } : o))
            toast.success(`Order advanced to ${STATUS_CONFIG[config.nextStatus].label}`)
        } else {
            toast.error("Failed to update status")
        }
        setLoadingId(null)
    }

    const handleCancel = async (e: React.MouseEvent, orderId: string) => {
        e.stopPropagation()
        if (!confirm("Are you sure you want to cancel this order?")) return

        setLoadingId(orderId)
        const success = await onStatusChange(orderId, "CANCELED")
        if (success) {
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: "CANCELED" } : o))
            toast.success("Order canceled")
        }
        setLoadingId(null)
    }

    // Filter out canceled and returned from the active pipeline view (maybe toggle them later)
    const activeOrders = orders.filter(o => o.status !== "CANCELED" && o.status !== "RETURNED")

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-[#D1D1D1] overflow-hidden">
            <div className="px-6 py-5 border-b border-[#D1D1D1] flex justify-between items-center bg-[#F5F5F5]">
                <h2 className="text-lg font-bold text-slate-800">Active Order Pipeline</h2>
                <span className="text-sm font-medium text-slate-500">{activeOrders.length} Orders</span>
            </div>

            <div className="divide-y divide-slate-100/60 max-h-[800px] overflow-y-auto w-full">
                {activeOrders.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 font-medium">No active orders in the pipeline.</div>
                ) : (
                    activeOrders.map(order => {
                        const config = STATUS_CONFIG[order.status]
                        const Icon = config.icon
                        const isCOD = order.paymentMethod === "Cash on Delivery"
                        const needsPayment = isCOD && order.invoice?.status !== "PAID"

                        return (
                            <div
                                key={order.id}
                                onClick={() => onOrderClick(order.id)}
                                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors cursor-pointer group"
                            >
                                {/* Left: Info */}
                                <div className="flex items-center gap-4 w-full md:w-1/3">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${config.color.replace('text-', 'bg-opacity-20 text-')}`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 tracking-tight text-base mb-0.5">
                                            {order.customerName || "Guest"}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                                            <span>#{order.id.slice(-6).toUpperCase()}</span>
                                            <span>•</span>
                                            <span className="font-sans font-semibold text-[#2D5068]">{formatRs(Number(order.totalAmount))}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Center: Progress Bar (Desktop) */}
                                <div className="hidden md:flex items-center w-full md:w-1/3 px-4">
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                                        {STATUS_ORDER.map((s, idx) => {
                                            const currentIndex = STATUS_ORDER.indexOf(order.status)
                                            const isPassed = idx <= currentIndex
                                            return (
                                                <div
                                                    key={s}
                                                    className={`h-full flex-1 border-r border-white/30 last:border-0 ${isPassed ? 'bg-primary' : 'bg-transparent'}`}
                                                />
                                            )
                                        })}
                                    </div>
                                    <span className="ml-3 text-xs font-bold text-slate-400 whitespace-nowrap w-24">
                                        {config.label}
                                    </span>
                                </div>

                                {/* Right: Actions */}
                                <div className="flex items-center gap-2 md:justify-end w-full md:w-1/3">
                                    {needsPayment && order.status === "DELIVERED" && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onCapturePayment(order.id); }}
                                            className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-sm rounded-xl transition-colors flex items-center gap-1.5"
                                        >
                                            <Banknote className="w-4 h-4" /> Capture Payment
                                        </button>
                                    )}

                                    {config.nextAction && (
                                        <button
                                            onClick={(e) => handleProgress(e, order)}
                                            disabled={loadingId === order.id}
                                            className="px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 font-bold text-sm rounded-xl transition-opacity disabled:opacity-50"
                                        >
                                            {loadingId === order.id ? "Updating..." : config.nextAction}
                                        </button>
                                    )}

                                    {order.status !== "CANCELED" && order.status !== "DELIVERED" && (
                                        <button
                                            onClick={(e) => handleCancel(e, order.id)}
                                            className="px-3 py-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                                            title="Cancel Order"
                                        >
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
