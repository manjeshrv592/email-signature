import { db } from "@/lib/db/client";
import { groups, userGroups, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UsersRound, Mail, Briefcase } from "lucide-react";

interface GroupDetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function GroupDetailPage({ params }: GroupDetailPageProps) {
    const { id } = await params;

    // Fetch group
    const group = await db
        .select()
        .from(groups)
        .where(eq(groups.id, id))
        .limit(1);

    if (group.length === 0) {
        notFound();
    }

    const g = group[0];

    // Fetch group members
    const members = await db
        .select({
            id: users.id,
            displayName: users.displayName,
            email: users.email,
            jobTitle: users.jobTitle,
        })
        .from(userGroups)
        .innerJoin(users, eq(userGroups.userId, users.id))
        .where(eq(userGroups.groupId, id));

    return (
        <div className="max-w-4xl">
            {/* Back link */}
            <Link
                href="/groups"
                className="inline-flex items-center gap-1.5 text-sm text-[#555] hover:text-white transition-colors mb-6"
            >
                <ArrowLeft size={14} />
                Back to Groups
            </Link>

            {/* Group header */}
            <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-6 mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
                        <UsersRound size={24} className="text-violet-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">{g.name}</h1>
                        <p className="text-[#8a8f98] text-sm">
                            {members.length} member{members.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>
            </div>

            {/* Members list */}
            <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-[#1e1e2e]">
                    <h2 className="text-sm font-semibold text-white">Members</h2>
                </div>

                {members.length === 0 ? (
                    <div className="p-8 text-center text-[#555] text-sm">
                        No members in this group. Sync users and groups to populate
                        memberships.
                    </div>
                ) : (
                    <div className="divide-y divide-[#1e1e2e]">
                        {members.map((member) => (
                            <Link
                                key={member.id}
                                href={`/users/${member.id}`}
                                className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#16161f] transition-colors group"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-xs font-bold shrink-0">
                                    {member.displayName
                                        ? member.displayName
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")
                                            .toUpperCase()
                                            .slice(0, 2)
                                        : "?"}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white font-medium group-hover:text-blue-400 transition-colors truncate">
                                        {member.displayName || "Unknown"}
                                    </p>
                                    <p className="text-xs text-[#555] flex items-center gap-3 mt-0.5">
                                        <span className="flex items-center gap-1 truncate">
                                            <Mail size={10} />
                                            {member.email}
                                        </span>
                                        {member.jobTitle && (
                                            <span className="flex items-center gap-1 truncate">
                                                <Briefcase size={10} />
                                                {member.jobTitle}
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
