import { getTemplate } from "../actions";
import { notFound } from "next/navigation";
import {
    FileCode2,
    ArrowLeft,
    Star,
    Pencil,
    Calendar,
    Code2,
} from "lucide-react";
import Link from "next/link";
import DeleteButton from "./DeleteButton";

interface TemplateDetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function TemplateDetailPage({ params }: TemplateDetailPageProps) {
    const { id } = await params;
    const template = await getTemplate(id);

    if (!template) notFound();

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
        <body>${template.htmlTemplate}</body>
        </html>
    `;

    return (
        <div className="max-w-4xl">
            {/* Header */}
            <div className="mb-6">
                <Link
                    href="/templates"
                    className="inline-flex items-center gap-1.5 text-[#555] hover:text-white text-sm mb-4 transition-colors"
                >
                    <ArrowLeft size={14} />
                    Back to Templates
                </Link>
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg">
                                <FileCode2 size={20} className="text-white" />
                            </div>
                            {template.name}
                        </h1>
                        <div className="flex items-center gap-3 mt-2 ml-[52px]">
                            {template.isDefault && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    <Star size={10} />
                                    Default Template
                                </span>
                            )}
                            {template.createdAt && (
                                <span className="flex items-center gap-1 text-[#555] text-xs">
                                    <Calendar size={12} />
                                    {new Date(template.createdAt).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/templates/${id}/edit`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#12121a] border border-[#1e1e2e] hover:border-[#2a2a3e] text-white text-sm font-medium rounded-xl transition-colors"
                        >
                            <Pencil size={14} />
                            Edit
                        </Link>
                        <DeleteButton id={id} isDefault={template.isDefault ?? false} />
                    </div>
                </div>
            </div>

            {/* Preview */}
            <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-5 mb-6">
                <label className="block text-xs text-[#555] uppercase tracking-wider font-medium mb-3">
                    Preview (Raw Template)
                </label>
                <div className="bg-white rounded-xl overflow-hidden">
                    <iframe
                        srcDoc={previewHtml}
                        title="Template Preview"
                        className="w-full border-0 rounded-xl"
                        style={{ minHeight: "250px" }}
                        sandbox="allow-same-origin"
                    />
                </div>
            </div>

            {/* Source Code */}
            <details className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl overflow-hidden">
                <summary className="px-5 py-4 cursor-pointer text-xs text-[#555] uppercase tracking-wider font-medium flex items-center gap-2 hover:text-white transition-colors">
                    <Code2 size={14} />
                    View HTML Source
                </summary>
                <div className="px-5 pb-5">
                    <pre className="bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl p-4 overflow-x-auto text-xs text-emerald-300 font-mono leading-relaxed whitespace-pre-wrap">
                        {template.htmlTemplate}
                    </pre>
                </div>
            </details>
        </div>
    );
}
