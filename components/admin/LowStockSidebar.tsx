"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { AlertCircle, PackagePlus, Loader2 } from "lucide-react"
import { updateStock } from "@/app/actions/inventory"
import toast from "react-hot-toast"

type LowStockVariant = {
    id: string
    sku: string
    size: string
    color: string
    stockCount: number
    lowStockThreshold: number
    product: {
        title: string
    }
}

export default function LowStockSidebar({ variants }: { variants: LowStockVariant[] }) {
    const [editingId, setEditingId] = useState<string | null>(null)
    const [newStock, setNewStock] = useState<string>("")
    const [isUpdating, setIsUpdating] = useState(false)

    const handleQuickRestock = async (variantId: string) => {
        const qty = parseInt(newStock)
        if (isNaN(qty) || qty < 0) {
            toast.error("Please enter a valid positive number")
            return
        }

        setIsUpdating(true)
        try {
            const res = await updateStock(variantId, qty)
            if (res.success) {
                toast.success("Stock updated successfully!")
                setEditingId(null)
                setNewStock("")
            } else {
                toast.error(res.error || "Failed to update stock")
            }
        } catch (e: any) {
            toast.error("An unexpected error occurred")
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-amber-50/50 rounded-2xl border border-amber-100 p-5 shadow-sm"
        >
            <div className="flex items-center gap-2 mb-5">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                    <AlertCircle className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-amber-900">Critical Alerts</h3>
            </div>

            {variants.length === 0 ? (
                <div className="text-center py-6 text-amber-600/70 text-sm">
                    All products are optimally stocked!
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-2">
                        {variants.length} Action Needed
                    </p>
                    <div className="max-h-[600px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                        {variants.map((v) => (
                            <div key={v.id} className="bg-white rounded-xl p-4 border border-amber-100 shadow-sm transition-all hover:shadow-md">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-medium text-slate-800 text-sm truncate w-32 sm:w-40">{v.product.title}</h4>
                                        <span className="text-xs text-slate-500">{v.sku} • {v.color} • {v.size}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-bold ${v.stockCount === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {v.stockCount} left
                                        </span>
                                        <div className="text-[10px] text-slate-400 mt-0.5">Threshold: {v.lowStockThreshold}</div>
                                    </div>
                                </div>

                                {editingId === v.id ? (
                                    <div className="mt-3 flex gap-2">
                                        <input
                                            type="number"
                                            min="0"
                                            value={newStock}
                                            onChange={(e) => setNewStock(e.target.value)}
                                            placeholder="New qty"
                                            className="w-full text-sm rounded-lg border-slate-200 p-1.5 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none border"
                                        />
                                        <button
                                            onClick={() => handleQuickRestock(v.id)}
                                            disabled={isUpdating}
                                            className="bg-amber-500 hover:bg-amber-600 text-white p-1.5 rounded-lg transition-colors flex items-center justify-center disabled:opacity-70"
                                        >
                                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-1.5 rounded-lg transition-colors text-xs font-medium px-3"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setEditingId(v.id)
                                            setNewStock(v.stockCount.toString())
                                        }}
                                        className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-medium rounded-lg transition-colors border border-amber-200/50"
                                    >
                                        <PackagePlus className="h-3.5 w-3.5" /> Quick Restock
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    )
}
