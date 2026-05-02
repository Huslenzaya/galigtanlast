"use client";

import { AdminModal } from "@/components/admin/AdminModal";
import { QuizAdmin } from "@/components/admin/QuizAdmin";
import { UsersAdmin } from "@/components/admin/UsersAdmin";
import {
  IconAward,
  IconBook,
  IconGlobe,
  IconLayers,
  IconPen,
  IconTarget,
} from "@/components/ui/Icons";
import { MongolianKeyboard } from "@/components/ui/MongolianKeyboard";
import { LEVEL_META, getLevelMeta } from "@/lib/data";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type AdminTab = "overview" | "lessons" | "words" | "users" | "content" | "quiz";
type LessonStatus = "DRAFT" | "PUBLISHED";
type AdminModalType = null | "lesson" | "word" | "article";

interface AdminLesson {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  grade: number;
  level: number;
  sortOrder: number;
  content: string;
  status: LessonStatus;
  createdAt: string;
  updatedAt: string;
}

interface AdminWord {
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

interface AdminArticle {
  id: string;
  title: string;
  levelLabel: string | null;
  scriptText: string;
  cyrillicText: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

const TABS: { id: AdminTab; label: string }[] = [
  { id: "overview", label: "Тойм" },
  { id: "lessons", label: "Хичээлүүд" },
  { id: "words", label: "Үгс" },
  { id: "content", label: "Нийтлэл" },
  { id: "users", label: "Хэрэглэгчид" },
  { id: "quiz", label: "Тест" },
];

const EMPTY_LESSON = {
  title: "",
  slug: "",
  description: "",
  grade: 6,
  level: 1,
  sortOrder: 1,
  content: "",
  keyPoints: "",
  examples: "",
  tasks: "",
  wrapUp: "",
  status: "PUBLISHED" as LessonStatus,
};

const GUIDED_LESSON_VERSION = 1;

interface GuidedLessonContent {
  version: number;
  intro: string;
  keyPoints: string[];
  examples: { script: string; cyrillic: string; note?: string }[];
  tasks: { prompt: string; answer: string; hint?: string }[];
  wrapUp?: string;
}

const EMPTY_WORD = {
  scriptWord: "",
  romanization: "",
  cyrillicWord: "",
  category: "",
  description: "",
  grade: 6,
  level: 1,
  isPublished: true,
};

const EMPTY_ARTICLE = {
  title: "",
  levelLabel: "",
  scriptText: "",
  cyrillicText: "",
  isPublished: true,
};

function makeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function lines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parsePipeRows(value: string, expectedMin: number) {
  return lines(value)
    .map((line) => line.split("|").map((part) => part.trim()))
    .filter((parts) => parts.length >= expectedMin && parts[0] && parts[1]);
}

function buildGuidedLessonContent(form: typeof EMPTY_LESSON) {
  const content: GuidedLessonContent = {
    version: GUIDED_LESSON_VERSION,
    intro: form.content.trim(),
    keyPoints: lines(form.keyPoints),
    examples: parsePipeRows(form.examples, 2).map(([script, cyrillic, note]) => ({
      script,
      cyrillic,
      note: note || "",
    })),
    tasks: parsePipeRows(form.tasks, 2).map(([prompt, answer, hint]) => ({
      prompt,
      answer,
      hint: hint || "",
    })),
    wrapUp: form.wrapUp.trim(),
  };

  const hasGuidedParts =
    content.keyPoints.length > 0 ||
    content.examples.length > 0 ||
    content.tasks.length > 0 ||
    !!content.wrapUp;

  return hasGuidedParts ? JSON.stringify(content, null, 2) : form.content;
}

function parseGuidedLessonContent(content: string): Partial<typeof EMPTY_LESSON> {
  try {
    const parsed = JSON.parse(content) as Partial<GuidedLessonContent>;
    if (parsed.version !== GUIDED_LESSON_VERSION) return { content };

    return {
      content: parsed.intro ?? "",
      keyPoints: Array.isArray(parsed.keyPoints)
        ? parsed.keyPoints.join("\n")
        : "",
      examples: Array.isArray(parsed.examples)
        ? parsed.examples
            .map((item) =>
              [item.script, item.cyrillic, item.note].filter(Boolean).join(" | "),
            )
            .join("\n")
        : "",
      tasks: Array.isArray(parsed.tasks)
        ? parsed.tasks
            .map((item) =>
              [item.prompt, item.answer, item.hint].filter(Boolean).join(" | "),
            )
            .join("\n")
        : "",
      wrapUp: parsed.wrapUp ?? "",
    };
  } catch {
    return { content };
  }
}

const LEVEL_TONE_MAP = {
  sky: "bg-sky-50 border-sky-100 text-sky-300",
  grass: "bg-grass-50 border-grass-100 text-grass-300",
  sand: "bg-sand-50 border-sand-100 text-sand-300",
  ember: "bg-ember-50 border-ember-100 text-ember-300",
  purple: "bg-[#f1ecfb] border-[#d8c8f1] text-[#7c5cbf]",
  teal: "bg-[#e6f7f4] border-[#b9e6df] text-[#1a9e8a]",
} as const;

function LevelIcon({ icon, size = 15 }: { icon: string; size?: number }) {
  const props = { size, strokeWidth: 2.2 };

  if (icon === "layers") return <IconLayers {...props} />;
  if (icon === "pen") return <IconPen {...props} />;
  if (icon === "target") return <IconTarget {...props} />;
  if (icon === "award") return <IconAward {...props} />;
  if (icon === "globe") return <IconGlobe {...props} />;
  return <IconBook {...props} />;
}

function LevelBadge({ level }: { level: number }) {
  const meta = getLevelMeta(level);
  const tone =
    LEVEL_TONE_MAP[meta.tone as keyof typeof LEVEL_TONE_MAP] ??
    LEVEL_TONE_MAP.sky;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border text-[10px] font-extrabold px-2.5 py-1 rounded-lg",
        tone,
      )}>
      <LevelIcon icon={meta.icon} size={12} />
      {meta.title}
    </span>
  );
}

function lessonStatusLabel(status: LessonStatus) {
  return status === "PUBLISHED" ? "Нийтэлсэн" : "Ноорог";
}

function publishLabel(isPublished: boolean) {
  return isPublished ? "Нийтэлсэн" : "Ноорог";
}

export function AdminPage() {
  const router = useRouter();
  const { isAdmin, goTo, logout, userName } = useAppStore();

  const [tab, setTab] = useState<AdminTab>("overview");
  const [modal, setModal] = useState<AdminModalType>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  const [lessons, setLessons] = useState<AdminLesson[]>([]);
  const [words, setWords] = useState<AdminWord[]>([]);
  const [articles, setArticles] = useState<AdminArticle[]>([]);

  const [lessonForm, setLessonForm] = useState(EMPTY_LESSON);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [savingLesson, setSavingLesson] = useState(false);
  const [exampleDraft, setExampleDraft] = useState({
    script: "",
    cyrillic: "",
    note: "",
  });
  const [taskDraft, setTaskDraft] = useState({
    prompt: "",
    answer: "",
    hint: "",
  });

  const [wordForm, setWordForm] = useState(EMPTY_WORD);
  const [editingWordId, setEditingWordId] = useState<string | null>(null);
  const [savingWord, setSavingWord] = useState(false);

  const [articleForm, setArticleForm] = useState(EMPTY_ARTICLE);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [savingArticle, setSavingArticle] = useState(false);

  async function parseError(res: Response, fallback: string) {
    try {
      const data = await res.json();
      return data?.message || fallback;
    } catch {
      return fallback;
    }
  }

  async function loadAdminData(showLoader = true) {
    try {
      if (showLoader) setLoading(true);
      else setRefreshing(true);

      const [lessonsRes, wordsRes, articlesRes] = await Promise.all([
        fetch("/api/admin/lessons", { cache: "no-store" }),
        fetch("/api/admin/words", { cache: "no-store" }),
        fetch("/api/admin/articles", { cache: "no-store" }),
      ]);

      if (!lessonsRes.ok) {
        throw new Error(
          await parseError(lessonsRes, "Хичээлүүдийг ачаалж чадсангүй."),
        );
      }

      if (!wordsRes.ok) {
        throw new Error(await parseError(wordsRes, "Үгсийг ачаалж чадсангүй."));
      }

      if (!articlesRes.ok) {
        throw new Error(
          await parseError(articlesRes, "Нийтлэлүүдийг ачаалж чадсангүй."),
        );
      }

      const [lessonsData, wordsData, articlesData] = await Promise.all([
        lessonsRes.json(),
        wordsRes.json(),
        articlesRes.json(),
      ]);

      setLessons(Array.isArray(lessonsData) ? lessonsData : []);
      setWords(Array.isArray(wordsData) ? wordsData : []);
      setArticles(Array.isArray(articlesData) ? articlesData : []);
      setErrorMsg("");
    } catch (error) {
      console.error(error);
      setErrorMsg(error instanceof Error ? error.message : "Алдаа гарлаа.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (isAdmin) loadAdminData();
  }, [isAdmin]);

  function showSaved(message: string) {
    setSavedMsg(message);
    setTimeout(() => setSavedMsg(""), 2200);
  }

  function resetLessonForm() {
    setLessonForm(EMPTY_LESSON);
    setEditingLessonId(null);
    setExampleDraft({ script: "", cyrillic: "", note: "" });
    setTaskDraft({ prompt: "", answer: "", hint: "" });
  }

  function resetWordForm() {
    setWordForm(EMPTY_WORD);
    setEditingWordId(null);
  }

  function resetArticleForm() {
    setArticleForm(EMPTY_ARTICLE);
    setEditingArticleId(null);
  }

  function appendExampleDraft() {
    if (!exampleDraft.script || !exampleDraft.cyrillic) return;

    const row = [exampleDraft.script, exampleDraft.cyrillic, exampleDraft.note]
      .filter(Boolean)
      .join(" | ");

    setLessonForm((prev) => ({
      ...prev,
      examples: [prev.examples, row].filter(Boolean).join("\n"),
    }));
    setExampleDraft({ script: "", cyrillic: "", note: "" });
  }

  function appendTaskDraft() {
    if (!taskDraft.prompt || !taskDraft.answer) return;

    const row = [taskDraft.prompt, taskDraft.answer, taskDraft.hint]
      .filter(Boolean)
      .join(" | ");

    setLessonForm((prev) => ({
      ...prev,
      tasks: [prev.tasks, row].filter(Boolean).join("\n"),
    }));
    setTaskDraft({ prompt: "", answer: "", hint: "" });
  }

  async function saveLesson() {
    if (!lessonForm.title) return;

    try {
      setSavingLesson(true);
      const isEditing = !!editingLessonId;

      const payload = {
        ...lessonForm,
        slug: lessonForm.slug || makeSlug(lessonForm.title),
        content: buildGuidedLessonContent(lessonForm),
      };

      const res = await fetch(
        isEditing
          ? `/api/admin/lessons/${editingLessonId}`
          : "/api/admin/lessons",
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
              ? "Хичээл засахад алдаа гарлаа."
              : "Хичээл нэмэхэд алдаа гарлаа.",
          ),
        );
      }

      resetLessonForm();
      setModal(null);
      await loadAdminData(false);
      showSaved(isEditing ? "Хичээл шинэчлэгдлээ." : "Шинэ хичээл нэмэгдлээ.");
    } catch (error) {
      console.error(error);
      setErrorMsg(error instanceof Error ? error.message : "Алдаа гарлаа.");
    } finally {
      setSavingLesson(false);
    }
  }

  function startEditLesson(lesson: AdminLesson) {
    router.push(`/admin/lessons/${lesson.id}/edit`);
  }

  async function deleteLesson(id: string) {
    const ok = window.confirm("Энэ хичээлийг устгах уу?");
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/lessons/${id}`, { method: "DELETE" });

      if (!res.ok) {
        throw new Error(await parseError(res, "Хичээл устгахад алдаа гарлаа."));
      }

      await loadAdminData(false);
      if (editingLessonId === id) resetLessonForm();
      showSaved("Хичээл устгагдлаа.");
    } catch (error) {
      console.error(error);
      setErrorMsg(error instanceof Error ? error.message : "Алдаа гарлаа.");
    }
  }

  async function saveWord() {
    if (!wordForm.scriptWord || !wordForm.cyrillicWord) return;

    try {
      setSavingWord(true);
      const isEditing = !!editingWordId;

      const res = await fetch(
        isEditing ? `/api/admin/words/${editingWordId}` : "/api/admin/words",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(wordForm),
        },
      );

      if (!res.ok) {
        throw new Error(
          await parseError(
            res,
            isEditing
              ? "Үгийг засахад алдаа гарлаа."
              : "Үг нэмэхэд алдаа гарлаа.",
          ),
        );
      }

      resetWordForm();
      setModal(null);
      await loadAdminData(false);
      showSaved(isEditing ? "Үг шинэчлэгдлээ." : "Шинэ үг нэмэгдлээ.");
    } catch (error) {
      console.error(error);
      setErrorMsg(error instanceof Error ? error.message : "Алдаа гарлаа.");
    } finally {
      setSavingWord(false);
    }
  }

  function startEditWord(word: AdminWord) {
    setWordForm({
      scriptWord: word.scriptWord,
      romanization: word.romanization ?? "",
      cyrillicWord: word.cyrillicWord,
      category: word.category ?? "",
      description: word.description ?? "",
      grade: word.grade ?? 6,
      level: word.level ?? 1,
      isPublished: word.isPublished,
    });
    setEditingWordId(word.id);
    setTab("words");
    setModal("word");
  }

  async function deleteWord(id: string) {
    const ok = window.confirm("Энэ үгийг устгах уу?");
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/words/${id}`, { method: "DELETE" });

      if (!res.ok) {
        throw new Error(await parseError(res, "Үг устгахад алдаа гарлаа."));
      }

      await loadAdminData(false);
      if (editingWordId === id) resetWordForm();
      showSaved("Үг устгагдлаа.");
    } catch (error) {
      console.error(error);
      setErrorMsg(error instanceof Error ? error.message : "Алдаа гарлаа.");
    }
  }

  async function saveArticle() {
    if (
      !articleForm.title ||
      !articleForm.scriptText ||
      !articleForm.cyrillicText
    ) {
      return;
    }

    try {
      setSavingArticle(true);
      const isEditing = !!editingArticleId;

      const res = await fetch(
        isEditing
          ? `/api/admin/articles/${editingArticleId}`
          : "/api/admin/articles",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(articleForm),
        },
      );

      if (!res.ok) {
        throw new Error(
          await parseError(
            res,
            isEditing
              ? "Нийтлэлийг засахад алдаа гарлаа."
              : "Нийтлэл нэмэхэд алдаа гарлаа.",
          ),
        );
      }

      resetArticleForm();
      setModal(null);
      await loadAdminData(false);
      showSaved(
        isEditing ? "Нийтлэл шинэчлэгдлээ." : "Шинэ нийтлэл нэмэгдлээ.",
      );
    } catch (error) {
      console.error(error);
      setErrorMsg(error instanceof Error ? error.message : "Алдаа гарлаа.");
    } finally {
      setSavingArticle(false);
    }
  }

  function startEditArticle(article: AdminArticle) {
    setArticleForm({
      title: article.title,
      levelLabel: article.levelLabel ?? "",
      scriptText: article.scriptText,
      cyrillicText: article.cyrillicText,
      isPublished: article.isPublished,
    });
    setEditingArticleId(article.id);
    setTab("content");
    setModal("article");
  }

  async function deleteArticle(id: string) {
    const ok = window.confirm("Энэ нийтлэлийг устгах уу?");
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/articles/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error(
          await parseError(res, "Нийтлэл устгахад алдаа гарлаа."),
        );
      }

      await loadAdminData(false);
      if (editingArticleId === id) resetArticleForm();
      showSaved("Нийтлэл устгагдлаа.");
    } catch (error) {
      console.error(error);
      setErrorMsg(error instanceof Error ? error.message : "Алдаа гарлаа.");
    }
  }

  const overview = useMemo(() => {
    const publishedLessons = lessons.filter(
      (l) => l.status === "PUBLISHED",
    ).length;
    const publishedWords = words.filter((w) => w.isPublished).length;
    const publishedArticles = articles.filter((a) => a.isPublished).length;

    return [
      {
        n: lessons.length,
        label: "Нийт хичээл",
        color: "text-sky-300",
        sub: `${publishedLessons} нийтэлсэн`,
      },
      {
        n: words.length,
        label: "Нийт үг",
        color: "text-grass-300",
        sub: `${publishedWords} нийтэлсэн`,
      },
      {
        n: articles.length,
        label: "Нийтлэл",
        color: "text-sand-300",
        sub: `${publishedArticles} нийтэлсэн`,
      },
      {
        n: lessons.filter((l) => l.status === "DRAFT").length,
        label: "Ноорог хичээл",
        color: "text-ember-300",
        sub: "Нийтлэхэд бэлэн биш",
      },
    ];
  }, [lessons, words, articles]);

  const lessonLevelGroups = useMemo(
    () =>
      LEVEL_META.map((meta) => {
        const items = lessons.filter((lesson) => lesson.level === meta.n);
        return {
          meta,
          total: items.length,
          published: items.filter((lesson) => lesson.status === "PUBLISHED")
            .length,
          draft: items.filter((lesson) => lesson.status === "DRAFT").length,
        };
      }),
    [lessons],
  );

  const lessonFormChecks = [
    {
      label: "Нэр ба тайлбар",
      done: !!lessonForm.title.trim() && !!lessonForm.description.trim(),
    },
    {
      label: "Гол зорилго",
      done: !!lessonForm.content.trim(),
    },
    {
      label: "Санах дүрэм",
      done: lines(lessonForm.keyPoints).length >= 2,
    },
    {
      label: "Жишээ үг",
      done: parsePipeRows(lessonForm.examples, 2).length >= 2,
    },
    {
      label: "Дасгал",
      done: parsePipeRows(lessonForm.tasks, 2).length >= 2,
    },
  ];
  const lessonFormReady = lessonFormChecks.filter((item) => item.done).length;

  if (!isAdmin) {
    return (
      <div className="max-w-[520px] mx-auto px-6 py-20 text-center">
        <h2 className="text-[24px] font-black mb-2">Нэвтрэх эрхгүй</h2>
        <p className="text-ink-muted font-semibold mb-6">
          Энэ хуудас зөвхөн админд зориулагдсан.
        </p>
        <button
          onClick={() => goTo("home")}
          className="bg-sky-300 text-white font-extrabold px-6 py-3 rounded-2xl hover:bg-sky-200 transition-all">
          Нүүр хуудас руу буцах
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-[1240px] mx-auto px-6 pb-14">
        <div className="pt-10 pb-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-extrabold text-ember-300 bg-ember-50 border border-ember-100 px-2.5 py-1 rounded-xl uppercase tracking-wide">
                Удирдлагын самбар
              </span>
              {refreshing && (
                <span className="text-[11px] font-bold text-sky-300">
                  Шинэчилж байна...
                </span>
              )}
            </div>
            <h2 className="text-[34px] font-black tracking-tight">
              GALIGTAN · Админ
            </h2>
            <p className="text-ink-muted font-semibold mt-0.5">
              Хичээл, үг, нийтлэл, тестийн агуулгыг удирдах хэсэг
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white border-2 border-paper-100 rounded-2xl px-4 py-2.5 text-right">
              <p className="text-[13px] font-extrabold text-ink">{userName}</p>
              <p className="text-[11px] text-ember-300 font-bold">
                Администратор
              </p>
            </div>

            {!showLogoutConfirm ? (
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="bg-ember-50 border-2 border-ember-100 text-ember-300 font-extrabold text-[13px] px-4 py-2.5 rounded-2xl hover:bg-ember-100 transition-all">
                Гарах
              </button>
            ) : (
              <div className="bg-white border-2 border-ember-100 rounded-2xl px-4 py-2.5 flex items-center gap-3">
                <span className="text-[12px] font-bold text-ink-muted">
                  Итгэлтэй?
                </span>
                <button
                  onClick={() => {
                    logout();
                    goTo("home");
                  }}
                  className="bg-ember-300 text-white font-extrabold text-[12px] px-3 py-1.5 rounded-xl hover:bg-ember-400 transition-all">
                  Тийм
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="text-[12px] font-bold text-ink-muted hover:text-ink">
                  Болих
                </button>
              </div>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="mb-5 bg-ember-50 border-2 border-ember-100 text-ember-300 rounded-2xl px-4 py-3 text-[13px] font-bold">
            {errorMsg}
          </div>
        )}

        {savedMsg && (
          <div className="mb-5 bg-grass-50 border-2 border-grass-100 text-grass-300 rounded-2xl px-4 py-3 text-[13px] font-bold">
            {savedMsg}
          </div>
        )}

        <div className="grid grid-cols-[220px_1fr] gap-6">
          <aside>
            <div className="bg-white border-2 border-paper-100 rounded-2xl p-2 flex flex-col gap-1 sticky top-20">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "px-3.5 py-2.5 rounded-xl text-[13px] font-bold text-left transition-all",
                    tab === t.id
                      ? "bg-sky-300 text-white"
                      : "text-ink-muted hover:bg-paper-50 hover:text-ink",
                  )}>
                  {t.label}
                </button>
              ))}

              {/* <div className="mx-2 my-1 h-px bg-paper-100" />

              <button
                onClick={() => loadAdminData(false)}
                className="px-3.5 py-2.5 rounded-xl text-[13px] font-bold text-left text-sky-300 hover:bg-sky-50 transition-all">
                Шинэчлэх
              </button>

              <button
                onClick={() => goTo("home")}
                className="px-3.5 py-2.5 rounded-xl text-[13px] font-bold text-left text-ink-muted hover:bg-paper-50 hover:text-ink transition-all">
                Нүүр хуудас
              </button> */}
            </div>
          </aside>

          <main>
            {loading ? (
              <div className="bg-white border-2 border-paper-100 rounded-3xl p-10 text-center">
                <p className="text-[16px] font-bold text-ink-muted">
                  Админ өгөгдлийг ачаалж байна...
                </p>
              </div>
            ) : (
              <>
                {tab === "overview" && (
                  <div>
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      {overview.map(({ n, label, color, sub }) => (
                        <div
                          key={label}
                          className="bg-white border-2 border-paper-100 rounded-2xl p-5">
                          <p className={`text-[30px] font-black ${color}`}>
                            {n}
                          </p>
                          <p className="text-[12px] font-bold text-ink-muted">
                            {label}
                          </p>
                          <p className="text-[10px] text-ink-muted/60 font-semibold mt-0.5">
                            {sub}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div className="bg-white border-2 border-paper-100 rounded-2xl p-6">
                        <h3 className="text-[18px] font-black mb-4">
                          Сүүлийн хичээлүүд
                        </h3>
                        <div className="flex flex-col gap-3">
                          {lessons.slice(0, 5).map((lesson) => (
                            <div
                              key={lesson.id}
                              className="flex items-center gap-3 p-3 bg-paper-50 rounded-xl">
                              <div
                                className={cn(
                                  "w-2.5 h-2.5 rounded-full shrink-0",
                                  lesson.status === "PUBLISHED"
                                    ? "bg-grass-300"
                                    : "bg-sand-300",
                                )}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-bold truncate">
                                  {lesson.title}
                                </p>
                                <div className="mt-1">
                                  <LevelBadge level={lesson.level} />
                                </div>
                              </div>
                              <button
                                onClick={() => startEditLesson(lesson)}
                                className="text-[12px] text-sky-300 font-bold hover:underline">
                                Засах
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white border-2 border-paper-100 rounded-2xl p-6">
                        <h3 className="text-[18px] font-black mb-4">
                          Сүүлийн нийтлэлүүд
                        </h3>
                        <div className="flex flex-col gap-3">
                          {articles.slice(0, 5).map((article) => (
                            <div
                              key={article.id}
                              className="flex items-center gap-3 p-3 bg-paper-50 rounded-xl">
                              <div
                                className={cn(
                                  "w-2.5 h-2.5 rounded-full shrink-0",
                                  article.isPublished
                                    ? "bg-grass-300"
                                    : "bg-sand-300",
                                )}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-bold truncate">
                                  {article.title}
                                </p>
                                <p className="text-[11px] text-ink-muted font-semibold">
                                  {article.levelLabel || "Түвшин оноогоогүй"}
                                </p>
                              </div>
                              <button
                                onClick={() => startEditArticle(article)}
                                className="text-[12px] text-sky-300 font-bold hover:underline">
                                Засах
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {tab === "lessons" && (
                  <div>
                    <div className="bg-white border-2 border-paper-100 rounded-2xl p-5 mb-5 flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-[20px] font-black">Хичээлүүд</h3>
                        <p className="text-[13px] text-ink-muted font-semibold mt-1">
                          Түвшин бүрээр сурах зам, хичээл, дасгал, шалгалтыг
                          нэг бүтэцтэй удирдана.
                        </p>
                      </div>

                      <button
                        onClick={() => router.push("/admin/lessons/new")}
                        className="bg-sky-300 text-white font-extrabold text-[14px] px-5 py-3 rounded-2xl hover:bg-sky-200 transition-all">
                        + Хичээл нэмэх
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-5">
                      {lessonLevelGroups.map(({ meta, total, published, draft }) => {
                        const tone =
                          LEVEL_TONE_MAP[
                            meta.tone as keyof typeof LEVEL_TONE_MAP
                          ] ?? LEVEL_TONE_MAP.sky;

                        return (
                          <div
                            key={meta.n}
                            className="bg-white border-2 border-paper-100 rounded-2xl p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div
                                className={cn(
                                  "w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0",
                                  tone,
                                )}>
                                <LevelIcon icon={meta.icon} size={20} />
                              </div>
                              <LevelBadge level={meta.n} />
                            </div>
                            <h4 className="text-[16px] font-black text-ink mt-4">
                              {meta.subtitle}
                            </h4>
                            <p className="text-[12px] text-ink-muted font-semibold leading-relaxed mt-1 line-clamp-2">
                              {meta.description}
                            </p>
                            <div className="grid grid-cols-3 gap-2 mt-4">
                              <div className="bg-paper-50 rounded-xl px-3 py-2">
                                <p className="text-[18px] font-black text-ink">
                                  {total}
                                </p>
                                <p className="text-[10px] font-bold text-ink-muted">
                                  бүгд
                                </p>
                              </div>
                              <div className="bg-grass-50 rounded-xl px-3 py-2">
                                <p className="text-[18px] font-black text-grass-300">
                                  {published}
                                </p>
                                <p className="text-[10px] font-bold text-grass-300">
                                  нийтэлсэн
                                </p>
                              </div>
                              <div className="bg-sand-50 rounded-xl px-3 py-2">
                                <p className="text-[18px] font-black text-sand-300">
                                  {draft}
                                </p>
                                <p className="text-[10px] font-bold text-sand-300">
                                  ноорог
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="bg-white border-2 border-paper-100 rounded-2xl overflow-hidden">
                      <div className="p-5 border-b-2 border-paper-100 flex items-center justify-between">
                        <h3 className="text-[16px] font-black">
                          Хичээлүүдийн жагсаалт
                        </h3>
                        <span className="text-[12px] font-bold text-ink-muted">
                          {lessons.length} хичээл
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-[12px]">
                          <thead className="border-b-2 border-paper-100 bg-white sticky top-0">
                            <tr>
                              {["Гарчиг", "Түвшин", "Төлөв", ""].map(
                                (h) => (
                                  <th
                                    key={h}
                                    className="text-left px-4 py-3 text-[10px] font-extrabold text-ink-muted uppercase">
                                    {h}
                                  </th>
                                ),
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {lessons.map((lesson) => (
                              <tr
                                key={lesson.id}
                                className="border-b border-paper-50 hover:bg-paper-50">
                                <td className="px-4 py-3">
                                  <p className="font-bold text-[13px]">
                                    {lesson.title}
                                  </p>
                                  <p className="text-[11px] text-ink-muted mt-0.5">
                                    {lesson.description || "Тайлбаргүй"}
                                  </p>
                                </td>
                                <td className="px-4 py-3">
                                  <LevelBadge level={lesson.level} />
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={cn(
                                      "text-[10px] font-extrabold px-2 py-0.5 rounded-lg",
                                      lesson.status === "PUBLISHED"
                                        ? "bg-grass-50 text-grass-300"
                                        : "bg-sand-50 text-sand-300",
                                    )}>
                                    {lessonStatusLabel(lesson.status)}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => startEditLesson(lesson)}
                                      className="text-[11px] text-sky-300 font-bold hover:underline">
                                      Засах
                                    </button>
                                    <button
                                      onClick={() => deleteLesson(lesson.id)}
                                      className="text-[11px] text-ember-300 font-bold hover:underline">
                                      Устгах
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {lessons.length === 0 && (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="px-4 py-10 text-center text-[13px] text-ink-muted font-semibold">
                                  Хичээл алга байна. Эхний хичээлээ нэмнэ үү.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {tab === "words" && (
                  <div>
                    <div className="bg-white border-2 border-paper-100 rounded-2xl p-5 mb-5 flex items-center justify-between">
                      <div>
                        <h3 className="text-[20px] font-black">Үгс</h3>
                        <p className="text-[13px] text-ink-muted font-semibold mt-1">
                          Толь бичигт харагдах монгол бичгийн үгсийг удирдана.
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          resetWordForm();
                          setModal("word");
                        }}
                        className="bg-sky-300 text-white font-extrabold text-[14px] px-5 py-3 rounded-2xl hover:bg-sky-200 transition-all">
                        + Үг нэмэх
                      </button>
                    </div>

                    <div className="bg-white border-2 border-paper-100 rounded-2xl overflow-hidden">
                      <div className="p-5 border-b-2 border-paper-100 flex items-center justify-between">
                        <h3 className="text-[16px] font-black">
                          Үгнүүдийн жагсаалт
                        </h3>
                        <span className="text-[12px] font-bold text-ink-muted">
                          {words.length} үг
                        </span>
                      </div>

                      <div className="overflow-y-auto max-h-[620px]">
                        <table className="w-full text-[12px]">
                          <thead className="sticky top-0 bg-white border-b-2 border-paper-100">
                            <tr>
                              {["Бичиг", "Кирилл", "Ангилал", "Төлөв", ""].map(
                                (h) => (
                                  <th
                                    key={h}
                                    className="text-left px-4 py-3 text-[10px] font-extrabold text-ink-muted uppercase">
                                    {h}
                                  </th>
                                ),
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {words.map((w) => (
                              <tr
                                key={w.id}
                                className="border-b border-paper-50 hover:bg-paper-50">
                                <td className="px-4 py-3">
                                  <span
                                    className="font-mongolian text-sand-300"
                                    style={{
                                      writingMode: "vertical-lr",
                                      fontSize: 18,
                                      display: "inline-block",
                                      height: 28,
                                    }}>
                                    {w.scriptWord}
                                  </span>
                                </td>
                                <td className="px-4 py-3 font-bold">
                                  {w.cyrillicWord}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-[10px] bg-sky-50 text-sky-300 font-extrabold px-2 py-0.5 rounded-lg">
                                    {w.category || "Ангилалгүй"}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={cn(
                                      "text-[10px] font-extrabold px-2 py-0.5 rounded-lg",
                                      w.isPublished
                                        ? "bg-grass-50 text-grass-300"
                                        : "bg-sand-50 text-sand-300",
                                    )}>
                                    {publishLabel(w.isPublished)}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => startEditWord(w)}
                                      className="text-[11px] text-sky-300 font-bold hover:underline">
                                      Засах
                                    </button>
                                    <button
                                      onClick={() => deleteWord(w.id)}
                                      className="text-[11px] text-ember-300 font-bold hover:underline">
                                      Устгах
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {words.length === 0 && (
                              <tr>
                                <td
                                  colSpan={5}
                                  className="px-4 py-10 text-center text-[13px] text-ink-muted font-semibold">
                                  Үг алга байна. Эхний үгээ нэмнэ үү.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {tab === "content" && (
                  <div>
                    <div className="bg-white border-2 border-paper-100 rounded-2xl p-5 mb-5 flex items-center justify-between">
                      <div>
                        <h3 className="text-[20px] font-black">Нийтлэл</h3>
                        <p className="text-[13px] text-ink-muted font-semibold mt-1">
                          Унших хэсэгт харагдах нийтлэл, эхийг удирдана.
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          resetArticleForm();
                          setModal("article");
                        }}
                        className="bg-sky-300 text-white font-extrabold text-[14px] px-5 py-3 rounded-2xl hover:bg-sky-200 transition-all">
                        + Нийтлэл нэмэх
                      </button>
                    </div>

                    <div className="bg-white border-2 border-paper-100 rounded-2xl overflow-hidden">
                      <div className="p-5 border-b-2 border-paper-100 flex items-center justify-between">
                        <h3 className="text-[16px] font-black">
                          Нийтлэлүүдийн жагсаалт
                        </h3>
                        <span className="text-[12px] font-bold text-ink-muted">
                          {articles.length} нийтлэл
                        </span>
                      </div>

                      <div className="overflow-y-auto max-h-[620px]">
                        <table className="w-full text-[12px]">
                          <thead className="sticky top-0 bg-white border-b-2 border-paper-100">
                            <tr>
                              {["Гарчиг", "Түвшин", "Төлөв", ""].map((h) => (
                                <th
                                  key={h}
                                  className="text-left px-4 py-3 text-[10px] font-extrabold text-ink-muted uppercase">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {articles.map((article) => (
                              <tr
                                key={article.id}
                                className="border-b border-paper-50 hover:bg-paper-50">
                                <td className="px-4 py-3">
                                  <p className="font-bold text-[13px]">
                                    {article.title}
                                  </p>
                                  <p className="text-[11px] text-ink-muted mt-0.5 line-clamp-2">
                                    {article.cyrillicText}
                                  </p>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-[10px] bg-sky-50 text-sky-300 font-extrabold px-2 py-0.5 rounded-lg">
                                    {article.levelLabel || "Түвшингүй"}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={cn(
                                      "text-[10px] font-extrabold px-2 py-0.5 rounded-lg",
                                      article.isPublished
                                        ? "bg-grass-50 text-grass-300"
                                        : "bg-sand-50 text-sand-300",
                                    )}>
                                    {publishLabel(article.isPublished)}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => startEditArticle(article)}
                                      className="text-[11px] text-sky-300 font-bold hover:underline">
                                      Засах
                                    </button>
                                    <button
                                      onClick={() => deleteArticle(article.id)}
                                      className="text-[11px] text-ember-300 font-bold hover:underline">
                                      Устгах
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {articles.length === 0 && (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="px-4 py-10 text-center text-[13px] text-ink-muted font-semibold">
                                  Нийтлэл алга байна. Эхний нийтлэлээ нэмнэ үү.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {tab === "quiz" && <QuizAdmin />}
                {tab === "users" && <UsersAdmin />}
              </>
            )}
          </main>
        </div>
      </div>

      <AdminModal
        open={modal === "lesson"}
        title={editingLessonId ? "Хичээл засварлах" : "Хичээл нэмэх"}
        description="Түвшин, сурах зорилго, жишээ, даалгавар, шалгалтын бэлтгэлийг нэг дор зохионо."
        onClose={() => {
          setModal(null);
          resetLessonForm();
        }}
        size="lg">
        <div className="flex flex-col gap-4">
          <div className="bg-paper-50 border-2 border-paper-100 rounded-3xl p-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
              <div>
                <p className="text-[12px] font-black text-sky-300 uppercase tracking-[1px]">
                  Lesson Studio
                </p>
                <h3 className="text-[20px] font-black text-ink mt-1">
                  Хүүхэд өөрөө сураад гарах хичээл зохиох
                </h3>
              </div>
              <span
                className={cn(
                  "text-[12px] font-extrabold px-3 py-1.5 rounded-xl border",
                  lessonFormReady === lessonFormChecks.length
                    ? "bg-grass-50 text-grass-300 border-grass-100"
                    : "bg-sand-50 text-sand-300 border-sand-100",
                )}>
                {lessonFormReady}/{lessonFormChecks.length} бэлэн
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
              {[
                ["1", "Зорилго", "Юу сурахыг тодорхой болго"],
                ["2", "Дүрэм", "Гол санааг богино мөрөөр өг"],
                ["3", "Жишээ", "Монгол бичиг + кирилл утга"],
                ["4", "Дасгал", "Шалгалт руу бэлтгэх ажил"],
              ].map(([n, title, desc]) => (
                <div
                  key={n}
                  className="bg-white border border-paper-100 rounded-2xl p-3">
                  <span className="w-7 h-7 rounded-xl bg-sky-50 text-sky-300 border border-sky-100 flex items-center justify-center text-[11px] font-black mb-2">
                    {n}
                  </span>
                  <p className="text-[12px] font-black text-ink">{title}</p>
                  <p className="text-[10px] text-ink-muted font-semibold leading-snug mt-0.5">
                    {desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {lessonFormChecks.map((item) => (
                <span
                  key={item.label}
                  className={cn(
                    "text-[11px] font-extrabold px-3 py-1.5 rounded-xl border",
                    item.done
                      ? "bg-grass-50 text-grass-300 border-grass-100"
                      : "bg-white text-ink-muted border-paper-100",
                  )}>
                  {item.done ? "Бэлэн · " : "Дутуу · "}
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-extrabold text-ink-muted uppercase mb-1.5">
              Хичээлийн нэр
            </p>
            <input
              className="w-full border-2 border-paper-100 rounded-2xl px-4 py-3 font-bold text-[14px] outline-none focus:border-sky-100 transition-all"
              value={lessonForm.title}
              onChange={(e) =>
                setLessonForm((p) => ({
                  ...p,
                  title: e.target.value,
                  slug: p.slug || makeSlug(e.target.value),
                }))
              }
              placeholder="Эгшиг үсэг"
            />
          </div>

          <div className="grid grid-cols-[1fr_150px] gap-3">
            <div>
              <p className="text-[11px] font-extrabold text-ink-muted uppercase mb-1.5">
                Түвшин
              </p>
              <select
                className="w-full border-2 border-paper-100 rounded-2xl px-4 py-3 font-bold text-[14px] outline-none focus:border-sky-100 transition-all"
                value={lessonForm.level}
                onChange={(e) =>
                  setLessonForm((p) => ({
                    ...p,
                    level: Number(e.target.value),
                  }))
                }>
                {LEVEL_META.map((level) => (
                  <option key={level.n} value={level.n}>
                    {level.title} · {level.subtitle}
                  </option>
                ))}
              </select>
              <div className="mt-2">
                <LevelBadge level={lessonForm.level} />
              </div>
            </div>

            <div>
              <p className="text-[11px] font-extrabold text-ink-muted uppercase mb-1.5">
                Дараалал
              </p>
              <input
                type="number"
                className="w-full border-2 border-paper-100 rounded-2xl px-4 py-3 font-bold text-[14px] outline-none focus:border-sky-100 transition-all"
                value={lessonForm.sortOrder}
                onChange={(e) =>
                  setLessonForm((p) => ({
                    ...p,
                    sortOrder: Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          <div>
            <p className="text-[11px] font-extrabold text-ink-muted uppercase mb-1.5">
              Төлөв
            </p>
            <select
              className="w-full border-2 border-paper-100 rounded-2xl px-4 py-3 bg-white font-bold text-[14px] outline-none focus:border-sky-100 transition-all"
              value={lessonForm.status}
              onChange={(e) =>
                setLessonForm((p) => ({
                  ...p,
                  status: e.target.value as LessonStatus,
                }))
              }>
              <option value="PUBLISHED">Нийтлэх</option>
              <option value="DRAFT">Ноорог болгох</option>
            </select>
          </div>

          <div>
            <p className="text-[11px] font-extrabold text-ink-muted uppercase mb-1.5">
              Товч тайлбар
            </p>
            <textarea
              className="w-full border-2 border-paper-100 rounded-2xl px-4 py-3 font-semibold text-[13px] outline-none focus:border-sky-100 transition-all resize-none h-20"
              value={lessonForm.description}
              onChange={(e) =>
                setLessonForm((p) => ({
                  ...p,
                  description: e.target.value,
                }))
              }
              placeholder="Хичээлийн товч тайлбар..."
            />
          </div>

          <div>
            <p className="text-[11px] font-extrabold text-ink-muted uppercase mb-1.5">
              Хичээлийн гол тайлбар
            </p>
            <textarea
              className="w-full border-2 border-paper-100 rounded-2xl px-4 py-3 font-semibold text-[13px] outline-none focus:border-sky-100 transition-all resize-none h-40"
              value={lessonForm.content}
              onChange={(e) =>
                setLessonForm((p) => ({ ...p, content: e.target.value }))
              }
              placeholder="Өнөөдрийн хичээлээр юу сурахыг хүүхдэд ойлгомжтой тайлбарлана..."
            />
          </div>

          <div className="bg-sky-50 border-2 border-sky-100 rounded-3xl p-4">
            <p className="text-[13px] font-black text-sky-300 mb-1">
              Хүүхдэд зориулсан алхамчилсан хичээл
            </p>
            <p className="text-[12px] text-ink-muted font-semibold leading-relaxed">
              Эдгээр талбарыг бөглөвөл сурагч талд “дүрэм → жишээ → даалгавар
              → төгсгөлийн шалгалт” гэсэн flow болж харагдана. Хоосон орхивол
              хуучин энгийн агуулга хэвээр ашиглагдана.
            </p>
          </div>

          <div>
            <p className="text-[11px] font-extrabold text-ink-muted uppercase mb-1.5">
              Санах дүрмүүд
            </p>
            <textarea
              className="w-full border-2 border-paper-100 rounded-2xl px-4 py-3 font-semibold text-[13px] outline-none focus:border-sky-100 transition-all resize-none h-28"
              value={lessonForm.keyPoints}
              onChange={(e) =>
                setLessonForm((p) => ({ ...p, keyPoints: e.target.value }))
              }
              placeholder={"Нэг мөрөнд нэг дүрэм бичнэ.\nЭгшиг үсэг үгийн эхэнд тод бичигдэнэ.\nᠠ нь кирилл а авиаг илэрхийлнэ."}
            />
          </div>

          <div>
            <p className="text-[11px] font-extrabold text-ink-muted uppercase mb-1.5">
              Жишээ үгс
            </p>
            <div className="bg-paper-50 border-2 border-paper-100 rounded-3xl p-4 mb-3">
              <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-3">
                <MongolianKeyboard
                  label="Монгол бичгийн жишээ"
                  value={exampleDraft.script}
                  onChange={(value) =>
                    setExampleDraft((prev) => ({ ...prev, script: value }))
                  }
                  mode="inline"
                  placeholder="Үсгүүдээс дарж жишээ үгээ бичнэ..."
                />
                <div className="flex flex-col gap-3">
                  <input
                    className="w-full border-2 border-paper-100 rounded-2xl px-4 py-3 font-bold text-[14px] outline-none focus:border-sky-100 bg-white"
                    value={exampleDraft.cyrillic}
                    onChange={(e) =>
                      setExampleDraft((prev) => ({
                        ...prev,
                        cyrillic: e.target.value,
                      }))
                    }
                    placeholder="Кирилл утга: морь"
                  />
                  <input
                    className="w-full border-2 border-paper-100 rounded-2xl px-4 py-3 font-semibold text-[13px] outline-none focus:border-sky-100 bg-white"
                    value={exampleDraft.note}
                    onChange={(e) =>
                      setExampleDraft((prev) => ({
                        ...prev,
                        note: e.target.value,
                      }))
                    }
                    placeholder="Тайлбар: м + о + р + и"
                  />
                  <button
                    type="button"
                    onClick={appendExampleDraft}
                    disabled={!exampleDraft.script || !exampleDraft.cyrillic}
                    className={cn(
                      "font-extrabold text-[13px] px-4 py-3 rounded-2xl transition-all",
                      exampleDraft.script && exampleDraft.cyrillic
                        ? "bg-sky-300 text-white hover:bg-sky-200"
                        : "bg-paper-100 text-ink-muted cursor-not-allowed",
                    )}>
                    Жишээнд нэмэх
                  </button>
                </div>
              </div>
            </div>
            <textarea
              className="w-full border-2 border-paper-100 rounded-2xl px-4 py-3 font-semibold text-[13px] outline-none focus:border-sky-100 transition-all resize-none h-28"
              value={lessonForm.examples}
              onChange={(e) =>
                setLessonForm((p) => ({ ...p, examples: e.target.value }))
              }
              placeholder={"Монгол бичиг | Кирилл | Тайлбар гэсэн хэлбэртэй.\nᠮᠣᠷᠢ | морь | Үгийн төгсгөлд и авиа орно\nᠭᠡᠷ | гэр | Богино үг унших дасгал"}
            />
          </div>

          <div>
            <p className="text-[11px] font-extrabold text-ink-muted uppercase mb-1.5">
              Хичээлийн даалгавар
            </p>
            <div className="bg-paper-50 border-2 border-paper-100 rounded-3xl p-4 mb-3">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-3">
                <div className="flex flex-col gap-3">
                  <textarea
                    className="w-full border-2 border-paper-100 rounded-2xl px-4 py-3 font-bold text-[14px] outline-none focus:border-sky-100 bg-white resize-none h-24"
                    value={taskDraft.prompt}
                    onChange={(e) =>
                      setTaskDraft((prev) => ({
                        ...prev,
                        prompt: e.target.value,
                      }))
                    }
                    placeholder="Даалгаврын асуулт: “гэр” гэдэг үгийг монгол бичгээр бич"
                  />
                  <input
                    className="w-full border-2 border-paper-100 rounded-2xl px-4 py-3 font-semibold text-[13px] outline-none focus:border-sky-100 bg-white"
                    value={taskDraft.hint}
                    onChange={(e) =>
                      setTaskDraft((prev) => ({
                        ...prev,
                        hint: e.target.value,
                      }))
                    }
                    placeholder="Санамж: г + э + р"
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <MongolianKeyboard
                    label="Зөв хариулт монгол бичгээр бол"
                    value={taskDraft.answer}
                    onChange={(value) =>
                      setTaskDraft((prev) => ({ ...prev, answer: value }))
                    }
                    mode="inline"
                    placeholder="Монгол бичгийн хариулт бол энд үсгээр бичнэ..."
                  />
                  <input
                    className="w-full border-2 border-paper-100 rounded-2xl px-4 py-3 font-bold text-[14px] outline-none focus:border-sky-100 bg-white"
                    value={taskDraft.answer}
                    onChange={(e) =>
                      setTaskDraft((prev) => ({
                        ...prev,
                        answer: e.target.value,
                      }))
                    }
                    placeholder="Эсвэл кирилл/латин хариулт бичнэ"
                  />
                  <button
                    type="button"
                    onClick={appendTaskDraft}
                    disabled={!taskDraft.prompt || !taskDraft.answer}
                    className={cn(
                      "font-extrabold text-[13px] px-4 py-3 rounded-2xl transition-all",
                      taskDraft.prompt && taskDraft.answer
                        ? "bg-grass-300 text-white hover:bg-grass-200"
                        : "bg-paper-100 text-ink-muted cursor-not-allowed",
                    )}>
                    Даалгаварт нэмэх
                  </button>
                </div>
              </div>
            </div>
            <textarea
              className="w-full border-2 border-paper-100 rounded-2xl px-4 py-3 font-semibold text-[13px] outline-none focus:border-sky-100 transition-all resize-none h-32"
              value={lessonForm.tasks}
              onChange={(e) =>
                setLessonForm((p) => ({ ...p, tasks: e.target.value }))
              }
              placeholder={"Асуулт | Зөв хариулт | Санамж гэсэн хэлбэртэй.\nᠮᠣᠷᠢ гэдэг үгийг кириллээр бич | морь | амьтны нэр\n“гэр” гэдэг үгийг монгол бичгээр бич | ᠭᠡᠷ | г + э + р"}
            />
          </div>

          <div>
            <p className="text-[11px] font-extrabold text-ink-muted uppercase mb-1.5">
              Дуусгах урамшуулал
            </p>
            <textarea
              className="w-full border-2 border-paper-100 rounded-2xl px-4 py-3 font-semibold text-[13px] outline-none focus:border-sky-100 transition-all resize-none h-20"
              value={lessonForm.wrapUp}
              onChange={(e) =>
                setLessonForm((p) => ({ ...p, wrapUp: e.target.value }))
              }
              placeholder="Одоо чи энэ хичээлийн үгсийг уншиж, бичиж чадна. Шалгалтаар бататгая!"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={() => {
                setModal(null);
                resetLessonForm();
              }}
              className="bg-white border-2 border-paper-100 text-ink-muted font-bold text-[14px] px-5 py-3 rounded-2xl hover:bg-paper-50 transition-all">
              Болих
            </button>

            <button
              onClick={saveLesson}
              disabled={savingLesson || !lessonForm.title}
              className={cn(
                "font-extrabold text-[14px] px-6 py-3 rounded-2xl transition-all",
                !savingLesson && lessonForm.title
                  ? "bg-sky-300 text-white hover:bg-sky-200"
                  : "bg-paper-100 text-ink-muted cursor-not-allowed",
              )}>
              {savingLesson
                ? "Хадгалж байна..."
                : editingLessonId
                  ? "Хичээл шинэчлэх"
                  : lessonForm.status === "PUBLISHED"
                    ? "Хичээл нийтлэх"
                    : "Ноорог хадгалах"}
            </button>
          </div>
        </div>
      </AdminModal>

      <AdminModal
        open={modal === "word"}
        title={editingWordId ? "Үг засварлах" : "Үг нэмэх"}
        description="Толь бичигт харагдах монгол бичгийн үг, кирилл утга, ангиллыг оруулна."
        onClose={() => {
          setModal(null);
          resetWordForm();
        }}
        size="lg">
        <div className="flex flex-col gap-4">
          <MongolianKeyboard
            label="Монгол бичиг"
            value={wordForm.scriptWord}
            onChange={(val) => setWordForm((p) => ({ ...p, scriptWord: val }))}
          />

          <div>
            <p className="text-[11px] font-extrabold text-ink-muted uppercase mb-1.5">
              Кирилл утга
            </p>
            <input
              className="w-full border-2 border-paper-100 rounded-2xl px-4 py-3 bg-white font-bold text-[14px] outline-none focus:border-sky-100 transition-all"
              value={wordForm.cyrillicWord}
              onChange={(e) =>
                setWordForm((p) => ({
                  ...p,
                  cyrillicWord: e.target.value,
                }))
              }
              placeholder="морь"
            />
          </div>

          <div>
            <p className="text-[11px] font-extrabold text-ink-muted uppercase mb-1.5">
              Дуудлага
            </p>
            <input
              className="w-full border-2 border-paper-100 rounded-2xl px-4 py-3 bg-white font-bold text-[14px] outline-none focus:border-sky-100 transition-all"
              value={wordForm.romanization}
              onChange={(e) =>
                setWordForm((p) => ({
                  ...p,
                  romanization: e.target.value,
                }))
              }
              placeholder="mori"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] font-extrabold text-ink-muted uppercase mb-1.5">
                Ангилал
              </p>
              <input
                className="w-full border-2 border-paper-100 rounded-2xl px-4 py-3 bg-white font-bold text-[14px] outline-none focus:border-sky-100 transition-all"
                value={wordForm.category}
                onChange={(e) =>
                  setWordForm((p) => ({ ...p, category: e.target.value }))
                }
                placeholder="Амьтан"
              />
            </div>

            <div>
              <p className="text-[11px] font-extrabold text-ink-muted uppercase mb-1.5">
                Төлөв
              </p>
              <select
                className="w-full border-2 border-paper-100 rounded-2xl px-4 py-3 bg-white font-bold text-[14px] outline-none focus:border-sky-100 transition-all"
                value={wordForm.isPublished ? "true" : "false"}
                onChange={(e) =>
                  setWordForm((p) => ({
                    ...p,
                    isPublished: e.target.value === "true",
                  }))
                }>
                <option value="true">Нийтлэх</option>
                <option value="false">Ноорог болгох</option>
              </select>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-extrabold text-ink-muted uppercase mb-1.5">
              Түвшин
            </p>
            <select
              className="w-full border-2 border-paper-100 rounded-2xl px-4 py-3 bg-white font-bold text-[14px] outline-none focus:border-sky-100 transition-all"
              value={wordForm.level}
              onChange={(e) =>
                setWordForm((p) => ({
                  ...p,
                  grade: 6,
                  level: Number(e.target.value),
                }))
              }>
              {LEVEL_META.map((level) => (
                <option key={level.n} value={level.n}>
                  {level.title} · {level.subtitle}
                </option>
              ))}
            </select>
            <div className="mt-2">
              <LevelBadge level={wordForm.level} />
            </div>
          </div>

          <div>
            <p className="text-[11px] font-extrabold text-ink-muted uppercase mb-1.5">
              Тайлбар
            </p>
            <textarea
              className="w-full border-2 border-paper-100 rounded-2xl px-4 py-3 font-semibold text-[13px] outline-none focus:border-sky-100 transition-all resize-none h-24"
              value={wordForm.description}
              onChange={(e) =>
                setWordForm((p) => ({
                  ...p,
                  description: e.target.value,
                }))
              }
              placeholder="Үгийн тайлбар..."
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={() => {
                setModal(null);
                resetWordForm();
              }}
              className="bg-white border-2 border-paper-100 text-ink-muted font-bold text-[14px] px-5 py-3 rounded-2xl hover:bg-paper-50 transition-all">
              Болих
            </button>

            <button
              onClick={saveWord}
              disabled={
                savingWord || !wordForm.scriptWord || !wordForm.cyrillicWord
              }
              className={cn(
                "font-extrabold text-[14px] px-6 py-3 rounded-2xl transition-all",
                !savingWord && wordForm.scriptWord && wordForm.cyrillicWord
                  ? "bg-sky-300 text-white hover:bg-sky-200"
                  : "bg-paper-100 text-ink-muted cursor-not-allowed",
              )}>
              {savingWord
                ? "Хадгалж байна..."
                : editingWordId
                  ? "Засвар хадгалах"
                  : "Үг нэмэх"}
            </button>
          </div>
        </div>
      </AdminModal>

      <AdminModal
        open={modal === "article"}
        title={editingArticleId ? "Нийтлэл засварлах" : "Нийтлэл нэмэх"}
        description="Унших хэсэгт харагдах кирилл болон монгол бичгийн эхийг оруулна."
        onClose={() => {
          setModal(null);
          resetArticleForm();
        }}
        size="xl">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-[11px] font-extrabold text-ink-muted uppercase mb-1.5">
              Гарчиг
            </p>
            <input
              className="w-full border-2 border-paper-100 rounded-2xl px-4 py-3 font-bold text-[14px] outline-none focus:border-sky-100 transition-all"
              value={articleForm.title}
              onChange={(e) =>
                setArticleForm((p) => ({ ...p, title: e.target.value }))
              }
              placeholder="Монгол бичгийн түүх"
            />
          </div>

          <div>
            <p className="text-[11px] font-extrabold text-ink-muted uppercase mb-1.5">
              Түвшин / шошго
            </p>
            <input
              className="w-full border-2 border-paper-100 rounded-2xl px-4 py-3 font-bold text-[14px] outline-none focus:border-sky-100 transition-all"
              value={articleForm.levelLabel}
              onChange={(e) =>
                setArticleForm((p) => ({
                  ...p,
                  levelLabel: e.target.value,
                }))
              }
              placeholder="Анхан шат"
            />
          </div>

          <div>
            <p className="text-[11px] font-extrabold text-ink-muted uppercase mb-1.5">
              Кирилл текст
            </p>
            <textarea
              className="w-full border-2 border-paper-100 rounded-2xl px-4 py-3 font-semibold text-[13px] outline-none focus:border-sky-100 transition-all resize-none h-28"
              value={articleForm.cyrillicText}
              onChange={(e) =>
                setArticleForm((p) => ({
                  ...p,
                  cyrillicText: e.target.value,
                }))
              }
              placeholder="Кирилл агуулгаа бичнэ..."
            />
          </div>

          <MongolianKeyboard
            label="Монгол бичгийн текст"
            value={articleForm.scriptText}
            onChange={(val) =>
              setArticleForm((p) => ({ ...p, scriptText: val }))
            }
          />

          <div>
            <p className="text-[11px] font-extrabold text-ink-muted uppercase mb-1.5">
              Төлөв
            </p>
            <select
              className="w-full border-2 border-paper-100 rounded-2xl px-4 py-3 bg-white font-bold text-[14px] outline-none focus:border-sky-100 transition-all"
              value={articleForm.isPublished ? "true" : "false"}
              onChange={(e) =>
                setArticleForm((p) => ({
                  ...p,
                  isPublished: e.target.value === "true",
                }))
              }>
              <option value="true">Нийтлэх</option>
              <option value="false">Ноорог болгох</option>
            </select>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={() => {
                setModal(null);
                resetArticleForm();
              }}
              className="bg-white border-2 border-paper-100 text-ink-muted font-bold text-[14px] px-5 py-3 rounded-2xl hover:bg-paper-50 transition-all">
              Болих
            </button>

            <button
              onClick={saveArticle}
              disabled={
                savingArticle ||
                !articleForm.title ||
                !articleForm.scriptText ||
                !articleForm.cyrillicText
              }
              className={cn(
                "font-extrabold text-[14px] px-6 py-3 rounded-2xl transition-all",
                !savingArticle &&
                  articleForm.title &&
                  articleForm.scriptText &&
                  articleForm.cyrillicText
                  ? "bg-sky-300 text-white hover:bg-sky-200"
                  : "bg-paper-100 text-ink-muted cursor-not-allowed",
              )}>
              {savingArticle
                ? "Хадгалж байна..."
                : editingArticleId
                  ? "Засвар хадгалах"
                  : "Нийтлэл нэмэх"}
            </button>
          </div>
        </div>
      </AdminModal>
    </>
  );
}
