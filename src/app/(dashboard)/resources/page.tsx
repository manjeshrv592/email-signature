import { db } from "@/lib/db/client";
import { resourceTypes, resourceItems } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { Pagination } from "@/components/Pagination";
import { Package, Plus, Calendar, Power, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

const PAGE_SIZE = 10;

interface ResourcesPageProps {
    searchParams: Promise<{ type?: string; page?: string }>;
}

function getTimeBoundStatus(
    validFrom: Date | null,
    validUntil: Date | null,
    isActive: boolean | null
): { label: string; color: string; icon: typeof Clock } {
    if (!isActive) {
        return { label: "Inactive", color: "text-[#555] bg-[#1a1a1a] border-[#1e1e2e]", icon: Power };
    }

    const now = new Date();

    if (validFrom && now < validFrom) {
        return { label: "Scheduled", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: Clock };
    }

    if (validUntil && now > validUntil) {
        return { label: "Expired", color: "text-red-400 bg-red-500/10 border-red-500/20", icon: AlertCircle };
    }

    return { label: "Active", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: Power };
}

export default async function ResourcesPage({ searchParams }: ResourcesPageProps) {
    const { type: selectedTypeId, page } = await searchParams;
    const currentPage = Math.max(1, parseInt(page || "1", 10));

    // Fetch all resource types for the type selector
    const types = await db
        .select()
        .from(resourceTypes)
        .where()
        .orderBy(resourceTypes.name);

    // If no type selected and types exist, default to first
    const activeTypeId = selectedTypeId || types[0]?.id || null;

    // Fetch items for the selected type
    let items: (typeof resourceItems.$inferSelect)[] = [];
    let total = 0;

    if (activeTypeId) {
        const offset = (currentPage - 1) * PAGE_SIZE;

        const [{ itemCount }] = await db
            .select({ itemCount: count() })
            .from(resourceItems)
            .where(
                eq(resourceItems.resourceTypeId, activeTypeId)
            );
        total = itemCount;

        items = await db
            .select()
            .from(resourceItems)
            .where(
                eq(resourceItems.resourceTypeId, activeTypeId)
            )
            .orderBy(desc(resourceItems.createdAt))
            .limit(PAGE_SIZE)
            .offset(offset);
    }

    const activeType = types.find((t) => t.id === activeTypeId);

    return (
        <div className="max-w-5xl">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
                            <Package size={20} className="text-white" />
                        </div>
                        Resources
                    </h1>
                    <p className="text-[#8a8f98] mt-1 text-sm">
                        Manage items for your resource types
                    </p>
                </div>
                {activeTypeId && (
                    <Link
                        href={`/resources/${activeTypeId}/new`}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors duration-200 shadow-lg shadow-violet-600/20"
                    >
                        <Plus size={16} />
                        New Item
                    </Link>
                )}
            </div>

            {/* No types empty state */}
            {types.length === 0 ? (
                <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-12 text-center">
                    <Package size={48} className="mx-auto text-[#2a2a3e] mb-4" />
                    <h3 className="text-white font-semibold mb-2">No resource types defined</h3>
                    <p className="text-[#555] text-sm max-w-md mx-auto mb-6">
                        Create a resource type first to define the structure, then add items here.
                    </p>
                    <Link
                        href="/resource-types/new"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors duration-200"
                    >
                        <Plus size={16} />
                        Create Resource Type
                    </Link>
                </div>
            ) : (
                <>
                    {/* Resource Type Tabs */}
                    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
                        {types.map((type) => (
                            <Link
                                key={type.id}
                                href={`/resources?type=${type.id}`}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${type.id === activeTypeId
                                    ? "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                                    : "bg-[#12121a] border border-[#1e1e2e] text-[#8a8f98] hover:text-white hover:border-[#2a2a3e]"
                                    }`}
                            >
                                {type.name}
                                <span className="text-xs opacity-60">
                                    {type.id === activeTypeId ? total : ""}
                                </span>
                            </Link>
                        ))}
                    </div>

                    {/* Items */}
                    {total === 0 ? (
                        <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-12 text-center">
                            <Package size={48} className="mx-auto text-[#2a2a3e] mb-4" />
                            <h3 className="text-white font-semibold mb-2">
                                No {activeType?.name || "resource"} items yet
                            </h3>
                            <p className="text-[#555] text-sm max-w-md mx-auto mb-6">
                                Create your first item using the dynamic form based on the{" "}
                                {activeType?.name || "resource type"} schema.
                            </p>
                            <Link
                                href={`/resources/${activeTypeId}/new`}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors duration-200"
                            >
                                <Plus size={16} />
                                Create First Item
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {items.map((item) => {
                                    const status = getTimeBoundStatus(
                                        item.validFrom,
                                        item.validUntil,
                                        item.isActive
                                    );
                                    const StatusIcon = status.icon;

                                    return (
                                        <Link
                                            key={item.id}
                                            href={`/resources/${activeTypeId}/${item.id}`}
                                            className="group bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-5 hover:border-[#2a2a3e] transition-all duration-200 hover:shadow-lg hover:shadow-black/20"
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-white font-semibold text-sm truncate group-hover:text-violet-400 transition-colors">
                                                    {item.name}
                                                </h3>
                                                <span
                                                    className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded border ${status.color}`}
                                                >
                                                    <StatusIcon size={10} />
                                                    {status.label}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-4 text-xs text-[#555]">
                                                {item.createdAt && (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={11} />
                                                        {new Date(item.createdAt).toLocaleDateString(
                                                            "en-IN",
                                                            { day: "numeric", month: "short" }
                                                        )}
                                                    </span>
                                                )}
                                                {(item.validFrom || item.validUntil) && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={11} />
                                                        Time-bound
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
                </>
            )}
        </div>
    );
}
