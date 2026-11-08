import { scrollProgress } from "./scrollProgress";
import { prefersReducedMotion, type Cleanup } from "./utils";

/**
 * Vertical scroll drives a horizontal strip of panels (a pinned section).
 * Expected markup (the React adapter renders it; otherwise it is built for you):
 *   <section data-hscroll>
 *     <div data-hscroll-sticky><div data-hscroll-track> …panels… </div></div>
 *   </section>
 * JS writes --progress and --panels; the translation is CSS (`translate`).
 */
export const hscroll = (el: HTMLElement): Cleanup | void => {
  let built = false;
  let sticky = el.querySelector<HTMLElement>(":scope > [data-hscroll-sticky]");
  let track = sticky?.querySelector<HTMLElement>(":scope > [data-hscroll-track]");

  if (!sticky || !track) {
    built = true;
    sticky = document.createElement("div");
    sticky.dataset.hscrollSticky = "";
    track = document.createElement("div");
    track.dataset.hscrollTrack = "";
    track.append(...Array.from(el.childNodes));
    sticky.append(track);
    el.append(sticky);
  }

  el.dataset.hscroll = "";
  el.style.setProperty("--panels", String(Math.max(track.children.length, 1)));

  const restore = () => {
    if (!built || !track || !sticky) return;
    el.replaceChildren(...Array.from(track.childNodes));
  };

  // reduced motion: plain horizontally scrollable strip (CSS), no scroll hijack
  if (prefersReducedMotion()) return restore;

  const stop = scrollProgress(el, { mode: "element", start: 0, end: 1 });
  return () => {
    stop();
    restore();
  };
};
