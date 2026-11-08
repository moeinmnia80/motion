import { onScrollFrame, requestScrollFrame } from "./scroll";
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

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/**
 * Writes --progress (0..1) on the element. Style it however you like (scrub).
 *
 * Performance: the element's document position is measured ONCE (and again only
 * when its size or the page height changes, via ResizeObserver). Every frame is
 * pure arithmetic on `scrollY`: no layout reads, and nothing is written when the
 * value did not change (e.g. while the element is far off-screen).
 */
export const scrollProgress = (
  el: HTMLElement,
  { mode = "page", start = 1, end = 0 }: ScrollProgressOptions = {},
): Cleanup => {
  let last = "";
  let dirty = true;
  let top = 0;
  let height = 0;
  let docHeight = 0;

  const ro = new ResizeObserver(() => {
    dirty = true;
    requestScrollFrame();
  });
  ro.observe(document.documentElement);
  if (mode === "element") ro.observe(el);

  const span = (vh: number) => vh * (start - end) + height;

  const stop = onScrollFrame(() => {
    if (dirty) {
      dirty = false;
      docHeight = document.documentElement.scrollHeight;
      if (mode === "element") {
        const r = el.getBoundingClientRect();
        top = r.top + window.scrollY;
        height = r.height;
      }
    }

    const vh = window.innerHeight;
    const p =
      mode === "page"
        ? docHeight > vh
          ? window.scrollY / (docHeight - vh)
          : 0
        : span(vh) > 0
          ? (vh * start - (top - window.scrollY)) / span(vh)
          : Number(vh * start >= top - window.scrollY); // degenerate range: step

    const value = clamp01(p).toFixed(3);
    if (value === last) return;
    return () => {
      last = value;
      el.style.setProperty("--progress", value);
    };
  });

  return () => {
    stop();
    ro.disconnect();
  };
};
