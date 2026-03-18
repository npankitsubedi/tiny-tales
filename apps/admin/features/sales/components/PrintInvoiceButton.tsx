"use client"

import { Printer } from "lucide-react"

export default function PrintInvoiceButton() {
    return (
        <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-orange-700"
        >
            <Printer className="h-4 w-4" />
            Print / Save PDF
        </button>
    )
}
