import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getSalesAnalytics } from "@/app/actions/sales"
import ExportButton from "@/components/admin/ExportButton"
import {
    TrendingUp,
    Wallet,
    Receipt,
    FileText
} from "lucide-react"
import { InvoiceStatus } from "@prisma/client"

export const metadata = {
    title: "Accounts Dashboard | Tiny Tales Admin",
    description: "Financial aggregates and active standard Nepali invoices."
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

export default async function AccountsPage() {
    await verifyAccountsAccess()

    const analyticsReq = await getSalesAnalytics()
    const stats = analyticsReq.success && analyticsReq.data
        ? analyticsReq.data
        : { revenue: 0, cogs: 0, grossProfit: 0, orderCount: 0 }

    // Fetch all recent invoices exclusively limiting the schema scope
    const recentInvoices = await db.invoice.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
            order: {
                select: {
                    paymentMethod: true,
                    status: true
                }
            }
        }
    })

    // Format explicitly for the CSV component avoiding deeply nested object strings 
    const exportableInvoiceData = recentInvoices.map(inv => ({
        InvoiceID: inv.invoiceNumber,
        Date: inv.createdAt.toISOString().split('T')[0],
        Status: inv.status,
        PaymentMethod: inv.order.paymentMethod,
        TotalBilled: "$" + (inv.amountDue ? inv.amountDue.toString() : "0"),
        TotalTax: "$" + (inv.taxAmount ? inv.taxAmount.toString() : "0")
    }))

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-12 font-sans text-slate-800">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header Section */}
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
                    <div>
                        <h1 className="text-3xl font-serif text-slate-800 tracking-tight">Accounts & Finance</h1>
                        <p className="text-slate-500 mt-1">Total revenue indexing and active invoice processing. <span className="font-medium text-slate-600">(Current Month)</span></p>
                    </div>
                    <ExportButton data={exportableInvoiceData} />
                </header>

                {/* Financial KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-4">
                        <div className="p-3 bg-[#EEF4F9] text-[#2D5068] rounded-xl">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Total Revenue</p>
                            <h3 className="text-2xl font-bold text-slate-800">${stats.revenue.toFixed(2)}</h3>
                            <p className="text-xs text-slate-400 mt-1">Across {stats.orderCount} complete orders</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-4">
                        <div className="p-3 bg-red-50 text-red-500 rounded-xl">
                            <Receipt className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Expenses (COGS)</p>
                            <h3 className="text-2xl font-bold text-slate-800">${stats.cogs.toFixed(2)}</h3>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <Wallet className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Gross Profit Margin</p>
                            <h3 className="text-2xl font-bold text-slate-800">${stats.grossProfit.toFixed(2)}</h3>
                            <p className="text-xs text-emerald-600 font-medium mt-1">
                                {stats.revenue > 0 ? ((stats.grossProfit / stats.revenue) * 100).toFixed(1) + "% Margin" : "N/A"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Invoices Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-slate-800 tracking-tight flex items-center gap-2">
                            <FileText className="h-5 w-5 text-slate-400" />
                            Recent Invoices
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-medium">
                                    <th className="px-6 py-4">Invoice #</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Amount Due</th>
                                    <th className="px-6 py-4">13% VAT</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {recentInvoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500 text-sm">
                                            No invoices have been generated yet.
                                        </td>
                                    </tr>
                                ) : (
                                    recentInvoices.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-700">{inv.invoiceNumber}</td>
                                            <td className="px-6 py-4 text-slate-500 text-sm">{inv.createdAt.toLocaleDateString()}</td>
                                            <td className="px-6 py-4 font-medium">${inv.amountDue ? inv.amountDue.toString() : "0"}</td>
                                            <td className="px-6 py-4 text-[#2D5068] font-medium text-sm">+${inv.taxAmount ? inv.taxAmount.toString() : "0"}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${inv.status === InvoiceStatus.PAID ? 'bg-emerald-100 text-emerald-700' :
                                                    inv.status === InvoiceStatus.OVERDUE ? 'bg-red-100 text-red-700' :
                                                        inv.status === InvoiceStatus.CANCELLED ? 'bg-slate-100 text-slate-700' :
                                                            'bg-[#D9E9F2] text-[#2D5068]'
                                                    }`}>
                                                    {inv.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    )
}
