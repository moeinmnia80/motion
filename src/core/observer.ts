import type { Cleanup } from "./utils";

export type ObserveOptions = {
  /** 0..1, default 0 (works for very tall elements too) */
  threshold?: number;
  /** default "0px 0px -10% 0px": fires a bit after the element enters */
  rootMargin?: string;
  /** stop observing after the first time it enters. default true */
  once?: boolean;
};

type Target = {
  cb: (entry: IntersectionObserverEntry) => void;
  once: boolean;
};
type Pool = { io: IntersectionObserver; targets: WeakMap<Element, Target> };

// One IntersectionObserver per (threshold, rootMargin) pair, however many elements.
const pools = new Map<string, Pool>();

const getPool = (threshold: number, rootMargin: string): Pool => {
  const key = `${threshold}|${rootMargin}`;
  const existing = pools.get(key);
  if (existing) return existing;

  const targets = new WeakMap<Element, Target>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const target = targets.get(entry.target);
        if (!target) continue;
        if (target.once && !entry.isIntersecting) continue;

        target.cb(entry);

        if (target.once) {
          targets.delete(entry.target);
          io.unobserve(entry.target);
        }
      }
    },
    { threshold, rootMargin },
  );

  const pool = { io, targets };
  pools.set(key, pool);
  return pool;
};

export const observe = (
  el: Element,
  cb: (entry: IntersectionObserverEntry) => void,
  {
    threshold = 0,
    rootMargin = "0px 0px -10% 0px",
    once = true,
  }: ObserveOptions = {},
): Cleanup => {
  const { io, targets } = getPool(threshold, rootMargin);
  targets.set(el, { cb, once });
  io.observe(el);

  return () => {
    targets.delete(el);
    io.unobserve(el);
  };
};
