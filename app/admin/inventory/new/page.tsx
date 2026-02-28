import ProductForm from "@/components/admin/ProductForm"

export const metadata = {
    title: "New Product | Tiny Tales Admin",
    description: "Create a new product in the Tiny Tales inventory.",
}

export default function NewProductPage() {
    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-12">
            <div className="max-w-6xl mx-auto space-y-8">
                <header className="mb-8 border-b border-slate-200 pb-6">
                    <h1 className="text-3xl font-serif text-slate-800 tracking-tight">Tiny Tales Admin</h1>
                    <p className="text-slate-500 mt-1">Inventory Management System</p>
                </header>

                <main>
                    <ProductForm />
                </main>
            </div>
        </div>
    )
}
