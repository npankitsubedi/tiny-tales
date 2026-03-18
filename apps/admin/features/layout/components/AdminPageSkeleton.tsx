type AdminPageSkeletonProps = {
    variant?: "dashboard" | "table" | "settings" | "inventory"
}

function SkeletonBlock({ className }: { className: string }) {
    return <div className={`bg-primary/10 animate-pulse-soft ${className}`} />
}

export default function AdminPageSkeleton({ variant = "dashboard" }: AdminPageSkeletonProps) {
    const isTable = variant === "table" || variant === "inventory"
    const isSettings = variant === "settings"

    return (
        <div className="min-h-screen p-6 md:p-10">
            <div className="max-w-[1400px] mx-auto space-y-8">
                <div className="admin-glass rounded-[1.75rem] border border-white/70 px-6 py-5 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.28)]">
                    <SkeletonBlock className="h-3 w-28 rounded-full" />
                    <SkeletonBlock className="mt-3 h-9 w-72 rounded-2xl" />
                    <SkeletonBlock className="mt-3 h-4 w-full max-w-xl rounded-full" />
                </div>

                {!isSettings && (
                    <div className={`grid gap-4 ${isTable ? "grid-cols-2 md:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"}`}>
                        {Array.from({ length: isTable ? 3 : 4 }).map((_, index) => (
                            <div key={index} className="admin-surface rounded-[1.6rem] p-5">
                                <div className="flex items-center justify-between gap-4">
                                    <SkeletonBlock className="h-11 w-11 rounded-2xl" />
                                    <SkeletonBlock className="h-8 w-16 rounded-2xl" />
                                </div>
                                <SkeletonBlock className="mt-5 h-3 w-24 rounded-full" />
                                <SkeletonBlock className="mt-3 h-8 w-32 rounded-2xl" />
                            </div>
                        ))}
                    </div>
                )}

                {isSettings ? (
                    <div className="space-y-6">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <div key={index} className="admin-surface rounded-[1.75rem] p-6 space-y-5">
                                <div className="flex items-center gap-3">
                                    <SkeletonBlock className="h-12 w-12 rounded-2xl" />
                                    <div className="space-y-2">
                                        <SkeletonBlock className="h-4 w-40 rounded-full" />
                                        <SkeletonBlock className="h-3 w-64 rounded-full" />
                                    </div>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <SkeletonBlock className="h-12 rounded-2xl" />
                                    <SkeletonBlock className="h-12 rounded-2xl" />
                                    <SkeletonBlock className="h-12 rounded-2xl md:col-span-2" />
                                    <SkeletonBlock className="h-24 rounded-[1.5rem] md:col-span-2" />
                                </div>
                                <div className="flex justify-end">
                                    <SkeletonBlock className="h-11 w-44 rounded-2xl" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={`grid gap-6 ${variant === "inventory" ? "grid-cols-1 lg:grid-cols-4" : "grid-cols-1"}`}>
                        <div className={variant === "inventory" ? "lg:col-span-3" : ""}>
                            <div className="admin-surface rounded-[1.75rem] overflow-hidden">
                                <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="space-y-2">
                                        <SkeletonBlock className="h-3 w-28 rounded-full" />
                                        <SkeletonBlock className="h-6 w-52 rounded-2xl" />
                                    </div>
                                    <SkeletonBlock className="h-11 w-full rounded-2xl sm:w-72" />
                                </div>
                                <div className="space-y-3 p-6">
                                    {Array.from({ length: 6 }).map((_, index) => (
                                        <div key={index} className="grid grid-cols-[1.8fr_1fr_1fr_1fr] gap-4 rounded-[1.25rem] border border-slate-100 bg-white/80 p-4">
                                            <SkeletonBlock className="h-5 w-full rounded-full" />
                                            <SkeletonBlock className="h-5 w-full rounded-full" />
                                            <SkeletonBlock className="h-5 w-full rounded-full" />
                                            <SkeletonBlock className="h-5 w-full rounded-full" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {variant === "inventory" && (
                            <div className="admin-surface rounded-[1.75rem] p-5 space-y-4">
                                <SkeletonBlock className="h-4 w-32 rounded-full" />
                                {Array.from({ length: 4 }).map((_, index) => (
                                    <div key={index} className="space-y-3 rounded-[1.25rem] border border-slate-100 bg-white/80 p-4">
                                        <SkeletonBlock className="h-4 w-28 rounded-full" />
                                        <SkeletonBlock className="h-3 w-36 rounded-full" />
                                        <SkeletonBlock className="h-9 w-full rounded-2xl" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
