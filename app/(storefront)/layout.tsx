import StorefrontHeader from "@/components/storefront/StorefrontHeader"
import { Toaster } from "react-hot-toast"
import Link from "next/link"
import { Heart } from "lucide-react"

export const metadata = {
    title: {
        default: "Tiny Tales | Baby & Maternity Essentials",
        template: "%s | Tiny Tales"
    },
    description: "Thoughtfully crafted baby & maternity clothing made with love. Shop newborn, toddler & maternity essentials at Tiny Tales.",
}

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col bg-[#FDFBF7] font-sans text-slate-800">
            <Toaster position="top-center" />
            <StorefrontHeader />

            {/* ─── Page Content ─── */}
            <main className="flex-1">
                {children}
            </main>

            {/* ─── Footer ─── */}
            <footer className="bg-slate-900 text-slate-400 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-3 gap-12">

                    {/* Brand */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center">
                                <Heart className="w-3.5 h-3.5 text-white fill-white" />
                            </div>
                            <span className="font-serif text-lg text-white">Tiny Tales</span>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-500 max-w-xs">
                            Thoughtfully crafted baby & maternity clothing. Made with love, designed with care, for every tiny milestone.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Quick Links</h3>
                        <ul className="space-y-2 text-sm">
                            {[
                                { label: "Shop All", href: "/shop" },
                                { label: "About Us", href: "/about" },
                                { label: "FAQ", href: "/faq" },
                                { label: "Return Policy", href: "/returns" },
                                { label: "Privacy Policy", href: "/privacy" },
                            ].map(link => (
                                <li key={link.href}>
                                    <Link href={link.href} className="hover:text-amber-400 transition-colors">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Contact</h3>
                        <ul className="space-y-2 text-sm text-slate-500">
                            <li>📍 Kathmandu, Nepal</li>
                            <li>📧 hello@tinytales.com.np</li>
                            <li>📞 +977-9800000000</li>
                        </ul>
                        <p className="mt-6 text-xs text-slate-600">
                            © {new Date().getFullYear()} Tiny Tales. Made with ♥ in Nepal.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
