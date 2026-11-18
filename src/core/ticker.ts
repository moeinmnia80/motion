import { observe } from "./observer";
import { isBrowser, type Cleanup } from "./utils";

/** Return `false` to unsubscribe. Anything else keeps the callback running. */
export type TickCallback = (now: number, dt: number) => boolean | void;

type Phase = "read" | "update" | "write";
const PHASES: Phase[] = ["read", "update", "write"];

// ONE requestAnimationFrame loop for every spring / canvas / effect.
// Phases run strictly read -> update -> write, so DOM reads never interleave with writes.
const queues: Record<Phase, Set<TickCallback>> = {
  read: new Set(),
  update: new Set(),
  write: new Set(),
};

let rafId = 0;
let lastTime = 0;
let running = false;

const size = () => queues.read.size + queues.update.size + queues.write.size;

const run = (phase: Phase, now: number, dt: number) => {
  const queue = queues[phase];
  for (const cb of queue) {
    try {
      if (cb(now, dt) === false) queue.delete(cb);
    } catch (error) {
      // one broken effect must never kill the shared loop
      queue.delete(cb);
      console.error("[motion] ticker callback threw and was removed", error);
    }
  }
};

const flush = (now: number) => {
  rafId = 0;
  const dt = lastTime ? Math.min((now - lastTime) / 1000, 1 / 30) : 1 / 60;
  lastTime = now;
  for (const phase of PHASES) run(phase, now, dt);

  if (size() > 0) {
    rafId = requestAnimationFrame(flush);
  } else {
    running = false;
    lastTime = 0;
  }
};

const ensureRunning = () => {
  if (running || !isBrowser) return;
  running = true;
  lastTime = performance.now();
  rafId = requestAnimationFrame(flush);
};

const add = (phase: Phase, cb: TickCallback): Cleanup => {
  queues[phase].add(cb);
  ensureRunning();
  return () => void queues[phase].delete(cb);
};

export const ticker = {
  read: (cb: TickCallback) => add("read", cb),
  update: (cb: TickCallback) => add("update", cb),
  write: (cb: TickCallback) => add("write", cb),
  /** number of active subscribers */
  get size() {
    return size();
  },
  /** drop every subscriber and stop the loop (tests, teardown) */
  clear() {
    PHASES.forEach((phase) => queues[phase].clear());
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    lastTime = 0;
    running = false;
  },
};

export const subscribe = ticker.update;

/** Runs `cb` on the shared loop only while `el` is near the viewport (canvas / 3D demos). */
export const tickWhileVisible = (el: Element, cb: TickCallback): Cleanup => {
  if (typeof IntersectionObserver === "undefined") return ticker.update(cb);
  let stop: Cleanup | null = null;
  const unobserve = observe(
    el,
    (entry) => {
      if (entry.isIntersecting) stop ??= ticker.update(cb);
      else {
        stop?.();
        stop = null;
      }
    },
    { threshold: 0, rootMargin: "120px 0px", once: false },
  );
  return () => {
    unobserve();
    stop?.();
    stop = null;
  };
};
