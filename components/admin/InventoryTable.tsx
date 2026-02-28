"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, Edit, Image as ImageIcon } from "lucide-react"
import Link from "next/link"

type Variant = {
    id: string
    sku: string
    size: string
    color: string
    stockCount: number
    lowStockThreshold: number
}

type Product = {
    id: string
    title: string
    category: string
    basePrice: number
    cogs: number
    variants: Variant[]
}

export default function InventoryTable({ products }: { products: Product[] }) {
    const [searchTerm, setSearchTerm] = useState("")

    const filteredProducts = products.filter((p) => {
        const searchLower = searchTerm.toLowerCase()
        const matchesTitle = p.title.toLowerCase().includes(searchLower)
        const matchesSku = p.variants.some(v => v.sku.toLowerCase().includes(searchLower))
        return matchesTitle || matchesSku
    })

    const getStockStatus = (variants: Variant[]) => {
        const totalStock = variants.reduce((sum, v) => sum + v.stockCount, 0)

        if (totalStock === 0) {
            return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">Out of Stock</span>
        }

        const isLowStock = variants.some(v => v.stockCount <= v.lowStockThreshold)
        if (isLowStock) {
            return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">Low Stock</span>
        }

        return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">In Stock</span>
    }

    const getProfitMargin = (price: number, cogs: number) => {
        if (price <= 0) return 0
        return (((price - cogs) / price) * 100).toFixed(1)
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
        >
            {/* Table Header & Search */}
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-slate-800 tracking-tight">Catalog Overview</h2>
                    <p className="text-sm text-slate-500 mt-1">Manage and monitor all your product variants.</p>
                </div>

                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by title or SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                    />
                </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-medium">
                            <th className="px-6 py-4">Product</th>
                            <th className="px-6 py-4">Total Stock</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Margin</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredProducts.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                    No products found matching your search.
                                </td>
                            </tr>
                        ) : (
                            filteredProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 text-slate-400">
                                                <ImageIcon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-800">{product.title}</div>
                                                <div className="text-xs text-slate-500 mt-0.5">{product.category} • {product.variants.length} Variant(s)</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-slate-700 font-medium">
                                            {product.variants.reduce((sum, v) => sum + v.stockCount, 0)} units
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStockStatus(product.variants)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-slate-800 font-medium">${product.basePrice.toFixed(2)}</span>
                                            <span className="text-xs text-teal-600 mt-0.5">{getProfitMargin(product.basePrice, product.cogs)}% margin</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={`/admin/inventory/${product.id}`}
                                            className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                            title="Edit Product"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </motion.div>
    )
}
