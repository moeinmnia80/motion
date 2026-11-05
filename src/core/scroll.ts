import type { Cleanup } from "./utils";

// One scroll/resize listener + one rAF per frame for ALL scroll-driven effects.
const tasks = new Set<() => void>();
let queued = false;
let bound = false;

const run = () => {
  queued = false;
  tasks.forEach((task) => task());
};

const schedule = () => {
  if (queued) return;
  queued = true;
  requestAnimationFrame(run);
};

export const onScrollFrame = (task: () => void): Cleanup => {
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
