"use client";

import { useState, useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { deleteResourceType } from "../actions";

interface DeleteResourceTypeButtonProps {
    id: string;
    name: string;
}

export function DeleteResourceTypeButton({ id, name }: DeleteResourceTypeButtonProps) {
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    function handleDelete() {
        setError(null);
        startTransition(async () => {
            const result = await deleteResourceType(id);
            if (result?.error) {
                setError(result.error);
                setShowConfirm(false);
            }
            // On success, the server action redirects
        });
    }

    if (showConfirm) {
        return (
            <div className="flex items-center gap-2">
                {error && (
                    <span className="text-xs text-red-400 mr-2">{error}</span>
                )}
                <span className="text-xs text-[#8a8f98]">
                    Delete &quot;{name}&quot;?
                </span>
                <button
                    onClick={handleDelete}
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-xs font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                    {isPending ? (
                        <Loader2 size={12} className="animate-spin" />
                    ) : (
                        <Trash2 size={12} />
                    )}
                    Confirm
                </button>
                <button
                    onClick={() => {
                        setShowConfirm(false);
                        setError(null);
                    }}
                    className="px-3 py-2 text-xs text-[#555] hover:text-white transition-colors cursor-pointer"
                >
                    Cancel
                </button>
            </div>
        );
    }

    return (
        <>
            {error && (
                <div className="text-xs text-red-400 mr-2">{error}</div>
            )}
            <button
                onClick={() => setShowConfirm(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#12121a] border border-[#1e1e2e] hover:border-red-500/30 text-[#555] hover:text-red-400 text-sm font-medium rounded-xl transition-colors duration-200 cursor-pointer"
            >
                <Trash2 size={14} />
                Delete
            </button>
        </>
    );
}
