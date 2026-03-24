"use client";

import { useState } from "react";
import { deleteRule } from "../actions";
import { Trash2, Loader2 } from "lucide-react";

interface DeleteButtonProps {
    ruleId: string;
}

export default function DeleteButton({ ruleId }: DeleteButtonProps) {
    const [confirming, setConfirming] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleDelete() {
        setLoading(true);
        try {
            const result = await deleteRule(ruleId);
            if (result?.error) {
                alert(result.error);
                setLoading(false);
                setConfirming(false);
            }
            // Redirect happens in server action
        } catch {
            setLoading(false);
            setConfirming(false);
        }
    }

    if (confirming) {
        return (
            <div className="flex items-center gap-2">
                <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-sm font-medium rounded-xl transition-colors duration-200 disabled:opacity-50 cursor-pointer"
                >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    Confirm
                </button>
                <button
                    onClick={() => setConfirming(false)}
                    className="px-4 py-2.5 text-[#8a8f98] hover:text-white text-sm font-medium rounded-xl transition-colors cursor-pointer"
                >
                    Cancel
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={() => setConfirming(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#12121a] border border-[#1e1e2e] hover:border-red-500/30 text-[#8a8f98] hover:text-red-400 text-sm font-medium rounded-xl transition-colors duration-200 cursor-pointer"
        >
            <Trash2 size={14} />
            Delete
        </button>
    );
}
