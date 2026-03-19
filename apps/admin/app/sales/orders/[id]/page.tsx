export const dynamic = 'force-dynamic';

import { db } from "@tinytales/db"
import { notFound, redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { OrderStatus } from "@tinytales/db"
import { updateOrderStatus, capturePayment, saveOrderNote } from '@/features/sales/actions/sales'
import OrderDetailLayout from '@/features/sales/components/OrderDetailLayout'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const order = await db.order.findUnique({
        where: { id },
        include: { invoice: { select: { invoiceNumber: true } } }
    })
    const label = order?.invoice?.invoiceNumber ?? `#${id.slice(-8).toUpperCase()}`
    return {
        title: order ? `Order ${label} | Tiny Tales Admin` : "Order Not Found"
    }
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { userId, sessionClaims } = await auth()
    const role = (sessionClaims?.metadata as { role?: string })?.role
    if (!userId || role !== "SUPERADMIN") redirect("/")

    const { id } = await params

    // Fetch the full order
    const orderRaw = await db.order.findUnique({
        where: { id },
        include: {
            orderItems: {
                include: {
                    variant: {
                        include: { product: { select: { title: true, images: true } } }
                    }
                }
            },
            invoice: true,
            user: { select: { email: true } }
        }
    })

    if (!orderRaw) notFound()

    // Compute lifetime value from same phone or same user
    const lifetimeQuery = orderRaw.userId
        ? await db.order.aggregate({
            where: { userId: orderRaw.userId },
            _count: { id: true },
            _sum: { totalAmount: true }
        })
        : orderRaw.contactPhone
            ? await db.order.aggregate({
                where: { contactPhone: orderRaw.contactPhone },
                _count: { id: true },
                _sum: { totalAmount: true }
            })
            : null

    const lifetimeOrders = lifetimeQuery?._count.id ?? 1
    const lifetimeValue = lifetimeQuery?._sum.totalAmount?.toNumber() ?? orderRaw.totalAmount.toNumber()

    // ── Serialize ALL Prisma Decimals ─────────────────────────────────────
    const order = {
        id: orderRaw.id,
        invoiceNumber: orderRaw.invoice?.invoiceNumber ?? null,
        customerName: orderRaw.customerName,
        contactPhone: orderRaw.contactPhone,
        shippingAddress: orderRaw.shippingAddress,
        deliveryCity: orderRaw.deliveryCity,
        isInternational: orderRaw.isInternational,
        status: orderRaw.status,
        paymentMethod: orderRaw.paymentMethod,
        adminNotes: orderRaw.adminNotes,
        totalAmount: orderRaw.totalAmount.toNumber(),
        taxAmount: orderRaw.taxAmount.toNumber(),
        createdAt: orderRaw.createdAt.toISOString(),
        email: orderRaw.user?.email ?? null,
        lifetimeOrders,
        lifetimeValue,
        orderItems: orderRaw.orderItems.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            priceAtPurchase: item.priceAtPurchase.toNumber(),
            variant: {
                size: item.variant.size,
                color: item.variant.color,
                sku: item.variant.sku,
                product: {
                    title: item.variant.product.title,
                    images: item.variant.product.images,
                }
            }
        })),
        invoice: orderRaw.invoice
            ? {
                id: orderRaw.invoice.id,
                invoiceNumber: orderRaw.invoice.invoiceNumber,
                status: orderRaw.invoice.status as "PAID" | "UNPAID" | "OVERDUE" | "CANCELLED",
                amountDue: orderRaw.invoice.amountDue.toNumber(),
                amountPaid: orderRaw.invoice.amountPaid.toNumber(),
            }
            : null,
    }

    // ── Inline Server Actions ─────────────────────────────────────────────
    const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
        "use server"
        return await updateOrderStatus(orderId, newStatus)
    }

    const handleCapturePayment = async (orderId: string, method: string) => {
        "use server"
        return await capturePayment(orderId, method)
    }

    const handleSaveNote = async (orderId: string, notes: string) => {
        "use server"
        return await saveOrderNote(orderId, notes)
    }

    return (
        <OrderDetailLayout
            {...order}
            onStatusChange={handleStatusChange}
            onCapturePayment={handleCapturePayment}
            onSaveNote={handleSaveNote}
        />
    )
}
