import type { Cleanup } from "./utils";

export type MarqueeOptions = {
  /** px per second */
  speed?: number;
  direction?: "left" | "right";
  pauseOnHover?: boolean;
  /** px */
  gap?: number;
};

/**
 * Infinite marquee (CSS animation, JS only measures).
 * Expects either two `[data-marquee-track]` children (React adapter renders them)
 * or plain children, in which case the tracks are built for you.
 */
export const marquee = (
  el: HTMLElement,
  { speed = 50, direction = "left", pauseOnHover = true, gap }: MarqueeOptions = {},
): Cleanup => {
  let built = false;
  let tracks = el.querySelectorAll<HTMLElement>(":scope > [data-marquee-track]");

  if (tracks.length === 0) {
    built = true;
    const track = document.createElement("div");
    track.dataset.marqueeTrack = "";
    track.append(...Array.from(el.childNodes));
    const clone = track.cloneNode(true) as HTMLElement;
    clone.setAttribute("aria-hidden", "true");
    el.append(track, clone);
    tracks = el.querySelectorAll<HTMLElement>(":scope > [data-marquee-track]");
  }

  el.dataset.marquee = "";
  el.dataset.direction = direction;
  if (pauseOnHover) el.dataset.pause = "";
  else delete el.dataset.pause;
  if (gap !== undefined) el.style.setProperty("--marquee-gap", `${gap}px`);

  const first = tracks[0];
  const measure = () => {
    if (!first) return;
    const gapPx = parseFloat(getComputedStyle(el).columnGap) || 0;
    const seconds = (first.getBoundingClientRect().width + gapPx) / speed;
    el.style.setProperty("--marquee-duration", `${seconds.toFixed(2)}s`);
  };

  measure();
  const ro = new ResizeObserver(measure);
  ro.observe(el);
  if (first) ro.observe(first);

  return () => {
    ro.disconnect();
    if (built && first) {
      first.replaceWith(...Array.from(first.childNodes));
      tracks[1]?.remove();
    }
  };
};
