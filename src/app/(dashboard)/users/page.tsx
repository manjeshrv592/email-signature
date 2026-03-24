import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/helpers";
import { desc, count } from "drizzle-orm";
import { SyncUsersButton } from "./SyncButtons";
import { Pagination } from "@/components/Pagination";
import { Users, Clock, Mail, Briefcase, Building2, Globe } from "lucide-react";
import Link from "next/link";

const PAGE_SIZE = 10;

interface UsersPageProps {
    searchParams: Promise<{ page?: string }>;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
    const { page } = await searchParams;
    await requireAuth();
    const currentPage = Math.max(1, parseInt(page || "1", 10));
    const offset = (currentPage - 1) * PAGE_SIZE;

    // Get total count
    const [{ total }] = await db
        .select({ total: count() })
        .from(users);

    // Fetch paginated users
    const allUsers = await db
        .select()
        .from(users)
        .orderBy(desc(users.syncedAt))
        .limit(PAGE_SIZE)
        .offset(offset);

    const lastSynced = allUsers.length > 0 ? allUsers[0].syncedAt : null;

    return (
        <div className="max-w-6xl">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
                            <Users size={20} className="text-white" />
                        </div>
                        Users
                    </h1>
                    <p className="text-[#8a8f98] mt-1 text-sm">
                        {total} user{total !== 1 ? "s" : ""} synced from Microsoft 365
                    </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <SyncUsersButton />
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

            {/* Users Table */}
            {total === 0 ? (
                <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-12 text-center">
                    <Users size={48} className="mx-auto text-[#2a2a3e] mb-4" />
                    <h3 className="text-white font-semibold mb-2">No users synced yet</h3>
                    <p className="text-[#555] text-sm max-w-md mx-auto">
                        Click &quot;Sync Users&quot; to pull all users from your Microsoft 365
                        tenant into the dashboard.
                    </p>
                </div>
            ) : (
                <>
                    <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[#1e1e2e]">
                                        <th className="text-left px-5 py-3.5 text-xs font-medium text-[#555] uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th className="text-left px-5 py-3.5 text-xs font-medium text-[#555] uppercase tracking-wider">
                                            <span className="flex items-center gap-1.5">
                                                <Mail size={12} /> Email
                                            </span>
                                        </th>
                                        <th className="text-left px-5 py-3.5 text-xs font-medium text-[#555] uppercase tracking-wider">
                                            <span className="flex items-center gap-1.5">
                                                <Briefcase size={12} /> Job Title
                                            </span>
                                        </th>
                                        <th className="text-left px-5 py-3.5 text-xs font-medium text-[#555] uppercase tracking-wider">
                                            <span className="flex items-center gap-1.5">
                                                <Building2 size={12} /> Department
                                            </span>
                                        </th>
                                        <th className="text-left px-5 py-3.5 text-xs font-medium text-[#555] uppercase tracking-wider">
                                            <span className="flex items-center gap-1.5">
                                                <Globe size={12} /> Country
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allUsers.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="border-b border-[#1e1e2e] last:border-b-0 hover:bg-[#16161f] transition-colors"
                                        >
                                            <td className="px-5 py-3.5">
                                                <Link
                                                    href={`/users/${user.id}`}
                                                    className="flex items-center gap-3 group"
                                                >
                                                    {user.photoUrl ? (
                                                        <img
                                                            src={user.photoUrl}
                                                            alt={user.displayName || "User"}
                                                            className="w-8 h-8 rounded-full object-cover shrink-0 border border-blue-500/30"
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-xs font-bold shrink-0">
                                                            {user.displayName
                                                                ? user.displayName
                                                                    .split(" ")
                                                                    .map((n: string) => n[0])
                                                                    .join("")
                                                                    .toUpperCase()
                                                                    .slice(0, 2)
                                                                : "?"}
                                                        </div>
                                                    )}
                                                    <span className="text-sm text-white font-medium group-hover:text-blue-400 transition-colors">
                                                        {user.displayName || "—"}
                                                    </span>
                                                </Link>
                                            </td>
                                            <td className="px-5 py-3.5 text-sm text-[#8a8f98]">
                                                {user.email || "—"}
                                            </td>
                                            <td className="px-5 py-3.5 text-sm text-[#8a8f98]">
                                                {user.jobTitle || (
                                                    <span className="text-[#333]">—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-sm text-[#8a8f98]">
                                                {user.department || (
                                                    <span className="text-[#333]">—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-sm text-[#8a8f98]">
                                                {user.country || (
                                                    <span className="text-[#333]">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
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
