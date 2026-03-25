import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
    try {
        const references = await prisma.reference.findMany({
            // @ts-ignore
            orderBy: [{ order: "asc" }, { createdAt: "asc" }]
        });
        return NextResponse.json(references);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch references" }, { status: 500 });
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
                prisma.reference.update({
                    where: { id: item.id },
                    // @ts-ignore
                    data: { order: item.order }
                })
            )
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to reorder references" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, designation, company, email, phone } = body;

        const reference = await prisma.reference.create({
            data: {
                name,
                designation,
                company: company || null,
                email: email || null,
                phone: phone || null,
            }
        });
        return NextResponse.json(reference);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create reference" }, { status: 500 });
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
        const { name, designation, company, email, phone } = body;

        const reference = await prisma.reference.update({
            where: { id },
            data: {
                name,
                designation,
                company: company || null,
                email: email || null,
                phone: phone || null,
            }
        });
        return NextResponse.json(reference);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update reference" }, { status: 500 });
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

        await prisma.reference.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete reference" }, { status: 500 });
    }
}
