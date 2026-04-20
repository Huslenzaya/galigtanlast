"use client";

import { AppContainer } from "@/components/layout/AppContainer";
import { cn } from "@/lib/utils";

interface PageHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  mongolText?: string;
  variant?: "dark" | "sky" | "purple" | "sand" | "grass" | "ember";
}

const VARIANTS = {
  dark: {
    bg: "from-[#1a1a2e] to-[#1a3a5e]",
    eyebrow: "text-white/40",
    desc: "text-white/55",
  },
  sky: {
    bg: "from-sky-300 to-[#1a4e8a]",
    eyebrow: "text-sky-100/70",
    desc: "text-sky-100/70",
  },
  purple: {
    bg: "from-[#2a1a3e] to-[#1a1a2e]",
    eyebrow: "text-purple-200/60",
    desc: "text-white/55",
  },
  sand: {
    bg: "from-sand-300 to-[#6b3f1d]",
    eyebrow: "text-white/60",
    desc: "text-white/70",
  },
  grass: {
    bg: "from-grass-300 to-[#173f32]",
    eyebrow: "text-white/60",
    desc: "text-white/70",
  },
  ember: {
    bg: "from-ember-300 to-[#5a1d1d]",
    eyebrow: "text-white/60",
    desc: "text-white/70",
  },
};

export function PageHero({
  eyebrow,
  title,
  description,
  mongolText = "ᠮᠣᠩᠭᠣᠯ",
  variant = "dark",
}: PageHeroProps) {
  const style = VARIANTS[variant];

  return (
    <section
      className={cn(
        "bg-gradient-to-r text-white mb-8 py-12 relative overflow-hidden",
        style.bg,
      )}>
      <div className="absolute right-10 top-0 bottom-0 opacity-[0.08] flex items-center gap-6 pointer-events-none select-none">
        <span
          className="font-mongolian text-white"
          style={{
            writingMode: "vertical-lr",
            fontSize: 92,
            letterSpacing: 8,
            lineHeight: 1,
          }}>
          {mongolText}
        </span>
      </div>

      <AppContainer size="6xl" className="relative z-10">
        <p
          className={cn(
            "text-[11px] font-extrabold uppercase tracking-[4px] mb-3",
            style.eyebrow,
          )}>
          {eyebrow}
        </p>

        <h1 className="text-[40px] font-black tracking-tight leading-tight">
          {title}
        </h1>

        <p
          className={cn(
            "font-semibold mt-4 text-[15px] leading-relaxed max-w-[560px]",
            style.desc,
          )}>
          {description}
        </p>
      </AppContainer>
    </section>
  );
}
