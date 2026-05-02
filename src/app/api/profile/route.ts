import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId")?.trim();

    if (!userId) {
      return NextResponse.json(
        { message: "userId шаардлагатай." },
        { status: 400 },
      );
    }

    const [user, totalAttempts, scoreAgg] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          xp: true,
          coins: true,
          lives: true,
          streak: true,
          level: true,
          grade: true,
          createdAt: true,
          lessonProgress: {
            select: {
              id: true,
              status: true,
            },
          },
          quizAttempts: {
            orderBy: {
              startedAt: "desc",
            },
            take: 8,
            select: {
              id: true,
              score: true,
              total: true,
              correctCount: true,
              startedAt: true,
              completedAt: true,
              quiz: {
                select: {
                  title: true,
                  isPlacement: true,
                },
              },
            },
          },
        },
      }),

      prisma.quizAttempt.count({
        where: { userId },
      }),

      prisma.quizAttempt.aggregate({
        where: { userId },
        _avg: {
          score: true,
        },
        _max: {
          score: true,
        },
      }),
    ]);

    if (!user) {
      return NextResponse.json(
        { message: "Хэрэглэгч олдсонгүй." },
        { status: 404 },
      );
    }

    const completedLessons = user.lessonProgress.filter(
      (item) => item.status === "COMPLETED",
    ).length;

    const inProgressLessons = user.lessonProgress.filter(
      (item) => item.status === "IN_PROGRESS",
    ).length;

    const notStartedLessons = user.lessonProgress.filter(
      (item) => item.status === "NOT_STARTED",
    ).length;

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        xp: user.xp,
        coins: user.coins,
        lives: user.lives,
        streak: user.streak,
        level: user.level,
        grade: user.grade,
        createdAt: user.createdAt,
      },
      summary: {
        totalAttempts,
        avgScore: Math.round(scoreAgg._avg.score ?? 0),
        bestScore: scoreAgg._max.score ?? 0,
        completedLessons,
        inProgressLessons,
        notStartedLessons,
      },
      recentAttempts: user.quizAttempts.map((attempt) => ({
        id: attempt.id,
        score: attempt.score,
        total: attempt.total,
        correctCount: attempt.correctCount,
        startedAt: attempt.startedAt,
        completedAt: attempt.completedAt,
        quizTitle: attempt.quiz.title,
        isPlacement: attempt.quiz.isPlacement,
      })),
    });
  } catch (error) {
    console.error("GET /api/profile error:", error);

    return NextResponse.json(
      { message: "Профайлын мэдээлэл авахад алдаа гарлаа." },
      { status: 500 },
    );
  }
}
