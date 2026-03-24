import { db } from "@/lib/db/client";
import { rules, resourceItems, resourceTypes, users, groups } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
    Scale,
    ArrowLeft,
    Pencil,
    Globe,
    MapPin,
    Briefcase,
    UsersRound,
    User,
    Package,
    Hash,
} from "lucide-react";
import DeleteButton from "./DeleteButton";

const SCOPE_ICONS: Record<string, typeof Globe> = {
    global: Globe,
    country: MapPin,
    job_title: Briefcase,
    group: UsersRound,
    individual: User,
};

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

interface RuleDetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function RuleDetailPage({ params }: RuleDetailPageProps) {
    const { id } = await params;

    const [rule] = await db
        .select({
            id: rules.id,
            scopeType: rules.scopeType,
            scopeValue: rules.scopeValue,
            priority: rules.priority,
            createdAt: rules.createdAt,
            resourceItemId: rules.resourceItemId,
            resourceItemName: resourceItems.name,
            resourceTypeName: resourceTypes.name,
            resourceTypeId: resourceTypes.id,
        })
        .from(rules)
        .innerJoin(resourceItems, eq(rules.resourceItemId, resourceItems.id))
        .innerJoin(resourceTypes, eq(resourceItems.resourceTypeId, resourceTypes.id))
        .where(eq(rules.id, id))
        .limit(1);

    if (!rule) notFound();

    // Resolve scope value display name
    let scopeValueLabel = rule.scopeValue;
    if (rule.scopeType === "global") {
        scopeValueLabel = "All Users";
    } else if (rule.scopeType === "group") {
        const [group] = await db
            .select({ name: groups.name })
            .from(groups)
            .where(eq(groups.id, rule.scopeValue))
            .limit(1);
        if (group) scopeValueLabel = group.name;
    } else if (rule.scopeType === "individual") {
        const [user] = await db
            .select({ displayName: users.displayName, email: users.email })
            .from(users)
            .where(eq(users.id, rule.scopeValue))
            .limit(1);
        if (user) scopeValueLabel = user.displayName || user.email;
    }

    const ScopeIcon = SCOPE_ICONS[rule.scopeType] || Globe;
    const scopeColor = SCOPE_COLORS[rule.scopeType] || SCOPE_COLORS.global;

    return (
        <div className="max-w-3xl">
            {/* Header */}
            <div className="mb-6">
                <Link
                    href="/rules"
                    className="inline-flex items-center gap-1.5 text-[#555] hover:text-white text-sm mb-4 transition-colors"
                >
                    <ArrowLeft size={14} />
                    Back to Rules
                </Link>
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg">
                                <Scale size={20} className="text-white" />
                            </div>
                            Rule Detail
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/rules/${rule.id}/edit`}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#12121a] border border-[#1e1e2e] hover:border-violet-500/30 text-[#8a8f98] hover:text-violet-400 text-sm font-medium rounded-xl transition-colors duration-200"
                        >
                            <Pencil size={14} />
                            Edit
                        </Link>
                        <DeleteButton ruleId={rule.id} />
                    </div>
                </div>
            </div>

            {/* Rule Details */}
            <div className="space-y-4">
                {/* Resource Item */}
                <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-5">
                    <h3 className="text-xs text-[#555] uppercase tracking-wider font-medium mb-3">
                        Resource Item
                    </h3>
                    <Link
                        href={`/resources/${rule.resourceTypeId}/${rule.resourceItemId}`}
                        className="group flex items-center gap-3"
                    >
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <Package size={18} className="text-emerald-400" />
                        </div>
                        <div>
                            <div className="text-white font-semibold text-sm group-hover:text-violet-400 transition-colors">
                                {rule.resourceItemName}
                            </div>
                            <div className="text-[#555] text-xs">{rule.resourceTypeName}</div>
                        </div>
                    </Link>
                </div>

                {/* Scope */}
                <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-5">
                    <h3 className="text-xs text-[#555] uppercase tracking-wider font-medium mb-3">
                        Scope
                    </h3>
                    <div className="flex items-center gap-3">
                        <span
                            className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-xl border ${scopeColor}`}
                        >
                            <ScopeIcon size={14} />
                            {SCOPE_LABELS[rule.scopeType] || rule.scopeType}
                        </span>
                        <span className="text-white text-sm">{scopeValueLabel}</span>
                    </div>
                </div>

                {/* Priority */}
                <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-5">
                    <h3 className="text-xs text-[#555] uppercase tracking-wider font-medium mb-3">
                        Priority
                    </h3>
                    <div className="flex items-center gap-2">
                        <Hash size={14} className="text-[#555]" />
                        <span className="text-white text-sm font-mono">{rule.priority}</span>
                        <span className="text-[#555] text-xs ml-2">
                            (higher number = higher priority)
                        </span>
                    </div>
                </div>

                {/* Created */}
                {rule.createdAt && (
                    <div className="text-[#555] text-xs">
                        Created{" "}
                        {new Date(rule.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
