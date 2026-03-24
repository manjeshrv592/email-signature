import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { resolveRulesForUser } from "../actions";
import {
    Scale,
    ArrowLeft,
    User,
    Mail,
    Briefcase,
    MapPin,
    UsersRound,
    Package,
    Globe,
    Hash,
    CheckCircle2,
} from "lucide-react";
import Link from "next/link";

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
    searchParams: Promise<{ user?: string }>;
}

export default async function RulePreviewPage({ searchParams }: PreviewPageProps) {
    const { user: selectedUserId } = await searchParams;

    // Fetch all users for the selector
    const allUsers = await db
        .select({
            id: users.id,
            displayName: users.displayName,
            email: users.email,
            jobTitle: users.jobTitle,
            country: users.country,
            department: users.department,
        })
        .from(users)
        .orderBy(users.displayName);

    // Resolve rules if a user is selected
    const resolved = selectedUserId ? await resolveRulesForUser(selectedUserId) : null;

    return (
        <div className="max-w-5xl">
            {/* Header */}
            <div className="mb-6">
                <Link
                    href="/rules"
                    className="inline-flex items-center gap-1.5 text-[#555] hover:text-white text-sm mb-4 transition-colors"
                >
                    <ArrowLeft size={14} />
                    Back to Rules
                </Link>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg">
                        <Scale size={20} className="text-white" />
                    </div>
                    Rule Preview
                </h1>
                <p className="text-[#8a8f98] mt-1 text-sm">
                    Select a user to see which resources they would receive
                </p>
            </div>

            {/* User Selector */}
            <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-5 mb-6">
                <label className="block text-xs text-[#555] uppercase tracking-wider font-medium mb-3">
                    Select User
                </label>
                <form>
                    <div className="flex items-center gap-3">
                        <select
                            name="user"
                            defaultValue={selectedUserId || ""}
                            className="flex-1 bg-[#0a0a0f] border border-[#1e1e2e] text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-violet-500/50 transition-colors"
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

            {/* Results */}
            {selectedUserId && !resolved && (
                <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-12 text-center">
                    <User size={48} className="mx-auto text-[#2a2a3e] mb-4" />
                    <h3 className="text-white font-semibold mb-2">User not found</h3>
                    <p className="text-[#555] text-sm">
                        The selected user was not found in the database.
                    </p>
                </div>
            )}

            {resolved && (
                <div className="space-y-6">
                    {/* User Card */}
                    <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-5">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-sm font-bold shrink-0">
                                {resolved.user.displayName
                                    ? resolved.user.displayName
                                        .split(" ")
                                        .map((n: string) => n[0])
                                        .join("")
                                        .toUpperCase()
                                        .slice(0, 2)
                                    : "?"}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-white font-semibold text-lg">
                                    {resolved.user.displayName || "Unknown"}
                                </h3>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-[#8a8f98]">
                                    <span className="flex items-center gap-1.5">
                                        <Mail size={13} className="text-[#555]" />
                                        {resolved.user.email}
                                    </span>
                                    {resolved.user.jobTitle && (
                                        <span className="flex items-center gap-1.5">
                                            <Briefcase size={13} className="text-[#555]" />
                                            {resolved.user.jobTitle}
                                        </span>
                                    )}
                                    {resolved.user.country && (
                                        <span className="flex items-center gap-1.5">
                                            <MapPin size={13} className="text-[#555]" />
                                            {resolved.user.country}
                                        </span>
                                    )}
                                </div>
                                {resolved.userGroups.length > 0 && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <UsersRound size={13} className="text-[#555]" />
                                        <div className="flex flex-wrap gap-1.5">
                                            {resolved.userGroups.map((ug) => (
                                                <span
                                                    key={ug.groupId}
                                                    className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                                >
                                                    {ug.groupName}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Resolved Resources */}
                    {resolved.resolvedResources.length === 0 ? (
                        <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-12 text-center">
                            <Package size={48} className="mx-auto text-[#2a2a3e] mb-4" />
                            <h3 className="text-white font-semibold mb-2">
                                No resources assigned
                            </h3>
                            <p className="text-[#555] text-sm max-w-md mx-auto">
                                No active rules match this user. Create rules to assign resource
                                items.
                            </p>
                        </div>
                    ) : (
                        resolved.resolvedResources.map((group) => (
                            <div key={group.resourceTypeId}>
                                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                    <Package size={14} className="text-emerald-400" />
                                    {group.resourceTypeName}
                                    <span className="text-[#555] font-normal text-xs">
                                        ({group.items.length} item
                                        {group.items.length !== 1 ? "s" : ""})
                                    </span>
                                </h3>
                                <div className="space-y-2">
                                    {group.items.map((item) => {
                                        const scopeColor =
                                            SCOPE_COLORS[item.matchedScope] ||
                                            SCOPE_COLORS.global;
                                        return (
                                            <div
                                                key={item.id}
                                                className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-4 flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <CheckCircle2
                                                        size={16}
                                                        className="text-emerald-400 shrink-0"
                                                    />
                                                    <div>
                                                        <div className="text-white text-sm font-medium">
                                                            {item.name}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md border ${scopeColor}`}
                                                    >
                                                        {SCOPE_LABELS[item.matchedScope] ||
                                                            item.matchedScope}
                                                    </span>
                                                    {item.matchedScope !== "global" && (
                                                        <span className="text-[#555] text-xs">
                                                            {item.matchedScopeValue}
                                                        </span>
                                                    )}
                                                    <span className="text-[#555] text-[10px] font-mono flex items-center gap-0.5">
                                                        <Hash size={10} />
                                                        {item.matchedPriority}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
