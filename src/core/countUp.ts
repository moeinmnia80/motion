import { observe, type ObserveOptions } from "./observer";
import { prefersReducedMotion, type Cleanup } from "./utils";

export type CountUpOptions = Omit<ObserveOptions, "once"> & {
  to: number;
  from?: number;
  /** ms (default 2000 for smooth deceleration) */
  duration?: number;
  /** Number of decimal places (defaults to 0, or inferred from `to`/`from` if decimals are passed) */
  decimals?: number;
  /** pass it explicitly in SSR apps to avoid hydration mismatch */
  locale?: string;
  format?: Intl.NumberFormatOptions;
  prefix?: string;
  suffix?: string;
};

const easeOutQuart = (t: number) => 1 - (1 - t) ** 4;

const inferDecimals = (a: number, b: number) => {
  const sA = String(a).split(".")[1]?.length ?? 0;
  const sB = String(b).split(".")[1]?.length ?? 0;
  return Math.max(sA, sB);
};

export const countUp = (
  el: HTMLElement,
  {
    to,
    from = 0,
    duration = 2000,
    decimals,
    locale,
    format,
    prefix = "",
    suffix = "",
    ...io
  }: CountUpOptions,
): Cleanup | void => {
  const dp = decimals ?? inferDecimals(to, from);
  const nf = new Intl.NumberFormat(locale, {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
    ...format,
  });

  const render = (value: number) => {
    const rounded = dp === 0 ? Math.round(value) : Number(value.toFixed(dp));
    el.textContent = prefix + nf.format(rounded) + suffix;
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
      const eased = easeOutQuart(p);
      render(from + (to - from) * eased);
      if (p < 1) frame = requestAnimationFrame(tick);
      else render(to);
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
