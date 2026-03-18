"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    Receipt,
    Settings,
    ChevronLeft,
    ChevronRight,
    Menu,
    X,
    Baby,
} from "lucide-react"

const NAV_ITEMS = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/inventory", label: "Inventory", icon: Package },
    { href: "/admin/sales", label: "Orders", icon: ShoppingCart },
    { href: "/admin/customers", label: "Customers", icon: Users },
    { href: "/admin/accounts", label: "Accounts", icon: Receipt },
    { href: "/admin/settings", label: "Settings", icon: Settings },
]

export default function AdminSidebar() {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)

    const isActive = (href: string) => {
        if (href === "/admin/dashboard") return pathname === href
        if (href === "/admin/accounts") return pathname.startsWith("/admin/accounts")
        if (href === "/admin/sales") return pathname === "/admin/sales"
        return pathname.startsWith(href)
    }

    const NavContent = ({ onNavClick }: { onNavClick?: () => void }) => (
        <nav className="flex flex-col gap-1 px-2">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = isActive(href)
                return (
                    <Link
                        key={href}
                        href={href}
                        onClick={onNavClick}
                        className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-medium transition-all group
                            ${active
                                ? "bg-orange-600 text-white shadow-[0_12px_24px_-18px_rgba(234,88,12,0.9)]"
                                : "text-slate-500 hover:bg-white hover:shadow-sm hover:text-slate-900"}`}
                        aria-current={active ? "page" : undefined}
                    >
                        <Icon className={`w-5 h-5 shrink-0 ${active ? "text-orange-100" : "text-slate-400 group-hover:text-orange-600"}`} aria-hidden="true" />
                        <span className={`truncate transition-all ${collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"}`}>{label}</span>
                    </Link>
                )
            })}
        </nav>
    )

    return (
        <>
            {/* ── Desktop Sidebar ── */}
            <aside
                className={`admin-glass hidden md:flex flex-col h-screen sticky top-0 border-r border-white/60 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.35)] transition-all duration-300 shrink-0 ${collapsed ? "w-16" : "w-60"}`}
                aria-label="Admin navigation"
            >
                {/* Brand Header */}
                <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-200/70 ${collapsed ? "justify-center" : ""}`}>
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-[0_12px_20px_-12px_rgba(234,88,12,0.9)] flex items-center justify-center shrink-0">
                        <Baby className="w-5 h-5 text-white" aria-hidden="true" />
                    </div>
                    {!collapsed && (
                        <div className="leading-tight">
                            <p className="font-semibold text-slate-900 text-sm">Tiny Tales</p>
                            <p className="text-[10px] font-semibold text-slate-500 tracking-[0.24em] uppercase">Admin Panel</p>
                        </div>
                    )}
                </div>

                {/* Nav */}
                <div className="flex-1 py-4 overflow-y-auto">
                    <NavContent />
                </div>

                {/* Collapse Toggle */}
                <div className="border-t border-slate-200/70 py-3 px-2">
                    <button
                        onClick={() => setCollapsed(v => !v)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-white hover:shadow-sm transition-colors text-xs font-semibold tracking-wide"
                        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {collapsed
                            ? <ChevronRight className="w-4 h-4" aria-hidden="true" />
                            : <><ChevronLeft className="w-4 h-4" aria-hidden="true" /><span>Collapse</span></>
                        }
                    </button>
                </div>
            </aside>

            {/* ── Mobile Hamburger Trigger ── */}
            <button
                onClick={() => setMobileOpen(true)}
                className="admin-glass md:hidden fixed top-4 left-4 z-50 w-11 h-11 shadow-lg border border-white/70 rounded-2xl flex items-center justify-center text-slate-700"
                aria-label="Open navigation menu"
            >
                <Menu className="w-5 h-5" aria-hidden="true" />
            </button>

            {/* ── Mobile Drawer ── */}
            {mobileOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                        onClick={() => setMobileOpen(false)}
                        aria-hidden="true"
                    />
                    {/* Slide-in Drawer */}
                    <aside
                        className="admin-glass md:hidden fixed top-0 left-0 h-full w-72 shadow-2xl z-50 flex flex-col border-r border-white/60"
                        aria-label="Mobile admin navigation"
                    >
                        <div className="flex items-center justify-between px-4 py-5 border-b border-slate-200/70">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-[0_12px_20px_-12px_rgba(234,88,12,0.9)]">
                                    <Baby className="w-5 h-5 text-white" aria-hidden="true" />
                                </div>
                                <div className="leading-tight">
                                    <p className="font-semibold text-slate-900 text-sm">Tiny Tales</p>
                                    <p className="text-[10px] font-semibold text-slate-500 tracking-[0.24em] uppercase">Admin Panel</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setMobileOpen(false)}
                                className="w-9 h-9 flex items-center justify-center rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-white hover:shadow-sm transition-colors"
                                aria-label="Close navigation menu"
                            >
                                <X className="w-4 h-4" aria-hidden="true" />
                            </button>
                        </div>
                        <div className="flex-1 py-4 overflow-y-auto">
                            <NavContent onNavClick={() => setMobileOpen(false)} />
                        </div>
                    </aside>
                </>
            )}
        </>
    )
}
