export const metadata = {
    title: "Settings | Tiny Tales Admin",
    description: "Store branding and configuration.",
}

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function SettingsPage() {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== "SUPERADMIN") redirect("/")
    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-serif text-slate-800 tracking-tight">Settings</h1>
                    <p className="text-slate-500 mt-1 text-sm">Store branding, tax, and configuration.</p>
                </div>

                {/* Branding and Tax locked down by SUPERADMIN policy */}
                <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
                    <p className="text-amber-800 text-sm font-medium">🔒 Core store branding and currency formats are hardcoded to the new Dusty Periwinkle brand identity and RS currency system.</p>
                </div>

                {/* WhatsApp */}
                <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                    <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">WhatsApp Business</h2>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Business Number</label>
                        <input defaultValue="+977 9800000000" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8D9E6]" />
                    </div>
                </section>

                <div className="flex justify-end">
                    <button className="px-6 py-3 bg-[#C8D9E6] hover:bg-[#A8BDD0] text-white font-semibold rounded-xl text-sm transition-colors shadow-sm">
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    )
}
