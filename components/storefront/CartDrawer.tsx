"use client"

import { useState, useEffect } from "react"
import { useCart } from "@/store/cartStore"
import { ShoppingBag, Minus, Plus, X, ArrowRight, Tag } from "lucide-react"
import Link from "next/link"
import NextImage from "next/image"

interface CartDrawerProps {
    isOpen: boolean
    onClose: () => void
}

const VAT_RATE = 0.13

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
    const { items, removeItem, updateQuantity, cartTotal, cartCount } = useCart()
    const [discountCode, setDiscountCode] = useState("")

    const subtotal = cartTotal
    const vat = subtotal * VAT_RATE
    const total = subtotal + vat

    // Lock body scroll when open
    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "unset"
        return () => { document.body.style.overflow = "unset" }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />

            {/* Drawer Panel */}
            <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl border-l border-slate-200/50 sm:rounded-l-[2.5rem] overflow-hidden animate-in slide-in-from-right duration-300">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-6 border-b border-slate-100 bg-white/80 backdrop-blur-sm z-10 sticky top-0">
                    <h2 className="font-serif text-xl text-slate-800 flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-[#2D5068]" />
                        Your Cart
                        {cartCount > 0 && (
                            <span className="text-sm font-medium text-[#2D5068] bg-[#EEF4F9] px-2 py-0.5 rounded-full ml-1">
                                {cartCount} item{cartCount !== 1 ? "s" : ""}
                            </span>
                        )}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center gap-4 text-slate-400 py-20">
                            <ShoppingBag className="w-16 h-16 text-slate-200" />
                            <p className="font-medium text-slate-500">Your cart is empty</p>
                            <p className="text-sm">Add some beautiful pieces for your little one!</p>
                            <button onClick={onClose} className="mt-2 text-[#2D5068] font-semibold text-sm hover:text-[#2D5068]">
                                Continue Shopping →
                            </button>
                        </div>
                    ) : (
                        items.map(item => (
                            <div key={item.variantId} className="bg-white rounded-2xl p-4 border border-amber-50 flex gap-4 items-start shadow-sm">
                                {/* Emoji thumbnail */}
                                <div className="w-16 h-16 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden border border-slate-100">
                                    {item.image ? (
                                        <NextImage
                                            src={item.image}
                                            alt={item.title}
                                            width={64}
                                            height={64}
                                            className="w-full h-full object-cover transition-transform hover:scale-110 duration-500"
                                            sizes="64px"
                                        />
                                    ) : (
                                        <div className="text-2xl opacity-50">🍼</div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="font-semibold text-slate-800 text-sm leading-tight line-clamp-2 pr-2">{item.title}</p>
                                        <button onClick={() => removeItem(item.variantId)} className="text-slate-300 hover:text-red-400 transition-colors shrink-0 p-1 -mr-1">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">{item.size} · {item.color}</p>

                                    <div className="flex items-center justify-between mt-3">
                                        {/* Quantity controls */}
                                        <div className="flex items-center gap-1 bg-slate-50 rounded-full p-1 border border-slate-100">
                                            <button
                                                onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                                                className="w-6 h-6 rounded-full hover:bg-white flex items-center justify-center transition-colors text-slate-500"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="w-7 text-center text-sm font-semibold text-slate-700">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                                                className="w-6 h-6 rounded-full hover:bg-white flex items-center justify-center transition-colors text-slate-500"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <p className="font-bold text-slate-800 text-sm">Rs. {(item.price * item.quantity).toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer — only when cart has items */}
                {items.length > 0 && (
                    <div className="px-6 py-5 bg-white border-t border-[#D1D1D1] space-y-4">
                        {/* Discount Code */}
                        <div className="flex gap-2">
                            <div className="flex-1 flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:border-[#A8BDD0] transition-colors">
                                <Tag className="w-4 h-4 text-slate-400 shrink-0" />
                                <input
                                    type="text"
                                    placeholder="Discount code"
                                    value={discountCode}
                                    onChange={e => setDiscountCode(e.target.value)}
                                    className="bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400 w-full"
                                />
                            </div>
                            <button className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                                Apply
                            </button>
                        </div>

                        {/* Totals */}
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-slate-500">
                                <span>Subtotal</span>
                                <span>Rs. {subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-slate-500">
                                <span>VAT (13%)</span>
                                <span>Rs. {vat.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-slate-800 text-base border-t border-slate-100 pt-2 mt-2">
                                <span>Total</span>
                                <span>Rs. {total.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* CTA */}
                        <Link href="/checkout" onClick={onClose}>
                            <button className="w-full bg-primary hover:opacity-90 text-primary-foreground font-semibold py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2">
                                Proceed to Checkout <ArrowRight className="w-4 h-4" />
                            </button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
