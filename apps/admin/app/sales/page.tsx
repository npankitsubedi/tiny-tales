import { db } from "@tinytales/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { updateOrderStatus, capturePayment } from '@/features/sales/actions/sales'
import { OrderStatus, InvoiceStatus } from "@tinytales/db"
import Link from "next/link"
import { PackageSearch, Users, ShoppingCart, ClockIcon } from "lucide-react"
import { Suspense } from "react"
import SearchFilterBar from '@/features/sales/components/SearchFilterBar'
import OrdersDataGrid from '@/features/sales/components/OrdersDataGrid'

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
    return await updateOrderStatus(orderId, newStatus)
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

    // Grid-compatible slice (only fields needed by data grid)
    const gridOrders = ordersRaw.map(o => ({
        id: o.id,
        invoiceNumber: o.invoice?.invoiceNumber ?? null,
        customerName: o.customerName,
        contactPhone: o.contactPhone,
        status: o.status,
        totalAmount: o.totalAmount.toNumber(),
        paymentMethod: o.paymentMethod,
        createdAt: o.createdAt.toISOString(),
        invoice: o.invoice ? { id: o.invoice.id, status: o.invoice.status } : null
    }))

    return (
        <div className="min-h-screen text-slate-800 font-sans">
            <div className="max-w-[1600px] mx-auto p-6 md:p-8 space-y-6">

                {/* ── Header ─────────────────────────────────────────────── */}
                <header className="admin-glass sticky top-0 z-30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 rounded-[1.75rem] shadow-[0_18px_36px_-28px_rgba(15,23,42,0.28)] border border-white/70">
                    <div>
                        <p className="admin-label mb-2">Order Operations</p>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                            <PackageSearch className="w-7 h-7 text-orange-600" />
                            Order Command Center
                        </h1>
                        <p className="text-slate-500 mt-1 text-sm">
                            Complete order lifecycle — from placement to delivery.
                        </p>
                    </div>
                    <Link
                        href="/sales/customers"
                        className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white px-5 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm shadow-sm"
                    >
                        <Users className="w-4 h-4" /> CRM / Customers
                    </Link>
                </header>

                {/* ── Stat Cards ──────────────────────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="admin-surface rounded-[1.6rem] p-5 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                            <ShoppingCart className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="admin-figure text-2xl font-bold text-slate-900 tabular-nums">{ordersRaw.length}</p>
                            <p className="admin-label mt-1">Matching Orders</p>
                        </div>
                    </div>
                    <div className="admin-surface rounded-[1.6rem] p-5 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                            <ClockIcon className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="admin-figure text-2xl font-bold text-slate-900 tabular-nums">{totalActive}</p>
                            <p className="admin-label mt-1">Active Orders</p>
                        </div>
                    </div>
                    <div className="admin-surface rounded-[1.6rem] p-5 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                            <span className="text-rose-600 font-bold text-lg">Rs.</span>
                        </div>
                        <div>
                            <p className="admin-figure text-2xl font-bold text-rose-700 tabular-nums">{pendingPayments}</p>
                            <p className="admin-label mt-1">Pending Payments</p>
                        </div>
                    </div>
                </div>

                {/* ── Data Grid Card ──────────────────────────────────────── */}
                <div className="admin-surface rounded-[1.75rem] overflow-hidden">
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

            </div>
        </div>
    )
}
