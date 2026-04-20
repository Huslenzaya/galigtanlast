"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ToastProps {
 message: string;
 type: "ok" | "bad" | "info";
 onDone: () => void;
}

export function Toast({ message, type, onDone }: ToastProps) {
 const [visible, setVisible] = useState(false);

 useEffect(() => {
  const show = setTimeout(() => setVisible(true), 10);
  const hide = setTimeout(() => {
   setVisible(false);
   setTimeout(onDone, 350);
  }, 1900);
  return () => { clearTimeout(show); clearTimeout(hide); };
 }, [onDone]);

 return (
  <div
   className={cn(
    "fixed bottom-7 left-1/2 -translate-x-1/2 z-50",
    "flex items-center gap-2 px-6 py-3 rounded-2xl",
    "text-white text-[15px] font-extrabold whitespace-nowrap shadow-medium",
    "transition-all duration-300",
    visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
    type === "ok" && "bg-grass-300",
    type === "bad" && "bg-ember-300",
    type === "info" && "bg-ink"
   )}
  >
   {message}
  </div>
 );
}

// ── Toast hook ────────────────────────────────────────────────
interface ToastState {
 id: number;
 message: string;
 type: "ok" | "bad" | "info";
}

let toastQueue: ToastState[] = [];
let listeners: Array<(q: ToastState[]) => void> = [];

function notifyListeners() {
 listeners.forEach((fn) => fn([...toastQueue]));
}

export function showToast(message: string, type: "ok" | "bad" | "info" = "info") {
 const id = Date.now() + Math.random();
 toastQueue = [{ id, message, type }];
 notifyListeners();
}

export function ToastContainer() {
 const [toasts, setToasts] = useState<ToastState[]>([]);

 useEffect(() => {
  const fn = (q: ToastState[]) => setToasts(q);
  listeners.push(fn);
  return () => { listeners = listeners.filter((l) => l !== fn); };
 }, []);

 return (
  <>
   {toasts.map((t) => (
    <Toast
     key={t.id}
     message={t.message}
     type={t.type}
     onDone={() => {
      toastQueue = toastQueue.filter((q) => q.id !== t.id);
      notifyListeners();
     }}
    />
   ))}
  </>
 );
}
