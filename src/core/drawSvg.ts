import { inview } from "./inview";
import type { ObserveOptions } from "./observer";

export type DrawSvgOptions = ObserveOptions & {
  /** ms between consecutive shapes */
  step?: number;
  /** ms per shape */
  duration?: number;
};

const SHAPES = "path,line,polyline,polygon,circle,ellipse,rect";

/** Strokes of an <svg> (or a wrapper around one) draw themselves in when visible. */
export const drawSvg = (
  el: HTMLElement | SVGElement,
  { step = 120, duration, ...io }: DrawSvgOptions = {},
) => {
  const host = el as HTMLElement;
  host.querySelectorAll<SVGGeometryElement>(SHAPES).forEach((shape, i) => {
    shape.setAttribute("pathLength", "1"); // normalises dash maths for every shape
    shape.style.setProperty("--draw-i", String(i));
  });
  host.dataset.draw = "";
  host.style.setProperty("--draw-step", `${step}ms`);
  if (duration !== undefined) {
    host.style.setProperty("--draw-duration", `${duration}ms`);
  }
  return inview(host, io);
};
