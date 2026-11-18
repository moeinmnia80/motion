import { observe } from "./observer";
import { onScrollFrame } from "./scroll";
import { prefersReducedMotion, type Cleanup } from "./utils";

export type ParallaxOptions = {
  /** 0.1 = moves 10% of the distance from viewport center. negative = opposite. */
  speed?: number;
  axis?: "x" | "y";
};

/** Writes --parallax-x / --parallax-y. The scroll work runs only while in view. */
export const parallax = (
  el: HTMLElement,
  { speed = 0.15, axis = "y" }: ParallaxOptions = {},
): Cleanup | void => {
  if (prefersReducedMotion()) return;

  el.dataset.parallax = axis;
  const prop = axis === "y" ? "--parallax-y" : "--parallax-x";
  let stopScroll: Cleanup | null = null;

  const update = () => {
    const r = el.getBoundingClientRect();
    const center =
      axis === "y"
        ? r.top + r.height / 2 - window.innerHeight / 2
        : r.left + r.width / 2 - window.innerWidth / 2;
    el.style.setProperty(prop, `${(-center * speed).toFixed(1)}px`);
  };

  const stopObserve = observe(
    el,
    (entry) => {
      if (entry.isIntersecting) {
        stopScroll ??= onScrollFrame(update);
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
    el.style.removeProperty(prop);
  };
};
