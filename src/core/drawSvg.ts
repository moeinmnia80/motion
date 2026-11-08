import { inview } from "./inview";
import type { ObserveOptions } from "./observer";

export type DrawSvgOptions = ObserveOptions & {
  /** ms between consecutive shapes */
  step?: number;
  /** ms per shape */
  duration?: number;
};

const SHAPES = "path,line,polyline,polygon,circle,ellipse,rect";
// geometry in these is never painted directly: leave it alone
const NOT_PAINTED = "defs,clipPath,mask,marker,pattern,symbol";

/**
 * Strokes of an <svg> (or a wrapper around one) draw themselves in when visible.
 * Shapes without a `stroke` are drawn as an outline in `currentColor`
 * (see motion.css); give them `stroke`/`fill` yourself to control the look.
 */
export const drawSvg = (
  el: HTMLElement | SVGElement,
  { step = 120, duration, ...io }: DrawSvgOptions = {},
) => {
  const host = el as HTMLElement;
  let i = 0;
  host.querySelectorAll<SVGGeometryElement>(SHAPES).forEach((shape) => {
    if (shape.closest(NOT_PAINTED)) return;
    shape.setAttribute("pathLength", "1"); // normalises dash maths for every shape
    shape.setAttribute("data-draw-shape", "");
    shape.style.setProperty("--draw-i", String(i++));
  });
  host.dataset.draw = "";
  host.style.setProperty("--draw-step", `${step}ms`);
  if (duration !== undefined) {
    host.style.setProperty("--draw-duration", `${duration}ms`);
  }
  return inview(host, io);
};
