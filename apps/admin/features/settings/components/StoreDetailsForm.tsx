'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save, Building2 } from 'lucide-react';
import { updateStoreDetails, StoreDetailsInput } from '@/features/settings/actions/settings';
import { useRouter } from 'next/navigation';
import FormStatusButton from '@/components/ui/FormStatusButton';

const detailsSchema = z.object({
    storeName: z.string().min(2, "Store name is required"),
    physicalAddress: z.string().optional(),
    supportEmail: z.string().email("Invalid email").optional().or(z.literal('')),
    supportPhone: z.string().optional()
});

type FormInput = z.infer<typeof detailsSchema>;

type StoreDetailsFormData = {
    storeName: string;
    physicalAddress: string;
    supportEmail: string;
    supportPhone: string;
}

export default function StoreDetailsForm({ initialData }: { initialData: StoreDetailsFormData }) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const { register, handleSubmit, formState: { errors } } = useForm<FormInput>({
        resolver: zodResolver(detailsSchema) as any,
        defaultValues: {
            storeName: initialData?.storeName || 'Tiny Tales',
            physicalAddress: initialData?.physicalAddress || '',
            supportEmail: initialData?.supportEmail || '',
            supportPhone: initialData?.supportPhone || ''
        }
    });

    const onSubmit = async (data: StoreDetailsInput) => {
        setIsSubmitting(true);
        setStatus(null);

        const sanitized = {
            storeName: data.storeName,
            physicalAddress: data.physicalAddress?.trim() || null,
            supportEmail: data.supportEmail?.trim() || null,
            supportPhone: data.supportPhone?.trim() || null
        }

        const result = await updateStoreDetails(sanitized);

        if (!result.success) {
            setStatus({ type: 'error', message: result.error || 'Failed to update store details' });
        } else {
            setStatus({ type: 'success', message: 'Store details updated successfully' });
            router.refresh();
            setTimeout(() => setStatus(null), 3000);
        }
        setIsSubmitting(false);
    };

    const submitStoreDetailsForm = async () => {
        await handleSubmit(onSubmit)();
    };

    return (
        <form action={submitStoreDetailsForm} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100 text-orange-500">
                    <Building2 className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="font-serif font-bold text-lg text-slate-800">Store Details</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Used for invoicing and public contact display</p>
                </div>
            </div>

            <div className="p-6 space-y-5">
                {status && (
                    <div className={`p-4 rounded-xl text-sm font-medium ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {status.message}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Legal Store Name</label>
                        <input
                            {...register("storeName")}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-slate-800"
                        />
                        {errors.storeName && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.storeName.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Support Phone</label>
                        <input
                            {...register("supportPhone")}
                            placeholder="e.g. +977 98..."
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-slate-800"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Support Email</label>
                        <input
                            {...register("supportEmail")}
                            type="email"
                            placeholder="support@tinytales.com"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-slate-800"
                        />
                        {errors.supportEmail && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.supportEmail.message}</p>}
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Physical HQ Address</label>
                        <textarea
                            {...register("physicalAddress")}
                            rows={3}
                            placeholder="Street address, City, etc..."
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-slate-800 resize-none"
                        ></textarea>
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <FormStatusButton
                        externalLoading={isSubmitting}
                        loadingText="Saving Store Details..."
                        className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Save Store Details
                    </FormStatusButton>
                </div>
            </div>
        </form>
    );
}
