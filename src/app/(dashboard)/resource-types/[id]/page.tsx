import { db } from "@/lib/db/client";
import { resourceTypes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Blocks, Pencil, Calendar, Hash } from "lucide-react";
import { DeleteResourceTypeButton } from "./DeleteButton";
import type { FieldDefinition } from "../actions";

// Icon name → display mapping
const ICON_MAP: Record<string, string> = {
    award: "🏆",
    image: "🖼️",
    "file-text": "📄",
    flag: "🚩",
    shield: "🛡️",
    star: "⭐",
    zap: "⚡",
    heart: "❤️",
    globe: "🌍",
    tag: "🏷️",
    bookmark: "🔖",
    link: "🔗",
};

// Field type badge colors
const TYPE_COLORS: Record<string, string> = {
    text: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    textarea: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    richtext: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    image: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    url: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    date: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    select: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    toggle: "text-pink-400 bg-pink-500/10 border-pink-500/20",
    number: "text-teal-400 bg-teal-500/10 border-teal-500/20",
    color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
};

interface ResourceTypeDetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function ResourceTypeDetailPage({
    params,
}: ResourceTypeDetailPageProps) {
    const { id } = await params;

    const [type] = await db
        .select()
        .from(resourceTypes)
        .where(eq(resourceTypes.id, id))
        .limit(1);

    if (!type) notFound();

    const fields = (type.fieldsSchema as FieldDefinition[]) || [];
    const iconEmoji = ICON_MAP[type.icon || ""] || "📦";

    return (
        <div className="max-w-4xl">
            {/* Back link */}
            <Link
                href="/resource-types"
                className="inline-flex items-center gap-1.5 text-sm text-[#555] hover:text-white transition-colors mb-6"
            >
                <ArrowLeft size={14} />
                Back to Resource Types
            </Link>

            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-2xl">
                        {iconEmoji}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">{type.name}</h1>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs font-mono text-[#444]">{type.slug}</span>
                            <span className="text-[#1e1e2e]">·</span>
                            <span className="text-xs text-[#555] flex items-center gap-1">
                                <Hash size={11} />
                                {fields.length} field{fields.length !== 1 ? "s" : ""}
                            </span>
                            {type.createdAt && (
                                <>
                                    <span className="text-[#1e1e2e]">·</span>
                                    <span className="text-xs text-[#555] flex items-center gap-1">
                                        <Calendar size={11} />
                                        Created{" "}
                                        {new Date(type.createdAt).toLocaleDateString("en-IN", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href={`/resource-types/${id}/edit`}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#12121a] border border-[#1e1e2e] hover:border-[#2a2a3e] text-white text-sm font-medium rounded-xl transition-colors duration-200"
                    >
                        <Pencil size={14} />
                        Edit
                    </Link>
                    <DeleteResourceTypeButton id={id} name={type.name} />
                </div>
            </div>

            {/* Fields Table */}
            <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#1e1e2e]">
                    <h3 className="text-white font-semibold text-sm">Schema Fields</h3>
                </div>

                {fields.length === 0 ? (
                    <div className="p-8 text-center">
                        <Blocks size={32} className="mx-auto text-[#2a2a3e] mb-3" />
                        <p className="text-[#555] text-sm">No fields defined.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#1e1e2e]">
                                    <th className="text-left px-5 py-3 text-xs font-medium text-[#555] uppercase tracking-wider">
                                        #
                                    </th>
                                    <th className="text-left px-5 py-3 text-xs font-medium text-[#555] uppercase tracking-wider">
                                        Label
                                    </th>
                                    <th className="text-left px-5 py-3 text-xs font-medium text-[#555] uppercase tracking-wider">
                                        Name (Key)
                                    </th>
                                    <th className="text-left px-5 py-3 text-xs font-medium text-[#555] uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="text-left px-5 py-3 text-xs font-medium text-[#555] uppercase tracking-wider">
                                        Required
                                    </th>
                                    <th className="text-left px-5 py-3 text-xs font-medium text-[#555] uppercase tracking-wider">
                                        Validation
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {fields.map((field, index) => {
                                    const colorClass =
                                        TYPE_COLORS[field.type] ||
                                        "text-[#555] bg-[#12121a] border-[#1e1e2e]";

                                    // Build validation summary
                                    const validationParts: string[] = [];
                                    if (field.validation?.maxLength)
                                        validationParts.push(
                                            `max ${field.validation.maxLength} chars`
                                        );
                                    if (field.validation?.maxSize)
                                        validationParts.push(
                                            `max ${field.validation.maxSize / 1000}KB`
                                        );
                                    if (field.validation?.min !== undefined)
                                        validationParts.push(`min: ${field.validation.min}`);
                                    if (field.validation?.max !== undefined)
                                        validationParts.push(`max: ${field.validation.max}`);
                                    if (
                                        field.validation?.options &&
                                        field.validation.options.length > 0
                                    )
                                        validationParts.push(
                                            `${field.validation.options.length} options`
                                        );

                                    return (
                                        <tr
                                            key={index}
                                            className="border-b border-[#1e1e2e] last:border-b-0"
                                        >
                                            <td className="px-5 py-3 text-xs text-[#333]">
                                                {index + 1}
                                            </td>
                                            <td className="px-5 py-3 text-sm text-white font-medium">
                                                {field.label}
                                            </td>
                                            <td className="px-5 py-3 text-sm text-[#8a8f98] font-mono">
                                                {field.name}
                                            </td>
                                            <td className="px-5 py-3">
                                                <span
                                                    className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded border ${colorClass}`}
                                                >
                                                    {field.type}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                {field.required ? (
                                                    <span className="text-amber-400 text-xs font-medium">
                                                        Yes
                                                    </span>
                                                ) : (
                                                    <span className="text-[#333] text-xs">
                                                        No
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 text-xs text-[#555]">
                                                {validationParts.length > 0
                                                    ? validationParts.join(", ")
                                                    : "—"}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
