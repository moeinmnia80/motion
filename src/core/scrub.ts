import { scrollProgress } from "./scrollProgress";
import { prefersReducedMotion, type Cleanup } from "./utils";

export type ScrubEffect =
  | "fade"
  | "scale"
  | "zoom-out"
  | "slide-up"
  | "slide-down"
  | "slide-left"
  | "slide-right"
  | "rotate"
  | "blur"
  | "clip-up"
  | "clip-left";

export type ScrubOptions = {
  effect?: ScrubEffect;
  /** viewport fraction where the element's TOP starts the effect. default .95 */
  start?: number;
  /** viewport fraction where the element's BOTTOM completes it. default .55 */
  end?: number;
};

/**
 * Scroll-scrubbed entrance: the effect follows the scroll position (and reverses
 * when you scroll back). JS writes ONE variable (--progress); the look is pure CSS.
 */
export const scrub = (
  el: HTMLElement,
  { effect = "fade", start = 0.95, end = 0.55 }: ScrubOptions = {},
): Cleanup => {
  el.dataset.scrub = effect;
  if (prefersReducedMotion()) {
    el.style.setProperty("--progress", "1");
    return () => el.style.removeProperty("--progress");
  }
  return scrollProgress(el, { mode: "element", start, end });
};
