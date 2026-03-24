"use client";

import { useState } from "react";
import { syncUsers, syncGroups } from "./actions";
import { RefreshCw, Users, UsersRound, Check, AlertCircle } from "lucide-react";

type SyncState = "idle" | "loading" | "success" | "error";

interface SyncResult {
    message: string;
    type: "success" | "error";
}

export function SyncUsersButton() {
    const [state, setState] = useState<SyncState>("idle");
    const [result, setResult] = useState<SyncResult | null>(null);

    async function handleSync() {
        setState("loading");
        setResult(null);

        const res = await syncUsers();

        if (res.success) {
            setState("success");
            setResult({ message: `Synced ${res.count} users from M365`, type: "success" });
            setTimeout(() => setState("idle"), 3000);
        } else {
            setState("error");
            setResult({ message: res.error || "Sync failed", type: "error" });
            setTimeout(() => setState("idle"), 5000);
        }
    }

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={handleSync}
                disabled={state === "loading"}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-medium hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 cursor-pointer"
            >
                {state === "loading" ? (
                    <RefreshCw size={16} className="animate-spin" />
                ) : state === "success" ? (
                    <Check size={16} />
                ) : (
                    <Users size={16} />
                )}
                {state === "loading" ? "Syncing..." : "Sync Users"}
            </button>
            {result && (
                <span
                    className={`text-xs flex items-center gap-1.5 ${result.type === "success" ? "text-emerald-400" : "text-red-400"
                        }`}
                >
                    {result.type === "success" ? (
                        <Check size={14} />
                    ) : (
                        <AlertCircle size={14} />
                    )}
                    {result.message}
                </span>
            )}
        </div>
    );
}

export function SyncGroupsButton() {
    const [state, setState] = useState<SyncState>("idle");
    const [result, setResult] = useState<SyncResult | null>(null);

    async function handleSync() {
        setState("loading");
        setResult(null);

        const res = await syncGroups();

        if (res.success) {
            setState("success");
            setResult({
                message: `Synced ${res.groupCount} groups, ${res.membershipCount} memberships`,
                type: "success",
            });
            setTimeout(() => setState("idle"), 3000);
        } else {
            setState("error");
            setResult({ message: res.error || "Sync failed", type: "error" });
            setTimeout(() => setState("idle"), 5000);
        }
    }

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={handleSync}
                disabled={state === "loading"}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white text-sm font-medium hover:from-violet-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20 cursor-pointer"
            >
                {state === "loading" ? (
                    <RefreshCw size={16} className="animate-spin" />
                ) : state === "success" ? (
                    <Check size={16} />
                ) : (
                    <UsersRound size={16} />
                )}
                {state === "loading" ? "Syncing..." : "Sync Groups"}
            </button>
            {result && (
                <span
                    className={`text-xs flex items-center gap-1.5 ${result.type === "success" ? "text-emerald-400" : "text-red-400"
                        }`}
                >
                    {result.type === "success" ? (
                        <Check size={14} />
                    ) : (
                        <AlertCircle size={14} />
                    )}
                    {result.message}
                </span>
            )}
        </div>
    );
}
