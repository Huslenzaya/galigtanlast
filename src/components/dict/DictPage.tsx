"use client";

import { PageHero } from "@/components/ui/PageHero";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { LETTERS } from "@/lib/data";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

interface DictionaryWordItem {
  id: string;
  scriptWord: string;
  romanization: string | null;
  cyrillicWord: string;
  category: string | null;
  description: string | null;
  grade: number | null;
  level: number | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

const DICT_UNLEARNED_KEY = "galigtan-dict-unlearned-letters";

function getWordScriptLayout(word: string) {
  const len = [...(word || "")].length;

  if (len > 30) {
    return {
      fontSize: 14,
      height: 150,
      lineHeight: 1.6,
      letterSpacing: 0.3,
    };
  }

  if (len > 22) {
    return {
      fontSize: 15,
      height: 132,
      lineHeight: 1.65,
      letterSpacing: 0.5,
    };
  }

  if (len > 16) {
    return {
      fontSize: 16,
      height: 118,
      lineHeight: 1.72,
      letterSpacing: 0.7,
    };
  }

  if (len > 10) {
    return {
      fontSize: 18,
      height: 98,
      lineHeight: 1.8,
      letterSpacing: 1,
    };
  }

  return {
    fontSize: 22,
    height: 64,
    lineHeight: 1.9,
    letterSpacing: 1.3,
  };
}

function getDisplaySound(value: string) {
  const key = String(value || "")
    .toLowerCase()
    .trim();

  const map: Record<string, string> = {
    a: "а",
    e: "э",
    i: "и",
    o: "о",
    u: "у",
    ö: "ө",
    ü: "ү",
    ү: "ү",

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

  return map[key] ?? value;
}

export function DictPage() {
  const { learnedLetters, markLetterLearned, dictTab, setDictTab } =
    useAppStore();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "vowel" | "consonant">("all");
  const [unlearnedLetters, setUnlearnedLetters] = useState<number[]>([]);

  const [words, setWords] = useState<DictionaryWordItem[]>([]);
  const [loadingWords, setLoadingWords] = useState(true);
  const [wordError, setWordError] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DICT_UNLEARNED_KEY);
      const parsed = saved ? JSON.parse(saved) : [];

      if (Array.isArray(parsed)) {
        setUnlearnedLetters(parsed.filter((item) => typeof item === "number"));
      }
    } catch {
      setUnlearnedLetters([]);
    }
  }, []);

  useEffect(() => {
    async function loadWords() {
      try {
        setLoadingWords(true);
        setWordError("");

        const res = await fetch("/api/words", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Үгсийг ачаалж чадсангүй.");
        }

        const data = await res.json();
        setWords(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        setWordError(
          error instanceof Error ? error.message : "Үгсийг ачаалж чадсангүй.",
        );
      } finally {
        setLoadingWords(false);
      }
    }

    loadWords();
  }, []);

  function saveUnlearnedLetters(next: number[]) {
    setUnlearnedLetters(next);
    localStorage.setItem(DICT_UNLEARNED_KEY, JSON.stringify(next));
  }

  const learnedSet = useMemo(() => {
    const hidden = new Set(unlearnedLetters);
    return new Set(learnedLetters.filter((idx) => !hidden.has(idx)));
  }, [learnedLetters, unlearnedLetters]);

  const q = query.toLowerCase();

  const filteredLetters = useMemo(() => {
    return LETTERS.filter((l) => {
      if (filter !== "all" && l.t !== filter) return false;

      const sound = getDisplaySound(l.r).toLowerCase();

      return (
        !q ||
        l.r.toLowerCase().includes(q) ||
        sound.includes(q) ||
        l.x.toLowerCase().includes(q)
      );
    });
  }, [filter, q]);

  const filteredWords = useMemo(() => {
    return words.filter((w) => {
      const roman = (w.romanization || "").toLowerCase();
      const cyr = (w.cyrillicWord || "").toLowerCase();
      const cat = (w.category || "").toLowerCase();
      const script = (w.scriptWord || "").toLowerCase();

      return (
        !q ||
        roman.includes(q) ||
        cyr.includes(q) ||
        cat.includes(q) ||
        script.includes(q)
      );
    });
  }, [words, q]);

  function toggleLetterLearned(idx: number) {
    if (idx < 0) return;

    const learned = learnedSet.has(idx);

    if (learned) {
      const next = Array.from(new Set([...unlearnedLetters, idx]));
      saveUnlearnedLetters(next);
      return;
    }

    const next = unlearnedLetters.filter((item) => item !== idx);
    saveUnlearnedLetters(next);
    markLetterLearned(idx);
  }

  return (
    <div className="min-h-screen bg-paper">
      <PageHero
        eyebrow="Лавлах"
        title="Толь бичиг"
        variant="purple"
        description={`35 үсэг · ${loadingWords ? "..." : words.length} үг — Бүртгэлгүйгээр бүрэн харагдана`}
        mongolText="ᠲᠣᠯᠢ"
      />

      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
        <div className="flex gap-3 mb-6 items-center">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted text-[14px]"></span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Хайх... (монгол авиа, үг, ангилал)"
              className="w-full pl-10 pr-4 py-3.5 border-2 border-paper-100 rounded-2xl bg-white font-bold text-[14px] outline-none transition-all focus:border-sky-100 focus:shadow-[0_0_0_3px_rgba(26,107,189,.1)]"
            />
          </div>

          <div className="flex bg-paper-50 border-2 border-paper-100 rounded-2xl p-1 shrink-0">
            {(["letters", "words"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setDictTab(t)}
                className={cn(
                  "text-[13px] font-extrabold px-4 py-2.5 rounded-xl transition-all",
                  dictTab === t
                    ? "bg-ink text-white"
                    : "text-ink-muted hover:text-ink",
                )}>
                {t === "letters" ? "Үсгүүд" : "Үгнүүд"}
              </button>
            ))}
          </div>
        </div>

        {dictTab === "letters" && (
          <div className="flex gap-2 mb-6 flex-wrap">
            {(["all", "vowel", "consonant"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "text-[12px] font-extrabold px-4 py-2.5 rounded-xl border-2 transition-all",
                  filter === f
                    ? "bg-sky-300 border-sky-300 text-white"
                    : "bg-white border-paper-100 text-ink-muted hover:text-ink",
                )}>
                {f === "all"
                  ? `Бүгд (${LETTERS.length})`
                  : f === "vowel"
                    ? "Эгшиг (7)"
                    : "Гийгүүлэгч (26+)"}
              </button>
            ))}
          </div>
        )}

        {dictTab === "letters" && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-4">
            {filteredLetters.map((l, i) => {
              const idx = LETTERS.indexOf(l);
              const learned = learnedSet.has(idx);

              return (
                <ScrollReveal
                  key={l.mg}
                  type="scale"
                  delay={((i % 5) + 1) as any}>
                  <button
                    onClick={() => toggleLetterLearned(idx)}
                    className={cn(
                      "bg-white border-2 rounded-2xl p-5 flex flex-col items-center gap-2.5 transition-all hover:-translate-y-1 hover:shadow-medium group",
                      learned
                        ? "border-grass-100 bg-grass-50"
                        : "border-paper-100 hover:border-sky-100",
                    )}>
                    <div
                      className={cn(
                        "w-14 h-14 rounded-xl flex items-center justify-center transition-colors",
                        l.t === "vowel"
                          ? "bg-sky-50 group-hover:bg-sky-100"
                          : "bg-sand-50 group-hover:bg-sand-100",
                      )}>
                      <span
                        className={
                          l.t === "vowel"
                            ? "font-mongolian text-sky-300"
                            : "font-mongolian text-sand-300"
                        }
                        style={{
                          writingMode: "vertical-lr",
                          fontSize: 26,
                          height: 34,
                        }}>
                        {l.mg}
                      </span>
                    </div>

                    <p className="text-[15px] font-extrabold text-ink">
                      {getDisplaySound(l.r)}
                    </p>

                    <p className="text-[10px] font-semibold text-ink-muted">
                      {l.x}
                    </p>

                    <span
                      className={cn(
                        "text-[9px] font-extrabold px-2 py-0.5 rounded-full",
                        l.t === "vowel"
                          ? "bg-sky-50 text-sky-300"
                          : "bg-sand-50 text-sand-300",
                      )}>
                      {l.t === "vowel" ? "ЭГШИГ" : "ГИЙГ."}
                    </span>

                    {learned && (
                      <span className="text-[10px] text-grass-300 font-extrabold">
                        Сурсан
                      </span>
                    )}
                  </button>
                </ScrollReveal>
              );
            })}
          </div>
        )}

        {dictTab === "words" && (
          <div className="bg-white border-2 border-paper-100 rounded-3xl overflow-hidden">
            <div className="grid grid-cols-[1.1fr_1fr_1fr_150px] border-b-2 border-paper-100">
              {["Монгол бичиг", "Кирилл", "Латин", "Ангилал"].map((h) => (
                <div
                  key={h}
                  className="px-6 py-4 text-[11px] font-extrabold text-ink-muted uppercase tracking-wide">
                  {h}
                </div>
              ))}
            </div>

            {loadingWords && (
              <div className="text-center py-14 text-ink-muted font-semibold">
                Үгсийг ачаалж байна...
              </div>
            )}

            {!loadingWords && wordError && (
              <div className="text-center py-14 text-ember-300 font-semibold">
                {wordError}
              </div>
            )}

            {!loadingWords &&
              !wordError &&
              filteredWords.map((w, i) => {
                const scriptLayout = getWordScriptLayout(w.scriptWord);

                return (
                  <ScrollReveal key={w.id} delay={((i % 4) + 1) as any}>
                    <div className="grid grid-cols-[1.1fr_1fr_1fr_150px] border-b border-paper-50 hover:bg-paper-50 transition-colors group">
                      <div className="px-6 py-4 flex items-start">
                        <div className="w-full overflow-x-auto overflow-y-hidden">
                          <div className="inline-block pr-2 align-top">
                            <span
                              className="font-mongolian text-sand-300 group-hover:mg-glow transition-all inline-block whitespace-pre-wrap break-all"
                              style={{
                                writingMode: "vertical-lr",
                                textOrientation: "mixed",
                                fontSize: scriptLayout.fontSize,
                                lineHeight: scriptLayout.lineHeight,
                                letterSpacing: `${scriptLayout.letterSpacing}px`,
                                height: scriptLayout.height,
                                minHeight: scriptLayout.height,
                              }}>
                              {w.scriptWord}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="px-6 py-4 flex items-center font-extrabold text-[15px]">
                        {w.cyrillicWord}
                      </div>

                      <div className="px-6 py-4 flex items-center text-[13px] font-semibold text-ink-muted">
                        {w.romanization || "-"}
                      </div>

                      <div className="px-6 py-4 flex items-center">
                        <span className="text-[11px] font-extrabold bg-sky-50 text-sky-300 border border-sky-100 px-2.5 py-1 rounded-xl">
                          {w.category || "Ангилалгүй"}
                        </span>
                      </div>
                    </div>
                  </ScrollReveal>
                );
              })}

            {!loadingWords && !wordError && filteredWords.length === 0 && (
              <div className="text-center py-14 text-ink-muted font-semibold">
                Хайлтын үр дүн олдсонгүй
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
