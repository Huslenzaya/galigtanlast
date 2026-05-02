"use client";

import { AppContainer } from "@/components/layout/AppContainer";
import {
  IconAward,
  IconBook,
  IconChevRight,
  IconEye,
  IconGlobe,
  IconLayers,
  IconLock,
  IconPen,
  IconTarget,
} from "@/components/ui/Icons";
import { PageHero } from "@/components/ui/PageHero";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { getLevelMeta } from "@/lib/data";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { LessonId } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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
  createdAt: string;
  updatedAt: string;
}

interface LessonProgressItem {
  lessonId: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  completedAt: string | null;
}

interface ReadingArticle {
  id: string;
  title: string;
  levelLabel: string | null;
  scriptText: string;
  cyrillicText: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

type Tab = "lessons" | "reading";

const COLOR_ORDER = ["sky", "grass", "sand", "ember"] as const;

const COLOR_MAP = {
  sky: { dot: "bg-sky-300", active: "bg-sky-50 border-sky-100 text-sky-300" },
  grass: {
    dot: "bg-grass-300",
    active: "bg-grass-50 border-grass-100 text-grass-300",
  },
  sand: {
    dot: "bg-sand-300",
    active: "bg-sand-50 border-sand-100 text-sand-300",
  },
  ember: {
    dot: "bg-ember-300",
    active: "bg-ember-50 border-ember-100 text-ember-300",
  },
};

const LEVEL_STYLE: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  "Анхан шат": {
    bg: "bg-sky-50",
    text: "text-sky-300",
    border: "border-sky-100",
  },
  "Дунд шат": {
    bg: "bg-grass-50",
    text: "text-grass-300",
    border: "border-grass-100",
  },
  Дэвшилтэт: {
    bg: "bg-sand-50",
    text: "text-sand-300",
    border: "border-sand-100",
  },
};

const FREE_LESSON_SLUGS = ["vowels"];
const GUIDED_LESSON_VERSION = 1;

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

interface GuidedLessonContent {
  version: number;
  intro: string;
  keyPoints: string[];
  examples: GuidedExample[];
  tasks: GuidedTask[];
  wrapUp?: string;
}

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
    };
  } catch {
    return null;
  }
}

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

const LEVEL_TONE_MAP = {
  sky: {
    dot: "bg-sky-300",
    active: "bg-sky-50 border-sky-100 text-sky-300",
    badge: "bg-sky-50 text-sky-300 border-sky-100",
  },
  grass: {
    dot: "bg-grass-300",
    active: "bg-grass-50 border-grass-100 text-grass-300",
    badge: "bg-grass-50 text-grass-300 border-grass-100",
  },
  sand: {
    dot: "bg-sand-300",
    active: "bg-sand-50 border-sand-100 text-sand-300",
    badge: "bg-sand-50 text-sand-300 border-sand-100",
  },
  ember: {
    dot: "bg-ember-300",
    active: "bg-ember-50 border-ember-100 text-ember-300",
    badge: "bg-ember-50 text-ember-300 border-ember-100",
  },
  purple: {
    dot: "bg-[#7c5cbf]",
    active: "bg-[#f1ecfb] border-[#d8c8f1] text-[#7c5cbf]",
    badge: "bg-[#f1ecfb] text-[#7c5cbf] border-[#d8c8f1]",
  },
  teal: {
    dot: "bg-[#1a9e8a]",
    active: "bg-[#e6f7f4] border-[#b9e6df] text-[#1a9e8a]",
    badge: "bg-[#e6f7f4] text-[#1a9e8a] border-[#b9e6df]",
  },
} as const;

function LevelIcon({
  icon,
  size = 16,
  className,
}: {
  icon: string;
  size?: number;
  className?: string;
}) {
  const props = { size, strokeWidth: 2.2, className };

  if (icon === "layers") return <IconLayers {...props} />;
  if (icon === "pen") return <IconPen {...props} />;
  if (icon === "target") return <IconTarget {...props} />;
  if (icon === "award") return <IconAward {...props} />;
  if (icon === "globe") return <IconGlobe {...props} />;
  return <IconBook {...props} />;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatLessonContent(content: string) {
  const hasHtml = /<[a-z][\s\S]*>/i.test(content);

  if (hasHtml) return content;

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

function LessonsHero({ description }: { description?: string }) {
  return (
    <PageHero
      eyebrow="Суралцах хэсэг"
      title="Хичээл"
      description={
        description || "Хичээлээ үзэж, унших эхээр чадвараа бататгана."
      }
      mongolText="ᠬᠢᠴᠢᠶᠡᠯ"
      variant="sky"
      rightText={["ᠬ", "ᠢ", "ᠴ", "ᠢ", "ᠶ", "ᠡ", "ᠯ"]}
    />
  );
}

function getReadingScriptLayout(text: string) {
  const len = [...text].length;

  if (len > 1200) {
    return {
      fontSize: 14,
      height: 1200,
      lineHeight: 1.65,
      letterSpacing: 0.5,
    };
  }

  if (len > 900) {
    return {
      fontSize: 15,
      height: 1080,
      lineHeight: 1.7,
      letterSpacing: 0.8,
    };
  }

  if (len > 650) {
    return {
      fontSize: 16,
      height: 960,
      lineHeight: 1.75,
      letterSpacing: 1,
    };
  }

  if (len > 420) {
    return {
      fontSize: 18,
      height: 820,
      lineHeight: 1.82,
      letterSpacing: 1.2,
    };
  }

  if (len > 220) {
    return {
      fontSize: 20,
      height: 680,
      lineHeight: 1.9,
      letterSpacing: 1.5,
    };
  }

  if (len > 100) {
    return {
      fontSize: 22,
      height: 560,
      lineHeight: 1.95,
      letterSpacing: 1.8,
    };
  }

  return {
    fontSize: 24,
    height: 420,
    lineHeight: 2,
    letterSpacing: 2,
  };
}

export function LessonsPage() {
  const router = useRouter();

  const {
    currentLesson,
    setLesson,
    startQuiz,
    isLoggedIn,
    openAuthModal,
    userId,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<Tab>("lessons");
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [progressMap, setProgressMap] = useState<
    Record<string, LessonProgressItem["status"]>
  >({});
  const [taskInputs, setTaskInputs] = useState<Record<number, string>>({});
  const [taskResults, setTaskResults] = useState<
    Record<number, "correct" | "wrong">
  >({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  async function syncStartProgress(lessonId: string) {
    if (!isLoggedIn || !userId) return;

    try {
      await fetch("/api/lesson-progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "start",
          userId,
          lessonId,
        }),
      });

      setProgressMap((prev) => {
        if (prev[lessonId] === "COMPLETED") return prev;

        return {
          ...prev,
          [lessonId]: "IN_PROGRESS",
        };
      });
    } catch (error) {
      console.error("Lesson progress start error:", error);
    }
  }

  useEffect(() => {
    async function loadLessons() {
      try {
        setLoading(true);
        setErrorMsg("");

        const [lessonsRes, progressRes] = await Promise.all([
          fetch("/api/lessons", { cache: "no-store" }),
          isLoggedIn && userId
            ? fetch(
                `/api/lesson-progress?userId=${encodeURIComponent(userId)}`,
                {
                  cache: "no-store",
                },
              )
            : Promise.resolve(null),
        ]);

        if (!lessonsRes.ok) {
          throw new Error("Хичээлүүдийг ачаалж чадсангүй.");
        }

        const lessonData: LessonItem[] = await lessonsRes.json();
        setLessons(Array.isArray(lessonData) ? lessonData : []);

        if (progressRes?.ok) {
          const progressData: LessonProgressItem[] = await progressRes.json();
          const nextMap: Record<string, LessonProgressItem["status"]> = {};

          progressData.forEach((item) => {
            nextMap[item.lessonId] = item.status;
          });

          setProgressMap(nextMap);
        } else {
          setProgressMap({});
        }

        if (lessonData.length > 0) {
          const bySlug = lessonData.find((l) => l.slug === currentLesson);
          const first = bySlug ?? lessonData[0];
          setSelectedLessonId(first.id);
        }
      } catch (error) {
        console.error(error);
        setErrorMsg(error instanceof Error ? error.message : "Алдаа гарлаа.");
      } finally {
        setLoading(false);
      }
    }

    loadLessons();
  }, [currentLesson, isLoggedIn, userId]);

  const groupedLessons = useMemo(() => {
    const map = new Map<number, LessonItem[]>();

    lessons.forEach((lesson) => {
      const arr = map.get(lesson.level) ?? [];
      arr.push(lesson);
      map.set(lesson.level, arr);
    });

    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([level, items]) => ({
        level,
        meta: getLevelMeta(level),
        items,
      }));
  }, [lessons]);

  const selectedLesson = useMemo(() => {
    if (!lessons.length) return null;
    return lessons.find((l) => l.id === selectedLessonId) ?? lessons[0];
  }, [lessons, selectedLessonId]);

  const guidedLesson = useMemo(
    () =>
      selectedLesson
        ? parseGuidedLessonContent(selectedLesson.content)
        : null,
    [selectedLesson],
  );

  useEffect(() => {
    setTaskInputs({});
    setTaskResults({});
  }, [selectedLessonId]);

  const isFree = selectedLesson
    ? FREE_LESSON_SLUGS.includes(selectedLesson.slug)
    : false;

  const canAccess = isLoggedIn || isFree;
  const totalTasks = guidedLesson?.tasks.length ?? 0;
  const completedTasks = guidedLesson
    ? guidedLesson.tasks.filter((_, index) => taskResults[index] === "correct")
        .length
    : 0;
  const canStartQuiz = totalTasks === 0 || completedTasks === totalTasks;

  function handleLessonClick(lesson: LessonItem) {
    const free = FREE_LESSON_SLUGS.includes(lesson.slug);

    if (!isLoggedIn && !free) {
      openAuthModal("up");
      return;
    }

    setSelectedLessonId(lesson.id);
    setLesson(lesson.slug as LessonId);

    if (isLoggedIn && userId) {
      syncStartProgress(lesson.id);
    }

    router.push(`/lessons/${lesson.slug}`);
  }

  async function startLessonQuiz() {
    if (!selectedLesson) return;

    if (isLoggedIn && userId) {
      await syncStartProgress(selectedLesson.id);
    }

    startQuiz(selectedLesson.slug, true, {
      lessonSlug: selectedLesson.slug,
      requireDatabase: true,
    });

    router.push("/quiz");
  }

  function checkTask(task: GuidedTask, index: number) {
    const isCorrect =
      normalizeAnswer(taskInputs[index] ?? "") === normalizeAnswer(task.answer);

    setTaskResults((prev) => ({
      ...prev,
      [index]: isCorrect ? "correct" : "wrong",
    }));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-paper">
        <LessonsHero />

        <AppContainer size="6xl" className="py-16">
          <div className="bg-white border border-paper-100 rounded-[28px] p-12 text-center">
            <p className="text-[16px] font-bold text-ink-muted">
              Хичээлүүдийг ачаалж байна...
            </p>
          </div>
        </AppContainer>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-paper">
        <LessonsHero />

        <AppContainer size="6xl" className="py-16">
          <div className="bg-white border border-paper-100 rounded-[28px] p-12 text-center">
            <p className="text-[16px] font-bold text-ember-300 mb-4">
              {errorMsg}
            </p>

            <button
              onClick={() => router.refresh()}
              className="bg-sky-300 text-white font-extrabold text-[14px] px-6 py-3 rounded-2xl hover:bg-sky-200 transition-all">
              Дахин оролдох
            </button>
          </div>
        </AppContainer>
      </div>
    );
  }

  if (!selectedLesson) {
    return (
      <div className="min-h-screen bg-paper">
        <LessonsHero />

        <AppContainer size="6xl" className="py-16">
          <div className="bg-white border border-paper-100 rounded-[28px] p-12 text-center">
            <p className="text-[16px] font-bold text-ink-muted">
              Нийтлэгдсэн хичээл алга байна.
            </p>
          </div>
        </AppContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <LessonsHero
        description={`${lessons.length} хичээл${
          !isLoggedIn ? " · Нээлттэй хичээлтэй" : ""
        }`}
      />

      <AppContainer size="6xl">
        <div className="flex gap-1 border-b border-paper-100 mt-2">
          <button
            onClick={() => setActiveTab("lessons")}
            className={cn(
              "flex items-center gap-2 px-5 py-3.5 text-[14px] font-extrabold border-b-2 transition-all -mb-px",
              activeTab === "lessons"
                ? "border-sky-300 text-sky-300"
                : "border-transparent text-ink-muted hover:text-ink",
            )}>
            <IconBook size={16} strokeWidth={2} />
            Хичээл
          </button>

          <button
            onClick={() => setActiveTab("reading")}
            className={cn(
              "flex items-center gap-2 px-5 py-3.5 text-[14px] font-extrabold border-b-2 transition-all -mb-px",
              activeTab === "reading"
                ? "border-sky-300 text-sky-300"
                : "border-transparent text-ink-muted hover:text-ink",
            )}>
            <IconEye size={16} strokeWidth={2} />
            Унших
          </button>
        </div>
      </AppContainer>

      {activeTab === "lessons" ? (
        <AppContainer size="6xl" className="py-8 pb-14">
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border-2 border-paper-100 rounded-[24px] p-5">
              <p className="text-[28px] font-black text-sky-300">
                {lessons.length}
              </p>
              <p className="text-[12px] font-extrabold text-ink-muted uppercase">
                Нийт хичээл
              </p>
            </div>
            <div className="bg-white border-2 border-paper-100 rounded-[24px] p-5">
              <p className="text-[28px] font-black text-grass-300">
                {groupedLessons.length}
              </p>
              <p className="text-[12px] font-extrabold text-ink-muted uppercase">
                Суралцах түвшин
              </p>
            </div>
            <div className="bg-white border-2 border-paper-100 rounded-[24px] p-5">
              <p className="text-[28px] font-black text-sand-300">
                {
                  Object.values(progressMap).filter(
                    (status) => status === "COMPLETED",
                  ).length
                }
              </p>
              <p className="text-[12px] font-extrabold text-ink-muted uppercase">
                Дууссан хичээл
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {groupedLessons.map((cat) => {
                const tone =
                  LEVEL_TONE_MAP[
                    cat.meta.tone as keyof typeof LEVEL_TONE_MAP
                  ] ?? LEVEL_TONE_MAP.sky;

                return (
                  <section
                    key={cat.level}
                    className="bg-white border-2 border-paper-100 rounded-[28px] p-5 md:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            "w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0",
                            tone.badge,
                          )}>
                          <LevelIcon icon={cat.meta.icon} size={22} />
                        </div>
                        <div>
                          <div
                            className={cn(
                              "inline-flex items-center gap-2 border rounded-xl px-3 py-1.5 mb-2",
                              tone.badge,
                            )}>
                            <span className="text-[11px] font-extrabold uppercase tracking-[0.5px]">
                              {cat.meta.title}
                            </span>
                            <span className="text-[10px] font-black opacity-70">
                              {cat.items.length} хичээл
                            </span>
                          </div>
                          <h3 className="text-[22px] md:text-[26px] font-black text-ink">
                            {cat.meta.subtitle}
                          </h3>
                          <p className="text-[13px] text-ink-muted font-semibold leading-relaxed max-w-[760px] mt-1">
                            {cat.meta.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {cat.items.map((lesson) => {
                      const free = FREE_LESSON_SLUGS.includes(lesson.slug);
                      const accessible = isLoggedIn || free;
                      const progressStatus = progressMap[lesson.id];

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => handleLessonClick(lesson)}
                          className={cn(
                            "w-full min-h-[180px] flex flex-col items-start text-left rounded-[24px] border-2 p-5 transition-all duration-150",
                            accessible
                              ? "bg-paper-50 text-ink border-paper-100 hover:border-sky-100 hover:-translate-y-0.5"
                              : "bg-paper-50 text-ink-muted/60 border-paper-100",
                          )}>
                          <div className="w-full flex items-start justify-between gap-3 mb-4">
                            <div
                              className={cn(
                                "w-9 h-9 rounded-2xl flex items-center justify-center",
                                tone.active,
                              )}>
                              <span
                                className={cn(
                                  "w-2.5 h-2.5 rounded-full",
                                  progressStatus === "COMPLETED"
                                    ? "bg-grass-300"
                                    : progressStatus === "IN_PROGRESS"
                                      ? "bg-sand-300"
                                      : tone.dot,
                                )}
                              />
                            </div>

                            {progressStatus === "COMPLETED" ? (
                              <span className="text-[10px] bg-grass-50 text-grass-300 px-2.5 py-1 rounded-xl font-extrabold shrink-0">
                                Дууссан
                              </span>
                            ) : progressStatus === "IN_PROGRESS" ? (
                              <span className="text-[10px] bg-sand-50 text-sand-300 px-2.5 py-1 rounded-xl font-extrabold shrink-0">
                                Судалж буй
                              </span>
                            ) : !accessible ? (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-white border border-paper-100 text-ink-muted px-2.5 py-1 rounded-xl font-extrabold shrink-0">
                                <IconLock
                                  size={10}
                                  color="#6a6a8a"
                                  strokeWidth={2}
                                  className="opacity-70"
                                />
                                Нэвтрэх
                              </span>
                            ) : free && !isLoggedIn ? (
                              <span className="text-[10px] bg-sky-50 text-sky-300 px-2.5 py-1 rounded-xl font-extrabold shrink-0">
                                Нээлттэй
                              </span>
                            ) : null}
                          </div>

                          <span className="text-[18px] font-black leading-tight mb-2">
                            {lesson.title}
                          </span>

                          <span className="text-[13px] text-ink-muted font-semibold leading-relaxed line-clamp-3 flex-1">
                            {lesson.description ||
                              "Дүрэм, жишээ, дасгал, төгсгөлийн шалгалттай хичээл."}
                          </span>

                          <span
                            className={cn(
                              "mt-5 inline-flex items-center gap-1.5 text-[12px] font-extrabold",
                              accessible ? "text-sky-300" : "text-ink-muted",
                            )}>
                            Хичээл эхлэх
                            <IconChevRight size={13} strokeWidth={2.5} />
                          </span>
                        </button>
                      );
                    })}
                    </div>
                  </section>
                );
              })}
          </div>
        </AppContainer>
      ) : (
        <ReadingTabPanel />
      )}
    </div>
  );
}

function ReadingTabPanel() {
  const { isLoggedIn, openAuthModal } = useAppStore();

  const [articles, setArticles] = useState<ReadingArticle[]>([]);
  const [current, setCurrent] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  async function loadArticles() {
    try {
      setLoading(true);
      setErrorMsg("");

      const res = await fetch("/api/admin/articles", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Нийтлэлүүдийг ачаалж чадсангүй.");
      }

      const data: ReadingArticle[] = await res.json();
      const published = data.filter((a) => a.isPublished);

      setArticles(published);
      setCurrent(0);
      setShowTranslation(false);
    } catch (error) {
      console.error(error);
      setErrorMsg(error instanceof Error ? error.message : "Алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadArticles();
  }, []);

  useEffect(() => {
    if (current > articles.length - 1) {
      setCurrent(0);
    }
  }, [articles, current]);

  const article = useMemo(() => {
    if (!articles.length) return null;
    return articles[current] ?? articles[0];
  }, [articles, current]);

  const lvlStyle =
    LEVEL_STYLE[article?.levelLabel || "Анхан шат"] ?? LEVEL_STYLE["Анхан шат"];

  const scriptLayout = useMemo(() => {
    return getReadingScriptLayout(article?.scriptText || "");
  }, [article?.scriptText]);

  if (loading) {
    return (
      <AppContainer size="6xl" className="py-8 pb-14">
        <div className="bg-white border-2 border-paper-100 rounded-3xl p-12 text-center">
          <p className="text-[16px] font-bold text-ink-muted">
            Нийтлэлүүдийг ачаалж байна...
          </p>
        </div>
      </AppContainer>
    );
  }

  if (errorMsg) {
    return (
      <AppContainer size="6xl" className="py-8 pb-14">
        <div className="bg-white border-2 border-paper-100 rounded-3xl p-12 text-center">
          <p className="text-[16px] font-bold text-ember-300 mb-4">
            {errorMsg}
          </p>

          <button
            onClick={loadArticles}
            className="bg-sky-300 text-white font-extrabold text-[14px] px-6 py-3 rounded-2xl hover:bg-sky-200 transition-all">
            Дахин оролдох
          </button>
        </div>
      </AppContainer>
    );
  }

  if (!article) {
    return (
      <AppContainer size="6xl" className="py-8 pb-14">
        <div className="bg-white border-2 border-paper-100 rounded-3xl p-12 text-center">
          <p className="text-[16px] font-bold text-ink-muted">
            Нийтлэгдсэн нийтлэл алга байна.
          </p>
        </div>
      </AppContainer>
    );
  }

  return (
    <AppContainer size="6xl" className="py-8 pb-14">
      <div className="grid grid-cols-[300px_1fr] gap-8">
        <aside>
          <p className="text-[11px] font-extrabold text-ink-muted uppercase tracking-[0.5px] mb-3">
            Нийтлэлүүд
          </p>

          <div className="flex flex-col gap-2">
            {articles.map((a, i) => {
              const locked = !isLoggedIn && i > 0;

              return (
                <ScrollReveal key={a.id} delay={((i % 4) + 1) as any}>
                  <button
                    onClick={() => {
                      if (locked) {
                        openAuthModal("up");
                        return;
                      }

                      setCurrent(i);
                      setShowTranslation(false);
                    }}
                    className={cn(
                      "w-full bg-white border-2 rounded-2xl px-4 py-4 text-left transition-all",
                      current === i
                        ? "border-sand-300 bg-sand-50"
                        : "border-paper-100 hover:border-sky-100 hover:bg-sky-50",
                      locked && "opacity-60",
                    )}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[14px] font-extrabold leading-snug">
                        {a.title}
                      </p>

                      {locked && (
                        <span className="text-[10px] bg-paper-50 border border-paper-100 text-ink-muted px-2 py-1 rounded-lg font-extrabold shrink-0">
                          Түгжээтэй
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-ink-muted font-semibold mt-1">
                      {a.levelLabel || "Анхан шат"}
                    </p>
                  </button>
                </ScrollReveal>
              );
            })}
          </div>
        </aside>

        <ScrollReveal>
          <div className="bg-white border-2 border-paper-100 rounded-3xl overflow-hidden">
            <div className="bg-gradient-to-r from-sand-50 to-white border-b-2 border-paper-100 px-10 py-7">
              <div className="flex items-center gap-3 mb-1">
                <span
                  className={cn(
                    "text-[11px] font-extrabold px-3 py-1 rounded-xl uppercase border",
                    lvlStyle.bg,
                    lvlStyle.text,
                    lvlStyle.border,
                  )}>
                  {article.levelLabel || "Анхан шат"}
                </span>
              </div>

              <h2 className="text-[28px] font-black mt-2">{article.title}</h2>
            </div>

            <div className="p-10">
              <div className="grid grid-cols-[230px_1fr] gap-10 items-start mb-7">
                <div className="border-r-2 border-paper-100 pr-8">
                  <div className="bg-paper-50/60 rounded-2xl p-4 overflow-x-auto overflow-y-hidden">
                    <div className="inline-block min-w-full align-top">
                      <span
                        className="font-mongolian text-sand-300 inline-block whitespace-pre-wrap break-all"
                        style={{
                          writingMode: "vertical-lr",
                          textOrientation: "mixed",
                          fontSize: scriptLayout.fontSize,
                          lineHeight: scriptLayout.lineHeight,
                          letterSpacing: `${scriptLayout.letterSpacing}px`,
                          height: scriptLayout.height,
                          minHeight: scriptLayout.height,
                        }}>
                        {article.scriptText}
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-ink-muted font-bold mt-3 text-center">
                    {[...article.scriptText].length} тэмдэгт
                  </p>
                </div>

                <div>
                  <p className="text-[16px] leading-[2.05] font-semibold text-ink">
                    {article.cyrillicText}
                  </p>
                </div>
              </div>

              <div className="border-t-2 border-paper-100 pt-6 flex items-center gap-4 flex-wrap">
                <button
                  onClick={() => setShowTranslation((v) => !v)}
                  className={cn(
                    "text-[13px] font-extrabold px-4 py-2.5 rounded-xl transition-all border-2",
                    showTranslation
                      ? "bg-sky-50 border-sky-100 text-sky-300"
                      : "bg-white border-paper-100 text-ink-muted hover:border-sky-100",
                  )}>
                  {showTranslation ? "Орчуулга нуух" : "Орчуулга харах"}
                </button>

                {showTranslation && (
                  <p className="text-[13px] font-semibold text-ink-muted italic flex-1">
                    {article.cyrillicText}
                  </p>
                )}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </AppContainer>
  );
}
