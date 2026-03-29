import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const publications = await (prisma as any).publication.findMany({
            orderBy: [{ order: "asc" }, { createdAt: "desc" }]
        });
        return NextResponse.json(publications);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch publications" }, { status: 500 });
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
                (prisma as any).publication.update({
                    where: { id: item.id },
                    data: { order: item.order }
                })
            )
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to reorder publications" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { title, publisher, date, url, description, submitted } = body;

        const isSubmitted = submitted === "on" || submitted === true;

        const publication = await (prisma as any).publication.create({
            data: {
                title,
                publisher: isSubmitted ? null : (publisher || null),
                date: (isSubmitted || !date) ? null : new Date(date),
                url: isSubmitted ? null : (url || null),
                description: description || null,
                submitted: isSubmitted
            }
        });
        return NextResponse.json(publication);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
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
        const { title, publisher, date, url, description, submitted } = body;

        const isSubmitted = submitted === "on" || submitted === true;

        const publication = await (prisma as any).publication.update({
            where: { id },
            data: {
                title,
                publisher: isSubmitted ? null : (publisher || null),
                date: (isSubmitted || !date) ? null : new Date(date),
                url: isSubmitted ? null : (url || null),
                description: description || null,
                submitted: isSubmitted
            }
        });
        return NextResponse.json(publication);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update publication" }, { status: 500 });
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

        await (prisma as any).publication.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete publication" }, { status: 500 });
    }
}
