import { scrollProgress } from "./scrollProgress";
import { prefersReducedMotion, type Cleanup } from "./utils";

export type HighlightOptions = {
  /** viewport fraction where the highlight starts. default .9 */
  start?: number;
  /** viewport fraction where it is complete. default .5 */
  end?: number;
};

/** A marker stroke that paints itself behind inline text as you scroll (scrubbed). */
export const highlight = (
  el: HTMLElement,
  { start = 0.9, end = 0.5 }: HighlightOptions = {},
): Cleanup => {
  el.dataset.highlight = "";
  if (prefersReducedMotion()) {
    el.style.setProperty("--progress", "1");
    return () => el.style.removeProperty("--progress");
  }
  return scrollProgress(el, { mode: "element", start, end });
};
