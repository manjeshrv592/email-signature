import { db } from "@/lib/db/client";
import { resourceTypes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ResourceItemForm } from "@/components/resource-builder/ResourceItemForm";
import type { FieldDefinition } from "@/app/(dashboard)/resource-types/actions";

interface NewResourceItemPageProps {
    params: Promise<{ typeId: string }>;
}

export default async function NewResourceItemPage({ params }: NewResourceItemPageProps) {
    const { typeId } = await params;

    const [resourceType] = await db
        .select()
        .from(resourceTypes)
        .where(eq(resourceTypes.id, typeId))
        .limit(1);

    if (!resourceType) notFound();

    const fields = resourceType.fieldsSchema as FieldDefinition[];

    return (
        <div className="max-w-3xl">
            <Link
                href={`/resources?type=${typeId}`}
                className="inline-flex items-center gap-1.5 text-sm text-[#555] hover:text-white transition-colors mb-6"
            >
                <ArrowLeft size={14} />
                Back to {resourceType.name} Items
            </Link>

            <h1 className="text-2xl font-bold text-white mb-6">
                New {resourceType.name} Item
            </h1>

            <ResourceItemForm
                resourceTypeId={typeId}
                resourceTypeName={resourceType.name}
                fields={fields}
                mode="create"
            />
        </div>
    );
}
