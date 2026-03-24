"use client";

import { useState, useTransition } from "react";
import { deleteTemplate } from "../actions";
import { Trash2, Loader2 } from "lucide-react";

interface DeleteButtonProps {
    id: string;
    isDefault: boolean;
}

export default function DeleteButton({ id, isDefault }: DeleteButtonProps) {
    const [confirming, setConfirming] = useState(false);
    const [error, setError] = useState("");
    const [isPending, startTransition] = useTransition();

    if (isDefault) {
        return (
            <button
                disabled
                title="Cannot delete the default template"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#12121a] border border-[#1e1e2e] text-[#555] text-sm font-medium rounded-xl opacity-50 cursor-not-allowed"
            >
                <Trash2 size={14} />
                Delete
            </button>
        );
    }

    if (!confirming) {
        return (
            <button
                onClick={() => setConfirming(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#12121a] border border-[#1e1e2e] hover:border-red-500/30 text-red-400 text-sm font-medium rounded-xl transition-colors cursor-pointer"
            >
                <Trash2 size={14} />
                Delete
            </button>
        );
    }

    return (
        <div className="flex items-center gap-2">
            {error && <span className="text-red-400 text-xs">{error}</span>}
            <button
                onClick={() => setConfirming(false)}
                disabled={isPending}
                className="px-3 py-2 text-[#8a8f98] hover:text-white text-sm rounded-xl transition-colors cursor-pointer"
            >
                Cancel
            </button>
            <button
                onClick={() => {
                    setError("");
                    startTransition(async () => {
                        try {
                            const result = await deleteTemplate(id);
                            if (result?.error) {
                                setError(result.error);
                                setConfirming(false);
                            }
                        } catch {
                            // redirect throws, expected
                        }
                    });
                }}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
                {isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Confirm Delete
            </button>
        </div>
    );
}
