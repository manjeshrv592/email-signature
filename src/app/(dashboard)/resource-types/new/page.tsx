import { ResourceTypeForm } from "@/components/resource-builder/ResourceTypeForm";
import { Blocks } from "lucide-react";

export default function NewResourceTypePage() {
    return (
        <div className="max-w-5xl">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg">
                        <Blocks size={20} className="text-white" />
                    </div>
                    New Resource Type
                </h1>
                <p className="text-[#8a8f98] mt-1 text-sm">
                    Define a new resource schema with custom fields.
                </p>
            </div>

            <ResourceTypeForm mode="create" />
        </div>
    );
}
