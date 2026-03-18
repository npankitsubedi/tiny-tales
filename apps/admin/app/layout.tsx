import { ClerkProvider } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import type { Metadata } from "next"
import { Nunito } from "next/font/google"
import { Toaster } from "react-hot-toast"
import { redirect } from "next/navigation"
import AdminSidebar from '@/features/layout/components/AdminSidebar'
import "./globals.css"

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-brand-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Tiny Tales Admin — CEO Cockpit",
    template: "%s | Tiny Tales Admin",
  },
  description: "Enterprise administration dashboard for Tiny Tales.",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
}

export default async function AdminRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Single SUPERADMIN guard for the entire admin app
  const { userId, sessionClaims } = await auth()

  if (!userId) {
    redirect("/login")
  }

  const role = (sessionClaims?.metadata as { role?: string })?.role
  if (role !== "SUPERADMIN") {
    redirect("/")
  }

  return (
    <ClerkProvider>
      <html lang="en" className={nunito.variable}>
        <body className="antialiased bg-bg-primary">
          <div data-admin-ui="true" className="flex min-h-screen font-sans text-slate-800">
            <AdminSidebar />
            <main className="relative flex-1 min-w-0 overflow-y-auto pt-0 md:pt-0">
              <div className="md:hidden h-16" aria-hidden="true" />
              {children}
            </main>
          </div>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                fontFamily: "var(--font-sans)",
                borderRadius: "1rem",
                fontSize: "14px",
                boxShadow: "var(--shadow-md)",
              },
              success: { iconTheme: { primary: "var(--color-primary)", secondary: "#fff" } },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  )
}
