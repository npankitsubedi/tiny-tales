import { Role } from "@tinytales/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function requireRole(allowedRoles: Role[]) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.role) {
        throw new Error("Unauthorized: No active session found")
    }

    if (!allowedRoles.includes(session.user.role as Role)) {
        throw new Error("Forbidden: Insufficient privileges")
    }

    return session.user
}

export async function requireSuperadmin() {
    return requireRole([Role.SUPERADMIN])
}
