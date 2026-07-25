/**
 * gsap.ts — client-side scroll reveals + stat counters. Imported by BaseLayout
 * as a module script (runs once per page). Respects prefers-reduced-motion.
 *
 * Usage in markup:
 *   <div data-reveal>...</div>                     fade-up on scroll
 *   <div data-reveal data-reveal-delay="0.1">...   staggered
 *   <span data-count-to="500" data-count-suffix="+">0</span>  animated counter
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function initAnimations() {
  if (typeof window === "undefined") return;

  const reduce = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // Reveals
  const revealEls = gsap.utils.toArray<HTMLElement>("[data-reveal]");
  if (reduce) {
    revealEls.forEach((el) => el.classList.add("is-revealed"));
  } else {
    gsap.registerPlugin(ScrollTrigger);
    revealEls.forEach((el) => {
      const delay = parseFloat(el.dataset.revealDelay || "0");
      gsap.fromTo(
        el,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          delay,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            once: true,
            onEnter: () => el.classList.add("is-revealed"),
          },
          onComplete: () => el.classList.add("is-revealed"),
        },
      );
    });
  }

  // Stat counters
  const counters = gsap.utils.toArray<HTMLElement>("[data-count-to]");
  counters.forEach((el) => {
    const target = parseFloat(el.dataset.countTo || "0");
    const suffix = el.dataset.countSuffix || "";
    const prefix = el.dataset.countPrefix || "";
    const decimals = parseInt(el.dataset.countDecimals || "0", 10);
    if (reduce) {
      el.textContent = `${prefix}${target.toFixed(decimals)}${suffix}`;
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    const obj = { val: 0 };
    gsap.to(obj, {
      val: target,
      duration: 1.6,
      ease: "power1.out",
      scrollTrigger: { trigger: el, start: "top 90%", once: true },
      onUpdate: () => {
        el.textContent = `${prefix}${obj.val.toFixed(decimals)}${suffix}`;
      },
    });
  });
}
