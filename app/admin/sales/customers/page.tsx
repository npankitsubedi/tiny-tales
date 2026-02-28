import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Users, Search, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { OrderStatus } from "@prisma/client"

export const metadata = {
    title: "Customer CRM | Tiny Tales Admin",
    description: "View customer lifetime values, total orders, and targeted demographics."
}

async function verifySalesAccess() {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || !("role" in session.user)) {
        redirect("/login")
    }
    const allowed = ["SUPERADMIN", "SALES_ADMIN"]
    if (!allowed.includes(session.user.role as string)) {
        redirect("/unauthorized")
    }
}

export default async function CustomerCrmPage() {
    await verifySalesAccess()

    // Aggregate User records mapped with relational completed Orders explicitly
    const customersRaw = await db.user.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            orders: {
                where: {
                    status: { notIn: [OrderStatus.CANCELED, OrderStatus.RETURNED] }
                }
            }
        }
    })

    // Process CRM metrics dynamically avoiding complex Prisma groupBy strings natively
    const crmData = customersRaw.map(user => {
        const totalOrders = user.orders.length
        const lifetimeValue = user.orders.reduce((sum, order) => sum + order.totalAmount.toNumber(), 0)
        const averageOrderValue = totalOrders > 0 ? (lifetimeValue / totalOrders) : 0

        return {
            id: user.id,
            name: user.name || "N/A",
            email: user.email,
            phone: user.phone || "Not Provided",
            babyBirthMonth: user.babyBirthMonth || "Unknown",
            role: user.role,
            totalOrders,
            lifetimeValue,
            averageOrderValue,
            joinDate: user.createdAt
        }
    })

    return (
        <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-800 p-6 md:p-10">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
                    <div className="absolute right-0 top-0 opacity-5 rotate-12 -translate-y-8">
                        <Users className="w-64 h-64 text-indigo-500" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3">
                            <Link href="/admin/sales">
                                <button className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                                    <ArrowLeft className="w-4 h-4" />
                                </button>
                            </Link>
                            <h1 className="text-3xl font-serif text-slate-800 tracking-tight flex items-center gap-3">
                                <Users className="w-7 h-7 text-indigo-500" />
                                Customer Analytics
                            </h1>
                        </div>
                        <p className="text-slate-500 mt-2 text-sm pl-11">
                            A comprehensive overview of Lifetime Values (LTV) and targeted demographics across all registered users.
                        </p>
                    </div>

                    <div className="relative z-10 bg-slate-50 rounded-full border border-slate-200 px-4 py-2 flex items-center gap-2 min-w-[300px]">
                        <Search className="w-4 h-4 text-slate-400" />
                        <input
                            disabled
                            type="text"
                            placeholder="Client-side CRM search..."
                            className="bg-transparent border-none outline-none text-sm w-full text-slate-600 placeholder:text-slate-400"
                        />
                    </div>
                </header>

                {/* Main Data Table */}
                <div className="bg-white border border-slate-100 shadow-sm rounded-3xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                                    <th className="px-6 py-4">Customer Details</th>
                                    <th className="px-6 py-4">Baby's Birth Month</th>
                                    <th className="px-6 py-4">Total Orders</th>
                                    <th className="px-6 py-4">Lifetime Value (LTV)</th>
                                    <th className="px-6 py-4">Average Order (AOV)</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-50">
                                {crmData.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                                            No customers found. Wait for new registrations dynamically.
                                        </td>
                                    </tr>
                                ) : (
                                    crmData.map((customer) => (
                                        <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">

                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 font-bold flex flex-col items-center justify-center shrink-0 border border-indigo-100">
                                                        {customer.name?.charAt(0) || "U"}
                                                    </div>
                                                    <div>
                                                        <Link href={`/admin/sales/customers/${customer.id}`} className="font-medium text-slate-800 flex items-center gap-2 hover:text-teal-600 transition-colors">
                                                            {customer.name}
                                                            {customer.role === "SUPERADMIN" && (
                                                                <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Admin</span>
                                                            )}
                                                        </Link>
                                                        <p className="text-xs text-slate-500 mt-0.5">{customer.email}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${customer.babyBirthMonth !== "Unknown"
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : 'bg-slate-100 text-slate-500'
                                                    }`}>
                                                    {customer.babyBirthMonth}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-slate-600 font-medium tracking-tight">
                                                {customer.totalOrders}
                                            </td>

                                            <td className="px-6 py-4 font-bold text-slate-800 text-lg tracking-tight">
                                                ${customer.lifetimeValue.toFixed(2)}
                                            </td>

                                            <td className="px-6 py-4 text-slate-500 font-medium">
                                                ${customer.averageOrderValue.toFixed(2)}
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
