"use server"

import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { ProductCategory } from "@prisma/client"

// Helper to check authorization
async function checkInventoryAuth() {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !("role" in session.user)) {
        throw new Error("Unauthorized: No session found")
    }

    const role = session.user.role as string
    if (role !== "SUPERADMIN") {
        throw new Error("Unauthorized Access Detected: SUPERADMIN required")
    }
}

type CreateProductData = {
    title: string
    description?: string
    category: ProductCategory
    cogs: number
    basePrice: number
    isNonReturnable?: boolean
    images?: string[]
    sizeChart?: object
    babyAgeRange?: string
}

export async function createProduct(data: CreateProductData) {
    try {
        await checkInventoryAuth()

        const newProduct = await db.product.create({
            data: {
                title: data.title,
                description: data.description,
                category: data.category,
                cogs: data.cogs,
                basePrice: data.basePrice,
                isNonReturnable: data.isNonReturnable ?? false,
                images: data.images ?? [],
                sizeChart: data.sizeChart ?? undefined,
                babyAgeRange: data.babyAgeRange,
            }
        })

        const { revalidatePath } = await import("next/cache")
        revalidatePath("/")
        revalidatePath("/shop")

        return { success: true, data: newProduct }
    } catch (error: any) {
        console.error("[INVENTORY_ERROR] Failed to create product:", error)
        return { success: false, error: error.message || "Failed to create product" }
    }
}

type CreateProductVariantData = {
    productId: string
    size: string
    color: string
    sku: string
    stockCount?: number
    lowStockThreshold?: number
}

export async function createProductVariant(data: CreateProductVariantData) {
    try {
        await checkInventoryAuth()

        const newVariant = await db.productVariant.create({
            data: {
                productId: data.productId,
                size: data.size,
                color: data.color,
                sku: data.sku,
                stockCount: data.stockCount ?? 0,
                lowStockThreshold: data.lowStockThreshold ?? 5,
            }
        })

        const { revalidatePath } = await import("next/cache")
        revalidatePath("/")
        revalidatePath("/shop")

        return { success: true, data: newVariant }
    } catch (error: any) {
        console.error("[INVENTORY_ERROR] Failed to create variant:", error)
        return { success: false, error: error.message || "Failed to create variant" }
    }
}

type OrderItemInput = {
    variantId: string
    quantity: number
}

export async function deductInventory(orderItems: OrderItemInput[]) {
    try {
        await checkInventoryAuth()

        if (!orderItems || orderItems.length === 0) {
            throw new Error("No items provided for deduction")
        }

        // Execute in a Prisma transaction to ensure stock consistency
        const result = await db.$transaction(async (tx) => {
            const updatedVariants = []

            for (const item of orderItems) {
                // Find variant and lock row if using a capable db (Raw queries needed for true pessimistic lock)
                // For simplicity, we check and update in sequence
                const variant = await tx.productVariant.findUnique({
                    where: { id: item.variantId }
                })

                if (!variant) {
                    throw new Error(`Variant not found: ${item.variantId}`)
                }

                if (variant.stockCount < item.quantity) {
                    throw new Error(`Insufficient stock for SKU: ${variant.sku}`)
                }

                const updated = await tx.productVariant.update({
                    where: { id: item.variantId },
                    data: {
                        stockCount: {
                            decrement: item.quantity
                        }
                    }
                })

                updatedVariants.push(updated)
            }

            return updatedVariants
        })

        const { revalidatePath } = await import("next/cache")
        revalidatePath("/")
        revalidatePath("/shop")

        return { success: true, data: result }
    } catch (error: any) {
        console.error("[INVENTORY_ERROR] Failed to deduct inventory:", error)
        return { success: false, error: error.message || "Failed to deduct inventory" }
    }
}

export async function checkLowStock(variantId: string) {
    try {
        await checkInventoryAuth()

        const variant = await db.productVariant.findUnique({
            where: { id: variantId },
            select: { stockCount: true, lowStockThreshold: true }
        })

        if (!variant) {
            throw new Error("Variant not found")
        }

        const isLow = variant.stockCount <= variant.lowStockThreshold

        return { success: true, data: isLow }
    } catch (error: any) {
        console.error("[INVENTORY_ERROR] Failed to check stock:", error)
        return { success: false, error: error.message || "Failed to check stock" }
    }
}

export async function updateStock(variantId: string, newCount: number) {
    try {
        await checkInventoryAuth()

        if (newCount < 0) {
            throw new Error("Stock count cannot be negative")
        }

        const updatedVariant = await db.productVariant.update({
            where: { id: variantId },
            data: { stockCount: newCount }
        })

        // Revalidate the inventory path so UI updates instantly
        const { revalidatePath } = await import("next/cache")
        revalidatePath("/admin/inventory")
        revalidatePath("/")
        revalidatePath("/shop")

        return { success: true, data: updatedVariant }
    } catch (error: any) {
        console.error("[INVENTORY_ERROR] Failed to update stock:", error)
        return { success: false, error: error.message || "Failed to update stock" }
    }
}
