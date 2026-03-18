import { SignIn } from "@clerk/nextjs"

export const metadata = { title: "Sign In" }

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-4 py-16">
            <SignIn />
        </div>
    )
}
