'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save, Calculator } from 'lucide-react';
import { updateFinancialRules, FinancialRulesInput } from '@/app/actions/settings';
import { useRouter } from 'next/navigation';

const rulesSchema = z.object({
    defaultTaxRate: z.coerce.number().min(0).max(100),
    flatShippingFee: z.coerce.number().min(0),
    freeShippingThreshold: z.coerce.number().min(0)
});

type FormInput = z.infer<typeof rulesSchema>;

type FinancialRulesFormData = {
    defaultTaxRate: number;
    flatShippingFee: number;
    freeShippingThreshold: number;
}

export default function FinancialRulesForm({ initialData }: { initialData: FinancialRulesFormData }) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const { register, handleSubmit, formState: { errors } } = useForm<FormInput>({
        resolver: zodResolver(rulesSchema) as any,
        defaultValues: {
            defaultTaxRate: initialData?.defaultTaxRate || 13,
            flatShippingFee: initialData?.flatShippingFee || 100,
            freeShippingThreshold: initialData?.freeShippingThreshold || 5000
        }
    });

    const onSubmit = async (data: FinancialRulesInput) => {
        setIsSubmitting(true);
        setStatus(null);

        const result = await updateFinancialRules(data);

        if (!result.success) {
            setStatus({ type: 'error', message: result.error || 'Failed to update financial rules' });
        } else {
            setStatus({ type: 'success', message: 'Financial rules synchronized successfully' });
            router.refresh();
            setTimeout(() => setStatus(null), 3000);
        }
        setIsSubmitting(false);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100 text-orange-500">
                    <Calculator className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="font-serif font-bold text-lg text-slate-800">Financial Rules</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Global taxation and checkout shipping logic</p>
                </div>
            </div>

            <div className="p-6 space-y-5">
                {status && (
                    <div className={`p-4 rounded-xl text-sm font-medium ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {status.message}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Default VAT Rate (%)</label>
                        <div className="relative">
                            <input
                                {...register("defaultTaxRate")}
                                type="number" step="0.01"
                                className="w-full pl-4 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-slate-800"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                        </div>
                        {errors.defaultTaxRate && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.defaultTaxRate.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Flat Shipping Fee</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">Rs.</span>
                            <input
                                {...register("flatShippingFee")}
                                type="number" step="1"
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-slate-800"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Free Shipping At...</label>
                         <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">Rs.</span>
                            <input
                                {...register("freeShippingThreshold")}
                                type="number" step="1"
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-slate-800"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md flex items-center gap-2"
                    >
                        {isSubmitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Financial Rules
                    </button>
                </div>
            </div>
        </form>
    );
}
