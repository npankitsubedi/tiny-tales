import { db } from "@/lib/db"
import { OrderStatus } from "@prisma/client"
import {
    TrendingUp,
    Clock,
    Users,
    AlertTriangle,
    FileText,
} from "lucide-react"
import Link from "next/link"
import { formatRs } from "@/lib/currency"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata = {
    title: "Dashboard | Tiny Tales Admin",
    description: "At-a-glance business health overview.",
}

function getDateRange() {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    return { start, end }
}

const STATUS_COLORS: Record<string, string> = {
    PENDING: "bg-[#D9E9F2] text-[#2D5068]",
    PROCESSING: "bg-blue-100 text-blue-700",
    SHIPPED: "bg-indigo-100 text-indigo-700",
    DELIVERED: "bg-green-100 text-green-700",
    CANCELED: "bg-red-100 text-red-700",
    RETURNED: "bg-slate-100 text-slate-600",
}

export default async function DashboardPage() {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== "SUPERADMIN") redirect("/")

    const { start, end } = getDateRange()

    // Parallel data fetches
    const [
        todaysOrders,
        pendingCount,
        activeCustomers,
        lowStockVariants,
        recentOrders,
    ] = await Promise.all([
        db.order.aggregate({
            where: { createdAt: { gte: start, lte: end } },
            _sum: { totalAmount: true },
        }),
        db.order.count({ where: { status: OrderStatus.PENDING } }),
        db.order.groupBy({
            by: ["userId"],
            where: { userId: { not: null } },
            _count: true,
        }),
        db.productVariant.findMany({
            where: {},
            include: { product: { select: { title: true } } },
            orderBy: { stockCount: "asc" },
        }),
        db.order.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            include: { invoice: { select: { id: true } } },
        }),
    ])

    const todaySalesAmount = todaysOrders._sum.totalAmount?.toNumber() ?? 0
    const activeCustomerCount = activeCustomers.length
    const lowStockItems = lowStockVariants.filter(v => v.stockCount <= v.lowStockThreshold)

    const STAT_CARDS = [
        {
            label: "Today's Sales",
            value: formatRs(todaySalesAmount),
            icon: TrendingUp,
            color: "bg-[#EEF4F9] text-[#2D5068]",
            border: "border-[#D1D1D1]",
        },
        {
            label: "Pending Orders",
            value: String(pendingCount),
            icon: Clock,
            color: "bg-[#EEF4F9] text-[#2D5068]",
            border: "border-[#D1D1D1]",
        },
        {
            label: "Active Customers",
            value: String(activeCustomerCount),
            icon: Users,
            color: "bg-indigo-50 text-indigo-600",
            border: "border-indigo-100",
        },
        {
            label: "Low Stock Alerts",
            value: String(lowStockItems.length),
            icon: AlertTriangle,
            color: "bg-rose-50 text-rose-600",
            border: "border-rose-100",
        },
    ]

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10 space-y-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-serif text-slate-800 tracking-tight">Command Center</h1>
                    <p className="text-slate-500 mt-1 text-sm">Your business health at a glance — {new Date().toLocaleDateString("en-NP", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                </div>

                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {STAT_CARDS.map(({ label, value, icon: Icon, color, border }) => (
                        <div key={label} className={`bg-white rounded-2xl border ${border} p-5 flex items-center gap-4 shadow-sm`}>
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color} shrink-0`}>
                                <Icon className="w-5 h-5" aria-hidden="true" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{label}</p>
                                <p className="text-2xl font-bold text-slate-800 leading-tight">{value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Two column grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Recent Orders */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h2 className="font-semibold text-slate-800">Recent Orders</h2>
                            <Link href="/admin/sales" className="text-xs text-[#2D5068] font-semibold hover:text-[#1E293B]">View All →</Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="text-left px-6 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">Customer</th>
                                        <th className="text-left px-4 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">Amount</th>
                                        <th className="text-left px-4 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">Status</th>
                                        <th className="text-left px-4 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">Invoice</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentOrders.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="text-center py-10 text-slate-400 text-sm">No orders yet</td>
                                        </tr>
                                    )}
                                    {recentOrders.map(order => (
                                        <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                                            <td className="px-6 py-3.5">
                                                <p className="font-medium text-slate-800 truncate max-w-[140px]">{order.customerName}</p>
                                                <p className="text-xs text-slate-400">{order.contactPhone}</p>
                                            </td>
                                            <td className="px-4 py-3.5 font-semibold text-slate-700">{formatRs(order.totalAmount.toNumber())}</td>
                                            <td className="px-4 py-3.5">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${STATUS_COLORS[order.status] ?? "bg-slate-100 text-slate-600"}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                {order.invoice ? (
                                                    <Link
                                                        href={`/admin/sales/invoice/${order.invoice.id}`}
                                                        className="inline-flex items-center gap-1.5 text-xs text-[#2D5068] font-semibold hover:text-[#1E293B]"
                                                        target="_blank"
                                                    >
                                                        <FileText className="w-3.5 h-3.5" /> Print
                                                    </Link>
                                                ) : (
                                                    <span className="text-xs text-slate-300">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Low Stock Alerts Panel */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-rose-500" aria-hidden />
                                Low Stock
                            </h2>
                            <Link href="/admin/inventory" className="text-xs text-[#2D5068] font-semibold hover:text-[#1E293B]">Manage →</Link>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {lowStockItems.length === 0 && (
                                <p className="text-sm text-slate-400 text-center py-10">All products well-stocked 🎉</p>
                            )}
                            {lowStockItems.slice(0, 6).map(variant => (
                                <div key={variant.id} className="flex items-center justify-between px-5 py-3.5">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-slate-800 truncate">{variant.product.title}</p>
                                        <p className="text-xs text-slate-400">{variant.size} · {variant.color}</p>
                                    </div>
                                    <span className={`ml-3 text-sm font-bold shrink-0 ${variant.stockCount === 0 ? "text-red-600" : "text-[#2D5068]"}`}>
                                        {variant.stockCount} left
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
