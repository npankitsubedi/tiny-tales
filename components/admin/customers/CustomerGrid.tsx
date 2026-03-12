'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { formatRsCompact } from '@/lib/currency';

export type CustomerRow = {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    totalOrders: number;
    lifetimeValue: number;
    joinedDate: string;
};

interface CustomerGridProps {
    customers: CustomerRow[];
}

export default function CustomerGrid({ customers }: CustomerGridProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const filtered = customers.filter(c => {
        const term = searchQuery.toLowerCase();
        return (
            (c.name?.toLowerCase().includes(term)) ||
            (c.email.toLowerCase().includes(term)) ||
            (c.phone?.includes(term))
        );
    });

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                    />
                </div>
                <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
                    {filtered.length} {filtered.length === 1 ? 'Customer' : 'Customers'}
                </div>
            </div>

            {/* Grid */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="bg-white border-b border-slate-100">
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Contact</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Orders</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Lifetime Value</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Joined</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                    No customers found matching your search.
                                </td>
                            </tr>
                        ) : (
                            filtered.map((customer) => (
                                <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer relative">
                                    <td className="px-6 py-4 min-w-[200px]">
                                        <Link href={`/admin/customers/${customer.id}`} className="absolute inset-0 z-10">
                                            <span className="sr-only">View {customer.name}</span>
                                        </Link>
                                        <div className="font-bold text-slate-800">
                                            {customer.name || 'Anonymous User'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-slate-600 font-medium">{customer.email}</div>
                                        <div className="text-xs text-slate-400 mt-0.5">{customer.phone || 'No phone'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-md bg-slate-100 text-slate-600 font-bold text-xs ring-1 ring-slate-200/50">
                                            {customer.totalOrders}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="font-bold text-slate-700">
                                            {formatRsCompact(customer.lifetimeValue)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-slate-500 font-medium">
                                        {new Date(customer.joinedDate).toLocaleDateString('en-IN', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
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
