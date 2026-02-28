"use client"

import { useCart } from "@/store/cartStore"
import { useSession, signOut } from "next-auth/react"
import CartDrawer from "@/components/storefront/CartDrawer"
import { ShoppingBag, Menu, X, Heart, User, LayoutDashboard, LogIn } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

const NAV_LINKS = [
  { label: "Shop All", href: "/shop" },
  { label: "Newborn", href: "/shop?category=NEWBORN" },
  { label: "Boys", href: "/shop?category=BOYS" },
  { label: "Girls", href: "/shop?category=GIRLS" },
  { label: "Maternity", href: "/shop?category=MATERNITY" },
]

export default function StorefrontHeader() {
  const { cartCount } = useCart()
  const { data: session, status } = useSession()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const isAdmin = session?.user?.role === "SUPERADMIN"
  const isLoggedIn = status === "authenticated"

  // Add shadow when page is scrolled
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Unlock body when drawer/menu closes
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [mobileMenuOpen])

  // Determine logo — use /public/logo.png if it exists (fallback to text)
  const Logo = () => (
    <Link
      href="/"
      className="flex items-center gap-2 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-xl"
      aria-label="Tiny Tales — Home"
    >
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 to-rose-400 flex items-center justify-center shadow-sm">
        <Heart className="w-4 h-4 text-white fill-white" aria-hidden="true" />
      </div>
      <span className="font-serif text-xl text-slate-800 leading-none tracking-tight">
        Tiny <span className="text-teal-600">Tales</span>
      </span>
    </Link>
  )

  return (
    <>
      <header className={`sticky top-0 z-40 bg-[#FDFBF7]/95 backdrop-blur-md border-b transition-all duration-300 ${scrolled ? "border-amber-100 shadow-sm" : "border-transparent"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

          <Logo />

          {/* ── Desktop Nav ── */}
          <nav className="hidden md:flex items-center gap-0.5" aria-label="Main navigation">
            {NAV_LINKS.map(link => (
              <Link key={link.href} href={link.href}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-full transition-all duration-200">
                {link.label}
              </Link>
            ))}
          </nav>

          {/* ── Right Actions ── */}
          <div className="flex items-center gap-2">
            {/* Admin Dashboard — only for SUPERADMIN */}
            {isAdmin && (
              <Link href="/admin/sales"
                className="hidden md:flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-full transition-all"
                aria-label="Admin Dashboard">
                <LayoutDashboard className="w-3.5 h-3.5" aria-hidden="true" />
                Admin
              </Link>
            )}

            {/* Auth state */}
            {status !== "loading" && (
              isLoggedIn ? (
                <Link href="/account"
                  className="hidden md:flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-full transition-all"
                  aria-label="My account">
                  <User className="w-4 h-4" aria-hidden="true" />
                  {session.user?.name?.split(" ")[0] || "Account"}
                </Link>
              ) : (
                <Link href="/login"
                  className="hidden md:flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50 rounded-full transition-all"
                  aria-label="Sign in">
                  <LogIn className="w-4 h-4" aria-hidden="true" />
                  Login
                </Link>
              )
            )}

            {/* Cart */}
            <button onClick={() => setDrawerOpen(true)}
              className="relative flex items-center justify-center w-11 h-11 bg-amber-50 hover:bg-amber-100 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              aria-label={`Open cart${cartCount > 0 ? ` — ${cartCount} items` : ""}`}>
              <ShoppingBag className="w-5 h-5 text-amber-700" aria-hidden="true" />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span key="badge"
                    initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none"
                    aria-hidden="true">
                    {cartCount > 99 ? "99+" : cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Mobile Hamburger */}
            <button
              className="flex md:hidden items-center justify-center w-11 h-11 hover:bg-slate-100 rounded-full transition-colors"
              onClick={() => setMobileMenuOpen(v => !v)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu">
              <AnimatePresence mode="wait" initial={false}>
                {mobileMenuOpen
                  ? <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <X className="w-5 h-5 text-slate-700" aria-hidden="true" />
                  </motion.div>
                  : <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <Menu className="w-5 h-5 text-slate-700" aria-hidden="true" />
                  </motion.div>
                }
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* ── Mobile Dropdown ── */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div id="mobile-menu"
              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden border-t border-amber-50 bg-[#FDFBF7] md:hidden"
              role="navigation" aria-label="Mobile navigation">
              <nav className="px-4 py-4 space-y-1">
                {NAV_LINKS.map(link => (
                  <Link key={link.href} href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center px-4 py-3 text-base font-semibold text-slate-700 hover:text-amber-700 hover:bg-amber-50 rounded-2xl transition-all">
                    {link.label}
                  </Link>
                ))}

                <div className="pt-2 border-t border-slate-100 space-y-1">
                  {isAdmin && (
                    <Link href="/admin/sales" onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-base font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-2xl transition-all">
                      <LayoutDashboard className="w-4 h-4" aria-hidden="true" /> Admin Dashboard
                    </Link>
                  )}
                  {isLoggedIn ? (
                    <>
                      <Link href="/account" onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 text-base font-semibold text-slate-700 hover:bg-amber-50 rounded-2xl transition-all">
                        <User className="w-4 h-4" aria-hidden="true" />
                        {session?.user?.name?.split(" ")[0] || "Account"}
                      </Link>
                      <button onClick={() => { signOut({ callbackUrl: "/" }); setMobileMenuOpen(false) }}
                        className="w-full flex items-center gap-2 px-4 py-3 text-base font-semibold text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-base font-semibold text-amber-700 hover:bg-amber-50 rounded-2xl transition-all">
                      <LogIn className="w-4 h-4" aria-hidden="true" /> Sign In
                    </Link>
                  )}
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <CartDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}
