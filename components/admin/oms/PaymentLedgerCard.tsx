"use client"

import { useState } from "react"
import { formatRs } from "@/lib/currency"
import { CreditCard, Banknote, Check, Loader2, X } from "lucide-react"
import toast from "react-hot-toast"

type InvoiceStatus = "PAID" | "UNPAID" | "OVERDUE" | "CANCELLED"

interface PaymentLedgerCardProps {
    orderId: string
    paymentMethod: string
    invoiceStatus: InvoiceStatus
    amountDue: number
    amountPaid: number
    onCapturePayment: (orderId: string, method: string) => Promise<{ success: boolean; error?: string }>
}

const TENDER_OPTIONS = [
    { id: "Cash", label: "💵 Cash", description: "Physical cash payment" },
    { id: "Fonepay", label: "📱 Fonepay / QR", description: "Scan QR code" },
    { id: "Mobile Banking", label: "🏦 Mobile Banking", description: "Direct bank transfer" },
    { id: "Card", label: "💳 Card (POS)", description: "Point of sale terminal" },
    { id: "Cheque", label: "📝 Cheque", description: "Bank cheque payment" },
]

export default function PaymentLedgerCard({
    orderId,
    paymentMethod,
    invoiceStatus,
    amountDue,
    amountPaid,
    onCapturePayment
}: PaymentLedgerCardProps) {
    const [showModal, setShowModal] = useState(false)
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
    const [isCapturing, setIsCapturing] = useState(false)

    const isCOD = paymentMethod === "Cash on Delivery"
    const isPaid = invoiceStatus === "PAID"
    const remaining = amountDue - amountPaid

    const handleCapture = async () => {
        if (!selectedMethod) return
        setIsCapturing(true)
        const res = await onCapturePayment(orderId, selectedMethod)
        if (res.success) {
            toast.success("Payment captured successfully!")
            setShowModal(false)
        } else {
            toast.error(res.error ?? "Failed to capture payment")
        }
        setIsCapturing(false)
    }

    return (
        <>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5" /> Payment Ledger
                </h3>

                {/* Method */}
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-slate-600">Method</span>
                    <span className="text-sm font-semibold text-slate-800">{paymentMethod}</span>
                </div>

                {/* Amount Due */}
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-slate-600">Amount Due</span>
                    <span className="text-sm font-bold text-slate-800">{formatRs(amountDue)}</span>
                </div>

                {/* Amount Paid */}
                {amountPaid > 0 && (
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-slate-600">Amount Paid</span>
                        <span className="text-sm font-semibold text-emerald-600">{formatRs(amountPaid)}</span>
                    </div>
                )}

                {/* Status */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-sm text-slate-600">Status</span>
                    <span className={`text-sm font-bold px-3 py-0.5 rounded-full ${isPaid
                            ? "text-emerald-700 bg-emerald-50"
                            : "text-amber-700 bg-amber-50"
                        }`}>
                        {isPaid ? "✓ Paid" : invoiceStatus}
                    </span>
                </div>

                {/* COD Receive Button */}
                {isCOD && !isPaid && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-sm font-bold rounded-xl transition-all shadow-sm shadow-orange-500/20"
                    >
                        <Banknote className="w-4 h-4" />
                        Receive Payment ({formatRs(remaining)})
                    </button>
                )}
            </div>

            {/* Capture Modal */}
            {showModal && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="font-bold text-slate-800">Receive Payment</h3>
                            <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            <p className="text-sm text-slate-500 mb-1">
                                Amount to collect: <span className="font-bold text-slate-800">{formatRs(remaining)}</span>
                            </p>
                            <p className="text-xs text-slate-400 mb-5">
                                Select the payment method used to settle this order. This marks the invoice as PAID.
                            </p>

                            <div className="space-y-2 mb-6">
                                {TENDER_OPTIONS.map((opt) => (
                                    <label
                                        key={opt.id}
                                        className={`flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer transition-all ${selectedMethod === opt.id
                                                ? "border-orange-500 bg-orange-50"
                                                : "border-slate-200 hover:bg-slate-50"
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="tender"
                                            value={opt.id}
                                            checked={selectedMethod === opt.id}
                                            onChange={() => setSelectedMethod(opt.id)}
                                            className="hidden"
                                        />
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedMethod === opt.id ? "border-orange-600 bg-orange-600" : "border-slate-300"
                                            }`}>
                                            {selectedMethod === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-800 text-sm">{opt.label}</p>
                                            <p className="text-xs text-slate-400">{opt.description}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <button
                                onClick={handleCapture}
                                disabled={!selectedMethod || isCapturing}
                                className="w-full py-3 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white font-bold rounded-xl transition-all disabled:opacity-50"
                            >
                                {isCapturing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <><Check className="w-4 h-4" /> Confirm & Mark Paid</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
