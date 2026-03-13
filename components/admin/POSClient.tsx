"use client"

import { useMemo, useState } from "react"
import { Search, ShoppingCart, Calculator, MonitorSmartphone, Printer } from "lucide-react"
import { formatRs } from "@/lib/currency"
import toast from "react-hot-toast"

type POSProduct = {
    id: string
    title: string
    price: number
    stock: number
}

type CartItem = {
    id: string
    title: string
    qty: number
    price: number
}

export default function POSClient({ products }: { products: POSProduct[] }) {
    const [cart, setCart] = useState<CartItem[]>([])
    const [searchTerm, setSearchTerm] = useState("")

    const filteredProducts = useMemo(() => {
        const query = searchTerm.trim().toLowerCase()

        if (!query) {
            return products
        }

        return products.filter((product) =>
            product.title.toLowerCase().includes(query)
        )
    }, [products, searchTerm])

    const addToCart = (product: POSProduct) => {
        if (product.stock === 0) return

        setCart((currentCart) => {
            const existingItem = currentCart.find((item) => item.id === product.id)

            if (existingItem) {
                return currentCart.map((item) =>
                    item.id === product.id ? { ...item, qty: item.qty + 1 } : item
                )
            }

            return [
                ...currentCart,
                { id: product.id, title: product.title, qty: 1, price: product.price },
            ]
        })
    }

    const handleComingSoon = (label: string) => {
        toast(`${label} is coming in the next update!`)
    }

    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0)
    const taxIncluded = total * 0.13

    return (
        <div className="flex h-[calc(100vh-theme(spacing.16))] flex-col overflow-hidden bg-slate-100 md:flex-row">
            <div className="flex min-w-0 flex-1 flex-col border-r border-slate-200 bg-white">
                <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white p-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Search live catalog..."
                            className="w-full rounded-xl bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none transition-shadow focus:ring-2 focus:ring-orange-200"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {filteredProducts.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-gray-50 px-6 text-center text-slate-500">
                            <MonitorSmartphone className="mb-4 h-12 w-12 text-slate-300" />
                            <p className="font-semibold text-slate-700">No products found</p>
                            <p className="mt-1 text-sm">Adjust the search or add products in Inventory.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
                            {filteredProducts.map((product) => (
                                <button
                                    key={product.id}
                                    type="button"
                                    onClick={() => addToCart(product)}
                                    disabled={product.stock === 0}
                                    className={`rounded-2xl border p-4 text-left transition-all ${
                                        product.stock === 0
                                            ? "cursor-not-allowed border-slate-200 bg-gray-50 opacity-60"
                                            : "group cursor-pointer border-slate-200 bg-white hover:border-orange-200 hover:shadow-md"
                                    }`}
                                >
                                    <div className="mb-3 flex aspect-square items-center justify-center rounded-xl bg-gray-50 text-slate-300 transition-colors group-hover:bg-orange-50">
                                        <MonitorSmartphone className="h-8 w-8" />
                                    </div>
                                    <h3 className="truncate text-sm font-bold text-slate-800">{product.title}</h3>
                                    <div className="mt-1 flex items-center justify-between">
                                        <span className="text-sm font-semibold text-orange-600">{formatRs(product.price)}</span>
                                        {product.stock === 0 ? (
                                            <span className="text-xs font-bold text-rose-500">Out</span>
                                        ) : (
                                            <span className="text-xs font-medium text-emerald-600">{product.stock} left</span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="relative z-10 flex w-full shrink-0 flex-col bg-white shadow-[-4px_0_24px_-12px_rgba(0,0,0,0.1)] md:w-[400px] lg:w-[450px]">
                <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-gray-50 p-4">
                    <h2 className="flex items-center gap-2 font-bold text-slate-800">
                        <ShoppingCart className="h-5 w-5" /> Current Ticket
                    </h2>
                    <button
                        type="button"
                        onClick={() => setCart([])}
                        className="rounded-lg px-3 py-1.5 text-xs font-bold text-rose-500 transition-colors hover:bg-rose-50"
                    >
                        Clear
                    </button>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                    {cart.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-slate-400 opacity-60">
                            <ShoppingCart className="mb-4 h-12 w-12" />
                            <p className="font-medium">Ticket is empty</p>
                            <p className="text-sm">Add products from the live catalog to begin</p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.id} className="group flex items-start justify-between">
                                <div className="flex-1 pr-4">
                                    <h4 className="line-clamp-2 text-sm font-bold leading-tight text-slate-800">{item.title}</h4>
                                    <div className="mt-1 text-xs font-medium text-slate-500">
                                        {formatRs(item.price)} x {item.qty}
                                    </div>
                                </div>
                                <div className="tabular-nums font-bold text-slate-800">{formatRs(item.price * item.qty)}</div>
                            </div>
                        ))
                    )}
                </div>

                <div className="shrink-0 space-y-4 border-t border-slate-200 bg-white p-4">
                    <div className="space-y-2 text-sm font-medium">
                        <div className="flex justify-between text-slate-500"><span>Subtotal</span> <span>{formatRs(total)}</span></div>
                        <div className="flex justify-between text-slate-500"><span>Tax (Included 13%)</span> <span>{formatRs(taxIncluded)}</span></div>
                        <div className="flex justify-between border-t border-slate-100 pt-2 text-2xl font-black text-slate-800">
                            <span>Total</span>
                            <span>{formatRs(total)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                            type="button"
                            disabled={cart.length === 0}
                            onClick={() => handleComingSoon("POS checkout")}
                            className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 py-4 font-bold text-white transition-all duration-200 hover:bg-orange-700 active:scale-95 disabled:opacity-50"
                        >
                            <Calculator className="h-5 w-5" /> Pay
                        </button>
                        <button
                            type="button"
                            disabled={cart.length === 0}
                            onClick={() => handleComingSoon("POS receipt printing")}
                            className="flex items-center justify-center gap-2 rounded-xl bg-gray-50 py-4 font-bold text-slate-700 transition-all duration-200 hover:bg-gray-100 active:scale-95 disabled:opacity-50"
                        >
                            <Printer className="h-5 w-5" /> Print Bill
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
