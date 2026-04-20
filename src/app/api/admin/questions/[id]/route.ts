import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(
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

      const question = await prisma.quizQuestion.update({
        where: { id: params.id },
        data: {
          question: body.question.trim(),
          optionsJson: JSON.stringify([displayText, answer, hint]),
          correctIndex: 0,
          category: "typing_mongol",
          difficulty: body.difficulty ? Number(body.difficulty) : null,
        },
      });

      return NextResponse.json(question);
    }

    if (!Array.isArray(body.options) || body.options.length < 2) {
      return NextResponse.json(
        { message: "question болон options зөв байх ёстой." },
        { status: 400 },
      );
    }

    const question = await prisma.quizQuestion.update({
      where: { id: params.id },
      data: {
        question: body.question.trim(),
        optionsJson: JSON.stringify(body.options),
        correctIndex: Number(body.correctIndex ?? 0),
        category: body.category?.trim() ?? "",
        difficulty: body.difficulty ? Number(body.difficulty) : null,
      },
    });

    return NextResponse.json(question);
  } catch (error) {
    console.error("PUT /api/admin/questions/[id] error:", error);
    return NextResponse.json(
      { message: "Асуултыг засахад алдаа гарлаа." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await prisma.quizQuestion.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/questions/[id] error:", error);
    return NextResponse.json(
      { message: "Асуултыг устгахад алдаа гарлаа." },
      { status: 500 },
    );
  }
}
