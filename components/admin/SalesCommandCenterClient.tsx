"use client"

import { useState } from "react"
import { OrderStatus } from "@prisma/client"
import OrderPipeline from "@/components/admin/OrderPipeline"
import OrderDetailModal from "@/components/admin/OrderDetailModal"
import { X, Check } from "lucide-react"
import toast from "react-hot-toast"
import { capturePayment } from "@/app/actions/sales" // Next.js Server Action

interface SalesCommandCenterClientProps {
    initialOrders: any[]
    updateStatusAction: (id: string, s: OrderStatus) => Promise<boolean>
}

export default function SalesCommandCenterClient({ initialOrders, updateStatusAction }: SalesCommandCenterClientProps) {
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
    const [paymentModalOrderId, setPaymentModalOrderId] = useState<string | null>(null)
    const [isCapturing, setIsCapturing] = useState(false)

    const activeOrder = selectedOrderId
        ? initialOrders.find(o => o.id === selectedOrderId)
        : null

    const handleCapturePayment = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!paymentModalOrderId) return

        setIsCapturing(true)
        const formData = new FormData(e.currentTarget)
        const method = formData.get("paymentMethod") as string

        const res = await capturePayment(paymentModalOrderId, method)
        if (res.success) {
            toast.success("Payment captured successfully!")
            setPaymentModalOrderId(null)
        } else {
            toast.error(res.error || "Failed to capture payment")
        }
        setIsCapturing(false)
    }

    return (
        <div className="flex-1 w-full min-h-[700px] gap-6 flex flex-col">
            <OrderPipeline
                initialOrders={initialOrders}
                onStatusChange={updateStatusAction}
                onOrderClick={(id) => setSelectedOrderId(id)}
                onCapturePayment={(id) => setPaymentModalOrderId(id)}
            />

            <OrderDetailModal
                order={activeOrder}
                isOpen={!!selectedOrderId}
                onClose={() => setSelectedOrderId(null)}
            />

            {/* Payment Capture Modal */}
            {paymentModalOrderId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setPaymentModalOrderId(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-[#F5F5F5]">
                            <h3 className="font-bold text-slate-800 text-lg">Capture Payment</h3>
                            <button onClick={() => setPaymentModalOrderId(null)} className="p-1 text-slate-400 hover:bg-slate-200 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCapturePayment} className="p-6">
                            <p className="text-sm text-slate-500 mb-6">
                                Please select the payment ledger/method used by the customer to settle this order. This will officially mark the Invoice as PAID.
                            </p>

                            <div className="space-y-4 mb-8">
                                {[
                                    { id: "Cash", label: "💵 Cash" },
                                    { id: "Fonepay", label: "📱 Fonepay / QR" },
                                    { id: "Mobile Banking", label: "🏦 Mobile Banking" },
                                    { id: "Cheque", label: "📝 Cheque" },
                                    { id: "Card", label: "💳 Card (POS)" }
                                ].map((method) => (
                                    <label key={method.id} className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors has-[:checked]:border-secondary has-[:checked]:bg-secondary/20">
                                        <input type="radio" name="paymentMethod" value={method.id} required className="w-4 h-4 text-secondary focus:ring-secondary" />
                                        <span className="font-medium text-slate-700">{method.label}</span>
                                    </label>
                                ))}
                            </div>

                            <button
                                type="submit"
                                disabled={isCapturing}
                                className="w-full py-3.5 bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                {isCapturing ? "Processing..." : <><Check className="w-5 h-5" /> Confirm Capture</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
