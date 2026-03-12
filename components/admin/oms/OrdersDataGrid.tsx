"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { OrderStatus } from "@prisma/client"
import { format } from "date-fns"
import { formatRs } from "@/lib/currency"
import { FulfillmentPill, PaymentPill } from "@/components/admin/oms/StatusPill"
import { ChevronRight, Package, XCircle, Banknote } from "lucide-react"
import toast from "react-hot-toast"

type GridOrder = {
    id: string
    invoiceNumber: string | null
    customerName: string | null
    contactPhone: string | null
    status: OrderStatus
    totalAmount: number
    paymentMethod: string
    createdAt: Date
    invoice: {
        id: string
        status: "PAID" | "UNPAID" | "OVERDUE" | "CANCELLED"
    } | null
}

interface OrdersDataGridProps {
    orders: GridOrder[]
    onStatusChange: (id: string, status: OrderStatus) => Promise<boolean>
    onCapturePayment: (id: string) => void
}

const STATUS_NEXT: Partial<Record<OrderStatus, { label: string; next: OrderStatus }>> = {
    PENDING: { label: "Confirm", next: "CONFIRMED" },
    CONFIRMED: { label: "Mark Packed", next: "PACKED" },
    PACKED: { label: "Mark Shipped", next: "SHIPPED" },
    SHIPPED: { label: "Out for Del.", next: "OUT_FOR_DELIVERY" },
    OUT_FOR_DELIVERY: { label: "Mark Delivered", next: "DELIVERED" },
}

export default function OrdersDataGrid({ orders, onStatusChange, onCapturePayment }: OrdersDataGridProps) {
    const [localOrders, setLocalOrders] = useState(orders)
    const [loadingId, setLoadingId] = useState<string | null>(null)

    const handleAdvance = async (e: React.MouseEvent, order: GridOrder) => {
        e.stopPropagation()
        const action = STATUS_NEXT[order.status]
        if (!action) return

        setLoadingId(order.id)
        const ok = await onStatusChange(order.id, action.next)
        if (ok) {
            setLocalOrders(prev =>
                prev.map(o => o.id === order.id ? { ...o, status: action.next } : o)
            )
            toast.success(`Advanced to ${action.next.replace(/_/g, " ")}`)
        } else {
            toast.error("Failed to update status")
        }
        setLoadingId(null)
    }

    const handleCancel = async (e: React.MouseEvent, orderId: string) => {
        e.stopPropagation()
        if (!confirm("Cancel this order? This cannot be undone.")) return
        setLoadingId(orderId)
        const ok = await onStatusChange(orderId, "CANCELED")
        if (ok) {
            setLocalOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "CANCELED" } : o))
            toast.success("Order cancelled")
        }
        setLoadingId(null)
    }

    if (localOrders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
                <Package className="w-12 h-12 opacity-30" />
                <p className="text-base font-medium">No orders found</p>
                <p className="text-sm">Try adjusting your search or filter criteria.</p>
            </div>
        )
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Order</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fulfillment</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {localOrders.map((order) => {
                        const invoiceLabel = order.invoiceNumber ?? `#${order.id.slice(-6).toUpperCase()}`
                        const advanceAction = STATUS_NEXT[order.status]
                        const isCOD = order.paymentMethod === "Cash on Delivery"
                        const needsPayment = isCOD && order.invoice?.status !== "PAID" && order.status === "DELIVERED"
                        const paymentStatus = (order.invoice?.status ?? "UNPAID") as "PAID" | "UNPAID" | "OVERDUE" | "CANCELLED"
                        const isLoading = loadingId === order.id

                        return (
                            <tr
                                key={order.id}
                                className="group hover:bg-orange-50/20 transition-colors"
                            >
                                {/* Order ID */}
                                <td className="px-4 py-4">
                                    <Link
                                        href={`/admin/sales/orders/${order.id}`}
                                        className="font-bold text-slate-800 hover:text-orange-600 transition-colors flex items-center gap-1 group/link"
                                    >
                                        {invoiceLabel}
                                        <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover/link:opacity-100 transition-opacity text-orange-500" />
                                    </Link>
                                </td>

                                {/* Date */}
                                <td className="px-4 py-4 text-slate-500 whitespace-nowrap">
                                    {format(new Date(order.createdAt), "MMM d, yyyy")}
                                </td>

                                {/* Customer */}
                                <td className="px-4 py-4">
                                    <p className="font-medium text-slate-800 leading-tight">
                                        {order.customerName ?? "Guest"}
                                    </p>
                                    {order.contactPhone && (
                                        <p className="text-xs text-slate-400 mt-0.5 font-mono">
                                            {order.contactPhone}
                                        </p>
                                    )}
                                </td>

                                {/* Payment Status */}
                                <td className="px-4 py-4">
                                    <div className="flex flex-col gap-1">
                                        <PaymentPill status={paymentStatus} />
                                        <span className="text-[11px] text-slate-400">{order.paymentMethod}</span>
                                    </div>
                                </td>

                                {/* Fulfillment Status */}
                                <td className="px-4 py-4">
                                    <FulfillmentPill status={order.status} />
                                </td>

                                {/* Total */}
                                <td className="px-4 py-4 text-right font-bold text-slate-800 whitespace-nowrap tabular-nums">
                                    {formatRs(order.totalAmount)}
                                </td>

                                {/* Actions */}
                                <td className="px-4 py-4">
                                    <div className="flex items-center justify-end gap-2">
                                        {needsPayment && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onCapturePayment(order.id) }}
                                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                                            >
                                                <Banknote className="w-3.5 h-3.5" />
                                                Collect
                                            </button>
                                        )}
                                        {advanceAction && order.status !== "CANCELED" && (
                                            <button
                                                onClick={(e) => handleAdvance(e, order)}
                                                disabled={isLoading}
                                                className="px-3 py-1.5 text-xs font-semibold bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-lg transition-all disabled:opacity-50"
                                            >
                                                {isLoading ? "…" : advanceAction.label}
                                            </button>
                                        )}
                                        {order.status !== "CANCELED" && order.status !== "DELIVERED" && (
                                            <button
                                                onClick={(e) => handleCancel(e, order.id)}
                                                disabled={isLoading}
                                                className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                title="Cancel order"
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}
