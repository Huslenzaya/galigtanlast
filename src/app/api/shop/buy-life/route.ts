import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const MAX_LIVES = 5;

const SHOP_ITEMS = {
  one_life: {
    price: 5,
    livesToAdd: 1,
    fillLives: false,
  },
  fill_lives: {
    price: 18,
    livesToAdd: MAX_LIVES,
    fillLives: true,
  },
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const userId = String(body.userId || "").trim();
    const itemId = String(body.itemId || "").trim() as keyof typeof SHOP_ITEMS;

    if (!userId) {
      return NextResponse.json(
        { message: "userId шаардлагатай." },
        { status: 400 },
      );
    }

    const item = SHOP_ITEMS[itemId];

    if (!item) {
      return NextResponse.json(
        {
          message: "Бараа олдсонгүй.",
          debug: {
            itemId,
            availableItems: Object.keys(SHOP_ITEMS),
          },
        },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          coins: true,
          lives: true,
        },
      });

      if (!user) {
        return {
          ok: false,
          status: 404,
          message: "Хэрэглэгч олдсонгүй.",
          debug: { userId },
        };
      }

      const dbLives = Math.max(0, Math.min(MAX_LIVES, user.lives));

      if (user.coins < item.price) {
        return {
          ok: false,
          status: 400,
          message: "Зоос хүрэлцэхгүй байна.",
          debug: {
            dbCoins: user.coins,
            price: item.price,
            dbLives,
            itemId,
          },
        };
      }

      if (dbLives >= MAX_LIVES) {
        return {
          ok: false,
          status: 400,
          message: "Таны амь аль хэдийн дүүрэн байна.",
          debug: {
            dbCoins: user.coins,
            price: item.price,
            dbLives,
            itemId,
          },
        };
      }

      const nextLives = item.fillLives
        ? MAX_LIVES
        : Math.min(MAX_LIVES, dbLives + item.livesToAdd);

      const livesToAdd = Math.max(0, nextLives - dbLives);

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          coins: {
            decrement: item.price,
          },
          lives: nextLives,
        },
        select: {
          id: true,
          coins: true,
          lives: true,
        },
      });

      return {
        ok: true,
        status: 200,
        message: "Худалдан авалт амжилттай.",
        spentCoins: item.price,
        totalCoins: updatedUser.coins,
        totalLives: updatedUser.lives,
        livesToAdd,
        fillLives: item.fillLives,
        debug: {
          dbCoinsBefore: user.coins,
          dbLivesBefore: dbLives,
          nextLives,
          dbCoinsAfter: updatedUser.coins,
          dbLivesAfter: updatedUser.lives,
          itemId,
        },
      };
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          message: result.message,
          debug: result.debug,
        },
        { status: result.status },
      );
    }

    return NextResponse.json({
      message: result.message,
      spentCoins: result.spentCoins,
      totalCoins: result.totalCoins,
      totalLives: result.totalLives,
      livesToAdd: result.livesToAdd,
      fillLives: result.fillLives,
      debug: result.debug,
    });
  } catch (error) {
    console.error("POST /api/shop/buy-life error:", error);

    return NextResponse.json(
      { message: "Дэлгүүрийн худалдан авалтад алдаа гарлаа." },
      { status: 500 },
    );
  }
}
