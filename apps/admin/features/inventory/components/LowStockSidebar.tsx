"use client"

import { useState, useTransition } from "react"
import { motion } from "framer-motion"
import { AlertCircle, PackagePlus } from "lucide-react"
import { updateStock } from '@/features/inventory/actions/inventory'
import toast from "react-hot-toast"
import LoadingButton from "@/components/ui/LoadingButton"

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
    const [pendingVariantId, setPendingVariantId] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const handleQuickRestock = (variantId: string) => {
        const qty = parseInt(newStock)
        if (isNaN(qty) || qty < 0) {
            toast.error("Please enter a valid positive number")
            return
        }

        setPendingVariantId(variantId)
        startTransition(async () => {
            try {
                const res = await updateStock(variantId, qty)
                if (res.success) {
                    toast.success("Stock updated successfully!")
                    setEditingId(null)
                    setNewStock("")
                } else {
                    toast.error(res.error || "Failed to update stock")
                }
            } catch {
                toast.error("An unexpected error occurred")
            } finally {
                setPendingVariantId(null)
            }
        })
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="admin-surface rounded-[1.75rem] p-5"
        >
            <div className="flex items-center gap-2 mb-5">
                <div className="p-2 bg-[#D9E9F2] text-[#2D5068] rounded-lg">
                    <AlertCircle className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-[#1E293B]">Critical Alerts</h3>
            </div>

            {variants.length === 0 ? (
                <div className="text-center py-6 text-[#2D5068]/70 text-sm">
                    All products are optimally stocked!
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="admin-label text-[#2D5068] mb-2">
                        {variants.length} Action Needed
                    </p>
                    <div className="max-h-[600px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                        {variants.map((v) => {
                            const isSaving = isPending && pendingVariantId === v.id

                            return (
                                <div key={v.id} className="bg-white rounded-[1.35rem] p-4 border border-slate-100 shadow-sm shadow-slate-950/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-medium text-slate-800 text-sm truncate w-32 sm:w-40">{v.product.title}</h4>
                                        <span className="text-xs text-slate-500">{v.sku} • {v.color} • {v.size}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-bold ${v.stockCount === 0 ? 'bg-red-100 text-red-700' : 'bg-[#D9E9F2] text-[#2D5068]'}`}>
                                            {v.stockCount} left
                                        </span>
                                        <div className="text-[10px] text-slate-400 mt-0.5 tabular-nums">Threshold: {v.lowStockThreshold}</div>
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
                                            disabled={isSaving}
                                            className="w-full text-sm rounded-lg border-slate-200 p-1.5 focus:ring-2 focus:ring-[#C8D9E6]/20 focus:border-[#A8BDD0] outline-none border"
                                        />
                                        <LoadingButton
                                            isLoading={isSaving}
                                            onClick={() => handleQuickRestock(v.id)}
                                            className="bg-primary hover:opacity-90 text-primary-foreground p-1.5 rounded-lg transition-opacity flex items-center justify-center"
                                        >
                                            Save
                                        </LoadingButton>
                                        <LoadingButton
                                            onClick={() => setEditingId(null)}
                                            disabled={isSaving}
                                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-1.5 rounded-lg transition-colors text-xs font-medium px-3"
                                        >
                                            Cancel
                                        </LoadingButton>
                                    </div>
                                ) : (
                                    <LoadingButton
                                        onClick={() => {
                                            setEditingId(v.id)
                                            setNewStock(v.stockCount.toString())
                                        }}
                                        disabled={isPending}
                                        className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-medium rounded-lg transition-colors border border-secondary"
                                    >
                                        <PackagePlus className="h-3.5 w-3.5" /> Quick Restock
                                    </LoadingButton>
                                )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </motion.div>
    )
}
