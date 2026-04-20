import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const body = await req.json();

    const title = body.title?.trim();
    const isPlacement = Boolean(body.isPlacement);
    const rawLessonId = body.lessonId?.trim();
    const lessonId = isPlacement ? null : rawLessonId || null;

    if (!title) {
      return NextResponse.json(
        { message: "title заавал байна." },
        { status: 400 },
      );
    }

    if (lessonId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        select: { id: true },
      });

      if (!lesson) {
        return NextResponse.json(
          { message: "Сонгосон хичээл олдсонгүй." },
          { status: 404 },
        );
      }

      const existingQuiz = await prisma.quiz.findFirst({
        where: {
          lessonId,
          NOT: {
            id: params.id,
          },
        },
        select: { id: true, title: true },
      });

      if (existingQuiz) {
        return NextResponse.json(
          { message: "Энэ хичээлд өөр тест аль хэдийн холбогдсон байна." },
          { status: 409 },
        );
      }
    }

    const quiz = await prisma.quiz.update({
      where: { id: params.id },
      data: {
        title,
        lessonId,
        isPlacement,
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        questions: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("PUT /api/admin/quizzes/[id] error:", error);
    return NextResponse.json(
      { message: "Тестийг засахад алдаа гарлаа." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    await prisma.quiz.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/quizzes/[id] error:", error);
    return NextResponse.json(
      { message: "Тестийг устгахад алдаа гарлаа." },
      { status: 500 },
    );
  }
}
