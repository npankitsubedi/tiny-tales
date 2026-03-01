import { NextResponse } from "next/server"
import { db } from "@/lib/db"

function getBaseUrl(req: Request) {
    const url = new URL(req.url)
    return `${url.protocol}//${url.host}`
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get("orderId")
    const pidx = searchParams.get("pidx")
    const base = getBaseUrl(req)

    if (!orderId || !pidx) {
        return NextResponse.redirect(new URL("/checkout?error=invalid_callback", base))
    }

    const secretKey = process.env.KHALTI_SECRET_KEY
    if (!secretKey) {
        console.error("[KHALTI_CALLBACK] KHALTI_SECRET_KEY is not configured.")
        return NextResponse.redirect(new URL("/checkout?error=server_config", base))
    }

    const lookupEndpoint = process.env.NODE_ENV === "production"
        ? "https://khalti.com/api/v2/epayment/lookup/"
        : "https://a.khalti.com/api/v2/epayment/lookup/"

    try {
        // Step 1: Never trust URL params — verify server-to-server with Khalti's lookup API
        const lookupResponse = await fetch(lookupEndpoint, {
            method: "POST",
            headers: {
                "Authorization": `Key ${secretKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ pidx }),
        })

        if (!lookupResponse.ok) {
            const errBody = await lookupResponse.text()
            console.error("[KHALTI_LOOKUP_ERROR] Non-200 from Khalti:", lookupResponse.status, errBody)
            await db.order.update({ where: { id: orderId }, data: { status: "CANCELED" } })
            return NextResponse.redirect(new URL("/checkout/failed?reason=khalti_lookup_failed", base))
        }

        const lookupData = await lookupResponse.json()

        // Step 2: Only mark as paid if Khalti confirms "Completed"
        if (lookupData.status !== "Completed") {
            console.warn("[KHALTI_CALLBACK] Payment not completed.", { pidx, status: lookupData.status, orderId })
            await db.order.update({ where: { id: orderId }, data: { status: "CANCELED" } })
            return NextResponse.redirect(
                new URL(`/checkout/failed?reason=khalti_${lookupData.status?.toLowerCase() ?? "not_completed"}`, base)
            )
        }

        // Step 3: Server-confirmed — finalize the order
        await db.order.update({ where: { id: orderId }, data: { status: "CONFIRMED" } })
        return NextResponse.redirect(new URL(`/checkout/success?orderId=${orderId}`, base))

    } catch (error) {
        console.error("[KHALTI_CALLBACK_ERROR]", error)
        try {
            await db.order.update({ where: { id: orderId }, data: { status: "CANCELED" } })
        } catch (dbErr) {
            console.error("[KHALTI_CALLBACK_DB_ERROR] Could not cancel order:", dbErr)
        }
        return NextResponse.redirect(new URL("/checkout?error=khalti_processing_failed", base))
    }
}
