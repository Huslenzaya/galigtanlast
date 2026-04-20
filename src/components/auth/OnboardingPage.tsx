"use client";

import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useState } from "react";

const STEPS = [
  {
    icon: "",
    title: "GALIGTAN-д тавтай морил!",
    sub: "Эртний тэнгэрлэг бичгийг орчин үеийн, хөгжилтэй аргаар эзэмш.\n6–12-р ангийн хүүхэд бүрт зориулсан.",
    content: (
      <div className="flex flex-col gap-3 mb-6">
        {[
          { icon: "", t: "Хичээл", s: "Дүрэм, түвшин, шалгалт — бүгд нэг дор" },
          {
            icon: "",
            t: "6 хөгжилтэй тоглоом",
            s: "Тааруулах, хурд, баллон, дүүргэх...",
          },
          { icon: "", t: "Толь бичиг", s: "Үсэг болон үгийн сан нэг дор" },
          {
            icon: "",
            t: "Түвшин тогтоох шалгалт",
            s: "Автоматаар таны түвшинг тодорхойлно",
          },
        ].map(({ icon, t, s }) => (
          <div
            key={t}
            className="flex items-center gap-4 bg-white border-2 border-paper-100 rounded-2xl p-4">
            <span className="text-[22px] w-9 text-center shrink-0">{icon}</span>
            <div>
              <p className="text-[14px] font-extrabold">{t}</p>
              <p className="text-[12px] text-ink-muted font-semibold mt-0.5">
                {s}
              </p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: "",
    title: "Тоглоомын дүрэм",
    sub: "Оноо хэрхэн тооцогдох, алдвал яах талаар мэд",
    content: (
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          {
            icon: "",
            t: "5 амь",
            d: "Буруу хариулт бүр нэг амь хасна. 0 болвол тухайн тоглоом дуусна.",
            c: "border-t-sky-300",
          },
          {
            icon: "",
            t: "Streak",
            d: "Өдөр бүр суралцвал streak нэмэгдэнэ. Тасарвал дахин эхлэнэ.",
            c: "border-t-grass-300",
          },
          {
            icon: "⭐",
            t: "Оноо",
            d: "Зөв хариулт бүр +10 оноо. Хурдан хариулвал бонус нэмэгдэнэ.",
            c: "border-t-sand-300",
          },
          {
            icon: "",
            t: "Зөвлөмж",
            d: "Шалгалтын үед дарж дүрмийн хуудас харж болно.",
            c: "border-t-ember-300",
          },
        ].map(({ icon, t, d, c }) => (
          <div
            key={t}
            className={`bg-white border-2 border-paper-100 border-t-4 rounded-2xl p-4 ${c}`}>
            <p className="text-[20px] mb-2">{icon}</p>
            <p className="text-[13px] font-extrabold mb-1">{t}</p>
            <p className="text-[11px] text-ink-muted font-semibold leading-relaxed">
              {d}
            </p>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: "",
    title: "Алдаа дутагдлаа ойлго",
    sub: "Ямар тоглоомд ямар алдаа хийвэл юу болохыг мэд",
    content: (
      <div className="flex flex-col gap-3 mb-6">
        {[
          {
            icon: "",
            t: "Тааруулах — буруу тааруулбал",
            s: "Алдааны тоо +1, картнууд улаан болно",
          },
          {
            icon: "",
            t: "Хурдны тест — хугацаа дуусвал",
            s: "Дараагийн үсэг рүү шилжинэ, оноо нэмэгдэхгүй",
          },
          {
            icon: "",
            t: "Баллон — буруу баллон дэлбэлбэл",
            s: "Амь хасагдана — зөв хариулттайг сонго!",
          },
          {
            icon: "",
            t: "Шалгалтад буруу хариулвал",
            s: "Зөв хариулт харагдана + зөвлөмж нэвтэрнэ",
          },
        ].map(({ icon, t, s }) => (
          <div
            key={t}
            className="flex items-center gap-4 bg-white border-2 border-paper-100 rounded-2xl p-4">
            <span className="text-[22px] w-9 text-center shrink-0">{icon}</span>
            <div>
              <p className="text-[14px] font-extrabold">{t}</p>
              <p className="text-[12px] text-ink-muted font-semibold mt-0.5">
                {s}
              </p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: "",
    title: "Түвшингоо тогтоо!",
    sub: "12 асуулт хариулж таны одоогийн мэдлэгийг шалгана.",
    content: (
      <div className="flex flex-col gap-3 mb-6">
        {[
          {
            icon: "⏱️",
            t: "~3 минут",
            s: "Үсэг таних Үгийн утга Нөхцөл Өгүүлбэр",
          },
          {
            icon: "",
            t: "Дүн шинжилгээ",
            s: "Ангилал бүрийн мэдлэгийг тусад нь харуулна",
          },
        ].map(({ icon, t, s }) => (
          <div
            key={t}
            className="flex items-center gap-4 bg-white border-2 border-paper-100 rounded-2xl p-4">
            <span className="text-[22px] w-9 text-center shrink-0">{icon}</span>
            <div>
              <p className="text-[14px] font-extrabold">{t}</p>
              <p className="text-[12px] text-ink-muted font-semibold mt-0.5">
                {s}
              </p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
];

export function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const { goTo } = useAppStore();

  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="max-w-[560px] mx-auto px-6 py-8 animate-fade-up">
      <div className="flex justify-center gap-2 mb-7">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-2.5 rounded-full transition-all duration-300 ${i === step ? "w-6 bg-sky-300" : i < step ? "w-2.5 bg-sky-200" : "w-2.5 bg-paper-100"}`}
          />
        ))}
      </div>

      <div className="text-[52px] text-center mb-4">{s.icon}</div>
      <h2 className="text-[26px] font-black text-center tracking-tight mb-2">
        {s.title}
      </h2>
      <p className="text-[14px] text-ink-muted text-center font-semibold leading-relaxed mb-6 whitespace-pre-line">
        {s.sub}
      </p>

      {s.content}

      <div className="flex gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="bg-white border-2 border-paper-100 text-ink font-bold text-[14px] px-5 py-3.5 rounded-2xl hover:border-sky-100 transition-all">
            Буцах
          </button>
        )}

        {isLast ? (
          <div className="flex flex-col gap-2.5 flex-1">
            <button
              onClick={() => {
                goTo("placement");
                router.push("/placement");
              }}
              className="w-full bg-sky-300 text-white font-extrabold text-[15px] rounded-2xl py-3.5 hover:bg-sky-200 transition-all">
              Шалгалт өгч эхлэх
            </button>

            <button
              onClick={() => {
                goTo("lessons");
                router.push("/lessons");
              }}
              className="w-full bg-white border-2 border-paper-100 text-ink font-bold text-[14px] rounded-2xl py-3 hover:border-sky-100 transition-all text-center">
              Шалгалтгүйгээр эхлэх
            </button>
          </div>
        ) : (
          <button
            onClick={() => setStep((s) => s + 1)}
            className="flex-1 bg-sky-300 text-white font-extrabold text-[15px] rounded-2xl py-3.5 hover:bg-sky-200 transition-all">
            Үргэлжлүүлэх
          </button>
        )}
      </div>
    </div>
  );
}
