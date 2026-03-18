import { db } from "@tinytales/db"
import ProductCard from "@/features/catalog/components/ProductCard"
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
            <section className="relative bg-bg-primary min-h-[85vh] flex items-center overflow-hidden animate-fade-in-up">
                {/* Soft natural decorative elements */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent/20 rounded-full blur-[100px] pointer-events-none translate-x-1/3 -translate-y-1/3 opacity-60 animate-float" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[80px] pointer-events-none -translate-x-1/3 translate-y-1/3 opacity-50" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col md:flex-row items-center gap-12">
                    {/* Text */}
                    <div className="flex-1 text-center md:text-left">
                        <span className="inline-block text-xs font-bold tracking-widest text-text-secondary uppercase bg-white/60 backdrop-blur-md px-4 py-2 rounded-full mb-6 border border-border/50 shadow-sm animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                            Nepal's #1 Baby Boutique
                        </span>
                        <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-text-primary leading-tight mb-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                            Dress your little one{" "}
                            <span className="text-primary">
                                with love.
                            </span>
                        </h1>
                        <p className="text-lg text-text-secondary max-w-lg mb-10 leading-relaxed font-medium animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                            Thoughtfully crafted baby & maternity clothing, made from the softest materials. Every stitch tells a <em className="text-primary not-italic font-semibold">tiny tale</em>.
                        </p>
                        <div className="flex gap-4 justify-center md:justify-start flex-wrap animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                            <Link href="/shop?category=NEWBORN">
                                <button className="inline-flex items-center justify-center gap-2 bg-primary hover:opacity-90 text-primary-foreground font-semibold px-8 min-h-[56px] rounded-full transition-all duration-500 shadow-md hover:shadow-card-hover hover:-translate-y-1 text-base">
                                    Shop Essentials <ArrowRight className="w-5 h-5" />
                                </button>
                            </Link>
                            <Link href="/shop">
                                <button className="inline-flex items-center justify-center gap-2 bg-bg-card text-text-primary font-semibold px-8 min-h-[56px] rounded-full transition-all duration-500 shadow-sm hover:shadow-md hover:-translate-y-1 text-base border border-border/60">
                                    View Collections
                                </button>
                            </Link>
                        </div>
                    </div>

                    {/* Hero visual */}
                    <div className="flex-shrink-0 w-72 h-72 md:w-96 md:h-96 rounded-[3rem] bg-gradient-to-br from-white via-bg-primary to-accent/20 shadow-lg flex items-center justify-center relative overflow-hidden animate-float">
                        <span className="text-[140px] leading-none select-none">🍼</span>
                        <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur rounded-[2rem] shadow-lg px-5 py-3 text-sm font-semibold text-text-primary border border-border/50">
                            <span className="text-primary">♥</span> 2,500+ happy families
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Category Circles ─── */}
            <section className="py-16 bg-bg-card border-b border-border/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="font-serif text-3xl text-text-primary mb-10 text-center">Shop by Category</h2>
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
            <section className="py-20 bg-bg-card">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-end justify-between mb-10">
                        <div>
                            <p className="text-xs font-bold tracking-widest text-text-muted uppercase mb-2">Our Collection</p>
                            <h2 className="font-serif text-3xl md:text-4xl text-text-primary">Best Sellers</h2>
                        </div>
                        <Link href="/shop" className="text-sm font-bold text-primary hover:text-primary-dk flex items-center gap-1 transition-colors min-h-[44px]">
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
            <section className="py-16 bg-bg-card border-t border-border/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {TRUST_BADGES.map(({ icon: Icon, label, desc }) => (
                            <div key={label} className="flex flex-col items-center text-center gap-3">
                                <div className="w-16 h-16 rounded-[2rem] bg-bg-primary flex items-center justify-center shadow-sm">
                                    <Icon className="w-7 h-7 text-accent" />
                                </div>
                                <div>
                                    <p className="font-bold text-text-primary text-base">{label}</p>
                                    <p className="text-sm text-text-secondary mt-0.5">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

        </div>
    )
}
