import { prefersReducedMotion, type Cleanup } from "./utils";

export type RippleOptions = {
  /** any CSS colour. default: currentColor */
  color?: string;
  /** ms */
  duration?: number;
};

/** Material-style click ripple (pure CSS animation, one throw-away <span> per click). */
export const ripple = (
  el: HTMLElement,
  { color, duration = 600 }: RippleOptions = {},
): Cleanup | void => {
  if (prefersReducedMotion()) return;
  el.dataset.ripple = "";

  const onDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    // diameter that reaches the farthest corner
    const size =
      Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y)) * 2;

    const wave = document.createElement("span");
    wave.dataset.rippleWave = "";
    wave.style.width = wave.style.height = `${size}px`;
    wave.style.left = `${x}px`;
    wave.style.top = `${y}px`;
    wave.style.setProperty("--ripple-duration", `${duration}ms`);
    if (color) wave.style.setProperty("--ripple-color", color);

    el.append(wave);
    wave.addEventListener("animationend", () => wave.remove(), { once: true });
  };

  el.addEventListener("pointerdown", onDown);
  return () => el.removeEventListener("pointerdown", onDown);
};
