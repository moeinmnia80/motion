import { observe } from "./observer";
import { onScrollFrame } from "./scroll";
import { prefersReducedMotion, type Cleanup } from "./utils";

export type ParallaxOptions = {
  /** 0.1 = moves 10% of the distance from viewport center. negative = opposite. */
  speed?: number;
  axis?: "x" | "y";
};

/**
 * Writes --parallax-x / --parallax-y. The scroll work runs only while in view.
 * The element's own offset is removed from the measurement, so the effect never
 * feeds back into itself (speed stays exactly `speed`).
 */
export const parallax = (
  el: HTMLElement,
  { speed = 0.15, axis = "y" }: ParallaxOptions = {},
): Cleanup | void => {
  if (prefersReducedMotion()) return;

  el.dataset.parallax = axis;
  const y = axis === "y";
  const prop = y ? "--parallax-y" : "--parallax-x";
  let stopScroll: Cleanup | null = null;
  let dirty = true;
  let pos = 0; // resting document position (no parallax offset)
  let size = 0;
  let current = 0;

  const ro = new ResizeObserver(() => (dirty = true));
  ro.observe(el);
  ro.observe(document.documentElement);

  const task = () => {
    if (dirty) {
      dirty = false;
      const r = el.getBoundingClientRect();
      pos = (y ? r.top + window.scrollY : r.left + window.scrollX) - current;
      size = y ? r.height : r.width;
    }
    const view = y ? window.innerHeight : window.innerWidth;
    const scroll = y ? window.scrollY : window.scrollX;
    const next = Math.round(-(pos - scroll + size / 2 - view / 2) * speed * 10) / 10;
    if (next === current) return;
    return () => {
      current = next;
      el.style.setProperty(prop, `${next}px`);
    };
  };

  const stopObserve = observe(
    el,
    (entry) => {
      if (entry.isIntersecting) {
        dirty = true; // layout may have moved while we were asleep
        stopScroll ??= onScrollFrame(task);
      } else {
        stopScroll?.();
        stopScroll = null;
      }
    },
    { threshold: 0, rootMargin: "20% 0px 20% 0px", once: false },
  );

  return () => {
    stopObserve();
    stopScroll?.();
    ro.disconnect();
    el.style.removeProperty(prop);
  };
};
