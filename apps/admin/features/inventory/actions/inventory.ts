"use server"

import { db } from "@tinytales/db"
import { revalidatePath } from "next/cache"
import { actionError, actionSuccess } from "@/lib/action-utils"
import { requireSuperadmin } from "@/lib/authz"
import { ProductCategory } from "@tinytales/db"
import * as z from "zod"

const sizeChartRowSchema = z.object({
    label: z.string().min(1),
    ageRange: z.string().optional(),
    chest: z.string().optional(),
    waist: z.string().optional(),
    length: z.string().optional(),
})

const createProductSchema = z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    category: z.nativeEnum(ProductCategory),
    cogs: z.coerce.number().min(0),
    basePrice: z.coerce.number().min(0),
    isNonReturnable: z.boolean().default(false),
    images: z.array(z.string()).default([]),
    sizeChart: z.array(sizeChartRowSchema).optional(),
    babyAgeRange: z.string().optional()
})

type CreateProductData = z.infer<typeof createProductSchema>

export async function createProduct(data: CreateProductData) {
    try {
        await requireSuperadmin()
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

        revalidatePath("/")
        revalidatePath("/shop")
        revalidatePath("/inventory")

        return actionSuccess(newProduct)
    } catch (error) {
        console.error("[INVENTORY_ERROR] Failed to create product:", error)
        return actionError(error, "Failed to create product")
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
        await requireSuperadmin()
        const parsed = createVariantSchema.parse(data)

        const newVariant = await db.productVariant.create({
            data: parsed
        })

        revalidatePath("/")
        revalidatePath("/shop")
        revalidatePath("/inventory")

        return actionSuccess(newVariant)
    } catch (error) {
        console.error("[INVENTORY_ERROR] Failed to create variant:", error)
        return actionError(error, "Failed to create variant")
    }
}

export async function updateProduct(id: string, data: Partial<CreateProductData>) {
    try {
        await requireSuperadmin()
        const updateProductSchema = createProductSchema.partial()
        const parsed = updateProductSchema.parse(data)

        const updated = await db.product.update({
            where: { id }, data: {
                ...parsed,
                sizeChart: parsed.sizeChart ?? undefined, // handle nullable
            }
        })
        revalidatePath("/inventory")
        revalidatePath(`/inventory/${id}`)
        revalidatePath("/shop")
        revalidatePath("/")
        return actionSuccess(updated)
    } catch (error) {
        console.error("[INVENTORY_ERROR] Failed to update product:", error)
        return actionError(error, "Update product failed")
    }
}

export async function updateProductVariant(id: string, data: Partial<CreateProductVariantData>) {
    try {
        await requireSuperadmin()
        const updateVariantSchema = createVariantSchema.omit({ productId: true }).partial()
        const parsed = updateVariantSchema.parse(data)

        const updated = await db.productVariant.update({
            where: { id }, data: parsed
        })
        revalidatePath("/inventory")
        revalidatePath("/shop")
        revalidatePath("/")
        return actionSuccess(updated)
    } catch (error) {
        console.error("[INVENTORY_ERROR] Failed to update variant:", error)
        return actionError(error, "Update variant failed")
    }
}

const orderItemSchema = z.object({
    variantId: z.string().min(1),
    quantity: z.coerce.number().int().min(1),
})

type OrderItemInput = z.infer<typeof orderItemSchema>

export async function deductInventory(orderItems: OrderItemInput[]) {
    try {
        await requireSuperadmin()
        const parsedItems = z.array(orderItemSchema).min(1, "No items provided for deduction").parse(orderItems)

        const variantIds = parsedItems.map((item) => item.variantId)
        const result = await db.$transaction(async (tx) => {
            const variants = await tx.productVariant.findMany({
                where: { id: { in: variantIds } },
            })

            const variantMap = new Map(variants.map((variant) => [variant.id, variant]))
            const updates = parsedItems.map(async (item) => {
                const variant = variantMap.get(item.variantId)

                if (!variant) {
                    throw new Error(`Variant not found: ${item.variantId}`)
                }

                if (variant.stockCount < item.quantity) {
                    throw new Error(`Insufficient stock for SKU: ${variant.sku}`)
                }

                return tx.productVariant.update({
                    where: { id: item.variantId },
                    data: {
                        stockCount: {
                            decrement: item.quantity
                        }
                    }
                })
            })

            return Promise.all(updates)
        })

        revalidatePath("/inventory")
        revalidatePath("/shop")
        revalidatePath("/")
        return actionSuccess(result)
    } catch (error) {
        console.error("[INVENTORY_ERROR] Failed to deduct inventory:", error)
        return actionError(error, "Failed to deduct inventory")
    }
}

export async function checkLowStock(variantId: string) {
    try {
        await requireSuperadmin()

        const variant = await db.productVariant.findUnique({
            where: { id: variantId },
            select: { stockCount: true, lowStockThreshold: true }
        })

        if (!variant) {
            throw new Error("Variant not found")
        }

        const isLow = variant.stockCount <= variant.lowStockThreshold

        return actionSuccess(isLow)
    } catch (error) {
        console.error("[INVENTORY_ERROR] Failed to check stock:", error)
        return actionError(error, "Failed to check stock")
    }
}

export async function updateStock(variantId: string, newCount: number) {
    try {
        await requireSuperadmin()
        const parsedCount = z.coerce.number().min(0, "Stock count cannot be negative").parse(newCount)

        const updatedVariant = await db.productVariant.update({
            where: { id: variantId },
            data: { stockCount: parsedCount }
        })

        revalidatePath("/inventory")
        revalidatePath("/")
        revalidatePath("/shop")

        return actionSuccess(updatedVariant)
    } catch (error) {
        console.error("[INVENTORY_ERROR] Failed to update stock:", error)
        return actionError(error, "Failed to update stock")
    }
}

export async function deleteProductVariant(variantId: string) {
    try {
        await requireSuperadmin()
        
        await db.productVariant.delete({
            where: { id: variantId }
        })
        
        revalidatePath("/inventory")
        revalidatePath("/")
        revalidatePath("/shop")
        
        return actionSuccess({ deleted: true })
    } catch (error) {
        console.error("[INVENTORY_ERROR] Failed to delete variant:", error)
        return actionError(error, "Failed to delete variant")
    }
}
