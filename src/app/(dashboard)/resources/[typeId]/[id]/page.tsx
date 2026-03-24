import { db } from "@/lib/db/client";
import { resourceTypes, resourceItems } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Pencil,
    Calendar,
    Clock,
    Power,
    AlertCircle,
    ExternalLink,
} from "lucide-react";
import { DeleteResourceItemButton } from "./DeleteButton";
import { ToggleActiveButton } from "./ToggleActiveButton";
import type { FieldDefinition } from "@/app/(dashboard)/resource-types/actions";

interface ResourceItemDetailPageProps {
    params: Promise<{ typeId: string; id: string }>;
}

function getTimeBoundStatus(
    validFrom: Date | null,
    validUntil: Date | null,
    isActive: boolean | null
): { label: string; color: string } {
    if (!isActive) {
        return { label: "Inactive", color: "text-[#555] bg-[#1a1a1a] border-[#1e1e2e]" };
    }

    const now = new Date();

    if (validFrom && now < validFrom) {
        return { label: "Scheduled", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
    }

    if (validUntil && now > validUntil) {
        return { label: "Expired", color: "text-red-400 bg-red-500/10 border-red-500/20" };
    }

    return { label: "Active", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
}

export default async function ResourceItemDetailPage({
    params,
}: ResourceItemDetailPageProps) {
    const { typeId, id } = await params;

    // Fetch item + resource type
    const [item] = await db
        .select()
        .from(resourceItems)
        .where(
            and(
                eq(resourceItems.id, id),
                eq(resourceItems.resourceTypeId, typeId)
            )
        )
        .limit(1);

    if (!item) notFound();

    const [resourceType] = await db
        .select()
        .from(resourceTypes)
        .where(eq(resourceTypes.id, typeId))
        .limit(1);

    if (!resourceType) notFound();

    const fields = resourceType.fieldsSchema as FieldDefinition[];
    const fieldValues = (item.fieldValues as Record<string, unknown>) || {};
    const status = getTimeBoundStatus(item.validFrom, item.validUntil, item.isActive);

    return (
        <div className="max-w-4xl">
            {/* Back link */}
            <Link
                href={`/resources?type=${typeId}`}
                className="inline-flex items-center gap-1.5 text-sm text-[#555] hover:text-white transition-colors mb-6"
            >
                <ArrowLeft size={14} />
                Back to {resourceType.name} Items
            </Link>

            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">{item.name}</h1>
                    <div className="flex items-center gap-3 mt-2">
                        <span
                            className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg border ${status.color}`}
                        >
                            {status.label === "Active" && <Power size={11} />}
                            {status.label === "Inactive" && <Power size={11} />}
                            {status.label === "Scheduled" && <Clock size={11} />}
                            {status.label === "Expired" && <AlertCircle size={11} />}
                            {status.label}
                        </span>
                        <span className="text-xs text-[#444]">{resourceType.name}</span>
                        {item.createdAt && (
                            <>
                                <span className="text-[#1e1e2e]">·</span>
                                <span className="text-xs text-[#555] flex items-center gap-1">
                                    <Calendar size={11} />
                                    Created{" "}
                                    {new Date(item.createdAt).toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </span>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <ToggleActiveButton id={id} isActive={!!item.isActive} />
                    <Link
                        href={`/resources/${typeId}/${id}/edit`}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#12121a] border border-[#1e1e2e] hover:border-[#2a2a3e] text-white text-sm font-medium rounded-xl transition-colors duration-200"
                    >
                        <Pencil size={14} />
                        Edit
                    </Link>
                    <DeleteResourceItemButton id={id} resourceTypeId={typeId} name={item.name} />
                </div>
            </div>

            {/* Time-bound info */}
            {(item.validFrom || item.validUntil) && (
                <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-5 mb-4">
                    <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                        <Clock size={14} className="text-violet-400" />
                        Time-Bound Schedule
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-xs text-[#555]">Valid From</span>
                            <p className="text-sm text-white mt-0.5">
                                {item.validFrom
                                    ? new Date(item.validFrom).toLocaleString("en-IN", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })
                                    : "—"}
                            </p>
                        </div>
                        <div>
                            <span className="text-xs text-[#555]">Valid Until</span>
                            <p className="text-sm text-white mt-0.5">
                                {item.validUntil
                                    ? new Date(item.validUntil).toLocaleString("en-IN", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })
                                    : "—"}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Field Values */}
            <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#1e1e2e]">
                    <h3 className="text-white font-semibold text-sm">Field Values</h3>
                </div>

                <div className="divide-y divide-[#1e1e2e]">
                    {fields.map((field) => {
                        const value = fieldValues[field.name];

                        return (
                            <div key={field.name} className="px-5 py-4">
                                <div className="text-xs text-[#555] mb-1">{field.label}</div>
                                <div className="text-sm text-white">
                                    {renderFieldValue(field, value)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ─── Render field values read-only ──────────────────

function renderFieldValue(field: FieldDefinition, value: unknown) {
    if (value === undefined || value === null || value === "") {
        return <span className="text-[#333] italic">Not set</span>;
    }

    switch (field.type) {
        case "image":
            return (
                <img
                    src={value as string}
                    alt={field.label}
                    className="h-16 rounded-lg border border-[#1e1e2e] object-contain bg-[#0a0a0f]"
                />
            );

        case "url":
            return (
                <a
                    href={value as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-400 hover:text-violet-300 inline-flex items-center gap-1"
                >
                    {value as string}
                    <ExternalLink size={12} />
                </a>
            );

        case "richtext":
            return (
                <div
                    className="prose prose-invert prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: value as string }}
                />
            );

        case "toggle":
            return (
                <span
                    className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${value
                            ? "text-emerald-400 bg-emerald-500/10"
                            : "text-[#555] bg-[#1a1a1a]"
                        }`}
                >
                    {value ? "Yes" : "No"}
                </span>
            );

        case "color":
            return (
                <div className="flex items-center gap-2">
                    <div
                        className="w-6 h-6 rounded border border-[#1e1e2e]"
                        style={{ backgroundColor: value as string }}
                    />
                    <span className="font-mono text-[#8a8f98]">{value as string}</span>
                </div>
            );

        case "select":
            return (
                <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">
                    {value as string}
                </span>
            );

        case "date":
            return (
                <span>
                    {new Date(value as string).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                    })}
                </span>
            );

        case "number":
            return <span className="font-mono">{String(value)}</span>;

        default:
            return <span>{String(value)}</span>;
    }
}
