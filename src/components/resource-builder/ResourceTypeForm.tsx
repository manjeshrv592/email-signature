"use client";

import { useState, useTransition } from "react";
import { FieldBuilder } from "./FieldBuilder";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import type { FieldDefinition } from "@/app/(dashboard)/resource-types/actions";
import {
    createResourceType,
    updateResourceType,
} from "@/app/(dashboard)/resource-types/actions";

// ─── Icon options ───────────────────────────────────

const ICON_OPTIONS = [
    { value: "", label: "None" },
    { value: "award", label: "🏆 Award" },
    { value: "image", label: "🖼️ Image" },
    { value: "file-text", label: "📄 File Text" },
    { value: "flag", label: "🚩 Flag" },
    { value: "shield", label: "🛡️ Shield" },
    { value: "star", label: "⭐ Star" },
    { value: "zap", label: "⚡ Zap" },
    { value: "heart", label: "❤️ Heart" },
    { value: "globe", label: "🌍 Globe" },
    { value: "tag", label: "🏷️ Tag" },
    { value: "bookmark", label: "🔖 Bookmark" },
    { value: "link", label: "🔗 Link" },
];

// ─── Helpers ────────────────────────────────────────

function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

// ─── Component ──────────────────────────────────────

interface ResourceTypeFormProps {
    mode: "create" | "edit";
    id?: string;
    initialData?: {
        name: string;
        slug: string;
        icon: string;
        fields: FieldDefinition[];
    };
}

export function ResourceTypeForm({ mode, id, initialData }: ResourceTypeFormProps) {
    const [name, setName] = useState(initialData?.name || "");
    const [slug, setSlug] = useState(initialData?.slug || "");
    const [icon, setIcon] = useState(initialData?.icon || "");
    const [fields, setFields] = useState<FieldDefinition[]>(initialData?.fields || []);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(mode === "edit");

    function handleNameChange(value: string) {
        setName(value);
        if (!slugManuallyEdited) {
            setSlug(slugify(value));
        }
    }

    function handleSlugChange(value: string) {
        setSlugManuallyEdited(true);
        setSlug(slugify(value));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        startTransition(async () => {
            const data = { name, slug, icon, fields };

            let result: { error?: string };
            if (mode === "edit" && id) {
                result = await updateResourceType(id, data);
            } else {
                result = await createResourceType(data);
            }

            if (result?.error) {
                setError(result.error);
            }
            // On success, the server action redirects
        });
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-3xl">
            {/* Back link */}
            <Link
                href={mode === "edit" && id ? `/resource-types/${id}` : "/resource-types"}
                className="inline-flex items-center gap-1.5 text-sm text-[#555] hover:text-white transition-colors mb-6"
            >
                <ArrowLeft size={14} />
                Back to {mode === "edit" ? "Details" : "Resource Types"}
            </Link>

            {/* Error banner */}
            {error && (
                <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                    {error}
                </div>
            )}

            {/* Basic info card */}
            <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-6 mb-6">
                <h3 className="text-white font-semibold text-sm mb-4">Basic Information</h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="text-xs text-[#555] mb-1.5 block">Name *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            placeholder="e.g. Certification"
                            required
                            className="w-full bg-[#0a0a12] border border-[#1e1e2e] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-[#333] focus:outline-none focus:border-violet-500/50"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-[#555] mb-1.5 block">Slug</label>
                        <input
                            type="text"
                            value={slug}
                            onChange={(e) => handleSlugChange(e.target.value)}
                            placeholder="auto-generated"
                            className="w-full bg-[#0a0a12] border border-[#1e1e2e] rounded-lg px-3 py-2.5 text-sm text-white font-mono placeholder:text-[#333] focus:outline-none focus:border-violet-500/50"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-xs text-[#555] mb-1.5 block">Icon</label>
                    <select
                        value={icon}
                        onChange={(e) => setIcon(e.target.value)}
                        className="w-full bg-[#0a0a12] border border-[#1e1e2e] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 cursor-pointer"
                    >
                        {ICON_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Fields builder card */}
            <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-6 mb-6">
                <FieldBuilder fields={fields} onChange={setFields} />
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-3">
                <Link
                    href={mode === "edit" && id ? `/resource-types/${id}` : "/resource-types"}
                    className="px-4 py-2.5 text-sm font-medium text-[#8a8f98] hover:text-white transition-colors"
                >
                    Cancel
                </Link>
                <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors duration-200 shadow-lg shadow-violet-600/20 cursor-pointer"
                >
                    {isPending ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <Save size={16} />
                    )}
                    {mode === "edit" ? "Save Changes" : "Create Resource Type"}
                </button>
            </div>
        </form>
    );
}
