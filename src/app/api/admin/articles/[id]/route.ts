import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json();

    const article = await prisma.article.update({
      where: { id: params.id },
      data: {
        title: body.title?.trim(),
        levelLabel: body.levelLabel?.trim() ?? "",
        scriptText: body.scriptText,
        cyrillicText: body.cyrillicText?.trim(),
        isPublished: body.isPublished ?? true,
      },
    });

    return NextResponse.json(article);
  } catch (error) {
    console.error("PUT /api/admin/articles/[id] error:", error);
    return NextResponse.json(
      { message: "Нийтлэлийг засахад алдаа гарлаа." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await prisma.article.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/articles/[id] error:", error);
    return NextResponse.json(
      { message: "Нийтлэлийг устгахад алдаа гарлаа." },
      { status: 500 },
    );
  }
}
