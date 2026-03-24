"use server";

import { db } from "@/lib/db/client";
import { signatureSettings, templates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ─── Types ──────────────────────────────────────────

export interface SignatureSettingsData {
    addToNew: boolean;
    addToReplies: boolean;
    addToForwards: boolean;
    addToCalendar: boolean;
    replyTemplateId: string | null;
}

// ─── Get Settings ───────────────────────────────────

export async function getSignatureSettings(): Promise<{
    settings: SignatureSettingsData;
    templates: Array<{ id: string; name: string; isDefault: boolean | null }>;
}> {
    const [existing] = await db
        .select()
        .from(signatureSettings)
        .limit(1);

    const templatesList = await db
        .select({
            id: templates.id,
            name: templates.name,
            isDefault: templates.isDefault,
        })
        .from(templates)
        .orderBy(templates.name);

    const settings: SignatureSettingsData = existing
        ? {
            addToNew: existing.addToNew ?? true,
            addToReplies: existing.addToReplies ?? false,
            addToForwards: existing.addToForwards ?? true,
            addToCalendar: existing.addToCalendar ?? false,
            replyTemplateId: existing.replyTemplateId,
        }
        : {
            addToNew: true,
            addToReplies: false,
            addToForwards: true,
            addToCalendar: false,
            replyTemplateId: null,
        };

    return { settings, templates: templatesList };
}

// ─── Save Settings ──────────────────────────────────

export async function saveSignatureSettings(
    data: SignatureSettingsData
): Promise<{ error?: string }> {
    // Check if settings exist
    const [existing] = await db
        .select({ id: signatureSettings.id })
        .from(signatureSettings)
        .limit(1);

    if (existing) {
        await db
            .update(signatureSettings)
            .set({
                addToNew: data.addToNew,
                addToReplies: data.addToReplies,
                addToForwards: data.addToForwards,
                addToCalendar: data.addToCalendar,
                replyTemplateId: data.replyTemplateId || null,
            })
            .where(eq(signatureSettings.id, existing.id));
    } else {
        await db.insert(signatureSettings).values({
            addToNew: data.addToNew,
            addToReplies: data.addToReplies,
            addToForwards: data.addToForwards,
            addToCalendar: data.addToCalendar,
            replyTemplateId: data.replyTemplateId || null,
        });
    }

    revalidatePath("/settings");
    return {};
}
