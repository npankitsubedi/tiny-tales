import { db } from "@/lib/db"
import AnimatedProductGrid from "@/components/storefront/AnimatedProductGrid"
import { ProductCategory } from "@prisma/client"
import { SlidersHorizontal, Search } from "lucide-react"
import Link from "next/link"

export const metadata = {
    title: "Shop All Products",
    description: "Browse our full collection of baby and maternity clothing."
}

const SORT_OPTIONS = [
    { label: "Newest First", value: "newest" },
    { label: "Price: Low to High", value: "price_asc" },
    { label: "Price: High to Low", value: "price_desc" },
]

const CATEGORIES = Object.values(ProductCategory)

type SearchParams = { category?: string; sort?: string }

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
    const { category, sort } = searchParams

    const validCategory = CATEGORIES.includes(category as ProductCategory)
        ? (category as ProductCategory)
        : undefined

    const orderBy: any =
        sort === "price_asc" ? { basePrice: "asc" } :
            sort === "price_desc" ? { basePrice: "desc" } :
                { createdAt: "desc" }

    const products = await db.product.findMany({
        where: validCategory ? { category: validCategory } : undefined,
        orderBy,
        select: {
            id: true,
            title: true,
            basePrice: true,
            category: true,
            variants: { select: { stockCount: true } }
        }
    })

    const formatted = products.map(p => ({
        id: p.id,
        title: p.title,
        basePrice: p.basePrice.toNumber(),
        category: p.category,
        totalStock: p.variants.reduce((s, v) => s + v.stockCount, 0)
    }))

    const buildUrl = (params: Record<string, string>) => {
        const sp = new URLSearchParams()
        if (params.category) sp.set("category", params.category)
        if (params.sort) sp.set("sort", params.sort)
        const q = sp.toString()
        return `/shop${q ? `?${q}` : ""}`
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Page Header */}
                <div className="mb-10">
                    <h1 className="font-serif text-4xl text-slate-800 mb-2">
                        {validCategory
                            ? `${validCategory.charAt(0) + validCategory.slice(1).toLowerCase()} Collection`
                            : "All Products"}
                    </h1>
                    <p className="text-slate-500">{formatted.length} product{formatted.length !== 1 ? "s" : ""} found</p>
                </div>

                <div className="flex gap-8 items-start">
                    {/* ── Sidebar Filters ── */}
                    <aside className="w-56 shrink-0 sticky top-24 hidden lg:block space-y-8">
                        <div>
                            <h3 className="font-semibold text-slate-700 text-sm mb-3 flex items-center gap-2">
                                <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                                Category
                            </h3>
                            <div className="space-y-1">
                                <Link href={buildUrl({ ...(sort ? { sort } : {}) })}
                                    className={`block px-3 py-2 text-sm rounded-xl transition-colors ${!validCategory ? "bg-amber-50 text-amber-700 font-semibold" : "text-slate-600 hover:bg-slate-50"}`}>
                                    All Products
                                </Link>
                                {CATEGORIES.map(cat => (
                                    <Link key={cat} href={buildUrl({ category: cat, ...(sort ? { sort } : {}) })}
                                        className={`block px-3 py-2 text-sm rounded-xl transition-colors capitalize ${validCategory === cat ? "bg-amber-50 text-amber-700 font-semibold" : "text-slate-600 hover:bg-slate-50"}`}>
                                        {cat.charAt(0) + cat.slice(1).toLowerCase()}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold text-slate-700 text-sm mb-3">Sort By</h3>
                            <div className="space-y-1">
                                {SORT_OPTIONS.map(opt => (
                                    <Link key={opt.value} href={buildUrl({ ...(validCategory ? { category: validCategory } : {}), sort: opt.value })}
                                        className={`block px-3 py-2 text-sm rounded-xl transition-colors ${sort === opt.value ? "bg-amber-50 text-amber-700 font-semibold" : "text-slate-600 hover:bg-slate-50"}`}>
                                        {opt.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </aside>

                    {/* ── Product Grid ── */}
                    <div className="flex-1 min-w-0">
                        {/* Mobile horizontal filter strip */}
                        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 lg:hidden snap-x scrollbar-none -mx-4 px-4">
                            <Link href={buildUrl({ ...(sort ? { sort } : {}) })}
                                className={`shrink-0 px-4 py-2 text-sm font-semibold rounded-full border transition-colors snap-start ${!validCategory ? "bg-amber-500 text-white border-amber-500" : "bg-white text-slate-600 border-slate-200 hover:border-amber-300"}`}>
                                All
                            </Link>
                            {CATEGORIES.map(cat => (
                                <Link key={cat} href={buildUrl({ category: cat, ...(sort ? { sort } : {}) })}
                                    className={`shrink-0 px-4 py-2 text-sm font-semibold rounded-full border transition-colors snap-start capitalize ${validCategory === cat ? "bg-amber-500 text-white border-amber-500" : "bg-white text-slate-600 border-slate-200 hover:border-amber-300"}`}>
                                    {cat.charAt(0) + cat.slice(1).toLowerCase()}
                                </Link>
                            ))}
                        </div>

                        {formatted.length === 0 ? (
                            <div className="text-center py-24 text-slate-400">
                                <Search className="w-12 h-12 mx-auto mb-4 text-slate-200" aria-hidden="true" />
                                <p className="font-semibold text-slate-500">No products found</p>
                                <p className="text-sm mt-1">Try selecting a different category</p>
                                <Link href="/shop" className="mt-4 inline-block text-amber-600 font-semibold text-sm hover:text-amber-700">Clear filters →</Link>
                            </div>
                        ) : (
                            <AnimatedProductGrid products={formatted} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
