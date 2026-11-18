import { onScrollFrame } from "./scroll";
import type { Cleanup } from "./utils";

export type ScrollProgressOptions = {
  /** "page": whole-page scroll. "element": progress of the element travelling through the viewport. */
  mode?: "page" | "element";
  /**
   * element mode: viewport fraction (0 = top, 1 = bottom) where the element's TOP
   * must be for progress = 0. default 1 (just entering at the bottom)
   */
  start?: number;
  /**
   * element mode: viewport fraction where the element's BOTTOM must be for
   * progress = 1. default 0 (just leaving at the top)
   */
  end?: number;
};

/** Writes --progress (0..1) on the element. Style it however you like (scrub). */
export const scrollProgress = (
  el: HTMLElement,
  { mode = "page", start = 1, end = 0 }: ScrollProgressOptions = {},
): Cleanup => {
  const update = () => {
    let p: number;
    if (mode === "page") {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      p = max > 0 ? window.scrollY / max : 0;
    } else {
      const vh = window.innerHeight;
      const r = el.getBoundingClientRect();
      p = (vh * start - r.top) / (vh * (start - end) + r.height);
    }
    el.style.setProperty("--progress", Math.min(1, Math.max(0, p)).toFixed(4));
  };
  return onScrollFrame(update);
};
