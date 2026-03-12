"use server"

import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import * as z from "zod"

async function checkRole(allowedRoles: string[]) {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !("role" in session.user)) {
        throw new Error("Unauthorized: No session found")
    }

    const role = session.user.role as string
    if (!allowedRoles.includes(role)) {
        throw new Error("Forbidden: Insufficient privileges")
    }
    return session.user
}

const storeDetailsSchema = z.object({
    storeName: z.string().min(2),
    physicalAddress: z.string().nullable().optional(),
    supportEmail: z.string().email().nullable().optional(),
    supportPhone: z.string().nullable().optional()
})

const financialRulesSchema = z.object({
    defaultTaxRate: z.coerce.number().min(0).max(100),
    flatShippingFee: z.coerce.number().min(0),
    freeShippingThreshold: z.coerce.number().min(0)
})

export type StoreDetailsInput = z.infer<typeof storeDetailsSchema>
export type FinancialRulesInput = z.infer<typeof financialRulesSchema>

export async function updateStoreDetails(data: StoreDetailsInput) {
    try {
        await checkRole(["SUPERADMIN"])
        const parsed = storeDetailsSchema.parse(data)

        const settings = await db.storeSettings.upsert({
            where: { id: "default" },
            update: {
                storeName: parsed.storeName,
                physicalAddress: parsed.physicalAddress,
                supportEmail: parsed.supportEmail,
                supportPhone: parsed.supportPhone
            },
            create: {
                id: "default",
                storeName: parsed.storeName,
                physicalAddress: parsed.physicalAddress,
                supportEmail: parsed.supportEmail,
                supportPhone: parsed.supportPhone
            }
        })

        revalidatePath("/admin/settings")
        return { success: true, data: settings }
    } catch (error: any) {
        if (error instanceof z.ZodError) return { success: false, error: "Validation failed: " + error.issues[0].message }
        return { success: false, error: error.message || "Failed to update store details" }
    }
}

export async function updateFinancialRules(data: FinancialRulesInput) {
    try {
        await checkRole(["SUPERADMIN"])
        const parsed = financialRulesSchema.parse(data)

        const settings = await db.storeSettings.upsert({
            where: { id: "default" },
            update: {
                defaultTaxRate: parsed.defaultTaxRate,
                flatShippingFee: parsed.flatShippingFee,
                freeShippingThreshold: parsed.freeShippingThreshold
            },
            create: {
                id: "default",
                defaultTaxRate: parsed.defaultTaxRate,
                flatShippingFee: parsed.flatShippingFee,
                freeShippingThreshold: parsed.freeShippingThreshold
            }
        })

         revalidatePath("/admin/settings")
         return { success: true, data: settings }
    } catch (error: any) {
        if (error instanceof z.ZodError) return { success: false, error: "Validation failed: " + error.issues[0].message }
        return { success: false, error: error.message || "Failed to update financial rules" }
    }
}
