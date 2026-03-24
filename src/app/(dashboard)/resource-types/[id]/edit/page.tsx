import { db } from "@/lib/db/client";
import { resourceTypes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Blocks } from "lucide-react";
import { ResourceTypeForm } from "@/components/resource-builder/ResourceTypeForm";
import type { FieldDefinition } from "../../actions";

interface EditResourceTypePageProps {
    params: Promise<{ id: string }>;
}

export default async function EditResourceTypePage({
    params,
}: EditResourceTypePageProps) {
    const { id } = await params;

    const [type] = await db
        .select()
        .from(resourceTypes)
        .where(eq(resourceTypes.id, id))
        .limit(1);

    if (!type) notFound();

    return (
        <div className="max-w-5xl">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg">
                        <Blocks size={20} className="text-white" />
                    </div>
                    Edit: {type.name}
                </h1>
                <p className="text-[#8a8f98] mt-1 text-sm">
                    Modify the resource type schema and fields.
                </p>
            </div>

            <ResourceTypeForm
                mode="edit"
                id={id}
                initialData={{
                    name: type.name,
                    slug: type.slug,
                    icon: type.icon || "",
                    fields: (type.fieldsSchema as FieldDefinition[]) || [],
                }}
            />
        </div>
    );
}
