export const dynamic = 'force-dynamic';
import { db } from "@tinytales/db"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Settings, ShieldCheck } from "lucide-react"

import StoreDetailsForm from '@/features/settings/components/StoreDetailsForm'
import FinancialRulesForm from '@/features/settings/components/FinancialRulesForm'

export const metadata = {
    title: "Store Settings | Tiny Tales Admin",
    description: "Manage global store configuration, taxation, and shipping rules.",
}

export default async function SettingsPage() {
    const { userId, sessionClaims } = await auth()
    const role = (sessionClaims?.metadata as { role?: string })?.role
    if (!userId || role !== "SUPERADMIN") redirect("/")

    // Execute concurrent fetches for Settings Row and Admin Users
    const [settingsRow, superAdmins] = await Promise.all([
        db.storeSettings.findUnique({ where: { id: "default" } }),
        db.user.findMany({ 
            where: { role: "SUPERADMIN" },
            select: { id: true, name: true, email: true, createdAt: true }
        })
    ])

    // Serialize Decimal boundaries to pure JS primitive numbers
    const financialRulesPayload = {
        defaultTaxRate: settingsRow?.defaultTaxRate ? settingsRow.defaultTaxRate.toNumber() : 13,
        flatShippingFee: settingsRow?.flatShippingFee ? settingsRow.flatShippingFee.toNumber() : 100,
        freeShippingThreshold: settingsRow?.freeShippingThreshold ? settingsRow.freeShippingThreshold.toNumber() : 5000,
    }

    const storeDetailsPayload = {
        storeName: settingsRow?.storeName || 'Tiny Tales',
        supportEmail: settingsRow?.supportEmail || '',
        supportPhone: settingsRow?.supportPhone || '',
        physicalAddress: settingsRow?.physicalAddress || '',
    }

    return (
        <div className="min-h-screen p-6 md:p-10">
            <div className="max-w-4xl mx-auto space-y-8">
                
                {/* Header */}
                <header className="admin-glass sticky top-0 z-30 flex flex-col md:flex-row md:items-end justify-between gap-6 rounded-[1.75rem] border border-white/70 px-6 py-5 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.28)]">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-serif text-slate-800 tracking-tight flex items-center gap-3">
                                <Settings className="w-7 h-7 text-orange-600" />
                                Operational Settings
                            </h1>
                        </div>
                        <p className="admin-label mt-4 pl-10">Control Layer</p>
                        <p className="text-slate-500 mt-1 text-sm pl-10">
                            Global store configuration running the underlying tax and shipping algorithms.
                        </p>
                    </div>
                </header>

                <div className="space-y-6">
                    <StoreDetailsForm initialData={storeDetailsPayload} />
                    <FinancialRulesForm initialData={financialRulesPayload} />
                </div>

                {/* Read-Only Admin Block */}
                <div className="admin-surface rounded-[1.75rem] overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100 text-indigo-500">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="font-serif font-bold text-lg text-slate-800">Admin Directory</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Accounts possessing full ecosystem write-access</p>
                            </div>
                        </div>
                        <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded border border-indigo-200 uppercase tracking-wider">
                            {superAdmins.length} Active
                        </span>
                    </div>

                    <div className="p-0">
                         <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead>
                                <tr className="bg-white border-b border-slate-100">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Creation Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {superAdmins.map(admin => (
                                    <tr key={admin.id} className="hover:bg-slate-50/50">
                                         <td className="px-6 py-4 font-semibold text-slate-800 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs ring-1 ring-indigo-100">
                                                {admin.name?.charAt(0)?.toUpperCase() || "A"}
                                            </div>
                                            {admin.name || "Anonymous Admin"}
                                         </td>
                                         <td className="px-6 py-4 text-slate-500 font-medium">{admin.email}</td>
                                         <td className="px-6 py-4 text-slate-400 text-xs">
                                             {new Date(admin.createdAt).toLocaleDateString("en-NP", { month: 'short', day: 'numeric', year: 'numeric' })}
                                         </td>
                                    </tr>
                                ))}
                            </tbody>
                         </table>
                    </div>
                </div>

            </div>
        </div>
    )
}
