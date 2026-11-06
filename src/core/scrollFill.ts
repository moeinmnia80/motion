import { scrollProgress } from "./scrollProgress";
import { splitInto } from "./splitText";
import type { Cleanup } from "./utils";

export type ScrollFillOptions = {
  /** viewport fraction where the fill starts (element top). default .85 */
  start?: number;
  /** viewport fraction where it is complete (element bottom). default .35 */
  end?: number;
};

/**
 * Words light up one by one as you scroll (scrubbed, reversible).
 * JS only writes ONE variable (--progress); the per-word maths is CSS.
 */
export const scrollFill = (
  el: HTMLElement,
  { start = 0.85, end = 0.35 }: ScrollFillOptions = {},
): Cleanup | void => {
  const original = el.textContent ?? "";
  if (!original.trim()) return;

  const { count, restore } = splitInto(el, original, "words");
  el.dataset.scrollFill = "";
  el.style.setProperty("--n", String(count));

  const stop = scrollProgress(el, { mode: "element", start, end });
  return () => {
    stop();
    restore();
  };
};
