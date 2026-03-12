import { ZodError } from "zod"

export type ActionSuccess<T = void> = T extends void
    ? { success: true; message?: string }
    : { success: true; data: T; message?: string }

export type ActionFailure = {
    success: false
    error: string
}

export type ActionResult<T = void> = ActionSuccess<T> | ActionFailure

export function actionSuccess<T = void>(
    data?: T,
    message?: string
): ActionResult<T> {
    if (data === undefined) {
        return { success: true, message } as ActionResult<T>
    }

    return { success: true, data, message }
}

export function actionError(error: unknown, fallback: string): ActionFailure {
    if (error instanceof ZodError) {
        return {
            success: false,
            error: error.issues[0]?.message ?? fallback,
        }
    }

    if (error instanceof Error && error.message) {
        return {
            success: false,
            error: error.message,
        }
    }

    return {
        success: false,
        error: fallback,
    }
}
