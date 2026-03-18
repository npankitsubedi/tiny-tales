"use client"

import { useState, useTransition } from "react"
import { StickyNote, Save } from "lucide-react"
import toast from "react-hot-toast"
import LoadingButton from "@/components/ui/LoadingButton"

interface InternalNotesCardProps {
    orderId: string
    initialNotes: string | null
    onSave: (orderId: string, notes: string) => Promise<{ success: boolean; error?: string }>
}

export default function InternalNotesCard({ orderId, initialNotes, onSave }: InternalNotesCardProps) {
    const [notes, setNotes] = useState(initialNotes ?? "")
    const [savedVersion, setSavedVersion] = useState(initialNotes ?? "")
    const [isPending, startTransition] = useTransition()
    const isDirty = notes !== savedVersion
    const MAX = 500

    const handleSave = () => {
        startTransition(async () => {
            const res = await onSave(orderId, notes)
            if (res.success) {
                setSavedVersion(notes)
                toast.success("Notes saved")
            } else {
                toast.error(res.error ?? "Failed to save notes")
            }
        })
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <StickyNote className="w-3.5 h-3.5" /> Internal Notes
            </h3>

            <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, MAX))}
                disabled={isPending}
                placeholder="e.g. Customer requested gift wrap. Handle with care."
                rows={4}
                className="w-full text-sm text-slate-700 placeholder:text-slate-300 bg-slate-50 border border-slate-200 rounded-xl p-3.5 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-all"
            />

            <div className="flex items-center justify-between mt-2.5">
                <span className={`text-[11px] ${notes.length >= MAX ? "text-rose-500" : "text-slate-400"}`}>
                    {notes.length}/{MAX}
                </span>
                <LoadingButton
                    onClick={handleSave}
                    isLoading={isPending}
                    disabled={!isDirty || isPending}
                    loadingText="Saving..."
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-lg transition-all disabled:opacity-40"
                >
                    <Save className="w-3.5 h-3.5" />
                    Save Note
                </LoadingButton>
            </div>
        </div>
    )
}
