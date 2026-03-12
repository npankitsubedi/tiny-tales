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

const updateCustomerSchema = z.object({
    id: z.string().min(1),
    phone: z.string().nullable().optional(),
    email: z.string().email(),
    defaultShippingAddress: z.string().nullable().optional(),
})

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>

export async function updateCustomerProfile(data: UpdateCustomerInput) {
    try {
        await checkRole(["SUPERADMIN"])

        const parsedData = updateCustomerSchema.parse(data)

        const user = await db.user.update({
            where: { id: parsedData.id },
            data: {
                phone: parsedData.phone,
                email: parsedData.email,
                defaultShippingAddress: parsedData.defaultShippingAddress
            }
        })

        revalidatePath(`/admin/customers/${parsedData.id}`)
        revalidatePath("/admin/customers")

        return { success: true, data: user }

    } catch (error: any) {
        if (error instanceof z.ZodError) {
             return { success: false, error: "Validation failed: " + error.issues[0].message }
        }
        return { success: false, error: error.message || "Failed to update customer profile" }
    }
}
