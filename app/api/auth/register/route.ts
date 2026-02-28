import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { z } from "zod"

const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
})

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const parsed = registerSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
        }

        const { name, email, password } = parsed.data

        const existing = await db.user.findUnique({ where: { email } })
        if (existing) {
            return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 })
        }

        const passwordHash = await bcrypt.hash(password, 12)

        const user = await db.user.create({
            data: {
                name,
                email,
                passwordHash,
                role: "CUSTOMER", // Always CUSTOMER for storefront self-registration
            }
        })

        return NextResponse.json({ success: true, userId: user.id }, { status: 201 })
    } catch (error) {
        console.error("[REGISTER_ERROR]", error)
        return NextResponse.json({ error: "Internal server error." }, { status: 500 })
    }
}
