import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { updateOrderStatus } from "@/app/actions/sales"
import { PackageSearch, Users } from "lucide-react"
import Link from "next/link"
import SalesCommandCenterClient from "@/components/admin/SalesCommandCenterClient"
import { OrderStatus } from "@prisma/client"

export const metadata = {
    title: "Sales Admin Dashboard | Tiny Tales Admin",
    description: "Drag-and-drop order pipeline management."
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

export default async function SalesDashboardPage() {
    await verifySalesAccess()

    // Fetch the exhaustive nested Order lists mapping into Native Number outputs targeting Client UI Props securely
    const ordersRaw = await db.order.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            orderItems: {
                include: {
                    variant: {
                        include: { product: true }
                    }
                }
            },
            invoice: true
        }
    })

    const sanitizedOrders = ordersRaw.map(o => ({
        ...o,
        totalAmount: o.totalAmount.toNumber().toString(), // Mapped to string for UI safety
        taxAmount: o.taxAmount.toNumber(),
        orderItems: o.orderItems.map(item => ({
            ...item,
            priceAtPurchase: item.priceAtPurchase.toNumber()
        })),
        invoice: o.invoice ? {
            ...o.invoice,
            amountDue: o.invoice.amountDue.toNumber(),
            amountPaid: o.invoice.amountPaid.toNumber(),
            taxAmount: o.invoice.taxAmount.toNumber()
        } : null
    }))

    // Define the client-side server mutation caller dynamically 
    const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
        "use server"
        const result = await updateOrderStatus(orderId, newStatus)
        return result.success
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-slate-800 font-sans p-6 md:p-10">
            <div className="max-w-[1600px] mx-auto space-y-8">

                {/* Header Pipeline */}
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div>
                        <h1 className="text-3xl font-serif text-slate-800 tracking-tight flex items-center gap-3">
                            <PackageSearch className="w-8 h-8 text-indigo-500" />
                            Command Center
                        </h1>
                        <p className="text-slate-500 mt-2 text-sm max-w-lg">
                            Track the entire order lifecycle seamlessly. Drag items laterally to immediately edit logic records and invoke tracking notifications.
                        </p>
                    </div>

                    <Link href="/admin/sales/customers">
                        <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl transition-colors font-medium text-sm shadow-md">
                            <Users className="w-4 h-4" /> Go to CRM List
                        </button>
                    </Link>
                </header>

                {/* Main Kanban Board Wrapper */}
                <div className="w-full relative">
                    <SalesCommandCenterClient
                        initialOrders={sanitizedOrders}
                        updateStatusAction={handleStatusUpdate}
                    />
                </div>

            </div>
        </div>
    )
}
