import { inview } from "./inview";
import type { ObserveOptions } from "./observer";

export type RevealVariant =
  | "up"
  | "down"
  | "left"
  | "right"
  | "zoom"
  | "fade"
  | "blur"
  | "flip"
  | "rotate"
  | "skew"
  | "clip-up"
  | "clip-left";

export type RevealOptions = ObserveOptions & {
  variant?: RevealVariant;
  /** ms */
  delay?: number;
  /** ms */
  duration?: number;
};

export const reveal = (
  el: HTMLElement,
  { variant = "up", delay = 0, duration, ...io }: RevealOptions = {},
) => {
  el.dataset.reveal = variant;
  el.style.setProperty("--reveal-delay", `${delay}ms`);
  if (duration !== undefined) {
    el.style.setProperty("--reveal-duration", `${duration}ms`);
  }
  return inview(el, io);
};
