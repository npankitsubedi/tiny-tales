export const metadata = {
    title: "Privacy Policy | Tiny Tales",
    description: "How Tiny Tales handles your data and privacy.",
}

export default function PrivacyPage() {
    return (
        <div className="max-w-3xl mx-auto px-6 py-24 space-y-8 text-slate-700">
            <h1 className="text-4xl md:text-5xl font-serif text-slate-900 leading-tight">Privacy Policy</h1>

            <p className="text-sm text-slate-500 uppercase tracking-wider">Last Updated: March 2026</p>

            <p className="leading-relaxed">
                At Tiny Tales, we take your privacy seriously. This Privacy Policy describes how your personal information is collected, used, and shared when you visit or make a purchase from our store.
            </p>

            <h2 className="text-2xl font-serif text-slate-800 mt-8 mb-4">Information We Collect</h2>
            <p className="leading-relaxed">
                When you make a purchase or attempt to make a purchase through the Site, we collect certain information from you, including your name, billing address, shipping address, payment information (including eSewa/Khalti transaction details), email address, and phone number. We refer to this information as "Order Information."
            </p>

            <h2 className="text-2xl font-serif text-slate-800 mt-8 mb-4">How do we use your personal information?</h2>
            <p className="leading-relaxed">
                We use the Order Information that we collect generally to fulfill any orders placed through the Site (including processing your payment information, arranging for shipping, and providing you with invoices and/or order confirmations). Additionally, we use this Order Information to communicate with you and screen our orders for potential risk or fraud.
            </p>

            <h2 className="text-2xl font-serif text-slate-800 mt-8 mb-4">Data Retention</h2>
            <p className="leading-relaxed">
                When you place an order through the Site, we will maintain your Order Information for our records unless and until you ask us to delete this information.
            </p>
        </div>
    )
}
