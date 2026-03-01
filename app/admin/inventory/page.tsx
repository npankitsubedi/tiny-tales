import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import InventoryTable from "@/components/admin/InventoryTable"
import LowStockSidebar from "@/components/admin/LowStockSidebar"
import Link from "next/link"
import { Plus } from "lucide-react"

async function getInventoryData() {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !("role" in session.user)) {
        redirect("/login")
    }

    const role = session.user.role as string
    if (role !== "SUPERADMIN") {
        redirect("/unauthorized")
    }

    // Fetch all products with their variants
    const products = await db.product.findMany({
        include: {
            variants: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    // Fetch variants that are at or below their low stock threshold.
    // In Prisma, comparing two columns directly requires raw queries or fetching and filtering.
    // Since catalog is presumed manageable in size, we fetch all and filter for now:
    const allVariants = await db.productVariant.findMany({
        include: {
            product: {
                select: {
                    title: true
                }
            }
        },
        orderBy: {
            stockCount: 'asc'
        }
    })

    const lowStockVariants = allVariants.filter(v => v.stockCount <= v.lowStockThreshold)

    // Convert Prisma Decimal back to primitive numbers for client-side rendering props
    const sanitizedProducts = products.map(p => ({
        ...p,
        cogs: p.cogs.toNumber(),
        basePrice: p.basePrice.toNumber()
    }))

    return { products: sanitizedProducts, lowStockVariants }
}

export const metadata = {
    title: "Inventory Command Center | Tiny Tales",
    description: "Monitor stock and manage the Tiny Tales inventory catalog.",
}

export default async function InventoryPage() {
    const { products, lowStockVariants } = await getInventoryData()

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-12 font-sans text-slate-800">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header Section */}
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
                    <div>
                        <h1 className="text-3xl font-serif text-slate-800 tracking-tight">Inventory Command Center</h1>
                        <p className="text-slate-500 mt-1">Real-time stock monitoring and catalog management.</p>
                    </div>
                    <Link
                        href="/admin/inventory/new"
                        className="inline-flex items-center justify-center px-5 py-2.5 bg-primary hover:opacity-90 text-primary-foreground font-medium rounded-xl transition-opacity shadow-sm"
                    >
                        <Plus className="h-5 w-5 mr-1.5" />
                        Add New Product
                    </Link>
                </header>

                {/* Dashboard Layout */}
                <main className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* Main Table Area (3/4 width on desktop) */}
                    <div className="lg:col-span-3">
                        <InventoryTable products={products} />
                    </div>

                    {/* Sidebar Area (1/4 width on desktop) */}
                    <div className="lg:col-span-1">
                        <LowStockSidebar variants={lowStockVariants} />
                    </div>

                </main>
            </div>
        </div>
    )
}
