"use client";

import { MongolianText } from "@/components/ui/MongolianText";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { showToast } from "@/components/ui/Toast";
import { PLACEMENT_LEVELS, PLACEMENT_QUESTIONS } from "@/lib/data";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface CategoryResult {
  ok: number;
  tot: number;
}

type PlacementApiQuestion = {
  id?: string;
  type?: "mc";
  q?: string;
  question?: string;
  mg?: string;
  opts?: string[];
  options?: string[];
  c?: number;
  correctIndex?: number;
  category?: string;
  difficulty?: number;
};

function normalizePlacementQuestions(raw: unknown): QuizQuestion[] {
  const arr = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { questions?: unknown[] })?.questions)
      ? (raw as { questions: unknown[] }).questions
      : [];

  return arr
    .map((item) => {
      const q = item as PlacementApiQuestion;
      const opts = q.opts || q.options || [];
      const correct = typeof q.c === "number" ? q.c : q.correctIndex;

      if (
        !(q.q || q.question) ||
        !Array.isArray(opts) ||
        typeof correct !== "number"
      ) {
        return null;
      }

      return {
        q: q.q || q.question || "",
        mg: q.mg,
        opts,
        c: correct,
        cat: q.category,
        lvl: q.difficulty,
      } as QuizQuestion;
    })
    .filter((item): item is QuizQuestion => item !== null);
}

export function PlacementPage() {
  const router = useRouter();
  const { setPlacementLevel, userId, isLoggedIn } = useAppStore();

  const [questions, setQuestions] =
    useState<QuizQuestion[]>(PLACEMENT_QUESTIONS);
  const [loadingRemote, setLoadingRemote] = useState(true);
  const [remoteQuizId, setRemoteQuizId] = useState("");
  const [savedAttempt, setSavedAttempt] = useState(false);

  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<{ q: QuizQuestion; ok: boolean }[]>(
    [],
  );
  const [optStates, setOptStates] = useState<Record<number, "ok" | "bad">>({});
  const [done, setDone] = useState(false);
  const [resultLevel, setResultLevel] = useState(PLACEMENT_LEVELS[0]);

  useEffect(() => {
    let active = true;

    async function loadPlacementQuiz() {
      try {
        setLoadingRemote(true);

        const res = await fetch("/api/quizzes?topic=placement", {
          cache: "no-store",
        });

        if (!res.ok) {
          if (active) {
            setQuestions(PLACEMENT_QUESTIONS);
            setRemoteQuizId("");
          }
          return;
        }

        const data = await res.json();
        const normalized = normalizePlacementQuestions(data);

        if (active) {
          setQuestions(
            normalized.length > 0 ? normalized : PLACEMENT_QUESTIONS,
          );
          setRemoteQuizId(typeof data?.quizId === "string" ? data.quizId : "");
          setIdx(0);
          setScore(0);
          setAnswers([]);
          setOptStates({});
          setDone(false);
          setSavedAttempt(false);
          setResultLevel(PLACEMENT_LEVELS[0]);
        }
      } catch (error) {
        console.error("Placement fetch fallback to static:", error);
        if (active) {
          setQuestions(PLACEMENT_QUESTIONS);
          setRemoteQuizId("");
        }
      } finally {
        if (active) setLoadingRemote(false);
      }
    }

    loadPlacementQuiz();

    return () => {
      active = false;
    };
  }, []);

  const q = questions[idx];
  const progress =
    questions.length > 0 ? Math.round((idx / questions.length) * 100) : 0;

  useEffect(() => {
    if (!done) return;
    if (savedAttempt) return;
    if (!isLoggedIn || !userId || !remoteQuizId) return;
    if (questions.length <= 0) return;

    async function saveAttempt() {
      try {
        const scorePercent = Math.round((score / questions.length) * 100);

        const res = await fetch("/api/quiz-attempts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            quizId: remoteQuizId,
            score: scorePercent,
            total: questions.length,
            correctCount: score,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          console.error(
            "Placement attempt save failed:",
            data?.message || res.status,
          );
          return;
        }

        setSavedAttempt(true);
      } catch (error) {
        console.error("Placement attempt save error:", error);
      }
    }

    saveAttempt();
  }, [
    done,
    savedAttempt,
    isLoggedIn,
    userId,
    remoteQuizId,
    score,
    questions.length,
  ]);

  const diffMap: Record<number, { label: string; cls: string }> = {
    1: { label: "⬤ Анхан шат", cls: "bg-sky-50 text-sky-300" },
    2: { label: "⬤ Дунд шат", cls: "bg-sand-50 text-sand-300" },
    3: { label: "⬤ Дэвшилтэт", cls: "bg-sand-50 text-sand-300" },
    4: { label: "⬤ Ахисан", cls: "bg-ember-50 text-ember-300" },
  };

  const diff = useMemo(() => {
    if (!q) return diffMap[1];
    return diffMap[q.lvl ?? 1] ?? diffMap[1];
  }, [q]);

  function answer(chosen: number) {
    if (!q) return;
    if (Object.keys(optStates).length) return;

    const isOk = chosen === q.c;
    const states: Record<number, "ok" | "bad"> = {};

    q.opts.forEach((_, i) => {
      if (i === q.c) states[i] = "ok";
      else if (i === chosen) states[i] = "bad";
    });

    setOptStates(states);

    if (isOk) {
      setScore((s) => s + 1);
      showToast(" Зөв!", "ok");
    } else {
      showToast(" Буруу", "bad");
    }

    const newAnswers = [...answers, { q, ok: isOk }];
    setAnswers(newAnswers);

    setTimeout(() => {
      setOptStates({});

      if (idx + 1 >= questions.length) {
        const newScore = score + (isOk ? 1 : 0);
        let lvl = PLACEMENT_LEVELS[0];

        for (let i = PLACEMENT_LEVELS.length - 1; i >= 0; i--) {
          if (newScore >= PLACEMENT_LEVELS[i].score) {
            lvl = PLACEMENT_LEVELS[i];
            break;
          }
        }

        setResultLevel(lvl);
        setPlacementLevel(lvl.n);
        setDone(true);
      } else {
        setIdx((i) => i + 1);
      }
    }, 1100);
  }

  function restart() {
    setIdx(0);
    setScore(0);
    setAnswers([]);
    setOptStates({});
    setDone(false);
    setSavedAttempt(false);
    setResultLevel(PLACEMENT_LEVELS[0]);
  }

  if (loadingRemote && questions.length === 0) {
    return (
      <div className="max-w-[580px] mx-auto px-6 py-12">
        <div className="bg-white border-2 border-paper-100 rounded-3xl p-10 text-center">
          <p className="text-[16px] font-bold text-ink-muted">
            Түвшин тогтоох шалгалтыг ачаалж байна...
          </p>
        </div>
      </div>
    );
  }

  if (!q && !done) {
    return (
      <div className="max-w-[580px] mx-auto px-6 py-12">
        <div className="bg-white border-2 border-paper-100 rounded-3xl p-10 text-center">
          <p className="text-[16px] font-bold text-ink-muted">
            Асуулт олдсонгүй.
          </p>
        </div>
      </div>
    );
  }

  if (done) {
    const cats: Record<string, CategoryResult> = {};

    answers.forEach(({ q: aq, ok }) => {
      const c = aq.cat ?? "Бусад";
      if (!cats[c]) cats[c] = { ok: 0, tot: 0 };
      cats[c].tot++;
      if (ok) cats[c].ok++;
    });

    const finalScore = score;
    const totalQuestions = questions.length;

    const catIcons: Record<string, string> = {
      "Үсэг таних": "",
      "Үгийн утга": "",
      "Нөхцөл залгавар": "",
      Өгүүлбэр: "",
    };

    return (
      <div className="max-w-[520px] mx-auto px-6 py-8 animate-fade-up">
        <div className="text-center mb-6">
          <p className="text-[60px] mb-3">{resultLevel.emoji}</p>
          <h2 className="text-[26px] font-black tracking-tight mb-1">
            Таны түвшин: {resultLevel.name}
          </h2>
          <p className="text-[14px] text-ink-muted font-semibold">
            {resultLevel.grade}
          </p>
        </div>

        <div className="flex items-center gap-5 bg-white border-2 border-paper-100 rounded-2xl p-5 mb-4">
          <div className="relative shrink-0">
            <svg viewBox="0 0 80 80" width={80} height={80}>
              <circle
                cx={40}
                cy={40}
                r={34}
                fill="none"
                stroke="#e8e0d0"
                strokeWidth={7}
              />
              <circle
                cx={40}
                cy={40}
                r={34}
                fill="none"
                stroke="#1a6bbd"
                strokeWidth={7}
                strokeLinecap="round"
                strokeDasharray="213.6"
                strokeDashoffset={
                  213.6 * (1 - finalScore / Math.max(totalQuestions, 1))
                }
                transform="rotate(-90 40 40)"
                style={{ transition: "stroke-dashoffset 1s ease" }}
              />
            </svg>
            <p className="absolute inset-0 flex items-center justify-center text-[12px] font-black">
              {finalScore}/{totalQuestions}
            </p>
          </div>

          <div className="flex-1">
            {Object.entries(cats).map(([cat, v]) => (
              <div
                key={cat}
                className="flex justify-between text-[13px] font-bold py-1.5 border-b border-paper-50 last:border-0">
                <span>{cat}</span>
                <span
                  style={{
                    color:
                      v.ok === v.tot
                        ? "#2a9a52"
                        : v.ok > v.tot / 2
                          ? "#c97b2a"
                          : "#c83030",
                  }}
                  className="font-extrabold">
                  {v.ok}/{v.tot}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 mb-5">
          {Object.entries(cats).map(([cat, v]) => {
            const p = v.ok / v.tot;
            const cls =
              p >= 0.8
                ? "bg-grass-50 text-grass-300"
                : p >= 0.5
                  ? "bg-sand-50 text-sand-300"
                  : "bg-ember-50 text-ember-300";
            const msg =
              p >= 0.8 ? "Маш сайн" : p >= 0.5 ? "Дундаж" : "Давтах хэрэгтэй";

            return (
              <div
                key={cat}
                className="flex items-center gap-3 bg-white border-2 border-paper-100 rounded-2xl px-4 py-3">
                <span className="text-[18px] w-7">{catIcons[cat] ?? ""}</span>
                <span className="flex-1 text-[13px] font-bold">{cat}</span>
                <span
                  className={cn(
                    "text-[12px] font-extrabold px-3 py-1 rounded-2xl",
                    cls,
                  )}>
                  {v.ok}/{v.tot} · {msg}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push("/lessons")}
            className="flex-1 bg-sky-300 text-white font-extrabold text-[15px] rounded-2xl py-3.5 hover:bg-sky-200 transition-all">
            Миний хичээл рүү
          </button>

          <button
            onClick={restart}
            className="flex-1 bg-white border-2 border-paper-100 font-bold text-[14px] rounded-2xl py-3.5 hover:border-sky-100 transition-all">
            Дахин шалгах
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[580px] mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => router.push("/lessons")}
          className="bg-white border-2 border-paper-100 text-[13px] font-bold px-3.5 py-1.5 rounded-xl hover:border-sky-100 transition-all whitespace-nowrap">
          Болих
        </button>

        <ProgressBar value={progress} className="flex-1" />

        <span className="text-[13px] font-extrabold text-ink-muted whitespace-nowrap">
          {idx + 1} / {questions.length}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span
          className={cn(
            "inline-block text-[12px] font-extrabold px-4 py-1.5 rounded-2xl",
            diff.cls,
          )}>
          {diff.label}
        </span>

        {loadingRemote && (
          <span className="text-[11px] font-bold text-sky-300 ml-auto">
            Шинэчилж байна...
          </span>
        )}
      </div>

      {q.mg && (
        <div className="flex justify-center mb-4">
          <div className="bg-white border-2 border-paper-100 rounded-2xl px-6 py-5 inline-flex">
            <MongolianText size="xl" color="#c97b2a">
              {q.mg}
            </MongolianText>
          </div>
        </div>
      )}

      <p className="text-[20px] font-extrabold text-center leading-snug mb-6">
        {q.q}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {q.opts.map((opt, i) => (
          <button
            key={i}
            onClick={() => answer(i)}
            disabled={!!Object.keys(optStates).length}
            className={cn(
              "bg-white border-[2.5px] border-paper-100 rounded-2xl py-6 px-4 flex items-center justify-center min-h-[120px] text-[14px] font-bold transition-all",
              !Object.keys(optStates).length &&
                "hover:border-sky-100 hover:bg-sky-50 hover:-translate-y-0.5",
              optStates[i] === "ok" &&
                "border-grass-300 bg-grass-50 animate-pop",
              optStates[i] === "bad" &&
                "border-ember-300 bg-ember-50 animate-wobble",
            )}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
