export const metadata = {
    title: "Settings | Tiny Tales Admin",
    description: "Store branding and configuration.",
}

export default function SettingsPage() {
    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-serif text-slate-800 tracking-tight">Settings</h1>
                    <p className="text-slate-500 mt-1 text-sm">Store branding, tax, and configuration.</p>
                </div>

                {/* Branding */}
                <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                    <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">Branding</h2>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Store Name</label>
                            <input defaultValue="Tiny Tales" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Logo</label>
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-teal-50 rounded-xl border-2 border-dashed border-teal-200 flex items-center justify-center text-teal-600 text-xs font-bold">TT</div>
                                <button className="text-sm px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">Upload Logo</button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Tax */}
                <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                    <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">Tax Configuration</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">VAT Rate (%)</label>
                            <input type="number" defaultValue={13} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Currency</label>
                            <select className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300">
                                <option value="NPR">NPR — Nepali Rupee (रु)</option>
                                <option value="USD">USD — US Dollar ($)</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* WhatsApp */}
                <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                    <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">WhatsApp Business</h2>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Business Number</label>
                        <input defaultValue="+977 9800000000" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" />
                    </div>
                </section>

                <div className="flex justify-end">
                    <button className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm">
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    )
}
