import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { mkdir, writeFile } from "fs/promises";
import { extname, join } from "path";

function sanitizeFileName(input: string) {
    return input
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .replace(/_+/g, "_")
        .slice(0, 120);
}

function extensionFromMime(mime: string) {
    const map: Record<string, string> = {
        "image/png": ".png",
        "image/jpeg": ".jpg",
        "image/webp": ".webp",
        "image/gif": ".gif",
        "application/pdf": ".pdf",
        "application/msword": ".doc",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
        "text/plain": ".txt",
        "application/zip": ".zip",
        "application/x-zip-compressed": ".zip",
    };
    return map[mime] || ".bin";
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const uploadDir = join(process.cwd(), "public", "uploads");
        await mkdir(uploadDir, { recursive: true });

        const contentType = req.headers.get("content-type") || "";

        if (contentType.includes("multipart/form-data")) {
            const formData = await req.formData();
            const file = formData.get("file") as File | null;
            const customNameRaw = String(formData.get("fileName") || "").trim();

            if (!file) {
                return NextResponse.json({ error: "No file provided" }, { status: 400 });
            }

            const maxBytes = 20 * 1024 * 1024;
            if (file.size > maxBytes) {
                return NextResponse.json({ error: "File too large (max 20MB)" }, { status: 400 });
            }

            const originalExt = extname(file.name || "");
            const ext = originalExt || extensionFromMime(file.type || "");
            const baseName = customNameRaw ? sanitizeFileName(customNameRaw) : sanitizeFileName((file.name || "upload").replace(/\.[^/.]+$/, ""));
            const fileName = `${Date.now()}_${baseName}${ext}`;

            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const path = join(uploadDir, fileName);
            await writeFile(path, buffer);

            return NextResponse.json({
                url: `/uploads/${fileName}`,
                fileName,
                originalName: file.name,
                size: file.size,
                type: file.type,
            });
        }

        const body = await req.json();
        const { image, fileName } = body;

        if (!image || typeof image !== "string") {
            return NextResponse.json({ error: "No image data provided" }, { status: 400 });
        }

        const mimeMatch = image.match(/^data:([^;]+);base64,/);
        const mime = mimeMatch?.[1] || "image/png";
        const base64Data = image.replace(/^data:[^;]+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        const rawName = fileName ? sanitizeFileName(String(fileName)) : `avatar_${Date.now()}`;
        const ext = extname(rawName) || extensionFromMime(mime);
        const normalizedName = extname(rawName) ? rawName : `${rawName}${ext}`;

        const path = join(uploadDir, normalizedName);
        await writeFile(path, buffer);

        return NextResponse.json({ url: `/uploads/${normalizedName}`, fileName: normalizedName });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
