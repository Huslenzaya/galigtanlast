import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

function parseOptions(optionsJson: string): string[] {
  try {
    const parsed = JSON.parse(optionsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatQuizResponse(quiz: {
  id: string;
  title: string;
  lessonId?: string | null;
  lesson?: { id: string; slug: string } | null;
  questions: {
    id: string;
    question: string;
    optionsJson: string;
    correctIndex: number;
    category: string | null;
    difficulty: number | null;
  }[];
}) {
  return {
    quizId: quiz.id,
    title: quiz.title,
    lessonId: quiz.lesson?.id ?? quiz.lessonId ?? null,
    lessonSlug: quiz.lesson?.slug ?? null,
    questions: quiz.questions
      .map((q) => {
        const opts = parseOptions(q.optionsJson);
        if (!opts.length) return null;

        if (q.category === "typing_mongol") {
          return {
            id: q.id,
            type: "type",
            q: q.question,
            cyrillic: opts[0] ?? "",
            answer: opts[1] ?? "",
            hint: opts[2] ?? "",
            category: q.category,
            difficulty: q.difficulty,
          };
        }

        return {
          id: q.id,
          type: "mc",
          q: q.question,
          opts,
          c: q.correctIndex,
          category: q.category,
          difficulty: q.difficulty,
        };
      })
      .filter(Boolean),
  };
}

export async function GET(req: NextRequest) {
  const topic = req.nextUrl.searchParams.get("topic")?.trim();
  const lessonSlug = req.nextUrl.searchParams.get("lessonSlug")?.trim();

  try {
    if (topic === "placement") {
      const placementQuiz = await prisma.quiz.findFirst({
        where: {
          isPlacement: true,
        },
        include: {
          questions: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

      if (!placementQuiz) {
        return NextResponse.json({ questions: [] });
      }

      return NextResponse.json(
        formatQuizResponse({
          ...placementQuiz,
          lesson: null,
        }),
      );
    }

    if (lessonSlug) {
      const lesson = await prisma.lesson.findFirst({
        where: {
          slug: lessonSlug,
          status: "PUBLISHED",
        },
        include: {
          quiz: {
            include: {
              lesson: {
                select: {
                  id: true,
                  slug: true,
                },
              },
              questions: {
                orderBy: {
                  createdAt: "asc",
                },
              },
            },
          },
        },
      });

      if (!lesson?.quiz) {
        return NextResponse.json({
          lessonSlug,
          questions: [],
        });
      }

      return NextResponse.json(formatQuizResponse(lesson.quiz));
    }

    if (topic) {
      const lesson = await prisma.lesson.findFirst({
        where: {
          slug: topic,
          status: "PUBLISHED",
        },
        include: {
          quiz: {
            include: {
              lesson: {
                select: {
                  id: true,
                  slug: true,
                },
              },
              questions: {
                orderBy: {
                  createdAt: "asc",
                },
              },
            },
          },
        },
      });

      if (lesson?.quiz) {
        return NextResponse.json(formatQuizResponse(lesson.quiz));
      }

      const quizByTitle = await prisma.quiz.findFirst({
        where: {
          title: {
            equals: topic,
            mode: "insensitive",
          },
        },
        include: {
          lesson: {
            select: {
              id: true,
              slug: true,
            },
          },
          questions: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

      if (quizByTitle) {
        return NextResponse.json(formatQuizResponse(quizByTitle));
      }
    }

    return NextResponse.json({ questions: [] });
  } catch (error) {
    console.error("GET /api/quizzes error:", error);

    return NextResponse.json(
      { message: "Тестийн асуултуудыг авахад алдаа гарлаа." },
      { status: 500 },
    );
  }
}
