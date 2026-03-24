import { getTemplates } from "./actions";
import { FileCode2, Plus, Star } from "lucide-react";
import Link from "next/link";
import { Pagination } from "@/components/Pagination";

interface TemplatesPageProps {
    searchParams: Promise<{ page?: string }>;
}

export default async function TemplatesPage({ searchParams }: TemplatesPageProps) {
    const { page: pageParam } = await searchParams;
    const page = Math.max(1, parseInt(pageParam || "1", 10));
    const pageSize = 10;

    const { templates, total } = await getTemplates(page, pageSize);

    return (
        <div className="max-w-5xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg">
                            <FileCode2 size={20} className="text-white" />
                        </div>
                        Templates
                    </h1>
                    <p className="text-[#8a8f98] mt-1 text-sm">
                        Design HTML signature templates with dynamic placeholders
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/templates/preview"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#12121a] border border-[#1e1e2e] hover:border-[#2a2a3e] text-white text-sm font-medium rounded-xl transition-colors duration-200"
                    >
                        Preview
                    </Link>
                    <Link
                        href="/templates/new"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors duration-200 shadow-lg shadow-violet-600/20"
                    >
                        <Plus size={16} />
                        New Template
                    </Link>
                </div>
            </div>

            {/* Template List */}
            {templates.length === 0 ? (
                <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-12 text-center">
                    <FileCode2 size={48} className="mx-auto text-[#2a2a3e] mb-4" />
                    <h3 className="text-white font-semibold mb-2">No templates yet</h3>
                    <p className="text-[#555] text-sm max-w-md mx-auto mb-6">
                        Create your first signature template with HTML and dynamic placeholders.
                    </p>
                    <Link
                        href="/templates/new"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors duration-200 shadow-lg shadow-violet-600/20"
                    >
                        <Plus size={16} />
                        Create Template
                    </Link>
                </div>
            ) : (
                <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[#1e1e2e]">
                                <th className="text-left text-[#555] text-xs font-medium uppercase tracking-wider px-5 py-3">
                                    Name
                                </th>
                                <th className="text-left text-[#555] text-xs font-medium uppercase tracking-wider px-5 py-3">
                                    Status
                                </th>
                                <th className="text-left text-[#555] text-xs font-medium uppercase tracking-wider px-5 py-3">
                                    Created
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {templates.map((template) => (
                                <tr
                                    key={template.id}
                                    className="border-b border-[#1e1e2e] last:border-b-0 hover:bg-[#16161f] transition-colors"
                                >
                                    <td className="px-5 py-4">
                                        <Link
                                            href={`/templates/${template.id}`}
                                            className="text-white font-medium hover:text-violet-400 transition-colors"
                                        >
                                            {template.name}
                                        </Link>
                                    </td>
                                    <td className="px-5 py-4">
                                        {template.isDefault ? (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                <Star size={10} />
                                                Default
                                            </span>
                                        ) : (
                                            <span className="text-[#555] text-xs">—</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4 text-[#555] text-xs">
                                        {template.createdAt
                                            ? new Date(template.createdAt).toLocaleDateString()
                                            : "—"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {total > pageSize && (
                <div className="mt-6">
                    <Pagination currentPage={page} totalItems={total} pageSize={pageSize} />
                </div>
            )}
        </div>
    );
}
