"use client";

import { useState, useRef, useTransition } from "react";
import { createTemplate, updateTemplate } from "./actions";
import type { PlaceholderGroup } from "./actions";
import { ArrowLeft, Save, Loader2, ChevronDown, ChevronRight, Copy } from "lucide-react";
import Link from "next/link";

interface TemplateFormProps {
    mode: "create" | "edit";
    templateId?: string;
    initialData?: {
        name: string;
        htmlTemplate: string;
        isDefault: boolean;
    };
    placeholders: PlaceholderGroup[];
}

export default function TemplateForm({
    mode,
    templateId,
    initialData,
    placeholders,
}: TemplateFormProps) {
    const [name, setName] = useState(initialData?.name || "");
    const [htmlTemplate, setHtmlTemplate] = useState(initialData?.htmlTemplate || "");
    const [isDefault, setIsDefault] = useState(initialData?.isDefault || false);
    const [error, setError] = useState("");
    const [isPending, startTransition] = useTransition();
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["User Fields"]));
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    function toggleGroup(category: string) {
        setExpandedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(category)) {
                next.delete(category);
            } else {
                next.add(category);
            }
            return next;
        });
    }

    function insertPlaceholder(value: string) {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const before = htmlTemplate.substring(0, start);
        const after = htmlTemplate.substring(end);

        setHtmlTemplate(before + value + after);

        // Restore cursor position after insert
        requestAnimationFrame(() => {
            textarea.focus();
            const newPos = start + value.length;
            textarea.setSelectionRange(newPos, newPos);
        });
    }

    function handleSubmit() {
        setError("");

        startTransition(async () => {
            try {
                const data = { name, htmlTemplate, isDefault };
                let result: { error?: string };

                if (mode === "edit" && templateId) {
                    result = await updateTemplate(templateId, data);
                } else {
                    result = await createTemplate(data);
                }

                if (result?.error) {
                    setError(result.error);
                }
            } catch {
                // redirect throws, which is expected
            }
        });
    }

    // Generate preview HTML for the iframe
    const previewHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {
                    font-family: Arial, Helvetica, sans-serif;
                    margin: 16px;
                    color: #333;
                    background: #fff;
                    font-size: 14px;
                }
                img { max-width: 100%; }
            </style>
        </head>
        <body>${htmlTemplate}</body>
        </html>
    `;

    return (
        <div className="max-w-6xl">
            {/* Header */}
            <div className="mb-6">
                <Link
                    href={mode === "edit" && templateId ? `/templates/${templateId}` : "/templates"}
                    className="inline-flex items-center gap-1.5 text-[#555] hover:text-white text-sm mb-4 transition-colors"
                >
                    <ArrowLeft size={14} />
                    {mode === "edit" ? "Back to Template" : "Back to Templates"}
                </Link>
                <h1 className="text-2xl font-bold text-white">
                    {mode === "edit" ? "Edit Template" : "New Template"}
                </h1>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
                {/* Main Editor */}
                <div className="space-y-6">
                    {/* Name */}
                    <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-5">
                        <label className="block text-xs text-[#555] uppercase tracking-wider font-medium mb-2">
                            Template Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Standard Signature"
                            className="w-full bg-[#0a0a0f] border border-[#1e1e2e] text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-violet-500/50 transition-colors placeholder:text-[#333]"
                        />
                    </div>

                    {/* HTML Editor */}
                    <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-5">
                        <label className="block text-xs text-[#555] uppercase tracking-wider font-medium mb-2">
                            HTML Template
                        </label>
                        <textarea
                            ref={textareaRef}
                            value={htmlTemplate}
                            onChange={(e) => setHtmlTemplate(e.target.value)}
                            placeholder={`<table>\n  <tr>\n    <td>\n      <strong>{{user.displayName}}</strong><br/>\n      {{user.jobTitle}} | {{user.department}}\n    </td>\n  </tr>\n</table>`}
                            className="w-full bg-[#0a0a0f] border border-[#1e1e2e] text-emerald-300 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500/50 transition-colors font-mono leading-relaxed placeholder:text-[#333] resize-y"
                            rows={18}
                            spellCheck={false}
                        />
                    </div>

                    {/* Default Toggle + Submit */}
                    <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <div className="text-white text-sm font-medium">
                                    Set as Default
                                </div>
                                <div className="text-[#555] text-xs mt-0.5">
                                    The default template is used when no specific template is
                                    assigned
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsDefault(!isDefault)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${isDefault ? "bg-violet-600" : "bg-[#2a2a3e]"
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDefault ? "translate-x-6" : "translate-x-1"
                                        }`}
                                />
                            </button>
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={isPending}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors duration-200 shadow-lg shadow-violet-600/20 disabled:opacity-50 cursor-pointer"
                        >
                            {isPending ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Save size={16} />
                            )}
                            {mode === "edit" ? "Save Changes" : "Create Template"}
                        </button>
                    </div>

                    {/* Live Preview */}
                    <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-xs text-[#555] uppercase tracking-wider font-medium">
                                Live Preview (raw HTML)
                            </label>
                            <button
                                type="button"
                                onClick={() => navigator.clipboard.writeText(htmlTemplate)}
                                className="inline-flex items-center gap-1.5 text-xs text-[#555] hover:text-white transition-colors cursor-pointer"
                            >
                                <Copy size={12} />
                                Copy HTML
                            </button>
                        </div>
                        <div className="bg-white rounded-xl overflow-hidden">
                            <iframe
                                srcDoc={previewHtml}
                                title="Template Preview"
                                className="w-full border-0 rounded-xl"
                                style={{ minHeight: "200px" }}
                                sandbox="allow-same-origin"
                            />
                        </div>
                    </div>
                </div>

                {/* Placeholder Picker Sidebar */}
                <div className="space-y-3">
                    <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-4 sticky top-6">
                        <h3 className="text-xs text-[#555] uppercase tracking-wider font-medium mb-3">
                            Placeholders
                        </h3>
                        <p className="text-[10px] text-[#444] mb-4">
                            Click to insert at cursor position
                        </p>

                        <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                            {placeholders.map((group) => (
                                <div key={group.category}>
                                    <button
                                        type="button"
                                        onClick={() => toggleGroup(group.category)}
                                        className="flex items-center gap-1.5 w-full text-left text-xs font-semibold text-[#8a8f98] hover:text-white py-1.5 transition-colors cursor-pointer"
                                    >
                                        {expandedGroups.has(group.category) ? (
                                            <ChevronDown size={12} />
                                        ) : (
                                            <ChevronRight size={12} />
                                        )}
                                        {group.category}
                                    </button>

                                    {expandedGroups.has(group.category) && (
                                        <div className="ml-3 space-y-0.5 mt-1 mb-2">
                                            {group.placeholders.map((p, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => insertPlaceholder(p.value)}
                                                    className="block w-full text-left text-[11px] px-2 py-1 rounded-lg text-emerald-400 hover:bg-[#1a1a2a] hover:text-emerald-300 transition-colors font-mono truncate cursor-pointer"
                                                    title={p.value}
                                                >
                                                    {p.label.startsWith("  ") ? (
                                                        <span className="ml-2">{p.value}</span>
                                                    ) : (
                                                        p.value
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
