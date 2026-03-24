"use server";

import { db } from "@/lib/db/client";
import { resourceTypes, resourceItems } from "@/lib/db/schema";
import { eq, and, count, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ─── Types ──────────────────────────────────────────

export interface FieldValidation {
    maxLength?: number;
    maxSize?: number;
    min?: number;
    max?: number;
    options?: string[];
}

export interface FieldDefinition {
    name: string;
    label: string;
    type: "text" | "textarea" | "richtext" | "image" | "url" | "date" | "select" | "toggle" | "number" | "color";
    required: boolean;
    validation?: FieldValidation;
}

// ─── Helpers ────────────────────────────────────────

function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function validateFields(fields: FieldDefinition[]): string | null {
    if (!fields || fields.length === 0) {
        return "At least one field is required.";
    }

    const names = new Set<string>();
    for (const field of fields) {
        if (!field.name || !field.label || !field.type) {
            return `All fields must have a name, label, and type.`;
        }
        if (names.has(field.name)) {
            return `Duplicate field name: "${field.name}".`;
        }
        names.add(field.name);
    }

    return null;
}

// ─── Create ─────────────────────────────────────────

export async function createResourceType(data: {
    name: string;
    slug: string;
    icon: string;
    fields: FieldDefinition[];
}): Promise<{ error?: string }> {
    if (!data.name.trim()) return { error: "Name is required." };

    const slug = slugify(data.slug || data.name);
    if (!slug) return { error: "Could not generate a valid slug." };

    const fieldError = validateFields(data.fields);
    if (fieldError) return { error: fieldError };

    // Check slug uniqueness
    const existing = await db
        .select({ id: resourceTypes.id })
        .from(resourceTypes)
        .where(eq(resourceTypes.slug, slug))
        .limit(1);

    if (existing.length > 0) {
        return { error: `A resource type with slug "${slug}" already exists.` };
    }

    await db.insert(resourceTypes).values({
        name: data.name.trim(),
        slug,
        icon: data.icon || null,
        fieldsSchema: data.fields,
        sortOrder: 0,
    });

    revalidatePath("/resource-types");
    redirect("/resource-types");
}

// ─── Update ─────────────────────────────────────────

export async function updateResourceType(
    id: string,
    data: {
        name: string;
        slug: string;
        icon: string;
        fields: FieldDefinition[];
    }
): Promise<{ error?: string }> {
    if (!data.name.trim()) return { error: "Name is required." };

    const slug = slugify(data.slug || data.name);
    if (!slug) return { error: "Could not generate a valid slug." };

    const fieldError = validateFields(data.fields);
    if (fieldError) return { error: fieldError };

    // Verify exists
    const existing = await db
        .select({ id: resourceTypes.id })
        .from(resourceTypes)
        .where(eq(resourceTypes.id, id))
        .limit(1);

    if (existing.length === 0) {
        return { error: "Resource type not found." };
    }

    // Check slug uniqueness (excluding self)
    const slugConflict = await db
        .select({ id: resourceTypes.id })
        .from(resourceTypes)
        .where(
            and(
                eq(resourceTypes.slug, slug),
                ne(resourceTypes.id, id)
            )
        )
        .limit(1);

    if (slugConflict.length > 0) {
        return { error: `A resource type with slug "${slug}" already exists.` };
    }

    await db
        .update(resourceTypes)
        .set({
            name: data.name.trim(),
            slug,
            icon: data.icon || null,
            fieldsSchema: data.fields,
        })
        .where(eq(resourceTypes.id, id));

    revalidatePath("/resource-types");
    revalidatePath(`/resource-types/${id}`);
    redirect(`/resource-types/${id}`);
}

// ─── Delete ─────────────────────────────────────────

export async function deleteResourceType(id: string): Promise<{ error?: string }> {
    const existing = await db
        .select({ id: resourceTypes.id })
        .from(resourceTypes)
        .where(eq(resourceTypes.id, id))
        .limit(1);

    if (existing.length === 0) {
        return { error: "Resource type not found." };
    }

    const [{ itemCount }] = await db
        .select({ itemCount: count() })
        .from(resourceItems)
        .where(eq(resourceItems.resourceTypeId, id));

    if (itemCount > 0) {
        return {
            error: `Cannot delete: ${itemCount} resource item${itemCount !== 1 ? "s" : ""} use this type. Delete them first.`,
        };
    }

    await db
        .delete(resourceTypes)
        .where(eq(resourceTypes.id, id));

    revalidatePath("/resource-types");
    redirect("/resource-types");
}
