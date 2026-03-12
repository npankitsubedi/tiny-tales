import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Users, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { OrderStatus } from "@prisma/client"
import CustomerGrid, { CustomerRow } from "@/components/admin/customers/CustomerGrid"

export const metadata = {
    title: "Customer CRM | Tiny Tales Admin",
    description: "View customer lifetime values, total orders, and targeted demographics."
}

async function verifySalesAccess() {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || !("role" in session.user)) {
        redirect("/login")
    }
    const allowed = ["SUPERADMIN"]
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

    const crmData: CustomerRow[] = customersRaw.map(user => {
        const totalOrders = user.orders.length;
        const lifetimeValue = user.orders.reduce((sum, order) => sum + order.totalAmount.toNumber(), 0);

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            totalOrders,
            lifetimeValue,
            joinedDate: user.createdAt.toISOString()
        };
    });

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10 space-y-8">
            <div className="max-w-[1400px] mx-auto space-y-8">

                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <Link href="/admin/dashboard">
                                <button className="p-2 bg-white border border-slate-200 hover:bg-slate-50 hover:text-orange-600 rounded-xl transition-colors shadow-sm text-slate-500">
                                    <ArrowLeft className="w-4 h-4" />
                                </button>
                            </Link>
                            <h1 className="text-3xl font-serif text-slate-800 tracking-tight flex items-center gap-3">
                                <Users className="w-7 h-7 text-orange-600" />
                                Customer CRM
                            </h1>
                        </div>
                        <p className="text-slate-500 mt-2 text-sm pl-12">
                            Manage your client relationships, lifetime value profiles, and core demographics.
                        </p>
                    </div>
                </header>

                {/* Main Data Grid */}
                <CustomerGrid customers={crmData} />

            </div>
        </div>
    )
}
