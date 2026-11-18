import { ticker } from "./ticker";
import { isBrowser, type Cleanup } from "./utils";

type Sub = (x: number, y: number) => void;

const subs = new Set<Sub>();
const OFFSCREEN = -1e4;
let x = OFFSCREEN;
let y = OFFSCREEN;
let unsubTick: Cleanup | null = null;
let bound = false;

const flush = () => {
  unsubTick = null;
  subs.forEach((sub) => sub(x, y));
  return false;
};

const queue = () => {
  if (unsubTick) return;
  unsubTick = ticker.read(flush);
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
      if (unsubTick) {
        unsubTick();
        unsubTick = null;
      }
    }
  };
};
