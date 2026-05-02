import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const lessons = await prisma.lesson.findMany({
      where: {
        status: "PUBLISHED",
      },
      orderBy: [{ level: "asc" }, { sortOrder: "asc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        grade: true,
        level: true,
        sortOrder: true,
        content: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(lessons);
  } catch (error) {
    console.error("GET /api/lessons error:", error);
    return NextResponse.json(
      { message: "Хичээлүүдийг авахад алдаа гарлаа." },
      { status: 500 },
    );
  }
}
