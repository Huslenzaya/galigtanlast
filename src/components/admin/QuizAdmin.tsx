"use client";

import { AdminModal } from "@/components/admin/AdminModal";
import { MongolianKeyboard } from "@/components/ui/MongolianKeyboard";
import { getLevelMeta } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

type QuestionType = "mc" | "typing_mongol";
type QuizModal = null | "quiz" | "question";

interface LessonOption {
  id: string;
  title: string;
  slug: string;
  grade: number;
  level: number;
}

interface QuizQuestionItem {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  category: string | null;
  difficulty: number | null;
  createdAt: string;
  updatedAt: string;
}

interface QuizItem {
  id: string;
  title: string;
  isPlacement: boolean;
  lesson: {
    id: string;
    title: string;
    slug: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  questions: QuizQuestionItem[];
}

const EMPTY_QUIZ_FORM = {
  title: "",
  isPlacement: false,
  lessonId: "",
};

const EMPTY_QUESTION_FORM = {
  type: "mc" as QuestionType,
  question: "",
  mgText: "",
  options: ["", "", "", ""],
  correctIndex: 0,
  category: "",
  difficulty: 1,
  typingDisplayText: "",
  typingAnswer: "",
  typingHint: "",
};

export function QuizAdmin() {
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [lessons, setLessons] = useState<LessonOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
  const [modal, setModal] = useState<QuizModal>(null);

  const [quizForm, setQuizForm] = useState(EMPTY_QUIZ_FORM);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);

  const [questionForm, setQuestionForm] = useState(EMPTY_QUESTION_FORM);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null,
  );

  async function parseError(res: Response, fallback: string) {
    try {
      const data = await res.json();
      return data?.message || fallback;
    } catch {
      return fallback;
    }
  }

  async function loadQuizzes() {
    try {
      setLoading(true);

      const [quizzesRes, lessonsRes] = await Promise.all([
        fetch("/api/admin/quizzes", { cache: "no-store" }),
        fetch("/api/admin/lessons", { cache: "no-store" }),
      ]);

      if (!quizzesRes.ok) {
        throw new Error(
          await parseError(quizzesRes, "Тестүүдийг ачаалж чадсангүй."),
        );
      }

      if (!lessonsRes.ok) {
        throw new Error(
          await parseError(lessonsRes, "Хичээлүүдийг ачаалж чадсангүй."),
        );
      }

      const [quizData, lessonData] = await Promise.all([
        quizzesRes.json(),
        lessonsRes.json(),
      ]);

      setQuizzes(Array.isArray(quizData) ? quizData : []);
      setLessons(Array.isArray(lessonData) ? lessonData : []);

      if (Array.isArray(quizData) && quizData.length > 0) {
        setSelectedQuizId((prev: string | null) =>
          prev && quizData.some((q: QuizItem) => q.id === prev)
            ? prev
            : quizData[0].id,
        );
      } else {
        setSelectedQuizId(null);
      }

      setErrorMsg("");
    } catch (error) {
      console.error(error);
      setErrorMsg(error instanceof Error ? error.message : "Алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuizzes();
  }, []);

  function showSaved(message: string) {
    setSavedMsg(message);
    setTimeout(() => setSavedMsg(""), 2200);
  }

  function resetQuizForm() {
    setQuizForm(EMPTY_QUIZ_FORM);
    setEditingQuizId(null);
  }

  function resetQuestionForm() {
    setQuestionForm(EMPTY_QUESTION_FORM);
    setEditingQuestionId(null);
  }

  const selectedQuiz = useMemo(
    () => quizzes.find((q) => q.id === selectedQuizId) ?? null,
    [quizzes, selectedQuizId],
  );

  async function saveQuiz() {
    if (!quizForm.title) return;

    try {
      setSavingQuiz(true);
      const isEditing = !!editingQuizId;

      const payload = {
        title: quizForm.title,
        isPlacement: quizForm.isPlacement,
        lessonId: quizForm.isPlacement ? "" : quizForm.lessonId,
      };

      const res = await fetch(
        isEditing
          ? `/api/admin/quizzes/${editingQuizId}`
          : "/api/admin/quizzes",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        throw new Error(
          await parseError(
            res,
            isEditing
              ? "Тестийг засахад алдаа гарлаа."
              : "Тест нэмэхэд алдаа гарлаа.",
          ),
        );
      }

      resetQuizForm();
      setModal(null);
      await loadQuizzes();
      showSaved(isEditing ? "Тест шинэчлэгдлээ." : "Шинэ тест нэмэгдлээ.");
    } catch (error) {
      console.error(error);
      setErrorMsg(error instanceof Error ? error.message : "Алдаа гарлаа.");
    } finally {
      setSavingQuiz(false);
    }
  }

  function startEditQuiz(quiz: QuizItem) {
    setQuizForm({
      title: quiz.title,
      isPlacement: quiz.isPlacement,
      lessonId: quiz.lesson?.id ?? "",
    });
    setEditingQuizId(quiz.id);
    setSelectedQuizId(quiz.id);
    setModal("quiz");
  }

  async function deleteQuiz(id: string) {
    const ok = window.confirm("Энэ тестийг устгах уу?");
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/quizzes/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error(await parseError(res, "Тест устгахад алдаа гарлаа."));
      }

      if (editingQuizId === id) resetQuizForm();
      if (selectedQuizId === id) resetQuestionForm();

      await loadQuizzes();
      showSaved("Тест устгагдлаа.");
    } catch (error) {
      console.error(error);
      setErrorMsg(error instanceof Error ? error.message : "Алдаа гарлаа.");
    }
  }

  function isTypingQuestion(question: QuizQuestionItem) {
    return question.category === "typing_mongol";
  }

  async function saveQuestion() {
    if (!selectedQuizId || !questionForm.question) return;

    if (questionForm.type === "mc" && questionForm.options.some((o) => !o)) {
      return;
    }

    if (
      questionForm.type === "typing_mongol" &&
      (!questionForm.typingDisplayText || !questionForm.typingAnswer)
    ) {
      return;
    }

    try {
      setSavingQuestion(true);
      const isEditing = !!editingQuestionId;

      const payload =
        questionForm.type === "typing_mongol"
          ? {
              questionType: "typing_mongol",
              question: questionForm.question,
              displayText: questionForm.typingDisplayText,
              answer: questionForm.typingAnswer,
              hint: questionForm.typingHint,
              difficulty: questionForm.difficulty,
            }
          : {
              questionType: "mc",
              question: questionForm.question,
              options: questionForm.options,
              correctIndex: questionForm.correctIndex,
              category: questionForm.category,
              difficulty: questionForm.difficulty,
              mgText: questionForm.mgText,
            };

      const res = await fetch(
        isEditing
          ? `/api/admin/questions/${editingQuestionId}`
          : `/api/admin/quizzes/${selectedQuizId}/questions`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        throw new Error(
          await parseError(
            res,
            isEditing
              ? "Асуултыг засахад алдаа гарлаа."
              : "Асуулт нэмэхэд алдаа гарлаа.",
          ),
        );
      }

      resetQuestionForm();
      setModal(null);
      await loadQuizzes();
      showSaved(isEditing ? "Асуулт шинэчлэгдлээ." : "Шинэ асуулт нэмэгдлээ.");
    } catch (error) {
      console.error(error);
      setErrorMsg(error instanceof Error ? error.message : "Алдаа гарлаа.");
    } finally {
      setSavingQuestion(false);
    }
  }

  function startEditQuestion(question: QuizQuestionItem) {
    if (isTypingQuestion(question)) {
      setQuestionForm({
        ...EMPTY_QUESTION_FORM,
        type: "typing_mongol",
        question: question.question,
        typingDisplayText: question.options[0] ?? "",
        typingAnswer: question.options[1] ?? "",
        typingHint: question.options[2] ?? "",
        difficulty: question.difficulty ?? 1,
      });
    } else {
      setQuestionForm({
        ...EMPTY_QUESTION_FORM,
        type: "mc",
        question: question.question,
        options:
          question.options.length >= 4
            ? question.options.slice(0, 4)
            : [
                ...question.options,
                ...Array(4 - question.options.length).fill(""),
              ],
        correctIndex: question.correctIndex,
        category: question.category ?? "",
        difficulty: question.difficulty ?? 1,
      });
    }

    setEditingQuestionId(question.id);
    setModal("question");
  }

  async function deleteQuestion(id: string) {
    const ok = window.confirm("Энэ асуултыг устгах уу?");
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/questions/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error(await parseError(res, "Асуулт устгахад алдаа гарлаа."));
      }

      if (editingQuestionId === id) resetQuestionForm();

      await loadQuizzes();
      showSaved("Асуулт устгагдлаа.");
    } catch (error) {
      console.error(error);
      setErrorMsg(error instanceof Error ? error.message : "Алдаа гарлаа.");
    }
  }

  const canSaveQuestion =
    !!selectedQuiz &&
    !!questionForm.question &&
    (questionForm.type === "typing_mongol"
      ? !!questionForm.typingDisplayText && !!questionForm.typingAnswer
      : !questionForm.options.some((o) => !o));

  return (
    <>
      <div className="flex flex-col gap-5">
        {errorMsg && (
          <div className="bg-ember-50 border border-ember-100 text-ember-300 rounded-xl px-3 py-2 text-[12px] font-bold">
            {errorMsg}
          </div>
        )}

        {savedMsg && (
          <div className="bg-grass-50 border border-grass-100 text-grass-300 rounded-xl px-3 py-2 text-[12px] font-bold">
            {savedMsg}
          </div>
        )}

        <div className="bg-white border-2 border-paper-100 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <h3 className="text-[20px] font-black">Тестүүд</h3>
            <p className="text-[13px] text-ink-muted font-semibold mt-1">
              Хичээлтэй холбогдох тест болон асуултыг удирдана.
            </p>
          </div>

          <button
            onClick={() => {
              resetQuizForm();
              setModal("quiz");
            }}
            className="bg-sky-300 text-white font-extrabold text-[14px] px-5 py-3 rounded-2xl hover:bg-sky-200 transition-all">
            + Тест нэмэх
          </button>
        </div>

        <div className="grid grid-cols-[420px_1fr] gap-5">
          <div className="bg-white border-2 border-paper-100 rounded-2xl overflow-hidden">
            <div className="p-5 border-b-2 border-paper-100 flex items-center justify-between">
              <h3 className="text-[16px] font-black">Тестүүдийн жагсаалт</h3>
              <span className="text-[12px] font-bold text-ink-muted">
                {loading ? "..." : quizzes.length} тест
              </span>
            </div>

            <div className="p-4 flex flex-col gap-3 max-h-[620px] overflow-y-auto">
              {!loading && quizzes.length === 0 && (
                <div className="text-[13px] text-ink-muted font-semibold text-center py-8">
                  Тест алга байна. Эхний тестээ нэмнэ үү.
                </div>
              )}

              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className={cn(
                    "border-2 rounded-2xl p-4 transition-all",
                    selectedQuizId === quiz.id
                      ? "border-sky-200 bg-sky-50"
                      : "border-paper-100 bg-white",
                  )}>
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => {
                        setSelectedQuizId(quiz.id);
                        resetQuestionForm();
                      }}
                      className="flex-1 text-left">
                      <p className="text-[14px] font-extrabold text-ink">
                        {quiz.title}
                      </p>

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-[10px] bg-paper-50 text-ink-muted font-extrabold px-2 py-0.5 rounded-lg">
                          {quiz.questions.length} асуулт
                        </span>

                        {quiz.isPlacement ? (
                          <span className="text-[10px] bg-ember-50 text-ember-300 font-extrabold px-2 py-0.5 rounded-lg">
                            Түвшин тогтоох
                          </span>
                        ) : quiz.lesson ? (
                          <span className="text-[10px] bg-sky-50 text-sky-300 font-extrabold px-2 py-0.5 rounded-lg">
                            {quiz.lesson.title}
                          </span>
                        ) : (
                          <span className="text-[10px] bg-paper-50 text-ink-muted font-extrabold px-2 py-0.5 rounded-lg">
                            Хичээл холбоогүй
                          </span>
                        )}
                      </div>
                    </button>

                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => startEditQuiz(quiz)}
                        className="text-[11px] text-sky-300 font-bold hover:underline">
                        Засах
                      </button>
                      <button
                        onClick={() => deleteQuiz(quiz.id)}
                        className="text-[11px] text-ember-300 font-bold hover:underline">
                        Устгах
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="bg-white border-2 border-paper-100 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <h3 className="text-[20px] font-black">
                  {selectedQuiz ? selectedQuiz.title : "Асуултууд"}
                </h3>
                <p className="text-[13px] text-ink-muted font-semibold mt-1">
                  Сонгосон тестийн асуултууд.
                </p>
              </div>

              <button
                onClick={() => {
                  resetQuestionForm();
                  setModal("question");
                }}
                disabled={!selectedQuiz}
                className={cn(
                  "font-extrabold text-[14px] px-5 py-3 rounded-2xl transition-all",
                  selectedQuiz
                    ? "bg-grass-300 text-white hover:bg-grass-200"
                    : "bg-paper-100 text-ink-muted cursor-not-allowed",
                )}>
                + Асуулт нэмэх
              </button>
            </div>

            <div className="bg-white border-2 border-paper-100 rounded-2xl overflow-hidden">
              <div className="p-5 border-b-2 border-paper-100">
                <h3 className="text-[16px] font-black">
                  {selectedQuiz ? `"${selectedQuiz.title}"` : "Асуултууд"}
                </h3>
              </div>

              <div className="p-4 flex flex-col gap-3 max-h-[540px] overflow-y-auto">
                {!selectedQuiz && (
                  <div className="text-[13px] text-ink-muted font-semibold text-center py-8">
                    Эхлээд тест сонгоно уу.
                  </div>
                )}

                {selectedQuiz && selectedQuiz.questions.length === 0 && (
                  <div className="text-[13px] text-ink-muted font-semibold text-center py-8">
                    Энэ тест дээр асуулт алга байна.
                  </div>
                )}

                {selectedQuiz?.questions.map((question, idx) => (
                  <div
                    key={question.id}
                    className="border-2 border-paper-100 rounded-2xl p-4 bg-white">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-sky-50 border border-sky-100 text-sky-300 text-[12px] font-extrabold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>

                      <div className="flex-1">
                        <p className="text-[14px] font-bold">
                          {question.question}
                        </p>

                        {isTypingQuestion(question) ? (
                          <div className="mt-3 rounded-xl px-3 py-2 text-[12px] font-semibold border bg-sand-50 border-sand-100 text-sand-300">
                            Бичих даалгавар · {question.options[0]} →{" "}
                            {question.options[1]}
                          </div>
                        ) : (
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            {question.options.map((opt, i) => (
                              <div
                                key={i}
                                className={cn(
                                  "rounded-xl px-3 py-2 text-[12px] font-semibold border",
                                  i === question.correctIndex
                                    ? "bg-grass-50 border-grass-100 text-grass-300"
                                    : "bg-paper-50 border-paper-100 text-ink-muted",
                                )}>
                                {String.fromCharCode(65 + i)}. {opt}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          {question.category && !isTypingQuestion(question) && (
                            <span className="text-[10px] bg-sky-50 text-sky-300 font-extrabold px-2 py-0.5 rounded-lg">
                              {question.category}
                            </span>
                          )}
                          {question.difficulty && (
                            <span className="text-[10px] bg-sand-50 text-sand-300 font-extrabold px-2 py-0.5 rounded-lg">
                              {question.difficulty}-р түвшин
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => startEditQuestion(question)}
                          className="text-[11px] text-sky-300 font-bold hover:underline">
                          Засах
                        </button>
                        <button
                          onClick={() => deleteQuestion(question.id)}
                          className="text-[11px] text-ember-300 font-bold hover:underline">
                          Устгах
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AdminModal
        open={modal === "quiz"}
        title={editingQuizId ? "Тест засварлах" : "Тест нэмэх"}
        description="Тестийн нэр болон холбогдох хичээлийг сонгоно."
        onClose={() => {
          setModal(null);
          resetQuizForm();
        }}
        size="md">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-[11px] font-extrabold text-ink-muted uppercase mb-1.5">
              Тестийн нэр
            </p>
            <input
              className="w-full border-2 border-paper-100 rounded-2xl px-4 py-3 font-bold text-[14px] outline-none focus:border-sky-100 transition-all"
              value={quizForm.title}
              onChange={(e) =>
                setQuizForm((p) => ({ ...p, title: e.target.value }))
              }
              placeholder="Эгшиг үсгийн тест"
            />
          </div>

          <label className="flex items-center gap-2 text-[13px] font-bold text-ink-muted cursor-pointer">
            <input
              type="checkbox"
              checked={quizForm.isPlacement}
              onChange={(e) =>
                setQuizForm((p) => ({
                  ...p,
                  isPlacement: e.target.checked,
                  lessonId: e.target.checked ? "" : p.lessonId,
                }))
              }
              className="accent-sky-300"
            />
            Түвшин тогтоох тест
          </label>

          <div>
            <p className="text-[11px] font-extrabold text-ink-muted uppercase mb-1.5">
              Холбох хичээл
            </p>
            <select
              className="w-full border-2 border-paper-100 rounded-2xl px-4 py-3 bg-white font-bold text-[14px] outline-none focus:border-sky-100 transition-all disabled:bg-paper-50 disabled:text-ink-muted"
              value={quizForm.isPlacement ? "" : quizForm.lessonId}
              onChange={(e) =>
                setQuizForm((p) => ({ ...p, lessonId: e.target.value }))
              }
              disabled={quizForm.isPlacement}>
              <option value="">Хичээл сонгоогүй</option>
              {lessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {getLevelMeta(lesson.level).title} · {lesson.title}
                </option>
              ))}
            </select>

            {quizForm.isPlacement && (
              <p className="text-[11px] text-ink-muted font-semibold mt-1.5">
                Түвшин тогтоох тест нь тодорхой хичээлтэй холбогдохгүй.
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={() => {
                setModal(null);
                resetQuizForm();
              }}
              className="bg-white border-2 border-paper-100 text-ink-muted font-bold text-[14px] px-5 py-3 rounded-2xl hover:bg-paper-50 transition-all">
              Болих
            </button>

            <button
              onClick={saveQuiz}
              disabled={savingQuiz || !quizForm.title}
              className={cn(
                "font-extrabold text-[14px] px-6 py-3 rounded-2xl transition-all",
                !savingQuiz && quizForm.title
                  ? "bg-sky-300 text-white hover:bg-sky-200"
                  : "bg-paper-100 text-ink-muted cursor-not-allowed",
              )}>
              {savingQuiz
                ? "Хадгалж байна..."
                : editingQuizId
                  ? "Засвар хадгалах"
                  : "Тест нэмэх"}
            </button>
          </div>
        </div>
      </AdminModal>

      <AdminModal
        open={modal === "question"}
        title={editingQuestionId ? "Асуулт засварлах" : "Асуулт нэмэх"}
        description={
          selectedQuiz
            ? `"${selectedQuiz.title}" тестэд асуулт нэмнэ.`
            : "Эхлээд тест сонгоно уу."
        }
        onClose={() => {
          setModal(null);
          resetQuestionForm();
        }}
        size="xl">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-[11px] font-extrabold text-ink-muted uppercase mb-1.5">
              Асуултын төрөл
            </p>
            <select
              className="w-full border-2 border-paper-100 rounded-2xl px-4 py-3 bg-white font-bold text-[14px] outline-none focus:border-sky-100 transition-all"
              value={questionForm.type}
              onChange={(e) =>
                setQuestionForm({
                  ...EMPTY_QUESTION_FORM,
                  type: e.target.value as QuestionType,
                })
              }>
              <option value="mc">Сонгох асуулт</option>
              <option value="typing_mongol">
                Монгол бичгээр бичих даалгавар
              </option>
            </select>
          </div>

          <div>
            <p className="text-[11px] font-extrabold text-ink-muted uppercase mb-1.5">
              Асуулт
            </p>
            <input
              className="w-full border-2 border-paper-100 rounded-2xl px-4 py-3 font-bold text-[14px] outline-none focus:border-sky-100 transition-all"
              value={questionForm.question}
              onChange={(e) =>
                setQuestionForm((p) => ({ ...p, question: e.target.value }))
              }
              placeholder={
                questionForm.type === "typing_mongol"
                  ? "Доорх кирилл үгийг монгол бичгээр бич:"
                  : "Энэ үсэг аль нь вэ?"
              }
            />
          </div>

          {questionForm.type === "typing_mongol" ? (
            <>
              <div>
                <p className="text-[11px] font-extrabold text-ink-muted uppercase mb-1.5">
                  Харагдах кирилл үг
                </p>
                <input
                  className="w-full border-2 border-paper-100 rounded-2xl px-4 py-3 font-bold text-[14px] outline-none focus:border-sky-100 transition-all"
                  value={questionForm.typingDisplayText}
                  onChange={(e) =>
                    setQuestionForm((p) => ({
                      ...p,
                      typingDisplayText: e.target.value,
                    }))
                  }
                  placeholder="Морь"
                />
              </div>

              <MongolianKeyboard
                label="Зөв хариулт — Монгол бичгээр"
                value={questionForm.typingAnswer}
                onChange={(val) =>
                  setQuestionForm((p) => ({
                    ...p,
                    typingAnswer: val,
                  }))
                }
              />

              <div>
                <p className="text-[11px] font-extrabold text-ink-muted uppercase mb-1.5">
                  Дохио / зөвлөгөө
                </p>
                <input
                  className="w-full border-2 border-paper-100 rounded-2xl px-4 py-3 font-bold text-[14px] outline-none focus:border-sky-100 transition-all"
                  value={questionForm.typingHint}
                  onChange={(e) =>
                    setQuestionForm((p) => ({
                      ...p,
                      typingHint: e.target.value,
                    }))
                  }
                  placeholder="M-O-R-I"
                />
              </div>
            </>
          ) : (
            <>
              <MongolianKeyboard
                label="Монгол бичгийн дүрс / нэмэлт текст"
                value={questionForm.mgText}
                onChange={(val) =>
                  setQuestionForm((p) => ({ ...p, mgText: val }))
                }
              />

              <div>
                <p className="text-[11px] font-extrabold text-ink-muted uppercase mb-2">
                  Хариултын сонголтууд
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {questionForm.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setQuestionForm((p) => ({
                            ...p,
                            correctIndex: i,
                          }))
                        }
                        className={cn(
                          "w-8 h-8 rounded-full border-2 shrink-0 font-extrabold text-[11px] transition-all",
                          questionForm.correctIndex === i
                            ? "bg-grass-300 border-grass-300 text-white"
                            : "border-paper-100 text-ink-muted hover:border-grass-100",
                        )}>
                        {String.fromCharCode(65 + i)}
                      </button>

                      <input
                        className="flex-1 border-2 border-paper-100 rounded-xl px-3 py-2 text-[13px] font-semibold outline-none focus:border-sky-100 transition-all"
                        value={opt}
                        onChange={(e) => {
                          const next = [...questionForm.options];
                          next[i] = e.target.value;
                          setQuestionForm((p) => ({ ...p, options: next }));
                        }}
                        placeholder={`${String.fromCharCode(65 + i)} сонголт`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            {questionForm.type === "mc" && (
              <div>
                <p className="text-[11px] font-extrabold text-ink-muted uppercase mb-1.5">
                  Ангилал
                </p>
                <input
                  className="w-full border-2 border-paper-100 rounded-2xl px-4 py-3 font-bold text-[14px] outline-none focus:border-sky-100 transition-all"
                  value={questionForm.category}
                  onChange={(e) =>
                    setQuestionForm((p) => ({
                      ...p,
                      category: e.target.value,
                    }))
                  }
                  placeholder="Эгшиг"
                />
              </div>
            )}

            <div>
              <p className="text-[11px] font-extrabold text-ink-muted uppercase mb-1.5">
                Хүндрэлийн зэрэг
              </p>
              <input
                type="number"
                className="w-full border-2 border-paper-100 rounded-2xl px-4 py-3 font-bold text-[14px] outline-none focus:border-sky-100 transition-all"
                value={questionForm.difficulty}
                onChange={(e) =>
                  setQuestionForm((p) => ({
                    ...p,
                    difficulty: Number(e.target.value),
                  }))
                }
                min={1}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={() => {
                setModal(null);
                resetQuestionForm();
              }}
              className="bg-white border-2 border-paper-100 text-ink-muted font-bold text-[14px] px-5 py-3 rounded-2xl hover:bg-paper-50 transition-all">
              Болих
            </button>

            <button
              onClick={saveQuestion}
              disabled={savingQuestion || !canSaveQuestion}
              className={cn(
                "font-extrabold text-[14px] px-6 py-3 rounded-2xl transition-all",
                !savingQuestion && canSaveQuestion
                  ? "bg-sky-300 text-white hover:bg-sky-200"
                  : "bg-paper-100 text-ink-muted cursor-not-allowed",
              )}>
              {savingQuestion
                ? "Хадгалж байна..."
                : editingQuestionId
                  ? "Асуулт шинэчлэх"
                  : "Асуулт нэмэх"}
            </button>
          </div>
        </div>
      </AdminModal>
    </>
  );
}
