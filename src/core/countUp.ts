import { observe, type ObserveOptions } from "./observer";
import { prefersReducedMotion, type Cleanup } from "./utils";

export type CountUpOptions = Omit<ObserveOptions, "once"> & {
  to: number;
  from?: number;
  /** ms */
  duration?: number;
  /** pass it explicitly in SSR apps to avoid hydration mismatch */
  locale?: string;
  format?: Intl.NumberFormatOptions;
  prefix?: string;
  suffix?: string;
};

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

export const countUp = (
  el: HTMLElement,
  {
    to,
    from = 0,
    duration = 1600,
    locale,
    format,
    prefix = "",
    suffix = "",
    ...io
  }: CountUpOptions,
): Cleanup | void => {
  const nf = new Intl.NumberFormat(locale, format);
  const render = (value: number) => {
    el.textContent = prefix + nf.format(value) + suffix;
  };

  if (prefersReducedMotion()) {
    render(to);
    return;
  }

  render(from);
  let frame = 0;

  const run = () => {
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      render(from + (to - from) * easeOutExpo(p));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  };

  const stop = observe(el, run, { ...io, once: true });

  return () => {
    stop();
    cancelAnimationFrame(frame);
    render(to);
  };
};
