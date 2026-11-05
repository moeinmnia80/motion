import { prefersReducedMotion, type Cleanup } from "./utils";

export type TiltOptions = {
  /** max rotation in degrees */
  max?: number;
  scale?: number;
  /** px */
  perspective?: number;
};

export const tilt = (
  el: HTMLElement,
  { max = 8, scale = 1.02, perspective = 800 }: TiltOptions = {},
): Cleanup | void => {
  if (prefersReducedMotion()) return;

  el.dataset.tilt = "";
  el.style.setProperty("--tilt-scale", String(scale));
  el.style.setProperty("--tilt-perspective", `${perspective}px`);

  let frame = 0;
  let rect: DOMRect | null = null;

  const reset = () => {
    cancelAnimationFrame(frame);
    rect = null;
    el.dataset.tiltActive = "false";
    el.style.setProperty("--tilt-x", "0deg");
    el.style.setProperty("--tilt-y", "0deg");
  };

  const onEnter = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    rect = el.getBoundingClientRect(); // measured once per hover, not per move
    el.dataset.tiltActive = "true";
  };

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" || !rect) return;
    const { clientX, clientY } = e;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      if (!rect) return;
      const px = (clientX - rect.left) / rect.width - 0.5;
      const py = (clientY - rect.top) / rect.height - 0.5;
      el.style.setProperty("--tilt-x", `${(-py * max * 2).toFixed(2)}deg`);
      el.style.setProperty("--tilt-y", `${(px * max * 2).toFixed(2)}deg`);
    });
  };

  el.addEventListener("pointerenter", onEnter);
  el.addEventListener("pointermove", onMove, { passive: true });
  el.addEventListener("pointerleave", reset);

  return () => {
    el.removeEventListener("pointerenter", onEnter);
    el.removeEventListener("pointermove", onMove);
    el.removeEventListener("pointerleave", reset);
    cancelAnimationFrame(frame);
  };
};
