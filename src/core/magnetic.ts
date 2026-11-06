import { onPointerFrame } from "./pointer";
import { onScrollFrame } from "./scroll";
import { spring } from "./spring";
import { canHover, prefersReducedMotion, type Cleanup } from "./utils";

export type MagneticOptions = {
  /** how much of the cursor offset is followed (0..1) */
  strength?: number;
  /** px around the element where the pull starts */
  radius?: number;
  stiffness?: number;
  damping?: number;
};

/** Element is gently pulled towards the cursor. Writes --mx / --my (applied via `translate`). */
export const magnetic = (
  el: HTMLElement,
  { strength = 0.35, radius = 60, stiffness = 220, damping = 18 }: MagneticOptions = {},
): Cleanup | void => {
  if (prefersReducedMotion() || !canHover()) return;

  el.dataset.magnetic = "";
  let cx = 0;
  let cy = 0;
  let hw = 0;
  let hh = 0;
  let ox = 0;
  let oy = 0;
  let stale = true;

  const s = spring(
    [0, 0],
    ([x, y]) => {
      ox = x!;
      oy = y!;
      el.style.setProperty("--mx", `${ox.toFixed(2)}px`);
      el.style.setProperty("--my", `${oy.toFixed(2)}px`);
    },
    { stiffness, damping },
  );

  const measure = () => {
    const r = el.getBoundingClientRect();
    // remove the current offset so we measure the element's resting centre
    cx = r.left + r.width / 2 - ox;
    cy = r.top + r.height / 2 - oy;
    hw = r.width / 2;
    hh = r.height / 2;
    stale = false;
  };

  const stopScroll = onScrollFrame(() => {
    stale = true; // re-measure lazily after scroll/resize
  });

  const stopPointer = onPointerFrame((px, py) => {
    if (stale) measure();
    const dx = px - cx;
    const dy = py - cy;
    const near = Math.abs(dx) < hw + radius && Math.abs(dy) < hh + radius;
    s.set(near ? [dx * strength, dy * strength] : [0, 0]);
  });

  return () => {
    stopScroll();
    stopPointer();
    s.stop();
  };
};
