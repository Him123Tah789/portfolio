import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const experience = await prisma.experience.findMany({
            // @ts-ignore
            orderBy: [{ order: "asc" }, { startDate: "desc" }]
        });
        return NextResponse.json(experience);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch experience" }, { status: 500 });
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
                prisma.experience.update({
                    where: { id: item.id },
                    // @ts-ignore
                    data: { order: item.order }
                })
            )
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to reorder experience" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { company, position, description, startDate, endDate, current } = body;

        const record = await prisma.experience.create({
            data: {
                company,
                position,
                description,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                current: Boolean(current)
            }
        });
        return NextResponse.json(record);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create experience record" }, { status: 500 });
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
        const { company, position, description, startDate, endDate, current } = body;

        const record = await prisma.experience.update({
            where: { id },
            data: {
                company,
                position,
                description: description || null,
                startDate: new Date(startDate),
                endDate: current ? null : (endDate ? new Date(endDate) : null),
                current: Boolean(current),
            }
        });
        return NextResponse.json(record);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update experience record" }, { status: 500 });
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

        await prisma.experience.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete experience record" }, { status: 500 });
    }
}
