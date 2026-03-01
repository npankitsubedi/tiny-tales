import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { useEffect, useState } from "react"

export type CartItem = {
    variantId: string
    productId: string
    title: string
    price: number
    quantity: number
    size: string
    color: string
    image?: string
}

type CartState = {
    items: CartItem[]
    addItem: (item: CartItem) => void
    removeItem: (variantId: string) => void
    updateQuantity: (variantId: string, quantity: number) => void
    clearCart: () => void
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (newItem) => {
                const existing = get().items.find(i => i.variantId === newItem.variantId)
                if (existing) {
                    set(state => ({
                        items: state.items.map(i =>
                            i.variantId === newItem.variantId
                                ? { ...i, quantity: i.quantity + newItem.quantity }
                                : i
                        )
                    }))
                } else {
                    set(state => ({ items: [...state.items, newItem] }))
                }
            },

            removeItem: (variantId) => {
                set(state => ({ items: state.items.filter(i => i.variantId !== variantId) }))
            },

            updateQuantity: (variantId, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(variantId)
                    return
                }
                set(state => ({
                    items: state.items.map(i =>
                        i.variantId === variantId ? { ...i, quantity } : i
                    )
                }))
            },

            clearCart: () => set({ items: [] }),
        }),
        {
            name: "tiny-tales-cart",
            storage: createJSONStorage(() => localStorage),
        }
    )
)

// ── Computed selectors ──
export const cartCount = (items: CartItem[]) =>
    items.reduce((sum, i) => sum + i.quantity, 0)

export const cartTotal = (items: CartItem[]) =>
    items.reduce((sum, i) => sum + i.price * i.quantity, 0)

// ── Hydration-safe hook ──
// Prevents SSR/client mismatch by returning empty state until mounted.
export function useCart() {
    const [mounted, setMounted] = useState(false)
    const store = useCartStore()

    useEffect(() => { setMounted(true) }, [])

    if (!mounted) {
        return {
            items: [] as CartItem[],
            cartCount: 0,
            cartTotal: 0,
            addItem: store.addItem,
            removeItem: store.removeItem,
            updateQuantity: store.updateQuantity,
            clearCart: store.clearCart,
        }
    }

    return {
        ...store,
        cartCount: cartCount(store.items),
        cartTotal: cartTotal(store.items),
    }
}
