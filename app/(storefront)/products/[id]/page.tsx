import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import VariantSelector from "@/components/storefront/VariantSelector"
import { ShieldCheck, Droplets, Shirt, Package, ChevronRight } from "lucide-react"
import Link from "next/link"

const CARE_INSTRUCTIONS = [
    { icon: ShieldCheck, label: "Hypoallergenic", desc: "Tested safe for sensitive newborn skin. No harsh dyes." },
    { icon: Droplets, label: "Gentle Wash", desc: "Machine wash cold with mild detergent. Tumble dry low." },
    { icon: Shirt, label: "100% Cotton", desc: "Breathable, soft, and naturally gentle against baby's skin." },
]

const CATEGORY_EMOJI: Record<string, string> = {
    NEWBORN: "👶", BOYS: "🧒", GIRLS: "👧", MATERNITY: "🤰"
}

type Params = { id: string }

export async function generateMetadata({ params }: { params: Promise<Params> }) {
    const resolvedParams = await params
    const product = await db.product.findUnique({
        where: { id: resolvedParams.id },
        select: { title: true, description: true }
    })
    if (!product) return { title: "Product Not Found" }
    return {
        title: product.title,
        description: product.description || `Shop ${product.title} at Tiny Tales.`
    }
}

export default async function ProductDetailPage({ params }: { params: Promise<Params> }) {
    const resolvedParams = await params
    // SSR fetch — cogs explicitly excluded via select
    const product = await db.product.findUnique({
        where: { id: resolvedParams.id },
        select: {
            id: true,
            title: true,
            description: true,
            category: true,
            basePrice: true,
            isNonReturnable: true,
            variants: {
                select: {
                    id: true,
                    size: true,
                    color: true,
                    sku: true,
                    stockCount: true,
                    lowStockThreshold: true,
                }
            }
        }
    })

    if (!product) notFound()

    const basePrice = product.basePrice.toNumber()
    const variants = product.variants
    const totalStock = variants.reduce((s, v) => s + v.stockCount, 0)

    // Thumbnail placeholders (real images to be swapped in Phase 8)
    const galleryItems = [1, 2, 3, 4]

    return (
        <div className="bg-[#FDFBF7] min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

                {/* Breadcrumb */}
                <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-8 font-medium">
                    <Link href="/" className="hover:text-slate-600 transition-colors">Home</Link>
                    <ChevronRight className="w-3 h-3" />
                    <Link href="/shop" className="hover:text-slate-600 transition-colors">Shop</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-600 line-clamp-1">{product.title}</span>
                </nav>

                {/* Main Product Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">

                    {/* ── Left: Image Gallery ── */}
                    <div className="space-y-4 lg:sticky lg:top-24">
                        {/* Main Image */}
                        <div className="aspect-square rounded-3xl bg-gradient-to-br from-amber-50 via-rose-50 to-purple-50 border border-amber-100 flex items-center justify-center overflow-hidden shadow-sm">
                            <span className="text-[160px] select-none leading-none">
                                {CATEGORY_EMOJI[product.category] || "🍼"}
                            </span>
                        </div>

                        {/* Thumbnail Row */}
                        <div className="grid grid-cols-4 gap-3">
                            {galleryItems.map(i => (
                                <div key={i} className="aspect-square rounded-2xl bg-gradient-to-br from-amber-50 to-rose-50 border-2 border-amber-100 hover:border-amber-400 cursor-pointer transition-colors flex items-center justify-center">
                                    <span className="text-2xl opacity-40 select-none">
                                        {CATEGORY_EMOJI[product.category] || "🍼"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Right: Product Info ── */}
                    <div className="space-y-8">
                        {/* Header Info */}
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                                    {product.category.charAt(0) + product.category.slice(1).toLowerCase()}
                                </span>
                                {product.isNonReturnable && (
                                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                                        Non-Returnable
                                    </span>
                                )}
                            </div>

                            <h1 className="font-serif text-3xl md:text-4xl text-slate-800 leading-snug mb-4">
                                {product.title}
                            </h1>

                            <div className="flex items-baseline gap-3 mb-5">
                                <span className="text-3xl font-bold text-slate-900">
                                    Rs. {basePrice.toFixed(2)}
                                </span>
                                <span className="text-sm text-slate-400">Incl. VAT</span>
                            </div>

                            {product.description && (
                                <p className="text-slate-600 leading-relaxed text-base border-t border-slate-100 pt-5">
                                    {product.description}
                                </p>
                            )}
                        </div>

                        {/* Variant Selector (Client Component) */}
                        <VariantSelector
                            variants={variants}
                            productId={product.id}
                            productTitle={product.title}
                            basePrice={basePrice}
                        />

                        {/* Stock Summary */}
                        <div className="flex items-center gap-2 text-sm text-slate-500 border-t border-slate-100 pt-4">
                            <Package className="w-4 h-4 text-slate-400" />
                            <span>
                                {totalStock > 0
                                    ? `${totalStock} total units available across ${variants.length} variant${variants.length !== 1 ? "s" : ""}`
                                    : "Currently out of stock across all variants"}
                            </span>
                        </div>

                        {/* ── Care Instructions ── */}
                        <div className="bg-white rounded-3xl border border-amber-50 shadow-sm p-6 space-y-5">
                            <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wider">Care & Material</h3>
                            {CARE_INSTRUCTIONS.map(({ icon: Icon, label, desc }) => (
                                <div key={label} className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
                                        <Icon className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-800 text-sm">{label}</p>
                                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
