"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { actionError, actionSuccess } from "@/lib/action-utils"
import { requireSuperadmin } from "@/lib/authz"
import * as z from "zod"

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
        await requireSuperadmin()
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
        return actionSuccess(settings)
    } catch (error) {
        console.error("[SETTINGS_ERROR] Failed to update store details:", error)
        return actionError(error, "Failed to update store details")
    }
}

export async function updateFinancialRules(data: FinancialRulesInput) {
    try {
        await requireSuperadmin()
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
        return actionSuccess(settings)
    } catch (error) {
        console.error("[SETTINGS_ERROR] Failed to update financial rules:", error)
        return actionError(error, "Failed to update financial rules")
    }
}
