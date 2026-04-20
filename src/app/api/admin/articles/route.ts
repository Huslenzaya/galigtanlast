import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const articles = await prisma.article.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(articles);
  } catch (error) {
    console.error("GET /api/admin/articles error:", error);
    return NextResponse.json(
      { message: "Нийтлэлүүдийг авахад алдаа гарлаа." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const body = await req.json();

    if (!body.title || !body.scriptText || !body.cyrillicText) {
      return NextResponse.json(
        { message: "title, scriptText, cyrillicText заавал байна." },
        { status: 400 },
      );
    }

    const article = await prisma.article.create({
      data: {
        title: body.title.trim(),
        levelLabel: body.levelLabel?.trim() ?? "",
        scriptText: body.scriptText,
        cyrillicText: body.cyrillicText.trim(),
        isPublished: body.isPublished ?? true,
      },
    });

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/articles error:", error);
    return NextResponse.json(
      { message: "Нийтлэл нэмэхэд алдаа гарлаа." },
      { status: 500 },
    );
  }
}
