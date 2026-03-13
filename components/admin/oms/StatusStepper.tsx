"use client"

import { useState, useTransition } from "react"
import { CheckCircle2, Circle } from "lucide-react"
import toast from "react-hot-toast"
import { OrderStatusValue } from "@/lib/domain"
import LoadingButton from "@/components/ui/LoadingButton"

const STEPS: { status: OrderStatusValue; label: string; short: string }[] = [
    { status: "PENDING", label: "Order Received", short: "Pending" },
    { status: "CONFIRMED", label: "Confirmed", short: "Confirmed" },
    { status: "PACKED", label: "Packed", short: "Packed" },
    { status: "SHIPPED", label: "Shipped", short: "Shipped" },
    { status: "OUT_FOR_DELIVERY", label: "Out for Delivery", short: "On the Way" },
    { status: "DELIVERED", label: "Delivered", short: "Delivered" },
]

const STATUS_ORDER = STEPS.map(s => s.status)

const ADVANCE_MAP: Partial<Record<OrderStatusValue, { next: OrderStatusValue; label: string }>> = {
    PENDING: { next: "CONFIRMED", label: "Confirm Order" },
    CONFIRMED: { next: "PACKED", label: "Mark as Packed" },
    PACKED: { next: "SHIPPED", label: "Mark as Shipped" },
    SHIPPED: { next: "OUT_FOR_DELIVERY", label: "Mark Out for Delivery" },
    OUT_FOR_DELIVERY: { next: "DELIVERED", label: "Mark as Delivered" },
}

interface StatusStepperProps {
    orderId: string
    initialStatus: OrderStatusValue
    onStatusChange: (id: string, status: OrderStatusValue) => Promise<{ success: boolean; error?: string }>
    onCancel: (id: string) => Promise<{ success: boolean; error?: string }>
}

export default function StatusStepper({ orderId, initialStatus, onStatusChange, onCancel }: StatusStepperProps) {
    const [currentStatus, setCurrentStatus] = useState(initialStatus)
    const [pendingAction, setPendingAction] = useState<"advance" | "cancel" | null>(null)
    const [isPending, startTransition] = useTransition()

    const isCancelled = currentStatus === "CANCELED" || currentStatus === "RETURNED"
    const currentIndex = STATUS_ORDER.indexOf(currentStatus)
    const advance = ADVANCE_MAP[currentStatus]

    const handleAdvance = () => {
        if (!advance) return
        setPendingAction("advance")
        startTransition(async () => {
            const result = await onStatusChange(orderId, advance.next)
            if (result.success) {
                setCurrentStatus(advance.next)
                toast.success(`Status advanced to ${advance.next.replace(/_/g, " ")}`)
            } else {
                toast.error(result.error ?? "Failed to update status")
            }
            setPendingAction(null)
        })
    }

    const handleCancel = () => {
        if (!confirm("Cancel this order? Stock will not be automatically restocked.")) return
        setPendingAction("cancel")
        startTransition(async () => {
            const result = await onCancel(orderId)
            if (result.success) {
                setCurrentStatus("CANCELED")
                toast.success("Order cancelled")
            } else {
                toast.error(result.error ?? "Failed to cancel order")
            }
            setPendingAction(null)
        })
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
                            <LoadingButton
                                onClick={handleAdvance}
                                isLoading={isPending && pendingAction === "advance"}
                                disabled={isPending}
                                loadingText={advance.label}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 shadow-sm shadow-orange-500/30"
                            >
                                {advance.label}
                            </LoadingButton>
                        )}
                        {currentStatus !== "DELIVERED" && !isCancelled && (
                            <LoadingButton
                                onClick={handleCancel}
                                isLoading={isPending && pendingAction === "cancel"}
                                disabled={isPending}
                                loadingText="Cancelling..."
                                loadingClassName="bg-rose-600 border-rose-600 text-white hover:bg-rose-600"
                                className="px-4 py-2.5 text-rose-600 hover:bg-rose-50 border border-rose-200 text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
                            >
                                Cancel Order
                            </LoadingButton>
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
