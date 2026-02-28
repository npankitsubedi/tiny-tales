"use server"

import crypto from "crypto"

// ─────────────────────────────────────────────
// eSewa V2 (ePay) Payment Payload Generator
// Docs: https://developer.esewa.com.np/#/epay
// ─────────────────────────────────────────────
export async function generateEsewaPayload(orderId: string, amount: number) {
    const secretKey = process.env.ESEWA_SECRET_KEY
    const productCode = process.env.ESEWA_PRODUCT_CODE || "EPAYTEST"

    if (!secretKey) {
        return { success: false as const, error: "eSewa secret key is not configured." }
    }

    // eSewa V2 requires a UUID per transaction
    const transactionUuid = `TT-${orderId.slice(-8).toUpperCase()}-${Date.now()}`

    const totalAmount = amount.toFixed(2)
    const taxAmount = "0"
    const serviceCharge = "0"
    const deliveryCharge = "0"

    // HMAC SHA256 signature: "total_amount,transaction_uuid,product_code"
    const signatureString = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`
    const signature = crypto
        .createHmac("sha256", secretKey)
        .update(signatureString)
        .digest("base64")

    const payload = {
        amount: totalAmount,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        transaction_uuid: transactionUuid,
        product_code: productCode,
        product_service_charge: serviceCharge,
        product_delivery_charge: deliveryCharge,
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/esewa/callback?orderId=${orderId}`,
        failure_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout?error=payment_failed`,
        signed_field_names: "total_amount,transaction_uuid,product_code",
        signature,
    }

    const endpoint = process.env.NODE_ENV === "production"
        ? "https://epay.esewa.com.np/api/epay/main/v2/form"
        : "https://rc-epay.esewa.com.np/api/epay/main/v2/form"

    return { success: true as const, payload, endpoint }
}

// ─────────────────────────────────────────────
// Khalti Payment Initiation (Server-to-Server)
// Docs: https://docs.khalti.com/khalti-epayment/
// ─────────────────────────────────────────────
type KhaltiCustomerInfo = {
    name: string
    phone: string
    email?: string
}

export async function initiateKhaltiPayment(
    orderId: string,
    amountInPaisa: number, // Khalti uses paisa (1 NPR = 100 paisa)
    customerInfo: KhaltiCustomerInfo
) {
    const secretKey = process.env.KHALTI_SECRET_KEY

    if (!secretKey) {
        return { success: false as const, error: "Khalti secret key is not configured." }
    }

    const endpoint = process.env.NODE_ENV === "production"
        ? "https://khalti.com/api/v2/epayment/initiate/"
        : "https://a.khalti.com/api/v2/epayment/initiate/"

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Authorization": `Key ${secretKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/khalti/callback?orderId=${orderId}`,
                website_url: process.env.NEXT_PUBLIC_BASE_URL,
                amount: Math.round(amountInPaisa), // Ensure integer
                purchase_order_id: orderId,
                purchase_order_name: `Tiny Tales Order #${orderId.slice(-8).toUpperCase()}`,
                customer_info: {
                    name: customerInfo.name,
                    email: customerInfo.email || "customer@tinytales.com.np",
                    phone: customerInfo.phone,
                },
            }),
        })

        if (!response.ok) {
            const errBody = await response.json()
            console.error("[KHALTI_INITIATION_ERROR]", errBody)
            return { success: false as const, error: "Khalti payment initiation failed. Please try again." }
        }

        const data = await response.json()

        return {
            success: true as const,
            payment_url: data.payment_url as string,
            pidx: data.pidx as string,
        }
    } catch (error) {
        console.error("[KHALTI_FETCH_ERROR]", error)
        return { success: false as const, error: "Network error reaching Khalti." }
    }
}
