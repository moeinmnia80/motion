import type { Cleanup } from "./utils";

export type PinOptions = {
  /** px of extra scroll the element stays pinned after reaching `top`. default 500 */
  end?: number;
  /** add `end` px of room to the parent (needed for the pin to last). default true */
  pinSpacing?: boolean;
  /** px from the viewport top where it pins. default 0 */
  top?: number;
};

/**
 * Pins an element while you scroll (ScrollTrigger-style), with zero JS per frame:
 * it becomes `position: sticky` and the parent gets `end` px of extra room.
 * The parent must not have `overflow: hidden`.
 */
export const pin = (el: HTMLElement, { end = 500, pinSpacing = true, top = 0 }: PinOptions = {}): Cleanup => {
  const parent = el.parentElement;
  if (!parent) return () => {};

  const before = { position: el.style.position, top: el.style.top, padding: parent.style.paddingBottom };
  el.style.position = "sticky";
  el.style.top = `${top}px`;
  if (pinSpacing) {
    parent.style.paddingBottom = `calc(${getComputedStyle(parent).paddingBottom} + ${end}px)`;
  }

  return () => {
    el.style.position = before.position;
    el.style.top = before.top;
    parent.style.paddingBottom = before.padding;
  };
};
