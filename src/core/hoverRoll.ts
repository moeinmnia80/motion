import { prefersReducedMotion, listen, type Cleanup } from "./utils";

export type RollEffect = "slide" | "flip" | "blur";
export type RollFrom = "start" | "end" | "center";

export type HoverRollOptions = {
  /** text that rolls in. default: the same text (the word rolls over itself) */
  to?: string;
  /** "up": the old text leaves upwards, the new one enters from below */
  direction?: "up" | "down";
  effect?: RollEffect;
  /** "chars" = every letter has its own delay, "words" = every word */
  by?: "chars" | "words";
  /** ms between units */
  step?: number;
  /** where the delay wave starts */
  from?: RollFrom;
  /** element that triggers the hover (a link or button around the text). default: `el` itself */
  target?: Element;
};

const delays = (n: number, from: RollFrom) => {
  if (from === "end") return Array.from({ length: n }, (_, i) => n - 1 - i);
  if (from === "center") {
    const mid = (n - 1) / 2;
    return Array.from({ length: n }, (_, i) => Math.round(Math.abs(i - mid)));
  }
  return Array.from({ length: n }, (_, i) => i);
};

const buildLine = (text: string, name: "a" | "b", by: "chars" | "words", from: RollFrom) => {
  const line = document.createElement("span");
  line.dataset.rollLine = name;
  line.setAttribute("aria-hidden", "true");
  const parts = by === "chars" ? Array.from(text) : text.split(/(\s+)/).filter(Boolean);
  const order = delays(parts.length, from);
  parts.forEach((part, i) => {
    const unit = document.createElement("span");
    unit.dataset.rollChar = "";
    unit.style.setProperty("--i", String(order[i]));
    unit.textContent = part;
    line.append(unit);
  });
  return line;
};

/**
 * Hover text swap: every letter slides out and the next text slides in, with a growing delay.
 * The rolling text can be the word itself or a different one (`to`).
 * Screen readers read the original text only. Pure CSS motion, JS builds the markup once.
 *
 * Markup is also accepted pre-rendered (`[data-roll-line]` children), which is what the
 * React component does so the server HTML already contains it.
 */
export const hoverRoll = (
  el: HTMLElement,
  {
    to,
    direction = "up",
    effect = "slide",
    by = "chars",
    step = 18,
    from = "start",
    target,
  }: HoverRollOptions = {},
): Cleanup | void => {
  const original = el.textContent ?? "";
  const prebuilt = el.querySelector(":scope > [data-roll-line]") !== null;
  if (!prebuilt && !original.trim()) return;

  if (!prebuilt) {
    const sr = document.createElement("span");
    sr.dataset.splitSr = "";
    sr.textContent = original;
    el.replaceChildren(
      sr,
      buildLine(original, "a", by, from),
      buildLine(to ?? original, "b", by, from),
    );
  }

  el.dataset.hoverRoll = "";
  el.dataset.rollDir = direction;
  el.dataset.rollEffect = effect;
  el.style.setProperty("--roll-step", `${step}ms`);

  if (prefersReducedMotion()) return () => restore();

  const trigger: Element = target ?? el;
  const set = (on: boolean) => {
    el.dataset.rollActive = String(on);
  };
  const offs: Cleanup[] = [
    listen(trigger, "focusin", (e) => {
      if ((e.target as Element).matches?.(":focus-visible")) set(true);
    }),
    listen(trigger, "focusout", () => set(false)),
  ];
  // when the trigger is not the element itself, plain CSS :hover cannot reach it
  if (target) {
    offs.push(
      listen(trigger, "pointerenter", (e) => e.pointerType !== "touch" && set(true)),
      listen(trigger, "pointerleave", () => set(false)),
    );
  }

  function restore() {
    if (!prebuilt) el.textContent = original;
  }

  return () => {
    offs.forEach((off) => off());
    delete el.dataset.rollActive;
    restore();
  };
};
