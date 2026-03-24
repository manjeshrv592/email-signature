"use server";

import { db } from "@/lib/db/client";
import { users, groups, userGroups } from "@/lib/db/schema";
import {
    getGraphAccessToken,
    fetchGraphUsers,
    fetchGraphGroups,
    fetchGraphGroupMembers,
    fetchGraphUserPhoto,
} from "@/lib/graph";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ─── Sync Users (Upsert via onConflictDoUpdate) ─────────────

export async function syncUsers(): Promise<{ success: boolean; count: number; error?: string }> {
    try {
        const accessToken = await getGraphAccessToken();
        const graphUsers = await fetchGraphUsers(accessToken);

        if (graphUsers.length === 0) {
            return { success: true, count: 0 };
        }

        for (const graphUser of graphUsers) {
            const email = graphUser.mail || graphUser.userPrincipalName;
            const phone = graphUser.businessPhones?.[0] || null;

            const photoUrl = await fetchGraphUserPhoto(accessToken, graphUser.id);

            await db
                .insert(users)
                .values({
                    azureUserId: graphUser.id,
                    email,
                    displayName: graphUser.displayName,
                    jobTitle: graphUser.jobTitle,
                    department: graphUser.department,
                    country: graphUser.country,
                    city: graphUser.city,
                    phone,
                    photoUrl,
                    syncedAt: new Date(),
                })
                .onConflictDoUpdate({
                    target: [users.azureUserId],
                    set: {
                        email,
                        displayName: graphUser.displayName,
                        jobTitle: graphUser.jobTitle,
                        department: graphUser.department,
                        country: graphUser.country,
                        city: graphUser.city,
                        phone,
                        photoUrl,
                        syncedAt: new Date(),
                    },
                });
        }

        revalidatePath("/users");
        revalidatePath("/");
        return { success: true, count: graphUsers.length };
    } catch (error) {
        console.error("Error syncing users:", error);
        return {
            success: false,
            count: 0,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

// ─── Sync Groups (Upsert + Pre-built User Map + Batch Memberships) ──

export async function syncGroups(): Promise<{ success: boolean; groupCount: number; membershipCount: number; error?: string }> {
    try {
        const accessToken = await getGraphAccessToken();
        const graphGroups = await fetchGraphGroups(accessToken);

        if (graphGroups.length === 0) {
            return { success: true, groupCount: 0, membershipCount: 0 };
        }

        // Pre-build lookup map: azureUserId → DB user ID
        const allUsers = await db
            .select({ id: users.id, azureUserId: users.azureUserId })
            .from(users);

        const userLookup = new Map<string, string>();
        for (const u of allUsers) {
            userLookup.set(u.azureUserId, u.id);
        }

        let groupCount = 0;
        let membershipCount = 0;

        for (const graphGroup of graphGroups) {
            const result = await db
                .insert(groups)
                .values({
                    azureGroupId: graphGroup.id,
                    name: graphGroup.displayName,
                    syncedAt: new Date(),
                })
                .onConflictDoUpdate({
                    target: [groups.azureGroupId],
                    set: {
                        name: graphGroup.displayName,
                        syncedAt: new Date(),
                    },
                })
                .returning({ id: groups.id });

            const groupId = result[0].id;
            groupCount++;

            const members = await fetchGraphGroupMembers(accessToken, graphGroup.id);

            await db.delete(userGroups).where(eq(userGroups.groupId, groupId));

            const membershipValues: { userId: string; groupId: string }[] = [];
            for (const member of members) {
                const dbUserId = userLookup.get(member.id);
                if (dbUserId) {
                    membershipValues.push({ userId: dbUserId, groupId });
                }
            }

            if (membershipValues.length > 0) {
                await db.insert(userGroups).values(membershipValues);
                membershipCount += membershipValues.length;
            }
        }

        revalidatePath("/groups");
        revalidatePath("/users");
        revalidatePath("/");
        return { success: true, groupCount, membershipCount };
    } catch (error) {
        console.error("Error syncing groups:", error);
        return {
            success: false,
            groupCount: 0,
            membershipCount: 0,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
