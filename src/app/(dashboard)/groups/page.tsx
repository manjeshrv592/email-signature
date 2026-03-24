import { db } from "@/lib/db/client";
import { groups, userGroups } from "@/lib/db/schema";
import { eq, desc, sql, count } from "drizzle-orm";
import { SyncGroupsButton } from "../users/SyncButtons";
import { Pagination } from "@/components/Pagination";
import { UsersRound, Clock, Users } from "lucide-react";
import Link from "next/link";

const PAGE_SIZE = 10;

interface GroupsPageProps {
    searchParams: Promise<{ page?: string }>;
}

export default async function GroupsPage({ searchParams }: GroupsPageProps) {
    const { page } = await searchParams;
    const currentPage = Math.max(1, parseInt(page || "1", 10));
    const offset = (currentPage - 1) * PAGE_SIZE;

    // Get total count
    const [{ total }] = await db
        .select({ total: count() })
        .from(groups);

    // Fetch paginated groups with member counts
    const allGroups = await db
        .select({
            id: groups.id,
            name: groups.name,
            syncedAt: groups.syncedAt,
            memberCount: sql<number>`count(${userGroups.userId})`.as("member_count"),
        })
        .from(groups)
        .leftJoin(userGroups, eq(userGroups.groupId, groups.id))
        .groupBy(groups.id, groups.name, groups.syncedAt)
        .orderBy(desc(groups.syncedAt))
        .limit(PAGE_SIZE)
        .offset(offset);

    const lastSynced = allGroups.length > 0 ? allGroups[0].syncedAt : null;

    return (
        <div className="max-w-5xl">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg">
                            <UsersRound size={20} className="text-white" />
                        </div>
                        Groups
                    </h1>
                    <p className="text-[#8a8f98] mt-1 text-sm">
                        {total} group{total !== 1 ? "s" : ""} synced from Microsoft 365
                    </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <SyncGroupsButton />
                    {lastSynced && (
                        <span className="text-xs text-[#555] flex items-center gap-1">
                            <Clock size={12} />
                            Last synced:{" "}
                            {new Date(lastSynced).toLocaleString("en-IN", {
                                dateStyle: "medium",
                                timeStyle: "short",
                            })}
                        </span>
                    )}
                </div>
            </div>

            {/* Groups Grid */}
            {total === 0 ? (
                <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-12 text-center">
                    <UsersRound size={48} className="mx-auto text-[#2a2a3e] mb-4" />
                    <h3 className="text-white font-semibold mb-2">No groups synced yet</h3>
                    <p className="text-[#555] text-sm max-w-md mx-auto">
                        Click &quot;Sync Groups&quot; to pull all groups from your Microsoft
                        365 tenant. Make sure to sync users first.
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {allGroups.map((group) => (
                            <Link
                                key={group.id}
                                href={`/groups/${group.id}`}
                                className="group bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-5 hover:border-[#2a2a3e] transition-all duration-200 hover:shadow-lg hover:shadow-black/20"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                                        <UsersRound
                                            size={16}
                                            className="text-violet-400"
                                        />
                                    </div>
                                    <h3 className="text-white font-semibold text-sm truncate group-hover:text-violet-400 transition-colors">
                                        {group.name}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-[#555]">
                                    <Users size={12} />
                                    {Number(group.memberCount)} member
                                    {Number(group.memberCount) !== 1 ? "s" : ""}
                                </div>
                            </Link>
                        ))}
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
