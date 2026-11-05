import type { ComponentProps, CSSProperties, ElementType } from "react";

import type {
  CountUpOptions,
  MarqueeOptions,
  ObserveOptions,
  ParallaxOptions,
  RevealOptions,
  StaggerOptions,
  TiltOptions,
} from "../core";
import {
  useCountUp,
  useInView,
  useMarquee,
  useParallax,
  useReveal,
  useScrollProgress,
  useStagger,
  useTilt,
} from "./hooks";

type DivProps = Omit<ComponentProps<"div">, "ref">;
type As = { as?: ElementType };

const vars = (v: Record<string, string | number>) => v as CSSProperties;

/* -------------------------------- Reveal -------------------------------- */

export const Reveal = ({
  as,
  variant = "up",
  delay,
  duration,
  threshold,
  rootMargin,
  once,
  children,
  ...props
}: DivProps & As & RevealOptions) => {
  const ref = useReveal({ variant, delay, duration, threshold, rootMargin, once });
  const Tag: ElementType = as ?? "div";
  return (
    // data-reveal is rendered on the server so the first paint is already hidden
    <Tag ref={ref} data-reveal={variant} {...props}>
      {children}
    </Tag>
  );
};

/* -------------------------------- Stagger -------------------------------- */

export const Stagger = ({
  as,
  selector,
  step,
  start,
  variant,
  duration,
  threshold,
  rootMargin,
  once,
  children,
  ...props
}: DivProps & As & StaggerOptions) => {
  const ref = useStagger({
    selector,
    step,
    start,
    variant,
    duration,
    threshold,
    rootMargin,
    once,
  });
  const Tag: ElementType = as ?? "div";
  return (
    <Tag ref={ref} data-stagger="" {...props}>
      {children}
    </Tag>
  );
};

/* -------------------------------- CountUp -------------------------------- */

type CountUpProps = Omit<ComponentProps<"span">, "ref" | "children"> &
  CountUpOptions;

export const CountUp = ({
  to,
  from,
  duration,
  // explicit default locale: server and client must format identically
  locale = "en-US",
  format,
  prefix = "",
  suffix = "",
  threshold,
  rootMargin,
  ...props
}: CountUpProps) => {
  const ref = useCountUp<HTMLSpanElement>({
    to,
    from,
    duration,
    locale,
    format,
    prefix,
    suffix,
    threshold,
    rootMargin,
  });
  const text = prefix + new Intl.NumberFormat(locale, format).format(to) + suffix;
  return (
    <span ref={ref} {...props}>
      {text}
    </span>
  );
};

/* ------------------------------- SplitText ------------------------------- */

type SplitTextProps = Omit<ComponentProps<"p">, "ref" | "children"> &
  As &
  ObserveOptions & {
    children: string;
    by?: "words" | "chars";
    step?: number;
  };

/** Pure JSX (no DOM mutation), so it is SSR/hydration safe. */
export const SplitText = ({
  as,
  children,
  by = "words",
  step = 40,
  threshold,
  rootMargin,
  once,
  style,
  ...props
}: SplitTextProps) => {
  const ref = useInView({ threshold, rootMargin, once });
  const Tag: ElementType = as ?? "p";
  let i = 0;

  return (
    <Tag
      ref={ref}
      data-split={by}
      style={{ ...vars({ "--split-step": `${step}ms` }), ...style }}
      {...props}
    >
      <span data-split-sr="">{children}</span>
      <span aria-hidden="true">
        {children.split(/(\s+)/).map((part, w) =>
          !part ? null : /^\s+$/.test(part) ? (
            " "
          ) : (
            <span key={w} data-split-word="">
              {(by === "chars" ? Array.from(part) : [part]).map((chunk, c) => (
                <span key={c} data-split-unit="" style={vars({ "--i": i++ })}>
                  {chunk}
                </span>
              ))}
            </span>
          ),
        )}
      </span>
    </Tag>
  );
};

/* -------------------------------- Parallax -------------------------------- */

export const Parallax = ({
  speed,
  axis = "y",
  children,
  ...props
}: DivProps & ParallaxOptions) => {
  const ref = useParallax({ speed, axis });
  return (
    <div ref={ref} data-parallax={axis} {...props}>
      {children}
    </div>
  );
};

/* ---------------------------------- Tilt ---------------------------------- */

export const Tilt = ({
  max,
  scale,
  perspective,
  children,
  ...props
}: DivProps & TiltOptions) => {
  const ref = useTilt({ max, scale, perspective });
  return (
    <div ref={ref} data-tilt="" {...props}>
      {children}
    </div>
  );
};

/* --------------------------------- Marquee --------------------------------- */

export const Marquee = ({
  speed,
  direction = "left",
  pauseOnHover = true,
  gap,
  children,
  ...props
}: DivProps & MarqueeOptions) => {
  const ref = useMarquee({ speed, direction, pauseOnHover, gap });
  return (
    <div
      ref={ref}
      data-marquee=""
      data-direction={direction}
      data-pause={pauseOnHover ? "" : undefined}
      {...props}
    >
      <div data-marquee-track="">{children}</div>
      <div data-marquee-track="" aria-hidden="true">
        {children}
      </div>
    </div>
  );
};

/* ----------------------------- ScrollProgress ----------------------------- */

/** Fixed top bar that fills as the page scrolls. Colour = currentColor. */
export const ScrollProgress = (props: DivProps) => {
  const ref = useScrollProgress<HTMLDivElement>({ mode: "page" });
  return <div ref={ref} data-scroll-progress-bar="" aria-hidden="true" {...props} />;
};
