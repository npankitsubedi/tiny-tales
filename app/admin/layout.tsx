import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import AdminSidebar from "@/components/admin/AdminSidebar"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    // Single SUPERADMIN guard for the entire /admin route tree
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !(("role" in session.user) && session.user.role)) {
        redirect("/login")
    }

    const role = session.user.role as string
    if (role !== "SUPERADMIN") {
        redirect("/")
    }

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans">
            <AdminSidebar />
            {/* Main content pane — offset from sidebar via flex layout */}
            <main className="flex-1 min-w-0 overflow-y-auto pt-0 md:pt-0">
                {/* Mobile top spacer so hamburger button doesn't overlap content */}
                <div className="md:hidden h-16" aria-hidden="true" />
                {children}
            </main>
        </div>
    )
}
