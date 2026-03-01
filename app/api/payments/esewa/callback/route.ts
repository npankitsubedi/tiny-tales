import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import crypto from "crypto"

function getBaseUrl(req: Request) {
    const url = new URL(req.url)
    return `${url.protocol}//${url.host}`
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get("orderId")
    const encodedData = searchParams.get("data")
    const base = getBaseUrl(req)

    if (!orderId || !encodedData) {
        return NextResponse.redirect(new URL("/checkout?error=invalid_callback", base))
    }

    const secretKey = process.env.ESEWA_SECRET_KEY
    const productCode = process.env.ESEWA_PRODUCT_CODE || "EPAYTEST"

    if (!secretKey) {
        console.error("[ESEWA_CALLBACK] ESEWA_SECRET_KEY is not configured.")
        return NextResponse.redirect(new URL("/checkout?error=server_config", base))
    }

    try {
        // Step 1: Base64-decode the eSewa data payload
        const decoded = JSON.parse(Buffer.from(encodedData, "base64").toString("utf-8"))

        const {
            transaction_uuid,
            total_amount,
            status,
            signed_field_names,
            signature: receivedSignature,
        } = decoded

        // Step 2: Reconstruct signing message from the declared signed fields
        // eSewa V2 format: "field1=value1,field2=value2,..."
        const signingFields = (signed_field_names as string).split(",").map((f: string) => f.trim())
        const fieldValues: Record<string, string> = {
            total_amount,
            transaction_uuid,
            product_code: productCode,
        }
        const messageToSign = signingFields
            .map((field: string) => `${field}=${fieldValues[field] ?? ""}`)
            .join(",")

        // Step 3: Generate our own HMAC-SHA256 and base64-encode it
        const expectedSignature = crypto
            .createHmac("sha256", secretKey)
            .update(messageToSign)
            .digest("base64")

        // Step 4: Strict constant-time signature comparison
        const signaturesMatch =
            receivedSignature &&
            crypto.timingSafeEqual(
                Buffer.from(expectedSignature),
                Buffer.from(receivedSignature)
            )

        if (!signaturesMatch || status !== "COMPLETE") {
            console.warn("[ESEWA_CALLBACK] Signature mismatch or incomplete payment.", {
                orderId, status, signaturesMatch
            })
            await db.order.update({ where: { id: orderId }, data: { status: "CANCELED" } })
            return NextResponse.redirect(new URL(`/checkout/failed?reason=esewa_verification_failed`, base))
        }

        // Step 5: Signature verified — finalize the order
        await db.order.update({ where: { id: orderId }, data: { status: "CONFIRMED" } })
        return NextResponse.redirect(new URL(`/checkout/success?orderId=${orderId}`, base))

    } catch (error) {
        console.error("[ESEWA_CALLBACK_ERROR]", error)
        try {
            await db.order.update({ where: { id: orderId }, data: { status: "CANCELED" } })
        } catch (dbErr) {
            console.error("[ESEWA_CALLBACK_DB_ERROR] Could not cancel order:", dbErr)
        }
        return NextResponse.redirect(new URL("/checkout?error=esewa_processing_failed", base))
    }
}
