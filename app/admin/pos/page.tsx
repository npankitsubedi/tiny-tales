import { db } from "@/lib/db"
import POSClient from "@/components/admin/POSClient"

export default async function POSPage() {
    const products = await db.product.findMany({
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            title: true,
            basePrice: true,
            variants: {
                select: {
                    stockCount: true,
                }
            }
        }
    })

    const catalog = products.map((product) => ({
        id: product.id,
        title: product.title,
        price: product.basePrice.toNumber(),
        stock: product.variants.reduce((totalStock, variant) => totalStock + variant.stockCount, 0),
    }))

    return <POSClient products={catalog} />
}
