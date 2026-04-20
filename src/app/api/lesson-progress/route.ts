import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId")?.trim();

    if (!userId) {
      return NextResponse.json(
        { message: "userId шаардлагатай." },
        { status: 400 },
      );
    }

    const progress = await prisma.userLessonProgress.findMany({
      where: { userId },
      select: {
        lessonId: true,
        status: true,
        completedAt: true,
      },
    });

    return NextResponse.json(progress);
  } catch (error) {
    console.error("GET /api/lesson-progress error:", error);
    return NextResponse.json(
      { message: "Lesson progress авахад алдаа гарлаа." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action?.trim();

    if (action === "start") {
      const userId = body.userId?.trim();
      const lessonId = body.lessonId?.trim();

      if (!userId || !lessonId) {
        return NextResponse.json(
          { message: "userId болон lessonId шаардлагатай." },
          { status: 400 },
        );
      }

      const [user, lesson, existing] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { id: true },
        }),
        prisma.lesson.findUnique({
          where: { id: lessonId },
          select: { id: true },
        }),
        prisma.userLessonProgress.findUnique({
          where: {
            userId_lessonId: {
              userId,
              lessonId,
            },
          },
          select: {
            id: true,
            status: true,
            completedAt: true,
          },
        }),
      ]);

      if (!user) {
        return NextResponse.json(
          { message: "Хэрэглэгч олдсонгүй." },
          { status: 404 },
        );
      }

      if (!lesson) {
        return NextResponse.json(
          { message: "Хичээл олдсонгүй." },
          { status: 404 },
        );
      }

      if (existing?.status === "COMPLETED") {
        return NextResponse.json({
          message: "Хичээл өмнө нь дууссан байна.",
          status: existing.status,
        });
      }

      const progress = await prisma.userLessonProgress.upsert({
        where: {
          userId_lessonId: {
            userId,
            lessonId,
          },
        },
        update: {
          status: "IN_PROGRESS",
        },
        create: {
          userId,
          lessonId,
          status: "IN_PROGRESS",
        },
        select: {
          lessonId: true,
          status: true,
          completedAt: true,
        },
      });

      return NextResponse.json({
        message: "Lesson progress эхэллээ.",
        progress,
      });
    }

    if (action === "completeByQuiz") {
      const userId = body.userId?.trim();
      const quizId = body.quizId?.trim();
      const score = Number(body.score);

      if (!userId || !quizId || Number.isNaN(score)) {
        return NextResponse.json(
          { message: "userId, quizId, score шаардлагатай." },
          { status: 400 },
        );
      }

      const [user, quiz] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { id: true },
        }),
        prisma.quiz.findUnique({
          where: { id: quizId },
          select: {
            id: true,
            lessonId: true,
          },
        }),
      ]);

      if (!user) {
        return NextResponse.json(
          { message: "Хэрэглэгч олдсонгүй." },
          { status: 404 },
        );
      }

      if (!quiz) {
        return NextResponse.json(
          { message: "Quiz олдсонгүй." },
          { status: 404 },
        );
      }

      if (!quiz.lessonId) {
        return NextResponse.json({
          message: "Энэ quiz lesson-тэй холбогдоогүй байна.",
          skipped: true,
        });
      }

      const existing = await prisma.userLessonProgress.findUnique({
        where: {
          userId_lessonId: {
            userId,
            lessonId: quiz.lessonId,
          },
        },
        select: {
          status: true,
          completedAt: true,
        },
      });

      const passed = score >= 60;
      const nextStatus =
        existing?.status === "COMPLETED" || passed
          ? "COMPLETED"
          : "IN_PROGRESS";

      const completedAt =
        nextStatus === "COMPLETED"
          ? (existing?.completedAt ?? new Date())
          : null;

      const progress = await prisma.userLessonProgress.upsert({
        where: {
          userId_lessonId: {
            userId,
            lessonId: quiz.lessonId,
          },
        },
        update: {
          status: nextStatus,
          completedAt,
        },
        create: {
          userId,
          lessonId: quiz.lessonId,
          status: nextStatus,
          completedAt,
        },
        select: {
          lessonId: true,
          status: true,
          completedAt: true,
        },
      });

      return NextResponse.json({
        message: "Lesson progress шинэчлэгдлээ.",
        progress,
      });
    }

    return NextResponse.json(
      { message: "Танигдаагүй action байна." },
      { status: 400 },
    );
  } catch (error) {
    console.error("POST /api/lesson-progress error:", error);
    return NextResponse.json(
      { message: "Lesson progress хадгалахад алдаа гарлаа." },
      { status: 500 },
    );
  }
}
