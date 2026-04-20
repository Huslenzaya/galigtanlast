import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json();

    const lesson = await prisma.lesson.update({
      where: { id: params.id },
      data: {
        title: body.title?.trim(),
        slug: body.slug?.trim(),
        description: body.description?.trim() ?? "",
        grade: Number(body.grade),
        level: Number(body.level),
        sortOrder: Number(body.sortOrder ?? 1),
        content: body.content ?? "",
        status: body.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      },
    });

    return NextResponse.json(lesson);
  } catch (error) {
    console.error("PUT /api/admin/lessons/[id] error:", error);
    return NextResponse.json(
      { message: "Хичээлийг засахад алдаа гарлаа." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await prisma.lesson.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/lessons/[id] error:", error);
    return NextResponse.json(
      { message: "Хичээлийг устгахад алдаа гарлаа." },
      { status: 500 },
    );
  }
}
