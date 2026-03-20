"use client"

import { useState, useTransition } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { updateFamilyProfile } from "../actions"
import toast from "react-hot-toast"
import { Baby, CalendarDays, Plus, Trash2, Heart, Sparkles } from "lucide-react"

// Date helpers
const today = new Date().toISOString().split("T")[0]

const childSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.coerce.number().min(0, "Age cannot be negative"),
  gender: z.enum(["Boy", "Girl", "Prefer not to say"])
})

const familyProfileSchema = z.object({
  birthday: z.string().optional().refine(val => !val || !isNaN(Date.parse(val)), { message: "Invalid date" }),
  children: z.array(childSchema)
})

type FamilyProfileFormValues = z.infer<typeof familyProfileSchema>

interface FamilyProfileFormProps {
    initialData?: {
        birthday?: Date | null
        children: { name: string; age: number; gender: string }[]
    }
}

export default function FamilyProfileForm({ initialData }: FamilyProfileFormProps) {
    const [isPending, startTransition] = useTransition()

    // Setup React Hook Form
    const { register, control, handleSubmit, watch, formState: { errors } } = useForm<FamilyProfileFormValues>({
        resolver: zodResolver(familyProfileSchema),
        defaultValues: {
            birthday: initialData?.birthday ? new Date(initialData.birthday).toISOString().split("T")[0] : "",
            children: initialData?.children?.length ? initialData.children : []
        }
    })

    const { fields, append, remove } = useFieldArray({
        control,
        name: "children"
    })

    const childrenList = watch("children")

    const handleChildCountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const count = parseInt(e.target.value) || 0
        const currentCount = fields.length

        if (count > currentCount) {
            // Append missing slots
            for (let i = 0; i < count - currentCount; i++) {
                append({ name: "", age: 0, gender: "Prefer not to say" })
            }
        } else if (count < currentCount) {
            // Remove extra slots from the end
            for (let i = currentCount - 1; i >= count; i--) {
                remove(i)
            }
        }
    }

    const onSubmit = (data: FamilyProfileFormValues) => {
        startTransition(async () => {
            const result = await updateFamilyProfile({
                birthday: data.birthday ? new Date(data.birthday) : null,
                children: data.children
            })

            if (!result.success) {
                toast.error(result.error || "Something went wrong.")
            } else {
                toast.success("Your family profile has been beautifully updated! 🤍")
            }
        })
    }

    return (
        <section className="bg-[#FAFAF8] rounded-[2rem] p-8 shadow-sm border border-orange-50/50 mt-10">
            <div className="flex items-center gap-3 mb-2">
                <div className="bg-orange-100/50 p-2.5 rounded-full">
                    <Heart className="w-5 h-5 text-[#F28C6E]" />
                </div>
                <h2 className="text-2xl font-serif text-slate-800">Your Family Profile</h2>
            </div>
            <p className="text-slate-500 mb-8 pl-[3.25rem] text-sm max-w-lg">
                Tell us a little about your beautiful family so we can tailor the Tiny Tales experience perfectly for you and your little ones.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pl-[3.25rem]">
                
                {/* Parent Birthday */}
                <div className="max-w-md bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100 flex gap-4 items-center">
                    <div className="bg-slate-50 p-3 rounded-2xl shrink-0">
                        <CalendarDays className="w-5 h-5 text-[#A7BFA0]" />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Your Birthday</label>
                        <input
                            type="date"
                            max={today}
                            {...register("birthday")}
                            className="w-full text-slate-600 bg-transparent border-none p-0 focus:ring-0 text-lg cursor-pointer outline-none"
                        />
                         {errors.birthday && <p className="text-xs text-red-500 mt-1">{errors.birthday.message}</p>}
                    </div>
                </div>

                {/* Children Count Trigger */}
                <div className="max-w-md space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Baby className="w-4 h-4 text-[#F28C6E]" />
                        How many little ones do you have?
                    </label>
                    <select
                        onChange={handleChildCountChange}
                        value={fields.length}
                        className="w-full bg-white border border-slate-200 rounded-[1.25rem] px-4 py-3 text-slate-700 focus:outline-none focus:border-[#F28C6E] focus:ring-2 focus:ring-orange-100 transition-all font-medium"
                    >
                        <option value={0}>I'm expecting! / Parent to be</option>
                        {[1, 2, 3, 4, 5].map(num => (
                            <option key={num} value={num}>{num} {num === 1 ? 'Child' : 'Children'}</option>
                        ))}
                    </select>
                </div>

                {/* Dynamic Children List */}
                {fields.length > 0 && (
                    <div className="space-y-4 max-w-2xl">
                        {fields.map((field, index) => (
                            <div key={field.id} className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100 relative group overflow-hidden transition-all hover:shadow-md">
                                {/* Decorative corner */}
                                <div className="absolute -top-4 -right-4 w-12 h-12 bg-orange-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                
                                <div className="flex items-center justify-between mb-5 relative z-10">
                                    <h4 className="font-serif text-lg text-slate-800 font-medium">Child #{index + 1}</h4>
                                    <button
                                        type="button"
                                        onClick={() => remove(index)}
                                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                                        aria-label="Remove child"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
                                    <div className="space-y-1 md:col-span-1">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</label>
                                        <input
                                            {...register(`children.${index}.name` as const)}
                                            placeholder="First Name"
                                            className="w-full border-b-2 border-slate-100 bg-transparent py-2 px-1 focus:outline-none focus:border-[#F28C6E] text-slate-700 transition-colors placeholder:text-slate-300"
                                        />
                                        {errors.children?.[index]?.name && <p className="text-xs text-red-500 mt-1">{errors.children[index]?.name?.message}</p>}
                                    </div>

                                    <div className="space-y-1 md:col-span-1">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Age (Years)</label>
                                        <input
                                            type="number"
                                            min={0}
                                            {...register(`children.${index}.age` as const)}
                                            placeholder="e.g. 2"
                                            className="w-full border-b-2 border-slate-100 bg-transparent py-2 px-1 focus:outline-none focus:border-[#F28C6E] text-slate-700 transition-colors placeholder:text-slate-300"
                                        />
                                        {errors.children?.[index]?.age && <p className="text-xs text-red-500 mt-1">{errors.children[index]?.age?.message}</p>}
                                    </div>

                                    <div className="space-y-1 md:col-span-1">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gender</label>
                                        <select
                                            {...register(`children.${index}.gender` as const)}
                                            className="w-full border-b-2 border-slate-100 bg-transparent py-2 px-1 focus:outline-none focus:border-[#A7BFA0] text-slate-700 transition-colors cursor-pointer"
                                        >
                                            <option value="Boy">Boy</option>
                                            <option value="Girl">Girl</option>
                                            <option value="Prefer not to say">Prefer not to say</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        <button
                            type="button"
                            onClick={() => append({ name: "", age: 0, gender: "Prefer not to say" })}
                            className="text-sm font-semibold text-[#F28C6E] bg-orange-50 hover:bg-orange-100 px-4 py-2.5 rounded-full flex items-center gap-2 transition-colors ml-auto"
                        >
                            <Plus className="w-4 h-4" /> Add Another Child
                        </button>
                    </div>
                )}

                {/* Submit */}
                <div className="pt-4 border-t border-slate-100 max-w-2xl flex justify-end">
                    <button
                        type="submit"
                        disabled={isPending}
                        className="bg-[#A7BFA0] hover:bg-[#97af90] text-white px-8 py-3.5 rounded-full font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-70 flex items-center gap-2 min-w-[200px] justify-center"
                    >
                        {isPending ? (
                            <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
                                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0.2s]" />
                                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0.4s]" />
                            </span>
                        ) : (
                            <><Sparkles className="w-4 h-4" /> Save Family Profile</>
                        )}
                    </button>
                </div>

            </form>
        </section>
    )
}
