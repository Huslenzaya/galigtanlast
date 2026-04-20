import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const MAX_LIVES = 5;

function clampLives(value: number) {
  if (!Number.isFinite(value)) return MAX_LIVES;
  return Math.max(0, Math.min(MAX_LIVES, Math.round(value)));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const userId = String(body.userId || "").trim();
    const action = String(body.action || "").trim();

    if (!userId) {
      return NextResponse.json(
        { message: "userId шаардлагатай." },
        { status: 400 },
      );
    }

    if (!["lose", "set", "fill"].includes(action)) {
      return NextResponse.json(
        { message: "Үйлдэл буруу байна." },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          lives: true,
        },
      });

      if (!user) {
        return {
          ok: false,
          status: 404,
          message: "Хэрэглэгч олдсонгүй.",
        };
      }

      let nextLives = user.lives;

      if (action === "lose") {
        nextLives = Math.max(0, user.lives - 1);
      }

      if (action === "fill") {
        nextLives = MAX_LIVES;
      }

      if (action === "set") {
        nextLives = clampLives(Number(body.lives));
      }

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          lives: nextLives,
        },
        select: {
          id: true,
          lives: true,
        },
      });

      return {
        ok: true,
        status: 200,
        message: "Амь шинэчлэгдлээ.",
        lives: updatedUser.lives,
      };
    });

    if (!result.ok) {
      return NextResponse.json(
        { message: result.message },
        { status: result.status },
      );
    }

    return NextResponse.json({
      message: result.message,
      lives: result.lives,
    });
  } catch (error) {
    console.error("POST /api/user-lives error:", error);

    return NextResponse.json(
      { message: "Амь хадгалахад алдаа гарлаа." },
      { status: 500 },
    );
  }
}
