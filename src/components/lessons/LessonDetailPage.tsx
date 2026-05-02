"use client";

import { AppContainer } from "@/components/layout/AppContainer";
import {
  IconArrowL,
  IconAward,
  IconBook,
  IconCheck,
  IconGlobe,
  IconLayers,
  IconLock,
  IconPen,
  IconTarget,
} from "@/components/ui/Icons";
import { MongolianKeyboard } from "@/components/ui/MongolianKeyboard";
import { MongolianText } from "@/components/ui/MongolianText";
import { PageHero } from "@/components/ui/PageHero";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { getLevelMeta } from "@/lib/data";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { LessonId } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

interface LessonItem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  grade: number;
  level: number;
  sortOrder: number;
  content: string;
  status: "DRAFT" | "PUBLISHED";
}

interface GuidedExample {
  script: string;
  cyrillic: string;
  note?: string;
}

interface GuidedTask {
  prompt: string;
  answer: string;
  hint?: string;
}

interface FillActivityItem {
  before: string;
  answer: string;
  after: string;
  translation: string;
  choices: string[];
}

interface SortActivityItem {
  words: string[];
  translation: string;
}

interface Point {
  x: number;
  y: number;
}

interface DrawingReview {
  score: number;
  label: "Сайн" | "Дундаж" | "Дахин оролд";
  message: string;
}

type ExerciseItem =
  | {
      id: string;
      type: "chooseMeaning";
      prompt: string;
      example: GuidedExample;
      options: string[];
      answer: string;
    }
  | {
      id: string;
      type: "chooseScript";
      prompt: string;
      example: GuidedExample;
      options: string[];
      answer: string;
    }
  | {
      id: string;
      type: "trueFalse";
      prompt: string;
      example: GuidedExample;
      shownMeaning: string;
      options: string[];
      answer: string;
    }
  | {
      id: string;
      type: "chooseNote";
      prompt: string;
      example: GuidedExample;
      options: string[];
      answer: string;
    };

interface GuidedLessonContent {
  version: number;
  intro: string;
  keyPoints: string[];
  examples: GuidedExample[];
  tasks: GuidedTask[];
  wrapUp?: string;
  activities: {
    matchGame: boolean;
    fillGame: boolean;
    sortGame: boolean;
    copyPractice: boolean;
    writeCheck: boolean;
    matchTitle: string;
    matchInstruction: string;
    fillTitle: string;
    fillInstruction: string;
    sortTitle: string;
    sortInstruction: string;
    copyTitle: string;
    copyInstruction: string;
    matchItems: GuidedExample[];
    fillItems: FillActivityItem[];
    sortItems: SortActivityItem[];
    copyItems: GuidedExample[];
    exerciseItems: {
      type: "chooseMeaning" | "chooseScript" | "trueFalse" | "chooseNote";
      prompt: string;
      script: string;
      answer: string;
      options: string[];
      note?: string;
    }[];
  };
}

const FREE_LESSON_SLUGS = ["vowels"];
const GUIDED_LESSON_VERSION = 1;
const MONGOLIAN_SCRIPT_RE = /[\u1800-\u18AF]/;

function parseGuidedLessonContent(content: string): GuidedLessonContent | null {
  try {
    const parsed = JSON.parse(content) as Partial<GuidedLessonContent>;

    if (parsed.version !== GUIDED_LESSON_VERSION) return null;
    if (typeof parsed.intro !== "string") return null;

    return {
      version: GUIDED_LESSON_VERSION,
      intro: parsed.intro,
      keyPoints: Array.isArray(parsed.keyPoints)
        ? parsed.keyPoints.filter((item): item is string => typeof item === "string")
        : [],
      examples: Array.isArray(parsed.examples)
        ? parsed.examples
            .map((item) => item as Partial<GuidedExample>)
            .filter(
              (item): item is GuidedExample =>
                typeof item.script === "string" &&
                typeof item.cyrillic === "string",
            )
        : [],
      tasks: Array.isArray(parsed.tasks)
        ? parsed.tasks
            .map((item) => item as Partial<GuidedTask>)
            .filter(
              (item): item is GuidedTask =>
                typeof item.prompt === "string" &&
                typeof item.answer === "string",
            )
        : [],
      wrapUp: typeof parsed.wrapUp === "string" ? parsed.wrapUp : "",
      activities: {
        matchGame:
          (parsed as Partial<GuidedLessonContent>).activities?.matchGame ?? true,
        fillGame:
          (parsed as Partial<GuidedLessonContent>).activities?.fillGame ?? true,
        sortGame:
          (parsed as Partial<GuidedLessonContent>).activities?.sortGame ?? true,
        copyPractice:
          (parsed as Partial<GuidedLessonContent>).activities?.copyPractice ??
          true,
        writeCheck:
          (parsed as Partial<GuidedLessonContent>).activities?.writeCheck ?? true,
        matchTitle:
          (parsed as Partial<GuidedLessonContent>).activities?.matchTitle ??
          "Бичгийг утгатай нь тааруул",
        matchInstruction:
          (parsed as Partial<GuidedLessonContent>).activities?.matchInstruction ??
          "Босоо бичгийг хараад зөв кирилл утгыг сонгоорой.",
        fillTitle:
          (parsed as Partial<GuidedLessonContent>).activities?.fillTitle ??
          "Хоосон зай нөхөх",
        fillInstruction:
          (parsed as Partial<GuidedLessonContent>).activities?.fillInstruction ??
          "Кирилл утгыг уншаад зөв бичгийг сонго.",
        sortTitle:
          (parsed as Partial<GuidedLessonContent>).activities?.sortTitle ??
          "Үгсийг дарааллаар өрөх",
        sortInstruction:
          (parsed as Partial<GuidedLessonContent>).activities?.sortInstruction ??
          "Доорх үгсийг дарааллаар нь сонгож мөр бүтээ.",
        copyTitle:
          (parsed as Partial<GuidedLessonContent>).activities?.copyTitle ??
          "Хуулж бичээд шалга",
        copyInstruction:
          (parsed as Partial<GuidedLessonContent>).activities?.copyInstruction ??
          "Загварыг хараад keyboard-оор өөрөө хуулж бичнэ.",
        matchItems: Array.isArray(
          (parsed as Partial<GuidedLessonContent>).activities?.matchItems,
        )
          ? (parsed as GuidedLessonContent).activities.matchItems
          : [],
        fillItems: Array.isArray(
          (parsed as Partial<GuidedLessonContent>).activities?.fillItems,
        )
          ? (parsed as GuidedLessonContent).activities.fillItems
          : [],
        sortItems: Array.isArray(
          (parsed as Partial<GuidedLessonContent>).activities?.sortItems,
        )
          ? (parsed as GuidedLessonContent).activities.sortItems
          : [],
        copyItems: Array.isArray(
          (parsed as Partial<GuidedLessonContent>).activities?.copyItems,
        )
          ? (parsed as GuidedLessonContent).activities.copyItems
          : [],
        exerciseItems: Array.isArray(
          (parsed as Partial<GuidedLessonContent>).activities?.exerciseItems,
        )
          ? (parsed as GuidedLessonContent).activities.exerciseItems
          : [],
      },
    };
  } catch {
    return null;
  }
}

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatPlainContent(content: string) {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map(
      (line) =>
        `<p class="text-[15px] text-[#6a6a8a] font-semibold leading-[1.9] mb-4">${escapeHtml(line)}</p>`,
    )
    .join("");
}

function hasMongolianScript(value: string) {
  return MONGOLIAN_SCRIPT_RE.test(value);
}

function calculateDirectionChanges(points: Point[]) {
  if (points.length < 4) return 0;

  let changes = 0;
  let prevAngle: number | null = null;

  for (let i = 2; i < points.length; i += 3) {
    const prev = points[i - 2];
    const current = points[i];
    const dx = current.x - prev.x;
    const dy = current.y - prev.y;

    if (Math.abs(dx) + Math.abs(dy) < 2) continue;

    const angle = Math.atan2(dy, dx);

    if (prevAngle !== null) {
      let diff = Math.abs(angle - prevAngle);
      if (diff > Math.PI) diff = Math.PI * 2 - diff;
      if (diff > 1.25) changes++;
    }

    prevAngle = angle;
  }

  return changes;
}

function LessonDrawingTask({
  task,
  index,
  result,
  onResult,
}: {
  task: GuidedTask;
  index: number;
  result?: "correct" | "wrong";
  onResult: (result: "correct" | "wrong") => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [review, setReview] = useState<DrawingReview | null>(null);

  useEffect(() => {
    drawCanvas();
  }, [strokes, currentStroke]);

  function getPos(
    event:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement,
  ) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in event) {
      return {
        x: (event.touches[0].clientX - rect.left) * scaleX,
        y: (event.touches[0].clientY - rect.top) * scaleY,
      };
    }

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  function drawCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(232,224,208,0.52)";
    ctx.lineWidth = 1;

    for (let x = 0; x <= canvas.width; x += 42) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    for (let y = 0; y <= canvas.height; y += 42) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(26,107,189,0.13)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([7, 7]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    [...strokes, currentStroke].forEach((stroke) => {
      if (stroke.length < 2) return;

      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);

      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }

      ctx.strokeStyle = "#1a6bbd";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    });
  }

  function startDraw(
    event:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) {
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    setReview(null);
    setIsDrawing(true);
    setCurrentStroke([getPos(event, canvas)]);
  }

  function draw(
    event:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) {
    event.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    setCurrentStroke((prev) => [...prev, getPos(event, canvas)]);
  }

  function endDraw(
    event?:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) {
    event?.preventDefault();
    if (!isDrawing) return;

    setIsDrawing(false);

    if (currentStroke.length > 1) {
      setStrokes((prev) => [...prev, currentStroke]);
    }

    setCurrentStroke([]);
  }

  function clearCanvas() {
    setReview(null);
    setStrokes([]);
    setCurrentStroke([]);
    onResult("wrong");
  }

  function undoStroke() {
    setReview(null);
    setStrokes((prev) => prev.slice(0, -1));
  }

  function checkDrawing() {
    const canvas = canvasRef.current;
    const points = strokes.flat();

    if (!canvas || points.length < 2) {
      const emptyReview: DrawingReview = {
        score: 0,
        label: "Дахин оролд",
        message: "Эхлээд талбар дээр загвараа дагаж зурна уу.",
      };
      setReview(emptyReview);
      onResult("wrong");
      return;
    }

    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const width = Math.max(Math.max(...xs) - Math.min(...xs), 1);
    const height = Math.max(Math.max(...ys) - Math.min(...ys), 1);
    const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
    const verticalRatio = height / width;
    const centerOffset = Math.abs(centerX - canvas.width / 2);

    let totalLength = 0;
    strokes.forEach((stroke) => {
      for (let i = 1; i < stroke.length; i++) {
        const dx = stroke[i].x - stroke[i - 1].x;
        const dy = stroke[i].y - stroke[i - 1].y;
        totalLength += Math.sqrt(dx * dx + dy * dy);
      }
    });

    const mainVerticalStroke = strokes.some((stroke) => {
      if (stroke.length < 2) return false;
      const first = stroke[0];
      const last = stroke[stroke.length - 1];
      const dx = Math.abs(last.x - first.x);
      const dy = Math.abs(last.y - first.y);
      return dy >= 70 && dy >= dx * 0.75;
    });

    let score = 0;
    const tips: string[] = [];

    if (points.length >= 45) score += 18;
    else if (points.length >= 24) score += 10;
    else tips.push("зураас арай богино байна");

    if (verticalRatio >= 1.4) score += 18;
    else if (verticalRatio >= 1.05) score += 9;
    else tips.push("босоо хэлбэрээ уртасгаарай");

    if (mainVerticalStroke) score += 18;
    else tips.push("дээрээс доош үндсэн хөдөлгөөнөө тод болго");

    if (centerOffset <= 70) score += 14;
    else if (centerOffset <= 110) score += 7;
    else tips.push("дунд шугамдаа ойр бичээрэй");

    if (height >= 90 && height <= 340) score += 12;
    else tips.push("үсгийн өндөр талбарт тохирохгүй байна");

    if (width <= 240) score += 10;
    else tips.push("хэт өргөн бичсэн байна");

    if (totalLength >= 90 && totalLength <= 1200) score += 10;
    else if (totalLength < 90) tips.push("зураас хэт богино байна");
    else tips.push("хэт олон илүү хөдөлгөөн байна");

    if (calculateDirectionChanges(points) > 36) {
      score = Math.min(score, 58);
      tips.push("зураас хэт замбараагүй байна");
    }

    score = Math.max(0, Math.min(100, Math.round(score)));

    const nextReview: DrawingReview =
      score >= 75
        ? {
            score,
            label: "Сайн",
            message: "Загварын дагуу боломжийн сайн зурсан байна.",
          }
        : score >= 55
          ? {
              score,
              label: "Дундаж",
              message: tips[0] ?? "Боломжийн байна. Дахин нэг цэвэрлээд үз.",
            }
          : {
              score,
              label: "Дахин оролд",
              message:
                tips.slice(0, 2).join(", ") ||
                "Загварын дагуу дээрээс доош дахин зурж үзээрэй.",
            };

    setReview(nextReview);
    onResult(nextReview.label === "Дахин оролд" ? "wrong" : "correct");
  }

  return (
    <div
      className={cn(
        "border-2 rounded-3xl overflow-hidden transition-all bg-white",
        result === "correct"
          ? "border-grass-100"
          : result === "wrong"
            ? "border-ember-100"
            : "border-paper-100",
      )}>
      <div className="bg-paper-50 border-b-2 border-paper-100 px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-black text-sky-300 uppercase tracking-[1.5px]">
            Зурах дасгал {index + 1}
          </p>
          <p className="text-[15px] font-black text-ink mt-0.5">
            {task.prompt}
          </p>
          {task.hint && (
            <p className="text-[12px] font-semibold text-ink-muted mt-1">
              {task.hint}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={undoStroke}
            disabled={strokes.length === 0}
            className="text-[12px] font-bold text-ink-muted hover:text-ink disabled:opacity-30 px-3 py-2 rounded-xl hover:bg-paper-100 transition-all">
            Буцаах
          </button>
          <button
            type="button"
            onClick={clearCanvas}
            className="text-[12px] font-bold text-ember-300 hover:bg-ember-50 px-3 py-2 rounded-xl transition-all">
            Арилгах
          </button>
        </div>
      </div>

      <div className="relative bg-[#fffef9]">
        <div className="absolute inset-0 pointer-events-none z-[1] flex items-center justify-center overflow-hidden">
          <span
            className="font-mongolian text-sand-300/20"
            style={{
              writingMode: "vertical-lr",
              fontSize: task.answer.length > 1 ? 128 : 170,
              lineHeight: 1,
            }}>
            {task.answer}
          </span>
        </div>

        <canvas
          ref={canvasRef}
          width={900}
          height={420}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
          className="relative z-[2] block w-full h-[360px] md:h-[420px] cursor-crosshair touch-none"
        />
      </div>

      <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-14 h-16 bg-sand-50 border border-sand-100 rounded-2xl flex items-center justify-center">
            <span
              className="font-mongolian text-sand-300"
              style={{ writingMode: "vertical-lr", fontSize: 28 }}>
              {task.answer}
            </span>
          </span>
          <div>
            <p className="text-[12px] font-black text-ink">Зөв загвар</p>
            <p className="text-[11px] font-semibold text-ink-muted">
              Дээрээс доош, дунд шугамаа дагаж зурна.
            </p>
            {review && (
              <p
                className={cn(
                  "text-[12px] font-extrabold mt-1",
                  review.label === "Дахин оролд"
                    ? "text-ember-300"
                    : "text-grass-300",
                )}>
                {review.label} · {review.score}% · {review.message}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={checkDrawing}
          className="bg-sky-300 text-white font-extrabold text-[13px] px-6 py-3 rounded-2xl hover:bg-sky-200 transition-all">
          Шалгах
        </button>
      </div>
    </div>
  );
}

const LEVEL_TONE_MAP = {
  sky: "bg-sky-50 border-sky-100 text-sky-300",
  grass: "bg-grass-50 border-grass-100 text-grass-300",
  sand: "bg-sand-50 border-sand-100 text-sand-300",
  ember: "bg-ember-50 border-ember-100 text-ember-300",
  purple: "bg-[#f1ecfb] border-[#d8c8f1] text-[#7c5cbf]",
  teal: "bg-[#e6f7f4] border-[#b9e6df] text-[#1a9e8a]",
} as const;

function LevelIcon({ icon, size = 16 }: { icon: string; size?: number }) {
  const props = { size, strokeWidth: 2.2 };

  if (icon === "layers") return <IconLayers {...props} />;
  if (icon === "pen") return <IconPen {...props} />;
  if (icon === "target") return <IconTarget {...props} />;
  if (icon === "award") return <IconAward {...props} />;
  if (icon === "globe") return <IconGlobe {...props} />;
  return <IconBook {...props} />;
}

export function LessonDetailPage({ slug }: { slug: string }) {
  const router = useRouter();
  const {
    isLoggedIn,
    openAuthModal,
    setLesson,
    startQuiz,
    userId,
  } = useAppStore();

  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [taskInputs, setTaskInputs] = useState<Record<number, string>>({});
  const [taskResults, setTaskResults] = useState<
    Record<number, "correct" | "wrong">
  >({});
  const [recognitionAnswers, setRecognitionAnswers] = useState<
    Record<number, string>
  >({});
  const [matchAnswers, setMatchAnswers] = useState<Record<number, string>>({});
  const [fillAnswers, setFillAnswers] = useState<Record<number, string>>({});
  const [sortAnswer, setSortAnswer] = useState<string[]>([]);
  const [copyInputs, setCopyInputs] = useState<Record<number, string>>({});
  const [copyResults, setCopyResults] = useState<Record<number, "correct" | "wrong">>(
    {},
  );
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [exerciseAnswers, setExerciseAnswers] = useState<Record<string, string>>(
    {},
  );
  const [exerciseResults, setExerciseResults] = useState<
    Record<string, "correct" | "wrong">
  >({});
  const [activeLessonTab, setActiveLessonTab] = useState<
    "learn" | "examples" | "games" | "write"
  >("learn");

  useEffect(() => {
    async function loadLesson() {
      try {
        setLoading(true);
        setErrorMsg("");
        const res = await fetch("/api/lessons", { cache: "no-store" });
        if (!res.ok) throw new Error("Хичээлийг ачаалж чадсангүй.");
        const data = await res.json();
        setLessons(Array.isArray(data) ? data : []);
      } catch (error) {
        setErrorMsg(error instanceof Error ? error.message : "Алдаа гарлаа.");
      } finally {
        setLoading(false);
      }
    }

    loadLesson();
  }, []);

  const lesson = useMemo(
    () => lessons.find((item) => item.slug === slug) ?? null,
    [lessons, slug],
  );

  const guidedLesson = useMemo(
    () => (lesson ? parseGuidedLessonContent(lesson.content) : null),
    [lesson],
  );

  useEffect(() => {
    setTaskInputs({});
    setTaskResults({});
    setRecognitionAnswers({});
    setMatchAnswers({});
    setFillAnswers({});
    setSortAnswer([]);
    setCopyInputs({});
    setCopyResults({});
    setExerciseIndex(0);
    setExerciseAnswers({});
    setExerciseResults({});
  }, [lesson?.id]);

  const siblingLessons = useMemo(
    () =>
      lesson
        ? lessons.filter(
            (item) => item.level === lesson.level,
          )
        : [],
    [lesson, lessons],
  );

  const levelMeta = lesson ? getLevelMeta(lesson.level) : getLevelMeta(1);
  const levelTone =
    LEVEL_TONE_MAP[levelMeta.tone as keyof typeof LEVEL_TONE_MAP] ??
    LEVEL_TONE_MAP.sky;

  const isFree = lesson ? FREE_LESSON_SLUGS.includes(lesson.slug) : false;
  const canAccess = isLoggedIn || isFree;
  const matchItems =
    guidedLesson?.activities.matchGame
      ? (guidedLesson.activities.matchItems.length
          ? guidedLesson.activities.matchItems
          : guidedLesson.examples
        ).slice(0, 4)
      : [];
  const fillItems =
    guidedLesson?.activities.fillGame
      ? guidedLesson.activities.fillItems.length
        ? guidedLesson.activities.fillItems
        : guidedLesson.examples.slice(0, 3).map((example) => ({
            before: "",
            answer: example.script,
            after: "",
            translation: example.cyrillic,
            choices: [example.script],
          }))
      : [];
  const sortGame = guidedLesson?.activities.sortGame
    ? guidedLesson.activities.sortItems[0] ??
      (guidedLesson.examples.length >= 2
        ? {
            words: guidedLesson.examples.slice(0, 3).map((item) => item.script),
            translation: guidedLesson.examples
              .slice(0, 3)
              .map((item) => item.cyrillic)
              .join(" "),
          }
        : null)
    : null;
  const sortWords = sortGame?.words ?? [];
  const sortPool = useMemo(
    () => sortWords.slice().reverse(),
    [sortWords],
  );
  const copyItems: GuidedExample[] = [];
  const completedMatches = matchItems.filter(
    (example, index) => matchAnswers[index] === example.cyrillic,
  ).length;
  const completedFills = fillItems.filter(
    (item, index) => fillAnswers[index] === item.answer,
  ).length;
  const sortCorrect =
    sortWords.length > 0 && JSON.stringify(sortAnswer) === JSON.stringify(sortWords);
  const completedCopies = copyItems.filter(
    (example, index) => copyResults[index] === "correct",
  ).length;
  const recognitionItems = (guidedLesson?.examples ?? []).slice(0, 6);
  const completedRecognition = recognitionItems.filter(
    (example, index) => recognitionAnswers[index] === example.cyrillic,
  ).length;
  const exerciseItems = useMemo<ExerciseItem[]>(() => {
    if (!guidedLesson) return [];

    const examples = guidedLesson.examples;

    if (guidedLesson.activities.exerciseItems.length > 0) {
      return guidedLesson.activities.exerciseItems.map((item, index) => {
        const example: GuidedExample = {
          script: item.script,
          cyrillic: item.answer,
          note: item.note ?? "",
        };
        const options = item.options.length
          ? item.options
          : item.type === "trueFalse"
            ? ["Тийм", "Үгүй"]
            : [item.answer];

        if (item.type === "chooseScript") {
          return {
            id: `custom-script-${index}`,
            type: "chooseScript",
            prompt: item.prompt,
            example,
            options,
            answer: item.answer,
          };
        }

        if (item.type === "trueFalse") {
          return {
            id: `custom-true-false-${index}`,
            type: "trueFalse",
            prompt: item.prompt,
            example,
            shownMeaning: item.note || item.answer,
            options,
            answer: item.answer,
          };
        }

        if (item.type === "chooseNote") {
          return {
            id: `custom-note-${index}`,
            type: "chooseNote",
            prompt: item.prompt,
            example,
            options,
            answer: item.answer,
          };
        }

        return {
          id: `custom-meaning-${index}`,
          type: "chooseMeaning",
          prompt: item.prompt,
          example,
          options,
          answer: item.answer,
        };
      });
    }

    function textOptions(correct: string, index: number) {
      const others = examples
        .map((example) => example.cyrillic)
        .filter((item) => item && item !== correct)
        .slice()
        .sort((a, b) => {
          const aScore = (a.charCodeAt(0) || 0) + index * 17;
          const bScore = (b.charCodeAt(0) || 0) + index * 17;
          return (aScore % 11) - (bScore % 11);
        })
        .slice(0, 3);

      return [correct, ...others].filter(Boolean).sort((a, b) => {
        const aScore = (a.charCodeAt(a.length - 1) || 0) + index * 7;
        const bScore = (b.charCodeAt(b.length - 1) || 0) + index * 7;
        return (aScore % 5) - (bScore % 5);
      });
    }

    function scriptOptions(correct: string, index: number) {
      const others = examples
        .map((example) => example.script)
        .filter((item) => item && item !== correct)
        .slice()
        .sort((a, b) => {
          const aScore = (a.charCodeAt(0) || 0) + index * 19;
          const bScore = (b.charCodeAt(0) || 0) + index * 19;
          return (aScore % 13) - (bScore % 13);
        })
        .slice(0, 3);

      return [correct, ...others].filter(Boolean).sort((a, b) => {
        const aScore = (a.charCodeAt(a.length - 1) || 0) + index * 5;
        const bScore = (b.charCodeAt(b.length - 1) || 0) + index * 5;
        return (aScore % 7) - (bScore % 7);
      });
    }

    const chooseMeaning = examples.slice(0, 5).map((example, index) => ({
      id: `meaning-${index}`,
      type: "chooseMeaning" as const,
      prompt: "Энэ бичгийн кирилл утгыг сонго.",
      example,
      options: textOptions(example.cyrillic, index),
      answer: example.cyrillic,
    }));

    const chooseScript = examples.slice(0, 4).map((example, index) => ({
      id: `script-${index}`,
      type: "chooseScript" as const,
      prompt: `"${example.cyrillic}" гэсэн утгатай бичгийг сонго.`,
      example,
      options: scriptOptions(example.script, index),
      answer: example.script,
    }));

    const trueFalse = examples.slice(0, 4).map((example, index) => {
      const shouldMatch = index % 2 === 0;
      const shownMeaning = shouldMatch
        ? example.cyrillic
        : examples[(index + 1) % examples.length]?.cyrillic || example.cyrillic;

      return {
        id: `true-false-${index}`,
        type: "trueFalse" as const,
        prompt: "Энэ бичиг доорх утгатай таарч байна уу?",
        example,
        shownMeaning,
        options: ["Тийм", "Үгүй"],
        answer: shouldMatch ? "Тийм" : "Үгүй",
      };
    });

    const noteOptions = Array.from(
      new Set(
        examples
          .map((example) => example.note)
          .filter((note): note is string => Boolean(note)),
      ),
    );
    const chooseNote = examples
      .filter((example) => example.note)
      .slice(0, 5)
      .map((example, index) => ({
        id: `note-${index}`,
        type: "chooseNote" as const,
        prompt: "Энэ жишээ ямар тайлбартай вэ?",
        example,
        options: [example.note || "", ...noteOptions.filter((note) => note !== example.note)]
          .filter(Boolean)
          .slice(0, 4)
          .sort((a, b) => {
            const aScore = (a.charCodeAt(0) || 0) + index * 3;
            const bScore = (b.charCodeAt(0) || 0) + index * 3;
            return (aScore % 7) - (bScore % 7);
          }),
        answer: example.note || "",
      }));

    return [...chooseMeaning, ...chooseScript, ...trueFalse, ...chooseNote];
  }, [guidedLesson]);
  const currentExercise =
    exerciseItems[Math.min(exerciseIndex, Math.max(exerciseItems.length - 1, 0))];
  const completedExercises = exerciseItems.filter(
    (item) => exerciseResults[item.id] === "correct",
  ).length;
  const totalTasks = exerciseItems.length;
  const completedTasks = completedExercises;
  const lessonProgress =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;
  const canStartQuiz = totalTasks === 0 || completedTasks === totalTasks;
  const hasGames =
    matchItems.length >= 2 ||
    fillItems.length >= 2 ||
    sortWords.length >= 2 ||
    copyItems.length > 0;
  const hasWriting =
    exerciseItems.length > 0 ||
    !!guidedLesson?.wrapUp;
  const lessonTabs = [
    { key: "learn", label: "Сурах", enabled: !!guidedLesson },
    {
      key: "examples",
      label: "Жишээ",
      enabled: (guidedLesson?.examples.length ?? 0) > 0,
    },
    { key: "games", label: "Тоглоом", enabled: hasGames },
    { key: "write", label: "Дасгал", enabled: hasWriting },
  ].filter((tab) => tab.enabled) as {
    key: "learn" | "examples" | "games" | "write";
    label: string;
    enabled: boolean;
  }[];

  useEffect(() => {
    if (!lessonTabs.some((tab) => tab.key === activeLessonTab)) {
      setActiveLessonTab(lessonTabs[0]?.key ?? "learn");
    }
  }, [activeLessonTab, lessonTabs]);

  function getMatchOptions(index: number) {
    if (!matchItems.length) return [];

    const correct = matchItems[index]?.cyrillic;
    const base = matchItems
      .map((example) => example.cyrillic)
      .filter(Boolean);
    const unique = Array.from(new Set(base)).filter((item) => item !== correct);

    const options = unique
      .slice()
      .sort((a, b) => {
        const aScore = (a.charCodeAt(0) || 0) + index * 17;
        const bScore = (b.charCodeAt(0) || 0) + index * 17;
        return (aScore % 7) - (bScore % 7);
      })
      .slice(0, 3);

    return [correct, ...options].filter(Boolean).sort((a, b) => {
      const aScore = (a.charCodeAt(a.length - 1) || 0) + index * 11;
      const bScore = (b.charCodeAt(b.length - 1) || 0) + index * 11;
      return (aScore % 5) - (bScore % 5);
    });
  }

  function getRecognitionOptions(index: number) {
    if (!recognitionItems.length) return [];

    const correct = recognitionItems[index]?.cyrillic;
    const options = recognitionItems
      .map((example) => example.cyrillic)
      .filter((item) => item && item !== correct)
      .slice()
      .sort((a, b) => {
        const aScore = (a.charCodeAt(0) || 0) + index * 13;
        const bScore = (b.charCodeAt(0) || 0) + index * 13;
        return (aScore % 9) - (bScore % 9);
      })
      .slice(0, 3);

    return [correct, ...options].filter(Boolean).sort((a, b) => {
      const aScore = (a.charCodeAt(a.length - 1) || 0) + index * 7;
      const bScore = (b.charCodeAt(b.length - 1) || 0) + index * 7;
      return (aScore % 5) - (bScore % 5);
    });
  }

  function answerExercise(exercise: ExerciseItem, answer: string) {
    const isCorrect = answer === exercise.answer;

    setExerciseAnswers((prev) => ({
      ...prev,
      [exercise.id]: answer,
    }));
    setExerciseResults((prev) => ({
      ...prev,
      [exercise.id]: isCorrect ? "correct" : "wrong",
    }));
  }

  function goNextExercise() {
    setExerciseIndex((prev) => Math.min(prev + 1, exerciseItems.length - 1));
  }

  function restartExercises() {
    setExerciseIndex(0);
    setExerciseAnswers({});
    setExerciseResults({});
  }

  async function syncStartProgress() {
    if (!isLoggedIn || !userId || !lesson) return;

    await fetch("/api/lesson-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "start",
        userId,
        lessonId: lesson.id,
      }),
    }).catch(() => {});
  }

  function checkTask(task: GuidedTask, index: number) {
    const isCorrect =
      normalizeAnswer(taskInputs[index] ?? "") === normalizeAnswer(task.answer);

    setTaskResults((prev) => ({
      ...prev,
      [index]: isCorrect ? "correct" : "wrong",
    }));
  }

  function addSortWord(word: string) {
    if (sortAnswer.includes(word)) return;
    setSortAnswer((prev) => [...prev, word]);
  }

  function removeSortWord(word: string) {
    setSortAnswer((prev) => prev.filter((item) => item !== word));
  }

  function checkCopy(example: GuidedExample, index: number) {
    const isCorrect =
      normalizeAnswer(copyInputs[index] ?? "") ===
      normalizeAnswer(example.script);

    setCopyResults((prev) => ({
      ...prev,
      [index]: isCorrect ? "correct" : "wrong",
    }));
  }

  async function startLessonQuiz() {
    if (!lesson || !canStartQuiz) return;

    await syncStartProgress();
    setLesson(lesson.slug as LessonId);
    startQuiz(lesson.slug, true, {
      lessonSlug: lesson.slug,
      requireDatabase: true,
    });
    router.push("/quiz");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-paper">
        <PageHero
          eyebrow="Хичээл"
          title="Ачаалж байна"
          description="Хичээлийн мэдээллийг бэлтгэж байна."
          mongolText="ᠬᠢᠴᠢᠶᠡᠯ"
          variant="sky"
        />
      </div>
    );
  }

  if (errorMsg || !lesson) {
    return (
      <div className="min-h-screen bg-paper">
        <PageHero
          eyebrow="Хичээл"
          title="Хичээл олдсонгүй"
          description={errorMsg || "Энэ хичээл нийтлэгдээгүй эсвэл устсан байна."}
          mongolText="ᠬᠢᠴᠢᠶᠡᠯ"
          variant="ember"
        />
        <AppContainer size="6xl" className="py-10">
          <button
            onClick={() => router.push("/lessons")}
            className="bg-white border-2 border-paper-100 text-ink font-extrabold text-[14px] px-5 py-3 rounded-2xl hover:border-sky-100 transition-all">
            Хичээлүүд рүү буцах
          </button>
        </AppContainer>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-paper">
        <PageHero
          eyebrow={levelMeta.title}
          title={lesson.title}
          description="Энэ хичээлийг үзэхийн тулд нэвтрэх шаардлагатай."
          mongolText="ᠬᠢᠴᠢᠶᠡᠯ"
          variant="sky"
        />
        <AppContainer size="6xl" className="py-10">
          <div className="bg-white border-2 border-paper-100 rounded-3xl p-10 text-center">
            <IconLock size={32} color="#6a6a8a" className="mx-auto mb-4" />
            <h2 className="text-[24px] font-black mb-2">{lesson.title}</h2>
            <p className="text-[14px] text-ink-muted font-semibold mb-6">
              Нэвтэрсний дараа хичээлээ үзэж, даалгавар хийж, шалгалтаа өгнө.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => openAuthModal("up")}
                className="bg-sky-300 text-white font-extrabold text-[14px] px-6 py-3 rounded-2xl hover:bg-sky-200 transition-all">
                Бүртгүүлэх
              </button>
              <button
                onClick={() => openAuthModal("in")}
                className="bg-white border-2 border-paper-100 text-ink font-extrabold text-[14px] px-6 py-3 rounded-2xl hover:border-sky-100 transition-all">
                Нэвтрэх
              </button>
            </div>
          </div>
        </AppContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <PageHero
        eyebrow={`${levelMeta.title} · ${levelMeta.subtitle}`}
        title={lesson.title}
        description={
          lesson.description ||
          "Алхам алхмаар уншиж, бичиж, шалгалтаар бататгах хичээл."
        }
        mongolText="ᠬᠢᠴᠢᠶᠡᠯ"
        variant="sky"
      />

      <AppContainer size="7xl" className="py-6 pb-14">
        <div className="grid grid-cols-[260px_1fr] gap-8">
          <aside className="hidden lg:block">
            <div className="sticky top-24 flex flex-col gap-4">
              <button
                onClick={() => router.push("/lessons")}
                className="bg-white border-2 border-paper-100 text-ink font-extrabold text-[13px] px-4 py-3 rounded-2xl hover:border-sky-100 transition-all flex items-center gap-2">
                <IconArrowL size={15} strokeWidth={2.2} />
                Бүх хичээл
              </button>

              <div className="bg-white border-2 border-paper-100 rounded-3xl p-5">
                <div className={cn("border rounded-2xl px-3 py-2 mb-3", levelTone)}>
                  <div className="flex items-center gap-2">
                    <LevelIcon icon={levelMeta.icon} size={15} />
                    <p className="text-[12px] font-extrabold">
                      {levelMeta.title}
                    </p>
                  </div>
                  <p className="text-[11px] font-semibold opacity-80 mt-1">
                    {levelMeta.subtitle}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {siblingLessons.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => router.push(`/lessons/${item.slug}`)}
                      className={cn(
                        "text-left rounded-2xl px-3 py-2.5 text-[13px] font-bold transition-all",
                        item.slug === lesson.slug
                          ? "bg-sky-50 text-sky-300 border border-sky-100"
                          : "text-ink-muted hover:bg-paper-50 hover:text-ink",
                      )}>
                      {item.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white border-2 border-paper-100 rounded-3xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[12px] font-extrabold text-ink">
                    Даалгаврын явц
                  </p>
                  <span className="text-[12px] font-black text-grass-300">
                    {lessonProgress}%
                  </span>
                </div>
                <ProgressBar value={lessonProgress} />
                <p className="text-[11px] text-ink-muted font-semibold mt-3">
                  {completedTasks}/{totalTasks || 0} даалгавар зөв
                </p>
              </div>
            </div>
          </aside>

          <main className="min-w-0">
            <ScrollReveal>
              <div className="bg-white border-2 border-paper-100 rounded-3xl p-5 md:p-6 mb-5">
                {guidedLesson ? (
                  <div className="flex flex-col gap-5">
                    {lessonTabs.length > 1 && (
                      <div className="sticky top-3 z-10 bg-white/95 backdrop-blur border-2 border-paper-100 rounded-2xl p-2 flex flex-wrap gap-2">
                        {lessonTabs.map((tab) => (
                          <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveLessonTab(tab.key)}
                            className={cn(
                              "flex-1 min-w-[112px] rounded-xl px-4 py-3 text-[13px] font-black transition-all",
                              activeLessonTab === tab.key
                                ? "bg-sky-300 text-white"
                                : "bg-paper-50 text-ink-muted hover:bg-sky-50 hover:text-sky-300",
                            )}>
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {activeLessonTab === "learn" && (
                      <section className="grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-4 items-stretch">
                        <div className="rounded-3xl bg-sky-50 border-2 border-sky-100 p-5">
                          <p className="text-[11px] font-extrabold text-sky-300 uppercase tracking-[2px] mb-2">
                            Өнөөдрийн зорилго
                          </p>
                          <h2 className="text-[22px] font-black text-ink mb-2">
                            Юу сурах вэ?
                          </h2>
                          <p className="text-[15px] text-ink-muted font-semibold leading-[1.8]">
                            {guidedLesson.intro}
                          </p>

                          {guidedLesson.keyPoints.length > 0 && (
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                              {guidedLesson.keyPoints.map((point, index) => (
                                <div
                                  key={`${point}-${index}`}
                                  className="bg-white border border-sky-100 rounded-2xl p-3 flex gap-3">
                                  <span className="w-7 h-7 rounded-xl bg-sky-50 border border-sky-100 text-sky-300 text-[11px] font-black flex items-center justify-center shrink-0">
                                    {index + 1}
                                  </span>
                                  <p className="text-[13px] text-ink-muted font-semibold leading-[1.7]">
                                    {point}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="rounded-3xl bg-white border-2 border-paper-100 p-5 flex flex-col items-center justify-center min-h-[220px]">
                          <MongolianText size="xl" color="#f0a030">
                            {guidedLesson.examples[0]?.script || "ᠮᠣᠩᠭᠣᠯ"}
                          </MongolianText>
                          <p className="text-[13px] font-black text-ink mt-4">
                            {guidedLesson.examples[0]?.cyrillic || lesson.title}
                          </p>
                        </div>
                      </section>
                    )}

                    {activeLessonTab === "examples" &&
                      guidedLesson.examples.length > 0 && (
                      <section>
                        <div className="flex items-center gap-3 mb-4">
                          <span className="w-10 h-10 rounded-2xl bg-grass-50 border border-grass-100 text-grass-300 flex items-center justify-center">
                            <IconBook size={18} strokeWidth={2.2} />
                          </span>
                          <div>
                            <h3 className="text-[22px] font-black">
                              Жишээгээр уншъя
                            </h3>
                            <p className="text-[13px] text-ink-muted font-semibold">
                              Босоо бичгийг ажиглаад кирилл утгыг нь уншина.
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                          {guidedLesson.examples.map((example, index) => (
                            <div
                              key={`${example.script}-${index}`}
                              className="bg-paper-50 border-2 border-paper-100 rounded-3xl p-4 min-h-[190px] flex flex-col items-center justify-between text-center">
                              <span
                                className="font-mongolian text-sand-300"
                                style={{
                                  writingMode: "vertical-lr",
                                  fontSize: 34,
                                  minHeight: 86,
                                }}>
                                {example.script}
                              </span>
                              <div>
                                <p className="text-[20px] font-black text-ink">
                                  {example.cyrillic}
                                </p>
                                {example.note && (
                                  <p className="text-[12px] text-ink-muted font-semibold mt-1 leading-relaxed">
                                    {example.note}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {activeLessonTab === "games" && matchItems.length >= 2 && (
                      <section className="rounded-3xl bg-white border-2 border-paper-100 p-5 md:p-6">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-5">
                          <div>
                            <p className="text-[11px] font-extrabold text-sky-300 uppercase tracking-[2px] mb-1">
                              Тоглоом 1
                            </p>
                            <h3 className="text-[22px] font-black text-ink">
                              {guidedLesson.activities.matchTitle}
                            </h3>
                            <p className="text-[13px] text-ink-muted font-semibold mt-1">
                              {guidedLesson.activities.matchInstruction}
                            </p>
                          </div>
                          <span className="bg-grass-50 border border-grass-100 rounded-2xl px-4 py-2 text-[13px] font-black text-grass-300">
                            {completedMatches}/{matchItems.length} зөв
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {matchItems.map((example, index) => {
                            const selected = matchAnswers[index];
                            const isCorrect = selected === example.cyrillic;

                            return (
                              <div
                                key={`${example.script}-${index}`}
                                className={cn(
                                  "rounded-3xl border-2 p-4 transition-all",
                                  isCorrect
                                    ? "bg-grass-50 border-grass-100 text-ink"
                                    : selected
                                      ? "bg-ember-50 border-ember-100"
                                      : "bg-paper-50 border-paper-100",
                                )}>
                                <div className="flex items-center gap-4">
                                  <div className="w-20 h-28 rounded-2xl bg-white border border-paper-100 flex items-center justify-center shrink-0">
                                    <span
                                      className="font-mongolian text-sand-300"
                                      style={{
                                        writingMode: "vertical-lr",
                                        fontSize: 32,
                                      }}>
                                      {example.script}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p
                                      className={cn(
                                        "text-[12px] font-extrabold mb-2",
                                        isCorrect
                                          ? "text-grass-300"
                                          : selected
                                            ? "text-ember-300"
                                            : "text-ink-muted",
                                      )}>
                                      {isCorrect
                                        ? "Зөв таарлаа"
                                        : selected
                                          ? "Дахин сонгоод үз"
                                          : "Утгыг нь сонго"}
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                      {getMatchOptions(index).map((option) => {
                                        const active = selected === option;

                                        return (
                                          <button
                                            key={option}
                                            type="button"
                                            onClick={() =>
                                              setMatchAnswers((prev) => ({
                                                ...prev,
                                                [index]: option,
                                              }))
                                            }
                                            className={cn(
                                              "rounded-2xl px-3 py-2 text-[13px] font-extrabold transition-all border",
                                              active && option === example.cyrillic
                                                ? "bg-grass-300 border-grass-300 text-white"
                                                : active
                                                  ? "bg-ember-50 border-ember-100 text-ember-300"
                                                  : isCorrect
                                                    ? "bg-white border-paper-100 text-ink-muted hover:border-sky-100"
                                                    : "bg-white border-paper-100 text-ink hover:border-sky-100 hover:bg-sky-50",
                                            )}>
                                            {option}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    )}

                    {activeLessonTab === "games" &&
                      (fillItems.length >= 2 || sortWords.length >= 2) && (
                      <section>
                        <div className="flex items-center justify-between gap-4 mb-4">
                          <div>
                            <p className="text-[11px] font-extrabold text-sky-300 uppercase tracking-[2px] mb-1">
                              Тоглоомоор давтъя
                            </p>
                            <h3 className="text-[22px] font-black">
                              Сонго, өр, шалга
                            </h3>
                            <p className="text-[13px] text-ink-muted font-semibold">
                              Эхлээд зөв бичгийг сонгоод, дараа нь үгсээ
                              дарааллаар нь өрж тоглоно.
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                          {fillItems.length >= 2 && (
                            <div className="bg-white border-2 border-paper-100 rounded-3xl p-5">
                              <div className="flex items-center justify-between gap-3 mb-4">
                                <div>
                                  <p className="text-[11px] font-extrabold text-sky-300 uppercase tracking-[1.5px] mb-1">
                                    Тоглоом 2
                                  </p>
                                  <h4 className="text-[18px] font-black">
                                    {guidedLesson.activities.fillTitle}
                                  </h4>
                                  <p className="text-[12px] text-ink-muted font-semibold">
                                    {guidedLesson.activities.fillInstruction}
                                  </p>
                                </div>
                                <span className="text-[12px] font-black text-grass-300 bg-grass-50 border border-grass-100 px-3 py-1.5 rounded-xl">
                                  {completedFills}/{fillItems.length}
                                </span>
                              </div>

                              <div className="flex flex-col gap-3">
                                {fillItems.map((item, index) => {
                                  const selected = fillAnswers[index];
                                  const uniqueOptions = Array.from(
                                    new Set([item.answer, ...item.choices]),
                                  ).slice(0, 4);

                                  return (
                                    <div
                                      key={`${item.answer}-fill-${index}`}
                                      className={cn(
                                        "rounded-2xl border p-4",
                                        selected === item.answer
                                          ? "bg-grass-50 border-grass-100"
                                          : "bg-paper-50 border-paper-100",
                                      )}>
                                      <p className="text-[13px] font-extrabold text-ink mb-3">
                                        {item.translation}
                                      </p>
                                      <div className="flex items-center gap-3 bg-white border border-paper-100 rounded-2xl px-4 py-3 mb-3">
                                        {item.before && (
                                          <span
                                            className="font-mongolian text-sand-300"
                                            style={{
                                              writingMode: "vertical-lr",
                                              fontSize: 24,
                                            }}>
                                            {item.before}
                                          </span>
                                        )}
                                        <span className="text-[18px] font-black text-sky-300">
                                          ___
                                        </span>
                                        {item.after && (
                                          <span
                                            className="font-mongolian text-sand-300"
                                            style={{
                                              writingMode: "vertical-lr",
                                              fontSize: 24,
                                            }}>
                                            {item.after}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        {uniqueOptions.map((option) => {
                                          const active = selected === option;

                                          return (
                                            <button
                                              key={option}
                                              type="button"
                                              onClick={() =>
                                                setFillAnswers((prev) => ({
                                                  ...prev,
                                                  [index]: option,
                                                }))
                                              }
                                              className={cn(
                                                "min-w-[74px] min-h-[76px] rounded-2xl border-2 bg-white flex items-center justify-center transition-all",
                                                active &&
                                                  option === item.answer &&
                                                  "border-grass-300 bg-grass-50",
                                                active &&
                                                  option !== item.answer &&
                                                  "border-ember-300 bg-ember-50",
                                                !active &&
                                                  "border-paper-100 hover:border-sky-100",
                                              )}>
                                              <span
                                                className="font-mongolian text-sand-300"
                                                style={{
                                                  writingMode: "vertical-lr",
                                                  fontSize: 26,
                                                }}>
                                                {option}
                                              </span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {sortWords.length >= 2 && (
                            <div className="bg-white border-2 border-paper-100 rounded-3xl p-5">
                              <div className="flex items-center justify-between gap-3 mb-4">
                                <div>
                                  <p className="text-[11px] font-extrabold text-sand-300 uppercase tracking-[1.5px] mb-1">
                                    Тоглоом 3
                                  </p>
                                  <h4 className="text-[18px] font-black">
                                    {guidedLesson.activities.sortTitle}
                                  </h4>
                                  <p className="text-[12px] text-ink-muted font-semibold">
                                    {guidedLesson.activities.sortInstruction}
                                  </p>
                                </div>
                                <span
                                  className={cn(
                                    "text-[12px] font-black border px-3 py-1.5 rounded-xl",
                                    sortCorrect
                                      ? "bg-grass-50 border-grass-100 text-grass-300"
                                      : "bg-sand-50 border-sand-100 text-sand-300",
                                  )}>
                                  {sortCorrect ? "Зөв" : "Өрж үз"}
                                </span>
                              </div>

                              <div
                                className={cn(
                                  "min-h-[110px] rounded-2xl border-2 border-dashed p-3 flex flex-wrap gap-2 items-center justify-center mb-3",
                                  sortCorrect
                                    ? "border-grass-100 bg-grass-50"
                                    : "border-sky-100 bg-sky-50/50",
                                )}>
                                {sortAnswer.length === 0 ? (
                                  <p className="text-[13px] text-ink-muted font-semibold">
                                    Үгсээ энд дарааллаар нь цуглуулна.
                                  </p>
                                ) : (
                                  sortAnswer.map((word) => (
                                    <button
                                      key={word}
                                      type="button"
                                      onClick={() => removeSortWord(word)}
                                      className="min-w-[72px] min-h-[78px] rounded-2xl bg-white border-2 border-sky-100 flex items-center justify-center">
                                      <span
                                        className="font-mongolian text-sky-300"
                                        style={{
                                          writingMode: "vertical-lr",
                                          fontSize: 25,
                                        }}>
                                        {word}
                                      </span>
                                    </button>
                                  ))
                                )}
                              </div>

                              <div className="flex flex-wrap gap-2 mb-4">
                                {sortPool
                                  .filter((word) => !sortAnswer.includes(word))
                                  .map((word) => (
                                    <button
                                      key={word}
                                      type="button"
                                      onClick={() => addSortWord(word)}
                                      className="min-w-[72px] min-h-[78px] rounded-2xl bg-paper-50 border-2 border-paper-100 hover:border-sky-100 hover:bg-sky-50 flex items-center justify-center transition-all">
                                      <span
                                        className="font-mongolian text-sand-300"
                                        style={{
                                          writingMode: "vertical-lr",
                                          fontSize: 25,
                                        }}>
                                        {word}
                                      </span>
                                    </button>
                                  ))}
                              </div>

                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSortAnswer([])}
                                  className="bg-white border border-paper-100 text-ink-muted font-bold text-[13px] px-4 py-2.5 rounded-xl hover:bg-paper-50">
                                  Дахин эхлэх
                                </button>
                                <div className="flex-1 bg-paper-50 border border-paper-100 rounded-xl px-4 py-2.5 text-[13px] text-ink-muted font-semibold">
                                  Утга:{" "}
                                  {sortGame?.translation}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </section>
                    )}

                    {activeLessonTab === "games" && copyItems.length > 0 && (
                      <section className="rounded-3xl bg-sky-50 border-2 border-sky-100 p-5 md:p-6">
                        <div className="flex items-center justify-between gap-4 mb-4">
                          <div>
                            <p className="text-[11px] font-extrabold text-sky-300 uppercase tracking-[2px] mb-1">
                              Бичих дасгал 1
                            </p>
                            <h3 className="text-[22px] font-black">
                              {guidedLesson.activities.copyTitle}
                            </h3>
                            <p className="text-[13px] text-ink-muted font-semibold">
                              {guidedLesson.activities.copyInstruction}
                            </p>
                          </div>
                          <span className="text-[12px] font-black text-grass-300 bg-white border border-grass-100 px-3 py-1.5 rounded-xl">
                            {completedCopies}/{copyItems.length}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {copyItems.map((example, index) => (
                            <div
                              key={`${example.script}-copy-${index}`}
                              className={cn(
                                "bg-white border-2 rounded-3xl p-4",
                                copyResults[index] === "correct"
                                  ? "border-grass-100"
                                  : copyResults[index] === "wrong"
                                    ? "border-ember-100"
                                    : "border-paper-100",
                              )}>
                              <div className="flex items-center gap-4 mb-4">
                                <div className="w-20 h-28 rounded-2xl bg-paper-50 border border-paper-100 flex items-center justify-center">
                                  <span
                                    className="font-mongolian text-sand-300"
                                    style={{
                                      writingMode: "vertical-lr",
                                      fontSize: 32,
                                    }}>
                                    {example.script}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-[16px] font-black text-ink">
                                    {example.cyrillic}
                                  </p>
                                  <p className="text-[12px] font-semibold text-ink-muted mt-1">
                                    Ижилхэн бичээд шалгаарай.
                                  </p>
                                </div>
                              </div>

                              <MongolianKeyboard
                                value={copyInputs[index] ?? ""}
                                onChange={(value) =>
                                  setCopyInputs((prev) => ({
                                    ...prev,
                                    [index]: value,
                                  }))
                                }
                                mode="inline"
                                compact
                                showMn={false}
                                placeholder="Үсгүүдээс дарж хуулж бичнэ..."
                              />

                              <div className="flex items-center gap-3 mt-3">
                                <button
                                  type="button"
                                  onClick={() => checkCopy(example, index)}
                                  className="bg-sky-300 text-white font-extrabold text-[13px] px-5 py-2.5 rounded-2xl hover:bg-sky-200 transition-all">
                                  Шалгах
                                </button>
                                {copyResults[index] === "correct" && (
                                  <span className="text-[13px] font-extrabold text-grass-300">
                                    Маш сайн
                                  </span>
                                )}
                                {copyResults[index] === "wrong" && (
                                  <span className="text-[13px] font-extrabold text-ember-300">
                                    Дахиад нэг үзье
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {activeLessonTab === "write" && currentExercise && (
                      <section>
                        <div className="flex items-end justify-between gap-4 mb-4">
                          <div>
                            <h3 className="text-[22px] font-black">Дасгал</h3>
                            <p className="text-[13px] text-ink-muted font-semibold">
                              Нэг нэгээр нь хийгээд дараагийн дасгал руу орно.
                            </p>
                          </div>
                          <span className="text-[12px] font-extrabold text-grass-300 bg-grass-50 border border-grass-100 rounded-xl px-3 py-1.5">
                            {completedExercises}/{exerciseItems.length}
                          </span>
                        </div>

                        <div className="bg-white border-2 border-paper-100 rounded-3xl overflow-hidden">
                          <div className="bg-paper-50 border-b-2 border-paper-100 px-5 py-4">
                            <div className="flex items-center justify-between gap-4 mb-3">
                              <p className="text-[12px] font-black text-sky-300 uppercase tracking-[1.5px]">
                                Дасгал {exerciseIndex + 1}/{exerciseItems.length}
                              </p>
                              <button
                                type="button"
                                onClick={restartExercises}
                                className="text-[12px] font-bold text-ink-muted hover:text-ink">
                                Дахин эхлэх
                              </button>
                            </div>
                            <ProgressBar
                              value={
                                exerciseItems.length
                                  ? ((exerciseIndex + 1) / exerciseItems.length) *
                                    100
                                  : 0
                              }
                            />
                          </div>

                          <div className="p-5 md:p-7">
                            {currentExercise.type === "chooseMeaning" && (
                              <div className="max-w-[760px] mx-auto">
                                <p className="text-[22px] font-black text-ink text-center mb-5">
                                  {currentExercise.prompt}
                                </p>
                                <div className="h-[180px] bg-sand-50 border-2 border-sand-100 rounded-3xl flex items-center justify-center mb-5">
                                  <span
                                    className="font-mongolian text-sand-300"
                                    style={{
                                      writingMode: "vertical-lr",
                                      fontSize: 58,
                                    }}>
                                    {currentExercise.example.script}
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {currentExercise.options.map((option) => {
                                    const selected =
                                      exerciseAnswers[currentExercise.id];
                                    const active = selected === option;
                                    const checked =
                                      exerciseResults[currentExercise.id];

                                    return (
                                      <button
                                        key={option}
                                        type="button"
                                        onClick={() =>
                                          answerExercise(currentExercise, option)
                                        }
                                        className={cn(
                                          "rounded-2xl border-2 px-4 py-4 text-[15px] font-black transition-all",
                                          active && checked === "correct"
                                            ? "bg-grass-300 border-grass-300 text-white"
                                            : active && checked === "wrong"
                                              ? "bg-ember-50 border-ember-100 text-ember-300"
                                              : "bg-white border-paper-100 text-ink hover:bg-sky-50 hover:border-sky-100",
                                        )}>
                                        {option}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {currentExercise.type === "chooseScript" && (
                              <div className="max-w-[760px] mx-auto">
                                <p className="text-[22px] font-black text-ink text-center mb-2">
                                  {currentExercise.prompt}
                                </p>
                                <p className="text-[14px] font-semibold text-ink-muted text-center mb-5">
                                  Зөв монгол бичгийг сонго.
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  {currentExercise.options.map((option) => {
                                    const selected =
                                      exerciseAnswers[currentExercise.id];
                                    const active = selected === option;
                                    const checked =
                                      exerciseResults[currentExercise.id];

                                    return (
                                      <button
                                        key={option}
                                        type="button"
                                        onClick={() =>
                                          answerExercise(currentExercise, option)
                                        }
                                        className={cn(
                                          "min-h-[150px] rounded-3xl border-2 flex items-center justify-center transition-all",
                                          active && checked === "correct"
                                            ? "bg-grass-50 border-grass-300"
                                            : active && checked === "wrong"
                                              ? "bg-ember-50 border-ember-300"
                                              : "bg-paper-50 border-paper-100 hover:bg-sky-50 hover:border-sky-100",
                                        )}>
                                        <span
                                          className="font-mongolian text-sand-300"
                                          style={{
                                            writingMode: "vertical-lr",
                                            fontSize: 42,
                                          }}>
                                          {option}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {currentExercise.type === "trueFalse" && (
                              <div className="max-w-[760px] mx-auto">
                                <p className="text-[22px] font-black text-ink text-center mb-5">
                                  {currentExercise.prompt}
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-4 mb-5">
                                  <div className="h-[180px] bg-sand-50 border-2 border-sand-100 rounded-3xl flex items-center justify-center">
                                    <span
                                      className="font-mongolian text-sand-300"
                                      style={{
                                        writingMode: "vertical-lr",
                                        fontSize: 58,
                                      }}>
                                      {currentExercise.example.script}
                                    </span>
                                  </div>
                                  <div className="bg-paper-50 border-2 border-paper-100 rounded-3xl flex flex-col items-center justify-center text-center p-5">
                                    <p className="text-[12px] font-black text-ink-muted uppercase mb-2">
                                      Утга
                                    </p>
                                    <p className="text-[28px] font-black text-ink">
                                      {currentExercise.shownMeaning}
                                    </p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  {currentExercise.options.map((option) => {
                                    const selected =
                                      exerciseAnswers[currentExercise.id];
                                    const active = selected === option;
                                    const checked =
                                      exerciseResults[currentExercise.id];

                                    return (
                                      <button
                                        key={option}
                                        type="button"
                                        onClick={() =>
                                          answerExercise(currentExercise, option)
                                        }
                                        className={cn(
                                          "rounded-2xl border-2 px-4 py-4 text-[16px] font-black transition-all",
                                          active && checked === "correct"
                                            ? "bg-grass-300 border-grass-300 text-white"
                                            : active && checked === "wrong"
                                              ? "bg-ember-50 border-ember-100 text-ember-300"
                                              : "bg-white border-paper-100 text-ink hover:bg-sky-50 hover:border-sky-100",
                                        )}>
                                        {option}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {currentExercise.type === "chooseNote" && (
                              <div className="max-w-[820px] mx-auto">
                                <p className="text-[22px] font-black text-ink text-center mb-5">
                                  {currentExercise.prompt}
                                </p>
                                <div className="h-[170px] bg-sand-50 border-2 border-sand-100 rounded-3xl flex items-center justify-center mb-5">
                                  <span
                                    className="font-mongolian text-sand-300"
                                    style={{
                                      writingMode: "vertical-lr",
                                      fontSize: 54,
                                    }}>
                                    {currentExercise.example.script}
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {currentExercise.options.map((option) => {
                                    const selected =
                                      exerciseAnswers[currentExercise.id];
                                    const active = selected === option;
                                    const checked =
                                      exerciseResults[currentExercise.id];

                                    return (
                                      <button
                                        key={option}
                                        type="button"
                                        onClick={() =>
                                          answerExercise(currentExercise, option)
                                        }
                                        className={cn(
                                          "rounded-2xl border-2 px-4 py-4 text-left text-[14px] font-black transition-all",
                                          active && checked === "correct"
                                            ? "bg-grass-300 border-grass-300 text-white"
                                            : active && checked === "wrong"
                                              ? "bg-ember-50 border-ember-100 text-ember-300"
                                              : "bg-white border-paper-100 text-ink hover:bg-sky-50 hover:border-sky-100",
                                        )}>
                                        {option}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="border-t-2 border-paper-100 bg-paper-50 px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div>
                              {exerciseResults[currentExercise.id] ===
                                "correct" && (
                                <p className="text-[14px] font-black text-grass-300">
                                  Зөв байна
                                </p>
                              )}
                              {exerciseResults[currentExercise.id] ===
                                "wrong" && (
                                <p className="text-[14px] font-black text-ember-300">
                                  Дахин оролдоорой
                                </p>
                              )}
                            </div>
                            {exerciseIndex < exerciseItems.length - 1 ? (
                              <button
                                type="button"
                                onClick={goNextExercise}
                                disabled={
                                  exerciseResults[currentExercise.id] !==
                                  "correct"
                                }
                                className={cn(
                                  "font-extrabold text-[14px] px-6 py-3 rounded-2xl transition-all",
                                  exerciseResults[currentExercise.id] ===
                                    "correct"
                                    ? "bg-sky-300 text-white hover:bg-sky-200"
                                    : "bg-paper-100 text-ink-muted cursor-not-allowed",
                                )}>
                                Дараагийн дасгал
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={
                                  exerciseResults[currentExercise.id] !==
                                  "correct"
                                }
                                className={cn(
                                  "font-extrabold text-[14px] px-6 py-3 rounded-2xl transition-all",
                                  exerciseResults[currentExercise.id] ===
                                    "correct"
                                    ? "bg-grass-300 text-white"
                                    : "bg-paper-100 text-ink-muted cursor-not-allowed",
                                )}>
                                Дасгал дууссан
                              </button>
                            )}
                          </div>
                        </div>
                      </section>
                    )}

                    {activeLessonTab === "write" && guidedLesson.wrapUp && (
                      <section className="rounded-3xl bg-sand-50 border-2 border-sand-100 p-5">
                        <p className="text-[15px] text-sand-300 font-extrabold leading-relaxed">
                          {guidedLesson.wrapUp}
                        </p>
                      </section>
                    )}
                  </div>
                ) : (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: formatPlainContent(lesson.content),
                    }}
                  />
                )}
              </div>

              <button
                onClick={startLessonQuiz}
                disabled={!canStartQuiz}
                className={cn(
                  "w-full font-extrabold text-[15px] rounded-2xl py-4 transition-all",
                  canStartQuiz
                    ? "bg-sky-300 hover:bg-sky-200 text-white"
                    : "bg-paper-100 text-ink-muted cursor-not-allowed",
                )}>
                {canStartQuiz
                  ? "Төгсгөлийн шалгалт өгөх"
                  : "Эхлээд бүх даалгавраа зөв хийнэ"}
              </button>
            </ScrollReveal>
          </main>
        </div>
      </AppContainer>
    </div>
  );
}
