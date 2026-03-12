import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { updateOrderStatus, capturePayment } from "@/app/actions/sales"
import { OrderStatus, InvoiceStatus } from "@prisma/client"
import Link from "next/link"
import { PackageSearch, Users, ShoppingCart, ClockIcon } from "lucide-react"
import { Suspense } from "react"
import SearchFilterBar from "@/components/admin/oms/SearchFilterBar"
import OrdersDataGrid from "@/components/admin/oms/OrdersDataGrid"
import SalesCommandCenterClient from "@/components/admin/SalesCommandCenterClient"

export const metadata = {
    title: "Order Command Center | Tiny Tales Admin",
    description: "Enterprise-grade order management dashboard."
}

async function verifySalesAccess() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.role) redirect("/login")
    if (session.user.role !== "SUPERADMIN") redirect("/unauthorized")
}

// ── Inline Server Actions ──────────────────────────────────────────────────
async function handleStatusUpdate(orderId: string, newStatus: OrderStatus) {
    "use server"
    const result = await updateOrderStatus(orderId, newStatus)
    return result.success
}

async function handleCapturePayment(orderId: string, method: string) {
    "use server"
    return await capturePayment(orderId, method)
}

interface SalesPageProps {
    searchParams: Promise<{ q?: string; status?: string; payment?: string }>
}

export default async function SalesDashboardPage({ searchParams }: SalesPageProps) {
    await verifySalesAccess()

    const { q, status, payment } = await searchParams

    // Build Prisma WHERE clause from filters
    const where: {
        OR?: Array<Record<string, unknown>>
        status?: OrderStatus
        invoice?: {
            invoiceNumber?: { contains: string; mode: "insensitive" }
            status?: InvoiceStatus | { not: InvoiceStatus }
        }
    } = {}

    if (q) {
        where.OR = [
            { customerName: { contains: q, mode: "insensitive" } },
            { contactPhone: { contains: q, mode: "insensitive" } },
            { invoice: { invoiceNumber: { contains: q, mode: "insensitive" } } }
        ]
    }

    if (status && Object.values(OrderStatus).includes(status as OrderStatus)) {
        where.status = status as OrderStatus
    }

    if (payment === "PAID") {
        where.invoice = { ...where.invoice, status: InvoiceStatus.PAID }
    } else if (payment === "UNPAID") {
        where.invoice = { ...where.invoice, status: { not: InvoiceStatus.PAID } }
    }

    // Fetch filtered orders
    const ordersRaw = await db.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
            orderItems: {
                include: { variant: { include: { product: true } } }
            },
            invoice: { select: { id: true, invoiceNumber: true, status: true } }
        }
    })

    // Aggregate stats (always on full dataset)
    const [totalActive, pendingPayments] = await Promise.all([
        db.order.count({ where: { status: { notIn: ["CANCELED", "RETURNED", "DELIVERED"] } } }),
        db.order.count({ where: { invoice: { status: "UNPAID" } } })
    ])

    const serializedOrders = ordersRaw.map(o => ({
        id: o.id,
        customerName: o.customerName,
        contactPhone: o.contactPhone,
        shippingAddress: o.shippingAddress,
        deliveryCity: o.deliveryCity,
        isInternational: o.isInternational,
        status: o.status,
        paymentMethod: o.paymentMethod,
        adminNotes: o.adminNotes,
        totalAmount: o.totalAmount.toNumber(),
        taxAmount: o.taxAmount.toNumber(),
        createdAt: o.createdAt.toISOString(),
        orderItems: o.orderItems.map(item => ({
            id: item.id,
            quantity: item.quantity,
            priceAtPurchase: item.priceAtPurchase.toNumber(),
            variant: {
                id: item.variant.id,
                size: item.variant.size,
                color: item.variant.color,
                sku: item.variant.sku,
                stockCount: item.variant.stockCount,
                lowStockThreshold: item.variant.lowStockThreshold,
                product: {
                    id: item.variant.product.id,
                    title: item.variant.product.title,
                    category: item.variant.product.category,
                    images: item.variant.product.images,
                    isNonReturnable: item.variant.product.isNonReturnable,
                    cogs: item.variant.product.cogs.toNumber(),
                    basePrice: item.variant.product.basePrice.toNumber(),
                }
            }
        })),
        invoice: o.invoice ? {
            id: o.invoice.id,
            invoiceNumber: o.invoice.invoiceNumber,
            status: o.invoice.status as "PAID" | "UNPAID" | "OVERDUE" | "CANCELLED",
        } : null
    }))

    // Grid-compatible slice (only fields needed by data grid)
    const gridOrders = serializedOrders.map(o => ({
        id: o.id,
        invoiceNumber: o.invoice?.invoiceNumber ?? null,
        customerName: o.customerName,
        contactPhone: o.contactPhone,
        status: o.status,
        totalAmount: o.totalAmount,
        paymentMethod: o.paymentMethod,
        createdAt: o.createdAt.toISOString(),
        invoice: o.invoice ? { id: o.invoice.id, status: o.invoice.status } : null
    }))

    return (
        <div className="min-h-screen bg-gray-50 text-slate-800 font-sans">
            <div className="max-w-[1600px] mx-auto p-6 md:p-8 space-y-6">

                {/* ── Header ─────────────────────────────────────────────── */}
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                            <PackageSearch className="w-7 h-7 text-orange-600" />
                            Order Command Center
                        </h1>
                        <p className="text-slate-500 mt-1 text-sm">
                            Complete order lifecycle — from placement to delivery.
                        </p>
                    </div>
                    <Link href="/admin/sales/customers">
                        <button className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl transition-colors font-medium text-sm shadow-sm">
                            <Users className="w-4 h-4" /> CRM / Customers
                        </button>
                    </Link>
                </header>

                {/* ── Stat Cards ──────────────────────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                            <ShoppingCart className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{ordersRaw.length}</p>
                            <p className="text-sm text-slate-500">Matching Orders</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                            <ClockIcon className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{totalActive}</p>
                            <p className="text-sm text-slate-500">Active Orders</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                            <span className="text-rose-600 font-bold text-lg">₨</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-rose-700">{pendingPayments}</p>
                            <p className="text-sm text-slate-500">Pending Payments</p>
                        </div>
                    </div>
                </div>

                {/* ── Data Grid Card ──────────────────────────────────────── */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    {/* Search & Filters */}
                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                        <Suspense>
                            <SearchFilterBar />
                        </Suspense>
                    </div>

                    {/* Meta row */}
                    <div className="px-5 py-2.5 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium">
                            {ordersRaw.length} order{ordersRaw.length !== 1 ? "s" : ""}
                            {(q || status || payment) ? " (filtered)" : ""}
                        </span>
                        <span className="text-xs text-slate-400">
                            Click any order to open its detail page →
                        </span>
                    </div>

                    {/* Grid */}
                    <OrdersDataGrid
                        orders={gridOrders}
                        onStatusChange={handleStatusUpdate}
                        onCapturePayment={handleCapturePayment}
                    />
                </div>

                {/* ── Legacy Active Pipeline (preserved) ─────────────────── */}
                <div className="w-full relative">
                    <SalesCommandCenterClient
                        initialOrders={serializedOrders}
                        updateStatusAction={handleStatusUpdate}
                    />
                </div>

            </div>
        </div>
    )
}
