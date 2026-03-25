import { db } from "@/lib/db/client";
import {
  rules,
  resourceItems,
  resourceTypes,
  users,
  groups,
} from "@/lib/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { Pagination } from "@/components/Pagination";
import {
  Scale,
  Plus,
  Globe,
  MapPin,
  Briefcase,
  UsersRound,
  User,
} from "lucide-react";
import Link from "next/link";

const PAGE_SIZE = 10;

interface RulesPageProps {
  searchParams: Promise<{ page?: string; scope?: string }>;
}

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

export default async function RulesPage({ searchParams }: RulesPageProps) {
  const { page, scope } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1", 10));
  const offset = (currentPage - 1) * PAGE_SIZE;

  // Build conditions
  const conditions = [];
  if (scope && scope in SCOPE_LABELS) {
    conditions.push(eq(rules.scopeType, scope));
  }

  const [{ total }] = await db
    .select({ total: count() })
    .from(rules)
    .where(and(...conditions));

  const rulesList = await db
    .select({
      id: rules.id,
      scopeType: rules.scopeType,
      scopeValue: rules.scopeValue,
      priority: rules.priority,
      createdAt: rules.createdAt,
      resourceItemId: rules.resourceItemId,
      resourceItemName: resourceItems.name,
      resourceTypeName: resourceTypes.name,
    })
    .from(rules)
    .innerJoin(resourceItems, eq(rules.resourceItemId, resourceItems.id))
    .innerJoin(
      resourceTypes,
      eq(resourceItems.resourceTypeId, resourceTypes.id),
    )
    .where(and(...conditions))
    .orderBy(desc(rules.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  // Resolve group and user names for display
  const groupIds = rulesList
    .filter((r) => r.scopeType === "group")
    .map((r) => r.scopeValue);
  const userIds = rulesList
    .filter((r) => r.scopeType === "individual")
    .map((r) => r.scopeValue);

  const groupNames = new Map<string, string>();
  const userNames = new Map<string, string>();

  if (groupIds.length > 0) {
    const groupRows = await db
      .select({ id: groups.id, name: groups.name })
      .from(groups);
    groupRows.forEach((g) => groupNames.set(g.id, g.name));
  }

  if (userIds.length > 0) {
    const userRows = await db
      .select({
        id: users.id,
        displayName: users.displayName,
        email: users.email,
      })
      .from(users);
    userRows.forEach((u) => userNames.set(u.id, u.displayName || u.email));
  }

  function resolveScopeValueLabel(scopeType: string, scopeValue: string) {
    if (scopeType === "global") return "All Users";
    if (scopeType === "group") return groupNames.get(scopeValue) || scopeValue;
    if (scopeType === "individual")
      return userNames.get(scopeValue) || scopeValue;
    return scopeValue;
  }

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-orange-500 to-amber-500 shadow-lg">
              <Scale size={20} className="text-white" />
            </div>
            Rules
          </h1>
          <p className="text-[#8a8f98] mt-1 text-sm">
            Assign resource items to users by scope
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/rules/preview"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#12121a] border border-[#1e1e2e] hover:border-[#2a2a3e] text-[#8a8f98] hover:text-white text-sm font-medium rounded-xl transition-colors duration-200"
          >
            <User size={16} />
            Preview
          </Link>
          <Link
            href="/rules/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors duration-200 shadow-lg shadow-violet-600/20"
          >
            <Plus size={16} />
            New Rule
          </Link>
        </div>
      </div>

      {/* Scope Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        <Link
          href="/rules"
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
            !scope
              ? "bg-violet-500/10 text-violet-400 border border-violet-500/20"
              : "bg-[#12121a] border border-[#1e1e2e] text-[#8a8f98] hover:text-white hover:border-[#2a2a3e]"
          }`}
        >
          All
          {!scope && <span className="text-xs opacity-60">{total}</span>}
        </Link>
        {Object.entries(SCOPE_LABELS).map(([key, label]) => {
          const Icon = SCOPE_ICONS[key];
          return (
            <Link
              key={key}
              href={`/rules?scope=${key}`}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                scope === key
                  ? "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                  : "bg-[#12121a] border border-[#1e1e2e] text-[#8a8f98] hover:text-white hover:border-[#2a2a3e]"
              }`}
            >
              <Icon size={14} />
              {label}
            </Link>
          );
        })}
      </div>

      {/* Rules Table */}
      {total === 0 ? (
        <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-12 text-center">
          <Scale size={48} className="mx-auto text-[#2a2a3e] mb-4" />
          <h3 className="text-white font-semibold mb-2">
            {scope ? `No ${SCOPE_LABELS[scope]} rules` : "No rules created yet"}
          </h3>
          <p className="text-[#555] text-sm max-w-md mx-auto mb-6">
            Rules determine which resource items are assigned to users. Create
            your first rule to start assigning resources by scope.
          </p>
          <Link
            href="/rules/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors duration-200"
          >
            <Plus size={16} />
            Create First Rule
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1e1e2e]">
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-[#555] uppercase tracking-wider">
                      Resource Item
                    </th>
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-[#555] uppercase tracking-wider">
                      Scope
                    </th>
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-[#555] uppercase tracking-wider">
                      Value
                    </th>
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-[#555] uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-[#555] uppercase tracking-wider">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rulesList.map((rule) => {
                    const ScopeIcon = SCOPE_ICONS[rule.scopeType] || Globe;
                    const scopeColor =
                      SCOPE_COLORS[rule.scopeType] || SCOPE_COLORS.global;

                    return (
                      <tr
                        key={rule.id}
                        className="border-b border-[#1e1e2e] last:border-b-0 hover:bg-[#16161f] transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <Link
                            href={`/rules/${rule.id}`}
                            className="text-sm text-white font-medium hover:text-violet-400 transition-colors"
                          >
                            {rule.resourceItemName}
                          </Link>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg border ${scopeColor}`}
                          >
                            <ScopeIcon size={12} />
                            {SCOPE_LABELS[rule.scopeType] || rule.scopeType}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-[#8a8f98]">
                          {resolveScopeValueLabel(
                            rule.scopeType,
                            rule.scopeValue,
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-[#8a8f98] font-mono">
                          {rule.priority}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-[#555]">
                          {rule.resourceTypeName}
                        </td>
                      </tr>
                    );
                  })}
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
