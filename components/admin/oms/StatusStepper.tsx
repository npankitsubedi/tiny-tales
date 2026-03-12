"use client"

import { useState } from "react"
import { OrderStatus } from "@prisma/client"
import { CheckCircle2, Circle, Loader2 } from "lucide-react"
import toast from "react-hot-toast"

const STEPS: { status: OrderStatus; label: string; short: string }[] = [
    { status: "PENDING", label: "Order Received", short: "Pending" },
    { status: "CONFIRMED", label: "Confirmed", short: "Confirmed" },
    { status: "PACKED", label: "Packed", short: "Packed" },
    { status: "SHIPPED", label: "Shipped", short: "Shipped" },
    { status: "OUT_FOR_DELIVERY", label: "Out for Delivery", short: "On the Way" },
    { status: "DELIVERED", label: "Delivered", short: "Delivered" },
]

const STATUS_ORDER = STEPS.map(s => s.status)

const ADVANCE_MAP: Partial<Record<OrderStatus, { next: OrderStatus; label: string }>> = {
    PENDING: { next: "CONFIRMED", label: "Confirm Order" },
    CONFIRMED: { next: "PACKED", label: "Mark as Packed" },
    PACKED: { next: "SHIPPED", label: "Mark as Shipped" },
    SHIPPED: { next: "OUT_FOR_DELIVERY", label: "Mark Out for Delivery" },
    OUT_FOR_DELIVERY: { next: "DELIVERED", label: "Mark as Delivered" },
}

interface StatusStepperProps {
    orderId: string
    initialStatus: OrderStatus
    onStatusChange: (id: string, status: OrderStatus) => Promise<boolean>
    onCancel: (id: string) => Promise<boolean>
}

export default function StatusStepper({ orderId, initialStatus, onStatusChange, onCancel }: StatusStepperProps) {
    const [currentStatus, setCurrentStatus] = useState(initialStatus)
    const [isLoading, setIsLoading] = useState(false)

    const isCancelled = currentStatus === "CANCELED" || currentStatus === "RETURNED"
    const currentIndex = STATUS_ORDER.indexOf(currentStatus)
    const advance = ADVANCE_MAP[currentStatus]

    const handleAdvance = async () => {
        if (!advance) return
        setIsLoading(true)
        const ok = await onStatusChange(orderId, advance.next)
        if (ok) {
            setCurrentStatus(advance.next)
            toast.success(`Status advanced to ${advance.next.replace(/_/g, " ")}`)
        } else {
            toast.error("Failed to update status")
        }
        setIsLoading(false)
    }

    const handleCancel = async () => {
        if (!confirm("Cancel this order? Stock will not be automatically restocked.")) return
        setIsLoading(true)
        const ok = await onCancel(orderId)
        if (ok) {
            setCurrentStatus("CANCELED")
            toast.success("Order cancelled")
        } else {
            toast.error("Failed to cancel order")
        }
        setIsLoading(false)
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">
                Order Pipeline
            </h2>

            {isCancelled ? (
                <div className="flex items-center gap-3 p-4 bg-rose-50 rounded-xl border border-rose-200">
                    <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                        <span className="text-rose-600 text-lg">✕</span>
                    </div>
                    <div>
                        <p className="font-semibold text-rose-700">Order {currentStatus === "CANCELED" ? "Cancelled" : "Returned"}</p>
                        <p className="text-xs text-rose-500 mt-0.5">This order is no longer active</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Step Track */}
                    <div className="flex items-start gap-0 overflow-x-auto pb-2">
                        {STEPS.map((step, idx) => {
                            const isDone = idx < currentIndex
                            const isActive = idx === currentIndex
                            const isFuture = idx > currentIndex

                            return (
                                <div key={step.status} className="flex items-center flex-1 min-w-0">
                                    <div className="flex flex-col items-center flex-shrink-0">
                                        {/* Node */}
                                        <div
                                            className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${isDone
                                                ? "bg-orange-600 border-orange-600"
                                                : isActive
                                                    ? "bg-orange-50 border-orange-600 shadow-lg shadow-orange-500/25"
                                                    : "bg-white border-slate-200"
                                                }`}
                                        >
                                            {isDone ? (
                                                <CheckCircle2 className="w-5 h-5 text-white" />
                                            ) : isActive ? (
                                                <div className="w-3 h-3 rounded-full bg-orange-600 animate-pulse" />
                                            ) : (
                                                <Circle className="w-4 h-4 text-slate-300" />
                                            )}
                                        </div>
                                        {/* Label */}
                                        <p className={`mt-2 text-center text-[10px] font-semibold leading-tight max-w-[64px] ${isActive ? "text-orange-600" : isDone ? "text-slate-500" : "text-slate-300"
                                            }`}>
                                            {step.short}
                                        </p>
                                    </div>

                                    {/* Connector */}
                                    {idx < STEPS.length - 1 && (
                                        <div className={`h-0.5 flex-1 mx-1 mt-[-18px] rounded-full transition-colors ${idx < currentIndex ? "bg-orange-500" : "bg-slate-200"
                                            }`} />
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
                        {advance && (
                            <button
                                onClick={handleAdvance}
                                disabled={isLoading}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 shadow-sm shadow-orange-500/30"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    advance.label
                                )}
                            </button>
                        )}
                        {currentStatus !== "DELIVERED" && !isCancelled && (
                            <button
                                onClick={handleCancel}
                                disabled={isLoading}
                                className="px-4 py-2.5 text-rose-600 hover:bg-rose-50 border border-rose-200 text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
                            >
                                Cancel Order
                            </button>
                        )}
                        {currentStatus === "DELIVERED" && (
                            <p className="text-sm text-emerald-600 font-semibold flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />
                                Order successfully delivered!
                            </p>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
