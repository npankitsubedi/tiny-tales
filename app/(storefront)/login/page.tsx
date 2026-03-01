"use client"

import { Suspense } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Heart, Eye, EyeOff, Loader2 } from "lucide-react"
import { useState } from "react"

const loginSchema = z.object({
    email: z.string().email("Enter a valid email"),
    password: z.string().min(1, "Password is required"),
})
type LoginForm = z.infer<typeof loginSchema>

function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const justRegistered = searchParams.get("registered") === "true"
    const [showPassword, setShowPassword] = useState(false)
    const [loginError, setLoginError] = useState<string | null>(null)

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema)
    })

    const onSubmit = async (data: LoginForm) => {
        setLoginError(null)
        const result = await signIn("credentials", {
            email: data.email,
            password: data.password,
            redirect: false,
        })

        if (result?.ok) {
            router.push("/account")
            router.refresh()
        } else {
            setLoginError("Invalid email or password. Please try again.")
        }
    }

    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-4 py-16">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <Link href="/" className="inline-flex items-center gap-2 justify-center mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C8D9E6] to-[#A8BDD0] flex items-center justify-center shadow-md">
                            <Heart className="w-5 h-5 text-white fill-white" />
                        </div>
                    </Link>
                    <h1 className="font-serif text-3xl text-slate-800">Welcome Back</h1>
                    <p className="text-slate-500 mt-2 text-sm">Sign in to your Tiny Tales account</p>
                </div>

                {justRegistered && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 text-sm text-emerald-700 mb-4 text-center">
                        🎉 Account created! Please sign in below.
                    </div>
                )}

                <div className="bg-white rounded-3xl shadow-sm border border-amber-50 p-8">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                            <input {...register("email")} type="email" placeholder="hello@example.com"
                                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#A8BDD0] focus:ring-2 focus:ring-amber-100 transition-all bg-slate-50/30" />
                            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-sm font-medium text-slate-700">Password</label>
                                <Link href="/forgot-password" className="text-xs text-[#2D5068] hover:text-[#2D5068]">Forgot password?</Link>
                            </div>
                            <div className="relative">
                                <input {...register("password")} type={showPassword ? "text" : "password"} placeholder="Your password"
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:border-[#A8BDD0] focus:ring-2 focus:ring-amber-100 transition-all bg-slate-50/30" />
                                <button type="button" onClick={() => setShowPassword(p => !p)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
                        </div>

                        {loginError && (
                            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
                                {loginError}
                            </div>
                        )}

                        <button type="submit" disabled={isSubmitting}
                            className="w-full bg-primary hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed text-primary-foreground font-semibold py-3.5 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2">
                            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : "Sign In"}
                        </button>
                    </form>

                    <p className="text-center text-sm text-slate-500 mt-6">
                        New to Tiny Tales?{" "}
                        <Link href="/register" className="text-[#2D5068] font-semibold hover:text-[#2D5068]">Create an account</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

// Wrap in Suspense because useSearchParams() causes a client-side bail-out
// during static prerendering if not wrapped. Required by Next.js App Router.
export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-[#A8BDD0] border-t-transparent animate-spin" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    )
}
