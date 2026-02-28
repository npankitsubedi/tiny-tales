"use server"

import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { OrderStatus, InvoiceStatus, Prisma } from "@prisma/client"
import { revalidatePath } from "next/cache"

// --- Auth Helpers ---
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

// --- Types ---
type OrderItemInput = {
    variantId: string
    quantity: number
}

type CreateOrderInput = {
    userId?: string
    customerName: string
    contactPhone: string
    shippingAddress: string
    isInternational?: boolean
    paymentMethod: string
    items: OrderItemInput[]
}

// --- 1. Core Checkout Logic ---
export async function createOrder(data: CreateOrderInput) {
    try {
        if (!data.items || data.items.length === 0) {
            throw new Error("Order must contain at least one item")
        }

        // Execute as a massive atomic transaction
        const result = await db.$transaction(async (tx) => {
            let totalPricing = new Prisma.Decimal(0)
            const orderItemsInsert = []

            for (const item of data.items) {
                // Find Variant
                const variant = await tx.productVariant.findUnique({
                    where: { id: item.variantId },
                    include: { product: true }
                })

                if (!variant) throw new Error(`Variant not found: ${item.variantId}`)

                // Validate Stock
                if (variant.stockCount < item.quantity) {
                    throw new Error(`Insufficient stock for SKU: ${variant.sku}`)
                }

                // Deduct immediate stock
                await tx.productVariant.update({
                    where: { id: item.variantId },
                    data: {
                        stockCount: {
                            decrement: item.quantity
                        }
                    }
                })

                // Calculate item totals safely.
                // Depending on the Prisma DB Engine mappings `basePrice` might serialize into a standard JS number implicitly or stay Decimal. 
                // We coerce to new Prisma.Decimal to guarantee operations:
                const itemPrice = new Prisma.Decimal(variant.product.basePrice.toString())
                const itemQuantityDec = new Prisma.Decimal(item.quantity)
                const lineTotal = itemPrice.mul(itemQuantityDec)
                totalPricing = totalPricing.add(lineTotal)

                orderItemsInsert.push({
                    variantId: item.variantId,
                    quantity: item.quantity,
                    priceAtPurchase: itemPrice
                })
            }

            // Calculate 13% Nepalese VAT 
            const taxRate = new Prisma.Decimal(0.13)
            const taxAmount = totalPricing.mul(taxRate)

            // Create the Order
            const newOrder = await tx.order.create({
                data: {
                    userId: data.userId,
                    customerName: data.customerName,
                    contactPhone: data.contactPhone,
                    shippingAddress: data.shippingAddress,
                    isInternational: data.isInternational || false,
                    paymentMethod: data.paymentMethod,
                    totalAmount: totalPricing.toNumber(),
                    taxAmount: taxAmount.toNumber(),
                    status: OrderStatus.PENDING,
                    orderItems: {
                        create: orderItemsInsert.map(oi => ({
                            ...oi,
                            priceAtPurchase: oi.priceAtPurchase.toNumber()
                        }))
                    }
                }
            })

            // Generate an Invoice Number sequentially
            const year = new Date().getFullYear()
            // Pull latest invoice to increment suffix safely during transaction locking natively
            const latestInvoice = await tx.invoice.findFirst({
                where: { invoiceNumber: { startsWith: `TT-${year}` } },
                orderBy: { createdAt: 'desc' }
            })

            let sequence = 1
            if (latestInvoice && latestInvoice.invoiceNumber) {
                const match = latestInvoice.invoiceNumber.match(/-(\d+)$/)
                if (match) sequence = parseInt(match[1], 10) + 1
            }
            const invoiceNumber = `TT-${year}-${sequence.toString().padStart(4, '0')}`

            // Create the generic Invoice
            const newInvoice = await tx.invoice.create({
                data: {
                    orderId: newOrder.id,
                    invoiceNumber: invoiceNumber,
                    amountDue: totalPricing.add(taxAmount).toNumber(),
                    taxAmount: taxAmount.toNumber(),
                    status: InvoiceStatus.UNPAID
                }
            })

            return { order: newOrder, invoice: newInvoice }
        })

        // Revalidate admin dashboards
        revalidatePath("/admin/sales")
        revalidatePath("/admin/inventory")

        return { success: true, data: result }
    } catch (error: any) {
        return { success: false, error: error.message || "Checkout transaction failed" }
    }
}


// --- 2. Accounts Admin Analytics ---
export async function getSalesAnalytics() {
    try {
        await checkRole(["SUPERADMIN", "ACCOUNTS_ADMIN"])

        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

        // Find all orders created this month (using native Decimal arithmetic locally here)
        const currentOrders = await db.order.findMany({
            where: {
                createdAt: { gte: startOfMonth },
                status: { notIn: [OrderStatus.CANCELED, OrderStatus.RETURNED] }
            },
            include: {
                orderItems: {
                    include: {
                        variant: {
                            include: {
                                product: true
                            }
                        }
                    }
                }
            }
        })

        let revenue = new Prisma.Decimal(0)
        let cogsTotal = new Prisma.Decimal(0)

        for (const order of currentOrders) {
            revenue = revenue.add(new Prisma.Decimal(order.totalAmount.toString()))
            for (const item of order.orderItems) {
                const itemCogs = new Prisma.Decimal(item.variant.product.cogs.toString()).mul(new Prisma.Decimal(item.quantity))
                cogsTotal = cogsTotal.add(itemCogs)
            }
        }

        const grossProfit = revenue.sub(cogsTotal)

        return {
            success: true,
            data: {
                revenue: revenue.toNumber(),
                cogs: cogsTotal.toNumber(),
                grossProfit: grossProfit.toNumber(),
                orderCount: currentOrders.length
            }
        }

    } catch (error: any) {
        return { success: false, error: error.message || "Failed to fetch analytics" }
    }
}

// --- 3. Order Status Modification logic ---
export async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
    try {
        await checkRole(["SUPERADMIN", "SALES_ADMIN"])

        const order = await db.order.findUnique({
            where: { id: orderId },
            include: { orderItems: true }
        })

        if (!order) throw new Error("Order not found")

        // If returned, invoke RESTOCK logic
        if (newStatus === OrderStatus.RETURNED && order.status !== OrderStatus.RETURNED) {
            await db.$transaction(async (tx) => {
                for (const item of order.orderItems) {
                    await tx.productVariant.update({
                        where: { id: item.variantId },
                        data: { stockCount: { increment: item.quantity } }
                    })
                }
            })
        }

        const updatedOrder = await db.order.update({
            where: { id: orderId },
            data: { status: newStatus }
        })

        revalidatePath("/admin/sales")
        return { success: true, data: updatedOrder }
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to edit order status" }
    }
}


// --- 4. User Cart Retention ---
export async function saveCart(userId: string | null, cartData: any) {
    try {
        if (!userId) {
            // Unauthenticated cart session logic could rely on localstorage + server mapping.
            return { success: true, placeholder: true }
        }

        const cart = await db.abandonedCart.create({
            data: {
                userId: userId,
                cartData: cartData
            }
        })

        return { success: true, data: cart }
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to save cart" }
    }
}
