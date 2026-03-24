import { db } from "@/lib/db/client";
import { resourceTypes } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { Pagination } from "@/components/Pagination";
import { Blocks, Plus, Calendar, Hash } from "lucide-react";
import Link from "next/link";
import type { FieldDefinition } from "./actions";

const PAGE_SIZE = 10;

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

interface ResourceTypesPageProps {
    searchParams: Promise<{ page?: string }>;
}

export default async function ResourceTypesPage({ searchParams }: ResourceTypesPageProps) {
    const { page } = await searchParams;
    const currentPage = Math.max(1, parseInt(page || "1", 10));
    const offset = (currentPage - 1) * PAGE_SIZE;

    // Get total count
    const [{ total }] = await db
        .select({ total: count() })
        .from(resourceTypes);

    // Fetch paginated resource types
    const types = await db
        .select()
        .from(resourceTypes)
        .orderBy(desc(resourceTypes.createdAt))
        .limit(PAGE_SIZE)
        .offset(offset);

    return (
        <div className="max-w-5xl">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg">
                            <Blocks size={20} className="text-white" />
                        </div>
                        Resource Types
                    </h1>
                    <p className="text-[#8a8f98] mt-1 text-sm">
                        {total} resource type{total !== 1 ? "s" : ""} defined
                    </p>
                </div>
                <Link
                    href="/resource-types/new"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors duration-200 shadow-lg shadow-violet-600/20"
                >
                    <Plus size={16} />
                    New Resource Type
                </Link>
            </div>

            {/* Resource Types Grid */}
            {total === 0 ? (
                <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-12 text-center">
                    <Blocks size={48} className="mx-auto text-[#2a2a3e] mb-4" />
                    <h3 className="text-white font-semibold mb-2">No resource types yet</h3>
                    <p className="text-[#555] text-sm max-w-md mx-auto mb-6">
                        Resource types define the structure for your signature components — like
                        certifications, banners, or legal text. Each type has custom fields
                        you define.
                    </p>
                    <Link
                        href="/resource-types/new"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors duration-200"
                    >
                        <Plus size={16} />
                        Create Your First Resource Type
                    </Link>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {types.map((type) => {
                            const fields = (type.fieldsSchema as FieldDefinition[]) || [];
                            const iconEmoji = ICON_MAP[type.icon || ""] || "📦";

                            return (
                                <Link
                                    key={type.id}
                                    href={`/resource-types/${type.id}`}
                                    className="group bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-5 hover:border-[#2a2a3e] transition-all duration-200 hover:shadow-lg hover:shadow-black/20"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-lg shrink-0">
                                            {iconEmoji}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-white font-semibold text-sm truncate group-hover:text-violet-400 transition-colors">
                                                {type.name}
                                            </h3>
                                            <span className="text-[#444] text-xs font-mono">
                                                {type.slug}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs text-[#555]">
                                        <span className="flex items-center gap-1">
                                            <Hash size={11} />
                                            {fields.length} field{fields.length !== 1 ? "s" : ""}
                                        </span>
                                        {type.createdAt && (
                                            <span className="flex items-center gap-1">
                                                <Calendar size={11} />
                                                {new Date(type.createdAt).toLocaleDateString("en-IN", {
                                                    day: "numeric",
                                                    month: "short",
                                                })}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>

                    <Pagination
                        totalItems={total}
                        pageSize={PAGE_SIZE}
                        currentPage={currentPage}
                    />
                </>
            )}
        </div>
    );
}
