import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const COIN_MILESTONES = [
  { milestone: 100, coins: 10 },
  { milestone: 300, coins: 15 },
  { milestone: 500, coins: 20 },
  { milestone: 1000, coins: 40 },
  { milestone: 2000, coins: 80 },
  { milestone: 4000, coins: 150 },
];

function getEarnedXp(score: number) {
  if (score >= 78) return 10;
  if (score >= 55) return 5;
  return 0;
}

function getLabel(score: number) {
  if (score >= 78) return "Сайн";
  if (score >= 55) return "Дундаж";
  return "Дахин оролд";
}

async function grantCoinMilestoneRewards(userId: string, totalXp: number) {
  const reachedMilestones = COIN_MILESTONES.filter(
    (item) => totalXp >= item.milestone,
  );

  if (reachedMilestones.length === 0) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        coins: true,
      },
    });

    return {
      earnedCoins: 0,
      totalCoins: user?.coins ?? 0,
      rewardedMilestones: [] as number[],
    };
  }

  return prisma.$transaction(async (tx) => {
    const existingRewards = await tx.userCoinReward.findMany({
      where: {
        userId,
        milestone: {
          in: reachedMilestones.map((item) => item.milestone),
        },
      },
      select: {
        milestone: true,
      },
    });

    const existingSet = new Set(existingRewards.map((item) => item.milestone));

    const newRewards = reachedMilestones.filter(
      (item) => !existingSet.has(item.milestone),
    );

    if (newRewards.length === 0) {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          coins: true,
        },
      });

      return {
        earnedCoins: 0,
        totalCoins: user?.coins ?? 0,
        rewardedMilestones: [] as number[],
      };
    }

    await tx.userCoinReward.createMany({
      data: newRewards.map((item) => ({
        userId,
        milestone: item.milestone,
        coins: item.coins,
      })),
      skipDuplicates: true,
    });

    const earnedCoins = newRewards.reduce((sum, item) => sum + item.coins, 0);

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        coins: {
          increment: earnedCoins,
        },
      },
      select: {
        coins: true,
      },
    });

    return {
      earnedCoins,
      totalCoins: updatedUser.coins,
      rewardedMilestones: newRewards.map((item) => item.milestone),
    };
  });
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId")?.trim();

    if (!userId) {
      return NextResponse.json(
        { message: "userId шаардлагатай." },
        { status: 400 },
      );
    }

    const attempts = await prisma.writingAttempt.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        letter: true,
        score: true,
        label: true,
        earnedXp: true,
        completed: true,
        attempts: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      completedLetters: attempts
        .filter((item) => item.completed)
        .map((item) => item.letter),
      attempts,
    });
  } catch (error) {
    console.error("GET /api/writing-attempts error:", error);

    return NextResponse.json(
      { message: "Бичих дасгалын мэдээлэл авахад алдаа гарлаа." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const userId = String(body.userId || "").trim();
    const letter = String(body.letter || "").trim();
    const score = Number(body.score);

    if (!userId || !letter) {
      return NextResponse.json(
        { message: "userId болон үсэг шаардлагатай." },
        { status: 400 },
      );
    }

    if (!Number.isFinite(score)) {
      return NextResponse.json(
        { message: "Оноо буруу байна." },
        { status: 400 },
      );
    }

    const safeScore = Math.max(0, Math.min(100, Math.round(score)));
    const label = getLabel(safeScore);
    const completed = safeScore >= 55;
    const possibleXp = getEarnedXp(safeScore);

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.writingAttempt.findUnique({
        where: {
          userId_letter: {
            userId,
            letter,
          },
        },
      });

      if (!existing) {
        const earnedXp = completed ? possibleXp : 0;

        const attempt = await tx.writingAttempt.create({
          data: {
            userId,
            letter,
            score: safeScore,
            label,
            completed,
            earnedXp,
          },
        });

        const user =
          earnedXp > 0
            ? await tx.user.update({
                where: { id: userId },
                data: {
                  xp: {
                    increment: earnedXp,
                  },
                },
                select: {
                  id: true,
                  xp: true,
                  coins: true,
                },
              })
            : await tx.user.findUnique({
                where: { id: userId },
                select: {
                  id: true,
                  xp: true,
                  coins: true,
                },
              });

        return {
          attempt,
          earnedXp,
          totalXp: user?.xp ?? 0,
          totalCoins: user?.coins ?? 0,
          alreadyCompleted: false,
        };
      }

      const nextBestScore = Math.max(existing.score, safeScore);
      const wasCompleted = existing.completed;
      const nowCompleted = existing.completed || completed;

      const shouldGiveXp = !wasCompleted && completed && existing.earnedXp <= 0;

      const earnedXp = shouldGiveXp ? possibleXp : 0;

      const attempt = await tx.writingAttempt.update({
        where: {
          userId_letter: {
            userId,
            letter,
          },
        },
        data: {
          score: nextBestScore,
          label: getLabel(nextBestScore),
          completed: nowCompleted,
          attempts: {
            increment: 1,
          },
          earnedXp: {
            increment: earnedXp,
          },
        },
      });

      const user =
        earnedXp > 0
          ? await tx.user.update({
              where: { id: userId },
              data: {
                xp: {
                  increment: earnedXp,
                },
              },
              select: {
                id: true,
                xp: true,
                coins: true,
              },
            })
          : await tx.user.findUnique({
              where: { id: userId },
              select: {
                id: true,
                xp: true,
                coins: true,
              },
            });

      return {
        attempt,
        earnedXp,
        totalXp: user?.xp ?? 0,
        totalCoins: user?.coins ?? 0,
        alreadyCompleted: wasCompleted,
      };
    });

    const coinReward =
      result.earnedXp > 0
        ? await grantCoinMilestoneRewards(userId, result.totalXp)
        : {
            earnedCoins: 0,
            totalCoins: result.totalCoins,
            rewardedMilestones: [] as number[],
          };

    return NextResponse.json({
      message:
        result.earnedXp > 0 && coinReward.earnedCoins > 0
          ? "Бичих дасгал хадгалагдаж XP болон зоос нэмэгдлээ."
          : result.earnedXp > 0
            ? "Бичих дасгал хадгалагдаж XP нэмэгдлээ."
            : "Бичих дасгал хадгалагдлаа.",
      letter: result.attempt.letter,
      score: result.attempt.score,
      label: result.attempt.label,
      completed: result.attempt.completed,
      earnedXp: result.earnedXp,
      totalXp: result.totalXp,
      earnedCoins: coinReward.earnedCoins,
      totalCoins: coinReward.totalCoins,
      rewardedMilestones: coinReward.rewardedMilestones,
      alreadyCompleted: result.alreadyCompleted,
    });
  } catch (error) {
    console.error("POST /api/writing-attempts error:", error);

    return NextResponse.json(
      { message: "Бичих дасгал хадгалахад алдаа гарлаа." },
      { status: 500 },
    );
  }
}
