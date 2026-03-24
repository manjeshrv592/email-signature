import { db } from "@/lib/db/client";
import { users, templates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { buildSignatureForUser } from "@/lib/signature-builder";
import { getUserOverride, getOverrideFormData } from "./actions";
import {
    ArrowLeft,
    FileCode2,
    Eye,
} from "lucide-react";
import Link from "next/link";
import OverrideForm from "./OverrideForm";

interface UserSignaturePageProps {
    params: Promise<{ id: string }>;
}

export default async function UserSignaturePage({ params }: UserSignaturePageProps) {
    const { id } = await params;

    // Fetch user
    const [user] = await db
        .select({
            id: users.id,
            displayName: users.displayName,
            email: users.email,
            jobTitle: users.jobTitle,
        })
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

    if (!user) notFound();

    // Fetch override, templates items
    const [override, allItems, allTemplates] = await Promise.all([
        getUserOverride(id),
        getOverrideFormData(),
        db
            .select({ id: templates.id, name: templates.name, isDefault: templates.isDefault })
            .from(templates)
            .orderBy(templates.name),
    ]);

    // Build current signature preview
    const signatureResult = await buildSignatureForUser(id);

    const previewHtml = signatureResult
        ? `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {
                    font-family: Arial, Helvetica, sans-serif;
                    margin: 16px;
                    color: #333;
                    background: #fff;
                    font-size: 14px;
                }
                img { max-width: 100%; }
            </style>
        </head>
        <body>${signatureResult.html}</body>
        </html>`
        : null;

    const overrideItems = (override?.overrideItems as { add?: string[]; remove?: string[] }) || {
        add: [],
        remove: [],
    };

    return (
        <div className="max-w-4xl">
            {/* Header */}
            <div className="mb-6">
                <Link
                    href={`/users/${id}`}
                    className="inline-flex items-center gap-1.5 text-[#555] hover:text-white text-sm mb-4 transition-colors"
                >
                    <ArrowLeft size={14} />
                    Back to {user.displayName || "User"}
                </Link>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg">
                        <FileCode2 size={20} className="text-white" />
                    </div>
                    Signature Override
                </h1>
                <p className="text-[#8a8f98] mt-1 text-sm">
                    Customize the signature for{" "}
                    <span className="text-white font-medium">
                        {user.displayName || user.email}
                    </span>
                </p>
            </div>

            {/* Current Preview */}
            {previewHtml && (
                <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-5 mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Eye size={14} className="text-[#555]" />
                        <label className="text-xs text-[#555] uppercase tracking-wider font-medium">
                            Current Signature
                        </label>
                    </div>
                    <div className="bg-white rounded-xl overflow-hidden">
                        <iframe
                            srcDoc={previewHtml}
                            title="Current Signature"
                            className="w-full border-0 rounded-xl"
                            style={{ minHeight: "200px" }}
                            sandbox="allow-same-origin"
                        />
                    </div>
                </div>
            )}

            {/* Override Form */}
            <OverrideForm
                userId={id}
                currentTemplateId={override?.customTemplateId || null}
                currentOverrideItems={overrideItems}
                templates={allTemplates}
                resourceItems={allItems}
                hasOverride={!!override}
            />
        </div>
    );
}
