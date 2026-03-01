"use server"

import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { ProductCategory } from "@prisma/client"
import * as z from "zod"

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

const createProductSchema = z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    category: z.nativeEnum(ProductCategory),
    cogs: z.coerce.number().min(0),
    basePrice: z.coerce.number().min(0),
    isNonReturnable: z.boolean().default(false),
    images: z.array(z.string()).default([]),
    sizeChart: z.any().optional(),
    babyAgeRange: z.string().optional()
})

type CreateProductData = z.infer<typeof createProductSchema>

export async function createProduct(data: CreateProductData) {
    try {
        await checkInventoryAuth()
        const parsed = createProductSchema.parse(data)

        const newProduct = await db.product.create({
            data: {
                title: parsed.title,
                description: parsed.description,
                category: parsed.category,
                cogs: parsed.cogs,
                basePrice: parsed.basePrice,
                isNonReturnable: parsed.isNonReturnable,
                images: parsed.images,
                sizeChart: parsed.sizeChart ?? undefined,
                babyAgeRange: parsed.babyAgeRange,
            }
        })

        const { revalidatePath } = await import("next/cache")
        revalidatePath("/")
        revalidatePath("/shop")

        return { success: true, data: newProduct }
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return { success: false, error: "Validation failed: " + error.issues[0].message }
        }
        console.error("[INVENTORY_ERROR] Failed to create product:", error)
        return { success: false, error: error.message || "Failed to create product" }
    }
}

const createVariantSchema = z.object({
    productId: z.string().min(1),
    size: z.string().min(1),
    color: z.string().min(1),
    sku: z.string().min(3),
    stockCount: z.coerce.number().min(0).default(0),
    lowStockThreshold: z.coerce.number().min(0).default(5)
})

type CreateProductVariantData = z.infer<typeof createVariantSchema>

export async function createProductVariant(data: CreateProductVariantData) {
    try {
        await checkInventoryAuth()
        const parsed = createVariantSchema.parse(data)

        const newVariant = await db.productVariant.create({
            data: parsed
        })

        const { revalidatePath } = await import("next/cache")
        revalidatePath("/")
        revalidatePath("/shop")

        return { success: true, data: newVariant }
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return { success: false, error: "Validation failed: " + error.issues[0].message }
        }
        console.error("[INVENTORY_ERROR] Failed to create variant:", error)
        return { success: false, error: error.message || "Failed to create variant" }
    }
}

export async function updateProduct(id: string, data: Partial<CreateProductData>) {
    try {
        await checkInventoryAuth()
        const updateProductSchema = createProductSchema.partial()
        const parsed = updateProductSchema.parse(data)

        const updated = await db.product.update({
            where: { id }, data: {
                ...parsed,
                sizeChart: parsed.sizeChart ?? undefined, // handle nullable
            }
        })
        const { revalidatePath } = await import("next/cache")
        revalidatePath("/admin/inventory")
        revalidatePath("/shop")
        return { success: true, data: updated }
    } catch (error: any) {
        return { success: false, error: error.message || "Update product failed" }
    }
}

export async function updateProductVariant(id: string, data: Partial<CreateProductVariantData>) {
    try {
        await checkInventoryAuth()
        const updateVariantSchema = createVariantSchema.omit({ productId: true }).partial()
        const parsed = updateVariantSchema.parse(data)

        const updated = await db.productVariant.update({
            where: { id }, data: parsed
        })
        const { revalidatePath } = await import("next/cache")
        revalidatePath("/admin/inventory")
        revalidatePath("/shop")
        return { success: true, data: updated }
    } catch (error: any) {
        return { success: false, error: error.message || "Update variant failed" }
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
