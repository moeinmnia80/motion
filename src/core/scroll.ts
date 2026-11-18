import { ticker } from "./ticker";
import type { Cleanup } from "./utils";

const tasks = new Set<() => void>();
let unsubTick: Cleanup | null = null;
let bound = false;

const flush = () => {
  unsubTick = null;
  tasks.forEach((task) => task());
  return false;
};

const schedule = () => {
  if (unsubTick) return;
  unsubTick = ticker.read(flush);
};

export const onScrollFrame = (task: () => void): Cleanup => {
  tasks.add(task);
  if (!bound) {
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    bound = true;
  }
  schedule();

  return () => {
    tasks.delete(task);
    if (tasks.size === 0 && bound) {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      bound = false;
      if (unsubTick) {
        unsubTick();
        unsubTick = null;
      }
    }
  };
};

// Aliasing onScroll to onScrollFrame to fix the import error in interactions.ts
export const onScroll = onScrollFrame;
