import { Resend } from "resend";
import { OrderStatus } from "@prisma/client";
import { formatRs } from "./currency";

// Initialize Resend with the provided API key
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrderStatusEmail(
    order: {
        id: string;
        customerName?: string | null;
        totalAmount: number;
    },
    customerEmail: string,
    newStatus: OrderStatus
) {
    if (!process.env.RESEND_API_KEY) {
        console.warn("[EMAIL_SYSTEM] RESEND_API_KEY is missing. Email skipped.");
        return { success: false, error: "Missing API Key" };
    }

    try {
        let subject = "";
        let htmlContent = "";
        const customerFirstName = order.customerName ? order.customerName.split(" ")[0] : "there";
        const formattedAmount = formatRs(order.totalAmount);

        switch (newStatus) {
            case OrderStatus.CONFIRMED:
                subject = "Your Tiny Tales Order is Confirmed! 🎉";
                htmlContent = `
                    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2D5068;">Great news, ${customerFirstName}!</h2>
                        <p>Your order (<strong>${formattedAmount}</strong>) has been confirmed and is currently being packed with care.</p>
                        <p>Order ID: <strong>#${order.id.slice(-6).toUpperCase()}</strong></p>
                        <p>We'll send you another update as soon as it ships.</p>
                        <br/>
                        <p>Warmly,</p>
                        <p><strong>The Tiny Tales Team</strong></p>
                    </div>
                `;
                break;
            case OrderStatus.SHIPPED:
            case OrderStatus.OUT_FOR_DELIVERY:
                subject = "Your Tiny Tales Package is on the Way! 🚚";
                htmlContent = `
                    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2D5068;">It's on the way, ${customerFirstName}!</h2>
                        <p>Your Tiny Tales package is out for delivery and will be with you shortly.</p>
                        <p>Order ID: <strong>#${order.id.slice(-6).toUpperCase()}</strong></p>
                        <p>Please keep an eye out for our delivery partner.</p>
                        <br/>
                        <p>Warmly,</p>
                        <p><strong>The Tiny Tales Team</strong></p>
                    </div>
                `;
                break;
            case OrderStatus.DELIVERED:
                subject = "Your Tiny Tales Package Delivered! 🎁";
                htmlContent = `
                    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2D5068;">It's here, ${customerFirstName}!</h2>
                        <p>Your package has arrived! We hope you love your new Tiny Tales items.</p>
                        <p>Order ID: <strong>#${order.id.slice(-6).toUpperCase()}</strong></p>
                        <p>Thank you for shopping with us!</p>
                        <br/>
                        <p>Warmly,</p>
                        <p><strong>The Tiny Tales Team</strong></p>
                    </div>
                `;
                break;
            default:
                // We don't send emails for other statuses currently
                return { success: true, skipped: true };
        }

        const data = await resend.emails.send({
            from: "Tiny Tales <onboarding@resend.dev>",
            to: [customerEmail],
            subject: subject,
            html: htmlContent,
        });

        console.log(`[EMAIL_SYSTEM] Successfully sent ${newStatus} email to ${customerEmail}`);
        return { success: true, data };
    } catch (error) {
        console.error(`[EMAIL_SYSTEM_ERROR] Failed to send ${newStatus} email to ${customerEmail}:`, error);
        return { success: false, error };
    }
}
