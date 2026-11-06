import { observe } from "./observer";
import type { Cleanup } from "./utils";

export type ScrollSpyOptions = {
  /** the "reading line" inside the viewport. default: a thin band at ~40% */
  rootMargin?: string;
  linkSelector?: string;
};

/**
 * Marks the nav link of the section currently being read:
 * data-active="true" + aria-current="location".
 */
export const scrollSpy = (
  nav: HTMLElement,
  {
    rootMargin = "-40% 0px -55% 0px",
    linkSelector = 'a[href^="#"]',
  }: ScrollSpyOptions = {},
): Cleanup => {
  type Pair = { link: HTMLAnchorElement; target: HTMLElement };

  const pairs: Pair[] = Array.from(
    nav.querySelectorAll<HTMLAnchorElement>(linkSelector),
  ).flatMap((link) => {
    const id = decodeURIComponent(link.hash.slice(1));
    const target = id ? document.getElementById(id) : null;
    return target ? [{ link, target }] : [];
  });

  const visible = new Set<Element>();
  let current: Pair | undefined;

  const apply = () => {
    let next: Pair | undefined;
    for (const pair of pairs) if (visible.has(pair.target)) next = pair;
    if (next) current = next; // between sections: keep the last one
    for (const pair of pairs) {
      const on = pair === current;
      pair.link.dataset.active = String(on);
      if (on) pair.link.setAttribute("aria-current", "location");
      else pair.link.removeAttribute("aria-current");
    }
  };

  const stops = pairs.map((pair) =>
    observe(
      pair.target,
      (entry) => {
        if (entry.isIntersecting) visible.add(pair.target);
        else visible.delete(pair.target);
        apply();
      },
      { threshold: 0, rootMargin, once: false },
    ),
  );

  return () => stops.forEach((stop) => stop());
};
