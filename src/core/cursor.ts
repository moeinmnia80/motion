import { onPointerFrame } from "./pointer";
import { spring } from "./spring";
import { canHover, prefersReducedMotion, type Cleanup } from "./utils";

/**
 * dot    small dot, grows over links (default)
 * blend  large disc with mix-blend-mode: difference, inverts the text and images below it
 * ring   hollow ring that grows over links
 * dual   ring that follows with a spring + a tiny dot that follows instantly
 * label  a disc that shows the `data-cursor-label` text of the hovered element
 */
export type CursorVariant = "dot" | "blend" | "ring" | "dual" | "label";

export type CursorOptions = {
  stiffness?: number;
  damping?: number;
  /** elements that make the cursor "grow" */
  hoverSelector?: string;
  variant?: CursorVariant;
  /** hide the native cursor while this one is active (default false) */
  hideNative?: boolean;
};

/**
 * Custom cursor follower (spring-smoothed). `el` should be position:fixed.
 * Sets data-cursor-visible / data-cursor-hover / data-cursor-down for styling.
 *
 * Any element can change the look while hovered:
 *   <a data-cursor-style="blend">…</a>        switch variant
 *   <a data-cursor-label="View">…</a>         text inside the "label" variant
 */
export const cursor = (
  el: HTMLElement,
  {
    stiffness = 300,
    damping = 28,
    hoverSelector = "a,button,[role=button],input,textarea,select,[data-cursor-hover]",
    variant = "dot",
    hideNative = false,
  }: CursorOptions = {},
): Cleanup | void => {
  if (prefersReducedMotion() || !canHover()) return;

  el.dataset.cursor = "";
  el.dataset.cursorVisible = "false";
  el.dataset.cursorVariant = variant;
  let seen = false;

  // "label": text lives in its own node, so scaling the disc never scales the text
  let text: HTMLElement | null = null;
  if (variant === "label" || el.querySelector("[data-cursor-text]")) {
    text = el.querySelector<HTMLElement>("[data-cursor-text]");
    if (!text) {
      text = document.createElement("span");
      text.dataset.cursorText = "";
      el.append(text);
    }
  }

  // "dual": a second element that tracks the pointer with no lag
  let dot: HTMLElement | null = null;
  if (variant === "dual") {
    dot = document.createElement("span");
    dot.dataset.cursorDot = "";
    dot.dataset.cursorVisible = "false";
    document.body.append(dot);
  }

  if (hideNative) document.documentElement.dataset.cursorNative = "hidden";

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
      if (dot) dot.dataset.cursorVisible = "false";
      return;
    }
    if (!seen) {
      seen = true;
      s.jump([x, y]); // first appearance: no flight from the corner
    } else {
      s.set([x, y]);
    }
    if (dot) {
      dot.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      dot.dataset.cursorVisible = "true";
    }
    el.dataset.cursorVisible = "true";
  });

  const onOver = (e: PointerEvent) => {
    const t = e.target instanceof Element ? e.target : null;
    el.dataset.cursorHover = String(Boolean(t?.closest(hoverSelector)));

    const style = t?.closest<HTMLElement>("[data-cursor-style]")?.dataset.cursorStyle;
    el.dataset.cursorVariant = style || variant;

    if (text) {
      const label = t?.closest<HTMLElement>("[data-cursor-label]")?.dataset.cursorLabel ?? "";
      if (text.textContent !== label) text.textContent = label;
      el.dataset.cursorHasLabel = String(label !== "");
    }
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
    dot?.remove();
    if (hideNative) delete document.documentElement.dataset.cursorNative;
    document.removeEventListener("pointerover", onOver);
    document.removeEventListener("pointerdown", onDown);
    document.removeEventListener("pointerup", onUp);
  };
};
