export const metadata = {
    title: "FAQ | Tiny Tales",
    description: "Frequently asked questions about Tiny Tales products, shipping, and sizing.",
}

export default function FAQPage() {
    return (
        <div className="max-w-3xl mx-auto px-6 py-24 space-y-12 text-slate-700">
            <h1 className="text-4xl md:text-5xl font-serif text-slate-900 leading-tight border-b border-slate-200 pb-6">Frequently Asked Questions</h1>

            <div className="space-y-8">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">How long does shipping take?</h3>
                    <p className="leading-relaxed">Orders inside the Kathmandu Valley are typically delivered within 24-48 hours. Outside valley deliveries take 3-5 business days depending on the location.</p>
                </div>

                <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Do you ship internationally?</h3>
                    <p className="leading-relaxed">Yes! For international orders, simply checkout and select your country. Our team will contact you directly via WhatsApp to arrange the most cost-effective global courier.</p>
                </div>

                <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Are your fabrics safe for newborns?</h3>
                    <p className="leading-relaxed">Absolutely. We source organic, hypoallergenic cotton and non-toxic dyes specifically designed for delicate newborn skin.</p>
                </div>

                <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">How can I track my order?</h3>
                    <p className="leading-relaxed">Once logged in, you can view your order status directly from your Account Dashboard. If you checked out as a guest, please look out for an SMS or WhatsApp message with tracking details.</p>
                </div>
            </div>
        </div>
    )
}
