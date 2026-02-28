"use client"

import { Download } from "lucide-react"

export default function ExportButton({ data }: { data: any[] }) {
    const handleExport = () => {
        if (!data || data.length === 0) return

        // Extract headers
        const headers = Object.keys(data[0]).join(",")

        // Convert logic safely
        const rows = data.map(item => {
            return Object.values(item).map(val => {
                // Enforce strong quoting around values if string escaping commas 
                return typeof val === "string" ? `"${val}"` : val
            }).join(",")
        })

        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n")
        const encodedUri = encodeURI(csvContent)

        // Create immediate hidden link
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", `invoices_export_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <button
            onClick={handleExport}
            className="inline-flex items-center justify-center p-2 px-4 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
        >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
        </button>
    )
}
