"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { formatRsCompact } from "@/lib/currency"

const CATEGORY_COLORS: Record<string, { badge: string; gradient: string }> = {
    NEWBORN: { badge: "bg-rose-50 text-rose-600 border-rose-100", gradient: "from-rose-50 via-pink-50 to-fuchsia-50" },
    BOYS: { badge: "bg-sky-50 text-sky-600 border-sky-100", gradient: "from-sky-50 via-blue-50 to-indigo-50" },
    GIRLS: { badge: "bg-pink-50 text-pink-600 border-pink-100", gradient: "from-pink-50 via-rose-50 to-fuchsia-50" },
    MATERNITY: { badge: "bg-violet-50 text-violet-600 border-violet-100", gradient: "from-violet-50 via-purple-50 to-fuchsia-50" },
}

const CATEGORY_EMOJI: Record<string, string> = {
    NEWBORN: "👶", BOYS: "🧒", GIRLS: "👧", MATERNITY: "🤰"
}

type ProductCardProps = {
    id: string
    title: string
    basePrice: number
    category: string
    totalStock: number
}

export default function ProductCard({ id, title, basePrice, category, totalStock }: ProductCardProps) {
    const isOutOfStock = totalStock === 0
    const colors = CATEGORY_COLORS[category] ?? { badge: "bg-slate-100 text-slate-500 border-slate-100", gradient: "from-slate-50 to-slate-100" }

    return (
        <motion.div
            whileHover={{ y: -4, transition: { duration: 0.2, ease: "easeOut" } }}
            whileTap={{ scale: 0.98 }}
        >
            <Link
                href={`/products/${id}`}
                className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded-[2rem]"
                aria-label={`View ${title} — RS ${basePrice.toFixed(2)}`}
            >
                <article className="bg-white rounded-[2rem] overflow-hidden border border-slate-100/60 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-secondary/40 transition-all duration-300 ease-out h-full flex flex-col isolate">

                    {/* Image Area */}
                    <div className={`relative aspect-[4/5] sm:aspect-square bg-gradient-to-br ${colors.gradient} flex items-center justify-center overflow-hidden`}>
                        <motion.div
                            className="text-6xl select-none"
                            whileHover={{ scale: 1.12, rotate: 3 }}
                            transition={{ type: "spring", stiffness: 300, damping: 15 }}
                        >
                            {CATEGORY_EMOJI[category] ?? "🍼"}
                        </motion.div>

                        {isOutOfStock && (
                            <div className="absolute inset-0 bg-white/75 backdrop-blur-sm flex items-center justify-center">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest px-3 py-1.5 bg-white rounded-full border border-slate-200 shadow-sm">
                                    Out of Stock
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-6 sm:p-7 flex flex-col flex-1 bg-white">
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <h3 className="font-semibold text-slate-800 leading-snug line-clamp-2 text-[15px] sm:text-base flex-1 group-hover:text-primary transition-colors">
                                {title}
                            </h3>
                            <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${colors.badge} touch-auto`}>
                                {category.charAt(0) + category.slice(1).toLowerCase()}
                            </span>
                        </div>

                        <div className="flex items-center justify-between mt-auto pt-3">
                            <p className="text-base font-bold text-[--color-text-primary]">
                                {formatRsCompact(basePrice)}
                            </p>
                            <div className="text-xs text-primary-foreground font-semibold bg-secondary px-3 py-1.5 rounded-full border border-border group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-200 touch-auto">
                                View →
                            </div>
                        </div>
                    </div>
                </article>
            </Link>
        </motion.div>
    )
}
