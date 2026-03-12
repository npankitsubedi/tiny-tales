"use client"

import Link from "next/link"
import { format } from "date-fns"
import { formatRs } from "@/lib/currency"
import StatusStepper from "@/components/admin/oms/StatusStepper"
import LineItemsCard from "@/components/admin/oms/LineItemsCard"
import CustomerProfileCard from "@/components/admin/oms/CustomerProfileCard"
import ShippingLabelCard from "@/components/admin/oms/ShippingLabelCard"
import PaymentLedgerCard from "@/components/admin/oms/PaymentLedgerCard"
import InternalNotesCard from "@/components/admin/oms/InternalNotesCard"
import { ArrowLeft, Printer } from "lucide-react"
import { OrderStatusValue } from "@/lib/domain"

type LineItem = {
    id: string
    quantity: number
    priceAtPurchase: number
    variant: {
        size: string
        color: string
        sku: string
        product: { title: string; images: string[] }
    }
}

type OrderDetailProps = {
    id: string
    invoiceNumber: string | null
    customerName: string | null
    contactPhone: string | null
    shippingAddress: string | null
    deliveryCity: string | null
    isInternational: boolean
    status: OrderStatusValue
    paymentMethod: string
    adminNotes: string | null
    totalAmount: number
    taxAmount: number
    createdAt: string
    orderItems: LineItem[]
    email: string | null
    lifetimeOrders: number
    lifetimeValue: number
    invoice: {
        id: string
        invoiceNumber: string
        status: "PAID" | "UNPAID" | "OVERDUE" | "CANCELLED"
        amountDue: number
        amountPaid: number
    } | null
    onStatusChange: (id: string, status: OrderStatusValue) => Promise<boolean>
    onCapturePayment: (orderId: string, method: string) => Promise<{ success: boolean; error?: string }>
    onSaveNote: (orderId: string, notes: string) => Promise<{ success: boolean; error?: string }>
}

export default function OrderDetailLayout(props: OrderDetailProps) {
    const {
        id, invoiceNumber, customerName, contactPhone, shippingAddress,
        deliveryCity, isInternational, status, paymentMethod, adminNotes,
        totalAmount, taxAmount, createdAt, orderItems, email,
        lifetimeOrders, lifetimeValue, invoice,
        onStatusChange, onCapturePayment, onSaveNote
    } = props

    const subtotal = totalAmount - taxAmount
    const displayId = invoiceNumber ?? `#${id.slice(-8).toUpperCase()}`

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sticky Top Header */}
            <header className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/admin/sales"
                            className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                                {displayId}
                                {isInternational && (
                                    <span className="text-[10px] font-bold tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase">
                                        International
                                    </span>
                                )}
                            </h1>
                            <p className="text-xs text-slate-400 mt-0.5">
                                {format(new Date(createdAt), "MMMM d, yyyy 'at' h:mm a")}
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        {invoice && (
                            <Link
                                href={`/admin/sales/invoice/${invoice.id}`}
                                target="_blank"
                                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-xl transition-all"
                            >
                                <Printer className="w-4 h-4" />
                                Print Invoice
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* 2/3 + 1/3 Grid */}
            <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column — 2/3 */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Status Stepper */}
                        <StatusStepper
                            orderId={id}
                            initialStatus={status}
                            onStatusChange={onStatusChange}
                            onCancel={(orderId) => onStatusChange(orderId, "CANCELED")}
                        />

                        {/* Line Items */}
                        <LineItemsCard
                            items={orderItems}
                            financial={{
                                subtotal,
                                taxAmount,
                                totalAmount,
                                invoiceNumber: invoice?.invoiceNumber ?? null,
                            }}
                        />
                    </div>

                    {/* Right Column — 1/3 */}
                    <div className="space-y-4">
                        <CustomerProfileCard
                            customerName={customerName}
                            contactPhone={contactPhone}
                            email={email}
                            lifetimeOrders={lifetimeOrders}
                            lifetimeValue={lifetimeValue}
                            isInternational={isInternational}
                        />

                        <ShippingLabelCard
                            customerName={customerName}
                            contactPhone={contactPhone}
                            shippingAddress={shippingAddress}
                            deliveryCity={deliveryCity}
                        />

                        <PaymentLedgerCard
                            orderId={id}
                            paymentMethod={paymentMethod}
                            invoiceStatus={invoice?.status ?? "UNPAID"}
                            amountDue={invoice?.amountDue ?? totalAmount}
                            amountPaid={invoice?.amountPaid ?? 0}
                            onCapturePayment={onCapturePayment}
                        />

                        <InternalNotesCard
                            orderId={id}
                            initialNotes={adminNotes}
                            onSave={onSaveNote}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
