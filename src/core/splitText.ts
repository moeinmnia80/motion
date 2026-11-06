import { a11yText } from "./a11y";
import { inview } from "./inview";
import type { ObserveOptions } from "./observer";
import type { Cleanup } from "./utils";

export type SplitBy = "words" | "chars";

export type SplitTextOptions = ObserveOptions & {
  by?: SplitBy;
  /** ms between units */
  step?: number;
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
  { by = "words", step = 40, ...io }: SplitTextOptions = {},
): Cleanup | void => {
  const original = el.textContent ?? "";
  if (!original.trim()) return;

  const { restore } = splitInto(el, original, by);
  el.dataset.split = by;
  el.style.setProperty("--split-step", `${step}ms`);

  const stop = inview(el, io);
  return () => {
    stop();
    restore();
  };
};
