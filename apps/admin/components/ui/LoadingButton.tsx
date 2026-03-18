"use client"

import type { ButtonHTMLAttributes, ReactNode } from "react"
import { Loader2 } from "lucide-react"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: Array<string | undefined | null | false>) {
    return twMerge(clsx(inputs))
}

type LoadingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    isLoading?: boolean
    loadingText?: ReactNode
    loadingClassName?: string
    spinnerClassName?: string
}

export default function LoadingButton({
    children,
    className,
    disabled,
    isLoading = false,
    loadingText,
    loadingClassName,
    spinnerClassName,
    type = "button",
    ...props
}: LoadingButtonProps) {
    const content = loadingText ?? children

    return (
        <button
            type={type}
            disabled={disabled || isLoading}
            aria-busy={isLoading}
            data-loading={isLoading ? "true" : "false"}
            className={cn(
                "relative inline-flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed",
                isLoading && loadingClassName,
                className
            )}
            {...props}
        >
            <span className={cn("inline-flex items-center justify-center gap-2", isLoading && "opacity-0")}>
                {children}
            </span>

            {isLoading && (
                <span className="absolute inset-0 inline-flex items-center justify-center gap-2">
                    {content !== children ? (
                        <span>{content}</span>
                    ) : (
                        <span className="flex items-center gap-1" aria-hidden="true">
                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 animate-[pulse-soft_1s_ease-in-out_infinite]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 animate-[pulse-soft_1s_ease-in-out_0.2s_infinite]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 animate-[pulse-soft_1s_ease-in-out_0.4s_infinite]" />
                        </span>
                    )}
                </span>
            )}
        </button>
    )
}
