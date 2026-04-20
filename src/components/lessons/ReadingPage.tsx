"use client";

import { AppContainer } from "@/components/layout/AppContainer";
import { PageHero } from "@/components/ui/PageHero";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

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

function ReadingHero() {
  return (
    <PageHero
      eyebrow="Уншлагын хэсэг"
      title="Унших"
      description="Монгол бичгийн богино нийтлэл, эхийг уншиж дадлага хийнэ."
      mongolText="ᠤᠩᠰᠢᠬᠤ"
      variant="purple"
      rightText={["ᠤ", "ᠩ", "ᠰ", "ᠢ", "ᠬ", "ᠤ"]}
    />
  );
}

export function ReadingPage() {
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
    const len = [...(article?.scriptText || "")].length;

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
  }, [article?.scriptText]);

  if (loading) {
    return (
      <div className="min-h-screen bg-paper">
        <ReadingHero />

        <AppContainer size="6xl" className="py-16">
          <div className="bg-white border-2 border-paper-100 rounded-3xl p-12 text-center">
            <p className="text-[16px] font-bold text-ink-muted">
              Нийтлэлүүдийг ачаалж байна...
            </p>
          </div>
        </AppContainer>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-paper">
        <ReadingHero />

        <AppContainer size="6xl" className="py-16">
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
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-paper">
        <ReadingHero />

        <AppContainer size="6xl" className="py-16">
          <div className="bg-white border-2 border-paper-100 rounded-3xl p-12 text-center">
            <p className="text-[16px] font-bold text-ink-muted">
              Нийтлэгдсэн нийтлэл алга байна.
            </p>
          </div>
        </AppContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <ReadingHero />

      <AppContainer size="6xl" className="py-10">
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
    </div>
  );
}
