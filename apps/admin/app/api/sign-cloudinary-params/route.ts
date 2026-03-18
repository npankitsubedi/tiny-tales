import { v2 as cloudinary } from "cloudinary"
import { auth } from "@clerk/nextjs/server"

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: Request) {
    try {
        // Defensive guard: prevent crash if Cloudinary env vars are missing
        if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            return new Response(
                JSON.stringify({ error: "Cloudinary is not configured. Contact your administrator." }),
                { status: 503 }
            )
        }

        // Enforce SUPERADMIN / INVENTORY_ADMIN authorization mapping to prevent abuse of our API keys
        const { userId, sessionClaims } = await auth()
        if (!userId) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
        }
        const role = (sessionClaims?.metadata as { role?: string })?.role
        // Enforce pure SUPERADMIN authorization mapping
        if (role !== "SUPERADMIN") {
            return new Response(JSON.stringify({ error: "Forbidden: Restricted to Admins" }), { status: 403 })
        }

        const body = (await request.json()) as { paramsToSign: Record<string, string> }
        const { paramsToSign } = body

        // Securely sign the client-requested payload params using the private secret
        const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET as string)

        return Response.json({ signature })
    } catch (error: any) {
        console.error("Cloudinary Signature Error:", error)
        return new Response(JSON.stringify({ error: "Failed to sign Cloudinary payload", message: error.message }), { status: 500 })
    }
}
