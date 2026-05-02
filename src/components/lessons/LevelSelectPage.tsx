"use client";

import {
  IconAward,
  IconBook,
  IconGlobe,
  IconLayers,
  IconPen,
  IconTarget,
} from "@/components/ui/Icons";
import { LEVEL_META } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";

const LEVEL_TONES = {
  sky: "bg-sky-50 border-sky-100 text-sky-300",
  grass: "bg-grass-50 border-grass-100 text-grass-300",
  sand: "bg-sand-50 border-sand-100 text-sand-300",
  ember: "bg-ember-50 border-ember-100 text-ember-300",
  purple: "bg-[#f1ecfb] border-[#d8c8f1] text-[#7c5cbf]",
  teal: "bg-[#e6f7f4] border-[#b9e6df] text-[#1a9e8a]",
} as const;

function LevelIcon({ icon }: { icon: string }) {
  const props = { size: 22, strokeWidth: 2.2 };

  if (icon === "layers") return <IconLayers {...props} />;
  if (icon === "pen") return <IconPen {...props} />;
  if (icon === "target") return <IconTarget {...props} />;
  if (icon === "award") return <IconAward {...props} />;
  if (icon === "globe") return <IconGlobe {...props} />;
  return <IconBook {...props} />;
}

export function LevelSelectPage() {
  const router = useRouter();
  const { startQuiz } = useAppStore();

  function pickLevel(n: number) {
    const topic = n <= 3 ? `l${n}` : "default";
    startQuiz(topic, true);
    router.push("/quiz");
  }

  return (
    <div className="max-w-[720px] mx-auto px-6 py-8">
      <p className="text-[26px] font-black tracking-tight mb-1.5">
        Түвшингоо сонго
      </p>
      <p className="text-[14px] text-ink-muted font-semibold mb-7">
        Өөрийн мэдлэгийн түвшинд тохирох ангиллаа сонго, эсвэл шалгалт өгч
        автоматаар тодорхойлуул
      </p>

      <button
        onClick={() => router.push("/placement")}
        className="w-full flex items-center gap-4 bg-sky-50 border-2 border-sky-100 rounded-2xl p-4 mb-5 hover:bg-sky-100 transition-all text-left">
        <span className="text-[28px]"></span>
        <div className="flex-1">
          <p className="text-[15px] font-extrabold text-sky-300">
            Түвшин тогтоох шалгалт өгөх
          </p>
          <p className="text-[12px] text-sky-300 font-semibold opacity-80">
            12 асуулт · ~3 минут · Автоматаар тодорхойлно
          </p>
        </div>
        <span className="text-[20px] text-sky-300"></span>
      </button>

      <div className="text-center text-[11px] font-extrabold text-ink-muted tracking-[0.5px] uppercase mb-4">
        — эсвэл өөрөө сонго —
      </div>

      {LEVEL_META.map((lvl) => {
        const tone =
          LEVEL_TONES[lvl.tone as keyof typeof LEVEL_TONES] ?? LEVEL_TONES.sky;

        return (
        <button
          key={lvl.n}
          onClick={() => pickLevel(lvl.n)}
          className="w-full flex items-center gap-4 bg-white border-2 border-paper-100 rounded-2xl p-5 mb-3 hover:border-sky-100 hover:bg-sky-50 hover:translate-x-1 transition-all text-left">
          <div
            className={cn(
              "w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0",
              tone,
            )}>
            <LevelIcon icon={lvl.icon} />
          </div>
          <div className="flex-1">
            <p className="text-[15px] font-extrabold text-ink">
              {lvl.title}
            </p>
            <p className="text-[12px] text-ink-muted font-semibold mt-0.5">
              {lvl.description}
            </p>
          </div>
          <span className="text-[20px] text-ink-muted"></span>
        </button>
      )})}
    </div>
  );
}
