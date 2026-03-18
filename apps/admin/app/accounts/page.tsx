import { getDashboardKPIs, getCashFlowData } from '@/features/accounts/actions/accounting';
import { ShoppingCart, TrendingDown, TrendingUp, PiggyBank, ArrowRight } from 'lucide-react';
import CashFlowChart from '@/features/accounts/components/CashFlowChart';
import Link from 'next/link';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatRs } from '@/lib/currency';

export const dynamic = 'force-dynamic';
export const metadata = {
    title: "Accounts Dashboard | Tiny Tales Admin",
    description: "Financial aggregates and cash flow."
}

async function verifyAccountsAccess() {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || !("role" in session.user)) {
        redirect("/login")
    }
    const role = session.user.role as string
    if (role !== "SUPERADMIN") {
        redirect("/unauthorized")
    }
}

export default async function AccountsDashboardPage() {
    await verifyAccountsAccess();
    const kpis = await getDashboardKPIs();
    const rawChartData = await getCashFlowData();

    // Convert raw chart data to ensure no Decimals leak to client
    const chartData = rawChartData.map(d => ({
        date: d.date,
        income: Number(d.income),
        expense: Number(d.expense)
    }));

    const cards = [
        {
            title: 'Total Revenue',
            value: kpis.totalRevenue,
            icon: TrendingUp,
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-600',
        },
        {
            title: 'Total COGS / Purchases',
            value: kpis.totalCogs,
            icon: ShoppingCart,
            iconBg: 'bg-rose-100',
            iconColor: 'text-rose-600',
        },
        {
            title: 'Operating Expenses',
            value: kpis.operatingExpenses,
            icon: TrendingDown,
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-600',
        },
        {
            title: 'Net Profit',
            value: kpis.netProfit,
            icon: PiggyBank,
            iconBg: 'bg-orange-100',
            iconColor: 'text-orange-600',
            isHighlight: true,
        },
    ];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <p className="admin-label mb-2">Ledger Overview</p>
                    <h1 className="text-2xl font-bold text-slate-900">Financial Cockpit</h1>
                    <p className="text-sm text-slate-500 mt-1">Real-time overview of revenue, operations, and cash flow.</p>
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/accounts/sales"
                        className="px-4 py-2.5 bg-white border border-slate-100 text-slate-700 text-sm font-medium rounded-2xl hover:bg-gray-100 hover:text-orange-600 transition-all shadow-sm flex items-center gap-2"
                    >
                        Sales Ledger <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                        href="/accounts/expenses"
                        className="px-4 py-2.5 bg-orange-600 text-white text-sm font-medium rounded-2xl hover:bg-orange-700 transition-all shadow-[0_14px_28px_-18px_rgba(234,88,12,0.95)] flex items-center gap-2"
                    >
                        Record Expenses <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card, idx) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={idx}
                            className={`relative overflow-hidden flex items-center p-5 bg-white border rounded-[1.6rem] shadow-sm shadow-slate-950/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-950/10 ${card.isHighlight ? 'border-orange-200 ring-1 ring-orange-100' : 'border-slate-100'}`}
                        >
                            {card.isHighlight && (
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                    <Icon className="w-24 h-24 text-orange-600" />
                                </div>
                            )}

                            <div className="flex flex-col gap-1 z-10 w-full">
                                <div className="flex justify-between items-center w-full mb-2">
                                    <p className={`admin-label ${card.isHighlight ? 'text-orange-800' : 'text-slate-500'}`}>
                                        {card.title}
                                    </p>
                                    <div className={`p-2 rounded-lg ${card.iconBg}`}>
                                        <Icon className={`w-5 h-5 ${card.iconColor}`} />
                                    </div>
                                </div>
                                    <p className={`admin-figure text-3xl font-bold tracking-tight tabular-nums ${card.isHighlight ? 'text-orange-600' : 'text-slate-900'}`}>
                                    {formatRs(card.value)}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Cash Flow Chart Area */}
            <div className="admin-surface rounded-[1.75rem] p-6 mt-2 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-rose-500"></div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-slate-900">Cash Flow (Last 30 Days)</h2>
                </div>
                <div className="h-[400px] w-full">
                    <CashFlowChart data={chartData} />
                </div>
            </div>
        </div>
    );
}
