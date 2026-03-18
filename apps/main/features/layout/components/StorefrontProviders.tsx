"use client"

import { SessionProvider } from "next-auth/react"

export default function StorefrontProviders({ children }: { children: React.ReactNode }) {
    return <SessionProvider>{children}</SessionProvider>
}
