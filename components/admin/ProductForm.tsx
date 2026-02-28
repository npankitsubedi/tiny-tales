"use client"

import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus, Trash2, Image as ImageIcon, Loader2 } from "lucide-react"
import { useState } from "react"
import { createProduct, createProductVariant } from "@/app/actions/inventory"
import { ProductCategory } from "@prisma/client"
import toast from "react-hot-toast"

const variantSchema = z.object({
    size: z.string().min(1, "Size is required"),
    color: z.string().min(1, "Color is required"),
    sku: z.string().min(3, "SKU must be at least 3 characters"),
    stockCount: z.coerce.number().min(0, "Stock cannot be negative"),
    lowStockThreshold: z.coerce.number().min(0, "Threshold must be >= 0"),
})

const productSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().optional(),
    category: z.nativeEnum(ProductCategory),
    cogs: z.coerce.number().min(0, "Cost must be >= 0"),
    basePrice: z.coerce.number().min(0, "Price must be >= 0"),
    isNonReturnable: z.boolean().default(false),
    variants: z.array(variantSchema).min(1, "At least one variant is required"),
})

type ProductFormValues = z.infer<typeof productSchema>

export default function ProductForm() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [images, setImages] = useState<File[]>([])

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema) as any,
        defaultValues: {
            title: "",
            description: "",
            category: ProductCategory.NEWBORN,
            cogs: 0,
            basePrice: 0,
            isNonReturnable: false,
            variants: [{ size: "", color: "", sku: "", stockCount: 0, lowStockThreshold: 5 }],
        },
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "variants",
    })

    const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setImages((prev) => [...prev, ...Array.from(e.dataTransfer.files)])
        }
    }

    const generateSku = (index: number) => {
        const titleHash = form.getValues("title").substring(0, 3).toUpperCase() || "PRD"
        const randomNum = Math.floor(1000 + Math.random() * 9000)
        form.setValue(`variants.${index}.sku`, `${titleHash}-${randomNum}`)
    }

    const onSubmit = async (data: ProductFormValues) => {
        setIsSubmitting(true)
        try {
            // 1. Check constraints like unique SKU here if needed natively or rely on DB
            // 2. Create the Product
            const productResult = await createProduct({
                title: data.title,
                description: data.description,
                category: data.category,
                cogs: data.cogs,
                basePrice: data.basePrice,
                isNonReturnable: data.isNonReturnable,
            })

            if (!productResult.success || !productResult.data) {
                throw new Error(productResult.error || "Failed to create product")
            }

            const productId = productResult.data.id

            // 3. Create Variants Linked to Product
            for (const variant of data.variants) {
                const variantResult = await createProductVariant({
                    productId: productId,
                    size: variant.size,
                    color: variant.color,
                    sku: variant.sku,
                    stockCount: variant.stockCount,
                    lowStockThreshold: variant.lowStockThreshold,
                })

                if (!variantResult.success) {
                    throw new Error(`Failed to create variant ${variant.sku}: ${variantResult.error}`)
                }
            }

            // 4. (Future) Handle File Uploads to /public/uploads or cloud

            toast.success("Product and variants created successfully!")
            form.reset()
            setImages([])
        } catch (error: any) {
            toast.error(error.message || "An unexpected error occurred.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-5xl mx-auto p-6 bg-white rounded-2xl shadow-sm text-slate-800">
            <div className="border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-semibold text-slate-800">Product Creation Suite</h2>
                <p className="text-slate-500 text-sm mt-1">Add a new item to the Tiny Tales inventory.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Core Info & Accounting */}
                <div className="space-y-6">
                    <div className="space-y-4 bg-slate-50/50 p-5 rounded-xl border border-slate-100">
                        <h3 className="font-medium text-slate-700">Core Information</h3>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                            <input
                                {...form.register("title")}
                                className="w-full rounded-lg border-slate-200 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 p-2 border"
                                placeholder="e.g. Organic Cotton Onesie"
                            />
                            {form.formState.errors.title && <p className="text-red-500 text-xs mt-1">{form.formState.errors.title.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <textarea
                                {...form.register("description")}
                                rows={4}
                                className="w-full rounded-lg border-slate-200 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 p-2 border"
                                placeholder="Describe the product..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                            <select
                                {...form.register("category")}
                                className="w-full rounded-lg border-slate-200 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 p-2 border bg-white"
                            >
                                {Object.values(ProductCategory).map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4 bg-slate-50/50 p-5 rounded-xl border border-slate-100">
                        <h3 className="font-medium text-slate-700">Accounting & Policy</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Base Price ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    {...form.register("basePrice")}
                                    className="w-full rounded-lg border-slate-200 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 p-2 border"
                                />
                                {form.formState.errors.basePrice && <p className="text-red-500 text-xs mt-1">{form.formState.errors.basePrice.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">COGS ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    {...form.register("cogs")}
                                    className="w-full rounded-lg border-slate-200 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 p-2 border"
                                />
                                {form.formState.errors.cogs && <p className="text-red-500 text-xs mt-1">{form.formState.errors.cogs.message}</p>}
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <input
                                type="checkbox"
                                id="isNonReturnable"
                                {...form.register("isNonReturnable")}
                                className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4"
                            />
                            <label htmlFor="isNonReturnable" className="text-sm text-slate-700">This item is non-returnable (Final Sale)</label>
                        </div>
                    </div>
                </div>

                {/* Right Column: Media */}
                <div className="space-y-6">
                    <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-100 h-full">
                        <h3 className="font-medium text-slate-700 mb-4">Media Library</h3>
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleImageDrop}
                            className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors h-48"
                        >
                            <ImageIcon className="h-10 w-10 text-slate-400 mb-3" />
                            <p className="text-sm font-medium text-slate-700">Drag & drop product images here</p>
                            <p className="text-xs text-slate-500 mt-1">Files will be uploaded upon saving</p>
                        </div>

                        {images.length > 0 && (
                            <div className="mt-4 grid grid-cols-4 gap-2">
                                {images.map((file, i) => (
                                    <div key={i} className="aspect-square bg-slate-100 rounded-lg overflow-hidden relative group">
                                        <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                        >
                                            <Trash2 className="h-4 w-4 text-white" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Dynamic Variant Manager */}
            <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-slate-700">Variant Manager</h3>
                    <button
                        type="button"
                        onClick={() => append({ size: "", color: "", sku: "", stockCount: 0, lowStockThreshold: 5 })}
                        className="flex items-center text-sm font-medium text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <Plus className="h-4 w-4 mr-1" /> Add Variant
                    </button>
                </div>

                {form.formState.errors.variants?.message && (
                    <p className="text-red-500 text-sm mb-4">{form.formState.errors.variants.message}</p>
                )}

                <div className="space-y-3">
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex flex-wrap md:flex-nowrap gap-3 items-start bg-white p-3 border border-slate-100 rounded-lg shadow-sm group">
                            <div className="w-full md:w-32">
                                <input
                                    {...form.register(`variants.${index}.size`)}
                                    placeholder="Size (e.g. 0-3M)"
                                    className="w-full text-sm rounded-md border-slate-200 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 p-2 border"
                                />
                                {form.formState.errors.variants?.[index]?.size && <p className="text-red-500 text-[10px] mt-1">{form.formState.errors.variants[index]?.size?.message}</p>}
                            </div>
                            <div className="w-full md:w-32">
                                <input
                                    {...form.register(`variants.${index}.color`)}
                                    placeholder="Color"
                                    className="w-full text-sm rounded-md border-slate-200 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 p-2 border"
                                />
                                {form.formState.errors.variants?.[index]?.color && <p className="text-red-500 text-[10px] mt-1">{form.formState.errors.variants[index]?.color?.message}</p>}
                            </div>
                            <div className="w-full md:flex-1 relative">
                                <input
                                    {...form.register(`variants.${index}.sku`)}
                                    placeholder="SKU"
                                    className="w-full text-sm rounded-md border-slate-200 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 p-2 border pr-16"
                                />
                                <button
                                    type="button"
                                    onClick={() => generateSku(index)}
                                    className="absolute right-1 top-1 bottom-1 px-2 text-[10px] font-medium text-slate-500 hover:bg-slate-100 rounded"
                                >
                                    Generate
                                </button>
                                {form.formState.errors.variants?.[index]?.sku && <p className="text-red-500 text-[10px] mt-1">{form.formState.errors.variants[index]?.sku?.message}</p>}
                            </div>
                            <div className="w-full md:w-24">
                                <input
                                    type="number"
                                    {...form.register(`variants.${index}.stockCount`)}
                                    placeholder="Stock"
                                    className="w-full text-sm rounded-md border-slate-200 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 p-2 border"
                                />
                            </div>
                            <div className="w-full md:w-24">
                                <input
                                    type="number"
                                    {...form.register(`variants.${index}.lowStockThreshold`)}
                                    placeholder="Low Alert"
                                    className="w-full text-sm rounded-md border-slate-200 outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 p-2 border"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => remove(index)}
                                className="mt-1 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                title="Remove Variant"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center justify-center px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-xl transition-colors disabled:opacity-70"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving Product...
                        </>
                    ) : (
                        "Save Product"
                    )}
                </button>
            </div>
        </form>
    )
}
