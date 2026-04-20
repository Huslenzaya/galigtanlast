"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface AdminModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  size?: "md" | "lg" | "xl";
}

export function AdminModal({
  open,
  title,
  description,
  onClose,
  children,
  size = "lg",
}: AdminModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <button
        aria-label="Хаах"
        onClick={onClose}
        className="absolute inset-0 bg-[#1a1a2e]/45 backdrop-blur-sm animate-fade-in"
      />

      <div className="absolute inset-0 flex items-center justify-center px-4 py-8 pointer-events-none">
        <div
          className={cn(
            "pointer-events-auto w-full max-h-[90vh] overflow-hidden bg-white border-2 border-paper-100 rounded-[28px] shadow-[0_24px_80px_rgba(26,26,46,.22)]",
            "animate-[modalPop_.22s_ease-out]",
            size === "md" && "max-w-[520px]",
            size === "lg" && "max-w-[760px]",
            size === "xl" && "max-w-[980px]",
          )}>
          <div className="px-6 py-5 border-b-2 border-paper-100 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-[22px] font-black text-ink">{title}</h3>
              {description && (
                <p className="text-[13px] text-ink-muted font-semibold mt-1">
                  {description}
                </p>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-paper-50 border border-paper-100 text-ink-muted font-black hover:bg-ember-50 hover:text-ember-300 transition-all">
              ×
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-92px)]">
            {children}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes modalPop {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.18s ease-out;
        }
      `}</style>
    </div>
  );
}
