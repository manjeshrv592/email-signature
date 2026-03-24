import { db } from "@/lib/db/client";
import { resourceTypes, resourceItems } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ResourceItemForm } from "@/components/resource-builder/ResourceItemForm";
import type { FieldDefinition } from "@/app/(dashboard)/resource-types/actions";

interface EditResourceItemPageProps {
    params: Promise<{ typeId: string; id: string }>;
}

export default async function EditResourceItemPage({
    params,
}: EditResourceItemPageProps) {
    const { typeId, id } = await params;

    // Fetch resource type
    const [resourceType] = await db
        .select()
        .from(resourceTypes)
        .where(eq(resourceTypes.id, typeId))
        .limit(1);

    if (!resourceType) notFound();

    // Fetch item
    const [item] = await db
        .select()
        .from(resourceItems)
        .where(
            and(
                eq(resourceItems.id, id),
                eq(resourceItems.resourceTypeId, typeId)
            )
        )
        .limit(1);

    if (!item) notFound();

    const fields = resourceType.fieldsSchema as FieldDefinition[];

    // Format dates for datetime-local inputs
    const formatDate = (date: Date | null) => {
        if (!date) return "";
        return new Date(date).toISOString().slice(0, 16);
    };

    return (
        <div className="max-w-3xl">
            <Link
                href={`/resources/${typeId}/${id}`}
                className="inline-flex items-center gap-1.5 text-sm text-[#555] hover:text-white transition-colors mb-6"
            >
                <ArrowLeft size={14} />
                Back to {item.name}
            </Link>

            <h1 className="text-2xl font-bold text-white mb-6">
                Edit {item.name}
            </h1>

            <ResourceItemForm
                resourceTypeId={typeId}
                resourceTypeName={resourceType.name}
                fields={fields}
                mode="edit"
                itemId={id}
                initialValues={{
                    name: item.name,
                    fieldValues: (item.fieldValues as Record<string, unknown>) || {},
                    validFrom: formatDate(item.validFrom),
                    validUntil: formatDate(item.validUntil),
                    isActive: item.isActive ?? true,
                }}
            />
        </div>
    );
}
