"use client";
import { useEffect } from "react";

/** 
 * Drop this once in layout — it watches for .reveal* elements
 * and adds .revealed when they enter the viewport.
 */
export function RevealObserver() {
 useEffect(() => {
  const obs = new IntersectionObserver(
   (entries) => {
    entries.forEach(e => {
     if (e.isIntersecting) {
      e.target.classList.add("revealed");
      obs.unobserve(e.target);
     }
    });
   },
   { threshold: 0.12 }
  );

  function observe() {
   document.querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-scale")
    .forEach(el => {
     if (!el.classList.contains("revealed")) obs.observe(el);
    });
  }

  observe();
  // Re-observe when new elements appear (page navigation)
  const mutObs = new MutationObserver(observe);
  mutObs.observe(document.body, { childList: true, subtree: true });

  return () => { obs.disconnect(); mutObs.disconnect(); };
 }, []);

 return null;
}
