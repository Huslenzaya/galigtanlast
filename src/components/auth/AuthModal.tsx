"use client";

import { showToast } from "@/components/ui/Toast";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AuthModal() {
  const router = useRouter();
  const { authModalOpen, authModalTab, closeAuthModal, setUser, goTo } =
    useAppStore();

  const [tab, setTab] = useState<"in" | "up">(authModalTab);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPass, setRegPass] = useState("");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setTab(authModalTab);
  }, [authModalTab]);

  if (!authModalOpen) return null;

  async function doLogin() {
    try {
      setSubmitting(true);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPass,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data?.message || "Нэвтрэхэд алдаа гарлаа.", "bad");
        return;
      }

      setUser(data.name, data.role === "ADMIN", data.email, data.id);

      showToast(`Тавтай морил, ${data.name}!`, "ok");

      if (data.role === "ADMIN") {
        router.push("/admin");
      } else {
        goTo("home");
        router.push("/");
      }

      closeAuthModal();
    } catch (error) {
      console.error(error);
      showToast("Нэвтрэх үед серверийн алдаа гарлаа.", "bad");
    } finally {
      setSubmitting(false);
    }
  }

  async function doRegister() {
    try {
      setSubmitting(true);

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPass,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data?.message || "Бүртгэл үүсгэхэд алдаа гарлаа.", "bad");
        return;
      }

      setUser(data.name, data.role === "ADMIN", data.email, data.id);

      showToast("Бүртгэл амжилттай үүслээ!", "ok");

      if (data.role === "ADMIN") {
        router.push("/admin");
      } else {
        goTo("onboard");
        router.push("/");
      }

      closeAuthModal();
    } catch (error) {
      console.error(error);
      showToast("Бүртгүүлэх үед серверийн алдаа гарлаа.", "bad");
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls =
    "w-full font-nunito text-[15px] font-bold border-2 border-paper-100 rounded-2xl px-4 py-3 bg-white text-ink outline-none transition-all duration-200 focus:border-sky-100 focus:shadow-[0_0_0_3px_rgba(26,107,189,.12)]";
  const labelCls =
    "text-[11px] font-extrabold text-ink-muted tracking-[0.3px] uppercase";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={closeAuthModal}
      />

      <div className="relative w-full max-w-[420px] bg-paper rounded-4xl shadow-[0_24px_80px_rgba(26,26,46,0.28)] border-2 border-paper-100 animate-pop-in">
        <div className="flex flex-col items-center pt-8 pb-5 border-b-2 border-paper-50">
          <div className="w-14 h-14 rounded-[18px] bg-white flex items-center justify-center shadow-[0_6px_24px_rgba(26,107,189,.18)] mb-3 overflow-hidden">
            <img
              src="/galigtan-logo.png"
              alt="GALIGTAN logo"
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-[20px] font-black text-ink">GALIGTAN</p>
          <p className="text-[12px] text-ink-muted font-semibold mt-0.5">
            Монгол бичиг сурах систем · 6–12-р анги
          </p>
        </div>

        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-paper-50 hover:bg-paper-100 flex items-center justify-center text-ink-muted hover:text-ink transition-all font-bold text-[14px]">
          ×
        </button>

        <div className="p-7 pt-5">
          <div className="flex bg-paper-50 rounded-2xl p-1 mb-6">
            {(["in", "up"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 rounded-xl text-[14px] font-extrabold transition-all duration-200 ${
                  tab === t
                    ? "bg-white text-ink shadow-soft"
                    : "text-ink-muted hover:text-ink"
                }`}>
                {t === "in" ? "Нэвтрэх" : "Бүртгүүлэх"}
              </button>
            ))}
          </div>

          {tab === "in" && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>И-мэйл</label>
                <input
                  className={inputCls}
                  type="email"
                  placeholder="name@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && doLogin()}
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Нууц үг</label>
                <input
                  className={inputCls}
                  type="password"
                  placeholder="••••••••"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && doLogin()}
                />
              </div>

              <button
                onClick={doLogin}
                disabled={submitting}
                className="w-full bg-sky-300 hover:bg-sky-200 disabled:opacity-60 text-white font-extrabold text-[15px] rounded-2xl py-3.5 transition-all duration-200 hover:-translate-y-px mt-1">
                {submitting ? "Нэвтэрч байна..." : "Нэвтрэх"}
              </button>
            </div>
          )}

          {tab === "up" && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Нэр</label>
                <input
                  className={inputCls}
                  type="text"
                  placeholder="Таны нэр"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>И-мэйл</label>
                <input
                  className={inputCls}
                  type="email"
                  placeholder="name@email.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Нууц үг</label>
                <input
                  className={inputCls}
                  type="password"
                  placeholder="••••••••"
                  value={regPass}
                  onChange={(e) => setRegPass(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && doRegister()}
                />
              </div>

              <button
                onClick={doRegister}
                disabled={submitting}
                className="w-full bg-sky-300 hover:bg-sky-200 disabled:opacity-60 text-white font-extrabold text-[15px] rounded-2xl py-3.5 transition-all duration-200 hover:-translate-y-px mt-1">
                {submitting ? "Бүртгэж байна..." : "Бүртгүүлэх"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
