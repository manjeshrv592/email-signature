"use client";

import { useState } from "react";
import { toggleResourceItemActive } from "@/app/(dashboard)/resources/actions";
import { Power, Loader2 } from "lucide-react";

interface ToggleActiveButtonProps {
    id: string;
    isActive: boolean;
}

export function ToggleActiveButton({ id, isActive }: ToggleActiveButtonProps) {
    const [loading, setLoading] = useState(false);
    const [active, setActive] = useState(isActive);

    async function handleToggle() {
        setLoading(true);

        try {
            const result = await toggleResourceItemActive(id);
            if (!result?.error) {
                setActive(!active);
            }
        } catch {
            // Silently fail
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            onClick={handleToggle}
            disabled={loading}
            className={`inline-flex items-center gap-2 px-4 py-2.5 border text-sm font-medium rounded-xl transition-colors duration-200 disabled:opacity-50 cursor-pointer ${active
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                    : "bg-[#12121a] border-[#1e1e2e] text-[#555] hover:text-white hover:border-[#2a2a3e]"
                }`}
        >
            {loading ? (
                <Loader2 size={14} className="animate-spin" />
            ) : (
                <Power size={14} />
            )}
            {active ? "Active" : "Inactive"}
        </button>
    );
}
