import { db } from "@/lib/db/client";
import { rules, resourceItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getRuleFormData } from "../../actions";
import RuleForm from "../../RuleForm";
import { Scale, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ScopeType } from "../../actions";

interface EditRulePageProps {
    params: Promise<{ id: string }>;
}

export default async function EditRulePage({ params }: EditRulePageProps) {
    const { id } = await params;

    const [rule] = await db
        .select()
        .from(rules)
        .where(eq(rules.id, id))
        .limit(1);

    if (!rule) notFound();

    const formData = await getRuleFormData();

    return (
        <div className="max-w-3xl">
            {/* Header */}
            <div className="mb-6">
                <Link
                    href={`/rules/${id}`}
                    className="inline-flex items-center gap-1.5 text-[#555] hover:text-white text-sm mb-4 transition-colors"
                >
                    <ArrowLeft size={14} />
                    Back to Rule
                </Link>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg">
                        <Scale size={20} className="text-white" />
                    </div>
                    Edit Rule
                </h1>
                <p className="text-[#8a8f98] mt-1 text-sm">
                    Update scope or priority for this rule
                </p>
            </div>

            <RuleForm
                mode="edit"
                ruleId={id}
                resourceTypes={formData.resourceTypes}
                resourceItems={formData.resourceItems}
                users={formData.users}
                groups={formData.groups}
                countries={formData.countries}
                jobTitles={formData.jobTitles}
                defaultValues={{
                    resourceItemId: rule.resourceItemId,
                    scopeType: rule.scopeType as ScopeType,
                    scopeValue: rule.scopeValue,
                    priority: rule.priority ?? 0,
                }}
            />
        </div>
    );
}
