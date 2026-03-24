"use client";

import { useState, useCallback } from "react";
import type { FieldDefinition } from "@/app/(dashboard)/resource-types/actions";
import { RichTextEditor } from "./RichTextEditor";

interface DynamicFormProps {
    fields: FieldDefinition[];
    values: Record<string, unknown>;
    onChange: (values: Record<string, unknown>) => void;
    errors?: Record<string, string>;
}

export function DynamicForm({ fields, values, onChange, errors }: DynamicFormProps) {
    const [uploading, setUploading] = useState<Record<string, boolean>>({});
    const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});

    const updateValue = useCallback(
        (name: string, value: unknown) => {
            onChange({ ...values, [name]: value });
        },
        [values, onChange]
    );

    const handleImageUpload = useCallback(
        async (fieldName: string, file: File) => {
            setUploading((prev) => ({ ...prev, [fieldName]: true }));
            setUploadErrors((prev) => ({ ...prev, [fieldName]: "" }));

            try {
                const formData = new FormData();
                formData.append("file", file);

                const res = await fetch("/api/upload", { method: "POST", body: formData });
                const data = await res.json();

                if (!res.ok) {
                    setUploadErrors((prev) => ({ ...prev, [fieldName]: data.error }));
                    return;
                }

                updateValue(fieldName, data.url);
            } catch {
                setUploadErrors((prev) => ({
                    ...prev,
                    [fieldName]: "Upload failed. Please try again.",
                }));
            } finally {
                setUploading((prev) => ({ ...prev, [fieldName]: false }));
            }
        },
        [updateValue]
    );

    return (
        <div className="space-y-5">
            {fields.map((field) => {
                const value = values[field.name];
                const error = errors?.[field.name] || uploadErrors[field.name];

                return (
                    <div key={field.name}>
                        <label className="block text-sm font-medium text-[#ccc] mb-1.5">
                            {field.label}
                            {field.required && (
                                <span className="text-amber-400 ml-1">*</span>
                            )}
                        </label>

                        {renderField(field, value, updateValue, handleImageUpload, uploading[field.name])}

                        {/* Validation hint */}
                        {field.validation && (
                            <p className="text-[#444] text-xs mt-1">
                                {getValidationHint(field)}
                            </p>
                        )}

                        {/* Error */}
                        {error && (
                            <p className="text-red-400 text-xs mt-1">{error}</p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Field Renderers ────────────────────────────────

function renderField(
    field: FieldDefinition,
    value: unknown,
    onChange: (name: string, value: unknown) => void,
    onImageUpload: (name: string, file: File) => void,
    isUploading?: boolean
) {
    const baseInput =
        "w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#333] focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-colors duration-200";

    switch (field.type) {
        case "text":
            return (
                <input
                    type="text"
                    className={baseInput}
                    value={(value as string) || ""}
                    onChange={(e) => onChange(field.name, e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    maxLength={field.validation?.maxLength}
                />
            );

        case "textarea":
            return (
                <textarea
                    className={`${baseInput} min-h-[100px] resize-y`}
                    value={(value as string) || ""}
                    onChange={(e) => onChange(field.name, e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    maxLength={field.validation?.maxLength}
                />
            );

        case "richtext":
            return (
                <RichTextEditor
                    content={(value as string) || ""}
                    onChange={(html: string) => onChange(field.name, html)}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                />
            );

        case "image":
            return (
                <div className="space-y-2">
                    {/* Preview */}
                    {typeof value === "string" && value ? (
                        <div className="relative w-fit">
                            <img
                                src={value}
                                alt="Preview"
                                className="h-20 rounded-lg border border-[#1e1e2e] object-contain bg-[#0a0a0f]"
                            />
                            <button
                                type="button"
                                onClick={() => onChange(field.name, "")}
                                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-400 cursor-pointer"
                            >
                                ×
                            </button>
                        </div>
                    ) : null}

                    {/* Upload button */}
                    <div className="flex items-center gap-3">
                        <label className="inline-flex items-center gap-2 px-4 py-2 bg-[#12121a] border border-[#1e1e2e] hover:border-[#2a2a3e] text-white text-sm font-medium rounded-xl transition-colors cursor-pointer">
                            {isUploading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>📷 Choose Image</>
                            )}
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                disabled={isUploading}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) onImageUpload(field.name, file);
                                }}
                            />
                        </label>
                        <span className="text-xs text-[#444]">or</span>
                        <input
                            type="url"
                            className={`${baseInput} flex-1`}
                            value={(value as string) || ""}
                            onChange={(e) => onChange(field.name, e.target.value)}
                            placeholder="Paste image URL"
                        />
                    </div>
                </div>
            );

        case "url":
            return (
                <input
                    type="url"
                    className={baseInput}
                    value={(value as string) || ""}
                    onChange={(e) => onChange(field.name, e.target.value)}
                    placeholder="https://..."
                />
            );

        case "date":
            return (
                <input
                    type="date"
                    className={baseInput}
                    value={(value as string) || ""}
                    onChange={(e) => onChange(field.name, e.target.value)}
                />
            );

        case "select":
            return (
                <select
                    className={baseInput}
                    value={(value as string) || ""}
                    onChange={(e) => onChange(field.name, e.target.value)}
                >
                    <option value="">Select {field.label.toLowerCase()}</option>
                    {field.validation?.options?.map((opt) => (
                        <option key={opt} value={opt}>
                            {opt}
                        </option>
                    ))}
                </select>
            );

        case "toggle":
            return (
                <button
                    type="button"
                    onClick={() => onChange(field.name, !value)}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer overflow-hidden ${value ? "bg-violet-500" : "bg-[#1e1e2e]"
                        }`}
                >
                    <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${value ? "translate-x-5" : "translate-x-0"
                            }`}
                    />
                </button>
            );

        case "number":
            return (
                <input
                    type="number"
                    className={baseInput}
                    value={value !== undefined && value !== null ? String(value) : ""}
                    onChange={(e) =>
                        onChange(field.name, e.target.value === "" ? "" : Number(e.target.value))
                    }
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    min={field.validation?.min}
                    max={field.validation?.max}
                />
            );

        case "color":
            return (
                <div className="flex items-center gap-3">
                    <input
                        type="color"
                        className="w-10 h-10 rounded-lg border border-[#1e1e2e] bg-[#0a0a0f] cursor-pointer"
                        value={(value as string) || "#000000"}
                        onChange={(e) => onChange(field.name, e.target.value)}
                    />
                    <input
                        type="text"
                        className={`${baseInput} w-32 font-mono`}
                        value={(value as string) || ""}
                        onChange={(e) => onChange(field.name, e.target.value)}
                        placeholder="#000000"
                        maxLength={7}
                    />
                </div>
            );

        default:
            return (
                <p className="text-[#555] text-sm">
                    Unsupported field type: {field.type}
                </p>
            );
    }
}

// ─── Validation Hints ───────────────────────────────

function getValidationHint(field: FieldDefinition): string {
    const parts: string[] = [];
    const v = field.validation;
    if (!v) return "";

    if (v.maxLength) parts.push(`max ${v.maxLength} characters`);
    if (v.maxSize) parts.push(`max ${v.maxSize / 1000}KB`);
    if (v.min !== undefined) parts.push(`min: ${v.min}`);
    if (v.max !== undefined) parts.push(`max: ${v.max}`);
    if (v.options && v.options.length > 0) parts.push(`${v.options.length} options`);

    return parts.join(" · ");
}
