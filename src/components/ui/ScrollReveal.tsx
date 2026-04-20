"use client";
import { useEffect, useRef } from "react";

/**
 * Wraps children in a div that animates in when it enters the viewport.
 * Uses IntersectionObserver — zero dependency.
 */
interface Props {
 children: React.ReactNode;
 className?: string;
 type?: "up" | "left" | "right" | "scale";
 delay?: 0 | 1 | 2 | 3 | 4 | 5;
 threshold?: number;
 as?: keyof JSX.IntrinsicElements;
}

export function ScrollReveal({
 children,
 className = "",
 type = "up",
 delay = 0,
 threshold = 0.15,
 as: Tag = "div",
}: Props) {
 const ref = useRef<HTMLElement>(null);

 useEffect(() => {
  const el = ref.current;
  if (!el) return;
  const obs = new IntersectionObserver(
   ([entry]) => { if (entry.isIntersecting) { el.classList.add("revealed"); obs.unobserve(el); } },
   { threshold }
  );
  obs.observe(el);
  return () => obs.disconnect();
 }, [threshold]);

 const revealClass =
  type === "left" ? "reveal-left" :
  type === "right" ? "reveal-right" :
  type === "scale" ? "reveal-scale" : "reveal";
 const delayClass = delay > 0 ? `reveal-delay-${delay}` : "";

 return (
  // @ts-ignore — dynamic tag
  <Tag ref={ref} className={`${revealClass} ${delayClass} ${className}`}>
   {children}
  </Tag>
 );
}
