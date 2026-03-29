import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const education = await prisma.education.findMany({
            // @ts-ignore
            orderBy: [{ order: "asc" }, { current: "desc" }, { passingYear: "desc" }]
        });
        return NextResponse.json(education);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch education" }, { status: 500 });
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
                prisma.education.update({
                    where: { id: item.id },
                    // @ts-ignore
                    data: { order: item.order }
                })
            )
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to reorder education" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { school, degree, field, passingYear, gradeType, grade, gradeScale, current } = body;

        const isOngoing = current === "on" || current === true;

        if (!school || !degree) {
            return NextResponse.json({ error: "School and Degree are required." }, { status: 400 });
        }

        const record = await prisma.education.create({
            data: {
                school,
                degree,
                field,
                passingYear: isOngoing ? 0 : (parseInt(passingYear) || 0),
                gradeType: gradeType || null,
                grade: grade || null,
                gradeScale: gradeScale || null,
                current: isOngoing
            }
        });
        return NextResponse.json(record);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create education record" }, { status: 500 });
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
        const { school, degree, field, passingYear, gradeType, grade, gradeScale, current } = body;
        const isOngoing = current === "on" || current === true;

        const record = await prisma.education.update({
            where: { id },
            data: {
                school,
                degree,
                field: field || null,
                passingYear: isOngoing ? 0 : (parseInt(passingYear) || 0),
                gradeType: gradeType || null,
                grade: grade || null,
                gradeScale: gradeScale || null,
                current: isOngoing,
            }
        });
        return NextResponse.json(record);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update education record" }, { status: 500 });
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

        await prisma.education.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete education record" }, { status: 500 });
    }
}
