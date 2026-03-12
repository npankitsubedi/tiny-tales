import { formatRs } from "@/lib/currency"
import { User, Phone, Mail, ShoppingBag } from "lucide-react"

interface CustomerProfileCardProps {
    customerName: string | null
    contactPhone: string | null
    email: string | null
    lifetimeOrders: number
    lifetimeValue: number
    isInternational: boolean
}

export default function CustomerProfileCard({
    customerName,
    contactPhone,
    email,
    lifetimeOrders,
    lifetimeValue,
    isInternational
}: CustomerProfileCardProps) {
    const initials = customerName
        ? customerName.trim().split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
        : "?"

    const lifetimeTag =
        lifetimeOrders === 1
            ? "First-time customer"
            : `${lifetimeOrders} orders · ${formatRs(lifetimeValue)} lifetime`

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <User className="w-3.5 h-3.5" /> Customer
            </h3>

            <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
                    {initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 leading-tight truncate">
                        {customerName ?? "Guest User"}
                    </p>

                    {/* Lifetime Tag */}
                    <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-100">
                        <ShoppingBag className="w-2.5 h-2.5" />
                        {lifetimeTag}
                    </span>

                    {isInternational && (
                        <span className="ml-1.5 inline-flex items-center mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                            🌏 International
                        </span>
                    )}
                </div>
            </div>

            {/* Contact */}
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                {contactPhone && (
                    <a
                        href={`tel:${contactPhone}`}
                        className="flex items-center gap-2.5 text-sm text-slate-600 hover:text-orange-600 transition-colors group"
                    >
                        <Phone className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-500" />
                        {contactPhone}
                    </a>
                )}
                {email && (
                    <a
                        href={`mailto:${email}`}
                        className="flex items-center gap-2.5 text-sm text-slate-600 hover:text-orange-600 transition-colors group truncate"
                    >
                        <Mail className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-500 flex-shrink-0" />
                        <span className="truncate">{email}</span>
                    </a>
                )}
                {!contactPhone && !email && (
                    <p className="text-xs text-slate-400">No contact info provided</p>
                )}
            </div>
        </div>
    )
}
