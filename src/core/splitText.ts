import { inview } from "./inview";
import type { ObserveOptions } from "./observer";
import type { Cleanup } from "./utils";

export type SplitTextOptions = ObserveOptions & {
  by?: "words" | "chars";
  /** ms between units */
  step?: number;
};

/**
 * Splits the element's text into animatable units.
 * Accessible: screen readers get the original text (visually hidden copy),
 * the animated units are aria-hidden.
 */
export const splitText = (
  el: HTMLElement,
  { by = "words", step = 40, ...io }: SplitTextOptions = {},
): Cleanup | void => {
  const original = el.textContent ?? "";
  if (!original.trim()) return;

  const sr = document.createElement("span");
  sr.dataset.splitSr = "";
  sr.textContent = original;

  const visual = document.createElement("span");
  visual.setAttribute("aria-hidden", "true");

  let i = 0;
  for (const part of original.split(/(\s+)/)) {
    if (!part) continue;
    if (/^\s+$/.test(part)) {
      visual.append(" ");
      continue;
    }
    const word = document.createElement("span");
    word.dataset.splitWord = "";
    const chunks = by === "chars" ? Array.from(part) : [part];
    for (const chunk of chunks) {
      const unit = document.createElement("span");
      unit.dataset.splitUnit = "";
      unit.style.setProperty("--i", String(i++));
      unit.textContent = chunk;
      word.append(unit);
    }
    visual.append(word);
  }

  el.replaceChildren(sr, visual);
  el.dataset.split = by;
  el.style.setProperty("--split-step", `${step}ms`);

  const stop = inview(el, io);
  return () => {
    stop();
    el.textContent = original;
  };
};
