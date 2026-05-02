import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const lessons = await prisma.lesson.findMany({
      orderBy: [{ level: "asc" }, { sortOrder: "asc" }],
    });

    return NextResponse.json(lessons);
  } catch (error) {
    console.error("GET /api/admin/lessons error:", error);
    return NextResponse.json(
      { message: "Хичээлүүдийг авахад алдаа гарлаа." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const body = await req.json();

    if (!body.title || !body.slug || !body.level) {
      return NextResponse.json(
        { message: "title, slug, level заавал байна." },
        { status: 400 },
      );
    }

    const lesson = await prisma.lesson.create({
      data: {
        title: body.title.trim(),
        slug: body.slug.trim(),
        description: body.description?.trim() ?? "",
        grade: Number(body.grade ?? 6),
        level: Number(body.level),
        sortOrder: Number(body.sortOrder ?? 1),
        content: body.content ?? "",
        status: body.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      },
    });

    return NextResponse.json(lesson, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/lessons error:", error);
    return NextResponse.json(
      { message: "Хичээл нэмэхэд алдаа гарлаа." },
      { status: 500 },
    );
  }
}
