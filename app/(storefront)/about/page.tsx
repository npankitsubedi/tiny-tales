export const metadata = {
    title: "About Us | Tiny Tales",
    description: "Learn more about Tiny Tales, our mission, and our passionately crafted baby and maternity essentials.",
}

export default function AboutPage() {
    return (
        <div className="max-w-3xl mx-auto px-6 py-24 space-y-12 text-slate-700">
            <h1 className="text-4xl md:text-5xl font-serif text-slate-900 leading-tight">Our Story</h1>
            <p className="text-lg leading-relaxed">
                Welcome to <span className="font-semibold text-slate-900">Tiny Tales</span>. What started as a small passion project in Kathmandu has grown into a trusted destination for parents across Nepal seeking thoughtfully crafted, premium baby and maternity essentials.
            </p>
            <p className="leading-relaxed">
                We believe that every milestone, no matter how small, deserves to be celebrated with comfort and care. Our clothing is designed using the softest fabrics, ensuring your baby’s delicate skin is always protected. From newborn onesies to comfortable maternity wear for moms-to-be, every piece in our collection is curated with love.
            </p>
            <div className="bg-[#EEF4F9] rounded-2xl p-8 border border-[#D1D1D1] my-10">
                <h2 className="text-xl font-serif text-[#1E293B] mb-3">Our Mission</h2>
                <p className="text-amber-800">
                    To provide new parents with beautiful, high-quality, and affordable essentials that make the magical journey of parenthood just a little bit smoother.
                </p>
            </div>
            <p className="leading-relaxed">
                Thank you for letting Tiny Tales be a part of your family's most beautiful chapters. We are endlessly grateful for your trust and support.
            </p>
        </div>
    )
}
