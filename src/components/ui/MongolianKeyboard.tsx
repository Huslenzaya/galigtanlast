"use client";

import { cn } from "@/lib/utils";
import { useRef, useState } from "react";

// Full keyboard with Mongolian Unicode script characters
const KB_VOWELS = [
  { mg: "ᠠ", latin: "A", mn: "а" },
  { mg: "ᠡ", latin: "E", mn: "э" },
  { mg: "ᠢ", latin: "I", mn: "и" },
  { mg: "ᠣ", latin: "O", mn: "о" },
  { mg: "ᠤ", latin: "U", mn: "у" },
  { mg: "ᠥ", latin: "Ö", mn: "ө" },
  { mg: "ᠦ", latin: "Ü", mn: "ү" },
];

const KB_CONSONANTS = [
  { mg: "ᠨ", latin: "N", mn: "н" },
  { mg: "ᠪ", latin: "B", mn: "б" },
  { mg: "ᠫ", latin: "P", mn: "п" },
  { mg: "ᠬ", latin: "H", mn: "х" },
  { mg: "ᠭ", latin: "G", mn: "г" },
  { mg: "ᠮ", latin: "M", mn: "м" },
  { mg: "ᠯ", latin: "L", mn: "л" },
  { mg: "ᠰ", latin: "S", mn: "с" },
  { mg: "ᠱ", latin: "Sh", mn: "ш" },
  { mg: "ᠲ", latin: "T", mn: "т" },
  { mg: "ᠳ", latin: "D", mn: "д" },
  { mg: "ᠴ", latin: "Ch", mn: "ч" },
  { mg: "ᠵ", latin: "J", mn: "ж" },
  { mg: "ᠶ", latin: "Y", mn: "я" },
  { mg: "ᠷ", latin: "R", mn: "р" },
  { mg: "ᠸ", latin: "W", mn: "в" },
  { mg: "ᠺ", latin: "K", mn: "к" },
  { mg: "ᠼ", latin: "Ts", mn: "ц" },
  { mg: "ᠽ", latin: "Z", mn: "з" },
];

// Common word suggestions (type-ahead)
const COMMON_WORDS: { mg: string; mn: string }[] = [
  { mg: "ᠮᠣᠩᠭᠣᠯ", mn: "Монгол" },
  { mg: "ᠮᠣᠷᠢ", mn: "Морь" },
  { mg: "ᠭᠡᠷ", mn: "Гэр" },
  { mg: "ᠬᠦᠮᠦᠨ", mn: "Хүн" },
  { mg: "ᠤᠰᠤ", mn: "Ус" },
  { mg: "ᠨᠠᠷ", mn: "Нар" },
  { mg: "ᠭᠠᠵᠠᠷ", mn: "Газар" },
  { mg: "ᠲᠡᠩᠭᠡᠷ", mn: "Тэнгэр" },
  { mg: "ᠴᠠᠭ", mn: "Цаг" },
  { mg: "ᠪᠢᠴᠢᠬᠦ", mn: "Бичих" },
  { mg: "ᠤᠩᠰᠢᠬᠤ", mn: "Унших" },
  { mg: "ᠰᠠᠶᠢᠨ", mn: "Сайн" },
];

interface MongolianKeyboardProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  placeholder?: string;
  mode?: "inline" | "toggle";
  showMn?: boolean;
}

function cleanPastedText(text: string) {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\t/g, " ");
}

export function MongolianKeyboard({
  value,
  onChange,
  label,
  placeholder = "ᠮᠣᠩᠭᠣᠯ ᠪᠢᠴᠢᠭ᠌ — дарж бичнэ",
  mode = "toggle",
  showMn = true,
}: MongolianKeyboardProps) {
  const [open, setOpen] = useState(mode === "inline");
  const [activeTab, setActiveTab] = useState<"vowels" | "consonants">("vowels");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const suggestions =
    value.length > 0
      ? COMMON_WORDS.filter(
          (w) => w.mg.startsWith(value) && w.mg !== value,
        ).slice(0, 4)
      : [];

  const charCount = [...value].length;

  const displayHeight =
    charCount > 220 ? 220 : charCount > 120 ? 190 : charCount > 40 ? 150 : 110;

  const previewHeight =
    charCount > 220 ? 180 : charCount > 120 ? 160 : charCount > 40 ? 130 : 92;

  const displayFontSize =
    charCount > 260 ? 18 : charCount > 160 ? 19 : charCount > 80 ? 20 : 22;

  function focusInput() {
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length,
      );
    });
  }

  function press(char: string) {
    onChange(value + char);
    focusInput();
  }

  function backspace() {
    const arr = [...value];
    arr.pop();
    onChange(arr.join(""));
    focusInput();
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      onChange(cleanPastedText(value + text));
      if (!open && mode === "toggle") setOpen(true);
      focusInput();
    } catch {
      // ignore clipboard permission errors
    }
  }

  const verticalValue = (
    <span
      className="font-mongolian text-sand-300 inline-block select-none whitespace-pre-wrap break-all"
      style={{
        writingMode: "vertical-lr",
        textOrientation: "mixed",
        fontSize: displayFontSize,
        lineHeight: 1.9,
        letterSpacing: "1px",
        height: displayHeight,
        minHeight: displayHeight,
      }}>
      {value}
    </span>
  );

  const inputDisplay = (
    <div
      className={cn(
        "relative w-full border-2 rounded-2xl px-4 py-3 bg-white flex items-start gap-3 transition-all",
        mode === "toggle" ? "cursor-text hover:border-sky-100" : "",
        open
          ? "border-sky-100 shadow-[0_0_0_3px_rgba(26,107,189,.1)]"
          : "border-paper-100",
      )}
      onClick={() => {
        if (mode === "toggle") setOpen(true);
        focusInput();
      }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={(e) => {
          e.preventDefault();
          const pasted = e.clipboardData.getData("text");
          onChange(cleanPastedText(pasted));
          if (!open && mode === "toggle") setOpen(true);
          focusInput();
        }}
        onKeyDown={(e) => {
          if (mode === "toggle" && e.key === "Escape") {
            setOpen(false);
          }
        }}
        className="absolute inset-0 opacity-0 pointer-events-none"
        aria-label={label || "Монгол бичиг"}
      />

      <div className="flex-1 min-w-0">
        {value ? (
          <div className="w-full overflow-x-auto overflow-y-hidden">
            <div className="inline-block pr-2 align-top">{verticalValue}</div>
          </div>
        ) : (
          <div className="min-h-[88px] flex flex-col justify-center">
            <span className="text-[13px] text-ink-muted font-semibold select-none">
              {placeholder}
            </span>
            <span className="text-[11px] text-ink-muted/70 font-semibold mt-1 select-none">
              Paste хийх бол энэ хэсэг дээр дараад Ctrl+V / Cmd+V
            </span>
          </div>
        )}
      </div>

      <div className="flex items-start gap-1.5 shrink-0 pt-1">
        {value && (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onChange("");
              focusInput();
            }}
            className="w-6 h-6 rounded-full bg-paper-100 hover:bg-ember-100 hover:text-ember-300 flex items-center justify-center text-[11px] font-black text-ink-muted transition-all">
            ×
          </button>
        )}

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            pasteFromClipboard();
          }}
          className="text-[11px] font-bold text-sky-300 px-2 py-0.5 rounded-lg hover:bg-sky-50 transition-all">
          Paste
        </button>

        {value && (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              backspace();
            }}
            className="text-[11px] font-bold text-ink-muted hover:text-ink px-2 py-0.5 rounded-lg hover:bg-paper-100 transition-all">
            ⌫
          </button>
        )}

        {mode === "toggle" && (
          <span className="text-[10px] font-extrabold text-sky-300 pt-0.5">
            {open ? "▲" : "▼"}
          </span>
        )}
      </div>
    </div>
  );

  const keyboard = (
    <div
      className={cn(
        "bg-white border-2 border-paper-100 rounded-2xl overflow-hidden shadow-medium",
        mode === "toggle" && "mt-1.5 animate-fade-up",
      )}>
      <div className="bg-paper-50 border-b-2 border-paper-100 px-3 py-2 flex items-center justify-between">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("vowels")}
            className={cn(
              "text-[11px] font-extrabold px-3 py-1.5 rounded-xl transition-all",
              activeTab === "vowels"
                ? "bg-sky-300 text-white"
                : "text-ink-muted hover:bg-paper-100",
            )}>
            Эгшиг ({KB_VOWELS.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("consonants")}
            className={cn(
              "text-[11px] font-extrabold px-3 py-1.5 rounded-xl transition-all",
              activeTab === "consonants"
                ? "bg-sand-300 text-white"
                : "text-ink-muted hover:bg-paper-100",
            )}>
            Гийгүүлэгч ({KB_CONSONANTS.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-ink-muted">
            Монгол Бичгийн Гар
          </span>
          <button
            type="button"
            onClick={pasteFromClipboard}
            className="text-[10px] font-extrabold text-sky-300 px-2 py-1 rounded-lg hover:bg-sky-50 transition-all">
            Paste
          </button>
        </div>
      </div>

      <div className="p-3">
        <div className="flex flex-wrap gap-1.5">
          {(activeTab === "vowels" ? KB_VOWELS : KB_CONSONANTS).map(
            ({ mg, latin, mn }) => (
              <button
                type="button"
                key={mg}
                onMouseDown={(e) => {
                  e.preventDefault();
                  press(mg);
                }}
                className="bg-paper-50 border-2 border-paper-100 hover:border-sky-100 hover:bg-sky-50 active:scale-90 rounded-xl p-2 flex flex-col items-center gap-0.5 transition-all min-w-[48px]">
                {showMn && (
                  <span className="text-[9px] font-extrabold text-ink-muted/60">
                    {mn}
                  </span>
                )}
                <span
                  className={cn(
                    "font-mongolian",
                    activeTab === "vowels" ? "text-sky-300" : "text-sand-300",
                  )}
                  style={{
                    writingMode: "vertical-lr",
                    fontSize: 20,
                    height: 26,
                  }}>
                  {mg}
                </span>
                <span className="text-[9px] font-extrabold text-ink-muted">
                  {latin}
                </span>
              </button>
            ),
          )}
        </div>

        <div className="flex gap-1.5 mt-2">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onChange(value + "\u180e");
              focusInput();
            }}
            className="flex-1 bg-paper-50 border-2 border-paper-100 hover:border-sky-100 text-[11px] font-bold text-ink-muted py-2 rounded-xl transition-all">
            ― Зай
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              backspace();
            }}
            disabled={!value}
            className="bg-ember-50 border-2 border-ember-100 text-ember-300 font-extrabold text-[11px] px-4 py-2 rounded-xl hover:bg-ember-100 disabled:opacity-30 transition-all">
            ⌫ Устгах
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onChange("");
              focusInput();
            }}
            disabled={!value}
            className="bg-paper-50 border-2 border-paper-100 text-ink-muted font-bold text-[11px] px-3 py-2 rounded-xl hover:bg-paper-100 disabled:opacity-30 transition-all">
            × Цэвэрлэх
          </button>
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="border-t-2 border-paper-100 px-3 py-2 flex gap-2 flex-wrap">
          <span className="text-[10px] font-extrabold text-ink-muted self-center">
            Санал:
          </span>
          {suggestions.map((s) => (
            <button
              type="button"
              key={s.mg}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(s.mg);
                focusInput();
              }}
              className="bg-sand-50 border-2 border-sand-100 hover:bg-sand-100 rounded-xl px-2.5 py-1 flex items-center gap-2 transition-all">
              <span
                className="font-mongolian text-sand-300"
                style={{
                  writingMode: "vertical-lr",
                  fontSize: 14,
                  height: 20,
                }}>
                {s.mg}
              </span>
              <span className="text-[11px] font-bold text-ink-muted">
                {s.mn}
              </span>
            </button>
          ))}
        </div>
      )}

      {value && (
        <div className="border-t-2 border-paper-100 bg-sand-50 px-4 py-3 flex items-start gap-3">
          <span className="text-[10px] font-extrabold text-sand-300 uppercase shrink-0 pt-1">
            Одоогийн утга:
          </span>

          <div className="flex-1 min-w-0 overflow-x-auto overflow-y-hidden">
            <div className="inline-block pr-2 align-top">
              <span
                className="font-mongolian text-sand-300 inline-block whitespace-pre-wrap break-all"
                style={{
                  writingMode: "vertical-lr",
                  textOrientation: "mixed",
                  fontSize: Math.max(displayFontSize - 1, 18),
                  lineHeight: 1.9,
                  letterSpacing: "1px",
                  height: previewHeight,
                  minHeight: previewHeight,
                }}>
                {value}
              </span>
            </div>
          </div>

          <span className="text-[11px] text-ink-muted font-semibold shrink-0 pt-1">
            {charCount} тэмдэгт
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full">
      {label && (
        <p className="text-[11px] font-extrabold text-ink-muted tracking-[0.3px] uppercase mb-1.5">
          {label}
        </p>
      )}
      {inputDisplay}
      {(open || mode === "inline") && keyboard}
    </div>
  );
}
