/**
 * Skeleton loaders for the Shop catalog page.
 * These are server-renderable static placeholders — no client JS needed.
 */

export function ProductCardSkeleton() {
    return (
        <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm animate-pulse">
            {/* Image area */}
            <div className="aspect-square skeleton bg-slate-100" />
            {/* Content */}
            <div className="p-4 space-y-3">
                <div className="flex justify-between gap-3">
                    <div className="skeleton h-4 rounded-full bg-slate-100 flex-1" />
                    <div className="skeleton h-4 w-14 rounded-full bg-slate-100" />
                </div>
                <div className="skeleton h-3 rounded-full bg-slate-100 w-3/4" />
                <div className="flex justify-between items-center pt-1">
                    <div className="skeleton h-5 w-20 rounded-full bg-slate-100" />
                    <div className="skeleton h-7 w-16 rounded-full bg-slate-100" />
                </div>
            </div>
        </div>
    )
}

export function ShopSkeletonGrid({ count = 8 }: { count?: number }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <ProductCardSkeleton key={i} />
            ))}
        </div>
    )
}
