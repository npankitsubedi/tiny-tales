import Image from "next/image"
import { formatRs } from "@/lib/currency"
import { Package } from "lucide-react"

type LineItem = {
    id: string
    quantity: number
    priceAtPurchase: number
    variant: {
        size: string
        color: string
        sku: string
        product: {
            title: string
            images: string[]
        }
    }
}

type FinancialData = {
    subtotal: number
    taxAmount: number
    totalAmount: number
    invoiceNumber: string | null
}

interface LineItemsCardProps {
    items: LineItem[]
    financial: FinancialData
}

export default function LineItemsCard({ items, financial }: LineItemsCardProps) {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70">
                <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Package className="w-4 h-4 text-slate-400" />
                    Line Items
                    <span className="ml-auto text-xs font-normal text-slate-400">{items.length} item{items.length !== 1 ? "s" : ""}</span>
                </h2>
            </div>

            <div className="p-6 space-y-4">
                {items.map((item) => {
                    const thumb = item.variant.product.images?.[0] ?? null
                    const lineTotal = item.priceAtPurchase * item.quantity

                    return (
                        <div key={item.id} className="flex items-center gap-4 group">
                            {/* Thumbnail */}
                            <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex-shrink-0 flex items-center justify-center">
                                {thumb ? (
                                    <Image
                                        src={thumb}
                                        alt={item.variant.product.title}
                                        width={56}
                                        height={56}
                                        className="object-cover w-full h-full"
                                    />
                                ) : (
                                    <Package className="w-5 h-5 text-slate-300" />
                                )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-800 text-sm leading-tight truncate group-hover:text-orange-700 transition-colors">
                                    {item.variant.product.title}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {item.variant.color} · {item.variant.size}
                                </p>
                                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                    SKU: {item.variant.sku}
                                </p>
                            </div>

                            {/* Price + Qty */}
                            <div className="text-right flex-shrink-0">
                                <p className="font-bold text-slate-800 text-sm">{formatRs(lineTotal)}</p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {formatRs(item.priceAtPurchase)} × {item.quantity}
                                </p>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Financial Summary */}
            <div className="mx-6 mb-6 border-t border-slate-100 pt-4 space-y-2">
                {financial.invoiceNumber && (
                    <div className="flex justify-between text-xs text-slate-400 font-mono mb-3">
                        <span>Invoice</span>
                        <span>{financial.invoiceNumber}</span>
                    </div>
                )}
                <div className="flex justify-between text-sm text-slate-500">
                    <span>Subtotal</span>
                    <span className="font-medium">{formatRs(financial.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                    <span>VAT (13%)</span>
                    <span className="font-medium">{formatRs(financial.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                    <span>Grand Total</span>
                    <span className="text-orange-700">{formatRs(financial.totalAmount)}</span>
                </div>
            </div>
        </div>
    )
}
