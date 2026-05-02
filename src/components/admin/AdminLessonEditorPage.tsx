"use client";

import { MongolianKeyboard } from "@/components/ui/MongolianKeyboard";
import {
  IconArrowL,
  IconAward,
  IconBook,
  IconGlobe,
  IconLayers,
  IconPen,
  IconTarget,
} from "@/components/ui/Icons";
import { LEVEL_META, getLevelMeta } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useMemo, useState } from "react";

type LessonStatus = "DRAFT" | "PUBLISHED";
type StepId = "basic" | "content" | "examples" | "activities" | "tasks";

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
}

interface LessonForm {
  title: string;
  slug: string;
  description: string;
  grade: number;
  level: number;
  sortOrder: number;
  content: string;
  keyPoints: string;
  examples: string;
  tasks: string;
  wrapUp: string;
  showMatchGame: boolean;
  showFillGame: boolean;
  showSortGame: boolean;
  showCopyPractice: boolean;
  showWriteCheck: boolean;
  matchTitle: string;
  matchInstruction: string;
  fillTitle: string;
  fillInstruction: string;
  sortTitle: string;
  sortInstruction: string;
  copyTitle: string;
  copyInstruction: string;
  matchItems: string;
  fillItems: string;
  sortItems: string;
  copyItems: string;
  exerciseItems: string;
  status: LessonStatus;
}

interface GuidedLessonContent {
  version: number;
  intro: string;
  keyPoints: string[];
  examples: ExampleItem[];
  tasks: TaskItem[];
  wrapUp?: string;
  activities?: {
    matchGame?: boolean;
    fillGame?: boolean;
    sortGame?: boolean;
    copyPractice?: boolean;
    writeCheck?: boolean;
    matchTitle?: string;
    matchInstruction?: string;
    fillTitle?: string;
    fillInstruction?: string;
    sortTitle?: string;
    sortInstruction?: string;
    copyTitle?: string;
    copyInstruction?: string;
    matchItems?: PairItem[];
    fillItems?: FillItem[];
    sortItems?: SortItem[];
    copyItems?: PairItem[];
    exerciseItems?: ExerciseConfigItem[];
  };
}

interface PairItem {
  script: string;
  cyrillic: string;
}

interface ExampleItem extends PairItem {
  note?: string;
}

interface TaskItem {
  prompt: string;
  answer: string;
  hint?: string;
}

interface FillItem {
  before: string;
  answer: string;
  after: string;
  translation: string;
  choices: string[];
}

interface SortItem {
  words: string[];
  translation: string;
}

interface ExerciseConfigItem {
  type: "chooseMeaning" | "chooseScript" | "trueFalse" | "chooseNote";
  prompt: string;
  script: string;
  answer: string;
  options: string[];
  note?: string;
}

interface ExerciseDraftItem {
  type: ExerciseConfigItem["type"];
  prompt: string;
  script: string;
  answer: string;
  options: string;
  note: string;
}

const GUIDED_LESSON_VERSION = 1;

const EMPTY_LESSON: LessonForm = {
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
  showMatchGame: true,
  showFillGame: true,
  showSortGame: true,
  showCopyPractice: true,
  showWriteCheck: true,
  matchTitle: "Бичгийг утгатай нь тааруул",
  matchInstruction: "Босоо бичгийг хараад зөв кирилл утгыг сонгоорой.",
  fillTitle: "Хоосон зай нөхөх",
  fillInstruction: "Кирилл утгыг уншаад зөв бичгийг сонго.",
  sortTitle: "Үгсийг дарааллаар өрөх",
  sortInstruction: "Доорх үгсийг дарааллаар нь сонгож мөр бүтээ.",
  copyTitle: "Хуулж бичээд шалга",
  copyInstruction: "Загварыг хараад keyboard-оор өөрөө хуулж бичнэ.",
  matchItems: "",
  fillItems: "",
  sortItems: "",
  copyItems: "",
  exerciseItems: "",
  status: "PUBLISHED",
};

const STEPS: { id: StepId; title: string; description: string }[] = [
  {
    id: "basic",
    title: "Хичээл",
    description: "Нэр, түвшин",
  },
  {
    id: "content",
    title: "Агуулга",
    description: "Юу сурах вэ",
  },
  {
    id: "examples",
    title: "Жишээ",
    description: "Үг ба тайлбар",
  },
  {
    id: "tasks",
    title: "Дасгал",
    description: "Асуулт хариулт",
  },
];

const LEVEL_TONE_MAP = {
  sky: "bg-sky-50 border-sky-100 text-sky-300",
  grass: "bg-grass-50 border-grass-100 text-grass-300",
  sand: "bg-sand-50 border-sand-100 text-sand-300",
  ember: "bg-ember-50 border-ember-100 text-ember-300",
  purple: "bg-[#f1ecfb] border-[#d8c8f1] text-[#7c5cbf]",
  teal: "bg-[#e6f7f4] border-[#b9e6df] text-[#1a9e8a]",
} as const;

const ACTIVITY_CONFIG = [
  {
    key: "match" as const,
    enabledKey: "showMatchGame" as const,
    titleKey: "matchTitle" as const,
    instructionKey: "matchInstruction" as const,
    label: "Тааруулах тоглоом",
    description: "Монгол бичгийг хараад зөв кирилл утгыг сонгоно.",
  },
  {
    key: "fill" as const,
    enabledKey: "showFillGame" as const,
    titleKey: "fillTitle" as const,
    instructionKey: "fillInstruction" as const,
    label: "Хоосон зай нөхөх",
    description: "Өгүүлбэрийн дунд зөв үгийг сонгоно.",
  },
  {
    key: "sort" as const,
    enabledKey: "showSortGame" as const,
    titleKey: "sortTitle" as const,
    instructionKey: "sortInstruction" as const,
    label: "Дарааллаар өрөх",
    description: "Үгсийг зөв дарааллаар сонгож өгүүлбэр бүтээнэ.",
  },
  {
    key: "copy" as const,
    enabledKey: "showCopyPractice" as const,
    titleKey: "copyTitle" as const,
    instructionKey: "copyInstruction" as const,
    label: "Хуулж бичих",
    description: "Загварыг хараад keyboard-оор ижил бичнэ.",
  },
];

const EXERCISE_TYPE_META: Record<
  ExerciseConfigItem["type"],
  {
    title: string;
    description: string;
    promptPlaceholder: string;
    answerPlaceholder: string;
    optionsPlaceholder: string;
    notePlaceholder: string;
    defaultPrompt: string;
    defaultOptions: string;
  }
> = {
  chooseMeaning: {
    title: "Бичгээс утга сонгох",
    description: "Сурагч монгол бичгийг хараад кирилл утгыг сонгоно.",
    promptPlaceholder: "Энэ монгол бичгийн кирилл утгыг сонго.",
    answerPlaceholder: "Зөв хариулт: а",
    optionsPlaceholder: "Бусад сонголт: э, и, о",
    notePlaceholder: "Нэмэлт тайлбар: Ганцаар байгаа ᠠ эгшиг",
    defaultPrompt: "Энэ монгол бичгийн кирилл утгыг сонго.",
    defaultOptions: "э, и, о",
  },
  chooseScript: {
    title: "Утгаас бичиг сонгох",
    description: "Сурагч кирилл үгийг хараад зөв монгол бичгийг сонгоно.",
    promptPlaceholder: "\"нар\" гэсэн утгатай монгол бичгийг сонго.",
    answerPlaceholder: "Зөв хариулт: ᠨᠠᠷ",
    optionsPlaceholder: "Бусад сонголт: ᠭᠡᠷ, ᠤᠰᠤ, ᠮᠣᠷᠢ",
    notePlaceholder: "Нэмэлт тайлбар: ᠠ үгийн дунд орсон",
    defaultPrompt: "\"...\" гэсэн утгатай монгол бичгийг сонго.",
    defaultOptions: "ᠭᠡᠷ, ᠤᠰᠤ, ᠮᠣᠷᠢ",
  },
  trueFalse: {
    title: "Тийм / Үгүй",
    description: "Сурагч бичиг ба утга хоорондоо таарч байгаа эсэхийг сонгоно.",
    promptPlaceholder: "Энэ бичиг \"ус\" гэсэн утгатай юу?",
    answerPlaceholder: "Зөв хариулт: Тийм эсвэл Үгүй",
    optionsPlaceholder: "Сонголт автоматаар: Тийм, Үгүй",
    notePlaceholder: "Харагдах утга: ус",
    defaultPrompt: "Энэ бичиг доорх утгатай таарч байна уу?",
    defaultOptions: "Тийм, Үгүй",
  },
  chooseNote: {
    title: "Тайлбар сонгох",
    description: "Сурагч тухайн бичигт тохирох байрлал/дүрмийн тайлбарыг сонгоно.",
    promptPlaceholder: "Энэ жишээнд ᠠ эгшиг хаана орсон бэ?",
    answerPlaceholder: "Зөв хариулт: ᠠ үгийн эхэнд орсон",
    optionsPlaceholder: "Бусад сонголт: ᠠ үгийн дунд орсон, ᠢ үгийн адагт орсон",
    notePlaceholder: "Нэмэлт тайлбар: аав",
    defaultPrompt: "Энэ жишээнд үсэг хаана орсон бэ?",
    defaultOptions: "үгийн эхэнд орсон, үгийн дунд орсон, үгийн адагт орсон",
  },
};

const EXERCISE_TYPE_ORDER: ExerciseConfigItem["type"][] = [
  "chooseMeaning",
  "chooseScript",
  "trueFalse",
  "chooseNote",
];

function makeSlug(value: string) {
  return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "");
}

function splitLines(value: string) {
  return value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
}

function parsePipeRows(value: string, minParts: number) {
  return splitLines(value)
      .map((line) => line.split("|").map((part) => part.trim()))
      .filter((parts) => parts.length >= minParts && parts[0] && parts[1]);
}

function unique(values: string[]) {
  return values.filter((value, index, array) => value && array.indexOf(value) === index);
}

function parsePairs(value: string): PairItem[] {
  return parsePipeRows(value, 2).map(([script, cyrillic]) => ({ script, cyrillic }));
}

function parseExamples(value: string): ExampleItem[] {
  return parsePipeRows(value, 2).map(([script, cyrillic, note]) => ({
    script,
    cyrillic,
    note: note ?? "",
  }));
}

function parseTasks(value: string): TaskItem[] {
  return parsePipeRows(value, 2).map(([prompt, answer, hint]) => ({
    prompt,
    answer,
    hint: hint ?? "",
  }));
}

function parseFillRows(value: string): FillItem[] {
  return parsePipeRows(value, 4).map(
      ([before, answer, after, translation, wrongChoices = ""]) => ({
        before,
        answer,
        after,
        translation,
        choices: unique([
          answer,
          ...wrongChoices
              .split(",")
              .map((choice) => choice.trim())
              .filter(Boolean),
        ]),
      }),
  );
}

function parseSortRows(value: string): SortItem[] {
  return parsePipeRows(value, 2).map(([words, translation]) => ({
    words: words
        .split(",")
        .map((word) => word.trim())
        .filter(Boolean),
    translation,
  }));
}

function parseExerciseRows(value: string): ExerciseConfigItem[] {
  return parsePipeRows(value, 5)
      .map(([type, prompt, script, answer, options, note]) => ({
        type: (
          ["chooseMeaning", "chooseScript", "trueFalse", "chooseNote"].includes(type)
              ? type
              : "chooseMeaning"
        ) as ExerciseConfigItem["type"],
        prompt,
        script,
        answer,
        options: unique(options.split(",").map((option) => option.trim())),
        note: note ?? "",
      }))
      .filter((item) => item.prompt && item.script && item.answer && item.options.length > 0);
}

function stringifyPairs(items?: PairItem[]) {
  return items?.map((item) => `${item.script} | ${item.cyrillic}`).join("\n") ?? "";
}

function stringifyExamples(items?: ExampleItem[]) {
  return (
      items
          ?.map((item) => [item.script, item.cyrillic, item.note].filter(Boolean).join(" | "))
          .join("\n") ?? ""
  );
}

function stringifyTasks(items?: TaskItem[]) {
  return (
      items
          ?.map((item) => [item.prompt, item.answer, item.hint].filter(Boolean).join(" | "))
          .join("\n") ?? ""
  );
}

function stringifyFillRows(items?: FillItem[]) {
  return (
      items
          ?.map((item) =>
              [
                item.before,
                item.answer,
                item.after,
                item.translation,
                item.choices.filter((choice) => choice !== item.answer).join(", "),
              ].join(" | "),
          )
          .join("\n") ?? ""
  );
}

function stringifySortRows(items?: SortItem[]) {
  return items?.map((item) => `${item.words.join(", ")} | ${item.translation}`).join("\n") ?? "";
}

function stringifyExerciseRows(items?: ExerciseConfigItem[]) {
  return (
      items
          ?.map((item) =>
              [
                item.type,
                item.prompt,
                item.script,
                item.answer,
                item.options.join(", "),
                item.note,
              ]
                  .filter(Boolean)
                  .join(" | "),
          )
          .join("\n") ?? ""
  );
}

function buildGuidedLessonContent(form: LessonForm) {
  const content: GuidedLessonContent = {
    version: GUIDED_LESSON_VERSION,
    intro: form.content.trim(),
    keyPoints: splitLines(form.keyPoints),
    examples: parseExamples(form.examples),
    tasks: parseTasks(form.tasks),
    wrapUp: form.wrapUp.trim(),
    activities: {
      matchGame: form.showMatchGame,
      fillGame: form.showFillGame,
      sortGame: form.showSortGame,
      copyPractice: form.showCopyPractice,
      writeCheck: form.showWriteCheck,
      matchTitle: form.matchTitle.trim(),
      matchInstruction: form.matchInstruction.trim(),
      fillTitle: form.fillTitle.trim(),
      fillInstruction: form.fillInstruction.trim(),
      sortTitle: form.sortTitle.trim(),
      sortInstruction: form.sortInstruction.trim(),
      copyTitle: form.copyTitle.trim(),
      copyInstruction: form.copyInstruction.trim(),
      matchItems: parsePairs(form.matchItems),
      fillItems: parseFillRows(form.fillItems),
      sortItems: parseSortRows(form.sortItems),
      copyItems: parsePairs(form.copyItems),
      exerciseItems: parseExerciseRows(form.exerciseItems),
    },
  };

  const hasGuidedParts =
      content.keyPoints.length > 0 ||
      content.examples.length > 0 ||
      content.tasks.length > 0 ||
      Boolean(content.wrapUp);

  const hasActivityData =
      form.showMatchGame !== EMPTY_LESSON.showMatchGame ||
      form.showFillGame !== EMPTY_LESSON.showFillGame ||
      form.showSortGame !== EMPTY_LESSON.showSortGame ||
      form.showCopyPractice !== EMPTY_LESSON.showCopyPractice ||
      form.showWriteCheck !== EMPTY_LESSON.showWriteCheck ||
      form.matchTitle !== EMPTY_LESSON.matchTitle ||
      form.matchInstruction !== EMPTY_LESSON.matchInstruction ||
      form.fillTitle !== EMPTY_LESSON.fillTitle ||
      form.fillInstruction !== EMPTY_LESSON.fillInstruction ||
      form.sortTitle !== EMPTY_LESSON.sortTitle ||
      form.sortInstruction !== EMPTY_LESSON.sortInstruction ||
      form.copyTitle !== EMPTY_LESSON.copyTitle ||
      form.copyInstruction !== EMPTY_LESSON.copyInstruction ||
      Boolean(form.matchItems.trim()) ||
      Boolean(form.fillItems.trim()) ||
      Boolean(form.sortItems.trim()) ||
      Boolean(form.copyItems.trim()) ||
      Boolean(form.exerciseItems.trim());

  return hasGuidedParts || hasActivityData ? JSON.stringify(content, null, 2) : form.content;
}

function parseGuidedLessonContent(content: string): Partial<LessonForm> {
  try {
    const parsed = JSON.parse(content) as Partial<GuidedLessonContent>;

    if (parsed.version !== GUIDED_LESSON_VERSION) {
      return { content };
    }

    return {
      content: parsed.intro ?? "",
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.join("\n") : "",
      examples: Array.isArray(parsed.examples) ? stringifyExamples(parsed.examples) : "",
      tasks: Array.isArray(parsed.tasks) ? stringifyTasks(parsed.tasks) : "",
      wrapUp: parsed.wrapUp ?? "",
      showMatchGame: parsed.activities?.matchGame ?? EMPTY_LESSON.showMatchGame,
      showFillGame: parsed.activities?.fillGame ?? EMPTY_LESSON.showFillGame,
      showSortGame: parsed.activities?.sortGame ?? EMPTY_LESSON.showSortGame,
      showCopyPractice: parsed.activities?.copyPractice ?? EMPTY_LESSON.showCopyPractice,
      showWriteCheck: parsed.activities?.writeCheck ?? EMPTY_LESSON.showWriteCheck,
      matchTitle: parsed.activities?.matchTitle ?? EMPTY_LESSON.matchTitle,
      matchInstruction: parsed.activities?.matchInstruction ?? EMPTY_LESSON.matchInstruction,
      fillTitle: parsed.activities?.fillTitle ?? EMPTY_LESSON.fillTitle,
      fillInstruction: parsed.activities?.fillInstruction ?? EMPTY_LESSON.fillInstruction,
      sortTitle: parsed.activities?.sortTitle ?? EMPTY_LESSON.sortTitle,
      sortInstruction: parsed.activities?.sortInstruction ?? EMPTY_LESSON.sortInstruction,
      copyTitle: parsed.activities?.copyTitle ?? EMPTY_LESSON.copyTitle,
      copyInstruction: parsed.activities?.copyInstruction ?? EMPTY_LESSON.copyInstruction,
      matchItems: stringifyPairs(parsed.activities?.matchItems),
      fillItems: stringifyFillRows(parsed.activities?.fillItems),
      sortItems: stringifySortRows(parsed.activities?.sortItems),
      copyItems: stringifyPairs(parsed.activities?.copyItems),
      exerciseItems: stringifyExerciseRows(parsed.activities?.exerciseItems),
    };
  } catch {
    return { content };
  }
}

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
  const tone = LEVEL_TONE_MAP[meta.tone as keyof typeof LEVEL_TONE_MAP] ?? LEVEL_TONE_MAP.sky;

  return (
      <span className={cn("inline-flex items-center gap-1.5 border text-[11px] font-extrabold px-3 py-1.5 rounded-xl", tone)}>
      <LevelIcon icon={meta.icon} size={13} />
        {meta.title}
    </span>
  );
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
      <div className="mb-1.5">
        <p className="text-[11px] font-extrabold text-ink-muted uppercase">{children}</p>
        {hint && <p className="text-[11px] font-semibold text-ink-muted mt-0.5 normal-case">{hint}</p>}
      </div>
  );
}

function TextInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
      <input
          {...props}
          className={cn(
              "w-full border-2 border-paper-100 rounded-2xl px-4 py-3 bg-white font-bold text-[14px] outline-none focus:border-sky-100 transition-all",
              className,
          )}
      />
  );
}

function TextArea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
      <textarea
          {...props}
          className={cn(
              "w-full border-2 border-paper-100 rounded-2xl px-4 py-3 bg-white font-semibold text-[13px] outline-none focus:border-sky-100 transition-all resize-none",
              className,
          )}
      />
  );
}

function SelectField(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
      <select
          {...props}
          className={cn(
              "w-full border-2 border-paper-100 rounded-2xl px-4 py-3 bg-white font-bold text-[14px] outline-none focus:border-sky-100 transition-all",
              props.className,
          )}
      />
  );
}

function SectionPanel({
                        title,
                        description,
                        children,
                      }: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
      <section className="bg-white border-2 border-paper-100 rounded-[28px] p-5 md:p-6">
        <div className="mb-5">
          <h2 className="text-[22px] font-black text-ink tracking-tight">{title}</h2>
          <p className="text-[13px] text-ink-muted font-semibold mt-1 leading-relaxed">{description}</p>
        </div>
        {children}
      </section>
  );
}

function ToggleCard({
                      title,
                      description,
                      checked,
                      onChange,
                    }: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
      <button
          type="button"
          onClick={() => onChange(!checked)}
          className={cn(
              "text-left border-2 rounded-2xl p-4 transition-all",
              checked ? "bg-sky-50 border-sky-100" : "bg-white border-paper-100 opacity-75",
          )}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[14px] font-black text-ink">{title}</p>
            <p className="text-[12px] font-semibold text-ink-muted leading-relaxed mt-1">{description}</p>
          </div>
          <span className={cn("w-10 h-6 rounded-full border-2 p-0.5 shrink-0 transition-all", checked ? "bg-sky-300 border-sky-300" : "bg-paper-100 border-paper-100")}>
          <span className={cn("block w-4 h-4 rounded-full bg-white transition-transform", checked && "translate-x-4")} />
        </span>
        </div>
      </button>
  );
}

function ScriptPreview({ value }: { value: string }) {
  return (
      <div className="bg-paper-50 border-2 border-paper-100 rounded-2xl px-4 py-3 min-h-[82px]">
        <p className="text-[11px] font-black text-ink-muted mb-2">Оруулсан бичиг</p>
        {value ? (
            <p className="font-mongolian text-sand-300 leading-none" style={{ writingMode: "vertical-lr", fontSize: 24 }}>
              {value}
            </p>
        ) : (
            <p className="text-[12px] font-semibold text-ink-muted">Keyboard дээр дарсан үсэг энд харагдана.</p>
        )}
      </div>
  );
}

function KeyboardTextArea({
                            value,
                            onChange,
                            placeholder,
                            className,
                            keyboardLabel = "Монгол бичгийн keyboard",
                          }: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  keyboardLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
      <div>
        <TextArea
            className={className}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
        />
        <div className="mt-2 bg-paper-50 border-2 border-paper-100 rounded-2xl overflow-hidden">
          <button
              type="button"
              onClick={() => setOpen((current) => !current)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
          >
            <span className="text-[12px] font-extrabold text-sky-300">{keyboardLabel}</span>
            <span className="text-[11px] font-black text-ink-muted">{open ? "Хаах" : "Нээх"}</span>
          </button>
          {open && (
              <div className="border-t-2 border-paper-100 p-3 bg-white">
                <MongolianKeyboard
                    value={value}
                    onChange={onChange}
                    mode="inline"
                    showMn={false}
                    compact
                    placeholder="Доорх үсгүүдээс дарж монгол бичгээр оруулна..."
                />
              </div>
          )}
        </div>
      </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
      <p className="text-[12px] text-ink-muted font-semibold bg-paper-50 border border-paper-100 rounded-2xl px-3 py-2">
        {children}
      </p>
  );
}

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
      <button type="button" onClick={onClick} className="text-[12px] font-bold text-ember-300 hover:text-ember-200">
        Устгах
      </button>
  );
}

export function AdminLessonEditorPage({ lessonId }: { lessonId?: string }) {
  const router = useRouter();
  const isEditing = Boolean(lessonId);

  const [form, setForm] = useState<LessonForm>(EMPTY_LESSON);
  const [activeStep, setActiveStep] = useState<StepId>("basic");
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [exampleDraft, setExampleDraft] = useState({ script: "", cyrillic: "", note: "" });
  const [taskDraft, setTaskDraft] = useState({ prompt: "", answer: "", hint: "" });
  const [matchDraft, setMatchDraft] = useState({ script: "", cyrillic: "" });
  const [fillDraft, setFillDraft] = useState({ before: "", answer: "", after: "", translation: "", wrongChoices: "" });
  const [sortDraft, setSortDraft] = useState({ words: "", translation: "" });
  const [copyDraft, setCopyDraft] = useState({ script: "", cyrillic: "" });
  const [exerciseDraft, setExerciseDraft] = useState<ExerciseDraftItem>({
    type: "chooseMeaning",
    prompt: "",
    script: "",
    answer: "",
    options: "",
    note: "",
  });

  function updateForm<K extends keyof LessonForm>(key: K, value: LessonForm[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  useEffect(() => {
    if (!lessonId) return;

    async function loadLesson() {
      try {
        setLoading(true);
        setErrorMsg("");

        const res = await fetch(`/api/admin/lessons/${lessonId}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Хичээлийг ачаалж чадсангүй.");

        const lesson: AdminLesson = await res.json();
        const guided = parseGuidedLessonContent(lesson.content);

        setForm({
          ...EMPTY_LESSON,
          title: lesson.title,
          slug: lesson.slug,
          description: lesson.description ?? "",
          grade: lesson.grade,
          level: lesson.level,
          sortOrder: lesson.sortOrder,
          status: lesson.status,
          ...guided,
        });
      } catch (error) {
        console.error(error);
        setErrorMsg(error instanceof Error ? error.message : "Алдаа гарлаа.");
      } finally {
        setLoading(false);
      }
    }

    loadLesson();
  }, [lessonId]);

  const exampleRows = useMemo(() => parseExamples(form.examples), [form.examples]);
  const taskRows = useMemo(() => parseTasks(form.tasks), [form.tasks]);
  const matchRows = useMemo(() => parsePairs(form.matchItems), [form.matchItems]);
  const fillRows = useMemo(() => parseFillRows(form.fillItems), [form.fillItems]);
  const sortRows = useMemo(() => parseSortRows(form.sortItems), [form.sortItems]);
  const copyRows = useMemo(() => parsePairs(form.copyItems), [form.copyItems]);
  const exerciseRows = useMemo(() => parseExerciseRows(form.exerciseItems), [form.exerciseItems]);

  const checks = useMemo(
      () => [
        { label: "Нэр", done: Boolean(form.title.trim()) },
        { label: "Тайлбар", done: Boolean(form.description.trim()) },
        { label: "Зорилго", done: Boolean(form.content.trim()) },
        { label: "2+ гол санаа", done: splitLines(form.keyPoints).length >= 2 },
        { label: "2+ жишээ", done: exampleRows.length >= 2 },
        { label: "2+ дасгал", done: exerciseRows.length >= 2 || taskRows.length >= 2 },
      ],
      [form.title, form.description, form.content, form.keyPoints, exampleRows.length, taskRows.length, exerciseRows.length],
  );

  const readyCount = checks.filter((check) => check.done).length;
  const levelMeta = getLevelMeta(form.level);
  const exerciseMeta = EXERCISE_TYPE_META[exerciseDraft.type];

  function appendLine(field: "examples" | "tasks" | "matchItems" | "fillItems" | "sortItems" | "copyItems" | "exerciseItems", row: string) {
    setForm((previous) => ({
      ...previous,
      [field]: [previous[field], row].filter(Boolean).join("\n"),
    }));
  }

  function removeLine(field: "examples" | "tasks" | "matchItems" | "fillItems" | "sortItems" | "copyItems" | "exerciseItems", index: number) {
    setForm((previous) => ({
      ...previous,
      [field]: splitLines(previous[field]).filter((_, rowIndex) => rowIndex !== index).join("\n"),
    }));
  }

  function addExample() {
    if (!exampleDraft.script.trim() || !exampleDraft.cyrillic.trim()) return;
    appendLine(
        "examples",
        [exampleDraft.script.trim(), exampleDraft.cyrillic.trim(), exampleDraft.note.trim()].filter(Boolean).join(" | "),
    );
    setExampleDraft({ script: "", cyrillic: "", note: "" });
  }

  function addTask() {
    if (!taskDraft.prompt.trim() || !taskDraft.answer.trim()) return;
    appendLine("tasks", [taskDraft.prompt.trim(), taskDraft.answer.trim(), taskDraft.hint.trim()].filter(Boolean).join(" | "));
    setTaskDraft({ prompt: "", answer: "", hint: "" });
  }

  function addMatchItem() {
    if (!matchDraft.script.trim() || !matchDraft.cyrillic.trim()) return;
    appendLine("matchItems", `${matchDraft.script.trim()} | ${matchDraft.cyrillic.trim()}`);
    setMatchDraft({ script: "", cyrillic: "" });
  }

  function addFillItem() {
    if (!fillDraft.answer.trim() || !fillDraft.translation.trim()) return;
    appendLine(
        "fillItems",
        [
          fillDraft.before.trim(),
          fillDraft.answer.trim(),
          fillDraft.after.trim(),
          fillDraft.translation.trim(),
          fillDraft.wrongChoices.trim(),
        ].join(" | "),
    );
    setFillDraft({ before: "", answer: "", after: "", translation: "", wrongChoices: "" });
  }

  function addSortItem() {
    if (!sortDraft.words.trim() || !sortDraft.translation.trim()) return;
    appendLine("sortItems", `${sortDraft.words.trim()} | ${sortDraft.translation.trim()}`);
    setSortDraft({ words: "", translation: "" });
  }

  function addCopyItem() {
    if (!copyDraft.script.trim() || !copyDraft.cyrillic.trim()) return;
    appendLine("copyItems", `${copyDraft.script.trim()} | ${copyDraft.cyrillic.trim()}`);
    setCopyDraft({ script: "", cyrillic: "" });
  }

  function addExerciseItem() {
    const prompt = exerciseDraft.prompt.trim() || EXERCISE_TYPE_META[exerciseDraft.type].defaultPrompt;
    if (!exerciseDraft.script.trim() || !exerciseDraft.answer.trim()) return;
    const options = unique([
      exerciseDraft.answer.trim(),
      ...String(exerciseDraft.options ?? "")
          .split(",")
          .map((option) => option.trim()),
    ]);
    appendLine(
        "exerciseItems",
        [
          exerciseDraft.type,
          prompt,
          exerciseDraft.script.trim(),
          exerciseDraft.answer.trim(),
          options.join(", "),
          exerciseDraft.note?.trim() ?? "",
        ]
            .filter(Boolean)
            .join(" | "),
    );
    setExerciseDraft({
      type: "chooseMeaning",
      prompt: "",
      script: "",
      answer: "",
      options: "",
      note: "",
    });
  }

  function chooseExerciseType(type: ExerciseConfigItem["type"]) {
    const meta = EXERCISE_TYPE_META[type];
    setExerciseDraft((previous) => ({
      ...previous,
      type,
      prompt: "",
      options: previous.options || meta.defaultOptions,
      answer: type === "trueFalse" && !previous.answer ? "Тийм" : previous.answer,
      note: type === "trueFalse" && !previous.note ? "Харагдах утгаа энд бичнэ" : previous.note,
    }));
  }

  async function saveLesson() {
    if (!form.title.trim()) {
      setActiveStep("basic");
      setErrorMsg("Хичээлийн нэр заавал хэрэгтэй.");
      return;
    }

    try {
      setSaving(true);
      setErrorMsg("");

      const slug = form.slug.trim() || makeSlug(form.title);
      const payload = {
        ...form,
        slug,
        content: buildGuidedLessonContent(form),
      };

      const res = await fetch(isEditing ? `/api/admin/lessons/${lessonId}` : "/api/admin/lessons", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? "Хичээл хадгалахад алдаа гарлаа.");
      }

      router.push("/admin");
    } catch (error) {
      console.error(error);
      setErrorMsg(error instanceof Error ? error.message : "Алдаа гарлаа.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
        <div className="max-w-[1180px] mx-auto px-6 py-12">
          <div className="bg-white border-2 border-paper-100 rounded-[28px] p-10 text-center">
            <p className="text-[15px] font-bold text-ink-muted">Хичээлийг ачаалж байна...</p>
          </div>
        </div>
    );
  }

  return (
      <div className="max-w-[1320px] mx-auto px-5 md:px-6 py-8 pb-16">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <button
                type="button"
                onClick={() => router.push("/admin")}
                className="inline-flex items-center gap-2 text-[13px] font-extrabold text-sky-300 hover:text-sky-200 mb-3"
            >
              <IconArrowL size={15} strokeWidth={2.4} />
              Админ самбар луу буцах
            </button>
            <h1 className="text-[30px] md:text-[36px] font-black tracking-tight text-ink">
              {isEditing ? "Хичээл засварлах" : "Шинэ хичээл зохиох"}
            </h1>
            <p className="text-[14px] text-ink-muted font-semibold mt-1">
              Одоо хэсэг хэсгээр бөглөнө. Нэг дор олон талбар харагдахгүй тул ашиглахад амар.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
                type="button"
                onClick={() => router.push("/admin")}
                className="bg-white border-2 border-paper-100 text-ink-muted font-bold text-[14px] px-5 py-3 rounded-2xl hover:bg-paper-50 transition-all"
            >
              Болих
            </button>
            <button
                type="button"
                onClick={saveLesson}
                disabled={saving || !form.title.trim()}
                className={cn(
                    "font-extrabold text-[14px] px-6 py-3 rounded-2xl transition-all",
                    !saving && form.title.trim()
                        ? "bg-sky-300 text-white hover:bg-sky-200"
                        : "bg-paper-100 text-ink-muted cursor-not-allowed",
                )}
            >
              {saving ? "Хадгалж байна..." : isEditing ? "Өөрчлөлт хадгалах" : form.status === "PUBLISHED" ? "Хичээл нийтлэх" : "Ноорог хадгалах"}
            </button>
          </div>
        </header>

        {errorMsg && <div className="bg-ember-50 border-2 border-ember-100 text-ember-300 rounded-2xl px-4 py-3 mb-5 text-[13px] font-bold">{errorMsg}</div>}

        <div className="flex flex-col gap-5">
          <div className="bg-white border-2 border-paper-100 rounded-[28px] p-3">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {STEPS.map((step, index) => (
                  <button
                      key={step.id}
                      type="button"
                      onClick={() => setActiveStep(step.id)}
                      className={cn(
                          "text-left rounded-2xl border-2 px-4 py-3 transition-all",
                          activeStep === step.id ? "bg-sky-50 border-sky-100 shadow-soft" : "bg-white border-transparent hover:bg-paper-50",
                      )}
                  >
                    <p className={cn("text-[13px] font-black", activeStep === step.id ? "text-sky-300" : "text-ink")}>
                      {index + 1}. {step.title}
                    </p>
                    <p className="text-[11px] font-semibold text-ink-muted mt-0.5">{step.description}</p>
                  </button>
              ))}
            </div>
          </div>

          <div className="bg-white border-2 border-paper-100 rounded-[24px] px-4 py-3 flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-black text-sky-300 mr-1">Бэлэн байдал {readyCount}/{checks.length}</span>
            {checks.map((item) => (
                <span
                    key={item.label}
                    className={cn(
                        "border rounded-xl px-3 py-1.5 text-[11px] font-extrabold",
                        item.done ? "bg-grass-50 border-grass-100 text-grass-300" : "bg-paper-50 border-paper-100 text-ink-muted",
                    )}
                >
                  {item.done ? "✓ " : "• "}
                  {item.label}
                </span>
            ))}
          </div>

          <main className="min-w-0 max-w-[1040px] w-full mx-auto">
            {activeStep === "basic" && (
                <SectionPanel title="Хичээл" description="Сурагчид харагдах нэр, түвшин, богино тайлбарыг л бөглөнө.">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-4">
                    <div>
                      <FieldLabel>Хичээлийн нэр</FieldLabel>
                      <TextInput
                          value={form.title}
                          onChange={(event) => {
                            const title = event.target.value;
                            setForm((previous) => ({
                              ...previous,
                              title,
                              slug: !isEditing && !previous.slug ? makeSlug(title) : previous.slug,
                            }));
                          }}
                          placeholder="Эгшиг үсэг"
                      />
                    </div>

                    <div>
                      <FieldLabel>Төлөв</FieldLabel>
                      <SelectField value={form.status} onChange={(event) => updateForm("status", event.target.value as LessonStatus)}>
                        <option value="PUBLISHED">Нийтлэх</option>
                        <option value="DRAFT">Ноорог</option>
                      </SelectField>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div>
                      <FieldLabel>Түвшин</FieldLabel>
                      <SelectField value={form.level} onChange={(event) => updateForm("level", Number(event.target.value))}>
                        {LEVEL_META.map((level) => (
                            <option key={level.n} value={level.n}>
                              {level.title} · {level.subtitle}
                            </option>
                        ))}
                      </SelectField>
                    </div>

                    <div className="mt-3 bg-paper-50 border border-paper-100 rounded-2xl px-4 py-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <LevelBadge level={form.level} />
                        <p className="text-[13px] font-black text-ink">{levelMeta.subtitle}</p>
                      </div>
                      <p className="text-[12px] text-ink-muted font-semibold leading-relaxed mt-2">{levelMeta.description}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <FieldLabel hint="Сурагч энэ хичээлээр юу сурахыг 1–2 өгүүлбэрээр бич.">Товч тайлбар</FieldLabel>
                    <KeyboardTextArea
                        className="h-28"
                        value={form.description}
                        onChange={(value) => updateForm("description", value)}
                        placeholder="Жишээ: Энэ хичээлээр сурагч үндэсний бичгийн эгшиг үсгийг таньж, жишээ үгээр уншиж сурна..."
                    />
                  </div>

                </SectionPanel>
            )}

            {activeStep === "content" && (
                <SectionPanel title="Хичээлийн агуулга" description="Хүүхэд хичээл рүү ороход эхлээд зорилго, дараа нь гол санаанууд харагдана.">
                  <div>
                    <FieldLabel hint="Хүүхэд яг юу сурахыг энгийнээр бич.">Өнөөдрийн зорилго</FieldLabel>
                    <KeyboardTextArea
                        className="h-36"
                        value={form.content}
                        onChange={(value) => updateForm("content", value)}
                        placeholder="Өнөөдрийн хичээлээр сурагч ... ойлгож, ... бичиж сурна."
                    />
                  </div>

                  <div className="mt-4">
                    <FieldLabel hint="Нэг мөрөнд нэг санаа бич. Жишээ: ᠠ нь кирилл а авиатай ойролцоо.">Гол санаанууд</FieldLabel>
                    <KeyboardTextArea
                        className="h-40"
                        value={form.keyPoints}
                        onChange={(value) => updateForm("keyPoints", value)}
                        placeholder={"Нэг мөрөнд нэг санаа бичнэ.\nЭгшиг үсэг үгийн эхэнд тод харагдана.\nᠠ нь кирилл а авиатай ойролцоо."}
                    />
                  </div>
                </SectionPanel>
            )}

            {activeStep === "examples" && (
                <SectionPanel title="Жишээ үгс" description="Pipe тэмдэг гараар бичих шаардлагагүй. Доорх талбарт бичээд Нэмэх товч дарна.">
                  <div className="bg-sky-50 border-2 border-sky-100 rounded-3xl p-4 mb-4">
                    <h3 className="text-[16px] font-black text-ink mb-1">
                      Жишээ үг гэж юу вэ?
                    </h3>
                    <p className="text-[13px] font-semibold text-ink-muted leading-relaxed">
                      Энэ нь сурагчийн “Жишээ” хэсэг дээр харагдах үг юм.
                      Монгол бичгийг keyboard-оор оруулаад, кирилл утга болон
                      богино тайлбарыг бичнэ. Дараа нь эдгээр жишээнээс дасгал
                      хийхэд ашиглаж болно.
                    </p>
                  </div>

                  <div className="bg-paper-50 border-2 border-paper-100 rounded-3xl p-4">
                    <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1fr] gap-4">
                      <MongolianKeyboard
                          label="Монгол бичгийн жишээ"
                          value={exampleDraft.script}
                          onChange={(value) => setExampleDraft((previous) => ({ ...previous, script: value }))}
                          mode="inline"
                          placeholder="Үсгүүдээс дарж жишээ үгээ бичнэ..."
                      />

                      <div className="flex flex-col gap-3">
                        <ScriptPreview value={exampleDraft.script} />
                        <FieldLabel hint="Сурагч унших кирилл утга. Жишээ: а, гэр, нар">Кирилл утга</FieldLabel>
                        <TextInput value={exampleDraft.cyrillic} onChange={(event) => setExampleDraft((previous) => ({ ...previous, cyrillic: event.target.value }))} placeholder="Кирилл утга: морь" />
                        <FieldLabel hint="Үсгийн байрлал, дүрэм, эсвэл богино санамж.">Богино тайлбар</FieldLabel>
                        <TextInput className="font-semibold text-[13px]" value={exampleDraft.note} onChange={(event) => setExampleDraft((previous) => ({ ...previous, note: event.target.value }))} placeholder="Тайлбар: м + о + р + и" />
                        <button
                            type="button"
                            onClick={addExample}
                            disabled={!exampleDraft.script.trim() || !exampleDraft.cyrillic.trim()}
                            className={cn("font-extrabold text-[13px] px-4 py-3 rounded-2xl transition-all", exampleDraft.script.trim() && exampleDraft.cyrillic.trim() ? "bg-sky-300 text-white hover:bg-sky-200" : "bg-paper-100 text-ink-muted cursor-not-allowed")}
                        >
                          Жишээ нэмэх
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5">
                    <FieldLabel>Нэмэгдсэн жишээнүүд</FieldLabel>
                    <div className="flex flex-col gap-2">
                      {exampleRows.length === 0 ? (
                          <EmptyHint>Одоогоор жишээ үг нэмээгүй байна.</EmptyHint>
                      ) : (
                          exampleRows.map((item, index) => (
                              <div key={`${item.script}-${index}`} className="flex items-center gap-3 bg-paper-50 border border-paper-100 rounded-2xl px-3 py-2">
                        <span className="font-mongolian text-sand-300" style={{ writingMode: "vertical-lr", fontSize: 22 }}>
                          {item.script}
                        </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] font-black text-ink">{item.cyrillic}</p>
                                  {item.note && <p className="text-[11px] font-semibold text-ink-muted mt-0.5">{item.note}</p>}
                                </div>
                                <DeleteButton onClick={() => removeLine("examples", index)} />
                              </div>
                          ))
                      )}
                    </div>
                  </div>
                </SectionPanel>
            )}

            {activeStep === "activities" && (
                <SectionPanel title="Тоглоомын тохиргоо" description="Ямар дасгал сурагчид харагдахыг асааж/унтраана. Хэрэв тусгай үг нэмэхгүй бол жишээ үгсээс автоматаар үүсгэнэ.">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ACTIVITY_CONFIG.map((item) => (
                        <ToggleCard
                            key={item.key}
                            title={item.label}
                            description={item.description}
                            checked={Boolean(form[item.enabledKey])}
                            onChange={(checked) => updateForm(item.enabledKey, checked)}
                        />
                    ))}
                    <ToggleCard
                        title="Асуулттай бичих шалгалт"
                        description="Доорх шалгалтын даалгавраар бичих хариулт шалгана."
                        checked={form.showWriteCheck}
                        onChange={(checked) => updateForm("showWriteCheck", checked)}
                    />
                  </div>

                  <div className="mt-5 bg-paper-50 border-2 border-paper-100 rounded-3xl p-4">
                    <h3 className="text-[16px] font-black text-ink mb-1">Гарчиг ба богино заавар</h3>
                    <p className="text-[12px] text-ink-muted font-semibold mb-4">Зөвхөн асаалттай тоглоомын тохиргоо доор харагдана.</p>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {ACTIVITY_CONFIG.filter((item) => form[item.enabledKey]).map((item) => (
                          <div key={item.key} className="bg-white border-2 border-paper-100 rounded-2xl p-4">
                            <p className="text-[12px] font-black text-sky-300 mb-3">{item.label}</p>
                            <TextInput className="text-[13px] mb-2" value={String(form[item.titleKey])} onChange={(event) => updateForm(item.titleKey, event.target.value)} placeholder="Гарчиг" />
                            <TextArea className="h-20 text-[12px]" value={String(form[item.instructionKey])} onChange={(event) => updateForm(item.instructionKey, event.target.value)} placeholder="Хүүхдэд харагдах богино заавар" />
                          </div>
                      ))}
                    </div>
                  </div>

                  {form.showMatchGame && (
                      <div className="mt-5 bg-white border-2 border-paper-100 rounded-3xl p-4">
                        <FieldLabel hint="Хүүхэд монгол бичгийг хараад зөв кирилл утгыг сонгоно.">Тааруулах тоглоомын үгс</FieldLabel>
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4">
                          <MongolianKeyboard value={matchDraft.script} onChange={(value) => setMatchDraft((previous) => ({ ...previous, script: value }))} mode="inline" compact showMn={false} placeholder="Монгол бичгийн үг" />
                          <div className="flex flex-col gap-3">
                            <ScriptPreview value={matchDraft.script} />
                            <TextInput value={matchDraft.cyrillic} onChange={(event) => setMatchDraft((previous) => ({ ...previous, cyrillic: event.target.value }))} placeholder="Кирилл утга: гэр" />
                            <button type="button" onClick={addMatchItem} disabled={!matchDraft.script.trim() || !matchDraft.cyrillic.trim()} className={cn("font-extrabold text-[13px] px-4 py-3 rounded-2xl transition-all", matchDraft.script.trim() && matchDraft.cyrillic.trim() ? "bg-sky-300 text-white hover:bg-sky-200" : "bg-paper-100 text-ink-muted cursor-not-allowed")}>Үг нэмэх</button>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-col gap-2">
                          {matchRows.length === 0 ? <EmptyHint>Тусгай үг байхгүй. Жишээ үгсээс автоматаар үүснэ.</EmptyHint> : matchRows.map((item, index) => (
                              <div key={`match-${index}`} className="flex items-center gap-3 bg-paper-50 border border-paper-100 rounded-2xl px-3 py-2">
                                <span className="font-mongolian text-sand-300" style={{ writingMode: "vertical-lr", fontSize: 22 }}>{item.script}</span>
                                <span className="flex-1 text-[13px] font-bold text-ink">{item.cyrillic}</span>
                                <DeleteButton onClick={() => removeLine("matchItems", index)} />
                              </div>
                          ))}
                        </div>
                      </div>
                  )}

                  {form.showFillGame && (
                      <div className="mt-5 bg-white border-2 border-paper-100 rounded-3xl p-4">
                        <FieldLabel hint="Жишээ: Би ___ уншина. Зөв хариулт: ном.">Хоосон зай нөхөх</FieldLabel>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <TextInput value={fillDraft.before} onChange={(event) => setFillDraft((previous) => ({ ...previous, before: event.target.value }))} placeholder="Өмнөх үг: ᠪᠢ" />
                          <TextInput value={fillDraft.answer} onChange={(event) => setFillDraft((previous) => ({ ...previous, answer: event.target.value }))} placeholder="Зөв хариулт: ᠨᠣᠮ" />
                          <TextInput value={fillDraft.after} onChange={(event) => setFillDraft((previous) => ({ ...previous, after: event.target.value }))} placeholder="Дараах үг: ᠤᠩᠰᠢᠨ᠎ᠠ" />
                          <TextInput value={fillDraft.translation} onChange={(event) => setFillDraft((previous) => ({ ...previous, translation: event.target.value }))} placeholder="Кирилл утга: Би ном уншина" />
                        </div>
                        <TextInput className="mt-2 font-semibold text-[13px]" value={fillDraft.wrongChoices} onChange={(event) => setFillDraft((previous) => ({ ...previous, wrongChoices: event.target.value }))} placeholder="Буруу сонголтууд: ᠮᠣᠷᠢ, ᠤᠰᠤ" />
                        <button type="button" onClick={addFillItem} disabled={!fillDraft.answer.trim() || !fillDraft.translation.trim()} className={cn("w-full font-extrabold text-[13px] px-4 py-3 rounded-2xl transition-all mt-2", fillDraft.answer.trim() && fillDraft.translation.trim() ? "bg-sky-300 text-white hover:bg-sky-200" : "bg-paper-100 text-ink-muted cursor-not-allowed")}>Дасгал нэмэх</button>
                        <div className="mt-3 flex flex-col gap-2">
                          {fillRows.length === 0 ? <EmptyHint>Одоогоор тусгай нөхөх дасгал нэмээгүй.</EmptyHint> : fillRows.map((item, index) => (
                              <div key={`fill-${index}`} className="bg-paper-50 border border-paper-100 rounded-2xl px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[13px] font-bold text-ink flex-1">{item.translation}</span>
                                  <DeleteButton onClick={() => removeLine("fillItems", index)} />
                                </div>
                                <p className="text-[11px] font-semibold text-ink-muted mt-1">Зөв: {item.answer} · Сонголт: {item.choices.join(", ")}</p>
                              </div>
                          ))}
                        </div>
                      </div>
                  )}

                  {form.showSortGame && (
                      <div className="mt-5 bg-white border-2 border-paper-100 rounded-3xl p-4">
                        <FieldLabel hint="Үгсийг таслалаар салгаж бичнэ.">Дарааллаар өрөх</FieldLabel>
                        <TextInput value={sortDraft.words} onChange={(event) => setSortDraft((previous) => ({ ...previous, words: event.target.value }))} placeholder="Үгс: ᠪᠢ, ᠨᠣᠮ, ᠤᠩᠰᠢᠨ᠎ᠠ" />
                        <TextInput className="mt-2" value={sortDraft.translation} onChange={(event) => setSortDraft((previous) => ({ ...previous, translation: event.target.value }))} placeholder="Кирилл утга: Би ном уншина" />
                        <button type="button" onClick={addSortItem} disabled={!sortDraft.words.trim() || !sortDraft.translation.trim()} className={cn("w-full font-extrabold text-[13px] px-4 py-3 rounded-2xl transition-all mt-2", sortDraft.words.trim() && sortDraft.translation.trim() ? "bg-sky-300 text-white hover:bg-sky-200" : "bg-paper-100 text-ink-muted cursor-not-allowed")}>Өрөх дасгал нэмэх</button>
                        <div className="mt-3 flex flex-col gap-2">
                          {sortRows.length === 0 ? <EmptyHint>Одоогоор тусгай өрөх дасгал нэмээгүй.</EmptyHint> : sortRows.map((item, index) => (
                              <div key={`sort-${index}`} className="bg-paper-50 border border-paper-100 rounded-2xl px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[13px] font-bold text-ink flex-1">{item.translation}</span>
                                  <DeleteButton onClick={() => removeLine("sortItems", index)} />
                                </div>
                                <p className="text-[11px] font-semibold text-ink-muted mt-1">{item.words.join(" · ")}</p>
                              </div>
                          ))}
                        </div>
                      </div>
                  )}

                  {form.showCopyPractice && (
                      <div className="mt-5 bg-white border-2 border-paper-100 rounded-3xl p-4">
                        <FieldLabel hint="Хүүхэд загварыг хараад ижил бичнэ.">Хуулж бичих үгс</FieldLabel>
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4">
                          <MongolianKeyboard value={copyDraft.script} onChange={(value) => setCopyDraft((previous) => ({ ...previous, script: value }))} mode="inline" compact showMn={false} placeholder="Хуулж бичих үг" />
                          <div className="flex flex-col gap-3">
                            <ScriptPreview value={copyDraft.script} />
                            <TextInput value={copyDraft.cyrillic} onChange={(event) => setCopyDraft((previous) => ({ ...previous, cyrillic: event.target.value }))} placeholder="Кирилл утга: ном" />
                            <button type="button" onClick={addCopyItem} disabled={!copyDraft.script.trim() || !copyDraft.cyrillic.trim()} className={cn("font-extrabold text-[13px] px-4 py-3 rounded-2xl transition-all", copyDraft.script.trim() && copyDraft.cyrillic.trim() ? "bg-sky-300 text-white hover:bg-sky-200" : "bg-paper-100 text-ink-muted cursor-not-allowed")}>Үг нэмэх</button>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-col gap-2">
                          {copyRows.length === 0 ? <EmptyHint>Одоогоор тусгай хуулж бичих үг нэмээгүй.</EmptyHint> : copyRows.map((item, index) => (
                              <div key={`copy-${index}`} className="flex items-center gap-3 bg-paper-50 border border-paper-100 rounded-2xl px-3 py-2">
                                <span className="font-mongolian text-sand-300" style={{ writingMode: "vertical-lr", fontSize: 22 }}>{item.script}</span>
                                <span className="flex-1 text-[13px] font-bold text-ink">{item.cyrillic}</span>
                                <DeleteButton onClick={() => removeLine("copyItems", index)} />
                              </div>
                          ))}
                        </div>
                      </div>
                  )}
                </SectionPanel>
            )}

            {activeStep === "tasks" && (
                <SectionPanel title="Дасгалууд" description="Багш хүн 4 алхмаар дасгал нэмнэ: төрлөө сонгоно, бичгээ оруулна, зөв хариултаа бичнэ, буруу сонголтоо нэмнэ.">
                  <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-5">
                    <div className="bg-paper-50 border-2 border-paper-100 rounded-3xl p-4 h-fit">
                      <FieldLabel>1. Ямар дасгал вэ?</FieldLabel>
                      <div className="grid grid-cols-1 gap-2">
                      {EXERCISE_TYPE_ORDER.map((type) => {
                        const meta = EXERCISE_TYPE_META[type];
                        const active = exerciseDraft.type === type;

                        return (
                            <button
                                key={type}
                                type="button"
                                onClick={() => chooseExerciseType(type)}
                                className={cn(
                                    "text-left border-2 rounded-2xl p-4 transition-all",
                                    active
                                        ? "bg-white border-sky-100 shadow-soft"
                                        : "bg-white/70 border-paper-100 hover:bg-white",
                                )}
                            >
                              <p className={cn("text-[14px] font-black", active ? "text-sky-300" : "text-ink")}>{meta.title}</p>
                              <p className="text-[11px] text-ink-muted font-semibold leading-relaxed mt-1">{meta.description}</p>
                            </button>
                        );
                      })}
                      </div>
                    </div>

                    <div className="bg-white border-2 border-paper-100 rounded-3xl p-4">
                      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">
                        <div>
                          <FieldLabel hint="Доорх keyboard-оор сурагчид харагдах монгол бичгээ оруулна.">2. Монгол бичиг</FieldLabel>
                          <MongolianKeyboard
                              label="Монгол бичиг"
                              value={exerciseDraft.script}
                              onChange={(value) => setExerciseDraft((previous) => ({ ...previous, script: value }))}
                              mode="inline"
                              placeholder="Монгол бичгээ энд оруулна..."
                          />
                        </div>
                        <ScriptPreview value={exerciseDraft.script} />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                        <div>
                          <FieldLabel hint="Зөв гэж тооцох хариулт. Жишээ: а эсвэл ᠨᠠᠷ эсвэл Тийм.">3. Зөв хариулт</FieldLabel>
                          <TextInput
                              value={exerciseDraft.answer}
                              onChange={(event) => setExerciseDraft((previous) => ({ ...previous, answer: event.target.value }))}
                              placeholder={exerciseMeta.answerPlaceholder}
                          />
                        </div>
                        <div>
                          <FieldLabel hint="Буруу сонголтуудаа таслалаар салга. Зөв хариулт автоматаар нэмэгдэнэ.">4. Буруу сонголтууд</FieldLabel>
                          <TextInput
                              value={exerciseDraft.options}
                              onChange={(event) => setExerciseDraft((previous) => ({ ...previous, options: event.target.value }))}
                              placeholder={exerciseMeta.optionsPlaceholder}
                          />
                        </div>
                      </div>

                      <div className="mt-3">
                        <FieldLabel hint="Заавал биш. Байрлал, утга, дүрмийн богино тайлбар бичиж болно.">Нэмэлт тайлбар</FieldLabel>
                        <TextInput
                            value={exerciseDraft.note}
                            onChange={(event) => setExerciseDraft((previous) => ({ ...previous, note: event.target.value }))}
                            placeholder={exerciseMeta.notePlaceholder}
                        />
                      </div>

                      <details className="mt-4 bg-paper-50 border border-paper-100 rounded-2xl px-4 py-3">
                        <summary className="cursor-pointer text-[12px] font-black text-ink-muted">Асуултын өгүүлбэрийг өөрчлөх</summary>
                        <div className="mt-3">
                          <TextInput
                              value={exerciseDraft.prompt}
                              onChange={(event) => setExerciseDraft((previous) => ({ ...previous, prompt: event.target.value }))}
                              placeholder={exerciseMeta.promptPlaceholder}
                          />
                          <p className="text-[11px] font-semibold text-ink-muted mt-2">
                            Хоосон орхивол “{exerciseMeta.defaultPrompt}” гэж автоматаар орно.
                          </p>
                        </div>
                      </details>

                      <div className="mt-4 bg-sky-50 border border-sky-100 rounded-2xl px-4 py-3">
                        <p className="text-[11px] font-black text-sky-300 uppercase mb-2">Сурагчид харагдах жишээ</p>
                        <p className="text-[14px] font-black text-ink mb-2">{exerciseDraft.prompt || exerciseMeta.defaultPrompt}</p>
                        <div className="flex items-center gap-4">
                          <span className="w-16 h-20 rounded-2xl bg-white border border-sand-100 flex items-center justify-center">
                            <span className="font-mongolian text-sand-300" style={{ writingMode: "vertical-lr", fontSize: 28 }}>{exerciseDraft.script || "ᠠ"}</span>
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {unique([
                              exerciseDraft.answer || "Зөв хариулт",
                              ...exerciseDraft.options.split(",").map((option) => option.trim()).filter(Boolean),
                            ]).slice(0, 4).map((option) => (
                                <span key={option} className="bg-white border border-sky-100 rounded-xl px-3 py-1.5 text-[12px] font-bold text-ink-muted">{option}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <button
                          type="button"
                          onClick={addExerciseItem}
                          disabled={!exerciseDraft.script.trim() || !exerciseDraft.answer.trim()}
                          className={cn("w-full mt-4 font-extrabold text-[14px] px-4 py-3 rounded-2xl transition-all", exerciseDraft.script.trim() && exerciseDraft.answer.trim() ? "bg-grass-300 text-white hover:bg-grass-200" : "bg-paper-100 text-ink-muted cursor-not-allowed")}
                      >
                        Дасгал нэмэх
                      </button>
                    </div>
                  </div>

                  <div className="mt-5">
                    <FieldLabel>Нэмэгдсэн дасгалууд</FieldLabel>
                    <div className="flex flex-col gap-2">
                      {exerciseRows.length === 0 ? <EmptyHint>Одоогоор дасгал нэмээгүй байна. Нэмэхгүй бол жишээ үгсээс автоматаар үүснэ.</EmptyHint> : exerciseRows.map((item, index) => (
                          <div key={`exercise-${index}`} className="bg-paper-50 border border-paper-100 rounded-2xl px-3 py-2">
                            <div className="flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-black text-ink">{item.prompt}</p>
                                <div className="flex items-center gap-3 mt-2">
                                  <span className="font-mongolian text-sand-300" style={{ writingMode: "vertical-lr", fontSize: 22 }}>{item.script}</span>
                                  <span className="text-[12px] font-semibold text-ink-muted">Зөв: {item.answer}</span>
                                </div>
                                <p className="text-[11px] font-semibold text-ink-muted mt-0.5">Сонголт: {item.options.join(", ")}</p>
                              </div>
                              <DeleteButton onClick={() => removeLine("exerciseItems", index)} />
                            </div>
                          </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5">
                    <FieldLabel hint="Хичээл дуусахад сурагчид харагдах урамшууллын текст.">Дуусгах урамшуулал</FieldLabel>
                    <KeyboardTextArea
                        className="h-24"
                        value={form.wrapUp}
                        onChange={(value) => updateForm("wrapUp", value)}
                        placeholder="Одоо чи энэ хичээлийн үгсийг уншиж, бичиж чадна. Шалгалтаар бататгая!"
                    />
                  </div>
                </SectionPanel>
            )}
          </main>
        </div>
      </div>
  );
}
