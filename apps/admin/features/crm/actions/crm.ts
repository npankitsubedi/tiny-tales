"use server"

import { db } from "@tinytales/db"
import { revalidatePath } from "next/cache"
import { actionError, actionSuccess } from "@/lib/action-utils"
import { requireSuperadmin } from "@/lib/authz"
import * as z from "zod"

const updateCustomerSchema = z.object({
    id: z.string().min(1),
    phone: z.string().nullable().optional(),
    email: z.string().email(),
    defaultShippingAddress: z.string().nullable().optional(),
})

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>

export async function updateCustomerProfile(data: UpdateCustomerInput) {
    try {
        await requireSuperadmin()
        const parsedData = updateCustomerSchema.parse(data)

        const user = await db.user.update({
            where: { id: parsedData.id },
            data: {
                phone: parsedData.phone,
                email: parsedData.email,
                defaultShippingAddress: parsedData.defaultShippingAddress
            }
        })

        revalidatePath(`/customers/${parsedData.id}`)
        revalidatePath("/customers")

        return actionSuccess(user)
    } catch (error) {
        console.error("[CRM_ERROR] Failed to update customer profile:", error)
        return actionError(error, "Failed to update customer profile")
    }
}
