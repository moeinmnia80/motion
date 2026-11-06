import { a11yText } from "./a11y";
import { observe, type ObserveOptions } from "./observer";
import { prefersReducedMotion, type Cleanup } from "./utils";

export type TypewriterOptions = Omit<ObserveOptions, "once"> & {
  text?: string;
  /** ms per character */
  speed?: number;
  /** ms before typing starts */
  delay?: number;
  /** blinking caret (styled by CSS) */
  caret?: boolean;
};

/**
 * Types the text once it enters the viewport. The not-yet-typed part stays in the
 * layout (visibility:hidden) so nothing jumps while typing.
 */
export const typewriter = (
  el: HTMLElement,
  { text, speed = 45, delay = 0, caret = true, ...io }: TypewriterOptions = {},
): Cleanup | void => {
  const full = text ?? el.textContent ?? "";
  if (!full.trim()) return;

  const chars = Array.from(full);
  const { visual, restore } = a11yText(el, full);

  const typed = document.createElement("span");
  typed.dataset.typed = "";
  const rest = document.createElement("span");
  rest.dataset.rest = "";
  rest.style.visibility = "hidden";
  visual.append(typed, rest);

  el.dataset.typewriter = "";
  if (caret) el.dataset.caret = "";

  const write = (n: number) => {
    typed.textContent = chars.slice(0, n).join("");
    rest.textContent = chars.slice(n).join("");
  };

  if (prefersReducedMotion()) {
    write(chars.length);
    return restore;
  }

  write(0);
  let frame = 0;
  let shown = 0;

  const run = () => {
    el.dataset.typing = "true";
    const t0 = performance.now() + delay;
    const tick = (now: number) => {
      const n = now < t0 ? 0 : Math.min(Math.floor((now - t0) / speed) + 1, chars.length);
      if (n !== shown) {
        shown = n;
        write(n);
      }
      if (n < chars.length) frame = requestAnimationFrame(tick);
      else el.dataset.typing = "false";
    };
    frame = requestAnimationFrame(tick);
  };

  const stop = observe(el, run, { ...io, once: true });

  return () => {
    stop();
    cancelAnimationFrame(frame);
    restore();
  };
};
