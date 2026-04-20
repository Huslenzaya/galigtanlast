"use client";

import {
  IconArrowL,
  IconBarChart,
  IconCheck,
  IconLayers,
  IconRefresh,
  IconSliders,
  IconStar,
  IconTarget,
  IconWrite,
  IconX,
  IconZap,
} from "@/components/ui/Icons";
import { PageHero } from "@/components/ui/PageHero";
import { BALLOON_COLORS, BALLOON_QUESTIONS, LETTERS } from "@/lib/data";
import { useAppStore } from "@/lib/store";
import { cn, shuffle } from "@/lib/utils";
import type { Letter } from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";

type GameId = "match" | "speed" | "memory" | "sort" | "balloon" | "fillblank";

interface GameMeta {
  id: GameId;
  name: string;
  desc: string;
  skill: string;
  Icon: any;
  color: string;
  accentBg: string;
  accentText: string;
  xp: string;
  difficulty: "Хялбар" | "Дунд" | "Хэцүү";
}

const GAMES: GameMeta[] = [
  {
    id: "match",
    name: "Үсэг тааруулах",
    desc: "Монгол бичгийн үсгийг кирилл авиатай нь тааруулж, үсэг таних чадвараа бататгана.",
    skill: "Үсэг ба авиа",
    Icon: IconLayers,
    color: "#1a6bbd",
    accentBg: "bg-sky-50",
    accentText: "text-sky-300",
    xp: "+10",
    difficulty: "Хялбар",
  },
  {
    id: "speed",
    name: "Хурдан таних",
    desc: "Дэлгэц дээр гарсан монгол бичгийн үсгийн зөв авиаг богино хугацаанд сонгоно.",
    skill: "Хурдтай таних",
    Icon: IconZap,
    color: "#2a9a52",
    accentBg: "bg-grass-50",
    accentText: "text-grass-300",
    xp: "+10–15",
    difficulty: "Дунд",
  },
  {
    id: "memory",
    name: "Ижил үсэг олох",
    desc: "Ижил монгол бичгийн үсгүүдийг санаж олж, харааны ой тогтоолтоо хөгжүүлнэ.",
    skill: "Дүрс тогтоох",
    Icon: IconStar,
    color: "#c97b2a",
    accentBg: "bg-sand-50",
    accentText: "text-sand-300",
    xp: "+15",
    difficulty: "Дунд",
  },
  {
    id: "sort",
    name: "Өгүүлбэр эвлүүлэх",
    desc: "Монгол бичгээр өгөгдсөн үгсийг зөв дараалалд оруулж өгүүлбэр бүтээнэ.",
    skill: "Өгүүлбэрийн дараалал",
    Icon: IconSliders,
    color: "#c83030",
    accentBg: "bg-ember-50",
    accentText: "text-ember-300",
    xp: "+20",
    difficulty: "Дунд",
  },
  {
    id: "balloon",
    name: "Зөв үгийг сонгох",
    desc: "Асуултад тохирох монгол бичгийн зөв үгийг хурдан ялгаж сонгоно.",
    skill: "Үг ялгах",
    Icon: IconTarget,
    color: "#7c5cbf",
    accentBg: "bg-[#f4f0ff]",
    accentText: "text-[#7c5cbf]",
    xp: "+10",
    difficulty: "Хэцүү",
  },
  {
    id: "fillblank",
    name: "Хоосон зай нөхөх",
    desc: "Өгүүлбэрийн утгыг ойлгож, тохирох монгол бичгийн үгийг нөхнө.",
    skill: "Утга ба холбоо",
    Icon: IconWrite,
    color: "#1a9e8a",
    accentBg: "bg-[#e8faf7]",
    accentText: "text-[#1a9e8a]",
    xp: "+15",
    difficulty: "Дунд",
  },
];

const DIFF_COLOR: Record<string, string> = {
  Хялбар: "bg-grass-50 text-grass-300 border-grass-100",
  Дунд: "bg-sand-50 text-sand-300 border-sand-100",
  Хэцүү: "bg-ember-50 text-ember-300 border-ember-100",
};

const SORT_TASKS = [
  {
    p: ["ᠪᠢ", "ᠨᠣᠮ", "ᠤᠩᠰᠢᠨ᠎ᠠ"],
    a: ["ᠪᠢ", "ᠨᠣᠮ", "ᠤᠩᠰᠢᠨ᠎ᠠ"],
    tr: "Би ном уншина",
  },
  {
    p: ["ᠲᠡᠷᠡ", "ᠪᠢᠴᠢᠭ", "ᠪᠢᠴᠢᠨ᠎ᠡ"],
    a: ["ᠲᠡᠷᠡ", "ᠪᠢᠴᠢᠭ", "ᠪᠢᠴᠢᠨ᠎ᠡ"],
    tr: "Тэр бичиг бичнэ",
  },
  {
    p: ["ᠮᠢᠨᠦ", "ᠨᠡᠷ᠎ᠡ", "ᠰᠠᠢᠬᠠᠨ"],
    a: ["ᠮᠢᠨᠦ", "ᠨᠡᠷ᠎ᠡ", "ᠰᠠᠢᠬᠠᠨ"],
    tr: "Миний нэр сайхан",
  },
  {
    p: ["ᠪᠢᠳᠡ", "ᠮᠣᠩᠭᠣᠯ", "ᠪᠢᠴᠢᠭ", "ᠰᠤᠷᠤᠨ᠎ᠠ"],
    a: ["ᠪᠢᠳᠡ", "ᠮᠣᠩᠭᠣᠯ", "ᠪᠢᠴᠢᠭ", "ᠰᠤᠷᠤᠨ᠎ᠠ"],
    tr: "Бид монгол бичиг сурна",
  },
  {
    p: ["ᠰᠤᠷᠤᠭᠴᠢ", "ᠬᠢᠴᠢᠶᠡᠯ", "ᠳᠡᠭᠡᠨ", "ᠰᠠᠢᠨ"],
    a: ["ᠰᠤᠷᠤᠭᠴᠢ", "ᠬᠢᠴᠢᠶᠡᠯ", "ᠳᠡᠭᠡᠨ", "ᠰᠠᠢᠨ"],
    tr: "Сурагч хичээлдээ сайн",
  },
];

const FILL_TASKS = [
  {
    before: "ᠪᠢ",
    blank: "_____",
    after: "ᠤᠩᠰᠢᠨ᠎ᠠ",
    choices: ["ᠨᠣᠮ", "ᠮᠣᠷᠢ", "ᠤᠰᠤ"],
    c: 0,
    tr: "Би ном уншина",
  },
  {
    before: "ᠲᠡᠷᠡ",
    blank: "_____",
    after: "ᠪᠢᠴᠢᠨ᠎ᠡ",
    choices: ["ᠪᠢᠴᠢᠭ", "ᠨᠠᠷ", "ᠵᠢᠯ"],
    c: 0,
    tr: "Тэр бичиг бичнэ",
  },
  {
    before: "ᠪᠢᠳᠡ",
    blank: "_____",
    after: "ᠰᠤᠷᠤᠨ᠎ᠠ",
    choices: ["ᠮᠣᠩᠭᠣᠯ ᠪᠢᠴᠢᠭ", "ᠮᠣᠷᠢ", "ᠤᠰᠤ"],
    c: 0,
    tr: "Бид монгол бичиг сурна",
  },
  {
    before: "ᠨᠠᠷ",
    blank: "_____",
    after: "ᠭᠡᠷᠡᠯᠲᠡᠨ᠎ᠡ",
    choices: ["ᠰᠠᠢᠬᠠᠨ", "ᠪᠢᠴᠢᠭ", "ᠬᠦᠮᠦᠨ"],
    c: 0,
    tr: "Нар сайхан гэрэлтэнэ",
  },
  {
    before: "ᠰᠤᠷᠤᠭᠴᠢ",
    blank: "_____",
    after: "ᠳᠠᠪᠲᠠᠨ᠎ᠠ",
    choices: ["ᠬᠢᠴᠢᠶᠡᠯ", "ᠮᠣᠷᠢ", "ᠴᠠᠭ"],
    c: 0,
    tr: "Сурагч хичээл давтана",
  },
];

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

function MongolText({
  children,
  size = 20,
  height = 30,
  colorClass = "text-sand-300",
}: {
  children: React.ReactNode;
  size?: number;
  height?: number;
  colorClass?: string;
}) {
  return (
    <span
      className={cn("font-mongolian inline-block", colorClass)}
      style={{
        writingMode: "vertical-lr",
        textOrientation: "mixed",
        fontSize: size,
        height,
        lineHeight: 1.1,
      }}>
      {children}
    </span>
  );
}

export function GamesPage() {
  const [active, setActive] = useState<GameId | null>(null);

  if (active === "match") return <MatchGame onBack={() => setActive(null)} />;
  if (active === "speed") return <SpeedGame onBack={() => setActive(null)} />;
  if (active === "memory") return <MemoryGame onBack={() => setActive(null)} />;
  if (active === "sort") return <SortGame onBack={() => setActive(null)} />;
  if (active === "balloon")
    return <BalloonGame onBack={() => setActive(null)} />;
  if (active === "fillblank")
    return <FillBlankGame onBack={() => setActive(null)} />;

  return (
    <div className="min-h-screen bg-paper">
      <PageHero
        eyebrow="Бататгал"
        title="Тоглоом"
        variant="dark"
        description="Монгол бичгийн үсэг, авиа, үг, өгүүлбэрийг тоглоомын аргаар давтах хэсэг."
        mongolText="ᠲᠣᠭᠯᠣᠭᠠᠮ"
      />

      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
        <div className="bg-white border border-paper-100 rounded-3xl p-5 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-[11px] font-extrabold text-ink-muted uppercase tracking-[2px] mb-1">
                Дасгалын тоглоомууд
              </p>
              <h2 className="text-[22px] font-black text-ink">
                Монгол бичгээ тоглоомоор бататгаарай
              </h2>
              <p className="text-[13px] text-ink-muted font-semibold mt-2 max-w-[720px] leading-relaxed">
                Доорх тоглоомууд нь үсэг таних, авиа ялгах, ижил дүрс тогтоох,
                өгүүлбэр эвлүүлэх, хоосон зай нөхөх зэрэг чадварыг хөгжүүлнэ.
              </p>
            </div>

            <div className="bg-sky-50 border border-sky-100 rounded-2xl px-4 py-3 shrink-0">
              <p className="text-[11px] font-extrabold text-sky-300">
                Нийт {GAMES.length} тоглоом
              </p>
              <p className="text-[11px] font-semibold text-sky-300/70 mt-1">
                Дуусгаад дараагийн шат руу орно
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {GAMES.map((g, i) => (
            <button
              key={g.id}
              onClick={() => setActive(g.id)}
              className="group bg-white rounded-3xl p-6 text-left hover:-translate-y-2 hover:shadow-[0_12px_40px_rgba(26,26,46,.12)] transition-all duration-300 reveal reveal-scale border border-paper-100"
              style={{ transitionDelay: `${i * 0.06}s` }}>
              <div className="flex items-start justify-between mb-5">
                <div
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:-translate-y-0.5",
                    g.accentBg,
                  )}>
                  <g.Icon size={22} color={g.color} strokeWidth={1.8} />
                </div>

                <span
                  className={cn(
                    "text-[9px] font-extrabold px-2 py-0.5 rounded-lg border shrink-0 mt-0.5",
                    DIFF_COLOR[g.difficulty],
                  )}>
                  {g.difficulty}
                </span>
              </div>

              <h3
                className="text-[17px] font-black leading-tight mb-2"
                style={{ color: g.color }}>
                {g.name}
              </h3>

              <p className="text-[11px] font-extrabold text-ink-muted uppercase tracking-[1.5px] mb-2">
                {g.skill}
              </p>

              <p className="text-[12px] text-ink-muted font-semibold leading-[1.7] mb-4 min-h-[62px]">
                {g.desc}
              </p>

              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold bg-grass-50 text-grass-300 border border-grass-100 px-2.5 py-1 rounded-xl">
                  {g.xp}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function GameShell({
  title,
  subtitle,
  onBack,
  score,
  round,
  totalRounds,
  accentColor = "#1a6bbd",
  children,
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
  score?: number;
  round?: number;
  totalRounds?: number;
  accentColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-paper">
      <div className="sticky top-16 z-40 bg-white border-b border-paper-100 px-6 py-3 flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[13px] font-bold text-ink-muted hover:text-ink transition-colors">
          <IconArrowL size={16} strokeWidth={2} />
          Буцах
        </button>

        <div className="flex-1 text-center">
          <p className="text-[15px] font-black text-ink">{title}</p>
          {subtitle && (
            <p className="text-[11px] text-ink-muted font-semibold">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {score !== undefined && (
            <div className="flex items-center gap-1.5 bg-sky-50 border border-sky-100 px-3 py-1.5 rounded-xl">
              <IconBarChart size={13} color="#1a6bbd" strokeWidth={2} />
              <span className="text-[13px] font-extrabold text-sky-300">
                {score}
              </span>
            </div>
          )}

          {round !== undefined && totalRounds !== undefined && (
            <div className="text-[12px] font-extrabold text-ink-muted">
              {round} / {totalRounds}
            </div>
          )}
        </div>
      </div>

      {round !== undefined && totalRounds !== undefined && (
        <div className="h-1 bg-paper-100">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${(round / totalRounds) * 100}%`,
              background: accentColor,
            }}
          />
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">{children}</div>
    </div>
  );
}

interface GameProps {
  onBack: () => void;
}

interface MatchCard {
  id: string;
  val: string;
  pairId: string;
  isMg: boolean;
}

function MatchGame({ onBack }: GameProps) {
  const { addXp } = useAppStore();
  const [round, setRound] = useState(1);
  const [cards, setCards] = useState<MatchCard[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [complete, setComplete] = useState(false);

  function buildRound(r: number) {
    const pool = shuffle(
      LETTERS.map((letter, index) => ({ letter, index })),
    ).slice(0, 6 + Math.min(r - 1, 3));

    const cs: MatchCard[] = [];
    pool.forEach(({ letter, index }) => {
      cs.push({
        id: `${index}_mg`,
        val: letter.mg,
        pairId: `${index}_sound`,
        isMg: true,
      });
      cs.push({
        id: `${index}_sound`,
        val: getDisplaySound(letter.r),
        pairId: `${index}_mg`,
        isMg: false,
      });
    });

    setCards(shuffle(cs));
    setSelected(null);
    setMatched(new Set());
    setWrong(new Set());
    setComplete(false);
  }

  useEffect(() => {
    buildRound(1);
  }, []);

  function tap(card: MatchCard) {
    if (matched.has(card.id) || wrong.has(card.id)) return;
    if (selected === card.id) {
      setSelected(null);
      return;
    }
    if (!selected) {
      setSelected(card.id);
      return;
    }

    const selCard = cards.find((c) => c.id === selected)!;
    if (selCard.pairId === card.id && card.pairId === selCard.id) {
      const next = new Set([...Array.from(matched), card.id, selCard.id]);
      setMatched(next);
      setScore((s) => s + 1);
      addXp(10);
      if (next.size === cards.length) setTimeout(() => setComplete(true), 400);
    } else {
      setWrong(new Set([card.id, selCard.id]));
      setErrors((e) => e + 1);
      setTimeout(() => setWrong(new Set()), 700);
    }
    setSelected(null);
  }

  function nextRound() {
    const r = round + 1;
    setRound(r);
    buildRound(r);
    setScore(0);
    setErrors(0);
  }

  if (complete)
    return (
      <GameShell title="Үсэг тааруулах" onBack={onBack} accentColor="#1a6bbd">
        <ResultScreen
          score={score}
          max={cards.length / 2}
          message={
            errors === 0
              ? "Алдаагүй гүйцэтгэлээ!"
              : `${errors} алдаатай гүйцэтгэлээ`
          }
          xp={score * 10}
          onNext={nextRound}
          onBack={onBack}
          nextLabel="Дараагийн шат"
        />
      </GameShell>
    );

  const cols = cards.length <= 12 ? 4 : 6;

  return (
    <GameShell
      title="Үсэг тааруулах"
      subtitle="Монгол бичгийн үсгийг кирилл авиатай нь тааруул"
      onBack={onBack}
      score={score * 10}
      round={round}
      totalRounds={5}
      accentColor="#1a6bbd">
      <div
        className={cn(
          "grid gap-2.5 mb-4 max-w-[760px] mx-auto",
          cols === 4 ? "grid-cols-4" : "grid-cols-6",
        )}>
        {cards.map((card) => {
          const isMatched = matched.has(card.id);
          const isSelected = selected === card.id;
          const isWrong = wrong.has(card.id);
          return (
            <button
              key={card.id}
              onClick={() => tap(card)}
              disabled={isMatched}
              className={cn(
                "aspect-[3/4] rounded-2xl border-2 flex items-center justify-center p-2 transition-all duration-200 font-bold relative",
                isMatched &&
                  "border-grass-200 bg-grass-50 opacity-60 scale-95 cursor-default",
                isSelected &&
                  "border-sky-300 bg-sky-50 scale-105 shadow-[0_4px_16px_rgba(26,107,189,.2)]",
                isWrong && "border-ember-300 bg-ember-50 animate-wobble",
                !isMatched &&
                  !isSelected &&
                  !isWrong &&
                  "border-paper-100 bg-white hover:border-sky-200 hover:bg-sky-50 hover:scale-105 hover:shadow-soft",
              )}>
              {card.isMg ? (
                <MongolText size={24} height={34}>
                  {card.val}
                </MongolText>
              ) : (
                <span className="text-[18px] font-extrabold text-ink">
                  {card.val}
                </span>
              )}
              {isMatched && (
                <span className="absolute top-1 right-1">
                  <IconCheck size={10} color="#2a9a52" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-[12px] font-semibold text-ink-muted max-w-[760px] mx-auto">
        <span>
          {matched.size / 2} / {cards.length / 2} хос тааруулсан
        </span>
        <span className="text-ember-300">{errors} алдаа</span>
      </div>
    </GameShell>
  );
}

function SpeedGame({ onBack }: GameProps) {
  const { addXp } = useAppStore();
  const [target, setTarget] = useState<Letter>(LETTERS[0]);
  const [opts, setOpts] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [round, setRound] = useState(0);
  const [timeLeft, setTimeLeft] = useState(100);
  const [optState, setOptState] = useState<Record<string, "ok" | "bad">>({});
  const [gameOver, setGameOver] = useState(false);
  const [lives, setLives] = useState(3);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const TOTAL = 15;

  function nextQ(r: number) {
    if (r >= TOTAL) {
      setGameOver(true);
      return;
    }

    const t = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    const answer = getDisplaySound(t.r);

    setTarget(t);

    const os = [answer];
    while (os.length < 4) {
      const c = getDisplaySound(
        LETTERS[Math.floor(Math.random() * LETTERS.length)].r,
      );
      if (!os.includes(c)) os.push(c);
    }

    setOpts(shuffle(os));
    setOptState({});

    const speed = Math.max(40, 90 - streak * 5);
    setTimeLeft(100);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setStreak(0);
          setLives((l) => {
            const nl = l - 1;
            if (nl <= 0) setTimeout(() => setGameOver(true), 300);
            else setTimeout(() => nextQ(r + 1), 500);
            return nl;
          });
          return 0;
        }
        return t - 1;
      });
    }, speed);
    setRound(r);
  }

  useEffect(() => {
    nextQ(0);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function answer(opt: string) {
    if (timerRef.current) clearInterval(timerRef.current);

    const correct = getDisplaySound(target.r);
    const ok = opt === correct;

    setOptState({
      [opt]: ok ? "ok" : "bad",
      ...(ok ? {} : { [correct]: "ok" }),
    });

    if (ok) {
      const bonus = streak >= 3 ? 15 : 10;
      setScore((s) => s + bonus);
      setStreak((s) => s + 1);
      addXp(bonus);
    } else {
      setStreak(0);
      setLives((l) => l - 1);
    }

    setTimeout(() => nextQ(round + 1), 800);
  }

  const timerColor =
    timeLeft > 60 ? "#2a9a52" : timeLeft > 30 ? "#c97b2a" : "#c83030";

  if (gameOver)
    return (
      <GameShell title="Хурдан таних" onBack={onBack} accentColor="#2a9a52">
        <ResultScreen
          score={score}
          max={TOTAL * 15}
          message="Хурдан таних дасгал дууслаа!"
          xp={score}
          onNext={() => {
            setScore(0);
            setStreak(0);
            setLives(3);
            setGameOver(false);
            nextQ(0);
          }}
          onBack={onBack}
          nextLabel="Дахин эхлэх"
        />
      </GameShell>
    );

  return (
    <GameShell
      title="Хурдан таних"
      subtitle={
        streak >= 3
          ? `${streak}× дараалсан зөв — +15 XP!`
          : "Монгол бичгийн үсгийн зөв авиаг сонго"
      }
      onBack={onBack}
      score={score}
      round={round + 1}
      totalRounds={TOTAL}
      accentColor="#2a9a52">
      <div className="max-w-[720px] mx-auto">
        <div className="flex justify-center gap-2 mb-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "w-3 h-3 rounded-full transition-all",
                i <= lives ? "bg-ember-300" : "bg-paper-100",
              )}
            />
          ))}
        </div>

        <div className="h-3 bg-paper-100 rounded-full overflow-hidden mb-6">
          <div
            className="h-full rounded-full transition-all duration-[50ms]"
            style={{ width: `${timeLeft}%`, background: timerColor }}
          />
        </div>

        {streak >= 2 && (
          <div className="flex justify-center mb-3">
            <span className="text-[11px] font-extrabold bg-sand-50 border border-sand-100 text-sand-300 px-3 py-1 rounded-xl">
              {streak}× дараалсан зөв
            </span>
          </div>
        )}

        <div className="flex justify-center mb-8">
          <div className="bg-white border-2 border-paper-100 rounded-3xl p-8 shadow-soft">
            <MongolText size={64} height={86}>
              {target.mg}
            </MongolText>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {opts.map((opt) => (
            <button
              key={opt}
              onClick={() => answer(opt)}
              disabled={Object.keys(optState).length > 0}
              className={cn(
                "py-4 rounded-2xl border-2 text-[20px] font-extrabold transition-all duration-200",
                optState[opt] === "ok" &&
                  "border-grass-300 bg-grass-50 text-grass-300 scale-105",
                optState[opt] === "bad" &&
                  "border-ember-300 bg-ember-50 text-ember-300 animate-wobble",
                !optState[opt] &&
                  "border-paper-100 bg-white hover:border-sky-200 hover:bg-sky-50 hover:scale-105",
              )}>
              {opt}
            </button>
          ))}
        </div>
      </div>
    </GameShell>
  );
}

interface MemCard {
  id: string;
  letter: Letter;
  flipped: boolean;
  matched: boolean;
}

function MemoryGame({ onBack }: GameProps) {
  const { addXp } = useAppStore();
  const GRID = 4;
  const [cards, setCards] = useState<MemCard[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [complete, setComplete] = useState(false);
  const lockRef = useRef(false);

  function build() {
    const pool = shuffle(LETTERS).slice(0, (GRID * GRID) / 2);
    const doubled = shuffle(
      [...pool, ...pool].map((l, i) => ({
        id: `${l.mg}-${i}`,
        letter: l,
        flipped: false,
        matched: false,
      })),
    );
    setCards(doubled);
    setSelected([]);
    setScore(0);
    setMoves(0);
    setComplete(false);
    lockRef.current = false;
  }

  useEffect(() => {
    build();
  }, []);

  function flip(id: string) {
    if (lockRef.current) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.flipped || card.matched) return;

    const next = cards.map((c) => (c.id === id ? { ...c, flipped: true } : c));
    setCards(next);
    const newSel = [...selected, id];

    if (newSel.length === 2) {
      lockRef.current = true;
      setMoves((m) => m + 1);
      const [a, b] = newSel.map((sid) => next.find((c) => c.id === sid)!);
      if (a.letter.mg === b.letter.mg) {
        setTimeout(() => {
          const done = next.map((c) =>
            newSel.includes(c.id) ? { ...c, matched: true } : c,
          );
          setCards(done);
          setScore((s) => s + 1);
          addXp(15);
          setSelected([]);
          lockRef.current = false;
          if (done.every((c) => c.matched))
            setTimeout(() => setComplete(true), 300);
        }, 400);
      } else {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              newSel.includes(c.id) ? { ...c, flipped: false } : c,
            ),
          );
          setSelected([]);
          lockRef.current = false;
        }, 900);
      }
      setSelected(newSel);
    } else {
      setSelected(newSel);
    }
  }

  if (complete)
    return (
      <GameShell title="Ижил үсэг олох" onBack={onBack} accentColor="#c97b2a">
        <ResultScreen
          score={score * 15}
          max={((GRID * GRID) / 2) * 15}
          message={`${moves} хөдөлгөөнд дуусгав`}
          xp={score * 15}
          onNext={build}
          onBack={onBack}
          nextLabel="Дараагийн шат"
        />
      </GameShell>
    );

  return (
    <GameShell
      title="Ижил үсэг олох"
      subtitle="Ижил монгол бичгийн үсгүүдийг ол"
      onBack={onBack}
      score={score * 15}
      round={score}
      totalRounds={(GRID * GRID) / 2}
      accentColor="#c97b2a">
      <div className="max-w-[620px] mx-auto">
        <div className="flex justify-between text-[12px] font-bold text-ink-muted mb-4">
          <span>
            {score} / {(GRID * GRID) / 2} хос
          </span>
          <span>{moves} хөдөлгөөн</span>
        </div>

        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${GRID}, 1fr)` }}>
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => flip(card.id)}
              disabled={card.matched}
              className={cn(
                "aspect-square rounded-xl border-2 flex items-center justify-center transition-all duration-300",
                card.matched &&
                  "border-grass-100 bg-grass-50 opacity-50 cursor-default",
                card.flipped && !card.matched && "border-sand-200 bg-sand-50",
                !card.flipped &&
                  !card.matched &&
                  "border-paper-100 bg-white hover:border-sky-200 hover:bg-sky-50 cursor-pointer",
              )}>
              {card.flipped || card.matched ? (
                <MongolText size={24} height={34}>
                  {card.letter.mg}
                </MongolText>
              ) : (
                <div className="w-5 h-5 rounded-full bg-paper-100" />
              )}
            </button>
          ))}
        </div>
      </div>
    </GameShell>
  );
}

function SortGame({ onBack }: GameProps) {
  const { addXp } = useAppStore();
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState<string[]>([]);
  const [checked, setChecked] = useState<null | "ok" | "bad">(null);
  const [score, setScore] = useState(0);

  const sent = SORT_TASKS[idx % SORT_TASKS.length];
  const [pool, setPool] = useState<string[]>(() => shuffle(sent.p));

  function reset(i: number) {
    const s = SORT_TASKS[i % SORT_TASKS.length];
    setPool(shuffle(s.p));
    setAnswer([]);
    setChecked(null);
  }

  useEffect(() => {
    reset(idx);
  }, [idx]);

  function addWord(w: string) {
    if (checked) return;
    setPool((p) => p.filter((x) => x !== w));
    setAnswer((a) => [...a, w]);
  }

  function removeWord(w: string) {
    if (checked) return;
    setAnswer((a) => a.filter((x) => x !== w));
    setPool((p) => [...p, w]);
  }

  function check() {
    const ok = JSON.stringify(answer) === JSON.stringify(sent.a);
    setChecked(ok ? "ok" : "bad");
    if (ok) {
      setScore((s) => s + 1);
      addXp(20);
    }
  }

  function next() {
    setIdx((i) => i + 1);
  }

  const Word = ({ w, from }: { w: string; from: "pool" | "answer" }) => (
    <button
      onClick={() => (from === "pool" ? addWord(w) : removeWord(w))}
      className={cn(
        "border-2 rounded-xl px-4 py-3 transition-all font-semibold min-w-[120px] min-h-[86px] flex items-center justify-center",
        checked === "ok" && from === "answer" && "border-grass-200 bg-grass-50",
        checked === "bad" &&
          from === "answer" &&
          "border-ember-200 bg-ember-50",
        !checked &&
          from === "pool" &&
          "border-paper-100 bg-white hover:border-sky-200 hover:bg-sky-50 hover:scale-105",
        !checked &&
          from === "answer" &&
          "border-sky-200 bg-sky-50 hover:border-ember-200 hover:bg-ember-50",
      )}>
      <MongolText size={24} height={54}>
        {w}
      </MongolText>
    </button>
  );

  return (
    <GameShell
      title="Өгүүлбэр эвлүүлэх"
      subtitle="Монгол бичгийн үгсийг зөв дарааллаар байрлуул"
      onBack={onBack}
      score={score * 20}
      round={idx + 1}
      totalRounds={SORT_TASKS.length}
      accentColor="#c83030">
      <div className="max-w-[900px] mx-auto">
        <div className="bg-paper-50 border border-paper-100 rounded-2xl px-4 py-3 mb-6 text-center">
          <p className="text-[11px] font-extrabold text-ink-muted uppercase tracking-wide mb-1">
            Утга
          </p>
          <p className="text-[14px] font-bold text-ink">{sent.tr}</p>
        </div>

        <div
          className={cn(
            "min-h-[132px] border-2 rounded-2xl p-4 flex flex-wrap gap-3 justify-center items-center mb-3 transition-colors",
            checked === "ok" && "border-grass-300 bg-grass-50",
            checked === "bad" && "border-ember-300 bg-ember-50",
            !checked && "border-dashed border-sky-200 bg-sky-50/50",
          )}>
          {answer.length === 0 ? (
            <p className="text-[13px] text-ink-muted font-semibold">
              Доороос үгсийг дарааллаар нь сонгоно уу
            </p>
          ) : (
            answer.map((w, i) => <Word key={`${w}-${i}`} w={w} from="answer" />)
          )}
        </div>

        {checked && (
          <div
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl mb-3 text-[13px] font-bold",
              checked === "ok"
                ? "bg-grass-50 text-grass-300"
                : "bg-ember-50 text-ember-300",
            )}>
            {checked === "ok" ? (
              <IconCheck size={16} strokeWidth={2.5} />
            ) : (
              <IconX size={16} strokeWidth={2.5} />
            )}
            {checked === "ok" ? "Зөв! +20 XP" : "Буруу — дахин оролдоно уу"}
          </div>
        )}

        <div className="border-2 border-dashed border-paper-100 rounded-2xl p-4 flex flex-wrap gap-3 justify-center min-h-[112px] mb-5">
          {pool.map((w, i) => (
            <Word key={`${w}-${i}`} w={w} from="pool" />
          ))}
        </div>

        <div className="flex gap-3">
          {!checked ? (
            <>
              <button
                onClick={() => reset(idx)}
                className="flex items-center gap-1.5 bg-white border border-paper-100 text-ink-muted font-bold text-[13px] px-4 py-2.5 rounded-xl hover:bg-paper-50 transition-all">
                <IconRefresh size={14} strokeWidth={2} /> Цэвэрлэх
              </button>
              <button
                onClick={check}
                disabled={answer.length !== sent.a.length}
                className={cn(
                  "flex-1 font-extrabold text-[14px] rounded-xl py-2.5 transition-all",
                  answer.length === sent.a.length
                    ? "bg-ember-300 text-white hover:bg-ember-200"
                    : "bg-paper-100 text-ink-muted cursor-not-allowed",
                )}>
                Шалгах
              </button>
            </>
          ) : (
            <button
              onClick={next}
              className="flex-1 bg-sky-300 text-white font-extrabold text-[14px] rounded-xl py-3 hover:bg-sky-200 transition-all">
              Дараагийн шат
            </button>
          )}
        </div>
      </div>
    </GameShell>
  );
}

interface Balloon {
  id: number;
  text: string;
  correct: boolean;
  left: number;
  dur: number;
  color: string;
  size: number;
}

function BalloonGame({ onBack }: GameProps) {
  const { addXp } = useAppStore();
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [qIdx, setQIdx] = useState(0);
  const [popped, setPopped] = useState<Set<number>>(new Set());
  const [gameOver, setGameOver] = useState(false);
  const [round, setRound] = useState(1);
  const idRef = useRef(0);
  const TOTAL = 12;

  const spawnRound = useCallback((qi: number) => {
    const q = BALLOON_QUESTIONS[qi % BALLOON_QUESTIONS.length];
    const cnt = Math.min(3 + Math.floor(qi / 3), 6);
    const items = shuffle([q.correct, ...q.wrong]).slice(0, cnt);
    const bs: Balloon[] = items.map((text, i) => ({
      id: ++idRef.current,
      text,
      correct: text === q.correct,
      left: 8 + (i / cnt) * 82,
      dur: Math.max(2.5, 4 - qi * 0.1),
      color: BALLOON_COLORS[i % BALLOON_COLORS.length],
      size: 52 + Math.random() * 16,
    }));
    setBalloons(bs);
    setPopped(new Set());
  }, []);

  useEffect(() => {
    spawnRound(0);
  }, []);

  function pop(b: Balloon) {
    if (popped.has(b.id) || gameOver) return;
    setPopped((p) => new Set([...Array.from(p), b.id]));
    if (b.correct) {
      setScore((s) => s + 10);
      addXp(10);
      setTimeout(() => {
        if (qIdx + 1 >= TOTAL) {
          setGameOver(true);
          return;
        }
        const ni = qIdx + 1;
        setQIdx(ni);
        setRound((r) => r + 1);
        spawnRound(ni);
      }, 500);
    } else {
      setLives((l) => {
        const nl = l - 1;
        if (nl <= 0) setTimeout(() => setGameOver(true), 300);
        return nl;
      });
    }
  }

  const prompt = BALLOON_QUESTIONS[qIdx % BALLOON_QUESTIONS.length].q;

  if (gameOver)
    return (
      <GameShell title="Зөв үгийг сонгох" onBack={onBack} accentColor="#7c5cbf">
        <ResultScreen
          score={score}
          max={TOTAL * 10}
          message="Тоглоом дууслаа"
          xp={score}
          onNext={() => {
            setScore(0);
            setLives(3);
            setQIdx(0);
            setRound(1);
            setGameOver(false);
            spawnRound(0);
          }}
          onBack={onBack}
          nextLabel="Дараагийн шат"
        />
      </GameShell>
    );

  return (
    <GameShell
      title="Зөв үгийг сонгох"
      subtitle={prompt}
      onBack={onBack}
      score={score}
      round={round}
      totalRounds={TOTAL}
      accentColor="#7c5cbf">
      <div className="max-w-[820px] mx-auto">
        <div className="flex justify-center gap-2 mb-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "w-3 h-3 rounded-full transition-all",
                i <= lives ? "bg-ember-300" : "bg-paper-100",
              )}
            />
          ))}
        </div>

        <div className="bg-white border border-paper-100 rounded-2xl px-5 py-3.5 mb-4 text-center">
          <p className="text-[13px] font-extrabold text-ink-muted uppercase tracking-wide mb-1">
            Асуулт
          </p>
          <p className="text-[15px] font-black text-ink">{prompt}</p>
        </div>

        <div
          className="relative rounded-2xl overflow-hidden mb-4"
          style={{
            height: 280,
            background: "linear-gradient(180deg,#d4eaff 0%,#f5f0e8 100%)",
          }}>
          {balloons.map(
            (b) =>
              !popped.has(b.id) && (
                <button
                  key={b.id}
                  onClick={() => pop(b)}
                  className="absolute balloon-rise flex flex-col items-center group"
                  style={{
                    left: `${b.left}%`,
                    animationDuration: `${b.dur}s`,
                    bottom: -100,
                  }}>
                  <div
                    className="flex items-center justify-center rounded-[50%_50%_50%_50%/60%_60%_40%_40%] shadow-[0_4px_16px_rgba(0,0,0,.15)] transition-transform group-hover:scale-110 group-active:scale-90"
                    style={{
                      width: b.size,
                      height: b.size * 1.2,
                      background: b.color,
                    }}>
                    <MongolText
                      size={15}
                      height={28}
                      colorClass="text-white font-bold">
                      {b.text}
                    </MongolText>
                  </div>
                  <div
                    className="w-px h-8 opacity-40"
                    style={{ background: b.color }}
                  />
                </button>
              ),
          )}
          {balloons.every((b) => popped.has(b.id)) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-[13px] font-bold text-ink-muted">
                Дараагийн асуулт...
              </p>
            </div>
          )}
        </div>
      </div>
    </GameShell>
  );
}

function FillBlankGame({ onBack }: GameProps) {
  const { addXp } = useAppStore();
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const TOTAL = FILL_TASKS.length;

  const q = FILL_TASKS[idx];

  function answer(i: number) {
    if (chosen !== null) return;
    setChosen(i);
    if (i === q.c) {
      setScore((s) => s + 15);
      addXp(15);
    }
    setTimeout(() => {
      if (idx + 1 >= TOTAL) setDone(true);
      else {
        setIdx((i) => i + 1);
        setChosen(null);
        setShowHint(false);
      }
    }, 1100);
  }

  if (done)
    return (
      <GameShell title="Хоосон зай нөхөх" onBack={onBack} accentColor="#1a9e8a">
        <ResultScreen
          score={score}
          max={TOTAL * 15}
          message="Бүх даалгавар дууслаа!"
          xp={score}
          onNext={() => {
            setIdx(0);
            setScore(0);
            setChosen(null);
            setDone(false);
            setShowHint(false);
          }}
          onBack={onBack}
          nextLabel="Дараагийн шат"
        />
      </GameShell>
    );

  return (
    <GameShell
      title="Хоосон зай нөхөх"
      subtitle="Өгүүлбэрийн утгад тохирох үгийг сонго"
      onBack={onBack}
      score={score}
      round={idx + 1}
      totalRounds={TOTAL}
      accentColor="#1a9e8a">
      <div className="max-w-[900px] mx-auto">
        <div className="bg-white border-2 border-paper-100 rounded-2xl p-6 mb-2 flex items-center justify-center gap-5 flex-wrap min-h-[130px]">
          {q.before && (
            <MongolText size={26} height={58}>
              {q.before}
            </MongolText>
          )}

          <div
            className={cn(
              "min-w-[90px] h-14 border-b-[4px] flex items-end justify-center pb-1 transition-colors px-3",
              chosen === null
                ? "border-[#1a9e8a]"
                : chosen === q.c
                  ? "border-grass-300"
                  : "border-ember-300",
            )}>
            {chosen !== null && (
              <MongolText
                size={24}
                height={52}
                colorClass={
                  chosen === q.c ? "text-grass-300" : "text-ember-300"
                }>
                {q.choices[q.c]}
              </MongolText>
            )}
          </div>

          {q.after && (
            <MongolText size={26} height={58}>
              {q.after}
            </MongolText>
          )}
        </div>

        <div className="flex items-center justify-between px-1 mb-5">
          <p className="text-[12px] text-ink-muted font-semibold">{q.tr}</p>
          <button
            onClick={() => setShowHint((v) => !v)}
            className="text-[11px] font-bold text-[#1a9e8a] hover:underline">
            {showHint ? "Нуух" : "Зөвлөгөө"}
          </button>
        </div>

        {showHint && (
          <div className="bg-[#e8faf7] border border-[#1a9e8a]/20 rounded-xl px-4 py-2.5 mb-4 text-[12px] font-semibold text-[#1a9e8a]">
            Зөвлөгөө: Кирилл утгыг уншаад, өгүүлбэрт тохирох монгол бичгийн
            үгийг сонгоно.
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          {q.choices.map((c, i) => (
            <button
              key={i}
              onClick={() => answer(i)}
              disabled={chosen !== null}
              className={cn(
                "py-4 rounded-2xl border-2 flex items-center justify-center min-h-[112px] transition-all",
                chosen === null &&
                  "border-paper-100 bg-white hover:border-[#1a9e8a]/40 hover:bg-[#e8faf7] hover:scale-105",
                chosen !== null &&
                  i === q.c &&
                  "border-grass-300 bg-grass-50 scale-105",
                chosen !== null &&
                  i === chosen &&
                  i !== q.c &&
                  "border-ember-300 bg-ember-50",
                chosen !== null && i !== q.c && i !== chosen && "opacity-40",
              )}>
              <MongolText size={24} height={58}>
                {c}
              </MongolText>
            </button>
          ))}
        </div>
      </div>
    </GameShell>
  );
}

function ResultScreen({
  score,
  max,
  message,
  xp,
  onNext,
  onBack,
  nextLabel,
}: {
  score: number;
  max: number;
  message: string;
  xp: number;
  onNext: () => void;
  onBack: () => void;
  nextLabel: string;
}) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  const { userId, setXp } = useAppStore();
  const [savedXp, setSavedXp] = useState(false);

  useEffect(() => {
    if (!userId || xp <= 0 || savedXp) return;

    async function saveGameXp() {
      try {
        const res = await fetch("/api/game-attempts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            xp,
          }),
        });

        if (res.ok) {
          const data = await res.json();

          if (typeof data?.totalXp === "number") {
            setXp(data.totalXp);
          }
        }
      } catch (error) {
        console.error("Game XP save error:", error);
      } finally {
        setSavedXp(true);
      }
    }

    saveGameXp();
  }, [userId, xp, savedXp, setXp]);

  const grade =
    pct >= 85
      ? { label: "Маш сайн", color: "#2a9a52" }
      : pct >= 60
        ? { label: "Сайн", color: "#c97b2a" }
        : { label: "Дахин давт", color: "#c83030" };

  return (
    <div className="text-center py-4 max-w-[760px] mx-auto">
      <div
        className="w-20 h-20 rounded-full border-4 flex items-center justify-center mx-auto mb-4"
        style={{ borderColor: grade.color, background: grade.color + "15" }}>
        <span className="text-[28px] font-black" style={{ color: grade.color }}>
          {pct}%
        </span>
      </div>

      <h2
        className="text-[24px] font-black mb-1"
        style={{ color: grade.color }}>
        {grade.label}
      </h2>

      <p className="text-[14px] text-ink-muted font-semibold mb-6">{message}</p>

      <div className="grid grid-cols-3 gap-3 mb-7">
        {[
          { label: "Оноо", value: score, color: "text-sky-300" },
          { label: "XP", value: `+${xp}`, color: "text-grass-300" },
          { label: "Үнэлгээ", value: `${pct}%`, color: "text-sand-300" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white border border-paper-100 rounded-2xl p-4">
            <p className={`text-[22px] font-black ${s.color}`}>{s.value}</p>
            <p className="text-[11px] font-bold text-ink-muted mt-0.5">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 justify-center">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 bg-white border border-paper-100 font-bold text-[14px] px-5 py-3 rounded-2xl hover:bg-paper-50 transition-all text-ink-muted">
          <IconArrowL size={15} strokeWidth={2} /> Тоглоомууд
        </button>

        <button
          onClick={onNext}
          className="bg-sky-300 text-white font-extrabold text-[14px] px-8 py-3 rounded-2xl hover:bg-sky-200 transition-all shadow-[0_4px_16px_rgba(26,107,189,.25)]">
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
