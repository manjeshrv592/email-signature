import { getRuleFormData } from "../actions";
import RuleForm from "../RuleForm";
import { Scale, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewRulePage() {
    const formData = await getRuleFormData();

    return (
        <div className="max-w-3xl">
            {/* Header */}
            <div className="mb-6">
                <Link
                    href="/rules"
                    className="inline-flex items-center gap-1.5 text-[#555] hover:text-white text-sm mb-4 transition-colors"
                >
                    <ArrowLeft size={14} />
                    Back to Rules
                </Link>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg">
                        <Scale size={20} className="text-white" />
                    </div>
                    New Rule
                </h1>
                <p className="text-[#8a8f98] mt-1 text-sm">
                    Assign a resource item to users by scope
                </p>
            </div>

            <RuleForm
                mode="create"
                resourceTypes={formData.resourceTypes}
                resourceItems={formData.resourceItems}
                users={formData.users}
                groups={formData.groups}
                countries={formData.countries}
                jobTitles={formData.jobTitles}
            />
        </div>
    );
}
