"use client";

import { LEVEL_OPTIONS } from "@/lib/data";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";

const COLORS: Record<number, string> = {
  1: "bg-sky-300",
  2: "bg-grass-300",
  3: "bg-sand-300",
  4: "bg-ember-300",
  5: "bg-[#7c5cbf]",
  6: "bg-[#1a9e8a]",
};

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

      {LEVEL_OPTIONS.map((lvl) => (
        <button
          key={lvl.n}
          onClick={() => pickLevel(lvl.n)}
          className="w-full flex items-center gap-4 bg-white border-2 border-paper-100 rounded-2xl p-5 mb-3 hover:border-sky-100 hover:bg-sky-50 hover:translate-x-1 transition-all text-left">
          <div
            className={`w-11 h-11 rounded-full ${COLORS[lvl.n]} flex items-center justify-center text-[20px] shrink-0`}></div>
          <div className="flex-1">
            <p className="text-[15px] font-extrabold text-ink">
              {lvl.grade} · {lvl.name}
            </p>
            <p className="text-[12px] text-ink-muted font-semibold mt-0.5">
              {lvl.desc}
            </p>
          </div>
          <span className="text-[20px] text-ink-muted"></span>
        </button>
      ))}
    </div>
  );
}
