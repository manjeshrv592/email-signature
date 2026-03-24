"use client";

import { useState, useEffect } from "react";
import { createRule, updateRule } from "./actions";
import type { ScopeType } from "./actions";
import { Scale, Loader2, AlertCircle } from "lucide-react";

// ─── Types ──────────────────────────────────────────

interface ResourceTypeOption {
    id: string;
    name: string;
}

interface ResourceItemOption {
    id: string;
    name: string;
    resourceTypeId: string;
    isActive: boolean | null;
}

interface UserOption {
    id: string;
    displayName: string | null;
    email: string;
}

interface GroupOption {
    id: string;
    name: string;
}

interface RuleFormProps {
    mode: "create" | "edit";
    ruleId?: string;
    resourceTypes: ResourceTypeOption[];
    resourceItems: ResourceItemOption[];
    users: UserOption[];
    groups: GroupOption[];
    countries: string[];
    jobTitles: string[];
    defaultValues?: {
        resourceItemId: string;
        scopeType: ScopeType;
        scopeValue: string;
        priority: number;
    };
}

const SCOPE_LABELS: Record<ScopeType, string> = {
    global: "Global",
    country: "Country",
    job_title: "Job Title",
    group: "Group",
    individual: "Individual",
};

const SCOPE_DESCRIPTIONS: Record<ScopeType, string> = {
    global: "Applies to all users in the organization",
    country: "Applies to users in a specific country",
    job_title: "Applies to users with a specific job title",
    group: "Applies to members of a specific group",
    individual: "Applies to a single specific user",
};

export default function RuleForm({
    mode,
    ruleId,
    resourceTypes,
    resourceItems,
    users,
    groups,
    countries,
    jobTitles,
    defaultValues,
}: RuleFormProps) {
    const [resourceItemId, setResourceItemId] = useState(defaultValues?.resourceItemId || "");
    const [scopeType, setScopeType] = useState<ScopeType>(defaultValues?.scopeType || "global");
    const [scopeValue, setScopeValue] = useState(defaultValues?.scopeValue || "*");
    const [priority, setPriority] = useState(defaultValues?.priority ?? 0);
    const [selectedTypeId, setSelectedTypeId] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Auto-select type from default resource item
    useEffect(() => {
        if (defaultValues?.resourceItemId) {
            const item = resourceItems.find((i) => i.id === defaultValues.resourceItemId);
            if (item) setSelectedTypeId(item.resourceTypeId);
        }
    }, [defaultValues?.resourceItemId, resourceItems]);

    // Reset scope value when scope type changes
    useEffect(() => {
        if (scopeType === "global") {
            setScopeValue("*");
        } else if (!defaultValues || scopeType !== defaultValues.scopeType) {
            setScopeValue("");
        }
    }, [scopeType, defaultValues]);

    const filteredItems = selectedTypeId
        ? resourceItems.filter((i) => i.resourceTypeId === selectedTypeId)
        : resourceItems;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const data = {
                resourceItemId,
                scopeType,
                scopeValue: scopeType === "global" ? "*" : scopeValue,
                priority,
            };

            let result;
            if (mode === "create") {
                result = await createRule(data);
            } else {
                result = await updateRule(ruleId!, data);
            }

            if (result?.error) {
                setError(result.error);
                setLoading(false);
            }
            // Redirect happens in server action on success
        } catch {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    <AlertCircle size={16} className="shrink-0" />
                    {error}
                </div>
            )}

            {/* Resource Item Selection */}
            <div className="space-y-4 bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-5">
                <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                    <Scale size={16} className="text-violet-400" />
                    Resource Item
                </h3>

                {/* Resource Type Filter */}
                <div>
                    <label className="block text-xs text-[#8a8f98] mb-1.5">
                        Filter by Resource Type
                    </label>
                    <select
                        value={selectedTypeId}
                        onChange={(e) => {
                            setSelectedTypeId(e.target.value);
                            setResourceItemId("");
                        }}
                        className="w-full bg-[#0a0a0f] border border-[#1e1e2e] text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-violet-500/50 transition-colors"
                    >
                        <option value="">All types</option>
                        {resourceTypes.map((type) => (
                            <option key={type.id} value={type.id}>
                                {type.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Resource Item */}
                <div>
                    <label className="block text-xs text-[#8a8f98] mb-1.5">
                        Resource Item <span className="text-red-400">*</span>
                    </label>
                    <select
                        value={resourceItemId}
                        onChange={(e) => setResourceItemId(e.target.value)}
                        required
                        className="w-full bg-[#0a0a0f] border border-[#1e1e2e] text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-violet-500/50 transition-colors"
                    >
                        <option value="">Select a resource item…</option>
                        {filteredItems.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.name} {!item.isActive ? "(inactive)" : ""}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Scope Type */}
            <div className="space-y-4 bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-5">
                <h3 className="text-white font-semibold text-sm">Scope</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(Object.keys(SCOPE_LABELS) as ScopeType[]).map((type) => (
                        <button
                            type="button"
                            key={type}
                            onClick={() => setScopeType(type)}
                            className={`text-left px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer ${scopeType === type
                                    ? "bg-violet-500/10 border-violet-500/30 text-violet-400"
                                    : "bg-[#0a0a0f] border-[#1e1e2e] text-[#8a8f98] hover:border-[#2a2a3e] hover:text-white"
                                }`}
                        >
                            <div className="text-sm font-medium">{SCOPE_LABELS[type]}</div>
                            <div className="text-[10px] opacity-60 mt-0.5">
                                {SCOPE_DESCRIPTIONS[type]}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Scope Value */}
                {scopeType !== "global" && (
                    <div>
                        <label className="block text-xs text-[#8a8f98] mb-1.5">
                            {SCOPE_LABELS[scopeType]} Value{" "}
                            <span className="text-red-400">*</span>
                        </label>

                        {scopeType === "country" && (
                            <select
                                value={scopeValue}
                                onChange={(e) => setScopeValue(e.target.value)}
                                required
                                className="w-full bg-[#0a0a0f] border border-[#1e1e2e] text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-violet-500/50 transition-colors"
                            >
                                <option value="">Select a country…</option>
                                {countries.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        )}

                        {scopeType === "job_title" && (
                            <select
                                value={scopeValue}
                                onChange={(e) => setScopeValue(e.target.value)}
                                required
                                className="w-full bg-[#0a0a0f] border border-[#1e1e2e] text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-violet-500/50 transition-colors"
                            >
                                <option value="">Select a job title…</option>
                                {jobTitles.map((jt) => (
                                    <option key={jt} value={jt}>
                                        {jt}
                                    </option>
                                ))}
                            </select>
                        )}

                        {scopeType === "group" && (
                            <select
                                value={scopeValue}
                                onChange={(e) => setScopeValue(e.target.value)}
                                required
                                className="w-full bg-[#0a0a0f] border border-[#1e1e2e] text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-violet-500/50 transition-colors"
                            >
                                <option value="">Select a group…</option>
                                {groups.map((g) => (
                                    <option key={g.id} value={g.id}>
                                        {g.name}
                                    </option>
                                ))}
                            </select>
                        )}

                        {scopeType === "individual" && (
                            <select
                                value={scopeValue}
                                onChange={(e) => setScopeValue(e.target.value)}
                                required
                                className="w-full bg-[#0a0a0f] border border-[#1e1e2e] text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-violet-500/50 transition-colors"
                            >
                                <option value="">Select a user…</option>
                                {users.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.displayName || u.email}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                )}
            </div>

            {/* Priority */}
            <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-5">
                <label className="block text-xs text-[#8a8f98] mb-1.5">
                    Priority
                    <span className="text-[#555] ml-1">(higher number = higher priority)</span>
                </label>
                <input
                    type="number"
                    value={priority}
                    onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                    min={0}
                    max={999}
                    className="w-32 bg-[#0a0a0f] border border-[#1e1e2e] text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-violet-500/50 transition-colors"
                />
                <p className="text-[10px] text-[#555] mt-1.5">
                    When multiple rules of the same scope match, the one with higher priority wins.
                    Scope hierarchy: Individual &gt; Group &gt; Job Title &gt; Country &gt; Global.
                </p>
            </div>

            {/* Submit */}
            <button
                type="submit"
                disabled={loading || !resourceItemId}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors duration-200 shadow-lg shadow-violet-600/20 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {mode === "create" ? "Create Rule" : "Update Rule"}
            </button>
        </form>
    );
}
