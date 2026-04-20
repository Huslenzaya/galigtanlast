"use client";

import { AppContainer } from "@/components/layout/AppContainer";
import {
  IconBook,
  IconDict,
  IconGame,
  IconLogout,
  IconSettings,
  IconWrite,
} from "@/components/ui/Icons";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { PageId } from "@/types";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const NAV_ITEMS: { id: PageId; label: string; Icon: any }[] = [
  { id: "lessons", label: "Хичээл", Icon: IconBook },
  { id: "games", label: "Тоглоом", Icon: IconGame },
  { id: "dict", label: "Толь бичиг", Icon: IconDict },
  { id: "writepractice", label: "Бичих дасгал", Icon: IconWrite },
];

const HIDDEN_PAGES: PageId[] = ["onboard", "lvlsel", "placement"];
const AUTH_REQUIRED_PAGES: PageId[] = ["writepractice"];

const ROUTE_MAP: Partial<Record<PageId, string>> = {
  home: "/",
  profile: "/profile",
  games: "/games",
  lessons: "/lessons",
  dict: "/dict",
  writepractice: "/writepractice",
  admin: "/admin",
};

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const {
    currentPage,
    goTo,
    lives,
    streak,
    userId,
    userName,
    userAvatar,
    setUserAvatar,
    isLoggedIn,
    isAdmin,
    openAuthModal,
    logout,
  } = useAppStore();

  const hidden = pathname === "/" && HIDDEN_PAGES.includes(currentPage);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [currentPage, isLoggedIn, pathname]);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (!menuRef.current) return;

      if (!menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  useEffect(() => {
    async function loadNavbarAvatar() {
      if (!isLoggedIn || !userId) return;

      try {
        const res = await fetch(
          `/api/profile?userId=${encodeURIComponent(userId)}`,
          { cache: "no-store" },
        );

        if (!res.ok) return;

        const data = await res.json();

        if (data?.user?.avatarUrl) {
          setUserAvatar(data.user.avatarUrl);
        }
      } catch (error) {
        console.error("Navbar avatar load error:", error);
      }
    }

    loadNavbarAvatar();
  }, [isLoggedIn, userId, setUserAvatar]);

  function isActive(page: PageId) {
    const route = ROUTE_MAP[page];

    if (route) return pathname === route;

    return currentPage === page;
  }

  function navigateTo(page: PageId) {
    const route = ROUTE_MAP[page];

    if (route) {
      goTo(page);
      router.push(route);
      return;
    }

    if (pathname !== "/") {
      router.push("/");
      setTimeout(() => goTo(page), 0);
      return;
    }

    goTo(page);
  }

  function handleNavClick(page: PageId) {
    if (!isLoggedIn && AUTH_REQUIRED_PAGES.includes(page)) {
      openAuthModal("up");
      return;
    }

    navigateTo(page);
  }

  function handleProfileClick() {
    if (!isLoggedIn) {
      openAuthModal("in");
      return;
    }

    setMenuOpen(false);
    navigateTo("profile");
  }

  function handleShopClick() {
    setMenuOpen(false);
    router.push("/shop");
  }

  async function handleLogout() {
    setMenuOpen(false);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      logout();
      goTo("home");
      router.push("/");
      router.refresh();
    }
  }

  function renderAvatar(size: "sm" | "md" = "sm") {
    const sizeClass =
      size === "md" ? "w-10 h-10 text-[14px]" : "w-9 h-9 text-[14px]";

    return (
      <div
        className={cn(
          sizeClass,
          "rounded-full bg-sky-300 flex items-center justify-center font-black text-white overflow-hidden shrink-0",
        )}>
        {userAvatar ? (
          <img
            src={userAvatar}
            alt="Профайл зураг"
            className="w-full h-full object-cover"
          />
        ) : (
          (userName?.[0]?.toUpperCase() ?? "?")
        )}
      </div>
    );
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-paper/95 backdrop-blur-xl border-b border-paper-100">
      <AppContainer
        size="7xl"
        className="h-20 flex items-center justify-between gap-6">
        <button
          onClick={() => navigateTo("home")}
          className="flex items-center gap-3 shrink-0 group">
          <div className="w-11 h-11 rounded-[12px] bg-white flex items-center justify-center shadow-[0_2px_10px_rgba(26,107,189,.18)] transition-transform group-hover:scale-105 overflow-hidden">
            <img
              src="/galigtan-logo.png"
              alt="GALIGTAN logo"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="text-left leading-none">
            <div className="font-extrabold text-[18px] text-ink tracking-[-0.4px]">
              GALIGTAN
            </div>
            <div className="text-[11px] font-bold text-ink-muted tracking-[2px] uppercase mt-1">
              Монгол бичиг
            </div>
          </div>
        </button>

        {!hidden && (
          <div className="hidden lg:flex items-center justify-center flex-1 min-w-0">
            <div className="flex items-center gap-1 bg-white border border-paper-100 rounded-2xl px-2 py-1 shadow-[0_4px_18px_rgba(20,28,40,.04)]">
              {NAV_ITEMS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => handleNavClick(id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-bold transition-all whitespace-nowrap",
                    isActive(id)
                      ? "bg-sky-300 text-white shadow-[0_4px_14px_rgba(40,120,220,.28)]"
                      : "text-ink-muted hover:bg-paper-50 hover:text-ink",
                  )}>
                  <Icon size={15} strokeWidth={2} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2.5 shrink-0">
          {isLoggedIn ? (
            <>
              <div className="hidden sm:flex items-center gap-1 px-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-2.5 h-2.5 rounded-full transition-all duration-300",
                      i <= lives ? "bg-ember-300" : "bg-paper-100",
                    )}
                  />
                ))}
              </div>

              <div className="flex items-center gap-1.5 bg-white border border-paper-100 text-ink font-extrabold text-[13px] px-3.5 py-2 rounded-xl">
                <IconFlame size={14} color="#c83030" strokeWidth={2} />
                <span className="text-ember-300">{streak}</span>
              </div>

              {isAdmin && (
                <button
                  onClick={() => navigateTo("admin")}
                  className="hidden sm:flex items-center gap-1.5 bg-ember-50 border border-ember-100 text-ember-300 text-[13px] font-extrabold px-4 py-2 rounded-xl hover:bg-ember-100 transition-all">
                  <IconSettings size={14} strokeWidth={2} />
                  Удирдлага
                </button>
              )}

              <div ref={menuRef} className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="Профайл цэс"
                  className={cn(
                    "w-11 h-11 rounded-full bg-white border flex items-center justify-center transition-all overflow-hidden",
                    menuOpen
                      ? "border-sky-200 ring-4 ring-sky-50 shadow-soft"
                      : "border-paper-100 hover:border-sky-100 hover:ring-4 hover:ring-sky-50",
                  )}>
                  {renderAvatar("sm")}
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-14 w-64 bg-white border-2 border-paper-100 rounded-3xl shadow-[0_16px_40px_rgba(20,28,40,.12)] p-2 animate-slide-down">
                    <button
                      onClick={handleProfileClick}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-sky-50 transition-colors text-left">
                      {renderAvatar("md")}

                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-extrabold text-ink truncate">
                          {userName || "Хэрэглэгч"}
                        </p>

                        <p className="text-[11px] font-semibold text-ink-muted">
                          {isAdmin ? "Админ хэрэглэгч" : "Суралцагч"}
                        </p>
                      </div>
                    </button>

                    <div className="h-px bg-paper-100 my-2" />

                    <button
                      onClick={handleShopClick}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-[13px] font-bold text-ink hover:bg-paper-50 transition-colors">
                      <div className="w-8 h-8 rounded-xl bg-sand-50 border border-sand-100 flex items-center justify-center">
                        <IconGame size={14} strokeWidth={2} />
                      </div>

                      <span>Дэлгүүр</span>
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-[13px] font-bold text-ember-300 hover:bg-ember-50 transition-colors">
                      <div className="w-8 h-8 rounded-xl bg-ember-50 border border-ember-100 flex items-center justify-center">
                        <IconLogout size={14} strokeWidth={2} />
                      </div>

                      <span>Гарах</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal("in")}
                className="text-[13px] font-bold text-ink-muted px-4 py-2 rounded-xl hover:bg-paper-50 hover:text-ink transition-all">
                Нэвтрэх
              </button>

              <button
                onClick={() => openAuthModal("up")}
                className="bg-sky-300 text-white font-extrabold text-[13px] px-4 py-2 rounded-xl hover:bg-sky-200 transition-all shadow-[0_2px_8px_rgba(26,107,189,.25)]">
                Бүртгүүлэх
              </button>
            </div>
          )}
        </div>
      </AppContainer>
    </nav>
  );
}

function IconFlame({
  size = 20,
  color = "currentColor",
  strokeWidth = 1.8,
}: {
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z" />
    </svg>
  );
}
