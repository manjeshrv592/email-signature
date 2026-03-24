"use client";

import { useState } from "react";
import { deleteResourceItem } from "@/app/(dashboard)/resources/actions";
import { Trash2, Loader2 } from "lucide-react";

interface DeleteResourceItemButtonProps {
    id: string;
    resourceTypeId: string;
    name: string;
}

export function DeleteResourceItemButton({
    id,
    resourceTypeId,
    name,
}: DeleteResourceItemButtonProps) {
    const [confirming, setConfirming] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleDelete() {
        setLoading(true);
        setError("");

        try {
            const result = await deleteResourceItem(id, resourceTypeId);
            if (result?.error) {
                setError(result.error);
                setLoading(false);
                setConfirming(false);
            }
            // On success, server action redirects
        } catch {
            setError("Failed to delete. Please try again.");
            setLoading(false);
            setConfirming(false);
        }
    }

    if (confirming) {
        return (
            <div className="flex items-center gap-2">
                {error && (
                    <span className="text-red-400 text-xs">{error}</span>
                )}
                <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-sm font-medium rounded-xl transition-colors duration-200 disabled:opacity-50 cursor-pointer"
                >
                    {loading ? (
                        <Loader2 size={14} className="animate-spin" />
                    ) : (
                        <Trash2 size={14} />
                    )}
                    Confirm
                </button>
                <button
                    onClick={() => setConfirming(false)}
                    disabled={loading}
                    className="px-4 py-2.5 text-sm text-[#555] hover:text-white transition-colors cursor-pointer"
                >
                    Cancel
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={() => setConfirming(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#12121a] border border-[#1e1e2e] hover:border-red-500/30 hover:text-red-400 text-[#555] text-sm font-medium rounded-xl transition-colors duration-200 cursor-pointer"
        >
            <Trash2 size={14} />
            Delete
        </button>
    );
}
