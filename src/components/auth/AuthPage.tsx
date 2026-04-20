"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { showToast } from "@/components/ui/Toast";
import { MongolianText } from "@/components/ui/MongolianText";

export function AuthPage() {
 const [tab, setTab] = useState<"in" | "up">("in");
 const [loginEmail, setLoginEmail] = useState("");
 const [regName, setRegName] = useState("");
 const [regEmail, setRegEmail] = useState("");

 const { setUser, goTo } = useAppStore();

 function doLogin() {
 if (!loginEmail) { showToast("И-мэйл оруулна уу", "bad"); return; }
 const name = loginEmail.split("@")[0] || "Хэрэглэгч";
 setUser(name);
 goTo("home");
 }

 function doRegister() {
 if (!regName || !regEmail) { showToast("Бүх талбарыг бөглөнө үү", "bad"); return; }
 setUser(regName);
 goTo("onboard");
 }

 const inputCls = "w-full font-nunito text-[15px] font-bold border-2 border-paper-100 rounded-2xl px-4 py-3 bg-white text-ink outline-none transition-all duration-200 focus:border-sky-100 focus:shadow-[0_0_0_3px_rgba(26,107,189,.1)]";
 const labelCls = "text-[11px] font-extrabold text-ink-muted tracking-[0.3px] uppercase";

 return (
 <div className="min-h-screen flex items-center justify-center bg-paper pt-16">
 <div className="w-full max-w-[420px] px-6">

 {/* Logo */}
 <div className="flex flex-col items-center gap-2.5 mb-8">
 <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-sky-200 to-sky-300 flex items-center justify-center shadow-[0_6px_24px_rgba(26,107,189,.3)]">
 <MongolianText size="lg" color="#fff">ᠮ</MongolianText>
 </div>
 <p className="text-[22px] font-black text-ink">Монгол Бичиг</p>
 <p className="text-[13px] text-ink-muted font-semibold">Сурах систем · 6–12-р анги</p>
 </div>

 {/* Card */}
 <div className="bg-white border-2 border-paper-100 rounded-3xl p-8">

 {/* Tabs */}
 <div className="flex bg-paper-50 rounded-2xl p-1 mb-7">
 {(["in", "up"] as const).map((t) => (
 <button
 key={t}
 onClick={() => setTab(t)}
 className={`flex-1 py-2.5 rounded-xl text-[14px] font-extrabold transition-all duration-200 ${
 tab === t
 ? "bg-white text-ink shadow-soft"
 : "text-ink-muted hover:text-ink"
 }`}
 >
 {t === "in" ? "Нэвтрэх" : "Бүртгүүлэх"}
 </button>
 ))}
 </div>

 {/* Login */}
 {tab === "in" && (
 <div className="flex flex-col gap-4">
 <div className="flex flex-col gap-1.5">
 <label className={labelCls}>И-мэйл</label>
 <input className={inputCls} type="email" placeholder="name@email.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doLogin()} />
 </div>
 <div className="flex flex-col gap-1.5">
 <label className={labelCls}>Нууц үг</label>
 <input className={inputCls} type="password" placeholder="••••••••" onKeyDown={(e) => e.key === "Enter" && doLogin()} />
 </div>
 <button onClick={doLogin} className="w-full bg-sky-300 hover:bg-sky-200 text-white font-extrabold text-[15px] rounded-2xl py-3.5 transition-all duration-200 hover:-translate-y-px mt-1">
 Нэвтрэх 
 </button>
 <div className="flex items-center gap-3 my-1">
 <div className="flex-1 h-px bg-paper-100" /><span className="text-[12px] font-bold text-ink-muted">эсвэл</span><div className="flex-1 h-px bg-paper-100" />
 </div>
 <button onClick={doLogin} className="w-full bg-white border-2 border-paper-100 hover:border-sky-100 hover:bg-sky-50 text-ink font-bold text-[14px] rounded-2xl py-3 transition-all duration-200 flex items-center justify-center gap-2">
 Google-ээр нэвтрэх
 </button>
 <p className="text-center text-[13px] text-ink-muted font-semibold">
 Бүртгэл байхгүй юу?{" "}
 <button onClick={() => setTab("up")} className="text-sky-300 font-extrabold">Бүртгүүлэх</button>
 </p>
 </div>
 )}

 {/* Register */}
 {tab === "up" && (
 <div className="flex flex-col gap-4">
 <div className="flex flex-col gap-1.5">
 <label className={labelCls}>Нэр</label>
 <input className={inputCls} type="text" placeholder="Таны нэр" value={regName} onChange={(e) => setRegName(e.target.value)} />
 </div>
 <div className="flex flex-col gap-1.5">
 <label className={labelCls}>И-мэйл</label>
 <input className={inputCls} type="email" placeholder="name@email.com" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
 </div>
 <div className="flex flex-col gap-1.5">
 <label className={labelCls}>Нууц үг</label>
 <input className={inputCls} type="password" placeholder="••••••••" onKeyDown={(e) => e.key === "Enter" && doRegister()} />
 </div>
 <button onClick={doRegister} className="w-full bg-sky-300 hover:bg-sky-200 text-white font-extrabold text-[15px] rounded-2xl py-3.5 transition-all duration-200 hover:-translate-y-px mt-1">
 Бүртгүүлэх 
 </button>
 <p className="text-center text-[13px] text-ink-muted font-semibold">
 Бүртгэлтэй юу?{" "}
 <button onClick={() => setTab("in")} className="text-sky-300 font-extrabold">Нэвтрэх</button>
 </p>
 </div>
 )}
 </div>
 </div>
 </div>
 );
}
