"use server"

import { db } from "@tinytales/db"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { actionError, actionSuccess } from "@/lib/action-utils"
import * as z from "zod"

const childSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.coerce.number().min(0, "Age cannot be negative"),
  gender: z.enum(["Boy", "Girl", "Prefer not to say"])
})

const familyProfileSchema = z.object({
  birthday: z.date().nullable().optional(),
  children: z.array(childSchema)
})

export type FamilyProfileData = z.infer<typeof familyProfileSchema>

export async function updateFamilyProfile(data: FamilyProfileData) {
    try {
        const { userId } = await auth()
        if (!userId) {
            throw new Error("Unauthorized: You must be logged in to update your profile.")
        }

        const parsedData = familyProfileSchema.parse(data)

        // Using a transaction to safely update User and nested Children mapping
        const updatedUser = await db.$transaction(async (tx) => {
            // First we need to make sure the user exists and update their birthday
            // We use update, assuming the Clerk webhook syncs users. 
            // If the user doesn't exist, this will throw, which is correct behavior.
            const user = await tx.user.update({
                where: { id: userId },
                data: {
                    birthday: parsedData.birthday,
                    // Nested write: delete all existing children and replace with the new list
                    children: {
                        deleteMany: {}, // Clear existing
                        create: parsedData.children.map(child => ({
                            name: child.name,
                            age: child.age,
                            gender: child.gender
                        }))
                    }
                },
                include: {
                    children: true
                }
            })
            return user
        })

        revalidatePath("/account")
        return actionSuccess(updatedUser, "Family profile updated beautifully.")
    } catch (error) {
        console.error("[ACCOUNT_ERROR] Failed to update family profile:", error)
        return actionError(error, "Failed to update family profile")
    }
}
