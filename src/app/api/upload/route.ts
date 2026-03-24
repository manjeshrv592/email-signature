import { NextRequest, NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/r2";
import { randomUUID } from "crypto";

// Max file size: 2MB
const MAX_SIZE = 2 * 1024 * 1024;

const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
];

export async function POST(request: NextRequest) {
    try {

        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided." }, { status: 400 });
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG." },
                { status: 400 }
            );
        }

        if (file.size > MAX_SIZE) {
            return NextResponse.json(
                { error: "File too large. Maximum size is 2MB." },
                { status: 400 }
            );
        }

        // Generate unique key: uploads/<uuid>.<ext>
        const ext = file.name.split(".").pop() || "bin";
        const key = `uploads/${randomUUID()}.${ext}`;

        const buffer = Buffer.from(await file.arrayBuffer());
        const publicUrl = await uploadToR2(buffer, key, file.type);

        return NextResponse.json({ url: publicUrl, key });
    } catch {
        return NextResponse.json(
            { error: "Upload failed. Please try again." },
            { status: 500 }
        );
    }
}
