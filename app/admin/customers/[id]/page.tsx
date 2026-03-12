import { db } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, MessageCircle, ShoppingBag, FileText, User } from "lucide-react"
import Link from "next/link"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import EditCustomerModal from "@/components/admin/customers/EditCustomerModal"

const STATUS_COLORS: Record<string, string> = {
    PENDING: "bg-slate-100 text-slate-700",
    PROCESSING: "bg-blue-100 text-blue-700",
    SHIPPED: "bg-indigo-100 text-indigo-700",
    DELIVERED: "bg-green-100 text-green-700",
    CANCELED: "bg-red-100 text-red-700",
    RETURNED: "bg-slate-100 text-slate-600",
}

function formatCurrency(amount: number) {
    return `Rs. ${amount.toLocaleString('en-IN')}`;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const user = await db.user.findUnique({ where: { id }, select: { name: true } })
    return { title: `${user?.name || "Customer"} | CRM Dashboard | Tiny Tales` }
}

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== "SUPERADMIN") redirect("/")

    // CRITICAL Next.js 15: Always await params before accessing properties
    const { id } = await params

    const user = await db.user.findUnique({
        where: { id },
        include: {
            orders: {
                orderBy: { createdAt: "desc" },
                include: {
                    invoice: { select: { id: true, invoiceNumber: true } },
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

    const whatsappMsg = encodeURIComponent(
        `Hello ${user.name || "there"}, this is Tiny Tales 👋\n\nThank you for shopping with us! We'd love to assist you regarding your recent order. Please let us know if you need any help. 💛`
    )
    const phone = user.phone?.replace(/\D/g, "") || ""

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10 space-y-6">
            <div className="max-w-6xl mx-auto space-y-6">
                
                {/* Back Navigation */}
                <Link href="/admin/customers" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-orange-600 font-medium transition-colors">
                    <div className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-sm">
                        <ArrowLeft className="w-4 h-4" /> 
                    </div>
                    Back to CRM Grid
                </Link>

                {/* Hero Head */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                         <div className="w-20 h-20 rounded-2xl bg-orange-50 text-orange-600 font-bold text-3xl flex items-center justify-center border border-orange-100 shadow-sm shrink-0">
                            {user.name?.charAt(0)?.toUpperCase() || <User className="w-8 h-8" />}
                        </div>
                        <div>
                            <h1 className="text-3xl font-serif text-slate-800 font-bold">{user.name || "Anonymous User"}</h1>
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                                <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide">
                                    {user.role}
                                </span>
                                <span className="text-slate-500 text-sm">
                                    Joined {new Date(user.createdAt).toLocaleDateString("en-NP", { year: "numeric", month: "long", day: "numeric" })}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {phone && (
                            <a
                                href={`https://wa.me/${phone}?text=${whatsappMsg}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm"
                            >
                                <MessageCircle className="w-4 h-4" /> WhatsApp
                            </a>
                        )}
                    </div>
                </div>

                {/* Split Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Left Column (Main Order History) */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* KPI Miniature Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Lifetime Value (LTV)</p>
                                <p className="text-2xl font-bold text-slate-800">{formatCurrency(lifetimeValue)}</p>
                            </div>
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Completed Orders</p>
                                <p className="text-2xl font-bold text-slate-800">{completedOrders.length}</p>
                            </div>
                        </div>

                        {/* Order History Table */}
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
                            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                                <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100 text-orange-500">
                                    <ShoppingBag className="w-5 h-5" />
                                </div>
                                <h2 className="font-serif font-bold text-lg text-slate-800">Order History</h2>
                            </div>
                            
                            <div className="overflow-x-auto flex-1">
                                {user.orders.length === 0 ? (
                                    <div className="p-10 text-center flex flex-col items-center justify-center h-full">
                                        <ShoppingBag className="w-12 h-12 text-slate-200 mb-3" />
                                        <p className="text-slate-500 font-medium">No orders found for this customer.</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead>
                                            <tr className="bg-white border-b border-slate-100">
                                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Order ID / Items</th>
                                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {user.orders.map(order => (
                                                <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="px-6 py-4 text-slate-500 font-medium text-xs">
                                                        {new Date(order.createdAt).toLocaleDateString("en-NP", { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-mono text-xs text-slate-400 mb-1">
                                                            {order.invoice?.invoiceNumber || order.id.slice(-8).toUpperCase()}
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            {order.orderItems.slice(0, 2).map((item, i) => (
                                                                <p key={i} className="text-xs font-medium text-slate-700 truncate max-w-[200px]">
                                                                    {item.quantity}x {item.variant.product.title}
                                                                </p>
                                                            ))}
                                                            {order.orderItems.length > 2 && (
                                                                <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">+{order.orderItems.length - 2} more</p>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[order.status] || "bg-slate-100 text-slate-600"}`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="font-bold text-slate-800">
                                                            {formatCurrency(order.totalAmount.toNumber())}
                                                        </span>
                                                        {order.invoice && (
                                                            <div className="mt-2 flex justify-end">
                                                                <Link 
                                                                    href={`/admin/sales/invoice/${order.invoice.id}`}
                                                                    target="_blank"
                                                                    className="flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 transition-colors"
                                                                >
                                                                    <FileText className="w-3 h-3" /> View Invoice
                                                                </Link>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column (Customer Profile Mutator) */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                            <h2 className="font-serif font-bold text-lg text-slate-800 mb-6">Customer Details</h2>
                            
                            <div className="space-y-5">
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Email Base</p>
                                    <p className="text-sm font-medium text-slate-700">{user.email}</p>
                                </div>
                                <div className="h-px w-full bg-slate-100" />
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Phone Number</p>
                                    <p className="text-sm font-medium text-slate-700">{user.phone || <span className="text-slate-400 italic">Unregistered</span>}</p>
                                </div>
                                <div className="h-px w-full bg-slate-100" />
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Default Shipping Address</p>
                                    <p className="text-sm font-medium text-slate-700 leading-relaxed">
                                        {user.defaultShippingAddress || <span className="text-slate-400 italic">No global address set.</span>}
                                    </p>
                                </div>
                            </div>

                            <EditCustomerModal 
                                customer={{
                                    id: user.id,
                                    name: user.name,
                                    email: user.email,
                                    phone: user.phone,
                                    defaultShippingAddress: user.defaultShippingAddress
                                }} 
                            />

                        </div>

                        {/* App Metadata Box */}
                        <div className="bg-slate-100 rounded-3xl p-6 border border-slate-200">
                           <div className="space-y-4">
                               <div className="flex justify-between items-center text-xs">
                                   <span className="text-slate-500 font-semibold uppercase tracking-wider">Internal ID</span>
                                   <span className="font-mono text-slate-400">{user.id.slice(0, 12)}...</span>
                               </div>
                               <div className="flex justify-between items-center text-xs">
                                   <span className="text-slate-500 font-semibold uppercase tracking-wider">Baby Age Profile</span>
                                   <span className="font-bold text-slate-600">{user.babyBirthMonth || "Nil"}</span>
                               </div>
                           </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
