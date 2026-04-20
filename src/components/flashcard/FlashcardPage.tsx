"use client";

import { MongolianText } from "@/components/ui/MongolianText";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { showToast } from "@/components/ui/Toast";
import { LETTERS } from "@/lib/data";
import { useAppStore } from "@/lib/store";
import { shuffle } from "@/lib/utils";
import type { Letter } from "@/types";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

type FlashSet = "all" | "vowels" | "consonants";
type Rating = "known" | "unknown" | null;

function buildSet(type: FlashSet): Letter[] {
  if (type === "vowels") return LETTERS.filter((l) => l.t === "vowel");
  if (type === "consonants") return LETTERS.filter((l) => l.t === "consonant");
  return [...LETTERS];
}

export function FlashcardPage() {
  const router = useRouter();
  const { goTo, markLetterLearned } = useAppStore();

  const [setType, setSetType] = useState<FlashSet>("all");
  const [cards, setCards] = useState<Letter[]>(() => buildSet("all"));
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<Rating[]>(() =>
    new Array(LETTERS.length).fill(null),
  );

  const card = cards[idx];
  const progress = Math.round((idx / cards.length) * 100);

  function changeSet(type: FlashSet) {
    setSetType(type);
    const newCards = buildSet(type);
    setCards(newCards);
    setIdx(0);
    setFlipped(false);
    setResults(new Array(newCards.length).fill(null));
  }

  function flipCard() {
    setFlipped((f) => !f);
  }

  const advance = useCallback(() => {
    setFlipped(false);
    setTimeout(() => {
      if (idx < cards.length - 1) setIdx((i) => i + 1);
      else {
        showToast("Бүгдийг нэг удаа харлаа!", "ok");
        setIdx(0);
      }
    }, 50);
  }, [idx, cards.length]);

  function rate(knew: boolean) {
    const globalIdx = LETTERS.indexOf(card);
    const newResults = [...results];
    newResults[idx] = knew ? "known" : "unknown";
    setResults(newResults);

    if (knew && globalIdx >= 0) markLetterLearned(globalIdx);

    showToast(knew ? "Мэдлээ!" : "Дахин давтана", knew ? "ok" : "bad");

    setTimeout(() => {
      if (idx < cards.length - 1) {
        setIdx((i) => i + 1);
        setFlipped(false);
      } else {
        const okCount = newResults.filter((r) => r === "known").length;
        showToast(`Дууслаа! ${okCount}/${cards.length} мэдлээ`, "ok");
        setIdx(0);
        setFlipped(false);
      }
    }, 600);
  }

  function doShuffle() {
    setCards((c) => shuffle(c));
    setIdx(0);
    setFlipped(false);
    setResults(new Array(cards.length).fill(null));
    showToast("Холилоо!", "info");
  }

  const setTypes: { t: FlashSet; label: string }[] = [
    { t: "all", label: "Бүгд" },
    { t: "vowels", label: "Эгшиг" },
    { t: "consonants", label: "Гийгүүлэгч" },
  ];

  return (
    <div className="max-w-[540px] mx-auto px-6 py-9 text-center">
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => {
            goTo("home");
            router.push("/");
          }}
          className="bg-white border-2 border-paper-100 text-ink text-[13px] font-bold px-3.5 py-1.5 rounded-xl hover:border-sky-100 hover:bg-sky-50 transition-all">
          Буцах
        </button>

        <p className="text-[20px] font-black">Цээжлэх карт</p>

        <div className="flex gap-1.5">
          {setTypes.map(({ t, label }) => (
            <button
              key={t}
              onClick={() => changeSet(t)}
              className={`text-[12px] font-extrabold px-3 py-1.5 rounded-xl border-2 transition-all ${
                setType === t
                  ? "bg-ink text-white border-ink"
                  : "bg-white border-paper-100 text-ink-muted hover:text-ink"
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <ProgressBar value={progress} className="flex-1" />
        <span className="text-[13px] font-extrabold text-ink-muted whitespace-nowrap">
          {idx + 1} / {cards.length}
        </span>
      </div>

      <div
        className={`flip-scene h-[280px] cursor-pointer mb-5 ${flipped ? "flipped" : ""}`}
        onClick={flipCard}
        style={{ perspective: 1000 }}>
        <div
          className="flip-inner w-full h-full"
          style={{
            transformStyle: "preserve-3d",
            transition: "transform 0.55s cubic-bezier(0.4,0,0.2,1)",
          }}>
          <div
            className="flip-face w-full h-full absolute inset-0 rounded-3xl bg-white border-2 border-paper-100 flex flex-col items-center justify-center gap-3 p-6"
            style={{ backfaceVisibility: "hidden" }}>
            <MongolianText size="2xl" color="#c97b2a">
              {card.mg}
            </MongolianText>
            <p className="text-[12px] font-bold text-ink-muted absolute bottom-4 right-4">
              дарж харна уу
            </p>
          </div>

          <div
            className="flip-face flip-back w-full h-full absolute inset-0 rounded-3xl bg-sky-50 border-2 border-sky-100 flex flex-col items-center justify-center gap-3 p-6"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}>
            <p className="text-[28px] font-black text-sky-300">{card.r}</p>
            <p className="text-[15px] text-ink-muted font-semibold">{card.x}</p>
            <span
              className={`text-[11px] font-extrabold px-3 py-1 rounded-2xl ${
                card.t === "vowel"
                  ? "bg-sky-50 text-sky-300"
                  : "bg-sand-50 text-sand-300"
              }`}>
              {card.t === "vowel" ? "Эгшиг" : "Гийгүүлэгч"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 mb-5">
        <button
          onClick={() => rate(false)}
          title="Дахин давтах"
          className="w-14 h-14 rounded-full bg-white border-2 border-paper-100 text-[22px] hover:border-ember-300 hover:bg-ember-50 transition-all"></button>

        <button
          onClick={advance}
          className="px-6 h-14 rounded-full bg-white border-2 border-sky-100 text-sky-300 font-extrabold text-[14px] hover:bg-sky-50 transition-all">
          Дараагийн
        </button>

        <button
          onClick={() => rate(true)}
          title="Мэдлээ!"
          className="w-14 h-14 rounded-full bg-white border-2 border-paper-100 text-[22px] hover:border-grass-300 hover:bg-grass-50 transition-all"></button>
      </div>

      <div className="flex gap-1.5 justify-center flex-wrap mb-5">
        {cards.map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              i === idx
                ? "bg-sky-300 scale-125"
                : results[i] === "known"
                  ? "bg-grass-300"
                  : results[i] === "unknown"
                    ? "bg-ember-300"
                    : "bg-paper-100"
            }`}
          />
        ))}
      </div>

      <button
        onClick={doShuffle}
        className="bg-white border-2 border-paper-100 text-ink font-bold text-[14px] px-5 py-2.5 rounded-2xl hover:border-sky-100 hover:bg-sky-50 transition-all">
        Холих
      </button>
    </div>
  );
}
