import { onScrollFrame } from "./scroll";
import type { Cleanup } from "./utils";

export type ScrolledOptions = {
  /** px scrolled before data-scrolled="true". default 8 */
  threshold?: number;
};

/** Sets data-scrolled="true|false" and data-scroll-dir="up|down": style a header with CSS only. */
export const scrolled = (
  el: HTMLElement,
  { threshold = 8 }: ScrolledOptions = {},
): Cleanup => {
  let last = window.scrollY;
  return onScrollFrame(() => {
    const y = window.scrollY;
    el.dataset.scrolled = String(y > threshold);
    if (Math.abs(y - last) > 4) {
      el.dataset.scrollDir = y > last ? "down" : "up";
      last = y;
    }
  });
};
