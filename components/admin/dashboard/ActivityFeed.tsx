'use client';

import { ShoppingBag, Receipt } from 'lucide-react';

export type ActivityItem = {
    id: string;
    type: 'ORDER' | 'EXPENSE';
    title: string;
    amount: number;
    date: string;
    description: string;
};

interface ActivityFeedProps {
    items: ActivityItem[];
}

function formatCurrency(amount: number) {
    return `Rs. ${amount.toLocaleString('en-IN')}`;
}

function timeAgo(dateString: string) {
    const raw = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - raw.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " mins ago";
    return Math.floor(seconds) + " seconds ago";
}

export default function ActivityFeed({ items }: ActivityFeedProps) {
    if (!items || items.length === 0) {
        return (
            <div className="flex h-40 w-full items-center justify-center text-sm text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                No recent activity.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5">
            {items.map((item, idx) => {
                const isOrder = item.type === 'ORDER';
                const Icon = isOrder ? ShoppingBag : Receipt;

                return (
                    <div key={item.id + idx} className="flex gap-4 group">
                        <div className="relative flex flex-col items-center">
                            <div className={`w-9 h-9 flex items-center justify-center rounded-xl shrink-0 z-10 transition-transform group-hover:scale-110 
                                ${isOrder ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
                                <Icon className="w-4 h-4" strokeWidth={2.5} />
                            </div>
                            {idx !== items.length - 1 && (
                                <div className="w-[2px] h-full bg-slate-100 absolute top-9"></div>
                            )}
                        </div>
                        
                        <div className="flex flex-col flex-1 pb-4 pt-1 border-b border-transparent">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">
                                        {item.title}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                        {item.description}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className={`text-sm font-bold ${isOrder ? 'text-emerald-600' : 'text-slate-700'}`}>
                                        {isOrder ? '+' : '-'}{formatCurrency(item.amount)}
                                    </span>
                                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mt-1">
                                        {timeAgo(item.date)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
