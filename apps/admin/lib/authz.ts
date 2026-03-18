import { Role } from "@tinytales/db"
import { auth } from "@clerk/nextjs/server"

export async function requireRole(allowedRoles: Role[]) {
    const { userId, sessionClaims } = await auth()

    if (!userId) {
        throw new Error("Unauthorized: No active session found")
    }

    const role = (sessionClaims?.metadata as { role?: string })?.role
    if (!role || !allowedRoles.includes(role as Role)) {
        throw new Error("Forbidden: Insufficient privileges")
    }

    return { id: userId, role }
}

export async function requireSuperadmin() {
    return requireRole([Role.SUPERADMIN])
}
