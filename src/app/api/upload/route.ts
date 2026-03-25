import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { writeFile } from "fs/promises";
import { join } from "path";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.json();
        const { image, fileName } = formData;

        if (!image) {
            return NextResponse.json({ error: "No image data provided" }, { status: 400 });
        }

        // Clean base64 string
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        const name = fileName || `avatar_${Date.now()}.png`;
        const path = join(process.cwd(), "public", "uploads", name);

        await writeFile(path, buffer);

        const url = `/uploads/${name}`;
        return NextResponse.json({ url });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
