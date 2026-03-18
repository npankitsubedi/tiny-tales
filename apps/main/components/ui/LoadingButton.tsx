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
                    <Loader2 className={cn("h-4 w-4 animate-spin", spinnerClassName)} aria-hidden="true" />
                    {content !== children ? <span>{content}</span> : null}
                </span>
            )}
        </button>
    )
}
