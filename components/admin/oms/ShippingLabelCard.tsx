"use client"

import { useState } from "react"
import { MapPin, Copy, Check } from "lucide-react"
import toast from "react-hot-toast"

interface ShippingLabelCardProps {
    customerName: string | null
    contactPhone: string | null
    shippingAddress: string | null
    deliveryCity: string | null
}

export default function ShippingLabelCard({
    customerName,
    contactPhone,
    shippingAddress,
    deliveryCity,
}: ShippingLabelCardProps) {
    const [copied, setCopied] = useState(false)

    const fullAddress = [
        customerName,
        contactPhone,
        shippingAddress,
        deliveryCity,
        "Nepal"
    ].filter(Boolean).join("\n")

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(fullAddress)
            setCopied(true)
            toast.success("Address copied to clipboard!")
            setTimeout(() => setCopied(false), 2000)
        } catch {
            toast.error("Failed to copy — try again")
        }
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" /> Shipping Label
                </h3>
                <button
                    onClick={handleCopy}
                    title="Copy address to clipboard"
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-orange-600 hover:bg-orange-50 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-orange-200 transition-all"
                >
                    {copied ? (
                        <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copied!</>
                    ) : (
                        <><Copy className="w-3.5 h-3.5" /> Copy</>
                    )}
                </button>
            </div>

            {/* Physical label look */}
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 bg-slate-50/50 font-mono text-sm space-y-1">
                {/* To */}
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-sans mb-2">Ship To:</p>
                {customerName && (
                    <p className="font-bold text-slate-800 font-sans">{customerName}</p>
                )}
                {contactPhone && (
                    <p className="text-slate-600 text-xs">{contactPhone}</p>
                )}
                {shippingAddress ? (
                    <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-line">{shippingAddress}</p>
                ) : (
                    <p className="text-slate-400 text-xs italic">No address on file</p>
                )}
                {deliveryCity && (
                    <p className="text-slate-700 text-xs font-semibold">{deliveryCity}</p>
                )}
                <p className="text-slate-500 text-xs">Nepal</p>

                {/* From */}
                <div className="pt-3 mt-3 border-t border-dashed border-slate-200">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-sans mb-1">From:</p>
                    <p className="font-bold text-slate-700 text-xs font-sans">Tiny Tales</p>
                    <p className="text-slate-500 text-xs">Kathmandu, Nepal</p>
                    <p className="text-slate-500 text-xs">hello@tinytales.com.np</p>
                </div>
            </div>
        </div>
    )
}
