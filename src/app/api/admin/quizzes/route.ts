import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { NextResponse } from "next/server";

function parseOptions(optionsJson: string): string[] {
  try {
    const parsed = JSON.parse(optionsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const quizzes = await prisma.quiz.findMany({
      orderBy: { createdAt: "desc" },
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

    const normalized = quizzes.map((quiz) => ({
      id: quiz.id,
      title: quiz.title,
      isPlacement: quiz.isPlacement,
      lesson: quiz.lesson,
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        question: q.question,
        options: parseOptions(q.optionsJson),
        correctIndex: q.correctIndex,
        category: q.category,
        difficulty: q.difficulty,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
      })),
    }));

    return NextResponse.json(normalized);
  } catch (error) {
    console.error("GET /api/admin/quizzes error:", error);
    return NextResponse.json(
      { message: "Тестүүдийг авахад алдаа гарлаа." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
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
        where: { lessonId },
        select: { id: true },
      });

      if (existingQuiz) {
        return NextResponse.json(
          { message: "Энэ хичээлд аль хэдийн тест холбогдсон байна." },
          { status: 409 },
        );
      }
    }

    const quiz = await prisma.quiz.create({
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

    return NextResponse.json(
      {
        id: quiz.id,
        title: quiz.title,
        isPlacement: quiz.isPlacement,
        lesson: quiz.lesson,
        createdAt: quiz.createdAt,
        updatedAt: quiz.updatedAt,
        questions: quiz.questions.map((q) => ({
          id: q.id,
          question: q.question,
          options: parseOptions(q.optionsJson),
          correctIndex: q.correctIndex,
          category: q.category,
          difficulty: q.difficulty,
          createdAt: q.createdAt,
          updatedAt: q.updatedAt,
        })),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/admin/quizzes error:", error);
    return NextResponse.json(
      { message: "Тест нэмэхэд алдаа гарлаа." },
      { status: 500 },
    );
  }
}
