"use client";

import { useState, useCallback } from "react";
import {
    Plus,
    Trash2,
    ChevronUp,
    ChevronDown,
    GripVertical,
    Type,
    Image,
    Link2,
    Calendar,
    List,
    ToggleLeft,
    Hash,
    Palette,
    AlignLeft,
    FileText,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────

export interface FieldValidation {
    maxLength?: number;
    maxSize?: number;
    min?: number;
    max?: number;
    options?: string[];
}

export interface FieldDefinition {
    name: string;
    label: string;
    type:
    | "text"
    | "textarea"
    | "richtext"
    | "image"
    | "url"
    | "date"
    | "select"
    | "toggle"
    | "number"
    | "color";
    required: boolean;
    validation?: FieldValidation;
}

const FIELD_TYPES = [
    { value: "text", label: "Text", icon: Type, color: "text-blue-400" },
    { value: "textarea", label: "Textarea", icon: AlignLeft, color: "text-cyan-400" },
    { value: "richtext", label: "Rich Text", icon: FileText, color: "text-indigo-400" },
    { value: "image", label: "Image", icon: Image, color: "text-emerald-400" },
    { value: "url", label: "URL", icon: Link2, color: "text-violet-400" },
    { value: "date", label: "Date", icon: Calendar, color: "text-amber-400" },
    { value: "select", label: "Select", icon: List, color: "text-orange-400" },
    { value: "toggle", label: "Toggle", icon: ToggleLeft, color: "text-pink-400" },
    { value: "number", label: "Number", icon: Hash, color: "text-teal-400" },
    { value: "color", label: "Color", icon: Palette, color: "text-rose-400" },
] as const;

function slugifyField(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s]/g, "")
        .replace(/[\s]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

// ─── Component ──────────────────────────────────────

interface FieldBuilderProps {
    fields: FieldDefinition[];
    onChange: (fields: FieldDefinition[]) => void;
}

export function FieldBuilder({ fields, onChange }: FieldBuilderProps) {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const addField = useCallback(() => {
        const newField: FieldDefinition = {
            name: "",
            label: "",
            type: "text",
            required: false,
            validation: {},
        };
        const updated = [...fields, newField];
        onChange(updated);
        setExpandedIndex(updated.length - 1);
    }, [fields, onChange]);

    const removeField = useCallback(
        (index: number) => {
            const updated = fields.filter((_, i) => i !== index);
            onChange(updated);
            setExpandedIndex(null);
        },
        [fields, onChange]
    );

    const updateField = useCallback(
        (index: number, patch: Partial<FieldDefinition>) => {
            const updated = fields.map((f, i) => (i === index ? { ...f, ...patch } : f));
            onChange(updated);
        },
        [fields, onChange]
    );

    const moveField = useCallback(
        (index: number, direction: "up" | "down") => {
            const target = direction === "up" ? index - 1 : index + 1;
            if (target < 0 || target >= fields.length) return;
            const updated = [...fields];
            [updated[index], updated[target]] = [updated[target], updated[index]];
            onChange(updated);
            setExpandedIndex(target);
        },
        [fields, onChange]
    );

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-[#8a8f98]">
                    Fields ({fields.length})
                </label>
                <button
                    type="button"
                    onClick={addField}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-lg hover:bg-violet-500/20 transition-colors cursor-pointer"
                >
                    <Plus size={14} />
                    Add Field
                </button>
            </div>

            {fields.length === 0 && (
                <div className="bg-[#0a0a12] border border-dashed border-[#1e1e2e] rounded-xl p-8 text-center">
                    <Type size={32} className="mx-auto text-[#2a2a3e] mb-3" />
                    <p className="text-[#555] text-sm">
                        No fields defined yet. Click &quot;Add Field&quot; to start building
                        your schema.
                    </p>
                </div>
            )}

            <div className="space-y-2">
                {fields.map((field, index) => {
                    const typeInfo = FIELD_TYPES.find((t) => t.value === field.type);
                    const TypeIcon = typeInfo?.icon || Type;
                    const isExpanded = expandedIndex === index;

                    return (
                        <div
                            key={index}
                            className="bg-[#0a0a12] border border-[#1e1e2e] rounded-xl overflow-hidden"
                        >
                            {/* Collapsed row */}
                            <div
                                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#0e0e18] transition-colors"
                                onClick={() =>
                                    setExpandedIndex(isExpanded ? null : index)
                                }
                            >
                                <GripVertical
                                    size={14}
                                    className="text-[#333] shrink-0"
                                />
                                <TypeIcon
                                    size={14}
                                    className={`shrink-0 ${typeInfo?.color || "text-[#555]"}`}
                                />
                                <span className="text-sm text-white font-medium truncate flex-1">
                                    {field.label || (
                                        <span className="text-[#444] italic">
                                            Untitled field
                                        </span>
                                    )}
                                </span>
                                <span className="text-[10px] font-mono text-[#444] bg-[#12121a] px-2 py-0.5 rounded">
                                    {field.type}
                                </span>
                                {field.required && (
                                    <span className="text-[10px] font-medium text-amber-400/70 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                        req
                                    </span>
                                )}
                                {/* Reorder + delete */}
                                <div className="flex items-center gap-0.5 ml-1">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            moveField(index, "up");
                                        }}
                                        disabled={index === 0}
                                        className="p-1 rounded text-[#444] hover:text-white disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        <ChevronUp size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            moveField(index, "down");
                                        }}
                                        disabled={index === fields.length - 1}
                                        className="p-1 rounded text-[#444] hover:text-white disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        <ChevronDown size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeField(index);
                                        }}
                                        className="p-1 rounded text-[#444] hover:text-red-400 cursor-pointer ml-1"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Expanded editor */}
                            {isExpanded && (
                                <div className="px-4 pb-4 pt-2 border-t border-[#1e1e2e] space-y-3">
                                    {/* Label + Name row */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-[#555] mb-1 block">
                                                Label
                                            </label>
                                            <input
                                                type="text"
                                                value={field.label}
                                                onChange={(e) => {
                                                    const label = e.target.value;
                                                    const name = slugifyField(label);
                                                    updateField(index, { label, name });
                                                }}
                                                placeholder="e.g. Logo Image"
                                                className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#333] focus:outline-none focus:border-violet-500/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-[#555] mb-1 block">
                                                Name (API key)
                                            </label>
                                            <input
                                                type="text"
                                                value={field.name}
                                                onChange={(e) =>
                                                    updateField(index, {
                                                        name: slugifyField(e.target.value),
                                                    })
                                                }
                                                placeholder="e.g. logo_image"
                                                className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-lg px-3 py-2 text-sm text-white font-mono placeholder:text-[#333] focus:outline-none focus:border-violet-500/50"
                                            />
                                        </div>
                                    </div>

                                    {/* Type + Required row */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-[#555] mb-1 block">
                                                Field Type
                                            </label>
                                            <select
                                                value={field.type}
                                                onChange={(e) =>
                                                    updateField(index, {
                                                        type: e.target
                                                            .value as FieldDefinition["type"],
                                                        validation: {},
                                                    })
                                                }
                                                className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50 cursor-pointer"
                                            >
                                                {FIELD_TYPES.map((t) => (
                                                    <option key={t.value} value={t.value}>
                                                        {t.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex items-end pb-1">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={field.required}
                                                    onChange={(e) =>
                                                        updateField(index, {
                                                            required: e.target.checked,
                                                        })
                                                    }
                                                    className="w-4 h-4 rounded border-[#1e1e2e] bg-[#12121a] text-violet-500 focus:ring-violet-500/30 cursor-pointer accent-violet-500"
                                                />
                                                <span className="text-sm text-[#8a8f98]">
                                                    Required field
                                                </span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Type-specific validation */}
                                    {(field.type === "text" || field.type === "textarea") && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs text-[#555] mb-1 block">
                                                    Max Length
                                                </label>
                                                <input
                                                    type="number"
                                                    value={field.validation?.maxLength || ""}
                                                    onChange={(e) =>
                                                        updateField(index, {
                                                            validation: {
                                                                ...field.validation,
                                                                maxLength: e.target.value
                                                                    ? parseInt(e.target.value)
                                                                    : undefined,
                                                            },
                                                        })
                                                    }
                                                    placeholder="e.g. 100"
                                                    className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#333] focus:outline-none focus:border-violet-500/50"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {field.type === "image" && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs text-[#555] mb-1 block">
                                                    Max Size (KB)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={
                                                        field.validation?.maxSize
                                                            ? field.validation.maxSize / 1000
                                                            : ""
                                                    }
                                                    onChange={(e) =>
                                                        updateField(index, {
                                                            validation: {
                                                                ...field.validation,
                                                                maxSize: e.target.value
                                                                    ? parseInt(e.target.value) *
                                                                    1000
                                                                    : undefined,
                                                            },
                                                        })
                                                    }
                                                    placeholder="e.g. 200"
                                                    className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#333] focus:outline-none focus:border-violet-500/50"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {field.type === "number" && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs text-[#555] mb-1 block">
                                                    Min
                                                </label>
                                                <input
                                                    type="number"
                                                    value={field.validation?.min ?? ""}
                                                    onChange={(e) =>
                                                        updateField(index, {
                                                            validation: {
                                                                ...field.validation,
                                                                min: e.target.value
                                                                    ? parseFloat(e.target.value)
                                                                    : undefined,
                                                            },
                                                        })
                                                    }
                                                    placeholder="Min value"
                                                    className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#333] focus:outline-none focus:border-violet-500/50"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-[#555] mb-1 block">
                                                    Max
                                                </label>
                                                <input
                                                    type="number"
                                                    value={field.validation?.max ?? ""}
                                                    onChange={(e) =>
                                                        updateField(index, {
                                                            validation: {
                                                                ...field.validation,
                                                                max: e.target.value
                                                                    ? parseFloat(e.target.value)
                                                                    : undefined,
                                                            },
                                                        })
                                                    }
                                                    placeholder="Max value"
                                                    className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#333] focus:outline-none focus:border-violet-500/50"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {field.type === "select" && (
                                        <div>
                                            <label className="text-xs text-[#555] mb-1 block">
                                                Options (comma-separated)
                                            </label>
                                            <input
                                                type="text"
                                                value={
                                                    field.validation?.options?.join(", ") || ""
                                                }
                                                onChange={(e) =>
                                                    updateField(index, {
                                                        validation: {
                                                            ...field.validation,
                                                            options: e.target.value
                                                                .split(",")
                                                                .map((s) => s.trim())
                                                                .filter(Boolean),
                                                        },
                                                    })
                                                }
                                                placeholder="e.g. Small, Medium, Large"
                                                className="w-full bg-[#12121a] border border-[#1e1e2e] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#333] focus:outline-none focus:border-violet-500/50"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
