import { db } from "@/lib/db"
import ProductCard from "@/components/storefront/ProductCard"
import Link from "next/link"
import { ArrowRight, ShieldCheck, Truck, Heart, Star } from "lucide-react"

const CATEGORY_ITEMS = [
    { label: "Newborn", slug: "NEWBORN", emoji: "👶", color: "from-rose-100 to-rose-200", textColor: "text-rose-700" },
    { label: "Boys", slug: "BOYS", emoji: "🧒", color: "from-sky-100 to-sky-200", textColor: "text-sky-700" },
    { label: "Girls", slug: "GIRLS", emoji: "👧", color: "from-pink-100 to-pink-200", textColor: "text-pink-700" },
    { label: "Maternity", slug: "MATERNITY", emoji: "🤰", color: "from-violet-100 to-violet-200", textColor: "text-violet-700" },
]

const TRUST_BADGES = [
    { icon: ShieldCheck, label: "100% Hypoallergenic", desc: "Safe for sensitive baby skin" },
    { icon: Truck, label: "Free Shipping", desc: "On all orders over Rs. 2000" },
    { icon: Heart, label: "Made with Love", desc: "From Nepal, for your family" },
    { icon: Star, label: "Top Rated", desc: "Loved by 1000+ parents" },
]

export default async function StorefrontHomePage() {
    // SSR: Fetch best sellers — EXCLUDE cogs via select
    const products = await db.product.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            title: true,
            basePrice: true,
            category: true,
            variants: {
                select: { stockCount: true }
            }
        }
    })

    const formattedProducts = products.map(p => ({
        id: p.id,
        title: p.title,
        basePrice: p.basePrice.toNumber(),
        category: p.category,
        totalStock: p.variants.reduce((sum, v) => sum + v.stockCount, 0)
    }))

    return (
        <div className="overflow-x-hidden">

            {/* ─── Hero Section ─── */}
            <section className="relative bg-gradient-to-br from-[#FFF8F0] via-[#FFF1E6] to-[#FDEEE8] min-h-[85vh] flex items-center">
                {/* Decorative blobs */}
                <div className="absolute top-20 right-10 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-10 left-20 w-72 h-72 bg-rose-200/30 rounded-full blur-3xl pointer-events-none" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col md:flex-row items-center gap-12">
                    {/* Text */}
                    <div className="flex-1 text-center md:text-left">
                        <span className="inline-block text-xs font-bold tracking-widest text-amber-600 uppercase bg-amber-100 px-3 py-1 rounded-full mb-6">
                            Nepal's #1 Baby Boutique
                        </span>
                        <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-slate-800 leading-tight mb-6">
                            Dress your little one{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-rose-500">
                                with love.
                            </span>
                        </h1>
                        <p className="text-lg text-slate-500 max-w-lg mb-10 leading-relaxed">
                            Thoughtfully crafted baby & maternity clothing, made from the softest materials. Every stitch tells a <em>tiny tale</em>.
                        </p>
                        <div className="flex gap-4 justify-center md:justify-start flex-wrap">
                            <Link href="/shop?category=NEWBORN">
                                <button className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-8 py-4 rounded-full transition-all shadow-lg shadow-amber-200 hover:shadow-amber-300 hover:-translate-y-0.5 text-base">
                                    Shop Newborn Essentials <ArrowRight className="w-4 h-4" />
                                </button>
                            </Link>
                            <Link href="/shop">
                                <button className="inline-flex items-center gap-2 bg-white text-slate-700 font-semibold px-8 py-4 rounded-full transition-all shadow-sm hover:shadow-md text-base border border-slate-100">
                                    View All Collections
                                </button>
                            </Link>
                        </div>
                    </div>

                    {/* Hero visual */}
                    <div className="flex-shrink-0 w-72 h-72 md:w-96 md:h-96 rounded-[40px] bg-gradient-to-br from-amber-100 via-rose-100 to-purple-100 shadow-2xl flex items-center justify-center relative overflow-hidden">
                        <span className="text-[140px] leading-none select-none">🍼</span>
                        <div className="absolute bottom-6 right-6 bg-white rounded-2xl shadow-lg px-4 py-3 text-sm font-semibold text-slate-700">
                            <span className="text-amber-500">♥</span> 2,500+ happy families
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Category Circles ─── */}
            <section className="py-16 bg-white border-b border-amber-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="font-serif text-3xl text-slate-800 mb-10 text-center">Shop by Category</h2>
                    <div className="flex gap-6 overflow-x-auto pb-4 justify-start md:justify-center snap-x">
                        {CATEGORY_ITEMS.map(cat => (
                            <Link key={cat.slug} href={`/shop?category=${cat.slug}`}
                                className="flex flex-col items-center gap-3 snap-start group shrink-0">
                                <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${cat.color} flex items-center justify-center text-5xl shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-300`}>
                                    {cat.emoji}
                                </div>
                                <span className={`text-sm font-semibold ${cat.textColor}`}>{cat.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Best Sellers ─── */}
            <section className="py-20 bg-[#FDFBF7]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-end justify-between mb-10">
                        <div>
                            <p className="text-xs font-bold tracking-widest text-amber-600 uppercase mb-2">Our Collection</p>
                            <h2 className="font-serif text-3xl md:text-4xl text-slate-800">Best Sellers</h2>
                        </div>
                        <Link href="/shop" className="text-sm font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1 transition-colors">
                            View All <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {formattedProducts.length === 0 ? (
                        <div className="text-center py-20 text-slate-400">
                            <p className="text-4xl mb-4">🛍️</p>
                            <p className="font-medium">No products yet — check back soon!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {formattedProducts.map(product => (
                                <ProductCard key={product.id} {...product} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ─── Trust Badges ─── */}
            <section className="py-16 bg-white border-t border-amber-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {TRUST_BADGES.map(({ icon: Icon, label, desc }) => (
                            <div key={label} className="flex flex-col items-center text-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                                    <Icon className="w-6 h-6 text-amber-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800 text-sm">{label}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

        </div>
    )
}
