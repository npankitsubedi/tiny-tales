'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Save, Edit3 } from 'lucide-react';
import { updateCustomerProfile } from '@/app/actions/crm';
import { useRouter } from 'next/navigation';

const editSchema = z.object({
    id: z.string(),
    phone: z.string().optional(),
    email: z.string().email(),
    defaultShippingAddress: z.string().optional()
});

export type EditCustomerFormData = z.infer<typeof editSchema>;

interface EditCustomerModalProps {
    customer: {
        id: string;
        name: string | null;
        email: string;
        phone: string | null;
        defaultShippingAddress: string | null;
    };
}

export default function EditCustomerModal({ customer }: EditCustomerModalProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm<EditCustomerFormData>({
        resolver: zodResolver(editSchema),
        defaultValues: {
            id: customer.id,
            email: customer.email,
            phone: customer.phone || "",
            defaultShippingAddress: customer.defaultShippingAddress || ""
        }
    });

    const onSubmit = async (data: EditCustomerFormData) => {
        setIsSubmitting(true);
        setError(null);

        // Sanitize string empties to null for Prisma
        const sanitized = {
            id: data.id,
            email: data.email,
            phone: data.phone?.trim() === "" ? null : data.phone,
            defaultShippingAddress: data.defaultShippingAddress?.trim() === "" ? null : data.defaultShippingAddress
        };

        const result = await updateCustomerProfile(sanitized);

        if (!result.success) {
            setError(result.error);
            setIsSubmitting(false);
            return;
        }

        setIsSubmitting(false);
        setIsOpen(false);
        router.refresh();
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full mt-4 bg-slate-50 hover:bg-orange-50 text-orange-600 border border-orange-200/50 font-semibold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
                <Edit3 className="w-4 h-4" />
                Edit Profile
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-serif font-bold text-slate-800">Edit Profile</h2>
                        <p className="text-sm text-slate-500 mt-1">{customer.name}</p>
                    </div>
                    <button
                        onClick={() => {
                            reset();
                            setIsOpen(false);
                            setError(null);
                        }}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <input type="hidden" {...register("id")} />

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                Email Address
                            </label>
                            <input
                                {...register("email")}
                                type="email"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-slate-800"
                            />
                            {errors.email && (
                                <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                Contact Phone
                            </label>
                            <input
                                {...register("phone")}
                                type="text"
                                placeholder="e.g. +977 98..."
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-slate-800"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                Default Shipping Address
                            </label>
                            <textarea
                                {...register("defaultShippingAddress")}
                                rows={3}
                                placeholder="Street address, City, etc..."
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-slate-800 resize-none"
                            ></textarea>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md shadow-orange-600/20 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
