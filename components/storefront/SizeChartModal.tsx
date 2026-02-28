"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Ruler } from "lucide-react"

type SizeChartRow = {
    label: string
    chest: string
    waist: string
    length: string
    ageRange: string
}

type SizeChartModalProps = {
    sizeChart: SizeChartRow[]
    productTitle: string
}

export default function SizeChartModal({ sizeChart, productTitle }: SizeChartModalProps) {
    const [isOpen, setIsOpen] = useState(false)

    if (!sizeChart || sizeChart.length === 0) return null

    return (
        <>
            {/* Trigger Link */}
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700 underline underline-offset-2 font-medium transition-colors"
                aria-label="Open size guide"
            >
                <Ruler className="w-3.5 h-3.5" aria-hidden="true" />
                Size Guide
            </button>

            {/* Modal */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                            onClick={() => setIsOpen(false)}
                            aria-hidden="true"
                        />
                        {/* Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: 40, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 40, scale: 0.96 }}
                            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="size-chart-title"
                            className="fixed inset-x-4 bottom-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 bg-white rounded-3xl shadow-2xl max-w-2xl w-full sm:mx-auto overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                                <div>
                                    <h2 id="size-chart-title" className="font-serif text-xl text-slate-800">Size Guide</h2>
                                    <p className="text-sm text-slate-400 mt-0.5">{productTitle}</p>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-500"
                                    aria-label="Close size guide"
                                >
                                    <X className="w-4 h-4" aria-hidden="true" />
                                </button>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-amber-50 border-b border-amber-100">
                                            <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-amber-700 font-bold">Size</th>
                                            <th className="text-center px-4 py-3 text-xs uppercase tracking-wider text-amber-700 font-bold">Age Range</th>
                                            <th className="text-center px-4 py-3 text-xs uppercase tracking-wider text-amber-700 font-bold">Chest (cm)</th>
                                            <th className="text-center px-4 py-3 text-xs uppercase tracking-wider text-amber-700 font-bold">Waist (cm)</th>
                                            <th className="text-center px-4 py-3 text-xs uppercase tracking-wider text-amber-700 font-bold">Length (cm)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sizeChart.map((row, i) => (
                                            <tr key={i} className={`border-b border-slate-50 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                                                <td className="px-5 py-3 font-bold text-slate-800">{row.label}</td>
                                                <td className="px-4 py-3 text-center text-slate-500">{row.ageRange}</td>
                                                <td className="px-4 py-3 text-center text-slate-600">{row.chest}</td>
                                                <td className="px-4 py-3 text-center text-slate-600">{row.waist}</td>
                                                <td className="px-4 py-3 text-center text-slate-600">{row.length}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* How to Measure */}
                            <div className="px-6 py-5 bg-slate-50 border-t border-slate-100">
                                <p className="font-semibold text-slate-700 text-sm mb-2">📏 How to Measure</p>
                                <ul className="text-xs text-slate-500 space-y-1 grid sm:grid-cols-2 gap-x-4">
                                    <li>• <strong>Chest</strong>: Measure around the fullest part</li>
                                    <li>• <strong>Waist</strong>: Measure around the natural waist</li>
                                    <li>• <strong>Length</strong>: Measure from shoulder to hem</li>
                                    <li>• Sizes may vary slightly. When in doubt, size up.</li>
                                </ul>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}
