"use client"

import { useState, useEffect } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { OrderStatus } from "@prisma/client"
import { formatDistanceToNow } from "date-fns"
import { Clock, MapPin, Package } from "lucide-react"
import toast from "react-hot-toast"

// Types matching the raw Prisma inclusive records
type KanbanOrder = {
    id: string
    customerName: string | null
    totalAmount: string // Number coerced to String dynamically from Decimal
    status: OrderStatus
    createdAt: Date
    isInternational: boolean
}

type ColumnsMapping = {
    [key in OrderStatus]: KanbanOrder[]
}

const COLUMNS: OrderStatus[] = [
    OrderStatus.PENDING,
    OrderStatus.PROCESSING,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
    OrderStatus.RETURNED,
    OrderStatus.CANCELED
]

const STATUS_COLORS: Record<OrderStatus, string> = {
    PENDING: "bg-amber-50 border-amber-200 text-amber-800",
    PROCESSING: "bg-blue-50 border-blue-200 text-blue-800",
    SHIPPED: "bg-indigo-50 border-indigo-200 text-indigo-800",
    DELIVERED: "bg-emerald-50 border-emerald-200 text-emerald-800",
    RETURNED: "bg-orange-50 border-orange-200 text-orange-800",
    CANCELED: "bg-slate-50 border-slate-200 text-slate-800"
}

interface OrderKanbanProps {
    initialOrders: KanbanOrder[]
    onStatusChange: (orderId: string, newStatus: OrderStatus) => Promise<boolean>
    onOrderClick: (orderId: string) => void
}

export default function OrderKanban({ initialOrders, onStatusChange, onOrderClick }: OrderKanbanProps) {
    const [columns, setColumns] = useState<ColumnsMapping>({} as ColumnsMapping)
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
        // Group orders by their current status immediately
        const initialCols = COLUMNS.reduce((acc, status) => {
            acc[status] = initialOrders.filter(o => o.status === status)
            return acc
        }, {} as ColumnsMapping)

        setColumns(initialCols)
    }, [initialOrders])

    const handleDragEnd = async (result: any) => {
        const { destination, source, draggableId } = result

        // Dropped outside or into exactly the same exact position
        if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
            return
        }

        const sourceCol = source.droppableId as OrderStatus
        const destCol = destination.droppableId as OrderStatus

        // Optimistically update local array state maintaining snappy UX
        const startColumnList = Array.from(columns[sourceCol])
        const targetColumnList = sourceCol === destCol ? startColumnList : Array.from(columns[destCol])

        const [movedOrder] = startColumnList.splice(source.index, 1)
        movedOrder.status = destCol
        targetColumnList.splice(destination.index, 0, movedOrder)

        setColumns({
            ...columns,
            [sourceCol]: startColumnList,
            [destCol]: targetColumnList
        })

        // Fire to the Server using the imported Next.js Action wrapper
        if (sourceCol !== destCol) {
            const success = await onStatusChange(draggableId, destCol)
            if (!success) {
                toast.error("Status update failed. Reverting order.")
                // Rollback cleanly to the snapshot before optimistic mutation 
                setColumns(columns)
            } else {
                toast.success(`Order moved to ${destCol}`)
            }
        }
    }

    if (!isClient) return <div className="animate-pulse flex gap-4 h-[600px] bg-slate-100 rounded-3xl" />

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-6 overflow-x-auto pb-8 snap-x">
                {COLUMNS.map((statusId) => (
                    <div key={statusId} className="min-w-[320px] max-w-[320px] flex flex-col snap-start">

                        {/* Column Header */}
                        <div className="flex items-center justify-between mb-4 px-1">
                            <h3 className="font-semibold text-slate-700 tracking-tight flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[statusId].split(' ')[0]}`} />
                                {statusId}
                            </h3>
                            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                                {columns[statusId]?.length || 0}
                            </span>
                        </div>

                        {/* Drop Zone */}
                        <Droppable droppableId={statusId}>
                            {(provided, snapshot) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className={`flex-1 rounded-2xl p-3 min-h-[500px] transition-colors border-2 border-dashed ${snapshot.isDraggingOver ? "bg-slate-50 border-slate-300" : "bg-slate-50/50 border-transparent"
                                        }`}
                                >
                                    {columns[statusId]?.map((order, index) => (
                                        <Draggable key={order.id} draggableId={order.id} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    onClick={() => onOrderClick(order.id)}
                                                    className={`mb-3 p-4 bg-white rounded-xl shadow-sm border ${STATUS_COLORS[statusId].split(' ')[1]} transition-all cursor-pointer hover:shadow-md ${snapshot.isDragging ? "shadow-lg rotate-2 scale-105 z-50" : ""
                                                        }`}
                                                >

                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-xs font-mono text-slate-500 font-medium tracking-tighter">
                                                            #{order.id.slice(-6).toUpperCase()}
                                                        </span>
                                                        <span className="text-sm font-bold text-slate-800">
                                                            ${order.totalAmount}
                                                        </span>
                                                    </div>

                                                    <h4 className="font-medium text-slate-800 text-base mb-3 line-clamp-1">
                                                        {order.customerName || "Guest Customer"}
                                                    </h4>

                                                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                            {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                                                        </div>

                                                        {order.isInternational && (
                                                            <div className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                                                <MapPin className="w-3" /> INT
                                                            </div>
                                                        )}
                                                    </div>

                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </div>
                ))}
            </div>
        </DragDropContext>
    )
}
