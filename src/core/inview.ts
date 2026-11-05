import { observe, type ObserveOptions } from "./observer";
import type { Cleanup } from "./utils";

/** Sets `data-inview="true|false"` on the element. Everything else is CSS. */
export const inview = (el: HTMLElement, options: ObserveOptions = {}): Cleanup =>
  observe(
    el,
    (entry) => {
      el.dataset.inview = String(entry.isIntersecting);
    },
    options,
  );
