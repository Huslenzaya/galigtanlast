import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const COIN_MILESTONES = [
  { milestone: 100, coins: 10 },
  { milestone: 300, coins: 15 },
  { milestone: 500, coins: 20 },
  { milestone: 1000, coins: 40 },
  { milestone: 2000, coins: 80 },
  { milestone: 4000, coins: 150 },
];

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const userId = String(body.userId || "").trim();
    const xp = Number(body.xp);

    if (!userId) {
      return NextResponse.json(
        { message: "userId шаардлагатай." },
        { status: 400 },
      );
    }

    if (!Number.isFinite(xp) || xp <= 0) {
      return NextResponse.json(
        { message: "XP оноо буруу байна." },
        { status: 400 },
      );
    }

    const safeXp = Math.max(1, Math.round(xp));

    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          xp: {
            increment: safeXp,
          },
        },
        select: {
          id: true,
          xp: true,
          coins: true,
        },
      });

      const reachedMilestones = COIN_MILESTONES.filter(
        (item) => updatedUser.xp >= item.milestone,
      );

      if (reachedMilestones.length === 0) {
        return {
          user: updatedUser,
          earnedCoins: 0,
          rewardedMilestones: [] as number[],
        };
      }

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

      const existingSet = new Set(
        existingRewards.map((item) => item.milestone),
      );

      const newRewards = reachedMilestones.filter(
        (item) => !existingSet.has(item.milestone),
      );

      if (newRewards.length === 0) {
        return {
          user: updatedUser,
          earnedCoins: 0,
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

      const userWithCoins = await tx.user.update({
        where: { id: userId },
        data: {
          coins: {
            increment: earnedCoins,
          },
        },
        select: {
          id: true,
          xp: true,
          coins: true,
        },
      });

      return {
        user: userWithCoins,
        earnedCoins,
        rewardedMilestones: newRewards.map((item) => item.milestone),
      };
    });

    return NextResponse.json({
      message:
        result.earnedCoins > 0
          ? "Тоглоомын XP хадгалагдаж, milestone зоос нэмэгдлээ."
          : "Тоглоомын XP хадгалагдлаа.",
      earnedXp: safeXp,
      totalXp: result.user.xp,
      earnedCoins: result.earnedCoins,
      totalCoins: result.user.coins,
      rewardedMilestones: result.rewardedMilestones,
    });
  } catch (error) {
    console.error("POST /api/game-attempts error:", error);

    return NextResponse.json(
      { message: "Тоглоомын XP хадгалахад алдаа гарлаа." },
      { status: 500 },
    );
  }
}
