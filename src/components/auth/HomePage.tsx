"use client";

import {
  IconArrowR,
  IconBook,
  IconCheck,
  IconGame,
  IconLayers,
  IconTarget,
  IconWrite,
} from "@/components/ui/Icons";
import { MongolianText } from "@/components/ui/MongolianText";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";

const STATS = [
  {
    n: "35",
    label: "Нийт үсэг",
    color: "#1a6bbd",
    bg: "#e8f3ff",
    Icon: IconBook,
  },
  {
    n: "6",
    label: "Сургалтын түвшин",
    color: "#2a9a52",
    bg: "#edfaf2",
    Icon: IconLayers,
  },
  { n: "6", label: "Тоглоом", color: "#c97b2a", bg: "#fff8ed", Icon: IconGame },
  {
    n: "35",
    label: "Бичих дасгал",
    color: "#7c5cbf",
    bg: "#f4f0ff",
    Icon: IconWrite,
  },
];

const SYSTEM_FLOW = [
  {
    step: "01",
    title: "Хичээл үзэх",
    desc: "Сурагч анги, шатны дагуу хичээлээ сонгож монгол бичгийн агуулгаа судална.",
    Icon: IconBook,
    color: "#1a6bbd",
    bg: "#e8f3ff",
  },
  {
    step: "02",
    title: "Дасгал ба тоглоом",
    desc: "Толь бичиг, бичих дасгал, тоглоомоор хичээлээ давтаж бататгана.",
    Icon: IconGame,
    color: "#c97b2a",
    bg: "#fff8ed",
  },
  {
    step: "03",
    title: "Тест өгөх",
    desc: "Хичээлтэй холбогдсон тестийг өгч, зөв хариултын тоо болон оноо тооцогдоно.",
    Icon: IconTarget,
    color: "#c83030",
    bg: "#fff0f0",
  },
  {
    step: "04",
    title: "Ахиц харах",
    desc: "Profile дээр нийт оноо, тестийн түүх, дууссан хичээл, суралцалтын ахиц харагдана.",
    Icon: IconCheck,
    color: "#2a9a52",
    bg: "#edfaf2",
  },
];

const FEATURES = [
  {
    Icon: IconBook,
    title: "Бүтэцтэй хичээл",
    desc: "Анхан шатаас ахисан шат хүртэл үсэг, үг, өгүүлбэр, дүрмийн агуулгыг дараалалтай судална.",
    color: "#1a6bbd",
    bg: "#e8f3ff",
    delay: 1,
  },
  {
    Icon: IconWrite,
    title: "Монгол бичгийн гар",
    desc: "Тусгай keyboard шаардлагагүй. Веб дээрх гараар монгол бичгийн үсэг, үгийг бичиж дадлага хийнэ.",
    color: "#2a9a52",
    bg: "#edfaf2",
    delay: 2,
  },
  {
    Icon: IconGame,
    title: "Бататгах тоглоом",
    desc: "Тааруулах, хурдны тест, өгүүлбэр нийлүүлэх зэрэг тоглоомоор хичээлээ давтана.",
    color: "#c97b2a",
    bg: "#fff8ed",
    delay: 3,
  },
  {
    Icon: IconTarget,
    title: "Оноо ба ахиц",
    desc: "Шалгалт, тоглоом, бичих дасгалаар оноо цуглуулж, профайл дээр суралцалтын ахицаа харна.",
    color: "#c83030",
    bg: "#fff0f0",
    delay: 4,
  },
];

const LEVELS = [
  {
    name: "Анхан шат",
    desc: "Үсэг таних, энгийн үг",
    color: "#1a6bbd",
    n: "I",
  },
  { name: "Дунд шат I", desc: "Нөхцөл залгавар", color: "#2a9a52", n: "II" },
  { name: "Дунд шат II", desc: "Үйл үгийн хэлбэр", color: "#c97b2a", n: "III" },
  { name: "Дэвшилтэт I", desc: "Өгүүлбэрийн бүтэц", color: "#c83030", n: "IV" },
  {
    name: "Дэвшилтэт II",
    desc: "Унших эх, богино текст",
    color: "#7c5cbf",
    n: "V",
  },
  {
    name: "Ахисан шат",
    desc: "Найруулга, ойлгоц, хэрэглээ",
    color: "#1a9e8a",
    n: "VI",
  },
];

const SCRIPT_COLS = [
  "ᠮᠣᠩᠭᠣᠯ ᠪᠢᠴᠢᠭ᠌ ᠢ ᠰᠤᠷᠬᠤ",
  "ᠦᠰᠦᠭ ᠲᠠᠨᠢᠵᠤ ᠪᠢᠴᠢᠵᠦ ᠰᠤᠷᠬᠤ",
  "ᠬᠢᠴᠢᠶᠡᠯ ᠳᠠᠰᠬᠠᠯ ᠲᠣᠭᠯᠣᠭᠠᠮ",
];

const FLOATERS = [
  {
    key: "green",
    mg: "ᠮᠠᠨ ᠪ",
    label: "МАНАЙ",
    color: "#3ea55b",
    border: "#b8ecc8",
    pillBg: "#e8f7ec",
    className:
      " right-[80%] top-[50%] w-[140px] h-[235px] lg:w-[165px] lg:h-[270px] z-[2]",
    textSize: "lg" as const,
  },
  {
    key: "red",
    mg: "ᠭᠠᠯᠢᠭᠲᠠᠨ ᠳ᠋ᠤ",
    label: "ГАЛИГТАНД",
    color: "#d33a3a",
    border: "#f3b3b3",
    pillBg: "#fde8e8",
    className:
      "left-[19%] top-[4%] w-[150px] h-[255px] lg:w-[175px] lg:h-[350px] z-[4]",
    textSize: "lg" as const,
  },
  {
    key: "orange",
    mg: "ᠲᠠᠪᠲᠠᠢ",
    label: "ТАВТАЙ",
    color: "#c9801f",
    border: "#efd39b",
    pillBg: "#fff3d8",
    className:
      "left-[48%] top-[50%] w-[140px] h-[235px] lg:w-[165px] lg:h-[270px] z-[2]",
    textSize: "lg" as const,
  },
  {
    key: "blue",
    mg: "ᠮᠣᠷᠢᠯᠠ!",
    label: "МОРИЛ!",
    color: "#2c6fca",
    border: "#b8d9ff",
    pillBg: "#e8f3ff",
    className:
      "left-[75%] top-[3%] w-[135px] h-[230px] lg:w-[160px] lg:h-[290px] z-[3]",
    textSize: "lg" as const,
  },
];

export function HomePage() {
  const router = useRouter();
  const { goTo, isLoggedIn, openAuthModal } = useAppStore();

  function openDict() {
    goTo("dict");
    router.push("/dict");
  }

  function continueLesson() {
    goTo("lessons");
    router.push("/lessons");
  }

  return (
    <div className="bg-paper overflow-x-hidden">
      <section className="relative min-h-[calc(100vh-64px)] flex items-center overflow-hidden">
        <div className="hero-orb w-[500px] h-[500px] bg-sky-100/50 top-[-120px] left-[-160px]" />
        <div
          className="hero-orb w-[380px] h-[380px] bg-sand-100/40 bottom-[-80px] right-[-100px]"
          style={{ animationDelay: "-3s" }}
        />
        <div
          className="hero-orb w-[280px] h-[280px] bg-grass-100/30 top-[30%] right-[8%]"
          style={{ animationDelay: "-6s" }}
        />

        <div className="absolute left-5 top-0 bottom-0 flex gap-4 pointer-events-none select-none opacity-[0.05]">
          {SCRIPT_COLS.map((col, i) => (
            <span
              key={i}
              className="font-mongolian text-ink"
              style={{
                writingMode: "vertical-lr",
                fontSize: 12,
                letterSpacing: 5,
              }}>
              {col}
            </span>
          ))}
        </div>

        <div className="absolute right-5 top-0 bottom-0 flex gap-4 pointer-events-none select-none opacity-[0.05]">
          {[...SCRIPT_COLS].reverse().map((col, i) => (
            <span
              key={i}
              className="font-mongolian text-ink"
              style={{
                writingMode: "vertical-lr",
                fontSize: 12,
                letterSpacing: 5,
              }}>
              {col}
            </span>
          ))}
        </div>

        <div className="relative z-10 w-full max-w-[1280px] mx-auto px-6 pt-16 lg:pt-8 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1.02fr_0.98fr] gap-10 lg:gap-12 items-center">
            <div className="max-w-[650px]">
              <div
                className="page-enter inline-flex items-center gap-2 bg-sky-50 border-2 border-sky-100 text-sky-300 text-[13px] lg:text-[15px] font-extrabold px-5 py-2.5 rounded-full mb-6"
                style={{ animationDelay: ".03s" }}>
                Үндэсний Монгол бичиг
              </div>

              <div className="page-enter" style={{ animationDelay: ".08s" }}>
                <h1 className="text-[clamp(46px,7vw,88px)] font-black leading-[0.95] tracking-[-3px] text-balance text-left mb-5">
                  <span className="block text-ink">GALIGTAN</span>
                  <span className="block text-sky-300">Сур · Бич · Тогло</span>
                </h1>
              </div>

              <div
                className="page-enter flex items-center gap-5 lg:gap-7 mb-7"
                style={{ animationDelay: ".14s" }}>
                {"ᠮᠣᠩᠭᠣᠯ".split("").map((ch, i) => (
                  <span
                    key={i}
                    className="font-mongolian text-sand-300 animate-bob"
                    style={{
                      writingMode: "vertical-lr",
                      fontSize: "clamp(24px,3.4vw,40px)",
                      height: 58,
                      animationDelay: `${i * -0.45}s`,
                      opacity: 1 - i * 0.06,
                    }}>
                    {ch}
                  </span>
                ))}
              </div>

              <p
                className="page-enter text-[clamp(15px,1.8vw,18px)] text-ink-muted font-semibold leading-[1.75] mb-3 max-w-[560px]"
                style={{ animationDelay: ".2s" }}>
                Монгол бичгийн үсэг, дуудлага, бичлэгийг хичээл, дасгал,
                тоглоомоор алхам алхмаар сурах веб систем.
              </p>

              <p
                className="page-enter text-[clamp(14px,1.6vw,17px)] text-ink-muted font-semibold leading-[1.8] mb-8 max-w-[580px]"
                style={{ animationDelay: ".25s" }}>
                Нэвтэрсний дараа сурагч хичээлээ үргэлжлүүлж, тест өгч, тоглоом
                болон бичих дасгалаар оноо цуглуулна.
              </p>

              <div
                className="page-enter flex gap-3 flex-wrap"
                style={{ animationDelay: ".3s" }}>
                {isLoggedIn ? (
                  <button
                    onClick={continueLesson}
                    className="inline-flex items-center gap-2 bg-sky-300 hover:bg-sky-200 text-white font-extrabold text-[15px] rounded-2xl px-8 py-3.5 transition-all hover:-translate-y-0.5 shadow-[0_6px_24px_rgba(26,107,189,.3)]">
                    Хичээл үргэлжлүүлэх
                    <IconArrowR size={16} strokeWidth={2.5} />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => openAuthModal("up")}
                      className="inline-flex items-center gap-2 bg-sky-300 hover:bg-sky-200 text-white font-extrabold text-[15px] rounded-2xl px-8 py-3.5 transition-all hover:-translate-y-0.5 shadow-[0_6px_24px_rgba(26,107,189,.3)]">
                      Үнэгүй эхлэх
                      <IconArrowR size={16} strokeWidth={2.5} />
                    </button>

                    <button
                      onClick={() => openAuthModal("in")}
                      className="inline-flex items-center gap-2 bg-white border-2 border-paper-100 hover:border-sky-100 hover:bg-sky-50 text-ink font-bold text-[14px] rounded-2xl px-7 py-3.5 transition-all hover:-translate-y-0.5">
                      Нэвтрэх
                    </button>
                  </>
                )}

                <button
                  onClick={openDict}
                  className="inline-flex items-center gap-2 bg-white border-2 border-paper-100 hover:border-paper-100 hover:bg-paper-50 text-ink font-bold text-[14px] rounded-2xl px-7 py-3.5 transition-all hover:-translate-y-0.5">
                  Толь бичиг
                </button>
              </div>
            </div>

            <div className="relative h-[360px] md:h-[400px] lg:h-[470px]">
              {FLOATERS.map((f, i) => (
                <div
                  key={f.key}
                  className={`absolute rounded-[28px] bg-white border-[3px] shadow-[0_14px_30px_rgba(20,28,40,.06)] flex flex-col items-center justify-between py-5 lg:py-6 ${f.className} ${
                    i === 0
                      ? "animate-bob"
                      : i === 1
                        ? "animate-bob-2"
                        : i === 2
                          ? "animate-bob-3"
                          : "animate-bob-4"
                  }`}
                  style={{ borderColor: f.border }}>
                  <div className="flex-1 flex items-center justify-center">
                    <MongolianText
                      size={f.textSize}
                      color={f.color}
                      className="drop-shadow-sm">
                      {f.mg}
                    </MongolianText>
                  </div>

                  <span
                    className="text-[13px] lg:text-[15px] font-black px-4 py-2 rounded-full leading-none"
                    style={{ backgroundColor: f.pillBg, color: f.color }}>
                    {f.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {/* 
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-35 pointer-events-none">
            <p className="text-[10px] font-bold text-ink-muted tracking-[3px] uppercase">
              Дэлгэрэнгүй
            </p>
            <div className="w-5 h-8 border-2 border-ink-muted rounded-full flex justify-center pt-1.5">
              <div className="w-1 h-2 bg-ink-muted rounded-full animate-bounce" />
            </div>
          </div> */}
        </div>
      </section>

      <section className="border-y border-paper-100 bg-white py-12">
        <div className="max-w-[860px] mx-auto px-6 grid grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <ScrollReveal key={s.label} type="scale" delay={(i + 1) as any}>
              <div className="text-center group cursor-default">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 transition-transform group-hover:scale-110"
                  style={{ background: s.bg }}>
                  <s.Icon size={22} color={s.color} strokeWidth={1.8} />
                </div>
                <p
                  className="text-[36px] font-black leading-none"
                  style={{ color: s.color }}>
                  {s.n}
                </p>
                <p className="text-[12px] font-bold text-ink-muted mt-1.5">
                  {s.label}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="max-w-[960px] mx-auto px-6 py-18">
        <ScrollReveal>
          <div className="text-center mb-10">
            <p className="text-[11px] font-extrabold text-grass-300 uppercase tracking-[3px] mb-3">
              Системийн үндсэн урсгал
            </p>
            <h2 className="text-[clamp(26px,4vw,40px)] font-black tracking-[-2px]">
              Сурагч хэрхэн суралцах вэ?
            </h2>
            <p className="text-[14px] text-ink-muted font-semibold leading-[1.8] max-w-[560px] mx-auto mt-3">
              GALIGTAN систем нь хичээл, бататгал, шалгалт, ахицын мэдээллийг
              нэг урсгалд холбож өгсөн.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-4 gap-4">
          {SYSTEM_FLOW.map((item, i) => (
            <ScrollReveal key={item.title} delay={((i % 4) + 1) as any}>
              <div className="bg-white border border-paper-100 rounded-3xl p-5 h-full relative overflow-hidden group hover:-translate-y-1.5 hover:shadow-[0_10px_36px_rgba(26,26,46,.1)] transition-all duration-300">
                <div
                  className="absolute -right-5 -top-5 w-20 h-20 rounded-full opacity-40"
                  style={{ background: item.bg }}
                />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ background: item.bg }}>
                      <item.Icon
                        size={20}
                        color={item.color}
                        strokeWidth={1.8}
                      />
                    </div>

                    <span
                      className="text-[12px] font-black"
                      style={{ color: item.color }}>
                      {item.step}
                    </span>
                  </div>

                  <h3
                    className="text-[16px] font-black mb-2"
                    style={{ color: item.color }}>
                    {item.title}
                  </h3>

                  <p className="text-[12px] text-ink-muted font-semibold leading-[1.75]">
                    {item.desc}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="max-w-[860px] mx-auto px-6 py-20">
        <ScrollReveal>
          <div className="text-center mb-12">
            <p className="text-[11px] font-extrabold text-sky-300 uppercase tracking-[3px] mb-3">
              Онцлог
            </p>
            <h2 className="text-[clamp(26px,4vw,40px)] font-black tracking-[-2px]">
              Яагаад энэ систем?
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 gap-5">
          {FEATURES.map(({ Icon, title, desc, color, bg, delay }) => (
            <ScrollReveal key={title} delay={delay as any}>
              <div className="group bg-white border border-paper-100 rounded-3xl p-7 hover:-translate-y-1.5 hover:shadow-[0_10px_36px_rgba(26,26,46,.1)] transition-all duration-300 cursor-default h-full">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110"
                  style={{ background: bg }}>
                  <Icon size={22} color={color} strokeWidth={1.8} />
                </div>

                <h3 className="text-[17px] font-black mb-2" style={{ color }}>
                  {title}
                </h3>

                <p className="text-[13px] text-ink-muted font-semibold leading-[1.8]">
                  {desc}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="bg-[#1a1a2e] py-20 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.03]">
          <span
            className="font-mongolian text-white"
            style={{
              writingMode: "vertical-lr",
              fontSize: 220,
              letterSpacing: 24,
            }}>
            ᠮᠣᠩᠭᠣᠯ
          </span>
        </div>

        <div className="max-w-[860px] mx-auto px-6 relative z-10">
          <ScrollReveal>
            <div className="text-center mb-12">
              <p className="text-[11px] font-extrabold text-white/30 uppercase tracking-[3px] mb-3">
                Суралцалтын зам
              </p>
              <h2 className="text-[clamp(24px,4vw,40px)] font-black text-white tracking-[-2px]">
                Анхан шатаас ахисан шат
              </h2>
            </div>
          </ScrollReveal>

          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-white/10" />

            <div className="flex flex-col gap-3">
              {LEVELS.map((lvl, i) => (
                <ScrollReveal
                  key={lvl.name}
                  type="left"
                  delay={((i % 5) + 1) as any}>
                  <div className="flex items-center gap-5 group">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 relative z-10 transition-transform group-hover:scale-110 border-2"
                      style={{
                        background: lvl.color + "20",
                        borderColor: lvl.color + "60",
                      }}>
                      <span
                        className="text-[13px] font-black"
                        style={{ color: lvl.color }}>
                        {lvl.n}
                      </span>
                    </div>

                    <div className="flex-1 bg-white/5 hover:bg-white/8 border border-white/10 rounded-2xl px-5 py-3.5 transition-all">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-extrabold text-white">
                          {lvl.name}
                        </span>

                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                          style={{
                            background: lvl.color + "30",
                            color: lvl.color,
                          }}>
                          {i + 1}-р дэвшил
                        </span>
                      </div>

                      <p className="text-[12px] text-white/45 font-semibold mt-0.5">
                        {lvl.desc}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-[860px] mx-auto px-6 py-20">
        <div className="grid grid-cols-2 gap-12 items-center">
          <ScrollReveal type="left">
            <div>
              <p className="text-[11px] font-extrabold text-sand-300 uppercase tracking-[3px] mb-3">
                GALIGTAN
              </p>

              <h2 className="text-[clamp(22px,3.5vw,36px)] font-black tracking-[-2px] mb-4">
                Босоо бичих
                <br />
                <span className="text-sand-300">уламжлалт бичиг</span>
              </h2>

              <p className="text-[13px] text-ink-muted font-semibold leading-[1.9] mb-6">
                Монгол бичиг нь дээрээс доош, зүүнээс баруун тийш бичигддэг
                онцлогтой. Энэ систем нь үсэг таних, дуудлага ойлгох, бичих
                дадлага хийх, шалгалтаар ахицаа баталгаажуулах боломжтой.
              </p>

              <div className="flex flex-col gap-3">
                {[
                  "Үсэг, үг, өгүүлбэрийг дараалалтай судална",
                  "Толь бичиг, бичих дасгал, тоглоомтой",
                  "Тестийн оноо, profile-ийн ахицтай холбогдоно",
                ].map((text) => (
                  <div
                    key={text}
                    className="flex items-center gap-3 text-[13px] font-semibold text-ink-muted">
                    <div className="w-5 h-5 rounded-full bg-grass-50 border border-grass-100 flex items-center justify-center shrink-0">
                      <IconCheck size={11} color="#2a9a52" strokeWidth={2.5} />
                    </div>
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal type="right">
            <div className="bg-[#1a1a2e] rounded-3xl p-10 flex justify-center items-center gap-8 min-h-[240px] relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute w-48 h-48 rounded-full bg-sky-300 blur-[50px] top-0 left-0" />
              </div>

              {["ᠮᠣᠩᠭᠣᠯ", "ᠪᠢᠴᠢᠭ᠌", "ᠰᠤᠷᠬᠤ"].map((word, i) => (
                <span
                  key={i}
                  className="font-mongolian animate-bob relative z-10"
                  style={{
                    writingMode: "vertical-lr",
                    fontSize: 26,
                    color: ["#4a9ede", "#f0a030", "#3dba68"][i],
                    animationDelay: `${i * -1.2}s`,
                    minHeight: 100,
                  }}>
                  {word}
                </span>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {!isLoggedIn && (
        <section className="pb-20 px-6">
          <ScrollReveal type="scale">
            <div className="max-w-[680px] mx-auto bg-sky-300 rounded-3xl p-12 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-[0.08] flex justify-center items-center pointer-events-none select-none">
                <span
                  className="font-mongolian text-white"
                  style={{
                    writingMode: "vertical-lr",
                    fontSize: 180,
                    letterSpacing: 32,
                  }}>
                  ᠰᠤᠷ
                </span>
              </div>

              <div className="relative z-10">
                <p className="text-white/70 font-bold text-[11px] uppercase tracking-[3px] mb-3">
                  Өнөөдрөөс эхэл
                </p>

                <h2 className="text-[clamp(22px,4vw,38px)] font-black text-white mb-4 tracking-[-1.5px]">
                  Монгол бичгийн аялалд нэгд
                </h2>

                <p className="text-white/75 font-semibold text-[14px] mb-8 max-w-[340px] mx-auto leading-relaxed">
                  Бүртгэл бүрэн үнэгүй. Хичээл, тоглоом, толь бичиг, бичих
                  дасгалаа нэг системээс ашиглана.
                </p>

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => openAuthModal("up")}
                    className="inline-flex items-center gap-2 bg-white text-sky-300 font-extrabold text-[15px] px-8 py-3.5 rounded-2xl hover:bg-sky-50 transition-all hover:-translate-y-0.5 shadow-[0_4px_16px_rgba(0,0,0,.12)]">
                    Бүртгүүлэх
                    <IconArrowR size={16} strokeWidth={2.5} />
                  </button>

                  <button
                    onClick={() => openAuthModal("in")}
                    className="inline-flex items-center gap-2 bg-white/20 border border-white/30 text-white font-bold text-[14px] px-6 py-3.5 rounded-2xl hover:bg-white/30 transition-all">
                    Нэвтрэх
                  </button>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>
      )}
    </div>
  );
}
