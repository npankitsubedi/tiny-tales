"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { formatRs } from "@/lib/currency"
import { FulfillmentPill, PaymentPill } from "@/components/admin/oms/StatusPill"
import { ChevronRight, Package, XCircle, Banknote, Check, X } from "lucide-react"
import toast from "react-hot-toast"
import { OrderStatusValue } from "@/lib/domain"
import LoadingButton from "@/components/ui/LoadingButton"

type GridOrder = {
    id: string
    invoiceNumber: string | null
    customerName: string | null
    contactPhone: string | null
    status: OrderStatusValue
    totalAmount: number
    paymentMethod: string
    createdAt: string
    invoice: {
        id: string
        status: "PAID" | "UNPAID" | "OVERDUE" | "CANCELLED"
    } | null
}

interface OrdersDataGridProps {
    orders: GridOrder[]
    onStatusChange: (id: string, status: OrderStatusValue) => Promise<{ success: boolean; error?: string }>
    onCapturePayment: (id: string, method: string) => Promise<{ success: boolean; error?: string }>
}

const STATUS_NEXT: Partial<Record<OrderStatusValue, { label: string; next: OrderStatusValue }>> = {
    PENDING: { label: "Confirm", next: "CONFIRMED" },
    CONFIRMED: { label: "Mark Packed", next: "PACKED" },
    PACKED: { label: "Mark Shipped", next: "SHIPPED" },
    SHIPPED: { label: "Out for Del.", next: "OUT_FOR_DELIVERY" },
    OUT_FOR_DELIVERY: { label: "Mark Delivered", next: "DELIVERED" },
}

export default function OrdersDataGrid({ orders, onStatusChange, onCapturePayment }: OrdersDataGridProps) {
    const [localOrders, setLocalOrders] = useState(orders)
    const [pendingOrderId, setPendingOrderId] = useState<string | null>(null)
    const [pendingAction, setPendingAction] = useState<"advance" | "cancel" | "capture" | null>(null)
    const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null)
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const paymentOptions = [
        { id: "Cash", label: "Cash" },
        { id: "Fonepay", label: "Fonepay / QR" },
        { id: "Mobile Banking", label: "Mobile Banking" },
        { id: "Card", label: "Card (POS)" },
        { id: "Cheque", label: "Cheque" },
    ]

    const handleAdvance = (e: React.MouseEvent, order: GridOrder) => {
        e.stopPropagation()
        const action = STATUS_NEXT[order.status]
        if (!action) return

        setPendingOrderId(order.id)
        setPendingAction("advance")
        startTransition(async () => {
            const result = await onStatusChange(order.id, action.next)
            if (result.success) {
                setLocalOrders(prev =>
                    prev.map(o => o.id === order.id ? { ...o, status: action.next } : o)
                )
                toast.success(`Advanced to ${action.next.replace(/_/g, " ")}`)
            } else {
                toast.error(result.error ?? "Failed to update status")
            }
            setPendingOrderId(null)
            setPendingAction(null)
        })
    }

    const handleCancel = (e: React.MouseEvent, orderId: string) => {
        e.stopPropagation()
        if (!confirm("Cancel this order? This cannot be undone.")) return
        setPendingOrderId(orderId)
        setPendingAction("cancel")
        startTransition(async () => {
            const result = await onStatusChange(orderId, "CANCELED")
            if (result.success) {
                setLocalOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "CANCELED" } : o))
                toast.success("Order cancelled")
            } else {
                toast.error(result.error ?? "Failed to cancel order")
            }
            setPendingOrderId(null)
            setPendingAction(null)
        })
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
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-[0.16em]">Order</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-[0.16em]">Date</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-[0.16em]">Customer</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-[0.16em]">Payment</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-[0.16em]">Fulfillment</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-[0.16em]">Total</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-[0.16em]">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {localOrders.map((order) => {
                        const invoiceLabel = order.invoiceNumber ?? `#${order.id.slice(-6).toUpperCase()}`
                        const advanceAction = STATUS_NEXT[order.status]
                        const isCOD = order.paymentMethod === "Cash on Delivery"
                        const needsPayment = isCOD && order.invoice?.status !== "PAID" && order.status === "DELIVERED"
                        const paymentStatus = (order.invoice?.status ?? "UNPAID") as "PAID" | "UNPAID" | "OVERDUE" | "CANCELLED"
                        const rowPending = isPending && pendingOrderId === order.id

                        return (
                            <tr
                                key={order.id}
                                className="group hover:bg-white/90 transition-all duration-200"
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
                                <td className="px-4 py-4 text-slate-500 whitespace-nowrap tabular-nums">
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
                                            <LoadingButton
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setPaymentOrderId(order.id)
                                                    setSelectedMethod(null)
                                                }}
                                                disabled={rowPending}
                                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                                            >
                                                <Banknote className="w-3.5 h-3.5" />
                                                Collect
                                            </LoadingButton>
                                        )}
                                        {advanceAction && order.status !== "CANCELED" && (
                                            <LoadingButton
                                                onClick={(e) => handleAdvance(e, order)}
                                                isLoading={rowPending && pendingAction === "advance"}
                                                disabled={rowPending}
                                                loadingText={advanceAction.label}
                                                className="px-3 py-1.5 text-xs font-semibold bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-lg transition-all disabled:opacity-50"
                                            >
                                                {advanceAction.label}
                                            </LoadingButton>
                                        )}
                                        {order.status !== "CANCELED" && order.status !== "DELIVERED" && (
                                            <LoadingButton
                                                onClick={(e) => handleCancel(e, order.id)}
                                                isLoading={rowPending && pendingAction === "cancel"}
                                                disabled={rowPending}
                                                loadingClassName="bg-rose-600 text-white hover:bg-rose-600"
                                                className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                title="Cancel order"
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </LoadingButton>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>

            {paymentOrderId && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
                    onClick={() => {
                        if (!isPending) {
                            setPaymentOrderId(null)
                            setSelectedMethod(null)
                        }
                    }}
                >
                    <div
                        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
                            <h3 className="text-lg font-bold text-slate-800">Capture Payment</h3>
                            <LoadingButton
                                type="button"
                                onClick={() => {
                                    if (!isPending) {
                                        setPaymentOrderId(null)
                                        setSelectedMethod(null)
                                    }
                                }}
                                disabled={isPending}
                                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-200"
                            >
                                <X className="h-5 w-5" />
                            </LoadingButton>
                        </div>

                        <div className="space-y-4 p-6">
                            <p className="text-sm text-slate-500">
                                Choose the tender used by the customer to settle this delivered COD order.
                            </p>

                            <div className="space-y-2">
                                {paymentOptions.map((option) => (
                                    <label
                                        key={option.id}
                                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                                            selectedMethod === option.id
                                                ? "border-orange-600 bg-orange-50"
                                                : "border-slate-200 hover:bg-slate-50"
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value={option.id}
                                            checked={selectedMethod === option.id}
                                            onChange={() => setSelectedMethod(option.id)}
                                            className="h-4 w-4 accent-orange-600"
                                        />
                                        <span className="text-sm font-medium text-slate-700">{option.label}</span>
                                    </label>
                                ))}
                            </div>

                            <LoadingButton
                                type="button"
                                disabled={!selectedMethod}
                                isLoading={isPending && pendingAction === "capture"}
                                loadingText="Capturing..."
                                onClick={() => {
                                    if (!paymentOrderId || !selectedMethod) return

                                    setPendingOrderId(paymentOrderId)
                                    setPendingAction("capture")
                                    startTransition(async () => {
                                        const result = await onCapturePayment(paymentOrderId, selectedMethod)

                                        if (!result.success) {
                                            toast.error(result.error ?? "Failed to capture payment")
                                            setPendingOrderId(null)
                                            setPendingAction(null)
                                            return
                                        }

                                        setLocalOrders((currentOrders) =>
                                            currentOrders.map((currentOrder) =>
                                                currentOrder.id === paymentOrderId
                                                    ? {
                                                        ...currentOrder,
                                                        paymentMethod: selectedMethod,
                                                        invoice: currentOrder.invoice
                                                            ? { ...currentOrder.invoice, status: "PAID" }
                                                            : null,
                                                    }
                                                    : currentOrder
                                            )
                                        )
                                        toast.success("Payment captured successfully")
                                        setPaymentOrderId(null)
                                        setSelectedMethod(null)
                                        setPendingOrderId(null)
                                        setPendingAction(null)
                                    })
                                }}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 font-semibold text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Confirm Capture
                            </LoadingButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
