import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import ProductForm from "@/components/admin/ProductForm"

export const metadata = {
    title: "Edit Product | Tiny Tales Admin",
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || !("role" in session.user)) {
        redirect("/login")
    }

    const { id } = await params
    const product = await db.product.findUnique({
        where: { id },
        include: { variants: { orderBy: { createdAt: 'asc' } } }
    })

    if (!product) notFound()

    // Sanitize Prisma types to plain JS objects for the Client Component
    const initialData = {
        id: product.id,
        title: product.title,
        description: product.description || "",
        category: product.category,
        cogs: product.cogs.toNumber(),
        basePrice: product.basePrice.toNumber(),
        isNonReturnable: product.isNonReturnable,
        images: product.images,
        sizeChartRows: product.sizeChart ? (product.sizeChart as any) : [],
        babyAgeRange: product.babyAgeRange || "",
        variants: product.variants.map(v => ({
            id: v.id,
            size: v.size,
            color: v.color,
            sku: v.sku,
            stockCount: v.stockCount,
            lowStockThreshold: v.lowStockThreshold
        }))
    }

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-12">
            <div className="max-w-6xl mx-auto space-y-8">
                <header className="mb-8 border-b border-slate-200 pb-6">
                    <h1 className="text-3xl font-serif text-slate-800 tracking-tight">Edit "{product.title}"</h1>
                    <p className="text-slate-500 mt-1">Inventory Management System</p>
                </header>

                <main>
                    <ProductForm initialData={initialData as any} />
                </main>
            </div>
        </div>
    )
}
