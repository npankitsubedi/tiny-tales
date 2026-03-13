"use client"

import Link from "next/link"
import { X, ExternalLink, MapPin, Phone, User, Calendar, MessageCircle, FileText } from "lucide-react"
import { useEffect } from "react"
import { format } from "date-fns"
import { formatRs } from "@/lib/currency"
import toast from "react-hot-toast"

type ExpandedOrderItem = {
    id: string
    quantity: number
    priceAtPurchase: number
    variant: {
        size: string
        color: string
        sku: string
        product: {
            title: string
        }
    }
}

type ExpandedOrder = {
    id: string
    customerName: string | null
    contactPhone: string | null
    shippingAddress: string | null
    isInternational: boolean
    createdAt: string
    status: string
    totalAmount: number
    taxAmount: number
    orderItems: ExpandedOrderItem[]
    invoice: { id?: string; invoiceNumber: string } | null
}

interface OrderDetailModalProps {
    order: ExpandedOrder | null
    isOpen: boolean
    onClose: () => void
}

export default function OrderDetailModal({ order, isOpen, onClose }: OrderDetailModalProps) {
    // Lock body scroll when modal is active
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = "unset"
        }
        return () => { document.body.style.overflow = "unset" }
    }, [isOpen])

    if (!isOpen || !order) return null

    const invoiceHref = order.invoice?.id ? `/admin/sales/invoice/${order.invoice.id}` : null

    // WhatsApp logic dynamically formatted
    const handleWhatsApp = () => {
        if (!order.contactPhone) {
            alert("No contact phone provided for this order.")
            return
        }

        const itemsList = order.orderItems.map(item =>
            `${item.quantity}x ${item.variant.product.title} (${item.variant.size})`
        ).join(", ")

        const message = `Hi ${order.customerName || "there"}, this is Tiny Tales regarding your Order #${order.id.slice(-6).toUpperCase()}. We've received your international request for [${itemsList}]. Let's finalize shipping!`

        // Remove spaces/special characters
        const cleanPhone = order.contactPhone.replace(/\D/g, "")
        const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`

        window.open(waUrl, '_blank')
    }

    return (
        <div className="fixed inset-0 z-50 flex justify-end">

            {/* Backdrop mapping explicitly */}
            <div
                className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Slide-over panel */}
            <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">

                {/* Header Section */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                            Order #{order.id.slice(-8).toUpperCase()}
                            {order.isInternational && (
                                <span className="text-[10px] font-bold tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded uppercase">
                                    International
                                </span>
                            )}
                        </h2>
                        <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Content Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* Customer CRM Box */}
                    <section className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                        <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-400" /> Customer Details
                        </h3>

                        <div className="space-y-3 relative">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold shrink-0">
                                    {order.customerName ? order.customerName.charAt(0).toUpperCase() : "?"}
                                </div>
                                <div>
                                    <p className="font-medium text-slate-800">{order.customerName || "Guest User"}</p>
                                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5 cursor-pointer hover:text-slate-800 transition-colors">
                                        <Phone className="w-3.5 h-3.5" />
                                        {order.contactPhone || "No Phone Provided"}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-200/60">
                                <p className="text-sm text-slate-600 flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                    <span className="leading-relaxed">
                                        {order.shippingAddress || "No Shipping Address logic mapped"}
                                    </span>
                                </p>
                            </div>

                            {/* WhatsApp Prompt rendering absolutely matching aesthetic bounds */}
                            {order.isInternational && (
                                <button
                                    type="button"
                                    onClick={handleWhatsApp}
                                    className="w-full mt-4 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-medium py-2.5 rounded-xl transition-all shadow-sm shadow-[#25D366]/20"
                                >
                                    <MessageCircle className="w-4 h-4" /> Message on WhatsApp
                                </button>
                            )}
                        </div>
                    </section>

                    {/* Order Line Items */}
                    <section>
                        <h3 className="text-sm font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Purchased Items</h3>
                        <div className="space-y-4">
                            {order.orderItems.map((item) => (
                                <div key={item.id} className="flex items-center justify-between group">
                                    <div className="flex items-start gap-3">
                                        <div className="w-12 h-12 bg-slate-100 rounded-lg shrink-0 border border-slate-200/60 overflow-hidden flex items-center justify-center">
                                            <span className="text-[10px] font-mono text-slate-400">IMG</span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-800 text-sm leading-tight group-hover:text-[#2D5068] transition-colors cursor-pointer">
                                                {item.variant.product.title}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {item.variant.color} • {item.variant.size}
                                                <span className="mx-1 text-slate-300">|</span>
                                                SKU: <span className="font-mono">{item.variant.sku}</span>
                                            </p>
                                        </div>
                                    </div>
                                        <div className="text-right shrink-0">
                                        <p className="font-medium text-slate-800 text-sm">
                                            {formatRs(item.priceAtPurchase)}
                                        </p>
                                        <p className="text-xs font-bold text-slate-400 mt-0.5 bg-slate-100 inline-block px-1.5 rounded">
                                            x{item.quantity}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Financial Receipt Summary */}
                    <section className="bg-slate-800 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
                        <div className="absolute -right-6 -top-6 text-slate-700/50 scale-150 rotate-12">
                            <FileText className="w-24 h-24" />
                        </div>

                        <div className="relative z-10 space-y-3 text-sm">
                            {order.invoice && (
                                <div className="flex justify-between items-center text-slate-300 border-b border-slate-700 pb-3 mb-3">
                                    <span>Invoice Generated</span>
                                    <span className="font-mono text-xs">{order.invoice.invoiceNumber}</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center text-slate-300">
                                <span>Subtotal</span>
                                <span className="font-medium">{formatRs(order.totalAmount - order.taxAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-400">
                                <span>Nepali VAT (13%)</span>
                                <span className="font-medium">{formatRs(order.taxAmount)}</span>
                            </div>

                            <div className="pt-3 border-t border-slate-700 flex justify-between items-center mt-2">
                                <span className="font-medium text-slate-100">Total Charged</span>
                                <span className="text-xl font-bold text-emerald-400">{formatRs(order.totalAmount)}</span>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Footer Action Links */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full uppercase tracking-wider bg-slate-200 text-slate-700`}>
                        {order.status}
                    </span>
                    {invoiceHref ? (
                        <Link
                            href={invoiceHref}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700 px-4 py-2 hover:bg-blue-50 active:scale-95 rounded-xl transition-all duration-200 flex items-center gap-1.5"
                        >
                            Download PDF <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                    ) : (
                        <button
                            type="button"
                            onClick={() => toast("Invoice PDF will be available in the next update.")}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700 px-4 py-2 hover:bg-blue-50 active:scale-95 rounded-xl transition-all duration-200 flex items-center gap-1.5"
                        >
                            Download PDF <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

            </div>
        </div>
    )
}
