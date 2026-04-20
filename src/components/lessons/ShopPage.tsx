"use client";

import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Mood = "normal" | "happy" | "sad";

const MAX_LIVES = 5;

const MASCOT: Record<Mood, string> = {
  normal: "/mascot/normal.png",
  happy: "/mascot/happy.png",
  sad: "/mascot/sad.png",
};

const SHOP_ITEMS = [
  {
    id: "one_life",
    title: "1 амь авах",
    desc: "Шалгалт дээр алдсан 1 амийг нөхнө.",
    price: 5,
    livesLabel: "+1 амь",
  },
  {
    id: "fill_lives",
    title: "Амь дүүргэх",
    desc: "Амийг 5 хүртэл бүрэн дүүргэнэ.",
    price: 18,
    livesLabel: "5 амь",
  },
];

interface ProfileResponse {
  user?: {
    coins?: number;
    xp?: number;
    lives?: number;
  };
}

export function ShopPage() {
  const router = useRouter();

  const { userId, isLoggedIn, lives, setLives, openAuthModal } = useAppStore();

  const [mood, setMood] = useState<Mood>("normal");
  const [message, setMessage] = useState("Зоосоо ашиглаад амь нөхөж аваарай.");
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [coins, setCoins] = useState(0);
  const [points, setPoints] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [displayLives, setDisplayLives] = useState(lives);

  const canBuyMoreLives = displayLives < MAX_LIVES;

  const mascotText = useMemo(() => {
    if (mood === "happy") return "Амжилттай авлаа!";
    if (mood === "sad") return "Анхааруулга";
    return "Дэлгүүрт тавтай морил!";
  }, [mood]);

  useEffect(() => {
    async function loadBalance() {
      if (!isLoggedIn || !userId) {
        setLoadingBalance(false);
        return;
      }

      try {
        setLoadingBalance(true);

        const res = await fetch(
          `/api/profile?userId=${encodeURIComponent(userId)}`,
          { cache: "no-store" },
        );

        if (!res.ok) return;

        const data: ProfileResponse = await res.json();

        const nextCoins = Number(data?.user?.coins ?? 0);
        const nextPoints = Number(data?.user?.xp ?? 0);
        const nextLives =
          typeof data?.user?.lives === "number" ? data.user.lives : lives;

        setCoins(nextCoins);
        setPoints(nextPoints);
        setDisplayLives(nextLives);
        setLives(nextLives);
      } catch (error) {
        console.error("Shop balance load error:", error);
      } finally {
        setLoadingBalance(false);
      }
    }

    loadBalance();
  }, [isLoggedIn, userId, lives, setLives]);

  async function buyItem(itemId: string) {
    if (!isLoggedIn || !userId) {
      openAuthModal("in");
      return;
    }

    if (!canBuyMoreLives) {
      setMood("sad");
      setMessage("Таны амь аль хэдийн дүүрэн байна.");
      return;
    }

    try {
      setBuyingId(itemId);

      const res = await fetch("/api/shop/buy-life", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          itemId,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setMood("sad");
        setMessage(data?.message || "Худалдан авалт амжилтгүй боллоо.");
        return;
      }

      if (typeof data?.totalCoins === "number") {
        setCoins(data.totalCoins);
      }

      if (typeof data?.totalLives === "number") {
        setDisplayLives(data.totalLives);
        setLives(data.totalLives);
      }

      setMood("happy");

      if (data?.alreadyFull) {
        setMessage("Таны амь аль хэдийн дүүрэн байна.");
      } else {
        setMessage(
          `Амжилттай! ${data?.spentCoins ?? 0} зоос зарцуулж амь нөхлөө.`,
        );
      }
    } catch (error) {
      console.error("Shop buy error:", error);
      setMood("sad");
      setMessage("Сервертэй холбогдоход алдаа гарлаа.");
    } finally {
      setBuyingId(null);
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-6">
        <div className="max-w-[520px] bg-white border-2 border-paper-100 rounded-[32px] p-10 text-center">
          <h1 className="text-[28px] font-black mb-3">Дэлгүүр</h1>

          <p className="text-[14px] text-ink-muted font-semibold leading-relaxed mb-6">
            Зоос ашиглан амь авахын тулд эхлээд нэвтэрнэ үү.
          </p>

          <button
            onClick={() => openAuthModal("in")}
            className="bg-sky-300 text-white font-extrabold text-[14px] px-6 py-3 rounded-2xl hover:bg-sky-200 transition-all">
            Нэвтрэх
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <div className="bg-gradient-to-r from-[#1a1a2e] to-[#1a3a5e] text-white px-6 py-12 mb-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-[11px] font-extrabold text-white/40 uppercase tracking-[4px] mb-2">
            Зоосны дэлгүүр
          </p>

          <h1 className="text-[38px] font-black">Дэлгүүр</h1>

          <p className="text-white/55 font-semibold mt-2 text-[15px] max-w-[620px] leading-relaxed">
            Оноо нь суралцалтын ахиц, түвшинд үлдэнэ. Харин зоосыг амь нөхөхөд
            ашиглана.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-8 pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <aside className="bg-white border-2 border-paper-100 rounded-[32px] p-7 text-center h-fit">
            <div className="relative w-[180px] h-[150px] mx-auto mb-4">
              <Image
                src={MASCOT[mood]}
                alt="mascot"
                fill
                className="object-contain pixelated"
                priority
              />
            </div>

            <h2 className="text-[22px] font-black mb-2">{mascotText}</h2>

            <p className="text-[13px] text-ink-muted font-semibold leading-relaxed min-h-[42px]">
              {message}
            </p>

            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4">
                <p className="text-[22px] font-black text-sky-300">
                  {loadingBalance ? "..." : points}
                </p>
                <p className="text-[11px] font-bold text-sky-300/70">Оноо</p>
              </div>

              <div className="bg-sand-50 border border-sand-100 rounded-2xl p-4">
                <p className="text-[22px] font-black text-sand-300">
                  {loadingBalance ? "..." : coins}
                </p>
                <p className="text-[11px] font-bold text-sand-300/70">Зоос</p>
              </div>

              <div className="bg-ember-50 border border-ember-100 rounded-2xl p-4">
                <p className="text-[22px] font-black text-ember-300">
                  {loadingBalance ? "..." : displayLives}/{MAX_LIVES}
                </p>
                <p className="text-[11px] font-bold text-ember-300/70">Амь</p>
              </div>
            </div>

            <button
              onClick={() => router.push("/profile")}
              className="w-full mt-5 bg-white border-2 border-paper-100 text-ink-muted font-bold text-[13px] px-5 py-3 rounded-2xl hover:bg-paper-50 transition-all">
              Профайл руу буцах
            </button>
          </aside>

          <main>
            <div className="bg-white border-2 border-paper-100 rounded-[32px] p-7 mb-5">
              <h3 className="text-[24px] font-black mb-2">Амь худалдаж авах</h3>

              <p className="text-[13px] text-ink-muted font-semibold leading-relaxed">
                Амь дууссан үед шалгалтаа зогсоохгүйгээр үргэлжлүүлэхийн тулд
                зоосоор амь нөхөж авна. Оноо хасагдахгүй.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
              {SHOP_ITEMS.map((item, index) => {
                const disabled =
                  buyingId !== null ||
                  loadingBalance ||
                  coins < item.price ||
                  !canBuyMoreLives;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "bg-white border-2 rounded-[28px] p-6 h-full min-h-[260px] flex flex-col justify-between transition-all",
                      index === 0 ? "border-sky-100" : "border-paper-100",
                      !disabled &&
                        "hover:border-sky-100 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(26,107,189,.08)]",
                      disabled && "opacity-70",
                    )}>
                    <div>
                      <div className="flex items-start justify-between gap-4 mb-5">
                        <div>
                          <h4 className="text-[20px] font-black text-ink">
                            {item.title}
                          </h4>

                          <p className="text-[13px] text-ink-muted font-semibold mt-2 leading-relaxed max-w-[260px]">
                            {item.desc}
                          </p>
                        </div>

                        <span className="shrink-0 bg-ember-50 border border-ember-100 text-ember-300 text-[12px] font-extrabold px-4 py-2 rounded-[18px] min-w-[88px] text-center leading-tight">
                          {item.livesLabel}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-end justify-between gap-3 mt-8">
                      <span className="text-[18px] font-black text-sand-300">
                        {item.price} зоос
                      </span>

                      <button
                        onClick={() => buyItem(item.id)}
                        disabled={disabled}
                        className={cn(
                          "font-extrabold text-[13px] px-5 py-3 rounded-[22px] min-w-[112px] transition-all",
                          disabled
                            ? "bg-paper-100 text-ink-muted cursor-not-allowed"
                            : "bg-sky-300 text-white hover:bg-sky-200",
                        )}>
                        {buyingId === item.id
                          ? "Авч байна..."
                          : !canBuyMoreLives
                            ? "Амь дүүрэн"
                            : loadingBalance
                              ? "Ачаалж байна..."
                              : coins < item.price
                                ? "Зоос хүрэхгүй"
                                : "Авах"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-sand-50 border border-sand-100 rounded-[28px] p-6 mt-5">
              <p className="text-[15px] font-extrabold text-sand-300 mb-2">
                Зоос яаж авах вэ?
              </p>

              <p className="text-[13px] text-sand-300/80 font-semibold leading-relaxed">
                Тоглоом, бичих дасгал хийж оноо цуглуулна. Оноо тодорхой босго
                давбал зоос автоматаар нэмэгдэнэ. Жишээ нь 100 оноонд хүрэхэд
                зоос нэмэгдэнэ.
              </p>
            </div>

            <div className="bg-sky-50 border border-sky-100 rounded-[28px] p-6 mt-5">
              <p className="text-[15px] font-extrabold text-sky-300 mb-2">
                Яагаад оноо хасахгүй вэ?
              </p>

              <p className="text-[13px] text-sky-300/80 font-semibold leading-relaxed">
                Оноо нь суралцалтын ахиц, түвшин, медальд ашиглагддаг. Тиймээс
                дэлгүүрт оноо зарцуулахгүй, зөвхөн зоос ашиглана.
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
