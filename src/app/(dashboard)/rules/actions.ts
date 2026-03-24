"use server";

import { db } from "@/lib/db/client";
import { rules, resourceItems, resourceTypes, users, groups, userGroups } from "@/lib/db/schema";
import { eq, and, count, desc, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ─── Types ──────────────────────────────────────────

export type ScopeType = "global" | "country" | "job_title" | "group" | "individual";

const VALID_SCOPE_TYPES: ScopeType[] = ["global", "country", "job_title", "group", "individual"];

const SCOPE_PRIORITY: Record<ScopeType, number> = {
    global: 0,
    country: 1,
    job_title: 2,
    group: 3,
    individual: 4,
};

// ─── Create ─────────────────────────────────────────

export async function createRule(data: {
    resourceItemId: string;
    scopeType: ScopeType;
    scopeValue: string;
    priority: number;
}): Promise<{ error?: string }> {
    if (!VALID_SCOPE_TYPES.includes(data.scopeType)) {
        return { error: "Invalid scope type." };
    }

    if (!data.scopeValue.trim()) {
        return { error: "Scope value is required." };
    }

    const scopeValue = data.scopeType === "global" ? "*" : data.scopeValue.trim();

    const [item] = await db
        .select({ id: resourceItems.id })
        .from(resourceItems)
        .where(eq(resourceItems.id, data.resourceItemId))
        .limit(1);

    if (!item) return { error: "Resource item not found." };

    await db.insert(rules).values({
        resourceItemId: data.resourceItemId,
        scopeType: data.scopeType,
        scopeValue: scopeValue,
        priority: data.priority || 0,
    });

    revalidatePath("/rules");
    redirect("/rules");
}

// ─── Update ─────────────────────────────────────────

export async function updateRule(
    id: string,
    data: {
        resourceItemId: string;
        scopeType: ScopeType;
        scopeValue: string;
        priority: number;
    }
): Promise<{ error?: string }> {
    if (!VALID_SCOPE_TYPES.includes(data.scopeType)) {
        return { error: "Invalid scope type." };
    }

    if (!data.scopeValue.trim()) {
        return { error: "Scope value is required." };
    }

    const scopeValue = data.scopeType === "global" ? "*" : data.scopeValue.trim();

    const [existing] = await db
        .select({ id: rules.id })
        .from(rules)
        .where(eq(rules.id, id))
        .limit(1);

    if (!existing) return { error: "Rule not found." };

    const [item] = await db
        .select({ id: resourceItems.id })
        .from(resourceItems)
        .where(eq(resourceItems.id, data.resourceItemId))
        .limit(1);

    if (!item) return { error: "Resource item not found." };

    await db
        .update(rules)
        .set({
            resourceItemId: data.resourceItemId,
            scopeType: data.scopeType,
            scopeValue: scopeValue,
            priority: data.priority || 0,
        })
        .where(eq(rules.id, id));

    revalidatePath("/rules");
    revalidatePath(`/rules/${id}`);
    redirect(`/rules/${id}`);
}

// ─── Delete ─────────────────────────────────────────

export async function deleteRule(id: string): Promise<{ error?: string }> {
    const [existing] = await db
        .select({ id: rules.id })
        .from(rules)
        .where(eq(rules.id, id))
        .limit(1);

    if (!existing) return { error: "Rule not found." };

    await db.delete(rules).where(eq(rules.id, id));

    revalidatePath("/rules");
    redirect("/rules");
}

// ─── Queries ────────────────────────────────────────

export async function getRules(
    page: number = 1,
    pageSize: number = 10,
    scopeTypeFilter?: ScopeType
) {
    const offset = (page - 1) * pageSize;

    const conditions = scopeTypeFilter
        ? [eq(rules.scopeType, scopeTypeFilter)]
        : [];

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ total }] = await db
        .select({ total: count() })
        .from(rules)
        .where(whereClause);

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
            resourceTypeId: resourceTypes.id,
        })
        .from(rules)
        .innerJoin(resourceItems, eq(rules.resourceItemId, resourceItems.id))
        .innerJoin(resourceTypes, eq(resourceItems.resourceTypeId, resourceTypes.id))
        .where(whereClause)
        .orderBy(desc(rules.createdAt))
        .limit(pageSize)
        .offset(offset);

    return { rules: rulesList, total };
}

// ─── Data for Form Dropdowns ────────────────────────

export async function getRuleFormData() {
    const types = await db
        .select({
            id: resourceTypes.id,
            name: resourceTypes.name,
        })
        .from(resourceTypes)
        .orderBy(resourceTypes.name);

    const items = await db
        .select({
            id: resourceItems.id,
            name: resourceItems.name,
            resourceTypeId: resourceItems.resourceTypeId,
            isActive: resourceItems.isActive,
        })
        .from(resourceItems)
        .orderBy(resourceItems.name);

    const allUsers = await db
        .select({
            id: users.id,
            displayName: users.displayName,
            email: users.email,
            country: users.country,
            jobTitle: users.jobTitle,
        })
        .from(users)
        .orderBy(users.displayName);

    const countries = [...new Set(allUsers.map((u) => u.country).filter(Boolean))] as string[];
    const jobTitles = [...new Set(allUsers.map((u) => u.jobTitle).filter(Boolean))] as string[];

    const allGroups = await db
        .select({
            id: groups.id,
            name: groups.name,
        })
        .from(groups)
        .orderBy(groups.name);

    return {
        resourceTypes: types,
        resourceItems: items,
        users: allUsers,
        countries,
        jobTitles,
        groups: allGroups,
    };
}

// ─── Rule Resolution Engine ─────────────────────────

/**
 * Resolve rules for a user — single-tenant version (no tenantId needed).
 */
export async function resolveRulesForUserInternal(userId: string) {
    // 1. Fetch user profile
    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    if (!user) return null;

    // 2. Fetch user's group memberships
    const userGroupRows = await db
        .select({
            groupId: userGroups.groupId,
            groupName: groups.name,
        })
        .from(userGroups)
        .innerJoin(groups, eq(userGroups.groupId, groups.id))
        .where(eq(userGroups.userId, userId));

    const userGroupIds = userGroupRows.map((ug) => ug.groupId);

    // 3. Fetch all rules
    const allRules = await db
        .select({
            id: rules.id,
            resourceItemId: rules.resourceItemId,
            scopeType: rules.scopeType,
            scopeValue: rules.scopeValue,
            priority: rules.priority,
        })
        .from(rules);

    // 4. Filter rules that match this user
    const matchingRules = allRules.filter((rule) => {
        switch (rule.scopeType) {
            case "global":
                return true;
            case "country":
                return user.country?.toLowerCase() === rule.scopeValue.toLowerCase();
            case "job_title":
                return user.jobTitle?.toLowerCase() === rule.scopeValue.toLowerCase();
            case "group":
                return userGroupIds.includes(rule.scopeValue);
            case "individual":
                return rule.scopeValue === userId;
            default:
                return false;
        }
    });

    // 5. Fetch all active, time-valid resource items referenced by matching rules
    const matchingItemIds = [...new Set(matchingRules.map((r) => r.resourceItemId))];

    if (matchingItemIds.length === 0) {
        return {
            user,
            userGroups: userGroupRows,
            resolvedResources: [],
        };
    }

    const now = new Date();

    const matchingItems = await db
        .select({
            id: resourceItems.id,
            name: resourceItems.name,
            resourceTypeId: resourceItems.resourceTypeId,
            fieldValues: resourceItems.fieldValues,
            isActive: resourceItems.isActive,
            validFrom: resourceItems.validFrom,
            validUntil: resourceItems.validUntil,
            resourceTypeName: resourceTypes.name,
            resourceTypeSlug: resourceTypes.slug,
        })
        .from(resourceItems)
        .innerJoin(resourceTypes, eq(resourceItems.resourceTypeId, resourceTypes.id))
        .where(
            and(
                inArray(resourceItems.id, matchingItemIds),
                eq(resourceItems.isActive, true)
            )
        );

    // Filter by time validity
    const activeItems = matchingItems.filter((item) => {
        if (item.validFrom && now < item.validFrom) return false;
        if (item.validUntil && now > item.validUntil) return false;
        return true;
    });

    // 6. For each resource type, resolve which items apply using priority
    const itemsByType = new Map<
        string,
        {
            resourceTypeName: string;
            resourceTypeSlug: string;
            items: Array<{
                item: (typeof activeItems)[0];
                matchedRule: (typeof matchingRules)[0];
                effectivePriority: number;
            }>;
        }
    >();

    for (const item of activeItems) {
        const rulesForItem = matchingRules
            .filter((r) => r.resourceItemId === item.id)
            .sort((a, b) => {
                const scopeDiff =
                    SCOPE_PRIORITY[b.scopeType as ScopeType] -
                    SCOPE_PRIORITY[a.scopeType as ScopeType];
                if (scopeDiff !== 0) return scopeDiff;
                return (b.priority ?? 0) - (a.priority ?? 0);
            });

        if (rulesForItem.length === 0) continue;

        const bestRule = rulesForItem[0];
        const effectivePriority =
            SCOPE_PRIORITY[bestRule.scopeType as ScopeType] * 1000 + (bestRule.priority ?? 0);

        if (!itemsByType.has(item.resourceTypeId)) {
            itemsByType.set(item.resourceTypeId, {
                resourceTypeName: item.resourceTypeName,
                resourceTypeSlug: item.resourceTypeSlug,
                items: [],
            });
        }

        itemsByType.get(item.resourceTypeId)!.items.push({
            item,
            matchedRule: bestRule,
            effectivePriority,
        });
    }

    const resolvedResources = Array.from(itemsByType.entries()).map(
        ([typeId, { resourceTypeName, resourceTypeSlug, items }]) => ({
            resourceTypeId: typeId,
            resourceTypeName,
            resourceTypeSlug,
            items: items
                .sort((a, b) => b.effectivePriority - a.effectivePriority)
                .map((entry) => ({
                    id: entry.item.id,
                    name: entry.item.name,
                    fieldValues: entry.item.fieldValues,
                    matchedScope: entry.matchedRule.scopeType as ScopeType,
                    matchedScopeValue: entry.matchedRule.scopeValue,
                    matchedPriority: entry.matchedRule.priority,
                })),
        })
    );

    return {
        user,
        userGroups: userGroupRows,
        resolvedResources,
    };
}

/** Alias for use in dashboard pages */
export async function resolveRulesForUser(userId: string) {
    return resolveRulesForUserInternal(userId);
}
