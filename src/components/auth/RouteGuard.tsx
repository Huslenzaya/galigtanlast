"use client";

import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface RouteGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  title?: string;
}

export function RouteGuard({
  children,
  requireAdmin = false,
  title = "Энэ хуудсанд нэвтрэх эрх хэрэгтэй",
}: RouteGuardProps) {
  const router = useRouter();
  const { isLoggedIn, isAdmin, openAuthModal } = useAppStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-6">
        <div className="max-w-[460px] w-full bg-white border-2 border-paper-100 rounded-[32px] p-8 text-center">
          <p className="text-[18px] font-bold text-ink-muted">
            Ачаалж байна...
          </p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-6">
        <div className="max-w-[500px] w-full bg-white border-2 border-paper-100 rounded-[32px] p-8 text-center">
          <h2 className="text-[28px] font-black text-ink mb-3">{title}</h2>
          <p className="text-[14px] text-ink-muted font-semibold leading-relaxed mb-6">
            Энэ хэсгийг үзэхийн тулд эхлээд нэвтрэх шаардлагатай.
          </p>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => openAuthModal("in")}
              className="bg-sky-300 text-white font-extrabold text-[14px] px-6 py-3 rounded-2xl hover:bg-sky-200 transition-all">
              Нэвтрэх
            </button>

            <button
              onClick={() => router.push("/")}
              className="bg-white border-2 border-paper-100 text-ink font-bold text-[14px] px-6 py-3 rounded-2xl hover:border-sky-100 transition-all">
              Нүүр
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-6">
        <div className="max-w-[500px] w-full bg-white border-2 border-paper-100 rounded-[32px] p-8 text-center">
          <h2 className="text-[28px] font-black text-ink mb-3">
            Админ эрх шаардлагатай
          </h2>
          <p className="text-[14px] text-ink-muted font-semibold leading-relaxed mb-6">
            Энэ хуудас зөвхөн админ хэрэглэгчид зориулсан.
          </p>

          <button
            onClick={() => router.push("/")}
            className="bg-sky-300 text-white font-extrabold text-[14px] px-6 py-3 rounded-2xl hover:bg-sky-200 transition-all">
            Нүүр рүү буцах
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
