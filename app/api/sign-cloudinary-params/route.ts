import { v2 as cloudinary } from "cloudinary"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: Request) {
    try {
        // Enforce SUPERADMIN / INVENTORY_ADMIN authorization mapping to prevent abuse of our API keys
        const session = await getServerSession(authOptions)
        if (!session || !session.user || !("role" in session.user)) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
        }
        const role = session.user.role as string
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
