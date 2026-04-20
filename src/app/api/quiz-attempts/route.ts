import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const userId = body.userId?.trim();
    const quizId = body.quizId?.trim();
    const score = Number(body.score);
    const total = Number(body.total);
    const correctCount = Number(body.correctCount);

    if (!userId || !quizId) {
      return NextResponse.json(
        { message: "userId болон quizId шаардлагатай." },
        { status: 400 },
      );
    }

    if (
      Number.isNaN(score) ||
      Number.isNaN(total) ||
      Number.isNaN(correctCount)
    ) {
      return NextResponse.json(
        { message: "Онооны мэдээлэл буруу байна." },
        { status: 400 },
      );
    }

    const [user, quiz] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, xp: true },
      }),
      prisma.quiz.findUnique({
        where: { id: quizId },
        select: { id: true },
      }),
    ]);

    if (!user) {
      return NextResponse.json(
        { message: "Хэрэглэгч олдсонгүй." },
        { status: 404 },
      );
    }

    if (!quiz) {
      return NextResponse.json({ message: "Quiz олдсонгүй." }, { status: 404 });
    }

    // XP тооцоолол:
    // зөв хариулт бүр 10 XP
    const earnedXp = correctCount * 10;

    const result = await prisma.$transaction(async (tx) => {
      const attempt = await tx.quizAttempt.create({
        data: {
          userId,
          quizId,
          score,
          total,
          correctCount,
          completedAt: new Date(),
        },
      });

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          xp: {
            increment: earnedXp,
          },
        },
        select: {
          id: true,
          xp: true,
        },
      });

      return {
        attempt,
        updatedUser,
      };
    });

    return NextResponse.json({
      id: result.attempt.id,
      message: "Quiz attempt хадгалагдлаа.",
      earnedXp,
      totalXp: result.updatedUser.xp,
    });
  } catch (error) {
    console.error("POST /api/quiz-attempts error:", error);
    return NextResponse.json(
      { message: "Quiz attempt хадгалахад алдаа гарлаа." },
      { status: 500 },
    );
  }
}
