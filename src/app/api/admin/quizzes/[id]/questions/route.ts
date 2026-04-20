import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json();

    const questionType =
      body.questionType === "typing_mongol" ? "typing_mongol" : "mc";

    if (!body.question?.trim()) {
      return NextResponse.json(
        { message: "question заавал байна." },
        { status: 400 },
      );
    }

    if (questionType === "typing_mongol") {
      const displayText = body.displayText?.trim();
      const answer = body.answer?.trim();
      const hint = body.hint?.trim() ?? "";

      if (!displayText || !answer) {
        return NextResponse.json(
          { message: "Харагдах үг болон зөв хариулт шаардлагатай." },
          { status: 400 },
        );
      }

      const question = await prisma.quizQuestion.create({
        data: {
          quizId: params.id,
          question: body.question.trim(),
          optionsJson: JSON.stringify([displayText, answer, hint]),
          correctIndex: 0,
          category: "typing_mongol",
          difficulty: body.difficulty ? Number(body.difficulty) : null,
        },
      });

      return NextResponse.json(question, { status: 201 });
    }

    if (!Array.isArray(body.options) || body.options.length < 2) {
      return NextResponse.json(
        { message: "question болон options зөв байх ёстой." },
        { status: 400 },
      );
    }

    const question = await prisma.quizQuestion.create({
      data: {
        quizId: params.id,
        question: body.question.trim(),
        optionsJson: JSON.stringify(body.options),
        correctIndex: Number(body.correctIndex ?? 0),
        category: body.category?.trim() ?? "",
        difficulty: body.difficulty ? Number(body.difficulty) : null,
      },
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/quizzes/[id]/questions error:", error);
    return NextResponse.json(
      { message: "Асуулт нэмэхэд алдаа гарлаа." },
      { status: 500 },
    );
  }
}
