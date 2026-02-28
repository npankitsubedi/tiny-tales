import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token
        const path = req.nextUrl.pathname

        if (!token) {
            return NextResponse.redirect(new URL("/login", req.url))
        }

        const role = token.role as string

        // Super Admin overrides all logic
        if (role === "SUPERADMIN") {
            return NextResponse.next()
        }

        // Role-based route protection
        if (path.startsWith("/admin/inventory") && role !== "INVENTORY_ADMIN") {
            return NextResponse.redirect(new URL("/unauthorized", req.url))
        }

        if (path.startsWith("/admin/sales") && role !== "SALES_ADMIN") {
            return NextResponse.redirect(new URL("/unauthorized", req.url))
        }

        if (path.startsWith("/admin/accounts") && role !== "ACCOUNTS_ADMIN") {
            return NextResponse.redirect(new URL("/unauthorized", req.url))
        }

        // Fallback block for base /admin routes if any
        if (path.startsWith("/admin") && role === "CUSTOMER") {
            return NextResponse.redirect(new URL("/unauthorized", req.url))
        }

        return NextResponse.next()
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
)

export const config = {
    matcher: ["/admin/:path*"],
}
