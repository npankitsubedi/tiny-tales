'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { recordExpense } from '@/app/actions/accounting';
import { useRouter } from 'next/navigation';
import { formatRs } from '@/lib/currency';
import toast from 'react-hot-toast';
import FormStatusButton from '@/components/ui/FormStatusButton';

interface ExpenseRow {
    id: string;
    date: string;
    category: string;
    vendorName: string;
    paymentMethod: string;
    amount: number;
    notes: string;
}

interface ExpenseTableProps {
    data: ExpenseRow[];
    vendors: { id: string; name: string }[];
}

const expenseSchema = z.object({
    category: z.string().min(1, 'Category is required'),
    amount: z.number().positive('Amount must be positive'),
    paymentMethod: z.enum(['CASH', 'FONEPAY', 'CARD', 'BANK']),
    date: z.string().min(1, 'Date is required'),
    vendorId: z.string().optional(),
    notes: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export default function ExpenseTable({ data, vendors }: ExpenseTableProps) {
    const router = useRouter();
    const [isSlideOutOpen, setIsSlideOutOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Set default date to today's date formatted as YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm<ExpenseFormValues>({
        resolver: zodResolver(expenseSchema),
        defaultValues: {
            date: today,
            paymentMethod: 'CASH',
            amount: undefined,
            category: '',
            vendorId: '',
            notes: ''
        }
    });

    const onSubmit = async (values: ExpenseFormValues) => {
        try {
            setIsSubmitting(true);
            const res = await recordExpense(values);
            if (res.success) {
                setIsSlideOutOpen(false);
                reset();
                router.refresh();
                toast.success('Expense recorded successfully');
            } else {
                toast.error(res.error);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to record expense');
        } finally {
            setIsSubmitting(false);
        }
    };

    const submitExpenseForm = async () => {
        await handleSubmit(onSubmit)();
    };

    return (
        <div className="flex flex-col w-full relative">
            <div className="flex justify-end p-4 border-b border-slate-100 bg-slate-50/50">
                <button
                    onClick={() => setIsSlideOutOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 border border-transparent rounded-2xl text-sm font-medium text-white shadow-sm hover:bg-orange-700 transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                >
                    <Plus className="w-4 h-4" />
                    Record Expense
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-[0.16em] text-slate-500 font-semibold">
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Category</th>
                            <th className="px-6 py-3">Vendor</th>
                            <th className="px-6 py-3">Payment Method</th>
                            <th className="px-6 py-3 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500 text-sm">
                                    No expenses recorded yet.
                                </td>
                            </tr>
                        ) : (
                            data.map((row) => (
                                <tr key={row.id} className="hover:bg-white/90 transition-all duration-200 group">
                                    <td className="px-6 py-3 text-sm text-slate-600 tabular-nums">
                                        {new Date(row.date).toLocaleDateString('en-IN', {
                                            year: 'numeric', month: 'short', day: 'numeric'
                                        })}
                                    </td>
                                    <td className="px-6 py-3 text-sm font-medium text-slate-700">
                                        {row.category}
                                    </td>
                                    <td className="px-6 py-3 text-sm text-slate-700">
                                        {row.vendorName}
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

            {/* Slide-out Overlay */}
            {isSlideOutOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/20 backdrop-blur-sm flex justify-end">
                    <div
                        className="admin-surface-strong w-full max-w-md h-full border-l border-white/70 flex flex-col transform transition-transform duration-300 ease-in-out"
                    >
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h3 className="text-xl font-semibold text-slate-900">Record Expense</h3>
                            <button
                                onClick={() => setIsSlideOutOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form
                            id="expense-form"
                            action={submitExpenseForm}
                            className="flex h-full flex-col"
                        >
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="space-y-5">

                                    {/* Category */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                        <select
                                            {...register('category')}
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm"
                                        >
                                            <option value="">Select Category</option>
                                            <option value="Rent">Rent</option>
                                            <option value="Salary">Salary</option>
                                            <option value="Marketing">Marketing</option>
                                            <option value="Packaging">Packaging</option>
                                            <option value="Utilities">Utilities</option>
                                            <option value="Miscellaneous">Miscellaneous</option>
                                        </select>
                                        {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
                                    </div>

                                    {/* Amount */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Amount (Rs.)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            {...register('amount', { valueAsNumber: true })}
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm"
                                            placeholder="0.00"
                                        />
                                        {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
                                    </div>

                                    {/* Date */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                                        <input
                                            type="date"
                                            {...register('date')}
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm"
                                        />
                                        {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
                                    </div>

                                    {/* Payment Method */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                                        <select
                                            {...register('paymentMethod')}
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm"
                                        >
                                            <option value="CASH">Cash</option>
                                            <option value="FONEPAY">Fonepay</option>
                                            <option value="CARD">Card</option>
                                            <option value="BANK">Bank Transfer</option>
                                        </select>
                                        {errors.paymentMethod && <p className="text-red-500 text-xs mt-1">{errors.paymentMethod.message}</p>}
                                    </div>

                                    {/* Vendor - Optional */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Vendor (Optional)</label>
                                        <select
                                            {...register('vendorId')}
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm"
                                        >
                                            <option value="">None</option>
                                            {vendors.map(v => (
                                                <option key={v.id} value={v.id}>{v.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
                                        <textarea
                                            {...register('notes')}
                                            rows={3}
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm resize-none"
                                            placeholder="Add details..."
                                        ></textarea>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-slate-100 bg-slate-50">
                                <FormStatusButton
                                    externalLoading={isSubmitting}
                                    loadingText="Saving Expense..."
                                    className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-orange-600 text-white font-medium rounded-lg shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                                >
                                    Save Expense
                                </FormStatusButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
