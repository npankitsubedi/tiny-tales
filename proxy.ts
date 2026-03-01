import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
    // `withAuth` augments your Request with the user's token.
    function middleware(req) {
        const url = req.nextUrl.pathname
        const role = req.nextauth.token?.role

        // Protect the entire /admin namespace
        if (url.startsWith("/admin")) {
            // Strict Zero Trust: ONLY SUPERADMIN allowed in the global admin layout
            if (role !== "SUPERADMIN") {
                // Redirect non-admins trying to snoop to the homepage or login
                return NextResponse.redirect(new URL("/login?error=unauthorized", req.url))
            }
        }

        return NextResponse.next()
    },
    {
        callbacks: {
            // Return true here so the middleware function above is ALWAYS invoked,
            // even if there is no token (so we can redirect them to /login).
            authorized: ({ token, req }) => {
                // If it's an admin route, they MUST have a token (force redirect to sign in if missing)
                if (req.nextUrl.pathname.startsWith("/admin")) {
                    return !!token
                }
                // Other public routes allow no token
                return true
            }
        },
    }
)

export const config = {
    // Only run middleware on the admin namespace to save Edge compute
    matcher: ["/admin/:path*"]
}
