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
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Accounts & Financials</h1>
                <p className="text-sm text-slate-500">
                    Manage your cash flow, track operating expenses, and view billing details.
                </p>
            </div>

            <nav className="flex items-center gap-4 bg-white/50 border border-slate-200 p-1.5 rounded-xl self-start w-full overflow-x-auto shadow-sm backdrop-blur-sm">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href;
                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap",
                                isActive
                                    ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
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
