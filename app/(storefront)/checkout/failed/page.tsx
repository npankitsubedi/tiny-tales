import Link from "next/link"
import { XCircle, ShoppingBag, RefreshCw } from "lucide-react"

const REASON_MESSAGES: Record<string, string> = {
    esewa_verification_failed: "eSewa could not verify your payment signature.",
    khalti_lookup_failed: "Khalti could not confirm your payment.",
    khalti_not_completed: "Your Khalti payment was not completed.",
    esewa_processing_failed: "An error occurred while processing your eSewa payment.",
    khalti_processing_failed: "An error occurred while processing your Khalti payment.",
    payment_failed: "Your payment was not completed.",
    invalid_callback: "Invalid payment callback received.",
    server_config: "Server configuration error. Please contact support.",
}

export const metadata = { title: "Payment Failed | Tiny Tales" }

export default function CheckoutFailedPage({
    searchParams
}: {
    searchParams: { reason?: string }
}) {
    const reason = searchParams.reason || "payment_failed"
    const message = REASON_MESSAGES[reason] || "Something went wrong with your payment."

    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-4 py-20">
            <div className="max-w-md w-full text-center">

                <div className="flex items-center justify-center mb-8">
                    <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center shadow-lg shadow-red-100">
                        <XCircle className="w-12 h-12 text-red-400" />
                    </div>
                </div>

                <h1 className="font-serif text-4xl text-slate-800 mb-3">Payment Failed</h1>
                <p className="text-slate-500 text-base mb-2">{message}</p>
                <p className="text-sm text-slate-400 mb-8">
                    Your order has been canceled. No payment has been charged.
                    If you believe this is an error, please contact our support team.
                </p>

                <div className="bg-[#EEF4F9] border border-[#D1D1D1] rounded-3xl p-5 mb-8 text-left space-y-2">
                    <p className="font-semibold text-slate-700 text-sm">What you can do:</p>
                    <ul className="text-sm text-slate-500 space-y-1.5">
                        <li>✦ Try placing the order again with a different payment method</li>
                        <li>✦ Try COD (Cash on Delivery) if available in your area</li>
                        <li>✦ Contact us on WhatsApp for manual order assistance</li>
                    </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/checkout">
                        <button className="flex items-center gap-2 bg-[#C8D9E6] hover:bg-[#A8BDD0] text-white font-semibold px-6 py-3 rounded-full transition-all shadow-lg shadow-[#EEF4F9]">
                            <RefreshCw className="w-4 h-4" /> Try Again
                        </button>
                    </Link>
                    <Link href="/shop">
                        <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 font-semibold px-6 py-3 rounded-full transition-all hover:border-slate-300">
                            <ShoppingBag className="w-4 h-4" /> Back to Shop
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
