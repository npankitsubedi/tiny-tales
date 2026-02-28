import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { ArrowLeft, MessageCircle, ShoppingBag, FileText } from "lucide-react"
import Link from "next/link"
import { formatRs } from "@/lib/currency"

const STATUS_COLORS: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700",
    PROCESSING: "bg-blue-100 text-blue-700",
    SHIPPED: "bg-indigo-100 text-indigo-700",
    DELIVERED: "bg-green-100 text-green-700",
    CANCELED: "bg-red-100 text-red-700",
    RETURNED: "bg-slate-100 text-slate-600",
}

export async function generateMetadata({ params }: { params: { id: string } }) {
    const user = await db.user.findUnique({ where: { id: params.id }, select: { name: true } })
    return { title: `${user?.name ?? "Customer"} — Customer 360 | Tiny Tales Admin` }
}

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
    const user = await db.user.findUnique({
        where: { id: params.id },
        include: {
            orders: {
                orderBy: { createdAt: "desc" },
                include: {
                    invoice: { select: { id: true } },
                    orderItems: {
                        include: { variant: { include: { product: { select: { title: true } } } } }
                    }
                }
            }
        }
    })

    if (!user) notFound()

    const completedOrders = user.orders.filter(o => !["CANCELED", "RETURNED"].includes(o.status))
    const lifetimeValue = completedOrders.reduce((s, o) => s + o.totalAmount.toNumber(), 0)
    const avgOrderValue = completedOrders.length > 0 ? lifetimeValue / completedOrders.length : 0
    const babyAges = user.orders.flatMap(o => o.babyAgeMonths != null ? [o.babyAgeMonths] : [])
    const avgBabyAge = babyAges.length > 0 ? Math.round(babyAges.reduce((a, b) => a + b, 0) / babyAges.length) : null

    const whatsappMsg = encodeURIComponent(
        `Hello ${user.name ?? "there"}, this is Tiny Tales 👋\n\nThank you for shopping with us! We'd love to assist you regarding your recent order. Please let us know if you need any help. 💛`
    )
    const phone = user.phone?.replace(/\D/g, "") ?? ""

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10 space-y-6">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Back */}
                <Link href="/admin/sales/customers" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-600 font-medium transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Customers
                </Link>

                {/* Hero/Profile Card */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 font-bold text-2xl flex items-center justify-center border border-teal-100 shrink-0">
                        {user.name?.charAt(0)?.toUpperCase() ?? "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-serif text-slate-800 font-bold">{user.name ?? "Unknown"}</h1>
                        <p className="text-slate-500 text-sm">{user.email}</p>
                        <p className="text-slate-400 text-xs mt-0.5">
                            Member since {new Date(user.createdAt).toLocaleDateString("en-NP", { year: "numeric", month: "long", day: "numeric" })}
                        </p>
                    </div>
                    {/* WhatsApp CTA */}
                    {phone && (
                        <a
                            href={`https://wa.me/${phone}?text=${whatsappMsg}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm shrink-0"
                        >
                            <MessageCircle className="w-4 h-4" />
                            WhatsApp
                        </a>
                    )}
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: "Lifetime Value", value: formatRs(lifetimeValue) },
                        { label: "Total Orders", value: String(user.orders.length) },
                        { label: "Avg Order Value", value: formatRs(avgOrderValue) },
                        { label: "Baby's Age", value: avgBabyAge != null ? `~${avgBabyAge} months` : "Unknown" },
                    ].map(({ label, value }) => (
                        <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{label}</p>
                            <p className="text-lg font-bold text-slate-800 mt-0.5 leading-tight">{value}</p>
                        </div>
                    ))}
                </div>

                {/* Full Order History */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-slate-400" />
                        <h2 className="font-semibold text-slate-800">Order History</h2>
                        <span className="ml-auto text-xs text-slate-400">{user.orders.length} orders</span>
                    </div>
                    {user.orders.length === 0 ? (
                        <p className="text-center py-10 text-slate-400 text-sm">No orders yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        {["Date", "Items", "Baby Age", "Total", "Status", "Invoice"].map(h => (
                                            <th key={h} className="text-left px-5 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {user.orders.map(order => (
                                        <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                                            <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap">
                                                {new Date(order.createdAt).toLocaleDateString("en-NP")}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="space-y-0.5">
                                                    {order.orderItems.slice(0, 2).map(item => (
                                                        <p key={item.id} className="text-xs text-slate-600 truncate max-w-[160px]">
                                                            {item.quantity}× {item.variant.product.title} ({item.variant.size})
                                                        </p>
                                                    ))}
                                                    {order.orderItems.length > 2 && (
                                                        <p className="text-[11px] text-slate-400">+{order.orderItems.length - 2} more</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-slate-500 text-sm">
                                                {order.babyAgeMonths != null ? `${order.babyAgeMonths} mo` : "—"}
                                            </td>
                                            <td className="px-5 py-3.5 font-semibold text-slate-800">
                                                {formatRs(order.totalAmount.toNumber())}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${STATUS_COLORS[order.status] ?? "bg-slate-100 text-slate-600"}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {order.invoice ? (
                                                    <Link
                                                        href={`/admin/sales/invoice/${order.invoice.id}`}
                                                        target="_blank"
                                                        className="inline-flex items-center gap-1 text-xs text-teal-600 font-semibold hover:text-teal-700"
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
                    )}
                </div>
            </div>
        </div>
    )
}
