import { db } from "@/lib/db/client";
import { users, templates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { buildSignatureForUser } from "@/lib/signature-builder";
import {
    FileCode2,
    ArrowLeft,
    User,
    Eye,
    Package,
    CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import CopyButton from "./CopyButton";

const SCOPE_COLORS: Record<string, string> = {
    global: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    country: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    job_title: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    group: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    individual: "text-pink-400 bg-pink-500/10 border-pink-500/20",
};

const SCOPE_LABELS: Record<string, string> = {
    global: "Global",
    country: "Country",
    job_title: "Job Title",
    group: "Group",
    individual: "Individual",
};

interface PreviewPageProps {
    searchParams: Promise<{ user?: string; template?: string }>;
}

export default async function SignaturePreviewPage({ searchParams }: PreviewPageProps) {
    const { user: selectedUserId, template: selectedTemplateId } = await searchParams;

    // Fetch users and templates for selectors
    const allUsers = await db
        .select({
            id: users.id,
            displayName: users.displayName,
            email: users.email,
            jobTitle: users.jobTitle,
            country: users.country,
        })
        .from(users)
        .orderBy(users.displayName);

    const allTemplates = await db
        .select({
            id: templates.id,
            name: templates.name,
            isDefault: templates.isDefault,
        })
        .from(templates)
        .orderBy(templates.name);

    // Build signature if user selected
    const result = selectedUserId
        ? await buildSignatureForUser(
            selectedUserId,            selectedTemplateId || undefined
        )
        : null;

    const previewHtml = result
        ? `<!DOCTYPE html>
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
        <body>${result.html}</body>
        </html>`
        : null;

    return (
        <div className="max-w-5xl">
            {/* Header */}
            <div className="mb-6">
                <Link
                    href="/templates"
                    className="inline-flex items-center gap-1.5 text-[#555] hover:text-white text-sm mb-4 transition-colors"
                >
                    <ArrowLeft size={14} />
                    Back to Templates
                </Link>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg">
                        <Eye size={20} className="text-white" />
                    </div>
                    Signature Preview
                </h1>
                <p className="text-[#8a8f98] mt-1 text-sm">
                    Select a user to see their fully rendered signature
                </p>
            </div>

            {/* Selectors */}
            <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-5 mb-6">
                <form>
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                        <div>
                            <label className="block text-xs text-[#555] uppercase tracking-wider font-medium mb-2">
                                User
                            </label>
                            <select
                                name="user"
                                defaultValue={selectedUserId || ""}
                                className="w-full bg-[#0a0a0f] border border-[#1e1e2e] text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-violet-500/50 transition-colors"
                            >
                                <option value="">Choose a user…</option>
                                {allUsers.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.displayName || u.email}{" "}
                                        {u.jobTitle ? `— ${u.jobTitle}` : ""}{" "}
                                        {u.country ? `(${u.country})` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-[#555] uppercase tracking-wider font-medium mb-2">
                                Template
                            </label>
                            <select
                                name="template"
                                defaultValue={selectedTemplateId || ""}
                                className="w-full bg-[#0a0a0f] border border-[#1e1e2e] text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-violet-500/50 transition-colors"
                            >
                                <option value="">Default Template</option>
                                {allTemplates.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name}{" "}
                                        {t.isDefault ? "(Default)" : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            type="submit"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors duration-200 shadow-lg shadow-violet-600/20 cursor-pointer"
                        >
                            <User size={16} />
                            Preview
                        </button>
                    </div>
                </form>
            </div>

            {/* No template warning */}
            {selectedUserId && !result && (
                <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-12 text-center">
                    <FileCode2 size={48} className="mx-auto text-[#2a2a3e] mb-4" />
                    <h3 className="text-white font-semibold mb-2">Cannot generate signature</h3>
                    <p className="text-[#555] text-sm max-w-md mx-auto">
                        No default template found, or the user was not found. Create a template and set it as default first.
                    </p>
                </div>
            )}

            {/* Rendered Signature */}
            {result && previewHtml && (
                <div className="space-y-6">
                    {/* Signature Preview */}
                    <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-xs text-[#555] uppercase tracking-wider font-medium">
                                Rendered Signature — {result.templateName}
                            </label>
                            <CopyButton html={result.html} />
                        </div>
                        <div className="bg-white rounded-xl overflow-hidden">
                            <iframe
                                srcDoc={previewHtml}
                                title="Signature Preview"
                                className="w-full border-0 rounded-xl"
                                style={{ minHeight: "250px" }}
                                sandbox="allow-same-origin"
                            />
                        </div>
                    </div>

                    {/* Resolved Resources */}
                    {result.resolvedResources.length > 0 && (
                        <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-5">
                            <label className="block text-xs text-[#555] uppercase tracking-wider font-medium mb-3">
                                Resolved Resources
                            </label>
                            <div className="space-y-4">
                                {result.resolvedResources.map((group) => (
                                    <div key={group.resourceTypeId}>
                                        <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                                            <Package size={14} className="text-emerald-400" />
                                            {group.resourceTypeName}
                                            <span className="text-[#555] font-normal text-xs">
                                                ({group.items.length} item
                                                {group.items.length !== 1 ? "s" : ""})
                                            </span>
                                        </h4>
                                        <div className="space-y-1.5">
                                            {group.items.map((item) => {
                                                const scopeColor =
                                                    SCOPE_COLORS[item.matchedScope] ||
                                                    SCOPE_COLORS.global;
                                                return (
                                                    <div
                                                        key={item.id}
                                                        className="flex items-center justify-between px-3 py-2 bg-[#0a0a0f] rounded-lg"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle2
                                                                size={14}
                                                                className="text-emerald-400"
                                                            />
                                                            <span className="text-white text-sm">
                                                                {item.name}
                                                            </span>
                                                        </div>
                                                        <span
                                                            className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${scopeColor}`}
                                                        >
                                                            {SCOPE_LABELS[item.matchedScope] ||
                                                                item.matchedScope}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

