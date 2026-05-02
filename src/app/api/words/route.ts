import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const words = await prisma.dictionaryWord.findMany({
      where: {
        isPublished: true,
      },
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        scriptWord: true,
        romanization: true,
        cyrillicWord: true,
        category: true,
        description: true,
        grade: true,
        level: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(words);
  } catch (error) {
    console.error("GET /api/words error:", error);
    return NextResponse.json(
      { message: "Үгсийг авахад алдаа гарлаа." },
      { status: 500 },
    );
  }
}
