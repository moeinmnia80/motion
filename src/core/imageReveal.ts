import { inview } from "./inview";
import type { ObserveOptions } from "./observer";
import { prefersReducedMotion, type Cleanup } from "./utils";

export type ImageRevealOptions = ObserveOptions & {
  /** number of slices, default 7 */
  strips?: number;
  /**
   * "y": horizontal bands that slide in alternately from the left and the right (default)
   * "x": vertical bands that slide in alternately from the top and the bottom
   */
  axis?: "x" | "y";
  /** ms between slices */
  step?: number;
  /** ms each slice takes to arrive */
  duration?: number;
  /** ms of the final scale-up to the parent's size */
  scaleDuration?: number;
  /** starting scale of the assembled image (0..1), default 0.6 */
  scaleFrom?: number;
};

/**
 * Scroll image reveal: the image arrives as rectangular slices, one from each side in turn,
 * snaps together, then scales up until it fills its parent.
 *
 *   <div data-img-reveal><img src="…" alt="…"></div>        (core builds the slices)
 *
 * The motion is CSS (transform only). When it ends, the slices are removed from rendering
 * and the original <img> takes over, so a finished reveal costs nothing.
 */
export const imageReveal = (
  el: HTMLElement,
  {
    strips = 7,
    axis = "y",
    step = 70,
    duration = 900,
    scaleDuration = 1000,
    scaleFrom = 0.6,
    ...io
  }: ImageRevealOptions = {},
): Cleanup | void => {
  const base = el.querySelector<HTMLImageElement>(":scope > img");
  if (!base) return;
  const n = Math.max(2, Math.round(strips));

  el.dataset.imgReveal = "";
  el.dataset.irAxis = axis;
  base.dataset.irBase = "";
  el.style.setProperty("--ir-n", String(n));
  el.style.setProperty("--ir-step", `${step}ms`);
  el.style.setProperty("--ir-dur", `${duration}ms`);
  el.style.setProperty("--ir-scale-dur", `${scaleDuration}ms`);
  el.style.setProperty("--ir-from", String(scaleFrom));

  // markup may be pre-rendered (React component, for SSR); otherwise build the slices
  let stage = el.querySelector<HTMLElement>(":scope > [data-ir-stage]");
  const built = !stage;
  if (!stage) {
    stage = document.createElement("div");
    stage.dataset.irStage = "";
    stage.setAttribute("aria-hidden", "true");
    for (let i = 0; i < n; i++) {
      const slice = document.createElement("img");
      slice.dataset.irStrip = "";
      slice.alt = "";
      slice.decoding = "async";
      slice.style.setProperty("--i", String(i));
      slice.src = base.currentSrc || base.src;
      if (base.srcset) slice.srcset = base.srcset;
      if (base.sizes) slice.sizes = base.sizes;
      stage.append(slice);
    }
    el.append(stage);
  }
  const done = () => {
    el.dataset.irDone = "true";
  };

  if (prefersReducedMotion()) {
    done();
    return () => teardown();
  }

  let timer = 0;
  const onEnd = (e: TransitionEvent) => {
    if (e.target === stage && e.propertyName === "transform") {
      clearTimeout(timer);
      done();
    }
  };
  stage.addEventListener("transitionend", onEnd);

  const stopView = inview(el, io);
  // safety net: if transitionend never fires (background tab), finish on a timer
  const watch = new MutationObserver(() => {
    if (el.dataset.inview === "true") {
      watch.disconnect();
      timer = window.setTimeout(done, (n - 1) * step + duration + scaleDuration + 400);
    }
  });
  watch.observe(el, { attributes: true, attributeFilter: ["data-inview"] });

  function teardown() {
    stage?.removeEventListener("transitionend", onEnd);
    if (built) stage?.remove();
    for (const k of ["imgReveal", "irAxis", "irDone", "inview"]) delete el.dataset[k];
    delete base!.dataset.irBase;
  }

  return () => {
    stopView();
    watch.disconnect();
    clearTimeout(timer);
    teardown();
  };
};
