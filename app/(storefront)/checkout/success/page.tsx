"use client"

import { useEffect } from "react"
import { useCartStore } from "@/store/cartStore"
import Link from "next/link"
import { CheckCircle2, ShoppingBag, Home } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function SuccessContent() {
    const searchParams = useSearchParams()
    const orderId = searchParams.get("orderId")
    const clearCart = useCartStore(state => state.clearCart)

    // Cart lives in localStorage on the client — this is the correct place to clear it
    // since server actions and API routes cannot access client-side localStorage.
    useEffect(() => {
        clearCart()
    }, [clearCart])

    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-4 py-20">
            <div className="max-w-md w-full text-center">

                {/* Animated Success Icon */}
                <div className="flex items-center justify-center mb-8">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center shadow-lg shadow-emerald-100 animate-in zoom-in duration-500">
                            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                        </div>
                        <div className="absolute -top-2 -right-2 text-3xl animate-bounce">🎉</div>
                    </div>
                </div>

                <h1 className="font-serif text-4xl text-slate-800 mb-3">Thank you!</h1>
                <p className="text-slate-500 text-lg mb-2">Your order has been placed successfully.</p>

                {orderId && (
                    <p className="text-sm text-slate-400 mb-8">
                        Order ID:{" "}
                        <span className="font-mono font-medium text-slate-600">
                            #{orderId.slice(-8).toUpperCase()}
                        </span>
                    </p>
                )}

                <div className="bg-white rounded-3xl border border-amber-50 shadow-sm p-6 mb-8 text-left space-y-3">
                    <h3 className="font-semibold text-slate-800 text-sm">What happens next?</h3>
                    <div className="space-y-2 text-sm text-slate-500">
                        <p>✅ Payment confirmed and order received.</p>
                        <p>📦 Our team will pack your order with love and care.</p>
                        <p>🚚 You'll be notified once your order is out for delivery.</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/shop">
                        <button className="flex items-center gap-2 bg-[#C8D9E6] hover:bg-[#A8BDD0] text-white font-semibold px-6 py-3 rounded-full transition-all shadow-lg shadow-[#EEF4F9]">
                            <ShoppingBag className="w-4 h-4" /> Continue Shopping
                        </button>
                    </Link>
                    <Link href="/account">
                        <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 font-semibold px-6 py-3 rounded-full transition-all hover:border-slate-300">
                            <Home className="w-4 h-4" /> View My Orders
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default function CheckoutSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
            </div>
        }>
            <SuccessContent />
        </Suspense>
    )
}
