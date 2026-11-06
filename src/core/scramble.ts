import { a11yText } from "./a11y";
import { observe, type ObserveOptions } from "./observer";
import { prefersReducedMotion, type Cleanup } from "./utils";

export type ScrambleOptions = Omit<ObserveOptions, "once"> & {
  /** final text. default: the element's current text */
  text?: string;
  /** ms */
  duration?: number;
  /** characters used for the noise */
  chars?: string;
  /** "inview" runs once on entering the viewport, "hover" runs on every hover/focus */
  trigger?: "inview" | "hover";
};

/** "Decode" text effect: random glyphs settle into the real text. */
export const scramble = (
  el: HTMLElement,
  {
    text,
    duration = 900,
    chars = "!<>-_\\/[]{}=+*^?#abcdefghijklmnopqrstuvwxyz",
    trigger = "inview",
    ...io
  }: ScrambleOptions = {},
): Cleanup | void => {
  const full = text ?? el.textContent ?? "";
  if (!full.trim()) return;

  const glyphs = Array.from(full);
  const noise = Array.from(chars);
  const { visual, restore } = a11yText(el, full);
  el.dataset.scramble = "";

  if (prefersReducedMotion()) {
    visual.textContent = full;
    return restore;
  }

  const rand = () => noise[Math.floor(Math.random() * noise.length)] ?? "";
  let frame = 0;
  let thresholds: number[] = [];

  const render = (p: number) => {
    let out = "";
    for (let i = 0; i < glyphs.length; i++) {
      const g = glyphs[i]!;
      out += /\s/.test(g) || p >= thresholds[i]! ? g : rand();
    }
    visual.textContent = out;
  };

  const run = () => {
    cancelAnimationFrame(frame);
    // each glyph settles at its own random moment (biased left → right)
    thresholds = glyphs.map((_, i) => (i / glyphs.length) * 0.6 + Math.random() * 0.4);
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      render(p);
      if (p < 1) frame = requestAnimationFrame(tick);
      else visual.textContent = full;
    };
    frame = requestAnimationFrame(tick);
  };

  let stop: Cleanup = () => {};

  if (trigger === "hover") {
    visual.textContent = full;
    el.addEventListener("pointerenter", run);
    el.addEventListener("focusin", run);
    stop = () => {
      el.removeEventListener("pointerenter", run);
      el.removeEventListener("focusin", run);
    };
  } else {
    thresholds = glyphs.map(() => 2); // nothing resolved yet
    render(0);
    stop = observe(el, run, { ...io, once: true });
  }

  return () => {
    stop();
    cancelAnimationFrame(frame);
    restore();
  };
};
