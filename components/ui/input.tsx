import type { InputHTMLAttributes } from "react"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: Array<string | undefined | null | false>) {
    return twMerge(clsx(inputs))
}

type InputProps = InputHTMLAttributes<HTMLInputElement>

export default function Input({ className, type = "text", ...props }: InputProps) {
    return (
        <input
            type={type}
            className={cn(
                "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm",
                "outline-none transition-all",
                "focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 focus:bg-white",
                "disabled:opacity-60 disabled:cursor-not-allowed",
                "placeholder:text-slate-400",
                className
            )}
            {...props}
        />
    )
}
