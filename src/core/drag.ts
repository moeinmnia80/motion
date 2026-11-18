import { spring } from "./spring";
import { prefersReducedMotion, type Cleanup } from "./utils";

export type DragOptions = {
  axis?: "x" | "y" | "both";
  /** spring back to the origin on release. false = it is thrown with momentum */
  snap?: boolean;
  /** seconds of release velocity projected forward when snap=false */
  throwFactor?: number;
  stiffness?: number;
  damping?: number;
};

/** Pointer drag with a spring release. Writes --dx / --dy (applied via `translate`). */
export const drag = (
  el: HTMLElement,
  { axis = "both", snap = true, throwFactor = 0.18, stiffness = 260, damping = 24 }: DragOptions = {},
): Cleanup | void => {
  if (prefersReducedMotion()) return;
  el.dataset.drag = "";

  let x = 0;
  let y = 0;
  let active = false;
  let sx = 0;
  let sy = 0;
  let ox = 0;
  let oy = 0;
  let lx = 0;
  let ly = 0;
  let lt = 0;
  let vx = 0;
  let vy = 0;

  const s = spring(
    [0, 0],
    ([px, py]) => {
      x = px!;
      y = py!;
      el.style.setProperty("--dx", `${x.toFixed(1)}px`);
      el.style.setProperty("--dy", `${y.toFixed(1)}px`);
    },
    { stiffness, damping },
  );

  const down = (e: PointerEvent) => {
    if (e.button !== 0) return;
    active = true;
    el.setPointerCapture?.(e.pointerId);
    s.stop();
    [sx, sy, ox, oy, lx, ly] = [e.clientX, e.clientY, x, y, e.clientX, e.clientY];
    [vx, vy, lt] = [0, 0, performance.now()];
    el.dataset.dragging = "true";
  };

  const move = (e: PointerEvent) => {
    if (!active) return;
    const now = performance.now();
    const dt = Math.max(now - lt, 1);
    vx = ((e.clientX - lx) / dt) * 1000;
    vy = ((e.clientY - ly) / dt) * 1000;
    [lx, ly, lt] = [e.clientX, e.clientY, now];
    s.jump([
      axis === "y" ? 0 : ox + e.clientX - sx,
      axis === "x" ? 0 : oy + e.clientY - sy,
    ]);
  };

  const up = () => {
    if (!active) return;
    active = false;
    el.dataset.dragging = "false";
    s.set(snap ? [0, 0] : [x + vx * throwFactor, y + vy * throwFactor]);
  };

  el.addEventListener("pointerdown", down);
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerup", up);
  el.addEventListener("pointercancel", up);

  return () => {
    el.removeEventListener("pointerdown", down);
    el.removeEventListener("pointermove", move);
    el.removeEventListener("pointerup", up);
    el.removeEventListener("pointercancel", up);
    s.stop();
  };
};
