"use client";

import { MongolianKeyboard } from "@/components/ui/MongolianKeyboard";
import { MongolianText } from "@/components/ui/MongolianText";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { showToast } from "@/components/ui/Toast";
import { QUIZ_BANKS } from "@/lib/data";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/types";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type OptState = "idle" | "correct" | "wrong";

type TypingQuestion = {
  type: "type";
  q: string;
  cyrillic?: string;
  mongol?: string;
  answer: string;
  hint?: string;
  mode?: "cyrillic";
};

type McQuestion = {
  type: "mc";
  q: string;
  mg?: string;
  opts: string[];
  c: number;
};

type QuizItem = McQuestion | TypingQuestion;

type QuizApiRawQuestion = {
  type?: "mc" | "type";
  q?: string;
  question?: string;
  mg?: string;
  mongolText?: string;
  opts?: string[];
  options?: string[];
  c?: number;
  correctIndex?: number;
  hint?: string;
  answer?: string;
  cyrillic?: string;
  mongol?: string;
  mode?: "cyrillic";
};

const TYPING_QUESTIONS: TypingQuestion[] = [
  {
    type: "type",
    q: "Доорх кирилл үгийг МОНГОЛ БИЧГЭЭР бич:",
    cyrillic: "Морь",
    answer: "ᠮᠣᠷᠢ",
    hint: "M-O-R-I",
  },
  {
    type: "type",
    q: "Доорх кирилл үгийг МОНГОЛ БИЧГЭЭР бич:",
    cyrillic: "Гэр",
    answer: "ᠭᠡᠷ",
    hint: "G-E-R",
  },
  {
    type: "type",
    q: "Доорх кирилл үгийг МОНГОЛ БИЧГЭЭР бич:",
    cyrillic: "Ус",
    answer: "ᠤᠰᠤ",
    hint: "U-S-U",
  },
  {
    type: "type",
    q: "Доорх кирилл үгийг МОНГОЛ БИЧГЭЭР бич:",
    cyrillic: "Нар",
    answer: "ᠨᠠᠷ",
    hint: "N-A-R",
  },
  {
    type: "type",
    q: "Доорх монгол бичгийн үгийг КИРИЛЛ ҮГЭЭР бич:",
    mongol: "ᠭᠠᠵᠠᠷ",
    answer: "газар",
    mode: "cyrillic",
  },
  {
    type: "type",
    q: "Доорх монгол бичгийн үгийг КИРИЛЛ ҮГЭЭР бич:",
    mongol: "ᠬᠦᠮᠦᠨ",
    answer: "хүн",
    mode: "cyrillic",
  },
  {
    type: "type",
    q: "Доорх монгол бичгийн үгийг КИРИЛЛ ҮГЭЭР бич:",
    mongol: "ᠴᠠᠭ",
    answer: "цаг",
    mode: "cyrillic",
  },
];

function buildFallbackQuiz(topic: string): QuizItem[] {
  const bank: QuizQuestion[] = QUIZ_BANKS[topic] ?? QUIZ_BANKS.default;
  const typingQ = TYPING_QUESTIONS.slice(0, 2);

  return [
    ...bank.slice(0, 3).map(
      (q) =>
        ({
          type: "mc",
          q: q.q,
          mg: q.mg,
          opts: q.opts,
          c: q.c,
        }) satisfies McQuestion,
    ),
    typingQ[0],
    ...bank.slice(3).map(
      (q) =>
        ({
          type: "mc",
          q: q.q,
          mg: q.mg,
          opts: q.opts,
          c: q.c,
        }) satisfies McQuestion,
    ),
    ...(typingQ[1] ? [typingQ[1]] : []),
  ];
}

function normalizeApiQuestions(raw: unknown): QuizItem[] {
  const arr = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { questions?: unknown[] })?.questions)
      ? (raw as { questions: unknown[] }).questions
      : [];

  return arr
    .map((item) => {
      const q = item as QuizApiRawQuestion;

      if ((q.type === "type" || q.answer) && (q.q || q.question)) {
        return {
          type: "type",
          q: q.q || q.question || "",
          cyrillic: q.cyrillic,
          mongol: q.mongol,
          answer: q.answer || "",
          hint: q.hint,
          mode: q.mode,
        } satisfies TypingQuestion;
      }

      const opts = q.opts || q.options || [];
      const correct = typeof q.c === "number" ? q.c : q.correctIndex;

      if (
        (q.q || q.question) &&
        Array.isArray(opts) &&
        typeof correct === "number"
      ) {
        return {
          type: "mc",
          q: q.q || q.question || "",
          mg: q.mg || q.mongolText,
          opts,
          c: correct,
        } satisfies McQuestion;
      }

      return null;
    })
    .filter((item): item is QuizItem => item !== null);
}

const MONGOLIAN_SCRIPT_RE = /[\u1800-\u18AF]/;
const MONGOLIAN_SEGMENT_RE =
  /([\u1800-\u18AF]+(?:[\s\u180E\u202F]+[\u1800-\u18AF]+)*)/g;

function hasMongolianScript(text: string) {
  return MONGOLIAN_SCRIPT_RE.test(text);
}

function renderMongolianAwareText(
  text: string,
  variant: "question" | "option" = "option",
) {
  if (!hasMongolianScript(text)) return text;

  const parts = text.split(MONGOLIAN_SEGMENT_RE).filter(Boolean);

  return (
    <span
      className={cn(
        "inline-flex flex-wrap items-center gap-2",
        variant === "question" ? "justify-center" : "justify-start",
      )}>
      {parts.map((part, index) =>
        hasMongolianScript(part) ? (
          <span
            key={index}
            className="font-mongolian text-sand-300 inline-block"
            style={{
              writingMode: "vertical-lr",
              textOrientation: "mixed",
              fontSize: variant === "question" ? 28 : 20,
              lineHeight: 1.4,
              height: variant === "question" ? 70 : 42,
            }}>
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </span>
  );
}

export function QuizPage() {
  const router = useRouter();

  const {
    quizTopic,
    quizFromLesson,
    quizLessonSlug,
    quizRequireDatabase,
    goTo,
    lives,
    loseLife,
    setLives,
    recoverLives,
    setXp,
    userId,
    isLoggedIn,
  } = useAppStore();

  const fallbackItems = useMemo(
    () => buildFallbackQuiz(quizTopic),
    [quizTopic],
  );

  const [quizItems, setQuizItems] = useState<QuizItem[]>([]);
  const [loadingRemote, setLoadingRemote] = useState(true);
  const [remoteQuizId, setRemoteQuizId] = useState("");
  const [submittedResult, setSubmittedResult] = useState(false);
  const [databaseQuizMissing, setDatabaseQuizMissing] = useState(false);

  const [idx, setIdx] = useState(0);
  const [optStates, setOptStates] = useState<OptState[]>([]);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [typedVal, setTypedVal] = useState("");
  const [typeResult, setTypeResult] = useState<"idle" | "ok" | "bad">("idle");
  const [earnedXp, setEarnedXp] = useState(0);
  const [outOfLives, setOutOfLives] = useState(false);

  useEffect(() => {
    recoverLives();
  }, [recoverLives]);

  useEffect(() => {
    let active = true;

    async function loadQuiz() {
      try {
        setLoadingRemote(true);
        setDatabaseQuizMissing(false);

        const query =
          quizRequireDatabase && quizLessonSlug
            ? `/api/quizzes?lessonSlug=${encodeURIComponent(quizLessonSlug)}`
            : `/api/quizzes?topic=${encodeURIComponent(quizTopic)}`;

        const res = await fetch(query, { cache: "no-store" });

        if (!res.ok) {
          if (!active) return;

          if (quizRequireDatabase) {
            setQuizItems([]);
            setRemoteQuizId("");
            setDatabaseQuizMissing(true);
          } else {
            setQuizItems(fallbackItems);
            setRemoteQuizId("");
            setDatabaseQuizMissing(false);
          }

          setSubmittedResult(false);
          setEarnedXp(0);
          setOutOfLives(false);
          return;
        }

        const data = await res.json();
        const normalized = normalizeApiQuestions(data);

        if (!active) return;

        if (normalized.length > 0) {
          setQuizItems(normalized);
          setRemoteQuizId(typeof data?.quizId === "string" ? data.quizId : "");
          setDatabaseQuizMissing(false);
        } else if (quizRequireDatabase) {
          setQuizItems([]);
          setRemoteQuizId("");
          setDatabaseQuizMissing(true);
        } else {
          setQuizItems(fallbackItems);
          setRemoteQuizId("");
          setDatabaseQuizMissing(false);
        }

        setIdx(0);
        setOptStates([]);
        setCorrect(0);
        setDone(false);
        setTypedVal("");
        setTypeResult("idle");
        setSubmittedResult(false);
        setEarnedXp(0);
        setOutOfLives(false);
      } catch (error) {
        console.error("Quiz fetch error:", error);

        if (!active) return;

        if (quizRequireDatabase) {
          setQuizItems([]);
          setRemoteQuizId("");
          setDatabaseQuizMissing(true);
        } else {
          setQuizItems(fallbackItems);
          setRemoteQuizId("");
          setDatabaseQuizMissing(false);
        }

        setSubmittedResult(false);
        setEarnedXp(0);
        setOutOfLives(false);
      } finally {
        if (active) {
          setLoadingRemote(false);
        }
      }
    }

    loadQuiz();

    return () => {
      active = false;
    };
  }, [quizTopic, quizLessonSlug, quizRequireDatabase, fallbackItems]);

  const total = quizItems.length;
  const cur = quizItems[idx];
  const progress = total > 0 ? Math.round((idx / total) * 100) : 0;

  useEffect(() => {
    if (!done) return;
    if (submittedResult) return;
    if (!isLoggedIn || !userId || !remoteQuizId) return;
    if (total <= 0) return;

    async function submitResults() {
      try {
        const scorePercent = Math.round((correct / total) * 100);

        const attemptRes = await fetch("/api/quiz-attempts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            quizId: remoteQuizId,
            score: scorePercent,
            total,
            correctCount: correct,
          }),
        });

        if (attemptRes.ok) {
          const attemptData = await attemptRes.json().catch(() => null);

          if (typeof attemptData?.earnedXp === "number") {
            setEarnedXp(attemptData.earnedXp);
          }

          if (typeof attemptData?.totalXp === "number") {
            setXp(attemptData.totalXp);
          }
        } else {
          const data = await attemptRes.json().catch(() => null);
          console.error(
            "Quiz attempt save failed:",
            data?.message || attemptRes.status,
          );
        }

        const progressRes = await fetch("/api/lesson-progress", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "completeByQuiz",
            userId,
            quizId: remoteQuizId,
            score: scorePercent,
          }),
        });

        if (!progressRes.ok) {
          const data = await progressRes.json().catch(() => null);
          console.error(
            "Lesson progress save failed:",
            data?.message || progressRes.status,
          );
        }

        setSubmittedResult(true);
      } catch (error) {
        console.error("Quiz result submit error:", error);
        setSubmittedResult(true);
      }
    }

    submitResults();
  }, [
    done,
    submittedResult,
    isLoggedIn,
    userId,
    remoteQuizId,
    total,
    correct,
    setXp,
  ]);

  const loseLifePersisted = useCallback(async () => {
    loseLife();

    if (!isLoggedIn || !userId) return;

    try {
      const res = await fetch("/api/user-lives", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "lose",
          userId,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && typeof data?.lives === "number") {
        setLives(data.lives);
      }
    } catch (error) {
      console.error("Life save error:", error);
    }
  }, [isLoggedIn, userId, loseLife, setLives]);

  function exitQuiz() {
    if (quizFromLesson) {
      goTo("lessons");
      router.push("/lessons");
    } else {
      goTo("home");
      router.push("/");
    }
  }

  function resetQuiz() {
    recoverLives();
    setIdx(0);
    setCorrect(0);
    setDone(false);
    setOptStates([]);
    setTypedVal("");
    setTypeResult("idle");
    setSubmittedResult(false);
    setEarnedXp(0);
    setOutOfLives(false);
  }

  function advance() {
    setOptStates([]);
    setTypedVal("");
    setTypeResult("idle");

    if (idx + 1 >= total) setDone(true);
    else setIdx((i) => i + 1);
  }

  const answerMC = useCallback(
    (chosen: number) => {
      if (!cur || cur.type !== "mc") return;
      if (optStates.length) return;

      if (lives <= 0) {
        setOutOfLives(true);
        setDone(true);
        return;
      }

      const states: OptState[] = cur.opts.map((_, i) => {
        if (i === cur.c) return "correct";
        if (i === chosen) return "wrong";
        return "idle";
      });

      setOptStates(states);

      if (chosen === cur.c) {
        setCorrect((c) => c + 1);
        showToast("Зөв!", "ok");
        setTimeout(advance, 1300);
      } else {
        const willOutOfLives = lives <= 1;

        void loseLifePersisted();
        showToast("Буруу — 1 амь хасагдлаа", "bad");

        if (willOutOfLives) {
          setOutOfLives(true);
          setTimeout(() => setDone(true), 900);
        } else {
          setTimeout(advance, 1300);
        }
      }
    },
    [cur, optStates, lives, loseLifePersisted],
  );

  function submitTyping() {
    if (!cur || cur.type !== "type") return;
    if (typeResult !== "idle") return;

    if (lives <= 0) {
      setOutOfLives(true);
      setDone(true);
      return;
    }

    const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "");
    const ok = norm(typedVal) === norm(cur.answer);

    setTypeResult(ok ? "ok" : "bad");

    if (ok) {
      setCorrect((c) => c + 1);
      showToast("Зөв бичлээ!", "ok");
      setTimeout(advance, 1800);
    } else {
      const willOutOfLives = lives <= 1;

      void loseLifePersisted();
      showToast(`Буруу — зөв хариулт: "${cur.answer}"`, "bad");

      if (willOutOfLives) {
        setOutOfLives(true);
        setTimeout(() => setDone(true), 1000);
      } else {
        setTimeout(advance, 1800);
      }
    }
  }

  if (loadingRemote) {
    return (
      <div className="max-w-[620px] mx-auto px-6 py-12">
        <div className="bg-white border-2 border-paper-100 rounded-3xl p-10 text-center">
          <p className="text-[16px] font-bold text-ink-muted">
            Тестийг ачаалж байна...
          </p>
        </div>
      </div>
    );
  }

  if (lives <= 0 && !done) {
    return (
      <div className="max-w-[620px] mx-auto px-6 py-12">
        <div className="bg-white border-2 border-paper-100 rounded-3xl p-10 text-center">
          <h2 className="text-[24px] font-black mb-2">Амь дууссан байна</h2>

          <p className="text-[14px] text-ink-muted font-semibold leading-relaxed mb-6">
            Та буруу хариулт олон өгсөн тул амь дууссан байна. 1 цагийн дараа
            амь автоматаар нөхөгдөнө.
          </p>

          <button
            onClick={exitQuiz}
            className="bg-sky-300 text-white font-extrabold text-[14px] px-7 py-3 rounded-2xl hover:bg-sky-200 transition-all">
            Буцах
          </button>
        </div>
      </div>
    );
  }

  if (databaseQuizMissing) {
    return (
      <div className="max-w-[620px] mx-auto px-6 py-12">
        <div className="bg-white border-2 border-paper-100 rounded-3xl p-10 text-center">
          <h2 className="text-[22px] font-black mb-2">
            Тест хараахан холбогдоогүй байна
          </h2>

          <p className="text-[14px] text-ink-muted font-semibold leading-relaxed mb-6">
            Энэ хичээлд database дээр тест холбогдоогүй байна. Админ хэсгээс
            тухайн хичээлтэй quiz холбоно уу.
          </p>

          <button
            onClick={exitQuiz}
            className="bg-sky-300 text-white font-extrabold text-[14px] px-7 py-3 rounded-2xl hover:bg-sky-200 transition-all shadow-[0_4px_16px_rgba(26,107,189,.3)]">
            Хичээл рүү буцах
          </button>
        </div>
      </div>
    );
  }

  if (!cur) {
    return (
      <div className="max-w-[620px] mx-auto px-6 py-12">
        <div className="bg-white border-2 border-paper-100 rounded-3xl p-10 text-center">
          <p className="text-[16px] font-bold text-ink-muted">
            Энэ тестийн асуулт алга байна.
          </p>
        </div>
      </div>
    );
  }

  if (done) {
    const pct = Math.round((correct / total) * 100);
    const icon = outOfLives ? "" : pct >= 80 ? "" : pct >= 60 ? "⭐" : "";
    const msg = outOfLives
      ? "Амь дууслаа"
      : pct >= 80
        ? "Маш сайн!"
        : pct >= 60
          ? "Дундаж сайн"
          : "Дахин давт";

    return (
      <div className="max-w-[620px] mx-auto px-6 py-9 text-center animate-fade-up">
        <div className="text-[56px] mb-3">{icon}</div>

        <h2 className="text-[26px] font-black mb-2">{msg}</h2>

        <p className="text-[15px] text-ink-muted font-semibold mb-6">
          {pct}% зөв хариулт
        </p>

        {outOfLives && (
          <div className="bg-ember-50 border border-ember-100 text-ember-300 rounded-2xl px-4 py-3 mb-5 text-[13px] font-bold">
            Амь 0 болсон тул шалгалт зогслоо. 1 цагийн дараа амь нөхөгдөнө.
          </div>
        )}

        <div className="grid grid-cols-4 gap-3 mb-7">
          {[
            { n: correct, label: "Зөв", color: "text-grass-300" },
            { n: total - correct, label: "Буруу", color: "text-ember-300" },
            { n: pct, label: "Оноо", color: "text-sky-300", suffix: "%" },
            {
              n: earnedXp,
              label: "Нэмэгдсэн оноо",
              color: "text-grass-300",
              suffix: "",
            },
          ].map(({ n, label, color, suffix }) => (
            <div
              key={label}
              className="bg-white border-2 border-paper-100 rounded-2xl p-4">
              <p className={`text-[24px] font-black ${color}`}>
                {n}
                {suffix}
              </p>

              <p className="text-[11px] font-bold text-ink-muted mt-1">
                {label}
              </p>
            </div>
          ))}
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={resetQuiz}
            disabled={lives <= 0}
            className={cn(
              "bg-white border-2 border-paper-100 text-ink font-extrabold text-[14px] px-6 py-3 rounded-2xl transition-all",
              lives > 0
                ? "hover:border-sky-100 hover:bg-sky-50"
                : "opacity-50 cursor-not-allowed",
            )}>
            Дахин хийх
          </button>

          <button
            onClick={exitQuiz}
            className="bg-sky-300 text-white font-extrabold text-[14px] px-7 py-3 rounded-2xl hover:bg-sky-200 transition-all shadow-[0_4px_16px_rgba(26,107,189,.3)]">
            {quizFromLesson ? "Хичээл рүү" : "Нүүр"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[620px] mx-auto px-6 py-9 page-enter">
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={exitQuiz}
          className="bg-white border-2 border-paper-100 text-[13px] font-bold px-3 py-1.5 rounded-xl hover:border-sky-100 transition-all">
          Буцах
        </button>

        <div className="flex-1">
          <ProgressBar value={progress} />
        </div>

        <span className="text-[13px] font-extrabold text-ink-muted">
          {idx + 1}/{total}
        </span>

        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "w-2.5 h-2.5 rounded-full",
                i < lives ? "bg-ember-300" : "bg-paper-100",
              )}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        {cur.type === "mc" ? (
          <span className="text-[11px] font-extrabold bg-sky-50 border border-sky-100 text-sky-300 px-2.5 py-1 rounded-xl uppercase tracking-wide">
            Сонгох асуулт
          </span>
        ) : (
          <span className="text-[11px] font-extrabold bg-sand-50 border border-sand-100 text-sand-300 px-2.5 py-1 rounded-xl uppercase tracking-wide">
            Бичих даалгавар
          </span>
        )}

        <span className="text-[11px] font-bold text-ink-muted">Оноо: +10</span>
      </div>

      {cur.type === "mc" && (
        <div className="bg-white border-2 border-paper-100 rounded-3xl p-6 mb-5">
          {cur.mg && (
            <div className="flex justify-center mb-5">
              <div className="bg-sand-50 border-2 border-sand-100 rounded-2xl p-5">
                <MongolianText size="xl" color="#c97b2a">
                  {cur.mg}
                </MongolianText>
              </div>
            </div>
          )}

          <div className="text-[17px] font-extrabold text-center mb-5 flex justify-center">
            {renderMongolianAwareText(cur.q, "question")}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {cur.opts.map((opt, i) => (
              <button
                key={i}
                onClick={() => answerMC(i)}
                disabled={optStates.length > 0}
                className={cn(
                  "p-4 rounded-2xl border-2 text-[14px] font-bold text-left transition-all duration-200",
                  optStates[i] === "correct" &&
                    "border-grass-300 bg-grass-50 text-grass-300",
                  optStates[i] === "wrong" &&
                    "border-ember-300 bg-ember-50 text-ember-300",
                  !optStates.length &&
                    "border-paper-100 hover:border-sky-100 hover:bg-sky-50 hover:scale-[1.02]",
                )}>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold text-ink-muted shrink-0">
                    {String.fromCharCode(65 + i)}.
                  </span>

                  <span className="flex-1">
                    {renderMongolianAwareText(opt, "option")}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {cur.type === "type" && (
        <div className="bg-white border-2 border-paper-100 rounded-3xl p-6 mb-5">
          <div className="text-[16px] font-extrabold mb-4">
            {renderMongolianAwareText(cur.q, "question")}
          </div>

          <div className="flex justify-center mb-5">
            <div
              className={cn(
                "border-2 rounded-2xl p-5 text-center",
                !cur.mode || cur.mode !== "cyrillic"
                  ? "bg-sky-50 border-sky-100"
                  : "bg-sand-50 border-sand-100",
              )}>
              {!cur.mode || cur.mode !== "cyrillic" ? (
                <p className="text-[28px] font-black text-ink">
                  {cur.cyrillic}
                </p>
              ) : (
                <span
                  className="font-mongolian text-sand-300"
                  style={{
                    writingMode: "vertical-lr",
                    fontSize: 36,
                    minHeight: 50,
                    display: "inline-block",
                  }}>
                  {cur.mongol}
                </span>
              )}
            </div>
          </div>

          {!cur.mode || cur.mode !== "cyrillic" ? (
            <div
              className={cn(
                "rounded-2xl border-2 transition-all",
                typeResult === "ok" && "border-grass-300",
                typeResult === "bad" && "border-ember-300",
                typeResult === "idle" && "border-paper-100",
              )}>
              <MongolianKeyboard
                value={typedVal}
                onChange={typeResult === "idle" ? setTypedVal : () => {}}
                mode="inline"
                placeholder="Монгол бичгийн гараас бичнэ..."
              />
            </div>
          ) : (
            <input
              className={cn(
                "w-full border-2 rounded-2xl px-4 py-3 text-[18px] font-bold outline-none transition-all",
                typeResult === "ok" &&
                  "border-grass-300 bg-grass-50 text-grass-300",
                typeResult === "bad" &&
                  "border-ember-300 bg-ember-50 text-ember-300",
                typeResult === "idle" &&
                  "border-paper-100 focus:border-sky-100 focus:shadow-[0_0_0_3px_rgba(26,107,189,.1)]",
              )}
              placeholder="Кирилл үгийг бич..."
              value={typedVal}
              onChange={(e) =>
                typeResult === "idle" && setTypedVal(e.target.value)
              }
              onKeyDown={(e) => e.key === "Enter" && submitTyping()}
              autoFocus
              disabled={typeResult !== "idle"}
            />
          )}

          {typeResult !== "idle" && (
            <div
              className={cn(
                "mt-3 rounded-xl p-3 text-[13px] font-bold",
                typeResult === "ok"
                  ? "bg-grass-50 text-grass-300"
                  : "bg-ember-50 text-ember-300",
              )}>
              {typeResult === "ok"
                ? "Зөв бичлээ!"
                : `Зөв хариулт: "${cur.answer}"`}
            </div>
          )}

          {typeResult === "idle" && (
            <button
              onClick={submitTyping}
              disabled={!typedVal.trim()}
              className={cn(
                "w-full mt-4 font-extrabold text-[15px] rounded-2xl py-3.5 transition-all",
                typedVal.trim()
                  ? "bg-sky-300 text-white hover:bg-sky-200 hover:-translate-y-px"
                  : "bg-paper-100 text-ink-muted cursor-not-allowed",
              )}>
              Шалгах
            </button>
          )}

          {cur.hint && typeResult === "idle" && (
            <p className="text-center text-[12px] text-ink-muted font-semibold mt-2">
              Дохио: {cur.hint}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
