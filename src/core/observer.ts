import type { Cleanup } from "./utils";

export type ObserveOptions = {
  /** 0..1, default 0 (works for very tall elements too) */
  threshold?: number;
  /** default "0px 0px -10% 0px": fires a bit after the element enters */
  rootMargin?: string;
  /** stop observing after the first time it enters. default true */
  once?: boolean;
};

type Sub = {
  cb: (entry: IntersectionObserverEntry) => void;
  once: boolean;
};
type Pool = { io: IntersectionObserver; subs: WeakMap<Element, Set<Sub>> };

// One IntersectionObserver per (threshold, rootMargin) pair, however many elements.
const pools = new Map<string, Pool>();

const getPool = (threshold: number, rootMargin: string): Pool => {
  const key = `${threshold}|${rootMargin}`;
  const existing = pools.get(key);
  if (existing) return existing;

  const subs = new WeakMap<Element, Set<Sub>>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const set = subs.get(entry.target);
        if (!set) continue;
        // several effects may watch the same element: all of them get the entry
        for (const sub of [...set]) {
          if (sub.once && !entry.isIntersecting) continue;
          sub.cb(entry);
          if (sub.once) set.delete(sub);
        }
        if (set.size === 0) {
          subs.delete(entry.target);
          io.unobserve(entry.target);
        }
      }
    },
    { threshold, rootMargin },
  );

  const pool = { io, subs };
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
  const { io, subs } = getPool(threshold, rootMargin);
  const sub: Sub = { cb, once };
  let set = subs.get(el);
  if (!set) subs.set(el, (set = new Set()));
  set.add(sub);
  io.observe(el);

  return () => {
    const current = subs.get(el);
    if (!current) return;
    current.delete(sub);
    if (current.size === 0) {
      subs.delete(el);
      io.unobserve(el);
    }
  };
};
