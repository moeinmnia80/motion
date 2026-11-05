import { inview } from "./inview";
import type { ObserveOptions } from "./observer";
import type { RevealVariant } from "./reveal";

export type StaggerOptions = ObserveOptions & {
  /** which children to animate. default: direct children */
  selector?: string;
  /** ms between items */
  step?: number;
  /** ms before the first item */
  start?: number;
  variant?: RevealVariant;
  /** ms */
  duration?: number;
};

/** Observes the CONTAINER once and reveals its items one after another. */
export const stagger = (
  container: HTMLElement,
  {
    selector = ":scope > *",
    step = 80,
    start = 0,
    variant = "up",
    duration,
    ...io
  }: StaggerOptions = {},
) => {
  const items = container.querySelectorAll<HTMLElement>(selector);
  items.forEach((item, i) => {
    item.dataset.reveal = variant;
    item.style.setProperty("--reveal-delay", `${start + i * step}ms`);
    if (duration !== undefined) {
      item.style.setProperty("--reveal-duration", `${duration}ms`);
    }
  });
  container.dataset.stagger = "";
  return inview(container, io);
};
