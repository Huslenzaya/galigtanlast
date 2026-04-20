"use client";

import { AppContainer } from "@/components/layout/AppContainer";
import {
  IconBook,
  IconChevRight,
  IconEye,
  IconLock,
} from "@/components/ui/Icons";
import { PageHero } from "@/components/ui/PageHero";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
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
      const arr = map.get(lesson.grade) ?? [];
      arr.push(lesson);
      map.set(lesson.grade, arr);
    });

    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([grade, items], index) => ({
        cat: `${grade}-р анги`,
        color: COLOR_ORDER[index % COLOR_ORDER.length],
        items,
      }));
  }, [lessons]);

  const selectedLesson = useMemo(() => {
    if (!lessons.length) return null;
    return lessons.find((l) => l.id === selectedLessonId) ?? lessons[0];
  }, [lessons, selectedLessonId]);

  const isFree = selectedLesson
    ? FREE_LESSON_SLUGS.includes(selectedLesson.slug)
    : false;

  const canAccess = isLoggedIn || isFree;

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
          <div className="grid grid-cols-[280px_1fr] gap-8">
            <aside className="flex flex-col gap-2">
              {groupedLessons.map((cat) => (
                <div key={cat.cat} className="mb-2">
                  <p className="text-[11px] font-extrabold text-ink-muted tracking-[0.5px] uppercase px-1 py-2">
                    {cat.cat}
                  </p>

                  <div className="flex flex-col gap-2">
                    {cat.items.map((lesson) => {
                      const free = FREE_LESSON_SLUGS.includes(lesson.slug);
                      const accessible = isLoggedIn || free;
                      const isActive = selectedLesson.id === lesson.id;
                      const progressStatus = progressMap[lesson.id];

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => handleLessonClick(lesson)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[13px] font-bold text-left transition-all duration-150 border",
                            isActive
                              ? COLOR_MAP[cat.color].active
                              : accessible
                                ? "bg-white text-ink border-paper-100 hover:border-sky-100 hover:bg-paper-50"
                                : "bg-white text-ink-muted/50 border-paper-100",
                          )}>
                          <div
                            className={cn(
                              "w-2.5 h-2.5 rounded-full shrink-0",
                              progressStatus === "COMPLETED"
                                ? "bg-grass-300"
                                : progressStatus === "IN_PROGRESS"
                                  ? "bg-sand-300"
                                  : COLOR_MAP[cat.color].dot,
                            )}
                          />

                          <span className="flex-1 leading-snug">
                            {lesson.title}
                          </span>

                          {progressStatus === "COMPLETED" ? (
                            <span className="text-[10px] bg-grass-50 text-grass-300 px-2.5 py-1 rounded-xl font-extrabold shrink-0">
                              Дууссан
                            </span>
                          ) : progressStatus === "IN_PROGRESS" ? (
                            <span className="text-[10px] bg-sand-50 text-sand-300 px-2.5 py-1 rounded-xl font-extrabold shrink-0">
                              Судалж буй
                            </span>
                          ) : !accessible ? (
                            <IconLock
                              size={11}
                              color="#6a6a8a"
                              strokeWidth={2}
                              className="opacity-50 shrink-0"
                            />
                          ) : free && !isLoggedIn ? (
                            <span className="text-[10px] bg-sky-50 text-sky-300 px-2.5 py-1 rounded-xl font-extrabold shrink-0">
                              Нээлттэй
                            </span>
                          ) : isActive ? (
                            <IconChevRight
                              size={12}
                              color="#1a6bbd"
                              strokeWidth={2.5}
                            />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </aside>

            <main>
              {canAccess ? (
                <ScrollReveal>
                  <div className="bg-white border border-paper-100 rounded-[28px] p-9 mb-5">
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <div className="flex-1">
                        <h3 className="text-[24px] font-black text-ink">
                          {selectedLesson.title}
                        </h3>

                        {selectedLesson.description && (
                          <p className="text-[14px] text-ink-muted font-semibold mt-2 leading-relaxed max-w-[760px]">
                            {selectedLesson.description}
                          </p>
                        )}
                      </div>

                      {isFree && !isLoggedIn && (
                        <span className="text-[11px] bg-sky-50 border border-sky-100 text-sky-300 px-3 py-1.5 rounded-xl font-extrabold shrink-0">
                          Нээлттэй хичээл
                        </span>
                      )}
                    </div>

                    <div
                      dangerouslySetInnerHTML={{
                        __html: formatLessonContent(selectedLesson.content),
                      }}
                    />
                  </div>

                  <button
                    onClick={startLessonQuiz}
                    className="w-full bg-sky-300 hover:bg-sky-200 text-white font-extrabold text-[15px] rounded-2xl py-4 transition-all">
                    Шалгалт өгөх
                  </button>
                </ScrollReveal>
              ) : (
                <div className="bg-white border border-paper-100 rounded-[28px] p-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-paper-50 border border-paper-100 flex items-center justify-center mx-auto mb-4">
                    <IconLock size={22} color="#6a6a8a" strokeWidth={1.8} />
                  </div>

                  <h3 className="text-[22px] font-black mb-2">
                    {selectedLesson.title}
                  </h3>

                  <p className="text-ink-muted font-semibold mb-6 max-w-[300px] mx-auto text-[13px] leading-relaxed">
                    Энэ хичээлийг үзэхийн тулд нэвтрэх шаардлагатай.
                  </p>

                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => openAuthModal("up")}
                      className="bg-sky-300 text-white font-extrabold text-[14px] px-6 py-2.5 rounded-xl hover:bg-sky-200 transition-all">
                      Бүртгүүлэх
                    </button>

                    <button
                      onClick={() => openAuthModal("in")}
                      className="bg-white border border-paper-100 text-ink font-bold text-[14px] px-6 py-2.5 rounded-xl hover:border-sky-100 transition-all">
                      Нэвтрэх
                    </button>
                  </div>
                </div>
              )}
            </main>
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
