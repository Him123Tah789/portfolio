import { NextResponse } from "next/server";
import { get } from "@vercel/blob";

export const runtime = "nodejs";

function getBlobToken() {
    return (process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN || "").trim();
}

function extractPathname(urlValue: string) {
    try {
        const parsed = new URL(urlValue);
        if (!parsed.hostname.includes(".blob.vercel-storage.com")) {
            return null;
        }
        return parsed.pathname.replace(/^\//, "");
    } catch {
        return null;
    }
}

export async function GET(req: Request) {
    try {
        const token = getBlobToken();
        if (!token) {
            return NextResponse.json({ error: "Missing BLOB_READ_WRITE_TOKEN" }, { status: 500 });
        }

        const requestUrl = new URL(req.url);
        const rawUrl = requestUrl.searchParams.get("url") || "";
        const shouldDownload = requestUrl.searchParams.get("download") === "1";

        if (!rawUrl) {
            return NextResponse.json({ error: "Missing url query parameter" }, { status: 400 });
        }

        const pathname = extractPathname(rawUrl);
        if (!pathname) {
            return NextResponse.json({ error: "Invalid Blob URL" }, { status: 400 });
        }

        if (!pathname.startsWith("uploads/")) {
            return NextResponse.json({ error: "Forbidden path" }, { status: 403 });
        }

        const blobResult = await get(pathname, {
            access: "private",
            token,
            useCache: true,
        });

        if (!blobResult || blobResult.statusCode === 304 || !blobResult.stream) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        const contentType = blobResult.blob.contentType || "application/octet-stream";
        const fallbackName = pathname.split("/").pop() || "file";
        const dispositionType = shouldDownload ? "attachment" : "inline";

        return new Response(blobResult.stream, {
            headers: {
                "Content-Type": contentType,
                "Content-Disposition": `${dispositionType}; filename="${fallbackName}"`,
                "Cache-Control": shouldDownload ? "private, no-cache" : "public, max-age=300",
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Blob proxy failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
