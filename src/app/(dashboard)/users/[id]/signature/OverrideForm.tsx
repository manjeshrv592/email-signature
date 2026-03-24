"use client";

import { useState, useTransition } from "react";
import { saveUserOverride, clearUserOverride } from "./actions";
import { Save, Loader2, CheckCircle2, RotateCcw, X, Plus } from "lucide-react";

interface OverrideFormProps {
    userId: string;
    currentTemplateId: string | null;
    currentOverrideItems: { add?: string[]; remove?: string[] };
    templates: Array<{ id: string; name: string; isDefault: boolean | null }>;
    resourceItems: Array<{
        id: string;
        name: string;
        resourceTypeName: string;
        resourceTypeId: string;
        isActive: boolean | null;
    }>;
    hasOverride: boolean;
}

export default function OverrideForm({
    userId,
    currentTemplateId,
    currentOverrideItems,
    templates,
    resourceItems,
    hasOverride,
}: OverrideFormProps) {
    const [templateId, setTemplateId] = useState(currentTemplateId || "");
    const [removeIds, setRemoveIds] = useState<string[]>(currentOverrideItems.remove || []);
    const [addIds, setAddIds] = useState<string[]>(currentOverrideItems.add || []);
    const [isPending, startTransition] = useTransition();
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");

    function handleSave() {
        setError("");
        setSaved(false);

        startTransition(async () => {
            const result = await saveUserOverride(userId, {
                customTemplateId: templateId || null,
                overrideItems: {
                    add: addIds,
                    remove: removeIds,
                },
            });

            if (result?.error) {
                setError(result.error);
            } else {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        });
    }

    function handleReset() {
        setError("");
        setSaved(false);

        startTransition(async () => {
            const result = await clearUserOverride(userId);
            if (result?.error) {
                setError(result.error);
            } else {
                setTemplateId("");
                setRemoveIds([]);
                setAddIds([]);
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        });
    }

    // Group resource items by type
    const itemsByType = resourceItems.reduce(
        (acc, item) => {
            if (!acc[item.resourceTypeName]) acc[item.resourceTypeName] = [];
            acc[item.resourceTypeName].push(item);
            return acc;
        },
        {} as Record<string, typeof resourceItems>
    );

    return (
        <div className="space-y-6">
            {/* Error */}
            {error && (
                <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Custom Template */}
            <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-5">
                <label className="block text-xs text-[#555] uppercase tracking-wider font-medium mb-2">
                    Custom Template
                </label>
                <p className="text-[#555] text-xs mb-3">
                    Use a specific template for this user instead of the default
                </p>
                <select
                    value={templateId}
                    onChange={(e) => {
                        setTemplateId(e.target.value);
                        setSaved(false);
                    }}
                    className="w-full bg-[#0a0a0f] border border-[#1e1e2e] text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-violet-500/50 transition-colors"
                >
                    <option value="">Use Default Template</option>
                    {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                            {t.name} {t.isDefault ? "(Default)" : ""}
                        </option>
                    ))}
                </select>
            </div>

            {/* Remove Items */}
            <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-5">
                <label className="block text-xs text-[#555] uppercase tracking-wider font-medium mb-2">
                    Exclude Resources
                </label>
                <p className="text-[#555] text-xs mb-3">
                    Remove specific resource items from this user&apos;s signature even if rules assign them
                </p>

                {removeIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {removeIds.map((id) => {
                            const item = resourceItems.find((i) => i.id === id);
                            return (
                                <span
                                    key={id}
                                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20"
                                >
                                    {item?.name || id}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setRemoveIds((prev) => prev.filter((i) => i !== id));
                                            setSaved(false);
                                        }}
                                        className="hover:text-white cursor-pointer"
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            );
                        })}
                    </div>
                )}

                <select
                    value=""
                    onChange={(e) => {
                        if (e.target.value && !removeIds.includes(e.target.value)) {
                            setRemoveIds((prev) => [...prev, e.target.value]);
                            setSaved(false);
                        }
                    }}
                    className="w-full bg-[#0a0a0f] border border-[#1e1e2e] text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-violet-500/50 transition-colors"
                >
                    <option value="">Select an item to exclude…</option>
                    {Object.entries(itemsByType).map(([typeName, items]) => (
                        <optgroup key={typeName} label={typeName}>
                            {items
                                .filter((i) => !removeIds.includes(i.id))
                                .map((i) => (
                                    <option key={i.id} value={i.id}>
                                        {i.name}
                                    </option>
                                ))}
                        </optgroup>
                    ))}
                </select>
            </div>

            {/* Add Items */}
            <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-5">
                <label className="block text-xs text-[#555] uppercase tracking-wider font-medium mb-2">
                    Include Additional Resources
                </label>
                <p className="text-[#555] text-xs mb-3">
                    Add specific resource items to this user&apos;s signature beyond what rules assign
                </p>

                {addIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {addIds.map((id) => {
                            const item = resourceItems.find((i) => i.id === id);
                            return (
                                <span
                                    key={id}
                                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                >
                                    <Plus size={10} />
                                    {item?.name || id}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAddIds((prev) => prev.filter((i) => i !== id));
                                            setSaved(false);
                                        }}
                                        className="hover:text-white cursor-pointer"
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            );
                        })}
                    </div>
                )}

                <select
                    value=""
                    onChange={(e) => {
                        if (e.target.value && !addIds.includes(e.target.value)) {
                            setAddIds((prev) => [...prev, e.target.value]);
                            setSaved(false);
                        }
                    }}
                    className="w-full bg-[#0a0a0f] border border-[#1e1e2e] text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-violet-500/50 transition-colors"
                >
                    <option value="">Select an item to include…</option>
                    {Object.entries(itemsByType).map(([typeName, items]) => (
                        <optgroup key={typeName} label={typeName}>
                            {items
                                .filter((i) => !addIds.includes(i.id))
                                .map((i) => (
                                    <option key={i.id} value={i.id}>
                                        {i.name}
                                    </option>
                                ))}
                        </optgroup>
                    ))}
                </select>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
                <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors duration-200 shadow-lg shadow-violet-600/20 disabled:opacity-50 cursor-pointer"
                >
                    {isPending ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <Save size={16} />
                    )}
                    Save Override
                </button>

                {hasOverride && (
                    <button
                        onClick={handleReset}
                        disabled={isPending}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#12121a] border border-[#1e1e2e] hover:border-[#2a2a3e] text-[#8a8f98] hover:text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        <RotateCcw size={14} />
                        Reset to Default
                    </button>
                )}

                {saved && (
                    <span className="inline-flex items-center gap-1.5 text-emerald-400 text-sm">
                        <CheckCircle2 size={14} />
                        Saved
                    </span>
                )}
            </div>
        </div>
    );
}
