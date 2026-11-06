import { isBrowser, type Cleanup } from "./utils";

type Sub = (x: number, y: number) => void;

// One pointermove listener + one rAF per frame for ALL pointer-driven effects.
const subs = new Set<Sub>();
const OFFSCREEN = -1e4;
let x = OFFSCREEN;
let y = OFFSCREEN;
let queued = false;
let bound = false;

const flush = () => {
  queued = false;
  subs.forEach((sub) => sub(x, y));
};
const queue = () => {
  if (queued) return;
  queued = true;
  requestAnimationFrame(flush);
};
const onMove = (e: PointerEvent) => {
  if (e.pointerType === "touch") return;
  x = e.clientX;
  y = e.clientY;
  queue();
};
const onLeave = () => {
  x = OFFSCREEN;
  y = OFFSCREEN;
  queue();
};

export const onPointerFrame = (sub: Sub): Cleanup => {
  if (!isBrowser) return () => {};
  subs.add(sub);
  if (!bound) {
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    bound = true;
  }
  return () => {
    subs.delete(sub);
    if (subs.size === 0 && bound) {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      bound = false;
    }
  };
};
