"use client"

import type { ButtonHTMLAttributes, ReactNode } from "react"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: Array<string | undefined | null | false>) {
    return twMerge(clsx(inputs))
}

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger"
export type ButtonSize = "sm" | "md" | "lg"

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant
    size?: ButtonSize
    children: ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
    primary:
        "bg-orange-600 text-white hover:bg-orange-700 shadow-[0_14px_28px_-18px_rgba(234,88,12,0.95)] " +
        "transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-md active:scale-95",
    secondary:
        "bg-white border border-slate-200 text-slate-700 hover:bg-gray-100 hover:text-orange-600 " +
        "transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-md active:scale-95",
    ghost:
        "bg-transparent text-slate-600 hover:bg-slate-100 " +
        "transition-all duration-200 ease-in-out active:scale-95",
    danger:
        "bg-red-600 text-white hover:bg-red-700 " +
        "transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-md active:scale-95",
}

const sizeClasses: Record<ButtonSize, string> = {
    sm: "px-3 py-1.5 text-xs rounded-xl",
    md: "px-5 py-2.5 text-sm rounded-2xl",
    lg: "px-6 py-3 text-base rounded-2xl",
}

export default function Button({
    children,
    className,
    variant = "primary",
    size = "md",
    disabled,
    type = "button",
    ...props
}: ButtonProps) {
    return (
        <button
            type={type}
            disabled={disabled}
            className={cn(
                "inline-flex items-center justify-center font-medium",
                "disabled:opacity-70 disabled:cursor-not-allowed disabled:!translate-y-0 disabled:!scale-100 disabled:shadow-none",
                variantClasses[variant],
                sizeClasses[size],
                className
            )}
            {...props}
        >
            {children}
        </button>
    )
}
