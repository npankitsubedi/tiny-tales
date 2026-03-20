import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@tinytales/db"
import { format } from "date-fns"
import { Package, FileText } from "lucide-react"
import Link from "next/link"
import { formatRs } from "@/lib/currency"
import { UserProfile } from "@clerk/nextjs"
import FamilyProfileForm from "@/features/account/components/FamilyProfileForm"

const STATUS_COLORS: Record<string, string> = {
    PENDING: "bg-[#D9E9F2] text-[#2D5068]",
    PROCESSING: "bg-blue-100 text-blue-700",
    SHIPPED: "bg-indigo-100 text-indigo-700",
    DELIVERED: "bg-emerald-100 text-emerald-700",
    RETURNED: "bg-orange-100 text-orange-700",
    CANCELED: "bg-slate-100 text-slate-600",
}

export const metadata = { title: "My Account" }

export default async function AccountPage() {
    const { userId } = await auth()

    if (!userId) {
        redirect("/login")
    }

    const [user, ordersRaw] = await Promise.all([
        db.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, role: true, createdAt: true, birthday: true, children: true }
        }),
        db.order.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            include: { invoice: { select: { invoiceNumber: true } } }
        })
    ])

    if (!user) redirect("/login")

    const orders = ordersRaw.map(o => ({
        ...o,
        totalAmount: o.totalAmount.toNumber(),
        taxAmount: o.taxAmount.toNumber(),
    }))

    return (
        <div className="min-h-screen bg-[#FAFAF8] py-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
                
                {/* 1. Clerk Profile Management */}
                <div className="flex justify-center w-full">
                    <UserProfile 
                        appearance={{
                            elements: {
                                cardBox: "shadow-sm border border-slate-100 rounded-[2rem] w-full max-w-none",
                                rootBox: "w-full flex justify-center"
                            }
                        }}
                    />
                </div>

                {/* 2. Family Profile Context */}
                <FamilyProfileForm initialData={{ birthday: user.birthday, children: user.children }} />

                {/* Order History */}
                <div>
                    <h2 className="font-semibold text-slate-800 text-lg mb-5 flex items-center gap-2">
                        <Package className="w-5 h-5 text-amber-500" /> Order History
                        <span className="text-sm font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full ml-1">
                            {orders.length}
                        </span>
                    </h2>

                    {orders.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-amber-50 shadow-sm p-12 text-center text-slate-400">
                            <Package className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                            <p className="font-medium text-slate-500">No orders yet</p>
                            <p className="text-sm mt-1">Your future orders will appear here.</p>
                            <Link href="/shop">
                                <button className="mt-5 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-2.5 rounded-full text-sm transition-colors">
                                    Start Shopping
                                </button>
                            </Link>
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl border border-amber-50 shadow-sm overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4">Order ID</th>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Total</th>
                                        <th className="px-6 py-4">Invoice</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {orders.map(order => (
                                        <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-mono text-xs text-slate-500 font-medium">
                                                #{order.id.slice(-8).toUpperCase()}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {format(new Date(order.createdAt), "dd MMM yyyy")}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[order.status] || "bg-slate-100 text-slate-600"}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-800">
                                                {formatRs(order.totalAmount)}
                                            </td>
                                            <td className="px-6 py-4">
                                                {order.invoice ? (
                                                    <span className="inline-flex items-center gap-1 text-[#2D5068] font-medium text-xs bg-[#EEF4F9] px-2.5 py-1 rounded-full">
                                                        <FileText className="w-3 h-3" />
                                                        {order.invoice.invoiceNumber}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300 text-xs">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
