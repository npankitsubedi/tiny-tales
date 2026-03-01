"use client"

import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus, Trash2, Loader2, Image as ImageIcon, X, Ruler } from "lucide-react"
import { createProduct, createProductVariant } from "@/app/actions/inventory"
import { ProductCategory } from "@prisma/client"
import toast from "react-hot-toast"
import { CldUploadWidget } from "next-cloudinary"

const AGE_RANGES = ["0-3 months", "3-6 months", "6-12 months", "12-18 months", "18-24 months", "2-3 years", "3-4 years", "4-5 years", "All ages"]

const variantSchema = z.object({
    size: z.string().min(1, "Size required"),
    color: z.string().min(1, "Color required"),
    sku: z.string().min(3, "SKU ≥ 3 chars"),
    stockCount: z.coerce.number().min(0),
    lowStockThreshold: z.coerce.number().min(0),
})

const sizeRowSchema = z.object({
    label: z.string().min(1),
    ageRange: z.string(),
    chest: z.string(),
    waist: z.string(),
    length: z.string(),
})

const productSchema = z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    category: z.nativeEnum(ProductCategory),
    cogs: z.coerce.number().min(0),
    basePrice: z.coerce.number().min(0),
    babyAgeRange: z.string().optional(),
    isNonReturnable: z.boolean().default(false),
    variants: z.array(variantSchema).min(1),
    sizeChartRows: z.array(sizeRowSchema).optional(),
})

type ProductFormValues = z.infer<typeof productSchema>

// The shape Next-Cloudinary returns on success
type CloudinaryResult = {
    event: string
    info: {
        secure_url: string
        resource_type: "image" | "video"
    }
}

type MediaItem = { url: string; type: "image" | "video" }

export default function ProductForm() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
    const [showSizeChart, setShowSizeChart] = useState(false)

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema) as any,
        defaultValues: {
            title: "",
            description: "",
            category: ProductCategory.NEWBORN,
            cogs: 0,
            basePrice: 0,
            babyAgeRange: "",
            isNonReturnable: false,
            variants: [{ size: "", color: "", sku: "", stockCount: 0, lowStockThreshold: 5 }],
            sizeChartRows: [],
        },
    })

    const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
        control: form.control, name: "variants"
    })
    const { fields: sizeFields, append: appendSize, remove: removeSize } = useFieldArray({
        control: form.control, name: "sizeChartRows"
    })

    const removeMedia = (idx: number) => {
        setMediaItems(prev => prev.filter((_, i) => i !== idx))
    }

    const generateSku = (index: number) => {
        const titleHash = form.getValues("title").substring(0, 3).toUpperCase() || "PRD"
        const randomNum = Math.floor(1000 + Math.random() * 9000)
        form.setValue(`variants.${index}.sku`, `${titleHash}-${randomNum}`)
    }

    const onSubmit = async (data: ProductFormValues) => {
        setIsSubmitting(true)
        try {
            const imageUrls = mediaItems.map(m => m.url)

            // 2. Create Product
            const productResult = await createProduct({
                title: data.title,
                description: data.description,
                category: data.category,
                cogs: data.cogs,
                basePrice: data.basePrice,
                isNonReturnable: data.isNonReturnable,
                images: imageUrls,
                babyAgeRange: data.babyAgeRange,
                sizeChart: data.sizeChartRows && data.sizeChartRows.length > 0
                    ? data.sizeChartRows
                    : undefined,
            })

            if (!productResult.success || !productResult.data) {
                throw new Error(productResult.error || "Failed to create product")
            }

            // 3. Create Variants
            let variantErrors = 0
            for (const variant of data.variants) {
                const vResult = await createProductVariant({
                    productId: productResult.data.id,
                    ...variant,
                })
                if (!vResult.success) variantErrors++
            }

            if (variantErrors > 0) {
                toast.error(`Product created but ${variantErrors} variant(s) failed to save.`)
            } else {
                toast.success("Product created successfully! 🎉")
            }

            form.reset()
            setMediaItems([])
        } catch (err: any) {
            toast.error(err.message || "Something went wrong")
        } finally {
            setIsSubmitting(false)
        }
    }

    const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 bg-white placeholder:text-slate-300 transition"
    const labelCls = "block text-sm font-semibold text-slate-700 mb-1.5"

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

            {/* ─── Core Info ─── */}
            <section className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
                <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">Product Details</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                        <label className={labelCls}>Title *</label>
                        <input {...form.register("title")} placeholder="e.g. Soft Bunny Onesie" className={inputCls} />
                        {form.formState.errors.title && <p className="text-rose-500 text-xs mt-1">{form.formState.errors.title.message}</p>}
                    </div>

                    <div className="sm:col-span-2">
                        <label className={labelCls}>Description</label>
                        <textarea {...form.register("description")} rows={3} placeholder="Product description..." className={`${inputCls} resize-none`} />
                    </div>

                    <div>
                        <label className={labelCls}>Category *</label>
                        <select {...form.register("category")} className={inputCls}>
                            {Object.values(ProductCategory).map(c => (
                                <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className={labelCls}>Baby Age Range</label>
                        <select {...form.register("babyAgeRange")} className={inputCls}>
                            <option value="">Select range</option>
                            {AGE_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className={labelCls}>Cost Price (Rs.) *</label>
                        <input type="number" step="0.01" {...form.register("cogs")} className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>Selling Price (Rs.) *</label>
                        <input type="number" step="0.01" {...form.register("basePrice")} className={inputCls} />
                    </div>

                    <div className="flex items-center gap-3">
                        <input type="checkbox" id="nonReturnable" {...form.register("isNonReturnable")} className="w-4 h-4 rounded border-slate-300 text-amber-500" />
                        <label htmlFor="nonReturnable" className="text-sm text-slate-600 font-medium">Non-Returnable Item</label>
                    </div>
                </div>
            </section>

            {/* ─── Next-Cloudinary Media Gallery ─── */}
            <section className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">
                        Media Gallery ({mediaItems.length}/10)
                    </h3>
                    <p className="text-xs text-slate-400">Photos and videos, up to 10 items</p>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
                    <CldUploadWidget
                        signatureEndpoint="/api/sign-cloudinary-params"
                        options={{
                            maxFiles: 10 - mediaItems.length,
                            resourceType: "auto",
                            clientAllowedFormats: ["png", "jpeg", "jpg", "webp", "mp4", "mov"],
                            sources: ["local", "url", "camera", "google_drive"],
                            theme: "minimal",
                        }}
                        onSuccess={(result: any) => {
                            if (result.event === "success") {
                                setMediaItems(prev => [...prev, {
                                    url: result.info.secure_url,
                                    type: result.info.resource_type === "video" ? "video" : "image"
                                }])
                            }
                        }}
                    >
                        {({ open, isLoading }) => (
                            <button
                                type="button"
                                onClick={() => open()}
                                disabled={isLoading || mediaItems.length >= 10 || isSubmitting}
                                className="w-full border-2 border-dashed border-slate-300 hover:border-amber-400 hover:bg-amber-50 disabled:bg-slate-100 disabled:border-slate-200 disabled:cursor-not-allowed rounded-2xl p-8 text-center transition-all group"
                            >
                                <ImageIcon className={`w-8 h-8 mx-auto mb-2 ${mediaItems.length >= 10 ? 'text-slate-300' : 'text-amber-500 group-hover:text-amber-600'}`} aria-hidden="true" />
                                <p className="text-sm font-semibold text-slate-700">Click to upload media</p>
                                <p className="text-xs text-slate-400 mt-1">Upload up to {10 - mediaItems.length} more files (Images or Video)</p>
                            </button>
                        )}
                    </CldUploadWidget>
                </div>

                {/* Preview Grid */}
                {mediaItems.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
                        {mediaItems.map((m, i) => (
                            <div key={i} className="relative group rounded-xl overflow-hidden aspect-square border-2 border-slate-100 hover:border-amber-300 transition-colors bg-black">
                                {m.type === "video"
                                    ? <video src={m.url} className="w-full h-full object-cover" controls={false} />
                                    : <img src={m.url} alt={`Media ${i + 1}`} className="w-full h-full object-cover" />
                                }

                                {/* Badges */}
                                {m.type === "video" && (
                                    <span className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-md text-white px-2 py-1 rounded text-[10px] font-bold tracking-wider z-10 border border-white/10 shadow-sm">
                                        VIDEO
                                    </span>
                                )}
                                {i === 0 && (
                                    <span className="absolute bottom-2 left-2 bg-amber-500/90 backdrop-blur-md text-white px-2 py-1 rounded text-[10px] font-bold tracking-wider z-10 shadow-sm">
                                        MAIN
                                    </span>
                                )}

                                {/* Overlay & Remove Action */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        type="button"
                                        onClick={() => removeMedia(i)}
                                        disabled={isSubmitting}
                                        className="w-8 h-8 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-all disabled:opacity-50"
                                        aria-label={`Remove media ${i + 1}`}
                                    >
                                        <X className="w-4 h-4" aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* ─── Size Chart Builder ─── */}
            <section className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
                        <Ruler className="w-4 h-4 text-teal-500" /> Size Chart Builder
                    </h3>
                    <button type="button" onClick={() => setShowSizeChart(v => !v)}
                        className="text-xs text-teal-600 hover:text-teal-700 font-semibold underline">
                        {showSizeChart ? "Hide" : "Add Size Chart"}
                    </button>
                </div>

                {showSizeChart && (
                    <div className="space-y-3">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-amber-100">
                                        {["Size Label", "Age Range", "Chest (cm)", "Waist (cm)", "Length (cm)", ""].map(h => (
                                            <th key={h} className="pb-2 text-left text-xs text-slate-400 font-semibold px-2">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {sizeFields.map((field, i) => (
                                        <tr key={field.id} className="border-b border-slate-50">
                                            {(["label", "ageRange", "chest", "waist", "length"] as const).map(key => (
                                                <td key={key} className="py-1 px-1">
                                                    {key === "ageRange" ? (
                                                        <select {...form.register(`sizeChartRows.${i}.${key}`)}
                                                            className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-300">
                                                            <option value="">—</option>
                                                            {AGE_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                                                        </select>
                                                    ) : (
                                                        <input {...form.register(`sizeChartRows.${i}.${key}`)}
                                                            placeholder={key === "label" ? "e.g. XS" : "—"}
                                                            className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-300"
                                                        />
                                                    )}
                                                </td>
                                            ))}
                                            <td className="py-1 px-1">
                                                <button type="button" onClick={() => removeSize(i)} aria-label="Remove size row"
                                                    className="w-7 h-7 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg flex items-center justify-center transition-colors">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button type="button"
                            onClick={() => appendSize({ label: "", ageRange: "", chest: "", waist: "", length: "" })}
                            className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 font-semibold">
                            <Plus className="w-3.5 h-3.5" /> Add Row
                        </button>
                    </div>
                )}
            </section>

            {/* ─── Variants ─── */}
            <section className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
                <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">Stock Variants</h3>

                {variantFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div>
                            <label className="block text-xs text-slate-500 mb-1 font-medium">Size *</label>
                            <input {...form.register(`variants.${index}.size`)} placeholder="e.g. 0-6M" className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1 font-medium">Color *</label>
                            <input {...form.register(`variants.${index}.color`)} placeholder="e.g. Cream" className={inputCls} />
                        </div>
                        <div className="relative">
                            <label className="block text-xs text-slate-500 mb-1 font-medium">SKU *</label>
                            <div className="flex gap-1">
                                <input {...form.register(`variants.${index}.sku`)} placeholder="e.g. BUN-1234" className={inputCls} />
                                <button type="button" onClick={() => generateSku(index)}
                                    title="Auto-generate SKU"
                                    className="px-2.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-bold transition-colors shrink-0">
                                    ⚡
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1 font-medium">Stock</label>
                            <input type="number" {...form.register(`variants.${index}.stockCount`)} className={inputCls} />
                        </div>
                        <div className="flex gap-2 items-end">
                            <div className="flex-1">
                                <label className="block text-xs text-slate-500 mb-1 font-medium">Low Stock At</label>
                                <input type="number" {...form.register(`variants.${index}.lowStockThreshold`)} className={inputCls} />
                            </div>
                            {variantFields.length > 1 && (
                                <button type="button" onClick={() => removeVariant(index)}
                                    aria-label="Remove variant"
                                    className="w-11 h-11 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl flex items-center justify-center transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                <button type="button"
                    onClick={() => appendVariant({ size: "", color: "", sku: "", stockCount: 0, lowStockThreshold: 5 })}
                    className="flex items-center gap-2 text-sm text-amber-700 font-semibold hover:text-amber-800 mt-2">
                    <Plus className="w-4 h-4" /> Add Variant
                </button>
            </section>

            {/* ─── Submit ─── */}
            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-bold py-4 rounded-2xl text-base transition-all shadow-lg shadow-amber-100 active:scale-[0.99]"
            >
                {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> Saving Product...</> : "Create Product"}
            </button>
        </form>
    )
}
