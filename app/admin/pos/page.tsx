"use client"

import { useState } from "react"
import { Search, Plus, ShoppingCart, Calculator, MonitorSmartphone, Printer } from "lucide-react"

// Mock Products for the POS catalog
const products = [
    { id: "1", title: "Organic Cotton Onesie", sku: "BLU-0-3", price: 1500, stock: 12 },
    { id: "2", title: "Knitted Baby Booties", sku: "PNK-0-3", price: 800, stock: 5 },
    { id: "3", title: "Bamboo Muslin Swaddle", sku: "WHT-ALL", price: 2100, stock: 0 },
]

export default function POSPage() {
    const [cart, setCart] = useState<{ id: string; title: string; qty: number; price: number }[]>([])

    const addToCart = (product: typeof products[0]) => {
        if (product.stock === 0) return
        const existing = cart.find(c => c.id === product.id)
        if (existing) {
            setCart(cart.map(c => c.id === product.id ? { ...c, qty: c.qty + 1 } : c))
        } else {
            setCart([...cart, { id: product.id, title: product.title, qty: 1, price: product.price }])
        }
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0)

    return (
        <div className="h-[calc(100vh-theme(spacing.16))] bg-slate-100 flex flex-col md:flex-row overflow-hidden">
            {/* Left: Product Catalog */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-[#D1D1D1]">
                <div className="p-4 bg-white border-b border-[#D1D1D1] flex items-center justify-between gap-4 shrink-0">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Scan barcode or search products..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#C8D9E6] transition-shadow outline-none"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {products.map(p => (
                            <button
                                key={p.id}
                                onClick={() => addToCart(p)}
                                disabled={p.stock === 0}
                                className={`text-left p-4 rounded-2xl border transition-all ${p.stock === 0 ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-[#D1D1D1] hover:border-[#C8D9E6] hover:shadow-md cursor-pointer group'}`}
                            >
                                <div className="aspect-square bg-slate-100 rounded-xl mb-3 flex items-center justify-center text-slate-300 group-hover:bg-[#EEF4F9] transition-colors"><MonitorSmartphone className="w-8 h-8" /></div>
                                <h3 className="font-bold text-slate-800 text-sm truncate">{p.title}</h3>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-[#2D5068] font-semibold text-sm">RS {p.price}</span>
                                    {p.stock === 0 ? <span className="text-xs font-bold text-rose-500">Out</span> : <span className="text-xs text-emerald-600 font-medium">{p.stock} left</span>}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right: Current Ticket */}
            <div className="w-full md:w-[400px] lg:w-[450px] bg-white flex flex-col shrink-0 relative z-10 shadow-[-4px_0_24px_-12px_rgba(0,0,0,0.1)]">
                <div className="p-4 bg-[#F5F5F5] border-b border-[#D1D1D1] flex items-center justify-between shrink-0">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2"><ShoppingCart className="w-5 h-5" /> Current Ticket</h2>
                    <button onClick={() => setCart([])} className="text-xs font-bold text-rose-500 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors">Clear</button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                            <ShoppingCart className="w-12 h-12 mb-4" />
                            <p className="font-medium">Ticket is empty</p>
                            <p className="text-sm">Scan items to begin</p>
                        </div>
                    ) : cart.map(item => (
                        <div key={item.id} className="flex justify-between items-start group">
                            <div className="flex-1 pr-4">
                                <h4 className="font-bold text-slate-800 text-sm line-clamp-2 leading-tight">{item.title}</h4>
                                <div className="text-xs font-medium text-slate-500 mt-1">RS {item.price} × {item.qty}</div>
                            </div>
                            <div className="font-bold text-slate-800 tabular-nums">RS {item.price * item.qty}</div>
                        </div>
                    ))}
                </div>

                {/* Totals & Actions */}
                <div className="p-4 bg-white border-t border-[#D1D1D1] shrink-0 space-y-4">
                    <div className="space-y-2 text-sm font-medium">
                        <div className="flex justify-between text-slate-500"><span>Subtotal</span> <span>RS {total}</span></div>
                        <div className="flex justify-between text-slate-500"><span>Tax (Included 13%)</span> <span>RS {Math.round(total * 0.13)}</span></div>
                        <div className="flex justify-between text-2xl font-black text-slate-800 pt-2 border-t border-slate-100">
                            <span>Total</span>
                            <span>RS {total}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <button disabled={cart.length === 0} className="py-4 rounded-xl font-bold bg-[#C8D9E6] hover:bg-[#A8BDD0] disabled:opacity-50 text-slate-800 flex items-center justify-center gap-2 transition-colors">
                            <Calculator className="w-5 h-5" /> Pay
                        </button>
                        <button disabled={cart.length === 0} className="py-4 rounded-xl font-bold bg-[#F5F5F5] hover:bg-[#E5E5E5] disabled:opacity-50 text-slate-700 flex items-center justify-center gap-2 transition-colors">
                            <Printer className="w-5 h-5" /> Print Bill
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
