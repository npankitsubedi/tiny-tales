import { db } from "@tinytales/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Users, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { OrderStatus } from "@tinytales/db"
import CustomerGrid, { CustomerRow } from '@/features/crm/components/CustomerGrid'

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
        <div className="min-h-screen p-6 md:p-10 space-y-8">
            <div className="max-w-[1400px] mx-auto space-y-8">

                {/* Header */}
                <header className="admin-glass sticky top-0 z-30 flex flex-col md:flex-row md:items-end justify-between gap-6 rounded-[1.75rem] border border-white/70 px-6 py-5 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.28)]">
                    <div>
                        <div className="flex items-center gap-3">
                            <Link
                                href="/dashboard"
                                className="p-2 bg-white border border-slate-200 hover:bg-gray-100 hover:text-orange-600 active:scale-95 rounded-xl transition-all duration-200 shadow-sm text-slate-500"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </Link>
                            <h1 className="text-3xl font-serif text-slate-800 tracking-tight flex items-center gap-3">
                                <Users className="w-7 h-7 text-orange-600" />
                                Customer CRM
                            </h1>
                        </div>
                        <p className="admin-label mt-4 pl-12">Lifecycle Intelligence</p>
                        <p className="text-slate-500 mt-1 text-sm pl-12">
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
