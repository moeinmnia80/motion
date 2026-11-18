import { a11yText } from "./a11y";
import { inview } from "./inview";
import type { ObserveOptions } from "./observer";
import type { Cleanup } from "./utils";

export type SplitBy = "words" | "chars";

/** How each unit enters. `mask` slides the unit up from behind an overflow clip (headline look). */
export type SplitVariant =
  | "up"
  | "down"
  | "fade"
  | "blur"
  | "scale"
  | "rotate"
  | "mask"
  | "mask-down";

/** Which unit goes first. `random` is deterministic, so server and client agree. */
export type SplitFrom = "start" | "end" | "center" | "random";

export type SplitTextOptions = ObserveOptions & {
  by?: SplitBy;
  /** ms between units */
  step?: number;
  /** entrance style, default "up" */
  variant?: SplitVariant;
  /** which unit animates first, default "start" */
  from?: SplitFrom;
};

/**
 * Order in which `n` units animate: returns the delay index of each unit.
 * Pure and deterministic (no Math.random), so SSR markup matches the client.
 */
export const splitOrder = (n: number, from: SplitFrom = "start"): number[] => {
  const idx = Array.from({ length: n }, (_, i) => i);
  if (from === "start") return idx;
  if (from === "end") return idx.map((i) => n - 1 - i);
  if (from === "center") {
    const mid = (n - 1) / 2;
    const ranked = [...idx].sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid) || a - b);
    const out = new Array<number>(n);
    ranked.forEach((unit, rank) => (out[unit] = rank));
    return out;
  }
  const key = (i: number) => Math.imul(i + 1, 2654435761) >>> 0;
  const ranked = [...idx].sort((a, b) => key(a) - key(b));
  const out = new Array<number>(n);
  ranked.forEach((unit, rank) => (out[unit] = rank));
  return out;
};

/** Builds the accessible split structure. Units get a --i index. Shared by splitText & scrollFill. */
export const splitInto = (el: HTMLElement, text: string, by: SplitBy) => {
  const { visual, restore } = a11yText(el, text);
  let i = 0;

  for (const part of text.split(/(\s+)/)) {
    if (!part) continue;
    if (/^\s+$/.test(part)) {
      visual.append(" ");
      continue;
    }
    const word = document.createElement("span");
    word.dataset.splitWord = "";
    for (const chunk of by === "chars" ? Array.from(part) : [part]) {
      const unit = document.createElement("span");
      unit.dataset.splitUnit = "";
      unit.style.setProperty("--i", String(i++));
      unit.textContent = chunk;
      word.append(unit);
    }
    visual.append(word);
  }

  return { count: i, restore };
};

/**
 * Splits the element's text into animatable units (words or characters).
 * Screen readers get the original text; the animated units are aria-hidden.
 */
export const splitText = (
  el: HTMLElement,
  { by = "words", step = 40, variant = "up", from = "start", ...io }: SplitTextOptions = {},
): Cleanup | void => {
  const original = el.textContent ?? "";
  if (!original.trim()) return;

  const { restore, count } = splitInto(el, original, by);
  el.dataset.split = by;
  if (variant !== "up") el.dataset.splitVariant = variant;
  if (from !== "start") {
    const order = splitOrder(count, from);
    el.querySelectorAll<HTMLElement>("[data-split-unit]").forEach((unit, i) => {
      unit.style.setProperty("--i", String(order[i]));
    });
  }
  el.style.setProperty("--split-step", `${step}ms`);

  const stop = inview(el, io);
  return () => {
    stop();
    delete el.dataset.splitVariant;
    restore();
  };
};
