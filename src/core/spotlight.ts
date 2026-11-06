import { canHover, type Cleanup } from "./utils";

export type SpotlightOptions = {
  /** items inside the container that get the glow. default: the element itself */
  selector?: string;
};

/**
 * Cursor-following glow. Writes --spot-x / --spot-y (relative to each item), so one
 * continuous light can travel across a whole grid of cards.
 */
export const spotlight = (
  el: HTMLElement,
  { selector }: SpotlightOptions = {},
): Cleanup | void => {
  if (!canHover()) return;

  el.dataset.spotlight = "";
  let frame = 0;
  let px = 0;
  let py = 0;

  const update = () => {
    frame = 0;
    const items = selector
      ? Array.from(el.querySelectorAll<HTMLElement>(selector))
      : [el];
    const rects = items.map((item) => item.getBoundingClientRect()); // read all…
    items.forEach((item, i) => {
      // …then write all (no layout thrash)
      const r = rects[i]!;
      item.dataset.spotlightItem = "";
      item.style.setProperty("--spot-x", `${(px - r.left).toFixed(1)}px`);
      item.style.setProperty("--spot-y", `${(py - r.top).toFixed(1)}px`);
    });
  };

  const onMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    px = e.clientX;
    py = e.clientY;
    if (!frame) frame = requestAnimationFrame(update);
  };
  const onEnter = () => {
    el.dataset.spotActive = "true";
  };
  const onLeave = () => {
    el.dataset.spotActive = "false";
  };

  el.addEventListener("pointermove", onMove, { passive: true });
  el.addEventListener("pointerenter", onEnter);
  el.addEventListener("pointerleave", onLeave);

  return () => {
    el.removeEventListener("pointermove", onMove);
    el.removeEventListener("pointerenter", onEnter);
    el.removeEventListener("pointerleave", onLeave);
    cancelAnimationFrame(frame);
  };
};
