'use client';

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { formatRsCompact } from '@/lib/currency';

interface CashFlowChartProps {
    data: {
        date: string;
        income: number;
        expense: number;
    }[];
}

function formatAxisValue(value: number) {
    if (value >= 1000) {
        return `Rs. ${(value / 1000).toFixed(0)}k`
    }

    return formatRsCompact(value)
}

export default function DashboardChart({ data }: CashFlowChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex h-full w-full items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                Generating financial telemetry...
            </div>
        );
    }

    return (
        <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ea580c" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#64748b" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                        dataKey="date"
                        tickFormatter={(tick) => {
                            const date = new Date(tick);
                            return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })}`;
                        }}
                        stroke="#cbd5e1"
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        tickMargin={12}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        tickFormatter={formatAxisValue}
                        stroke="#cbd5e1"
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        dx={-10}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                        formatter={(value, name) => [formatRsCompact(Number(value ?? 0)), String(name).charAt(0).toUpperCase() + String(name).slice(1)]}
                        labelFormatter={(label) => new Date(label).toLocaleDateString('en-IN', { weekday: 'short', month: 'long', day: 'numeric' })}
                    />
                    <Area
                        type="monotone"
                        dataKey="income"
                        name="Revenue"
                        stroke="#ea580c"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorIncome)"
                    />
                    <Area
                        type="monotone"
                        dataKey="expense"
                        name="Expense"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorExpense)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
