"use client";

import { useAppStore } from "@/lib/store";
import type { PageId } from "@/types";
import { usePathname, useRouter } from "next/navigation";

const HIDDEN_PAGES: PageId[] = [
  "auth",
  "home",
  "onboard",
  "lvlsel",
  "placement",
];

const NAV_LINKS: { label: string; page: PageId }[][] = [
  [
    { label: "Хичээлүүд", page: "lessons" },
    { label: "Дүрэм", page: "lessons" },
    { label: "Түвшин тогтоох", page: "placement" },
    { label: "Унших", page: "reading" },
    { label: "Толь бичиг", page: "dict" },
    { label: "Бичих дасгал", page: "writepractice" },
  ],
  [
    { label: "Тааруулах", page: "games" },
    { label: "Хурдны тест", page: "games" },
    { label: "Зурах тоглоом", page: "games" },
    { label: "Нийлүүлэх", page: "games" },
    { label: "Хоосон нөхөх", page: "games" },
  ],
];

const COL_TITLES = ["Сурах", "Тоглоом"];

const ROUTE_MAP: Partial<Record<PageId, string>> = {
  home: "/",
  profile: "/profile",
  games: "/games",
  lessons: "/lessons",
  dict: "/dict",
  writepractice: "/writepractice",
  admin: "/admin",
};

export function Footer() {
  const router = useRouter();
  const pathname = usePathname();

  const { currentPage, goTo, openAuthModal } = useAppStore();

  const hidden = pathname === "/" && HIDDEN_PAGES.includes(currentPage);
  if (hidden) return null;

  function navigateTo(page: PageId) {
    const route = ROUTE_MAP[page];

    goTo(page);

    if (route) {
      router.push(route);
      return;
    }

    router.push("/");
  }

  return (
    <footer className="bg-[#1a1a2e] text-white/60 relative z-10">
      <div className="h-1 w-full flex">
        <div className="flex-1 bg-sky-300" />
        <div className="flex-1 bg-grass-300" />
        <div className="flex-1 bg-sand-300" />
        <div className="flex-1 bg-ember-300" />
      </div>

      <div className="max-w-[960px] mx-auto px-6 py-12">
        <div className="grid grid-cols-[2fr_1fr_1fr] gap-10 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-[10px] bg-white overflow-hidden flex items-center justify-center">
                <img
                  src="/galigtan-logo.png"
                  alt="GALIGTAN logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-extrabold text-[17px] text-white">
                GALIGTAN
              </span>
            </div>
            <p className="text-[13px] leading-[1.8] max-w-[260px] mb-5">
              GALIGTAN нь монгол бичгийг хөгжилтэй, ойлгомжтой аргаар сурахад
              зориулсан дижитал сургалтын систем.
            </p>

            <div className="flex flex-wrap gap-2">
              {[
                {
                  label: "Анхан",
                  color: "rgba(74,158,222,.3)",
                  text: "#b8d9ff",
                },
                {
                  label: "Дунд",
                  color: "rgba(61,186,104,.3)",
                  text: "#a8ecc0",
                },
                {
                  label: "Дэвшилтэт",
                  color: "rgba(240,160,48,.3)",
                  text: "#ffe4b0",
                },
                {
                  label: "Ахисан",
                  color: "rgba(232,72,72,.3)",
                  text: "#ffb8b8",
                },
              ].map((p) => (
                <span
                  key={p.label}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-xl"
                  style={{ background: p.color, color: p.text }}>
                  {p.label}
                </span>
              ))}
            </div>
          </div>

          {NAV_LINKS.map((col, ci) => (
            <div key={ci}>
              <p className="text-[11px] font-extrabold text-white/30 uppercase tracking-[2px] mb-4">
                {COL_TITLES[ci]}
              </p>
              <div className="flex flex-col gap-2.5">
                {col.map(({ label, page }) => (
                  <button
                    key={label}
                    onClick={() => navigateTo(page)}
                    className="text-[13px] font-semibold text-white/55 hover:text-white text-left transition-colors">
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[12px] font-semibold text-white/40">
                GALIGTAN — Монгол бичгийн сургалтын систем
              </p>
              <p className="text-[11px] text-white/25 mt-0.5">
                Дипломын ажил 2026 · Монгол улсын их сургууль · Мэдээлэл
                технологийн тэнхим
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => openAuthModal("in")}
              className="text-[12px] font-semibold text-white/35 hover:text-white/70 transition-colors">
              Нэвтрэх
            </button>
            <button
              onClick={() => openAuthModal("up")}
              className="text-[12px] font-semibold text-white/35 hover:text-white/70 transition-colors">
              Бүртгүүлэх
            </button>
            <button
              onClick={() => navigateTo("dict")}
              className="text-[12px] font-semibold text-white/35 hover:text-white/70 transition-colors">
              Толь бичиг
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
