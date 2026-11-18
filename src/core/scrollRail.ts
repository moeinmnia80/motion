import { scrollProgress } from "./scrollProgress";
import { prefersReducedMotion, type Cleanup } from "./utils";

export type ScrollRailOptions = {
  /** selector of the moving track inside the element. default [data-rail-track] */
  track?: string;
};

/**
 * Pinned horizontal scroll: vertical scroll moves the track sideways.
 * JS only measures and writes --progress; the motion is a CSS `translate`.
 * Reduced motion: it stays a plain horizontal scroller.
 */
export const scrollRail = (
  el: HTMLElement,
  { track = "[data-rail-track]" }: ScrollRailOptions = {},
): Cleanup | void => {
  const trackEl = el.querySelector<HTMLElement>(track);
  if (!trackEl || prefersReducedMotion()) return;

  const measure = () => {
    const distance = Math.max(0, trackEl.scrollWidth - window.innerWidth);
    el.style.setProperty("--rail-distance", `${distance}px`);
    el.style.height = `${distance + window.innerHeight}px`; // 1:1 scroll speed
  };

  el.dataset.railReady = "";
  measure();
  const ro = new ResizeObserver(measure);
  ro.observe(trackEl);
  window.addEventListener("resize", measure, { passive: true });
  // progress 0 when the section top hits the viewport top, 1 when its bottom hits the viewport bottom
  const stop = scrollProgress(el, { mode: "element", start: 0, end: 1 });

  return () => {
    stop();
    ro.disconnect();
    window.removeEventListener("resize", measure);
    el.style.removeProperty("--rail-distance");
    el.style.height = "";
    delete el.dataset.railReady;
  };
};
