"use client"

import { useState } from "react"
import { OrderStatus } from "@prisma/client"
import OrderKanban from "@/components/admin/OrderKanban"
import OrderDetailModal from "@/components/admin/OrderDetailModal"

interface SalesCommandCenterClientProps {
    initialOrders: any[]
    updateStatusAction: (id: string, s: OrderStatus) => Promise<boolean>
}

// Thin interactive layer bringing Modals and Drag-and-drop seamlessly together.
export default function SalesCommandCenterClient({ initialOrders, updateStatusAction }: SalesCommandCenterClientProps) {
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

    const activeOrder = selectedOrderId
        ? initialOrders.find(o => o.id === selectedOrderId)
        : null

    return (
        <div className="flex-1 w-full min-h-[700px]">
            <OrderKanban
                initialOrders={initialOrders}
                onStatusChange={updateStatusAction}
                onOrderClick={(id) => setSelectedOrderId(id)}
            />

            <OrderDetailModal
                order={activeOrder}
                isOpen={!!selectedOrderId}
                onClose={() => setSelectedOrderId(null)}
            />
        </div>
    )
}
