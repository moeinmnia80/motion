import { onPointerFrame } from "./pointer";
import { spring } from "./spring";
import { canHover, prefersReducedMotion, type Cleanup } from "./utils";

export type CursorOptions = {
  stiffness?: number;
  damping?: number;
  /** elements that make the cursor "grow" */
  hoverSelector?: string;
};

/**
 * Custom cursor follower (spring-smoothed). `el` should be position:fixed.
 * Sets data-cursor-visible / data-cursor-hover / data-cursor-down for styling.
 */
export const cursor = (
  el: HTMLElement,
  {
    stiffness = 300,
    damping = 28,
    hoverSelector = "a,button,[role=button],input,textarea,select,[data-cursor-hover]",
  }: CursorOptions = {},
): Cleanup | void => {
  if (prefersReducedMotion() || !canHover()) return;

  el.dataset.cursor = "";
  el.dataset.cursorVisible = "false";
  let seen = false;

  const s = spring(
    [0, 0],
    ([x, y]) => {
      el.style.transform = `translate3d(${x!.toFixed(1)}px, ${y!.toFixed(1)}px, 0)`;
    },
    { stiffness, damping },
  );

  const stopPointer = onPointerFrame((x, y) => {
    if (x < 0 || y < 0) {
      el.dataset.cursorVisible = "false";
      return;
    }
    if (!seen) {
      seen = true;
      s.jump([x, y]); // first appearance: no flight from the corner
    } else {
      s.set([x, y]);
    }
    el.dataset.cursorVisible = "true";
  });

  const onOver = (e: PointerEvent) => {
    const t = e.target instanceof Element ? e.target : null;
    el.dataset.cursorHover = String(Boolean(t?.closest(hoverSelector)));
  };
  const onDown = () => {
    el.dataset.cursorDown = "true";
  };
  const onUp = () => {
    el.dataset.cursorDown = "false";
  };

  document.addEventListener("pointerover", onOver, { passive: true });
  document.addEventListener("pointerdown", onDown, { passive: true });
  document.addEventListener("pointerup", onUp, { passive: true });

  return () => {
    stopPointer();
    s.stop();
    document.removeEventListener("pointerover", onOver);
    document.removeEventListener("pointerdown", onDown);
    document.removeEventListener("pointerup", onUp);
  };
};
