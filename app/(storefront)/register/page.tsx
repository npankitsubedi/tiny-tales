"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Heart, Eye, EyeOff, Loader2 } from "lucide-react"

const registerSchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
})
type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
    const router = useRouter()
    const [showPassword, setShowPassword] = useState(false)
    const [serverError, setServerError] = useState<string | null>(null)

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema)
    })

    const onSubmit = async (data: RegisterForm) => {
        setServerError(null)
        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: data.name, email: data.email, password: data.password })
        })

        const json = await res.json()
        if (!res.ok) {
            setServerError(json.error || "Registration failed.")
            return
        }

        // Auto sign-in after successful registration
        const signInResult = await signIn("credentials", {
            email: data.email,
            password: data.password,
            redirect: false,
        })

        if (signInResult?.ok) {
            router.push("/account")
        } else {
            router.push("/login?registered=true")
        }
    }

    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-4 py-16">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-10">
                    <Link href="/" className="inline-flex items-center gap-2 justify-center mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C8D9E6] to-[#A8BDD0] flex items-center justify-center shadow-md">
                            <Heart className="w-5 h-5 text-white fill-white" />
                        </div>
                    </Link>
                    <h1 className="font-serif text-3xl text-slate-800">Create an Account</h1>
                    <p className="text-slate-500 mt-2 text-sm">Join the Tiny Tales family today</p>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-amber-50 p-8">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                            <input {...register("name")} placeholder="Sita Thapa"
                                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#A8BDD0] focus:ring-2 focus:ring-amber-100 transition-all bg-slate-50/30" />
                            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                            <input {...register("email")} type="email" placeholder="hello@example.com"
                                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#A8BDD0] focus:ring-2 focus:ring-amber-100 transition-all bg-slate-50/30" />
                            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                            <div className="relative">
                                <input {...register("password")} type={showPassword ? "text" : "password"} placeholder="Min. 6 characters"
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:border-[#A8BDD0] focus:ring-2 focus:ring-amber-100 transition-all bg-slate-50/30" />
                                <button type="button" onClick={() => setShowPassword(p => !p)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
                            <input {...register("confirmPassword")} type="password" placeholder="Repeat your password"
                                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#A8BDD0] focus:ring-2 focus:ring-amber-100 transition-all bg-slate-50/30" />
                            {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
                        </div>

                        {/* Server Error */}
                        {serverError && (
                            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
                                {serverError}
                            </div>
                        )}

                        <button type="submit" disabled={isSubmitting}
                            className="w-full bg-primary hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed text-primary-foreground font-semibold py-3.5 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2">
                            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating Account…</> : "Create Account"}
                        </button>
                    </form>

                    <p className="text-center text-sm text-slate-500 mt-6">
                        Already have an account?{" "}
                        <Link href="/login" className="text-[#2D5068] font-semibold hover:text-[#2D5068]">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
