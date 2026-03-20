export const dynamic = 'force-dynamic';
import { db } from "@tinytales/db"
import { OrderStatus } from "@tinytales/db"
import {
    TrendingUp,
    PackageSearch,
    PiggyBank,
    PackageCheck,
    Plus,
    CreditCard,
    ArrowRight,
    Activity
} from "lucide-react"
import Link from "next/link"
import { formatRs } from "@/lib/currency"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import DashboardChart from '@/features/dashboard/components/DashboardChart'
import ActivityFeed, { ActivityItem } from '@/features/dashboard/components/ActivityFeed'
import { getCashFlowData } from '@/features/accounts/actions/accounting'

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
    const { userId, sessionClaims } = await auth()
    const role = (sessionClaims?.metadata as { role?: string })?.role
    if (!userId || role !== "SUPERADMIN") redirect("/")

    const { start, end } = getDateRange()

    const [
        totalIncomeAgg,
        totalExpenseAgg,
        pendingOrderCount,
        inventoryVariants,
        recentOrders,
        recentExpenses,
        rawChartData
    ] = await Promise.all([
        // 1. Gross Revenue
        db.transaction.aggregate({
            where: { type: 'INCOME' },
            _sum: { amount: true }
        }),
        // 2. Gross Expenses (includes COGS + Operations synced via unified Transaction table)
        db.transaction.aggregate({
            where: { type: 'EXPENSE' },
            _sum: { amount: true }
        }),
        // 3. Orders to Fulfill
        db.order.count({ 
            where: { status: { in: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PACKED] } } 
        }),
        // 4. Active Inventory Map definition
        db.productVariant.findMany({
            include: { product: { select: { cogs: true } } }
        }),
        // 5. Recent 5 Orders
        db.order.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
        }),
        // 6. Recent 5 Expenses
        db.expense.findMany({
            take: 5,
            orderBy: { date: "desc" },
            include: { vendor: true }
        }),
        // 7. Last 30 Day Cash Flow
        getCashFlowData()
    ])

    // --- KPI Math Formatting ---
    // Safely mapping Prisma Decimals to Numbers
    const grossRevenue = totalIncomeAgg._sum.amount?.toNumber() ?? 0;
    const grossExpenses = totalExpenseAgg._sum.amount?.toNumber() ?? 0;
    const netProfit = grossRevenue - grossExpenses;
    
    const activeInventoryValue = inventoryVariants.reduce((sum, variant) => {
        const cogs = variant.product.cogs?.toNumber() ?? 0;
        return sum + (variant.stockCount * cogs);
    }, 0);

    // --- Chart Mapping ---
    const chartData = rawChartData.map(d => ({
        date: d.date,
        income: Number(d.income),
        expense: Number(d.expense)
    }));

    // --- Activity Feed Math ---
    const activityItems: ActivityItem[] = [
        ...recentOrders.map(o => ({
            id: `o_${o.id}`,
            type: 'ORDER' as const,
            title: `New Order: ${o.customerName}`,
            amount: o.totalAmount.toNumber(),
            date: o.createdAt.toISOString(),
            description: `Checkout completed successfully`
        })),
        ...recentExpenses.map(e => ({
            id: `e_${e.id}`,
            type: 'EXPENSE' as const,
            title: `Expense Logged: ${e.category}`,
            amount: e.amount.toNumber(),
            date: e.date.toISOString(),
            description: e.vendor?.name ? `Paid to ${e.vendor.name}` : `Store Operations`
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8); // Top 8 combined

    const STAT_CARDS = [
        {
            label: "Gross Revenue",
            value: formatRs(grossRevenue),
            icon: TrendingUp,
            color: "bg-emerald-50 text-emerald-600",
            border: "border-emerald-100",
        },
        {
            label: "Net Profit",
            value: formatRs(netProfit),
            icon: PiggyBank,
            color: "bg-orange-50 text-orange-600 ring-1 ring-orange-100/50",
            border: "border-orange-200",
        },
        {
            label: "Orders to Fulfill",
            value: String(pendingOrderCount),
            icon: PackageCheck,
            color: pendingOrderCount > 5 ? "bg-rose-50 text-rose-600" : "bg-[#EEF4F9] text-[#2D5068]",
            border: pendingOrderCount > 5 ? "border-rose-200" : "border-[#D1D1D1]",
        },
        {
            label: "Active Inventory Value",
            value: formatRs(activeInventoryValue),
            icon: PackageSearch,
            color: "bg-indigo-50 text-indigo-600",
            border: "border-indigo-100",
        },
    ]

    return (
        <div className="min-h-screen p-6 md:p-10 space-y-8">
            <div className="max-w-[1400px] mx-auto space-y-8">
                {/* ── CEO Header & Action Ribbon ── */}
                <div className="admin-glass sticky top-0 z-30 flex flex-col md:flex-row md:items-end justify-between gap-6 rounded-[2rem] border border-white/70 px-6 py-5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.3)]">
                    <div>
                        <p className="admin-label mb-2">Executive Overview</p>
                        <h1 className="text-3xl font-serif text-slate-800 tracking-tight">CEO Cockpit</h1>
                        <p className="text-slate-500 mt-1 text-sm">Enterprise overview of operations and revenue flows.</p>
                    </div>
                    
                    {/* "God Mode" Quick Actions */}
                    <div className="flex flex-wrap items-center gap-3">
                        <Link href="/pos" className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-100 text-slate-700 text-sm font-medium rounded-2xl hover:bg-gray-100 hover:text-orange-600 transition-all duration-200 shadow-sm">
                            <CreditCard className="w-4 h-4" /> POS Sale
                        </Link>
                        <Link href="/accounts/expenses" className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-100 text-slate-700 text-sm font-medium rounded-2xl hover:bg-gray-100 hover:text-orange-600 transition-all duration-200 shadow-sm">
                            <Plus className="w-4 h-4" /> Add Expense
                        </Link>
                        <Link href="/inventory/new" className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-100 text-slate-700 text-sm font-medium rounded-2xl hover:bg-gray-100 hover:text-orange-600 transition-all duration-200 shadow-sm">
                            <PackageCheck className="w-4 h-4" /> Add Product
                        </Link>
                        <Link href="/sales" className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white text-sm font-medium rounded-2xl hover:bg-orange-700 transition-all duration-200 shadow-[0_14px_28px_-18px_rgba(234,88,12,0.95)]">
                            Pending Orders <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>

                {/* ── Top-Level KPI Metric Cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {STAT_CARDS.map(({ label, value, icon: Icon, color, border }) => (
                        <div key={label} className={`relative bg-white rounded-[1.75rem] border ${border} p-6 flex items-center gap-5 shadow-sm shadow-slate-950/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-950/10`}>
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color} shrink-0`}>
                                <Icon className="w-6 h-6" aria-hidden="true" />
                            </div>
                            <div>
                                <p className="admin-label">{label}</p>
                                <p className="admin-figure text-2xl lg:text-3xl font-bold text-slate-800 leading-tight mt-1 tabular-nums">{value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Main Data Grids ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left: Revenue Chart (Spans 2/3) */}
                    <div className="lg:col-span-2 admin-surface rounded-[1.75rem] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                            <div>
                                <h2 className="font-bold text-slate-800 text-lg">Revenue vs Expenses</h2>
                                <p className="text-xs text-slate-500 mt-1">Comparison generated from the last 30 days of Cash Flow ledgers.</p>
                            </div>
                            <span className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                                <Activity className="w-3.5 h-3.5" /> Live Sync
                            </span>
                        </div>
                        <div className="flex-1 p-6 flex flex-col justify-end min-h-[350px]">
                            <DashboardChart data={chartData} />
                        </div>
                    </div>

                    {/* Right: The Pulse (Activity Feed) (Spans 1/3) */}
                    <div className="admin-surface rounded-[1.75rem] overflow-hidden flex flex-col max-h-[500px]">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0 bg-slate-50/50">
                            <div>
                                <h2 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                                    The Pulse
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">Unified systems activity stream</p>
                            </div>
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(234,88,12,0.6)]"></div>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <ActivityFeed items={activityItems} />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
