import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { users, signatureSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { buildSignatureByEmail } from "@/lib/signature-builder";

// ─── CORS Headers ───────────────────────────────────

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept",
    "Access-Control-Max-Age": "86400",
};

// ─── OPTIONS (CORS Preflight) ───────────────────────

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: corsHeaders,
    });
}

// ─── Token Validation ───────────────────────────────

function validateToken(request: NextRequest): boolean {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) return false;

    const token = authHeader.replace(/^Bearer\s+/i, "");
    const expectedToken = process.env.PIXORA_ADDIN_TOKEN;

    if (!expectedToken) {
        console.warn("PIXORA_ADDIN_TOKEN not set — token auth disabled");
        return false;
    }

    return token === expectedToken;
}

// ─── Compose Type Mapping ───────────────────────────

type ComposeType = "newMail" | "reply" | "replyAll" | "forward" | "calendar";

function shouldApplySignature(
    composeType: ComposeType | null,
    settings: {
        addToNew: boolean | null;
        addToReplies: boolean | null;
        addToForwards: boolean | null;
        addToCalendar: boolean | null;
    }
): boolean {
    if (!composeType) return true;

    switch (composeType) {
        case "newMail":
            return settings.addToNew !== false;
        case "reply":
        case "replyAll":
            return settings.addToReplies === true;
        case "forward":
            return settings.addToForwards !== false;
        case "calendar":
            return settings.addToCalendar === true;
        default:
            return true;
    }
}

// ─── GET Handler ────────────────────────────────────

export async function GET(request: NextRequest) {
    const email = request.nextUrl.searchParams.get("email");
    const composeType = request.nextUrl.searchParams.get("composeType") as ComposeType | null;
    const format = request.nextUrl.searchParams.get("format");
    const wantsJson =
        format === "json" ||
        request.headers.get("accept")?.includes("application/json");

    // Token auth
    const hasAuthHeader = !!request.headers.get("authorization");
    if (hasAuthHeader && !validateToken(request)) {
        return NextResponse.json(
            { error: "Invalid or expired token" },
            { status: 401, headers: corsHeaders }
        );
    }

    if (!email) {
        return NextResponse.json(
            { error: "Missing required parameter: email" },
            { status: 400, headers: corsHeaders }
        );
    }

    try {
        // Find user by email (single-tenant: no tenantId needed)
        const [user] = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404, headers: corsHeaders }
            );
        }

        // Check compose type against signature settings
        if (composeType) {
            const [settings] = await db
                .select({
                    addToNew: signatureSettings.addToNew,
                    addToReplies: signatureSettings.addToReplies,
                    addToForwards: signatureSettings.addToForwards,
                    addToCalendar: signatureSettings.addToCalendar,
                })
                .from(signatureSettings)
                .limit(1);

            const effectiveSettings = settings || {
                addToNew: true,
                addToReplies: false,
                addToForwards: true,
                addToCalendar: false,
            };

            if (!shouldApplySignature(composeType, effectiveSettings)) {
                if (wantsJson) {
                    return NextResponse.json(
                        {
                            html: null,
                            templateName: null,
                            composeType,
                            applied: false,
                            reason: `Signature disabled for compose type: ${composeType}`,
                        },
                        { status: 200, headers: corsHeaders }
                    );
                }
                return new NextResponse("", {
                    status: 200,
                    headers: {
                        "Content-Type": "text/html; charset=utf-8",
                        ...corsHeaders,
                    },
                });
            }
        }

        const result = await buildSignatureByEmail(email);

        if (!result) {
            if (wantsJson) {
                return NextResponse.json(
                    {
                        html: null,
                        templateName: null,
                        composeType,
                        applied: false,
                        reason: "No default template found",
                    },
                    { status: 200, headers: corsHeaders }
                );
            }
            return NextResponse.json(
                { error: "Could not build signature. No default template found." },
                { status: 404, headers: corsHeaders }
            );
        }

        if (wantsJson) {
            return NextResponse.json(
                {
                    html: result.html,
                    templateName: result.templateName,
                    composeType: composeType || "newMail",
                    applied: true,
                },
                {
                    status: 200,
                    headers: {
                        "Cache-Control": "public, max-age=300, s-maxage=300",
                        ...corsHeaders,
                    },
                }
            );
        }

        return new NextResponse(result.html, {
            status: 200,
            headers: {
                "Content-Type": "text/html; charset=utf-8",
                "Cache-Control": "public, max-age=300, s-maxage=300",
                ...corsHeaders,
            },
        });
    } catch (error) {
        console.error("Signature API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500, headers: corsHeaders }
        );
    }
}
