import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const words = await prisma.dictionaryWord.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(words);
  } catch (error) {
    console.error("GET /api/admin/words error:", error);
    return NextResponse.json(
      { message: "Үгсийг авахад алдаа гарлаа." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const body = await req.json();

    if (!body.scriptWord || !body.cyrillicWord) {
      return NextResponse.json(
        { message: "scriptWord, cyrillicWord заавал байна." },
        { status: 400 },
      );
    }

    const word = await prisma.dictionaryWord.create({
      data: {
        scriptWord: body.scriptWord.trim(),
        romanization: body.romanization?.trim() ?? "",
        cyrillicWord: body.cyrillicWord.trim(),
        category: body.category?.trim() ?? "",
        description: body.description?.trim() ?? "",
        grade:
          body.grade !== undefined && body.grade !== null && body.grade !== ""
            ? Number(body.grade)
            : null,
        level:
          body.level !== undefined && body.level !== null && body.level !== ""
            ? Number(body.level)
            : null,
        isPublished: body.isPublished ?? true,
      },
    });

    return NextResponse.json(word, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/words error:", error);
    return NextResponse.json(
      { message: "Үг нэмэхэд алдаа гарлаа." },
      { status: 500 },
    );
  }
}
