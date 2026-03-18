export const metadata = {
    title: "Return Policy | Tiny Tales",
    description: "Our hassle-free return and exchange policy.",
}

export default function ReturnsPage() {
    return (
        <div className="max-w-3xl mx-auto px-6 py-24 space-y-8 text-slate-700">
            <h1 className="text-4xl md:text-5xl font-serif text-slate-900 leading-tight">Return Policy</h1>

            <p className="text-lg leading-relaxed">
                We want you to love your Tiny Tales purchase. If for any reason you are not completely satisfied, we offer a hassle-free 7-day return and exchange policy.
            </p>

            <h2 className="text-2xl font-serif text-slate-800 mt-8 mb-4">Eligibility for Returns</h2>
            <ul className="list-disc pl-5 space-y-2">
                <li>Items must be unused, unwashed, and in their original packaging.</li>
                <li>All original tags must still be attached.</li>
                <li>Items explicitly marked as "Non-Returnable" on their product page cannot be returned or exchanged.</li>
            </ul>

            <h2 className="text-2xl font-serif text-slate-800 mt-8 mb-4">How to Initiate a Return</h2>
            <p className="leading-relaxed">
                Please contact our support team at <span className="font-semibold">support@tinytales.com.np</span> or via our WhatsApp business number within 7 days of receiving your order. Include your Order ID and the reason for return.
            </p>

            <h2 className="text-2xl font-serif text-slate-800 mt-8 mb-4">Refunds</h2>
            <p className="leading-relaxed">
                Once we receive and inspect your returned item, we will notify you and process your refund immediately. Please allow 3-5 business days for the amount to reflect in your original payment method (eSewa, Khalti, or Bank account).
            </p>
        </div>
    )
}
