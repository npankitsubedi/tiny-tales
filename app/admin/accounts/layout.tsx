'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Receipt, ShoppingCart, TrendingUp } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

export default function AccountsLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    const tabs = [
        { name: 'Dashboard', href: '/admin/accounts', icon: LayoutDashboard },
        { name: 'Sales Ledger', href: '/admin/accounts/sales', icon: TrendingUp },
        { name: 'Expenses', href: '/admin/accounts/expenses', icon: Receipt },
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <p className="admin-label">Finance Layer</p>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Accounts & Financials</h1>
                <p className="text-sm text-slate-500">
                    Manage your cash flow, track operating expenses, and view billing details.
                </p>
            </div>

            <nav className="admin-glass flex items-center gap-3 border border-white/70 p-1.5 rounded-[1.5rem] self-start w-full overflow-x-auto shadow-[0_16px_34px_-28px_rgba(15,23,42,0.3)]">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href;
                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 whitespace-nowrap",
                                isActive
                                    ? "bg-orange-600 text-white shadow-[0_14px_28px_-20px_rgba(234,88,12,0.9)]"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-white hover:shadow-sm"
                            )}
                        >
                            <tab.icon className={cn("w-4 h-4", isActive ? "text-orange-100" : "text-slate-400")} />
                            {tab.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Main Content Area */}
            <div className="w-full">
                {children}
            </div>
        </div>
    );
}
