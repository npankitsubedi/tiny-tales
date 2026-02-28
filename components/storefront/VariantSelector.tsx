"use client"

import { useState } from "react"
import { useCartStore } from "@/store/cartStore"
import toast from "react-hot-toast"

type Variant = {
    id: string
    size: string
    color: string
    stockCount: number
    lowStockThreshold: number
}

interface VariantSelectorProps {
    variants: Variant[]
    productId: string
    productTitle: string
    basePrice: number
}

export default function VariantSelector({ variants, productId, productTitle, basePrice }: VariantSelectorProps) {
    const addItem = useCartStore(state => state.addItem)
    const [selectedSize, setSelectedSize] = useState<string | null>(null)
    const [selectedColor, setSelectedColor] = useState<string | null>(null)

    const sizes = [...new Set(variants.map(v => v.size))]
    const colors = [...new Set(variants.map(v => v.color))]

    const selectedVariant = variants.find(
        v => v.size === selectedSize && v.color === selectedColor
    )

    const getStockBadge = () => {
        if (!selectedVariant) return null
        const { stockCount, lowStockThreshold } = selectedVariant
        if (stockCount === 0) return (
            <span className="text-sm font-semibold text-red-600 bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
                ✗ Out of Stock
            </span>
        )
        if (stockCount <= lowStockThreshold) return (
            <span className="text-sm font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
                ⚡ Only {stockCount} left!
            </span>
        )
        return (
            <span className="text-sm font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                ✓ In Stock
            </span>
        )
    }

    const handleAddToCart = () => {
        if (!selectedVariant) return
        if (selectedVariant.stockCount === 0) return

        addItem({
            variantId: selectedVariant.id,
            productId,
            title: productTitle,
            price: basePrice,
            quantity: 1,
            size: selectedVariant.size,
            color: selectedVariant.color,
        })
        toast.success(`${productTitle} added to cart! 🛍️`)
    }

    return (
        <div className="space-y-6">
            {/* Size Selector */}
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Size <span className="text-slate-400 font-normal">{selectedSize ? `— ${selectedSize}` : ""}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                    {sizes.map(size => (
                        <button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={`px-4 py-2 text-sm font-medium rounded-full border-2 transition-all ${selectedSize === size
                                    ? "border-slate-800 bg-slate-800 text-white"
                                    : "border-slate-200 text-slate-700 hover:border-slate-400"
                                }`}
                        >
                            {size}
                        </button>
                    ))}
                </div>
            </div>

            {/* Color Selector */}
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Color <span className="text-slate-400 font-normal">{selectedColor ? `— ${selectedColor}` : ""}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                    {colors.map(color => (
                        <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`px-4 py-2 text-sm font-medium rounded-full border-2 transition-all ${selectedColor === color
                                    ? "border-amber-500 bg-amber-500 text-white"
                                    : "border-slate-200 text-slate-700 hover:border-amber-300"
                                }`}
                        >
                            {color}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stock Indicator */}
            <div className="min-h-[36px] flex items-center">
                {getStockBadge()}
                {!selectedVariant && selectedSize && selectedColor && (
                    <span className="text-sm text-slate-400 italic">This combination is not available.</span>
                )}
            </div>

            {/* Add to Cart */}
            <button
                onClick={handleAddToCart}
                disabled={!selectedVariant || selectedVariant.stockCount === 0}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl transition-all shadow-lg shadow-amber-100 hover:shadow-amber-200 text-base"
            >
                {!selectedVariant
                    ? "Select options to continue"
                    : selectedVariant.stockCount === 0
                        ? "Out of Stock"
                        : "Add to Cart"}
            </button>
        </div>
    )
}
