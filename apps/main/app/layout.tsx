import type { Metadata } from "next"
import { Nunito } from "next/font/google"
import { Toaster } from "react-hot-toast"
import "./globals.css"

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-brand-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Tiny Tales — Premium Baby & Maternity",
    template: "%s | Tiny Tales",
  },
  description: "Thoughtfully crafted baby clothes and maternity wear for every precious moment.",
  keywords: ["baby clothes", "newborn", "maternity", "nepal", "tiny tales"],
  openGraph: {
    type: "website",
    locale: "en_NP",
    siteName: "Tiny Tales",
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={nunito.variable}>
      <body className="antialiased bg-background text-foreground min-h-screen">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              fontFamily: "var(--font-sans)",
              borderRadius: "1rem",
              fontSize: "14px",
              boxShadow: "var(--shadow-md)"
            },
            success: { iconTheme: { primary: "var(--color-primary)", secondary: "#fff" } },
          }}
        />
      </body>
    </html>
  )
}
