/**
 * Printable Invoice Page — /admin/sales/invoice/[id]
 * Renders a PDF-style A4 invoice for printing.
 */

import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { formatRs } from "@/lib/currency"
import { Heart, Printer } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

export async function generateMetadata({ params }: { params: { id: string } }) {
    const invoice = await db.invoice.findUnique({ where: { id: params.id }, select: { invoiceNumber: true } })
    return { title: invoice ? `Invoice ${invoice.invoiceNumber}` : "Invoice Not Found" }
}

export default async function InvoicePrintPage({ params }: { params: { id: string } }) {
    const invoice = await db.invoice.findUnique({
        where: { id: params.id },
        include: {
            order: {
                include: {
                    orderItems: {
                        include: {
                            variant: {
                                include: { product: { select: { title: true, category: true } } }
                            }
                        }
                    },
                    user: { select: { name: true, email: true } }
                }
            }
        }
    })

    if (!invoice) notFound()

    const { order } = invoice
    const subtotal = Number(invoice.amountDue) - Number(invoice.taxAmount)

    return (
        <div className="min-h-screen bg-slate-100 print:bg-white">
            {/* Print / Back Controls — hidden when printing */}
            <div className="print:hidden flex justify-between items-center px-8 py-4 bg-white border-b sticky top-0 z-10">
                <Link href="/admin/sales" className="text-sm text-slate-500 hover:text-slate-700 font-medium">
                    ← Back to Sales
                </Link>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-slate-700 transition-all"
                >
                    <Printer className="w-4 h-4" /> Print / Save PDF
                </button>
            </div>

            {/* A4 Invoice Body */}
            <div className="max-w-[794px] mx-auto bg-white shadow-xl my-8 print:my-0 print:shadow-none rounded-2xl print:rounded-none overflow-hidden">

                {/* Header Band */}
                <div className="bg-gradient-to-r from-amber-400 to-rose-400 px-10 pt-10 pb-8">
                    <div className="flex justify-between items-start">
                        {/* Brand */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center">
                                <Heart className="w-5 h-5 text-white fill-white" />
                            </div>
                            <div>
                                <p className="font-serif text-2xl text-white font-bold leading-none tracking-tight">
                                    Tiny <span className="text-amber-100">Tales</span>
                                </p>
                                <p className="text-white/75 text-xs mt-0.5">Kathmandu, Nepal · hello@tinytales.com.np</p>
                            </div>
                        </div>
                        {/* Invoice Meta */}
                        <div className="text-right">
                            <p className="text-white/60 text-xs uppercase tracking-widest">Tax Invoice</p>
                            <p className="text-white text-2xl font-bold">{invoice.invoiceNumber}</p>
                            <p className="text-white/75 text-xs mt-1">
                                Issued: {format(invoice.createdAt, "dd MMM yyyy")}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="px-10 py-8 space-y-8">

                    {/* Customer & Order Info */}
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Billed To</p>
                            <p className="font-bold text-slate-800 text-base">{order.customerName || order.user?.name || "Guest Customer"}</p>
                            {order.user?.email && <p className="text-slate-500 text-sm">{order.user.email}</p>}
                            {order.contactPhone && (
                                <p className="text-sm text-slate-500">
                                    📱 WhatsApp: {order.contactPhone}
                                </p>
                            )}
                            {order.shippingAddress && <p className="text-slate-500 text-sm mt-1">{order.shippingAddress}</p>}
                            {order.deliveryCity && <p className="text-slate-500 text-sm">{order.deliveryCity}</p>}
                        </div>
                        <div className="text-right">
                            <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Order Details</p>
                            <p className="text-slate-500 text-sm">Order ID: <span className="font-mono text-slate-700">#{order.id.slice(-8).toUpperCase()}</span></p>
                            <p className="text-slate-500 text-sm">Status: <span className="font-semibold text-slate-700">{order.status}</span></p>
                            <p className="text-slate-500 text-sm">Payment: <span className="font-semibold text-slate-700">{order.paymentMethod}</span></p>
                            {order.babyAgeMonths !== null && order.babyAgeMonths !== undefined && (
                                <p className="text-slate-500 text-sm mt-1">
                                    👶 Baby age: <span className="font-semibold text-slate-700">{order.babyAgeMonths} months</span>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Items Table */}
                    <div>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b-2 border-amber-100">
                                    <th className="text-left pb-3 text-xs uppercase tracking-widest text-slate-400 font-semibold">Item</th>
                                    <th className="text-center pb-3 text-xs uppercase tracking-widest text-slate-400 font-semibold">Qty</th>
                                    <th className="text-right pb-3 text-xs uppercase tracking-widest text-slate-400 font-semibold">Unit Price</th>
                                    <th className="text-right pb-3 text-xs uppercase tracking-widest text-slate-400 font-semibold">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.orderItems.map((item) => (
                                    <tr key={item.id} className="border-b border-slate-50">
                                        <td className="py-3">
                                            <p className="font-semibold text-slate-800">{item.variant.product.title}</p>
                                            <p className="text-slate-400 text-xs">{item.variant.size} · {item.variant.color} · SKU: {item.variant.sku}</p>
                                        </td>
                                        <td className="py-3 text-center text-slate-600">{item.quantity}</td>
                                        <td className="py-3 text-right text-slate-600">{formatRs(Number(item.priceAtPurchase))}</td>
                                        <td className="py-3 text-right font-semibold text-slate-800">
                                            {formatRs(Number(item.priceAtPurchase) * item.quantity)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end">
                        <div className="w-64 space-y-2">
                            <div className="flex justify-between text-sm text-slate-500">
                                <span>Subtotal</span>
                                <span>{formatRs(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-500">
                                <span>VAT (13%)</span>
                                <span>{formatRs(Number(invoice.taxAmount))}</span>
                            </div>
                            <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-800 text-base">
                                <span>Total Due</span>
                                <span className="text-amber-600">{formatRs(Number(invoice.amountDue))}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className={invoice.status === "PAID" ? "text-emerald-600 font-semibold" : "text-rose-500 font-semibold"}>
                                    {invoice.status}
                                </span>
                                {invoice.amountPaid.toNumber() > 0 && (
                                    <span className="text-emerald-600 text-sm">Paid: {formatRs(Number(invoice.amountPaid))}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Thank You Note */}
                    <div className="bg-amber-50 rounded-2xl p-6 text-center border border-amber-100">
                        <p className="font-serif text-lg text-slate-800 mb-1">🎉 Congratulations on your little one!</p>
                        <p className="text-slate-500 text-sm">
                            Thank you for choosing Tiny Tales. Each piece is crafted with love for every precious milestone.
                            We hope your little one loves it! — The Tiny Tales Family
                        </p>
                        <p className="text-xs text-slate-400 mt-3">
                            Questions? WhatsApp us at +977-9800000000 or email hello@tinytales.com.np
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="text-center text-xs text-slate-300 pt-4 border-t border-slate-50">
                        Tiny Tales · Kathmandu, Nepal · PAN: XXXXXXXXX · tinytales.com.np
                    </div>
                </div>
            </div>
        </div>
    )
}
