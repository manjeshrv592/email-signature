import { db } from "@/lib/db/client";
import { users, groups, userGroups } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Mail,
    Briefcase,
    Building2,
    Globe,
    MapPin,
    Phone,
    Clock,
    UsersRound,
} from "lucide-react";

interface UserProfilePageProps {
    params: Promise<{ id: string }>;
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
    const { id } = await params;

    // Fetch user
    const user = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

    if (user.length === 0) {
        notFound();
    }

    const u = user[0];

    // Fetch user's groups
    const userGroupList = await db
        .select({
            groupId: groups.id,
            groupName: groups.name,
        })
        .from(userGroups)
        .innerJoin(groups, eq(userGroups.groupId, groups.id))
        .where(eq(userGroups.userId, id));

    const initials = u.displayName
        ? u.displayName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : "?";

    const fields = [
        { icon: Mail, label: "Email", value: u.email },
        { icon: Briefcase, label: "Job Title", value: u.jobTitle },
        { icon: Building2, label: "Department", value: u.department },
        { icon: Globe, label: "Country", value: u.country },
        { icon: MapPin, label: "City", value: u.city },
        { icon: Phone, label: "Phone", value: u.phone },
    ];

    return (
        <div className="max-w-3xl">
            {/* Back link */}
            <Link
                href="/users"
                className="inline-flex items-center gap-1.5 text-sm text-[#555] hover:text-white transition-colors mb-6"
            >
                <ArrowLeft size={14} />
                Back to Users
            </Link>

            {/* Profile header */}
            <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-6 mb-4">
                <div className="flex items-center gap-4 mb-6">
                    {u.photoUrl ? (
                        <img
                            src={u.photoUrl}
                            alt={u.displayName || "User"}
                            className="w-16 h-16 rounded-xl object-cover shrink-0 border border-blue-500/30"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-xl font-bold shrink-0">
                            {initials}
                        </div>
                    )}
                    <div>
                        <h1 className="text-xl font-bold text-white">
                            {u.displayName || "Unknown User"}
                        </h1>
                        <p className="text-[#8a8f98] text-sm">{u.email}</p>
                    </div>
                </div>

                {/* Profile fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {fields.map((field) => {
                        const Icon = field.icon;
                        return (
                            <div
                                key={field.label}
                                className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#0c0c14] border border-[#1a1a28]"
                            >
                                <Icon
                                    size={16}
                                    className="text-[#555] mt-0.5 shrink-0"
                                />
                                <div>
                                    <p className="text-[#555] text-xs font-medium uppercase tracking-wider">
                                        {field.label}
                                    </p>
                                    <p className="text-white text-sm mt-0.5">
                                        {field.value || (
                                            <span className="text-[#333]">Not set</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Sync info */}
                {u.syncedAt && (
                    <div className="mt-4 pt-4 border-t border-[#1e1e2e] flex items-center gap-1.5 text-xs text-[#444]">
                        <Clock size={12} />
                        Synced:{" "}
                        {new Date(u.syncedAt).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                        })}
                    </div>
                )}
            </div>

            {/* Group Memberships */}
            <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                    <UsersRound size={16} className="text-violet-400" />
                    Group Memberships
                </h2>

                {userGroupList.length === 0 ? (
                    <p className="text-[#555] text-sm">
                        No group memberships. Sync groups first.
                    </p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {userGroupList.map((g) => (
                            <Link
                                key={g.groupId}
                                href={`/groups/${g.groupId}`}
                                className="px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium hover:bg-violet-500/20 transition-colors"
                            >
                                {g.groupName}
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Signature Override */}
            <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-6 mt-4">
                <Link
                    href={`/users/${id}/signature`}
                    className="flex items-center justify-between group"
                >
                    <div>
                        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                            <Briefcase size={16} className="text-pink-400" />
                            Signature Override
                        </h2>
                        <p className="text-[#555] text-xs mt-1">
                            Customize the email signature for this user
                        </p>
                    </div>
                    <ArrowLeft size={14} className="text-[#555] group-hover:text-white rotate-180 transition-colors" />
                </Link>
            </div>
        </div>
    );
}
