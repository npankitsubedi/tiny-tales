"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ShoppingBag, User, LogOut, Menu } from "lucide-react";
import { useCart } from "@/store/cartStore";

export default function StorefrontHeader() {
  const { data: session } = useSession();
  const { items } = useCart();
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold tracking-tight text-teal-600">
          Tiny Tales
        </Link>

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex space-x-8 text-sm font-medium text-slate-600">
          <Link href="/shop" className="hover:text-teal-600 transition-colors">Shop All</Link>
          <Link href="/shop?category=NEWBORN" className="hover:text-teal-600 transition-colors">Newborn</Link>
          <Link href="/shop?category=TOYS" className="hover:text-teal-600 transition-colors">Toys</Link>
        </nav>

        {/* Icons Area */}
        <div className="flex items-center space-x-5">
          {/* Cart Badge */}
          <Link href="/checkout" className="relative p-2 text-slate-600 hover:text-teal-600">
            <ShoppingBag className="h-6 w-6" />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-teal-500 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          {/* User Auth Logic */}
          {session ? (
            <div className="flex items-center space-x-4">
              <Link href="/account" className="flex items-center space-x-1 text-sm font-medium text-slate-600 hover:text-teal-600">
                <User className="h-5 w-5" />
                <span className="hidden sm:inline">Account</span>
              </Link>
              {session.user.role === "SUPERADMIN" && (
                <Link href="/admin/inventory" className="text-xs bg-slate-100 px-2 py-1 rounded hover:bg-slate-200 transition">
                  Admin
                </Link>
              )}
              <button onClick={() => signOut()} className="text-slate-400 hover:text-red-500">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <Link href="/login" className="rounded-full bg-teal-600 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition-all shadow-md active:scale-95">
              Login
            </Link>
          )}
          
          <button className="md:hidden text-slate-600">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
