import { SignUp } from "@clerk/nextjs"

export const metadata = { title: "Create Account" }

export default function RegisterPage() {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-4 py-16">
            <SignUp />
        </div>
    )
}
