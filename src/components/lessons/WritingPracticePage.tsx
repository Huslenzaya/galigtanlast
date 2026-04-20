"use client";

import { PageHero } from "@/components/ui/PageHero";
import { showToast } from "@/components/ui/Toast";
import { LETTERS } from "@/lib/data";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";

const LETTER_GUIDES: Record<string, { path: string; hint: string }> = {
  ᠠ: {
    path: "M 50 10 C 50 10 40 40 45 70 C 48 90 50 110 50 130 M 50 50 C 60 45 70 50 65 65",
    hint: "Дээрээс доош шулуун татаад баруун тийш гнутна",
  },
  ᠡ: {
    path: "M 50 10 C 50 10 42 40 45 70 C 47 90 50 110 50 130 M 50 55 C 58 48 68 52 63 67",
    hint: "А-тай төстэй, дунд хэсэг арай өөр",
  },
  ᠢ: {
    path: "M 50 10 L 50 130 M 40 50 C 50 40 70 45 65 65",
    hint: "Шулуун шугам, дунд хавчуур",
  },
  ᠣ: {
    path: "M 50 10 L 50 130 M 35 55 C 35 45 65 45 65 55 C 65 70 35 70 35 55",
    hint: "Шулуун шугам дээр тойрог хэлбэр",
  },
  ᠤ: {
    path: "M 50 10 L 50 130 M 35 60 C 35 48 65 48 65 60 C 65 75 50 80 50 95",
    hint: "Тойрог хэлбэр доод хэсэгт суулт",
  },
  ᠨ: {
    path: "M 50 10 L 50 130 M 35 40 C 50 25 65 30 65 50 L 65 90",
    hint: "Шулуун шугам, дээд хавтгай гогцоо",
  },
  ᠪ: {
    path: "M 50 10 L 50 130 M 35 55 C 35 42 65 42 65 55 C 65 65 50 70 35 65",
    hint: "Шулуун шугам, дунд тал хэлбэр",
  },
  ᠮ: {
    path: "M 35 30 L 35 130 M 35 30 C 50 10 65 20 65 40 L 65 130",
    hint: "Хоёр шулуун шугам, дээд гогцоо",
  },
  ᠭ: {
    path: "M 50 10 L 50 130 M 35 45 C 35 30 65 30 65 45 L 65 75 C 65 88 35 88 35 75 L 35 45",
    hint: "Шулуун шугам, дунд дөрвөлжин тойрог",
  },
  ᠰ: {
    path: "M 50 10 L 50 130 M 35 50 L 65 50 M 35 70 C 35 55 65 55 65 70 C 65 82 50 88 50 100",
    hint: "Шулуун шугам, хоёр давхар гогцоо",
  },
};

interface LetterCard {
  mg: string;
  r: string;
  t: string;
  x: string;
}

interface Point {
  x: number;
  y: number;
}

interface ReviewState {
  score: number;
  label: "Сайн" | "Дундаж" | "Дахин оролд";
  message: string;
}

interface WritingSaveResult {
  earnedXp: number;
  completed: boolean;
  alreadyCompleted: boolean;
}

function getWritingXp(result: ReviewState) {
  if (result.label === "Сайн") return 10;
  if (result.label === "Дундаж") return 5;
  return 0;
}
function getDisplaySound(letter: LetterCard) {
  const key = String(letter.r || "")
    .toLowerCase()
    .trim();

  const map: Record<string, string> = {
    a: "а",
    e: "э",
    i: "и",
    o: "о",
    u: "у",
    ö: "ө",
    ү: "ү",
    ü: "ү",

    n: "н",
    b: "б",
    p: "п",
    h: "х",
    g: "г",
    m: "м",
    l: "л",
    s: "с",
    sh: "ш",
    t: "т",
    d: "д",
    ch: "ч",
    j: "ж",
    y: "й",
    r: "р",

    w: "в",
    v: "в",
    "w/v": "в",
    "w / v": "в",

    f: "ф",
    k: "к",
    q: "к",
    c: "ц",
    ts: "ц",
    "t/s": "ц",
    "t / s": "ц",
    z: "з",
  };

  return map[key] ?? letter.r;
}
function MongolGlyph({
  value,
  size,
  height,
  width,
  className,
  offsetX = 0,
}: {
  value: string;
  size: number;
  height: number;
  width: number;
  className?: string;
  offsetX?: number;
}) {
  return (
    <span
      className={cn(
        "font-mongolian leading-none select-none inline-flex items-center justify-center",
        className,
      )}
      style={{
        writingMode: "vertical-lr",
        textOrientation: "mixed",
        fontSize: size,
        height,
        width,
        lineHeight: 1,
        transform: `translateX(${offsetX}px)`,
      }}>
      {value}
    </span>
  );
}

function getExpectedStrokeCount(letter: string) {
  const guide = LETTER_GUIDES[letter];
  if (!guide) return 1;
  return guide.path.match(/\bM\b/g)?.length ?? 1;
}

function normalizePoints(points: Point[]) {
  if (points.length === 0) return [];

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const width = Math.max(maxX - minX, 1);
  const height = Math.max(maxY - minY, 1);

  return points.map((p) => ({
    x: (p.x - minX) / width,
    y: (p.y - minY) / height,
  }));
}

function distance(a: Point, b: Point) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function averageNearestDistance(from: Point[], to: Point[]) {
  if (!from.length || !to.length) return 1;

  const sampled = from.filter((_, i) => i % 3 === 0);

  const total = sampled.reduce((sum, point) => {
    let nearest = Number.POSITIVE_INFINITY;

    for (const target of to) {
      nearest = Math.min(nearest, distance(point, target));
    }

    return sum + nearest;
  }, 0);

  return total / Math.max(sampled.length, 1);
}

function getGuidePoints(letter: string) {
  const guide = LETTER_GUIDES[letter];
  if (!guide) return null;

  const numbers = guide.path.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
  const raw: Point[] = [];

  for (let i = 0; i < numbers.length - 1; i += 2) {
    raw.push({
      x: numbers[i],
      y: numbers[i + 1],
    });
  }

  if (raw.length < 2) return null;

  const sampled: Point[] = [];

  for (let i = 1; i < raw.length; i++) {
    const prev = raw[i - 1];
    const next = raw[i];

    for (let step = 0; step <= 8; step++) {
      const t = step / 8;

      sampled.push({
        x: prev.x + (next.x - prev.x) * t,
        y: prev.y + (next.y - prev.y) * t,
      });
    }
  }

  return sampled;
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

function getShapeScore(userPoints: Point[], letter: string) {
  const guidePoints = getGuidePoints(letter);
  if (!guidePoints) return null;

  const normalizedUser = normalizePoints(userPoints);
  const normalizedGuide = normalizePoints(guidePoints);

  const userToGuide = averageNearestDistance(normalizedUser, normalizedGuide);
  const guideToUser = averageNearestDistance(normalizedGuide, normalizedUser);

  const avgDistance = (userToGuide + guideToUser) / 2;

  if (avgDistance <= 0.13) return 25;
  if (avgDistance <= 0.2) return 18;
  if (avgDistance <= 0.28) return 9;
  return 0;
}

export function WritingPracticePage() {
  const { isLoggedIn, openAuthModal, userId, setXp } = useAppStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLetter, setCurrentLetter] = useState<LetterCard>(LETTERS[0]);
  const [filter, setFilter] = useState<"all" | "vowel" | "consonant">("all");
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [showGuide, setShowGuide] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [review, setReview] = useState<ReviewState | null>(null);
  const [savingXp, setSavingXp] = useState(false);

  const filtered = useMemo(
    () => LETTERS.filter((l) => filter === "all" || l.t === filter),
    [filter],
  );

  const completedInFiltered = useMemo(() => {
    return filtered.filter((letter) => completed.has(letter.mg)).length;
  }, [filtered, completed]);

  useEffect(() => {
    drawCanvas();
  }, [currentLetter, strokes, currentStroke]);

  useEffect(() => {
    async function loadCompletedLetters() {
      if (!userId) return;

      try {
        const res = await fetch(
          `/api/writing-attempts?userId=${encodeURIComponent(userId)}`,
          { cache: "no-store" },
        );

        if (!res.ok) return;

        const data = await res.json();
        setCompleted(new Set(data?.completedLetters || []));
      } catch (error) {
        console.error("Writing completed letters load error:", error);
      }
    }

    loadCompletedLetters();
  }, [userId]);

  function getPos(
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement,
  ) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
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

    for (let x = 0; x <= canvas.width; x += 36) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    for (let y = 0; y <= canvas.height; y += 36) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(26,107,189,0.13)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    strokes.forEach((stroke) => {
      if (stroke.length < 2) return;

      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);

      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }

      ctx.strokeStyle = "#1a6bbd";
      ctx.lineWidth = 3.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    });

    if (currentStroke.length > 1) {
      ctx.beginPath();
      ctx.moveTo(currentStroke[0].x, currentStroke[0].y);

      for (let i = 1; i < currentStroke.length; i++) {
        ctx.lineTo(currentStroke[i].x, currentStroke[i].y);
      }

      ctx.strokeStyle = "#1a6bbd";
      ctx.lineWidth = 3.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    }
  }

  function startDraw(
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pos = getPos(e, canvas);
    setReview(null);
    setIsDrawing(true);
    setCurrentStroke([pos]);
  }

  function draw(
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const pos = getPos(e, canvas);
    setCurrentStroke((prev) => [...prev, pos]);
  }

  function endDraw(
    e?:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) {
    e?.preventDefault();
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
  }

  function undoStroke() {
    setReview(null);
    setStrokes((prev) => prev.slice(0, -1));
  }

  function getStrokeStats() {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const points = strokes.flat();
    if (points.length < 2) return null;

    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

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

      return dy >= 70 && dy >= dx * 0.9;
    });

    return {
      canvas,
      points,
      width: Math.max(maxX - minX, 1),
      height: Math.max(maxY - minY, 1),
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
      totalLength,
      directionChanges: calculateDirectionChanges(points),
      mainVerticalStroke,
    };
  }

  function checkDrawing(showMessage = true) {
    const stats = getStrokeStats();

    if (!stats) {
      if (showMessage) showToast("Эхлээд үсгээ зурна уу.", "bad");
      return null;
    }

    const expectedStrokeCount = getExpectedStrokeCount(currentLetter.mg);
    const strokeDiff = Math.abs(strokes.length - expectedStrokeCount);
    const verticalRatio = stats.height / stats.width;
    const centerOffset = Math.abs(stats.centerX - stats.canvas.width / 2);
    const shapeScore = getShapeScore(stats.points, currentLetter.mg);

    let score = 0;
    const tips: string[] = [];

    if (stats.points.length >= 45) score += 10;
    else if (stats.points.length >= 25) score += 5;
    else tips.push("зураас хэт богино байна");

    if (strokeDiff === 0) score += 15;
    else if (strokeDiff === 1) score += 7;
    else tips.push("зурлагын тоо зөрж байна");

    if (verticalRatio >= 1.7) score += 14;
    else if (verticalRatio >= 1.25) score += 7;
    else tips.push("босоо хэлбэр сул байна");

    if (stats.mainVerticalStroke) score += 12;
    else tips.push("үндсэн босоо хөдөлгөөн тод биш байна");

    if (centerOffset <= 45) score += 12;
    else if (centerOffset <= 80) score += 5;
    else tips.push("дунд шугамдаа ойр бич");

    if (stats.height >= 95 && stats.height <= 250) score += 10;
    else if (stats.height >= 75 && stats.height <= 280) score += 4;
    else tips.push("үсгийн өндөр тохирохгүй байна");

    if (stats.width <= 130) score += 8;
    else if (stats.width <= 175) score += 3;
    else tips.push("хэт өргөн сараачсан байна");

    if (stats.totalLength >= 90 && stats.totalLength <= 900) score += 9;
    else if (stats.totalLength < 90) tips.push("зураас хэт богино байна");
    else tips.push("хэт олон илүү хөдөлгөөн байна");

    if (stats.directionChanges <= 18) score += 8;
    else if (stats.directionChanges <= 28) score += 3;
    else tips.push("зураас хэт замбараагүй байна");

    if (shapeScore !== null) {
      score += shapeScore;

      if (shapeScore <= 8) {
        tips.push("загварын хэлбэртэй сайн таарахгүй байна");
      }
    } else {
      score += 10;
    }

    if (stats.points.length < 18 || stats.totalLength < 70) {
      score = Math.min(score, 35);
    }

    if (!stats.mainVerticalStroke) {
      score = Math.min(score, 58);
    }

    if (stats.directionChanges > 32 || stats.width > 230) {
      score = Math.min(score, 48);
    }

    if (shapeScore !== null && shapeScore <= 8) {
      score = Math.min(score, 62);
    }

    score = Math.max(0, Math.min(100, Math.round(score)));

    let result: ReviewState;

    if (score >= 78) {
      result = {
        score,
        label: "Сайн",
        message: "Загварын дагуу боломжийн сайн бичсэн байна.",
      };
    } else if (score >= 55) {
      result = {
        score,
        label: "Дундаж",
        message:
          tips[0] ?? "Боломжийн байна. Бага зэрэг цэвэрлээд дахин оролд.",
      };
    } else {
      result = {
        score,
        label: "Дахин оролд",
        message:
          tips.slice(0, 2).join(", ") ||
          "Загварын дагуу дээрээс доош дахин зурж үзнэ үү.",
      };
    }

    setReview(result);

    if (showMessage) {
      showToast(
        result.label === "Сайн"
          ? `Сайн бичлээ (${score}%)`
          : result.label === "Дундаж"
            ? `Дундаж (${score}%)`
            : `Дахин оролд (${score}%)`,
        result.label === "Дахин оролд" ? "bad" : "ok",
      );
    }

    return result;
  }

  async function saveWritingXp(
    result: ReviewState,
  ): Promise<WritingSaveResult> {
    if (!userId) {
      return {
        earnedXp: 0,
        completed: false,
        alreadyCompleted: false,
      };
    }

    try {
      setSavingXp(true);

      const res = await fetch("/api/writing-attempts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          letter: currentLetter.mg,
          score: result.score,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        console.error("Writing practice save failed:", data?.message);
        return {
          earnedXp: 0,
          completed: false,
          alreadyCompleted: false,
        };
      }

      if (typeof data?.totalXp === "number") {
        setXp(data.totalXp);
      }

      if (data?.completed) {
        setCompleted((prev) => new Set(prev).add(currentLetter.mg));
      }

      return {
        earnedXp: Number(data?.earnedXp ?? 0),
        completed: Boolean(data?.completed),
        alreadyCompleted: Boolean(data?.alreadyCompleted),
      };
    } catch (error) {
      console.error("Writing practice save error:", error);

      return {
        earnedXp: 0,
        completed: false,
        alreadyCompleted: false,
      };
    } finally {
      setSavingXp(false);
    }
  }

  async function markDone() {
    if (savingXp) return;

    if (strokes.length === 0) {
      showToast("Эхлээд үсгээ зурна уу.", "bad");
      return;
    }

    const result = review ?? checkDrawing(false);
    if (!result) return;

    if (result.label === "Дахин оролд") {
      showToast("Шууд дуусгахын өмнө дахин оролдоно уу.", "bad");
      return;
    }

    const saved = await saveWritingXp(result);

    if (!saved.completed) {
      showToast("Дасгал хадгалагдсангүй. Дахин оролдоно уу.", "bad");
      return;
    }

    showToast(
      `${currentLetter.mg} — ${
        result.label === "Сайн" ? "сайн бичлээ" : "боломжийн бичлээ"
      }${
        saved.earnedXp > 0
          ? ` · +${saved.earnedXp} XP`
          : saved.alreadyCompleted
            ? " · өмнө нь XP авсан"
            : ""
      }`,
      "ok",
    );

    clearCanvas();

    const idx = filtered.findIndex((l) => l.mg === currentLetter.mg);
    if (idx < filtered.length - 1) {
      setCurrentLetter(filtered[idx + 1]);
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="max-w-[500px] mx-auto px-6 py-20 text-center">
        <h2 className="text-[22px] font-black mb-2">Бичих дасгал</h2>
        <p className="text-ink-muted font-semibold mb-6 leading-relaxed">
          Монгол бичгийн үсгүүдийг зуран сурах дасгал. Нэвтэрч орсны дараа
          ашиглах боломжтой.
        </p>
        <button
          onClick={() => openAuthModal("up")}
          className="bg-sky-300 text-white font-extrabold px-6 py-3 rounded-2xl hover:bg-sky-200 transition-all">
          Үнэгүй бүртгүүлэх
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <PageHero
        eyebrow="Дасгал"
        title="Бичих дасгал"
        description="Монгол бичгийн үсгүүдийг зураан дасгалжуул — 35 үсэг"
        mongolText="ᠪᠢᠴᠢᠬᠦ"
        variant="sand"
      />

      <div className="max-w-6xl mx-auto px-6 lg:px-8 pb-12 mt-7">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5">
          <aside>
            <div className="flex bg-paper-50 border-2 border-paper-100 rounded-2xl p-1 mb-3">
              {(["all", "vowel", "consonant"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setFilter(f);
                    setReview(null);
                  }}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-[12px] font-extrabold transition-all",
                    filter === f
                      ? "bg-white text-ink shadow-soft"
                      : "text-ink-muted hover:text-ink",
                  )}>
                  {f === "all" ? "Бүгд" : f === "vowel" ? "Эгшиг" : "Гийг."}
                </button>
              ))}
            </div>

            <div className="bg-white border-2 border-paper-100 rounded-2xl p-4 mb-3">
              <div className="flex justify-between text-[12px] font-bold mb-2">
                <span className="text-ink-muted">Дасгалласан</span>
                <span className="text-grass-300">
                  {completedInFiltered}/{filtered.length}
                </span>
              </div>

              <div className="h-2.5 bg-paper-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-grass-300 to-sky-300 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      filtered.length
                        ? (completedInFiltered / filtered.length) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="bg-white border-2 border-paper-100 rounded-2xl overflow-hidden max-h-[390px] overflow-y-auto">
              <div className="grid grid-cols-4">
                {filtered.map((l) => (
                  <button
                    key={l.mg}
                    onClick={() => {
                      setCurrentLetter(l);
                      clearCanvas();
                      setShowHint(false);
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 min-h-[64px] p-2 border-b border-r border-paper-50 transition-all hover:bg-sky-50",
                      currentLetter.mg === l.mg &&
                        "bg-sky-50 ring-2 ring-inset ring-sky-200",
                      completed.has(l.mg) && "bg-grass-50",
                    )}>
                    <MongolGlyph
                      value={l.mg}
                      size={24}
                      height={34}
                      width={34}
                      offsetX={3}
                      className="text-sand-300"
                    />

                    <span className="text-[9px] font-extrabold text-ink-muted">
                      {getDisplaySound(l)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <main>
            <div className="bg-white border-2 border-paper-100 rounded-2xl p-4 mb-4 flex items-center gap-4">
              <div className="w-[96px] h-[96px] bg-sand-50 border-2 border-sand-100 rounded-2xl flex items-center justify-center shrink-0">
                <MongolGlyph
                  value={currentLetter.mg}
                  size={54}
                  height={74}
                  width={70}
                  offsetX={5}
                  className="text-sand-300"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[26px] leading-none font-black text-ink">
                    {getDisplaySound(currentLetter)}
                  </p>

                  <span
                    className={cn(
                      "text-[11px] font-extrabold px-2.5 py-1 rounded-xl border",
                      currentLetter.t === "vowel"
                        ? "bg-sky-50 text-sky-300 border-sky-100"
                        : "bg-grass-50 text-grass-300 border-grass-100",
                    )}>
                    {currentLetter.t === "vowel" ? "Эгшиг" : "Гийгүүлэгч"}
                  </span>
                </div>

                <p className="text-[13px] text-ink-muted font-semibold">
                  Жишээ үг:{" "}
                  <strong className="text-ink">{currentLetter.x}</strong>
                </p>

                <p className="text-[12px] text-grass-300 font-semibold mt-1.5">
                  Үнэлгээ: Сайн +10 XP · Дундаж +5 XP
                </p>

                {showHint && (
                  <p className="text-[12px] text-sky-300 font-semibold mt-2 bg-sky-50 rounded-xl px-3 py-1.5 border border-sky-100">
                    Зөвлөгөө:{" "}
                    {LETTER_GUIDES[currentLetter.mg]?.hint ??
                      "Дээрээс доошоо, монгол бичгийн урсгалаар зур"}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <label className="flex items-center gap-2 text-[12px] font-bold text-ink-muted cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showGuide}
                    onChange={(e) => setShowGuide(e.target.checked)}
                    className="accent-sky-300"
                  />
                  Загвар харуулах
                </label>

                <button
                  onClick={() => setShowHint((v) => !v)}
                  className="text-[11px] text-sky-300 font-bold hover:underline text-left">
                  {showHint ? "Нуух" : "Зөвлөгөө"}
                </button>
              </div>
            </div>

            <div className="bg-white border-2 border-paper-100 rounded-2xl overflow-hidden mb-4 relative">
              <div className="bg-paper-50 border-b-2 border-paper-100 px-4 py-2.5 flex items-center justify-between">
                <span className="text-[12px] font-extrabold text-ink-muted uppercase tracking-wide">
                  Зурах талбар — дээрээс доош бичнэ
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={undoStroke}
                    disabled={strokes.length === 0}
                    className="text-[12px] font-bold text-ink-muted hover:text-ink disabled:opacity-30 px-3 py-1 rounded-lg hover:bg-paper-100 transition-all">
                    Буцаах
                  </button>

                  <button
                    onClick={clearCanvas}
                    className="text-[12px] font-bold text-ember-300 hover:bg-ember-50 px-3 py-1 rounded-lg transition-all">
                    Арилгах
                  </button>
                </div>
              </div>

              <div className="relative bg-[#fffef9]">
                {showGuide && (
                  <div className="absolute inset-0 pointer-events-none z-[1] flex items-center justify-center overflow-hidden">
                    <MongolGlyph
                      value={currentLetter.mg}
                      size={150}
                      height={220}
                      width={170}
                      offsetX={6}
                      className="text-sand-300/20"
                    />
                  </div>
                )}

                <canvas
                  ref={canvasRef}
                  width={560}
                  height={300}
                  className="w-full cursor-crosshair touch-none select-none relative z-[2]"
                  style={{ display: "block", background: "transparent" }}
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={endDraw}
                  onMouseLeave={endDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={endDraw}
                />
              </div>
            </div>

            {review && (
              <div
                className={cn(
                  "mb-4 rounded-2xl border-2 px-4 py-3",
                  review.label === "Сайн" &&
                    "bg-grass-50 border-grass-100 text-grass-300",
                  review.label === "Дундаж" &&
                    "bg-sand-50 border-sand-100 text-sand-300",
                  review.label === "Дахин оролд" &&
                    "bg-ember-50 border-ember-100 text-ember-300",
                )}>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[14px] font-extrabold">
                    Үнэлгээ: {review.label}
                  </p>

                  <p className="text-[12px] font-black">{review.score}%</p>
                </div>

                <p className="text-[12px] font-semibold mt-1.5">
                  {review.message}
                </p>

                {review.label !== "Дахин оролд" && (
                  <p className="text-[11px] font-extrabold mt-2">
                    Дасгал дуусгавал +{getWritingXp(review)} XP нэмэгдэнэ.
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={clearCanvas}
                className="bg-white border-2 border-paper-100 text-ink font-bold text-[13px] px-5 py-3 rounded-2xl hover:border-ember-100 hover:bg-ember-50 hover:text-ember-300 transition-all">
                Арилгах
              </button>

              <button
                onClick={() => checkDrawing(true)}
                disabled={strokes.length === 0}
                className={cn(
                  "font-extrabold text-[14px] rounded-2xl px-5 py-3 transition-all",
                  strokes.length > 0
                    ? "bg-white border-2 border-sky-100 text-sky-300 hover:bg-sky-50"
                    : "bg-paper-100 text-ink-muted cursor-not-allowed",
                )}>
                Шалгах
              </button>

              <button
                onClick={markDone}
                disabled={strokes.length === 0 || savingXp}
                className={cn(
                  "flex-1 font-extrabold text-[15px] rounded-2xl py-3.5 transition-all",
                  strokes.length > 0 && !savingXp
                    ? "bg-gradient-to-r from-sky-300 to-sky-200 text-white hover:opacity-90 hover:-translate-y-px shadow-[0_4px_16px_rgba(26,107,189,.3)]"
                    : "bg-paper-100 text-ink-muted cursor-not-allowed",
                )}>
                {savingXp
                  ? "XP хадгалж байна..."
                  : "Дасгал дуусгах — Дараагийн үсэг"}
              </button>
            </div>

            {strokes.length > 0 && (
              <p className="text-center text-[12px] text-ink-muted font-semibold mt-3">
                {strokes.length} зурлага хийгдсэн
              </p>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
