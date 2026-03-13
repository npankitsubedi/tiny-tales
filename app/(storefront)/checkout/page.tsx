"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useCart } from "@/store/cartStore"
import { createOrder } from "@/app/actions/sales"
import { generateEsewaPayload, initiateKhaltiPayment } from "@/app/actions/payments"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { ShoppingBag, MessageCircle, CreditCard, Truck } from "lucide-react"
import { formatRs } from "@/lib/currency"
import FormStatusButton from "@/components/ui/FormStatusButton"

const DELIVERY_CITIES = ["Kathmandu", "Lalitpur", "Bhaktapur", "Outside Valley"]

const checkoutSchema = z.object({
    customerName: z.string().min(2, "Name is required"),
    contactPhone: z.string().min(7, "Valid phone number required"),
    address: z.string().min(5, "Address is required"),
    deliveryCity: z.string().optional(),
    country: z.string().min(2, "Country is required"),
    babyAgeMonths: z.coerce.number().min(0).max(60).optional(),
    paymentMethod: z.string().min(1, "Select a payment method"),
})
type CheckoutForm = z.infer<typeof checkoutSchema>

const NEPAL_PAYMENT_OPTIONS = [
    { value: "COD", label: "Cash on Delivery", icon: "💵", desc: "Pay when you receive" },
    { value: "ESEWA", label: "eSewa", icon: "🟢", desc: "Nepal's #1 digital wallet" },
    { value: "KHALTI", label: "Khalti", icon: "🟣", desc: "Fast & secure payment" },
    { value: "BANK", label: "Bank Transfer", icon: "🏦", desc: "Direct bank deposit" },
]

export default function CheckoutPage() {
    const { items, cartTotal, clearCart } = useCart()
    const router = useRouter()
    const [isProcessing, setIsProcessing] = useState(false)
    const [processingStep, setProcessingStep] = useState("")

    const { register, handleSubmit, watch, formState: { errors } } = useForm<CheckoutForm>({
        resolver: zodResolver(checkoutSchema) as any,
        defaultValues: { country: "Nepal", paymentMethod: "COD" }
    })

    const selectedCountry = watch("country")
    const selectedPayment = watch("paymentMethod")
    const isNepal = selectedCountry.trim().toLowerCase() === "nepal"
    const vat = cartTotal * 0.13
    const total = cartTotal + vat
    const submitCheckout = async () => {
        await handleSubmit(onSubmit)()
    }

    // ── Shared order creation (creates DB record in PENDING state) ──
    const placeOrder = async (data: CheckoutForm) => {
        const result = await createOrder({
            customerName: data.customerName,
            contactPhone: data.contactPhone,
            shippingAddress: `${data.address}, ${isNepal && data.deliveryCity ? data.deliveryCity : data.country}`,
            deliveryCity: data.deliveryCity,
            babyAgeMonths: data.babyAgeMonths,
            isInternational: !isNepal,
            paymentMethod: data.paymentMethod,
            items: items.map(i => ({ variantId: i.variantId, quantity: i.quantity }))
        })
        return result
    }

    const onSubmit = async (data: CheckoutForm) => {
        if (items.length === 0) { toast.error("Your cart is empty!"); return }
        setIsProcessing(true)

        try {
            // ── INTERNATIONAL → WhatsApp ──
            if (!isNepal) {
                const itemList = items.map(i => `• ${i.quantity}x ${i.title} (${i.size}, ${i.color}) — ${formatRs(i.price * i.quantity)}`).join("\n")
                const message = `Hi Tiny Tales! 👋\n\nI'd like to place an international order:\n\n${itemList}\n\n📦 *Total: ${formatRs(total)}* (incl. 13% VAT)\n\n📍 Ship to:\n${data.customerName}\n${data.address}, ${data.deliveryCity || data.country}, ${data.country}\n📞 ${data.contactPhone}\n\nPlease help me finalize shipping!`
                window.open(`https://wa.me/9779800000000?text=${encodeURIComponent(message)}`, "_blank")
                setIsProcessing(false)
                return
            }

            // ── COD / BANK → Direct order finalization ──
            if (data.paymentMethod === "COD" || data.paymentMethod === "BANK") {
                setProcessingStep("Placing your order…")
                const result = await placeOrder(data)
                if (!result.success) {
                    toast.error(result.error || "Failed to place order.")
                    return
                }
                clearCart()
                router.push(`/checkout/success?orderId=${result.data.order.id}`)
                return
            }

            // ── eSEWA → Create PENDING order → Sign payload → Submit hidden form ──
            if (data.paymentMethod === "ESEWA") {
                setProcessingStep("Preparing eSewa payment…")
                const orderResult = await placeOrder(data)
                if (!orderResult.success) {
                    toast.error(orderResult.error || "Could not create order.")
                    return
                }
                if (!orderResult.data) return
                const orderId = orderResult.data.order.id
                const esewaResult = await generateEsewaPayload(orderId, total)
                if (!esewaResult.success) {
                    toast.error(esewaResult.error)
                    return
                }

                // Build and auto-submit a hidden HTML form to eSewa
                const form = document.createElement("form")
                form.method = "POST"
                form.action = esewaResult.endpoint
                Object.entries(esewaResult.payload).forEach(([key, value]) => {
                    const input = document.createElement("input")
                    input.type = "hidden"
                    input.name = key
                    input.value = value
                    form.appendChild(input)
                })
                document.body.appendChild(form)
                form.submit()
                return
            }

            // ── KHALTI → Create PENDING order → Server-side initiation → Redirect ──
            if (data.paymentMethod === "KHALTI") {
                setProcessingStep("Connecting to Khalti…")
                const orderResult = await placeOrder(data)
                if (!orderResult.success) {
                    toast.error(orderResult.error || "Could not create order.")
                    return
                }
                if (!orderResult.data) return
                const orderId = orderResult.data.order.id
                const khaltiResult = await initiateKhaltiPayment(
                    orderId,
                    total * 100, // Convert NPR to paisa
                    { name: data.customerName, phone: data.contactPhone }
                )
                if (!khaltiResult.success) {
                    toast.error(khaltiResult.error)
                    return
                }
                window.location.href = khaltiResult.payment_url
                return
            }

        } catch {
            toast.error("Something went wrong. Please try again.")
        } finally {
            setIsProcessing(false)
            setProcessingStep("")
        }
    }

    if (items.length === 0) return (
        <div className="min-h-screen bg-white flex items-center justify-center text-center px-4">
            <div>
                <ShoppingBag className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h2 className="font-serif text-2xl text-slate-700 mb-2">Your cart is empty</h2>
                <p className="text-slate-500 mb-6">Add some products before checking out.</p>
                <Link href="/shop" className="bg-orange-600 px-6 py-3 rounded-full font-semibold text-white transition-colors hover:bg-orange-700">Browse Shop</Link>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-white py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="font-serif text-4xl text-slate-800 mb-10">Checkout</h1>

                <form action={submitCheckout} className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
                    {/* ── Shipping Form ── */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-3xl border border-amber-50 shadow-sm p-8 space-y-5">
                            <h2 className="font-semibold text-slate-800 text-lg flex items-center gap-2">
                                <Truck className="w-5 h-5 text-amber-500" /> Shipping Details
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                    <input {...register("customerName")} placeholder="Sita Thapa"
                                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#A8BDD0] focus:ring-2 focus:ring-amber-100 transition-all bg-slate-50/50" />
                                    {errors.customerName && <p className="text-xs text-red-500 mt-1">{errors.customerName.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                                    <input {...register("contactPhone")} placeholder="+977 98XXXXXXXX"
                                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#A8BDD0] focus:ring-2 focus:ring-amber-100 transition-all bg-slate-50/50" />
                                    {errors.contactPhone && <p className="text-xs text-red-500 mt-1">{errors.contactPhone.message}</p>}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Street Address</label>
                                <input {...register("address")} placeholder="Thamel, Kathmandu"
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#A8BDD0] focus:ring-2 focus:ring-amber-100 transition-all bg-slate-50/50" />
                                {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Delivery City — Nepal only */}
                                {isNepal ? (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Delivery Area</label>
                                        <select {...register("deliveryCity")}
                                            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#A8BDD0] transition-all bg-slate-50/50">
                                            <option value="">Select area</option>
                                            {DELIVERY_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                                        <select {...register("country")}
                                            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#A8BDD0] transition-all bg-slate-50/50">
                                            <option value="Nepal">Nepal 🇳🇵</option>
                                            <option value="India">India 🇮🇳</option>
                                            <option value="USA">United States 🇺🇸</option>
                                            <option value="UK">United Kingdom 🇬🇧</option>
                                            <option value="Australia">Australia 🇦🇺</option>
                                            <option value="Canada">Canada 🇨🇦</option>
                                            <option value="UAE">UAE 🇦🇪</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                )}
                                {/* Baby Age — helps with size/product recommendation */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        👶 Baby&apos;s Age <span className="text-slate-400 font-normal">(months, optional)</span>
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={60}
                                        {...register("babyAgeMonths")}
                                        placeholder="e.g. 6"
                                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#A8BDD0] focus:ring-2 focus:ring-amber-100 transition-all bg-slate-50/50"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Helps us recommend the right size</p>
                                </div>
                            </div>
                        </div>

                        {/* ── Conditional Payment Section ── */}
                        <div className="bg-white rounded-3xl border border-amber-50 shadow-sm p-8">
                            <h2 className="font-semibold text-slate-800 text-lg mb-5 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-amber-500" /> Payment Method
                            </h2>
                            {isNepal ? (
                                <div className="grid grid-cols-2 gap-3">
                                    {NEPAL_PAYMENT_OPTIONS.map(opt => (
                                        <label key={opt.value} className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedPayment === opt.value ? "border-[#A8BDD0] bg-[#EEF4F9]" : "border-slate-100 bg-slate-50/50 hover:border-slate-200"}`}>
                                            <input type="radio" {...register("paymentMethod")} value={opt.value} className="sr-only" />
                                            <span className="text-2xl">{opt.icon}</span>
                                            <div><p className="font-semibold text-slate-800 text-sm">{opt.label}</p><p className="text-xs text-slate-400">{opt.desc}</p></div>
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center space-y-3">
                                    <MessageCircle className="w-10 h-10 text-[#25D366] mx-auto" />
                                    <h3 className="font-semibold text-slate-800">International Order</h3>
                                    <p className="text-sm text-slate-500 max-w-sm mx-auto">For international shipping, we'll finalize costs & payment over WhatsApp.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Order Summary ── */}
                    <div className="lg:sticky lg:top-24">
                        <div className="bg-white rounded-3xl border border-amber-50 shadow-sm p-6 space-y-4">
                            <h2 className="font-semibold text-slate-800 text-base">Order Summary</h2>
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {items.map(item => (
                                    <div key={item.variantId} className="flex justify-between items-start text-sm">
                                        <div>
                                            <p className="font-medium text-slate-800 line-clamp-1">{item.title}</p>
                                            <p className="text-xs text-slate-400">{item.size} · {item.color} · x{item.quantity}</p>
                                        </div>
                                        <span className="font-medium text-slate-800 shrink-0 ml-2">{formatRs(item.price * item.quantity)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-slate-100 pt-4 space-y-2 text-sm">
                                <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{formatRs(cartTotal)}</span></div>
                                <div className="flex justify-between text-slate-500"><span>VAT (13%)</span><span>{formatRs(vat)}</span></div>
                                <div className="flex justify-between font-bold text-slate-800 text-base pt-2 border-t border-slate-100">
                                    <span>Total</span><span>{formatRs(total)}</span>
                                </div>
                            </div>

                            <FormStatusButton
                                externalLoading={isProcessing}
                                loadingText={processingStep || "Processing..."}
                                className={`w-full font-semibold py-4 rounded-2xl transition-all shadow-lg text-white flex items-center justify-center gap-2 ${isNepal ? "bg-orange-600 hover:bg-orange-700" : "bg-[#25D366] hover:bg-[#20bd5a]"}`}
                            >
                                {isNepal ? (
                                    `Place Order — ${formatRs(total)}`
                                ) : (
                                    <><MessageCircle className="w-5 h-5" /> Contact on WhatsApp</>
                                )}
                            </FormStatusButton>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
