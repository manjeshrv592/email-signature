"use server";

import { db } from "@/lib/db/client";
import { resourceItems, resourceTypes, rules } from "@/lib/db/schema";
import { eq, and, count, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FieldDefinition } from "../resource-types/actions";

// ─── Validation ─────────────────────────────────────

function validateFieldValues(
    fieldValues: Record<string, unknown>,
    schema: FieldDefinition[]
): string | null {
    for (const field of schema) {
        const value = fieldValues[field.name];

        if (field.required) {
            if (value === undefined || value === null || value === "") {
                return `"${field.label}" is required.`;
            }
        }

        if (value === undefined || value === null || value === "") continue;

        switch (field.type) {
            case "text":
            case "textarea":
            case "richtext": {
                if (typeof value !== "string") return `"${field.label}" must be text.`;
                if (field.validation?.maxLength && value.length > field.validation.maxLength) {
                    return `"${field.label}" exceeds max length of ${field.validation.maxLength}.`;
                }
                break;
            }
            case "url":
            case "image": {
                if (typeof value !== "string") return `"${field.label}" must be a URL.`;
                try {
                    new URL(value);
                } catch {
                    return `"${field.label}" must be a valid URL.`;
                }
                break;
            }
            case "number": {
                const num = Number(value);
                if (isNaN(num)) return `"${field.label}" must be a number.`;
                if (field.validation?.min !== undefined && num < field.validation.min) {
                    return `"${field.label}" must be at least ${field.validation.min}.`;
                }
                if (field.validation?.max !== undefined && num > field.validation.max) {
                    return `"${field.label}" must be at most ${field.validation.max}.`;
                }
                break;
            }
            case "select": {
                if (
                    field.validation?.options &&
                    !field.validation.options.includes(value as string)
                ) {
                    return `"${field.label}" has an invalid selection.`;
                }
                break;
            }
            case "toggle": {
                if (typeof value !== "boolean") return `"${field.label}" must be true or false.`;
                break;
            }
            case "date": {
                if (typeof value !== "string" || isNaN(Date.parse(value))) {
                    return `"${field.label}" must be a valid date.`;
                }
                break;
            }
            case "color": {
                if (typeof value !== "string" || !/^#[0-9a-fA-F]{6}$/.test(value)) {
                    return `"${field.label}" must be a valid hex color (e.g. #FF5500).`;
                }
                break;
            }
        }
    }

    return null;
}

// ─── Create ─────────────────────────────────────────

export async function createResourceItem(data: {
    resourceTypeId: string;
    name: string;
    fieldValues: Record<string, unknown>;
    validFrom?: string | null;
    validUntil?: string | null;
}): Promise<{ error?: string }> {
    if (!data.name.trim()) return { error: "Item name is required." };

    const [resourceType] = await db
        .select()
        .from(resourceTypes)
        .where(eq(resourceTypes.id, data.resourceTypeId))
        .limit(1);

    if (!resourceType) return { error: "Resource type not found." };

    const schema = resourceType.fieldsSchema as FieldDefinition[];
    const validationError = validateFieldValues(data.fieldValues, schema);
    if (validationError) return { error: validationError };

    await db.insert(resourceItems).values({
        resourceTypeId: data.resourceTypeId,
        name: data.name.trim(),
        fieldValues: data.fieldValues,
        isActive: true,
        validFrom: data.validFrom ? new Date(data.validFrom) : null,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        sortOrder: 0,
    });

    revalidatePath("/resources");
    redirect(`/resources?type=${data.resourceTypeId}`);
}

// ─── Update ─────────────────────────────────────────

export async function updateResourceItem(
    id: string,
    data: {
        name: string;
        fieldValues: Record<string, unknown>;
        validFrom?: string | null;
        validUntil?: string | null;
        isActive?: boolean;
    }
): Promise<{ error?: string }> {
    if (!data.name.trim()) return { error: "Item name is required." };

    const [item] = await db
        .select({
            id: resourceItems.id,
            resourceTypeId: resourceItems.resourceTypeId,
        })
        .from(resourceItems)
        .where(eq(resourceItems.id, id))
        .limit(1);

    if (!item) return { error: "Resource item not found." };

    const [resourceType] = await db
        .select({ fieldsSchema: resourceTypes.fieldsSchema })
        .from(resourceTypes)
        .where(eq(resourceTypes.id, item.resourceTypeId))
        .limit(1);

    if (!resourceType) return { error: "Resource type not found." };

    const schema = resourceType.fieldsSchema as FieldDefinition[];
    const validationError = validateFieldValues(data.fieldValues, schema);
    if (validationError) return { error: validationError };

    await db
        .update(resourceItems)
        .set({
            name: data.name.trim(),
            fieldValues: data.fieldValues,
            validFrom: data.validFrom ? new Date(data.validFrom) : null,
            validUntil: data.validUntil ? new Date(data.validUntil) : null,
            isActive: data.isActive ?? true,
        })
        .where(eq(resourceItems.id, id));

    revalidatePath("/resources");
    revalidatePath(`/resources/${item.resourceTypeId}/${id}`);
    redirect(`/resources/${item.resourceTypeId}/${id}`);
}

// ─── Delete ─────────────────────────────────────────

export async function deleteResourceItem(
    id: string,
    resourceTypeId: string
): Promise<{ error?: string }> {
    const [item] = await db
        .select({ id: resourceItems.id })
        .from(resourceItems)
        .where(eq(resourceItems.id, id))
        .limit(1);

    if (!item) return { error: "Resource item not found." };

    await db.delete(rules).where(eq(rules.resourceItemId, id));

    await db
        .delete(resourceItems)
        .where(eq(resourceItems.id, id));

    revalidatePath("/resources");
    redirect(`/resources?type=${resourceTypeId}`);
}

// ─── Toggle Active ──────────────────────────────────

export async function toggleResourceItemActive(
    id: string
): Promise<{ error?: string }> {
    const [item] = await db
        .select({ id: resourceItems.id, isActive: resourceItems.isActive })
        .from(resourceItems)
        .where(eq(resourceItems.id, id))
        .limit(1);

    if (!item) return { error: "Resource item not found." };

    await db
        .update(resourceItems)
        .set({ isActive: !item.isActive })
        .where(eq(resourceItems.id, id));

    revalidatePath("/resources");
    return {};
}

// ─── Queries ────────────────────────────────────────

export async function getResourceItems(
    resourceTypeId: string,
    page: number = 1,
    pageSize: number = 10
) {
    const offset = (page - 1) * pageSize;

    const [{ total }] = await db
        .select({ total: count() })
        .from(resourceItems)
        .where(eq(resourceItems.resourceTypeId, resourceTypeId));

    const items = await db
        .select()
        .from(resourceItems)
        .where(eq(resourceItems.resourceTypeId, resourceTypeId))
        .orderBy(desc(resourceItems.createdAt))
        .limit(pageSize)
        .offset(offset);

    return { items, total };
}
