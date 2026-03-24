"use server";

import { db } from "@/lib/db/client";
import { templates, resourceTypes, signatureSettings } from "@/lib/db/schema";
import { eq, and, count, desc, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FieldDefinition } from "../resource-types/actions";

// ─── Create ─────────────────────────────────────────

export async function createTemplate(data: {
    name: string;
    htmlTemplate: string;
    isDefault: boolean;
}): Promise<{ error?: string }> {
    if (!data.name.trim()) return { error: "Template name is required." };
    if (!data.htmlTemplate.trim()) return { error: "HTML template content is required." };

    // If marking as default, unset any current default
    if (data.isDefault) {
        await db
            .update(templates)
            .set({ isDefault: false })
            .where(eq(templates.isDefault, true));
    }

    const [created] = await db
        .insert(templates)
        .values({
            name: data.name.trim(),
            htmlTemplate: data.htmlTemplate,
            isDefault: data.isDefault,
        })
        .returning({ id: templates.id });

    revalidatePath("/templates");
    redirect(`/templates/${created.id}`);
}

// ─── Update ─────────────────────────────────────────

export async function updateTemplate(
    id: string,
    data: {
        name: string;
        htmlTemplate: string;
        isDefault: boolean;
    }
): Promise<{ error?: string }> {
    if (!data.name.trim()) return { error: "Template name is required." };
    if (!data.htmlTemplate.trim()) return { error: "HTML template content is required." };

    const [existing] = await db
        .select({ id: templates.id })
        .from(templates)
        .where(eq(templates.id, id))
        .limit(1);

    if (!existing) return { error: "Template not found." };

    if (data.isDefault) {
        await db
            .update(templates)
            .set({ isDefault: false })
            .where(
                and(
                    eq(templates.isDefault, true),
                    ne(templates.id, id)
                )
            );
    }

    await db
        .update(templates)
        .set({
            name: data.name.trim(),
            htmlTemplate: data.htmlTemplate,
            isDefault: data.isDefault,
        })
        .where(eq(templates.id, id));

    revalidatePath("/templates");
    revalidatePath(`/templates/${id}`);
    redirect(`/templates/${id}`);
}

// ─── Delete ─────────────────────────────────────────

export async function deleteTemplate(id: string): Promise<{ error?: string }> {
    const [existing] = await db
        .select({ id: templates.id, isDefault: templates.isDefault })
        .from(templates)
        .where(eq(templates.id, id))
        .limit(1);

    if (!existing) return { error: "Template not found." };

    if (existing.isDefault) {
        return { error: "Cannot delete the default template. Set another template as default first." };
    }

    const [settings] = await db
        .select({ replyTemplateId: signatureSettings.replyTemplateId })
        .from(signatureSettings)
        .limit(1);

    if (settings?.replyTemplateId === id) {
        return { error: "Cannot delete: this template is set as the reply template in settings." };
    }

    await db
        .delete(templates)
        .where(eq(templates.id, id));

    revalidatePath("/templates");
    redirect("/templates");
}

// ─── Set Default ────────────────────────────────────

export async function setDefaultTemplate(id: string): Promise<{ error?: string }> {
    const [existing] = await db
        .select({ id: templates.id })
        .from(templates)
        .where(eq(templates.id, id))
        .limit(1);

    if (!existing) return { error: "Template not found." };

    await db
        .update(templates)
        .set({ isDefault: false })
        .where(eq(templates.isDefault, true));

    await db
        .update(templates)
        .set({ isDefault: true })
        .where(eq(templates.id, id));

    revalidatePath("/templates");
    revalidatePath(`/templates/${id}`);
    return {};
}

// ─── Queries ────────────────────────────────────────

export async function getTemplates(page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;

    const [{ total }] = await db
        .select({ total: count() })
        .from(templates);

    const templatesList = await db
        .select()
        .from(templates)
        .orderBy(desc(templates.createdAt))
        .limit(pageSize)
        .offset(offset);

    return { templates: templatesList, total };
}

export async function getTemplate(id: string) {
    const [template] = await db
        .select()
        .from(templates)
        .where(eq(templates.id, id))
        .limit(1);

    return template || null;
}

// ─── Available Placeholders ─────────────────────────

export interface PlaceholderGroup {
    category: string;
    slug?: string;
    placeholders: Array<{
        label: string;
        value: string;
    }>;
}

export async function getAvailablePlaceholders(): Promise<PlaceholderGroup[]> {
    const userPlaceholders: PlaceholderGroup = {
        category: "User Fields",
        placeholders: [
            { label: "Display Name", value: "{{user.displayName}}" },
            { label: "Email", value: "{{user.email}}" },
            { label: "Job Title", value: "{{user.jobTitle}}" },
            { label: "Department", value: "{{user.department}}" },
            { label: "Country", value: "{{user.country}}" },
            { label: "City", value: "{{user.city}}" },
            { label: "Phone", value: "{{user.phone}}" },
            { label: "Photo URL", value: "{{user.photoUrl}}" },
        ],
    };

    const types = await db
        .select({
            id: resourceTypes.id,
            name: resourceTypes.name,
            slug: resourceTypes.slug,
            fieldsSchema: resourceTypes.fieldsSchema,
        })
        .from(resourceTypes)
        .orderBy(resourceTypes.name);

    const resourceGroups: PlaceholderGroup[] = types.map((type) => {
        const fields = type.fieldsSchema as FieldDefinition[];
        const placeholders: PlaceholderGroup["placeholders"] = [];

        placeholders.push({
            label: `Loop: {{#each ${type.slug}}}`,
            value: `{{#each ${type.slug}}}`,
        });

        for (const field of fields) {
            placeholders.push({
                label: `  ${field.label} (in loop)`,
                value: `{{this.${field.name}}}`,
            });
        }

        placeholders.push({
            label: `End Loop: {{/each}}`,
            value: `{{/each}}`,
        });

        placeholders.push({
            label: `If has items: {{#if ${type.slug}}}`,
            value: `{{#if ${type.slug}}}`,
        });
        placeholders.push({
            label: `End If: {{/if}}`,
            value: `{{/if}}`,
        });

        for (const field of fields) {
            placeholders.push({
                label: `${field.label} (first item)`,
                value: `{{${type.slug}.${field.name}}}`,
            });
        }

        return {
            category: type.name,
            slug: type.slug,
            placeholders,
        };
    });

    return [userPlaceholders, ...resourceGroups];
}
