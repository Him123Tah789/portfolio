import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
    try {
        const activities = await prisma.activity.findMany({
            // @ts-ignore
            orderBy: [{ order: "asc" }, { startDate: "desc" }]
        });
        return NextResponse.json(activities);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
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
                prisma.activity.update({
                    where: { id: item.id },
                    // @ts-ignore
                    data: { order: item.order }
                })
            )
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to reorder activities" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { title, role, description, startDate, endDate, current } = body;

        const activity = await prisma.activity.create({
            data: {
                title,
                role: role || null,
                description: description || null,
                startDate: startDate ? new Date(startDate) : null,
                endDate: current ? null : (endDate ? new Date(endDate) : null),
                current: Boolean(current),
            }
        });
        return NextResponse.json(activity);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create activity" }, { status: 500 });
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
        const { title, role, description, startDate, endDate, current } = body;

        const activity = await prisma.activity.update({
            where: { id },
            data: {
                title,
                role: role || null,
                description: description || null,
                startDate: startDate ? new Date(startDate) : null,
                endDate: current ? null : (endDate ? new Date(endDate) : null),
                current: Boolean(current),
            }
        });
        return NextResponse.json(activity);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update activity" }, { status: 500 });
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

        await prisma.activity.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete activity" }, { status: 500 });
    }
}
