"use client";

import { AppContainer } from "@/components/layout/AppContainer";
import { PageHero } from "@/components/ui/PageHero";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const XP_LEVELS = [
  {
    min: 0,
    name: "Анхан сурагч",
    desc: "Монгол бичгийн суурьтай танилцаж эхэлж байна",
  },
  {
    min: 200,
    name: "Үсэг танигч",
    desc: "Үсэг, дуудлага, хэлбэрийг таньж эхэлсэн",
  },
  {
    min: 500,
    name: "Үг уншигч",
    desc: "Монгол бичгийн энгийн үгсийг уншиж сурч байна",
  },
  {
    min: 1000,
    name: "Өгүүлбэр уншигч",
    desc: "Үгсийг холбож өгүүлбэрийн утга ойлгож байна",
  },
  {
    min: 2000,
    name: "Монгол бичигтэн",
    desc: "Хичээл, тест, тоглоомоор тогтвортой ахиц гаргасан",
  },
  {
    min: 4000,
    name: "Ахисан сурагч",
    desc: "Монгол бичгийн ахисан түвшний чадвар эзэмшиж байна",
  },
];

interface ProfileApiData {
  user: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "STUDENT";
    avatarUrl: string | null;
    xp: number;
    coins: number;
    streak: number;
    level: number;
    grade: number | null;
    createdAt: string;
  };
  summary: {
    totalAttempts: number;
    avgScore: number;
    bestScore: number;
    completedLessons: number;
    inProgressLessons: number;
    notStartedLessons: number;
  };
  recentAttempts: {
    id: string;
    score: number;
    total: number;
    correctCount: number;
    startedAt: string;
    completedAt: string | null;
    quizTitle: string;
    isPlacement: boolean;
  }[];
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function getXpLevelInfo(xp: number) {
  const currentIndex = XP_LEVELS.reduce((acc, level, index) => {
    return xp >= level.min ? index : acc;
  }, 0);

  const current = XP_LEVELS[currentIndex];
  const next = XP_LEVELS[currentIndex + 1];

  if (!next) {
    return {
      current,
      next: null,
      progress: 100,
      xpToNext: 0,
      rank: currentIndex + 1,
    };
  }

  const currentRange = next.min - current.min;
  const currentProgress = xp - current.min;

  return {
    current,
    next,
    progress: Math.min(100, Math.round((currentProgress / currentRange) * 100)),
    xpToNext: Math.max(0, next.min - xp),
    rank: currentIndex + 1,
  };
}

export function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    userId,
    userName,
    userAvatar,
    setUserAvatar,
    streak,
    xp,
    learnedLetters,
    logout,
    isAdmin,
    openAuthModal,
  } = useAppStore();

  const [showLogout, setShowLogout] = useState(false);
  const [profile, setProfile] = useState<ProfileApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMsg("");

        const res = await fetch(
          `/api/profile?userId=${encodeURIComponent(userId)}`,
          { cache: "no-store" },
        );

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.message || "Профайлыг ачаалж чадсангүй.");
        }

        const data = await res.json();
        setProfile(data);

        if (data?.user?.avatarUrl) {
          setUserAvatar(data.user.avatarUrl);
        }
      } catch (error) {
        console.error(error);
        setErrorMsg(error instanceof Error ? error.message : "Алдаа гарлаа.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [userId, setUserAvatar]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (!file.type.startsWith("image/")) {
      setAvatarError("Зөвхөн зураг файл сонгоно уу.");
      return;
    }

    try {
      setAvatarUploading(true);
      setAvatarError("");

      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("avatar", file);

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || "Зураг хадгалж чадсангүй.");
      }

      const nextAvatarUrl = data?.avatarUrl || "";

      setUserAvatar(nextAvatarUrl);

      setProfile((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          user: {
            ...prev.user,
            avatarUrl: nextAvatarUrl,
          },
        };
      });

      e.target.value = "";
    } catch (error) {
      console.error(error);
      setAvatarError(error instanceof Error ? error.message : "Алдаа гарлаа.");
    } finally {
      setAvatarUploading(false);
    }
  }

  const effectiveXp = useMemo(() => {
    if (!profile) return xp;
    return Math.max(profile.user.xp, xp);
  }, [profile, xp]);

  const effectiveCoins = useMemo(() => {
    return profile?.user.coins ?? 0;
  }, [profile]);

  const effectiveStreak = useMemo(() => {
    if (!profile) return streak;
    return Math.max(profile.user.streak, streak);
  }, [profile, streak]);

  const xpLevel = useMemo(() => getXpLevelInfo(effectiveXp), [effectiveXp]);

  const effectiveName = profile?.user.name || userName || "Хэрэглэгч";
  const effectiveIsAdmin = profile?.user.role === "ADMIN" || isAdmin;
  const avatarUrl = profile?.user.avatarUrl || userAvatar || "";

  const nextXpTarget = xpLevel.next?.min ?? effectiveXp;
  const xpToNextText = xpLevel.next
    ? `${xpLevel.xpToNext} оноо дутуу`
    : "Дээд түвшин";

  const totalLessons = Math.max(
    (profile?.summary.completedLessons ?? 0) +
      (profile?.summary.inProgressLessons ?? 0) +
      (profile?.summary.notStartedLessons ?? 0),
    1,
  );

  const stats = [
    {
      n: effectiveXp,
      label: "Нийт оноо",
      color: "text-sky-300",
      desc: "Нийт цуглуулсан суралцалтын оноо",
    },
    {
      n: effectiveCoins,
      label: "Зоос",
      color: "text-sand-300",
      desc: "Дэлгүүрт ашиглах шагналын зоос",
    },
    {
      n: profile?.summary.completedLessons ?? 0,
      label: "Дууссан хичээл",
      color: "text-grass-300",
      desc: "Амжилттай баталгаажсан хичээл",
    },
    {
      n: profile?.summary.totalAttempts ?? 0,
      label: "Нийт тест",
      color: "text-sand-300",
      desc: "Өгсөн тестийн тоо",
    },
    {
      n: effectiveStreak,
      label: "Дадал",
      color: "text-ember-300",
      desc: "Тасралтгүй суралцсан өдрүүд",
    },
  ];

  const progress = [
    {
      label: "Цагаан толгой",
      current: learnedLetters.length,
      total: 35,
      color: "#1a6bbd",
    },
    {
      label: "Дууссан хичээл",
      current: profile?.summary.completedLessons ?? 0,
      total: totalLessons,
      color: "#2a9a52",
    },
    {
      label: "Явж буй хичээл",
      current: profile?.summary.inProgressLessons ?? 0,
      total: totalLessons,
      color: "#c97b2a",
    },
    {
      label: "Дундаж тестийн оноо",
      current: profile?.summary.avgScore ?? 0,
      total: 100,
      color: "#c83030",
    },
    {
      label: "Хамгийн өндөр оноо",
      current: profile?.summary.bestScore ?? 0,
      total: 100,
      color: "#7c5cbf",
    },
  ];

  const badges = [
    {
      name: "Эхний алхам",
      desc: "100 оноо цуглуулсан",
      unlocked: effectiveXp >= 100,
    },
    {
      name: "Үсэг танигч",
      desc: "200 оноо хүрч үсэг таних шатанд орсон",
      unlocked: effectiveXp >= 200,
    },
    {
      name: "Үг уншигч",
      desc: "500 оноо хүрч үг унших түвшинд хүрсэн",
      unlocked: effectiveXp >= 500,
    },
    {
      name: "Өгүүлбэр уншигч",
      desc: "1000 оноо хүрч өгүүлбэр ойлгох шатанд хүрсэн",
      unlocked: effectiveXp >= 1000,
    },
    {
      name: "Тууштай сурагч",
      desc: "3-аас дээш хичээл дуусгасан",
      unlocked: (profile?.summary.completedLessons ?? 0) >= 3,
    },
    {
      name: "Шалгалтын идэвхтэй",
      desc: "5-аас дээш тест өгсөн",
      unlocked: (profile?.summary.totalAttempts ?? 0) >= 5,
    },
    {
      name: "Өндөр оноо",
      desc: "90% буюу түүнээс дээш оноотой тест өгсөн",
      unlocked: (profile?.summary.bestScore ?? 0) >= 90,
    },
    {
      name: "7 өдрийн дадал",
      desc: "7 хоногийн дадлаа хадгалсан",
      unlocked: effectiveStreak >= 7,
    },
  ];

  if (!userId) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-6">
        <div className="max-w-[480px] w-full bg-white border-2 border-paper-100 rounded-[28px] p-8 text-center">
          <h2 className="text-[26px] font-black text-ink mb-3">
            Профайл харахын тулд нэвтэрнэ үү
          </h2>

          <p className="text-[13px] text-ink-muted font-semibold leading-relaxed mb-6">
            Таны оноо, тестийн түүх, суралцалтын явцыг харахын тулд эхлээд
            нэвтрэх шаардлагатай.
          </p>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => openAuthModal("in")}
              className="bg-sky-300 text-white font-extrabold text-[13px] px-5 py-2.5 rounded-2xl hover:bg-sky-200 transition-all">
              Нэвтрэх
            </button>

            <button
              onClick={() => router.push("/")}
              className="bg-white border-2 border-paper-100 text-ink font-bold text-[13px] px-5 py-2.5 rounded-2xl hover:border-sky-100 transition-all">
              Нүүр
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-6">
        <div className="max-w-[480px] w-full bg-white border-2 border-paper-100 rounded-[28px] p-8 text-center">
          <p className="text-[16px] font-bold text-ink-muted">
            Профайлын мэдээлэл ачаалж байна...
          </p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-6">
        <div className="max-w-[520px] w-full bg-white border-2 border-paper-100 rounded-[28px] p-8 text-center">
          <p className="text-[16px] font-bold text-ember-300 mb-5">
            {errorMsg}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="bg-sky-300 text-white font-extrabold text-[13px] px-5 py-2.5 rounded-2xl hover:bg-sky-200 transition-all">
            Дахин оролдох
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <PageHero
        eyebrow="Хэрэглэгч"
        title="Профайл"
        description="Таны суралцалтын явц, онооны түвшин, шалгалтын түүх"
        mongolText="ᠬᠦᠮᠦᠨ"
        variant="dark"
      />

      <AppContainer size="6xl" className="pb-12">
        <div className="bg-white border-2 border-paper-100 rounded-[32px] p-6 lg:p-7 mb-5 shadow-[0_8px_26px_rgba(20,28,40,.035)]">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="group relative block rounded-full outline-none focus:ring-4 focus:ring-sky-50 disabled:opacity-70">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Профайлын зураг"
                      className="w-[92px] h-[92px] rounded-full object-cover border-4 border-white shadow-[0_0_0_4px_#b8d9ff]"
                    />
                  ) : (
                    <div className="w-[92px] h-[92px] rounded-full bg-gradient-to-br from-sky-200 to-grass-200 border-4 border-white shadow-[0_0_0_4px_#b8d9ff] flex items-center justify-center text-[32px] font-black text-white">
                      {effectiveName?.[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}

                  <div className="absolute inset-0 rounded-full bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-[11px] font-extrabold">
                      {avatarUploading ? "Хадгалж..." : "Засах"}
                    </span>
                  </div>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />

                {avatarError && (
                  <p className="mt-2 max-w-[110px] text-center text-[10px] font-bold text-ember-300 leading-snug">
                    {avatarError}
                  </p>
                )}
              </div>

              <div className="min-w-0">
                <p className="text-[32px] leading-none font-black text-ink">
                  {effectiveName}
                </p>

                <p className="text-[16px] font-extrabold text-sky-300 mt-3">
                  {xpLevel.current.name}
                </p>

                <p className="text-[14px] text-ink-muted font-semibold mt-2 leading-relaxed max-w-[520px]">
                  {xpLevel.current.desc}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-[13px] font-semibold text-ink-muted">
                  <span>{effectiveXp} оноо</span>
                  <span>{effectiveCoins} зоос</span>
                  <span>{xpLevel.rank}-р түвшин</span>
                  <span>{xpLevel.current.name}</span>
                </div>

                {profile?.user.email && (
                  <p className="text-[13px] text-ink-muted mt-2 font-semibold">
                    {profile.user.email}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2">
              {!showLogout ? (
                <button
                  onClick={() => setShowLogout(true)}
                  className="bg-ember-300 text-white font-extrabold text-[12px] px-4 py-2 rounded-xl shadow-sm hover:bg-ember-400 transition-all">
                  Гарах
                </button>
              ) : (
                <div className="bg-ember-50 border-2 border-ember-100 rounded-2xl p-2.5 flex items-center gap-2 flex-wrap">
                  <p className="text-[11px] font-bold text-ember-300 mr-1">
                    Итгэлтэй юу?
                  </p>

                  <button
                    onClick={() => {
                      logout();
                      router.push("/");
                    }}
                    className="bg-ember-300 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-xl hover:bg-ember-400 transition-all">
                    Тийм
                  </button>

                  <button
                    onClick={() => setShowLogout(false)}
                    className="bg-white border border-paper-100 text-ink-muted font-bold text-[11px] px-3 py-1.5 rounded-xl hover:bg-paper-50 transition-all">
                    Болих
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 bg-paper-50 border border-paper-100 rounded-[24px] p-4 lg:p-5">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
              <div>
                <p className="text-[12px] font-extrabold text-ink-muted uppercase tracking-[1.5px]">
                  Онооны ахиц
                </p>

                <div className="flex items-end gap-2 mt-1">
                  <p className="text-[30px] leading-none font-black text-ink">
                    {effectiveXp}
                  </p>
                  <p className="text-[14px] font-extrabold text-ink-muted mb-1">
                    оноо
                  </p>
                </div>
              </div>

              <div className="md:text-right">
                <p className="text-[14px] font-extrabold text-sky-300">
                  {xpLevel.current.name}
                </p>

                <p className="text-[12px] font-semibold text-ink-muted mt-1">
                  {xpLevel.next
                    ? `Дараагийн түвшин: ${xpLevel.next.name}`
                    : "Та хамгийн дээд түвшинд хүрсэн байна"}
                </p>
              </div>
            </div>

            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-bold text-ink-muted">
                  Одоогийн ахиц
                </span>

                <span className="text-[12px] font-black text-sky-300">
                  {xpLevel.progress}%
                </span>
              </div>

              <ProgressBar value={xpLevel.progress} className="w-full" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white border border-paper-100 rounded-2xl px-4 py-3">
                <p className="text-[10px] font-extrabold text-ink-muted uppercase tracking-[1px]">
                  Одоогийн оноо
                </p>
                <p className="text-[15px] font-black text-ink mt-1">
                  {effectiveXp} оноо
                </p>
              </div>

              <div className="bg-white border border-paper-100 rounded-2xl px-4 py-3">
                <p className="text-[10px] font-extrabold text-ink-muted uppercase tracking-[1px]">
                  Дараагийн босго
                </p>
                <p className="text-[15px] font-black text-sky-300 mt-1">
                  {xpLevel.next ? `${nextXpTarget} оноо` : "Дээд түвшин"}
                </p>
              </div>

              <div className="bg-white border border-paper-100 rounded-2xl px-4 py-3">
                <p className="text-[10px] font-extrabold text-ink-muted uppercase tracking-[1px]">
                  Үлдсэн
                </p>
                <p className="text-[15px] font-black text-ember-300 mt-1">
                  {xpToNextText}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-5">
          {stats.map(({ n, label, color, desc }) => (
            <div
              key={label}
              className="bg-white border-2 border-paper-100 rounded-[24px] p-5 text-center min-h-[135px] flex flex-col items-center justify-center">
              <p className={`text-[30px] font-black leading-none ${color}`}>
                {n}
              </p>

              <p className="text-[12px] font-bold text-ink-muted mt-2.5">
                {label}
              </p>

              <p className="text-[10px] text-ink-muted/70 font-semibold mt-1 leading-relaxed">
                {desc}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-white border-2 border-paper-100 rounded-[28px] p-6 lg:p-7 mb-5">
          <h3 className="text-[22px] font-black mb-5">Суралцалтын явц</h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-5">
            {progress.map(({ label, current, total, color }) => (
              <div key={label}>
                <div className="flex justify-between text-[13px] font-bold mb-2">
                  <span>{label}</span>
                  <span style={{ color }}>
                    {current}/{total}
                  </span>
                </div>

                <ProgressBar
                  value={Math.round((current / total) * 100)}
                  color={color}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_.9fr] gap-5">
          <div className="bg-white border-2 border-paper-100 rounded-[28px] p-6 lg:p-7">
            <h3 className="text-[22px] font-black mb-5">Сүүлийн тестүүд</h3>

            {profile?.recentAttempts?.length ? (
              <div className="flex flex-col gap-3">
                {profile.recentAttempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="border-2 border-paper-100 rounded-[20px] p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <p className="text-[14px] font-extrabold text-ink">
                        {attempt.quizTitle}
                      </p>

                      <p className="text-[11px] text-ink-muted font-semibold mt-1">
                        {attempt.isPlacement
                          ? "Түвшин тогтоох шалгалт"
                          : "Энгийн тест"}{" "}
                        · {formatDate(attempt.startedAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-[11px] font-extrabold bg-sky-50 text-sky-300 border border-sky-100 px-2.5 py-1 rounded-2xl">
                        {attempt.score}%
                      </span>

                      <span className="text-[11px] font-bold text-ink-muted">
                        {attempt.correctCount}/{attempt.total} зөв
                      </span>

                      <span className="text-[11px] font-bold text-grass-300 bg-grass-50 border border-grass-100 px-2.5 py-1 rounded-2xl">
                        +{attempt.correctCount * 10} оноо
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-paper-100 rounded-[20px] p-5 text-center text-[13px] text-ink-muted font-semibold">
                Одоогоор хадгалагдсан тестийн түүх алга байна.
              </div>
            )}
          </div>

          <div className="bg-white border-2 border-paper-100 rounded-[28px] p-6 lg:p-7">
            <h3 className="text-[22px] font-black mb-5">Медалиуд</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {badges.map(({ name, desc, unlocked }) => (
                <div
                  key={name}
                  className={cn(
                    "border-2 rounded-[20px] p-4 transition-all min-h-[116px]",
                    unlocked
                      ? "bg-white border-sand-100 hover:border-sand-200 hover:-translate-y-0.5"
                      : "bg-paper-50 border-paper-100 opacity-45 grayscale",
                  )}>
                  <p className="text-[12px] font-extrabold">{name}</p>

                  <p className="text-[11px] text-ink-muted mt-1.5 font-semibold leading-relaxed">
                    {desc}
                  </p>

                  {unlocked ? (
                    <p className="text-[9px] text-grass-300 font-extrabold mt-3">
                      АВСАН
                    </p>
                  ) : (
                    <p className="text-[9px] text-ink-muted font-extrabold mt-3">
                      НЭЭГДЭЭГҮЙ
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </AppContainer>
    </div>
  );
}
