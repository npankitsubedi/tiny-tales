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
    { href: "/admin/sales/customers", label: "Customers", icon: Users },
    { href: "/admin/accounts", label: "Accounts", icon: Receipt },
    { href: "/admin/settings", label: "Settings", icon: Settings },
]

export default function AdminSidebar() {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)

    const isActive = (href: string) => {
        if (href === "/admin/dashboard") return pathname === href
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
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                            ${active
                                ? "bg-teal-600 text-white shadow-sm shadow-teal-200"
                                : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"}`}
                        aria-current={active ? "page" : undefined}
                    >
                        <Icon className={`w-5 h-5 shrink-0 ${active ? "text-white" : "text-slate-400 group-hover:text-teal-600"}`} aria-hidden="true" />
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
                className={`hidden md:flex flex-col h-screen sticky top-0 bg-white border-r border-slate-100 shadow-sm transition-all duration-300 shrink-0 ${collapsed ? "w-16" : "w-56"}`}
                aria-label="Admin navigation"
            >
                {/* Brand Header */}
                <div className={`flex items-center gap-2.5 px-4 py-5 border-b border-slate-100 ${collapsed ? "justify-center" : ""}`}>
                    <div className="w-8 h-8 bg-teal-600 rounded-xl flex items-center justify-center shrink-0">
                        <Baby className="w-4 h-4 text-white" aria-hidden="true" />
                    </div>
                    {!collapsed && (
                        <span className="font-bold text-slate-800 text-sm leading-tight">
                            Tiny Tales<br />
                            <span className="text-[10px] font-normal text-slate-400 tracking-wider uppercase">Admin Panel</span>
                        </span>
                    )}
                </div>

                {/* Nav */}
                <div className="flex-1 py-4 overflow-y-auto">
                    <NavContent />
                </div>

                {/* Collapse Toggle */}
                <div className="border-t border-slate-100 py-3 px-2">
                    <button
                        onClick={() => setCollapsed(v => !v)}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors text-xs font-medium"
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
                className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white shadow-md border border-slate-100 rounded-xl flex items-center justify-center text-slate-700"
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
                        className="md:hidden fixed top-0 left-0 h-full w-64 bg-white shadow-2xl z-50 flex flex-col"
                        aria-label="Mobile admin navigation"
                    >
                        <div className="flex items-center justify-between px-4 py-5 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-teal-600 rounded-xl flex items-center justify-center">
                                    <Baby className="w-4 h-4 text-white" aria-hidden="true" />
                                </div>
                                <span className="font-bold text-slate-800 text-sm">Tiny Tales Admin</span>
                            </div>
                            <button
                                onClick={() => setMobileOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
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
