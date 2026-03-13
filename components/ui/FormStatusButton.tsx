"use client"

import { useFormStatus } from "react-dom"
import type { ButtonHTMLAttributes, ReactNode } from "react"
import LoadingButton from "@/components/ui/LoadingButton"

type FormStatusButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
    children: ReactNode
    externalLoading?: boolean
    loadingText?: ReactNode
    loadingClassName?: string
    spinnerClassName?: string
}

export default function FormStatusButton({
    children,
    externalLoading = false,
    loadingText,
    ...props
}: FormStatusButtonProps) {
    const { pending } = useFormStatus()

    return (
        <LoadingButton
            type="submit"
            isLoading={pending || externalLoading}
            loadingText={loadingText}
            {...props}
        >
            {children}
        </LoadingButton>
    )
}
