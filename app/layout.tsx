import type { Metadata } from "next"
import { Toaster } from "react-hot-toast"
import "./globals.css"

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
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              fontFamily: "var(--font-sans)",
              borderRadius: "1rem",
              fontSize: "14px",
            },
            success: { iconTheme: { primary: "#F59E0B", secondary: "#fff" } },
          }}
        />
      </body>
    </html>
  )
}
