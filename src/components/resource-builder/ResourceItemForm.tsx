"use client";

import { useState, useCallback } from "react";
import { DynamicForm } from "./DynamicForm";
import { createResourceItem, updateResourceItem } from "@/app/(dashboard)/resources/actions";
import type { FieldDefinition } from "@/app/(dashboard)/resource-types/actions";
import { Loader2 } from "lucide-react";

interface ResourceItemFormProps {
    resourceTypeId: string;
    resourceTypeName: string;
    fields: FieldDefinition[];
    // Edit mode props
    mode?: "create" | "edit";
    itemId?: string;
    initialValues?: {
        name: string;
        fieldValues: Record<string, unknown>;
        validFrom?: string | null;
        validUntil?: string | null;
        isActive?: boolean;
    };
}

export function ResourceItemForm({
    resourceTypeId,
    resourceTypeName,
    fields,
    mode = "create",
    itemId,
    initialValues,
}: ResourceItemFormProps) {
    const [name, setName] = useState(initialValues?.name || "");
    const [fieldValues, setFieldValues] = useState<Record<string, unknown>>(
        initialValues?.fieldValues || {}
    );
    const [validFrom, setValidFrom] = useState(initialValues?.validFrom || "");
    const [validUntil, setValidUntil] = useState(initialValues?.validUntil || "");
    const [isActive, setIsActive] = useState(initialValues?.isActive ?? true);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setLoading(true);
            setError("");

            try {
                const data = {
                    name,
                    fieldValues,
                    validFrom: validFrom || null,
                    validUntil: validUntil || null,
                    isActive,
                };

                let result;
                if (mode === "edit" && itemId) {
                    result = await updateResourceItem(itemId, data);
                } else {
                    result = await createResourceItem({
                        ...data,
                        resourceTypeId,
                    });
                }

                if (result?.error) {
                    setError(result.error);
                    setLoading(false);
                }
                // On success, server action redirects
            } catch {
                setError("Something went wrong. Please try again.");
                setLoading(false);
            }
        },
        [name, fieldValues, validFrom, validUntil, isActive, mode, itemId, resourceTypeId]
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Banner */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
                    {error}
                </div>
            )}

            {/* Item Name */}
            <div>
                <label className="block text-sm font-medium text-[#ccc] mb-1.5">
                    Item Name <span className="text-amber-400">*</span>
                </label>
                <input
                    type="text"
                    className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#333] focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-colors duration-200"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={`e.g. ISO 27001, Holiday Banner`}
                    required
                />
                <p className="text-[#444] text-xs mt-1">
                    A display name for this {resourceTypeName.toLowerCase()} item
                </p>
            </div>

            {/* Dynamic Fields */}
            <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-5">
                <h3 className="text-white font-semibold text-sm mb-4">
                    {resourceTypeName} Fields
                </h3>
                <DynamicForm
                    fields={fields}
                    values={fieldValues}
                    onChange={setFieldValues}
                />
            </div>

            {/* Time-Bound Settings */}
            <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-5">
                <h3 className="text-white font-semibold text-sm mb-1">
                    Time-Bound Settings
                </h3>
                <p className="text-[#555] text-xs mb-4">
                    Optional — schedule this resource to be active only during a specific period.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-[#ccc] mb-1.5">
                            Valid From
                        </label>
                        <input
                            type="datetime-local"
                            className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-colors duration-200"
                            style={{ colorScheme: "dark" }}
                            value={validFrom || ""}
                            onChange={(e) => setValidFrom(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#ccc] mb-1.5">
                            Valid Until
                        </label>
                        <input
                            type="datetime-local"
                            className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-colors duration-200"
                            style={{ colorScheme: "dark" }}
                            value={validUntil || ""}
                            onChange={(e) => setValidUntil(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Active Toggle (edit mode only) */}
            {mode === "edit" && (
                <div className="flex items-center justify-between bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-5">
                    <div>
                        <h3 className="text-white font-semibold text-sm">Active Status</h3>
                        <p className="text-[#555] text-xs mt-0.5">
                            Inactive items are excluded from signature generation
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsActive(!isActive)}
                        className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer overflow-hidden ${isActive ? "bg-emerald-500" : "bg-[#1e1e2e]"
                            }`}
                    >
                        <span
                            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${isActive ? "translate-x-5" : "translate-x-0"
                                }`}
                        />
                    </button>
                </div>
            )}

            {/* Submit */}
            <div className="flex items-center gap-3 pt-2">
                <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors duration-200 shadow-lg shadow-violet-600/20 cursor-pointer"
                >
                    {loading && <Loader2 size={16} className="animate-spin" />}
                    {mode === "edit" ? "Save Changes" : `Create ${resourceTypeName}`}
                </button>
            </div>
        </form>
    );
}
