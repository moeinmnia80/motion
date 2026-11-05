import { onScrollFrame } from "./scroll";
import type { Cleanup } from "./utils";

export type ScrollProgressOptions = {
  /** "page": whole-page scroll. "element": how far the element has travelled through the viewport. */
  mode?: "page" | "element";
};

/** Writes --progress (0..1) on the element. Style it however you like. */
export const scrollProgress = (
  el: HTMLElement,
  { mode = "page" }: ScrollProgressOptions = {},
): Cleanup => {
  const update = () => {
    let p: number;
    if (mode === "page") {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      p = max > 0 ? window.scrollY / max : 0;
    } else {
      const r = el.getBoundingClientRect();
      p = (window.innerHeight - r.top) / (window.innerHeight + r.height);
    }
    el.style.setProperty("--progress", Math.min(1, Math.max(0, p)).toFixed(4));
  };
  return onScrollFrame(update);
};
