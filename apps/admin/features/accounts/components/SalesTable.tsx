'use client';

import { Printer } from 'lucide-react';
import { formatRs } from '@/lib/currency';

interface SalesRow {
    id: string;
    date: string;
    source: string;
    referenceId: string;
    customerName: string;
    paymentMethod: string;
    amount: number;
}

interface SalesTableProps {
    data: SalesRow[];
}

export default function SalesTable({ data }: SalesTableProps) {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="flex flex-col w-full">
            <div className="flex justify-end p-4 border-b border-slate-100 bg-slate-50/50">
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-100 rounded-2xl text-sm font-medium text-slate-700 shadow-sm hover:bg-gray-100 hover:text-orange-600 transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                >
                    <Printer className="w-4 h-4" />
                    Generate Report
                </button>
            </div>

            <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-[0.16em] text-slate-500 font-semibold">
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Source</th>
                            <th className="px-6 py-3">Reference ID</th>
                            <th className="px-6 py-3">Customer Name</th>
                            <th className="px-6 py-3">Payment Method</th>
                            <th className="px-6 py-3 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-500 text-sm">
                                    No income transactions found.
                                </td>
                            </tr>
                        ) : (
                            data.map((row) => (
                                <tr key={row.id} className="hover:bg-white/90 transition-all duration-200 group">
                                    <td className="px-6 py-3 text-sm text-slate-600 tabular-nums">
                                        {new Date(row.date).toLocaleDateString('en-IN', {
                                            year: 'numeric', month: 'short', day: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                                            {row.source}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-sm font-medium text-slate-700">
                                        {row.referenceId}
                                    </td>
                                    <td className="px-6 py-3 text-sm text-slate-700">
                                        {row.customerName}
                                    </td>
                                    <td className="px-6 py-3 text-sm text-slate-600 capitalize">
                                        {row.paymentMethod.toLowerCase()}
                                    </td>
                                    <td className="px-6 py-3 text-sm font-bold text-slate-900 text-right tabular-nums">
                                        {formatRs(row.amount)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
