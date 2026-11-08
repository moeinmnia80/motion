import type { Cleanup } from "./utils";

/**
 * A task READS layout/scroll state and may return a function that WRITES.
 * All reads of a frame run first, then all writes: no layout thrashing,
 * however many scroll-driven effects are mounted.
 */
export type ScrollTask = () => (() => void) | void;

// One scroll/resize listener + one rAF per frame for ALL scroll-driven effects.
const tasks = new Set<ScrollTask>();
let queued = false;
let bound = false;

const run = () => {
  queued = false;
  const writes: (() => void)[] = [];
  tasks.forEach((task) => {
    const write = task();
    if (write) writes.push(write);
  });
  for (const write of writes) write();
};

const schedule = () => {
  if (queued) return;
  queued = true;
  requestAnimationFrame(run);
};

export const onScrollFrame = (task: ScrollTask): Cleanup => {
  tasks.add(task);
  if (!bound) {
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    bound = true;
  }
  schedule(); // initial paint of the value

  return () => {
    tasks.delete(task);
    if (tasks.size === 0 && bound) {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      bound = false;
    }
  };
};

/** Ask for one more frame (e.g. after layout changed without a scroll). */
export const requestScrollFrame = schedule;
