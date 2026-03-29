import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        // @ts-ignore
        const certificates = await prisma.certificate.findMany({ orderBy: [{ order: "asc" }, { issuedAt: "desc" }] });
        return NextResponse.json(certificates);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch certificates" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { orders } = body;

        await Promise.all(
            orders.map((item: any) =>
                prisma.certificate.update({
                    where: { id: item.id },
                    // @ts-ignore
                    data: { order: item.order }
                })
            )
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to reorder certificates" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { title, issuer, issueDate, credentialId, credentialUrl, imageUrl } = body;

        const certificate = await prisma.certificate.create({
            data: {
                title,
                issuer,
                // @ts-ignore 
                issuedAt: issueDate ? new Date(issueDate) : null,
                credentialId: credentialId || null,
                credentialUrl: credentialUrl || null,
                imageUrl: imageUrl || null,
            }
        });
        return NextResponse.json(certificate);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create certificate" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

        const body = await req.json();
        const { title, issuer, issueDate, credentialId, credentialUrl, imageUrl } = body;

        const certificate = await prisma.certificate.update({
            where: { id },
            data: {
                title,
                issuer,
                // @ts-ignore
                issuedAt: issueDate ? new Date(issueDate) : null,
                credentialId: credentialId || null,
                credentialUrl: credentialUrl || null,
                imageUrl: imageUrl || null,
            }
        });
        return NextResponse.json(certificate);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update certificate" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

        await prisma.certificate.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete certificate" }, { status: 500 });
    }
}
