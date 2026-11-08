import { Children, type ComponentProps, type CSSProperties, type ElementType } from "react";

import type {
  CountUpOptions,
  CursorOptions,
  DrawSvgOptions,
  HighlightOptions,
  MagneticOptions,
  MarqueeOptions,
  ObserveOptions,
  ParallaxOptions,
  RevealOptions,
  RippleOptions,
  ScrambleOptions,
  ScrollFillOptions,
  ScrubOptions,
  SpotlightOptions,
  StaggerOptions,
  TiltOptions,
  TypewriterOptions,
} from "../core";
import {
  useCountUp,
  useCursor,
  useDrawSvg,
  useHScroll,
  useHighlight,
  useInView,
  useMagnetic,
  useMarquee,
  useParallax,
  useReveal,
  useRipple,
  useScramble,
  useScrollProgress,
  useScrub,
  useSpotlight,
  useStagger,
  useTilt,
  useTypewriter,
} from "./hooks";

type DivProps = Omit<ComponentProps<"div">, "ref">;
type As = { as?: ElementType };
type TextProps = Omit<ComponentProps<"p">, "ref" | "children"> &
  As & { children: string };

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

/* ------------------------- split units (JSX, SSR-safe) ------------------------- */

const renderUnits = (text: string, by: "words" | "chars") => {
  let i = 0;
  const nodes = text.split(/(\s+)/).map((part, w) =>
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
  );
  return { nodes, count: i };
};

/* ------------------------------- SplitText ------------------------------- */

type SplitTextProps = TextProps &
  ObserveOptions & { by?: "words" | "chars"; step?: number };

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
  const { nodes } = renderUnits(children, by);

  return (
    <Tag
      ref={ref}
      data-split={by}
      style={{ ...vars({ "--split-step": `${step}ms` }), ...style }}
      {...props}
    >
      <span data-split-sr="">{children}</span>
      <span aria-hidden="true">{nodes}</span>
    </Tag>
  );
};

/* ------------------------------- ScrollFill ------------------------------- */

type ScrollFillProps = TextProps & ScrollFillOptions;

/** Words light up as you scroll. Units are rendered in JSX; only --progress is written by JS. */
export const ScrollFill = ({
  as,
  children,
  start = 0.85,
  end = 0.35,
  style,
  ...props
}: ScrollFillProps) => {
  const ref = useScrollProgress({ mode: "element", start, end });
  const Tag: ElementType = as ?? "p";
  const { nodes, count } = renderUnits(children, "words");

  return (
    <Tag
      ref={ref}
      data-scroll-fill=""
      style={{ ...vars({ "--n": count }), ...style }}
      {...props}
    >
      <span data-split-sr="">{children}</span>
      <span aria-hidden="true">{nodes}</span>
    </Tag>
  );
};

/* ------------------------------ Scramble / Typewriter ------------------------------ */

export const Scramble = ({
  as,
  children,
  duration,
  chars,
  trigger,
  threshold,
  rootMargin,
  ...props
}: TextProps & Omit<ScrambleOptions, "text">) => {
  const ref = useScramble({
    text: children,
    duration,
    chars,
    trigger,
    threshold,
    rootMargin,
  });
  const Tag: ElementType = as ?? "span";
  return (
    <Tag ref={ref} {...props}>
      {children}
    </Tag>
  );
};

export const Typewriter = ({
  as,
  children,
  speed,
  delay,
  caret,
  threshold,
  rootMargin,
  ...props
}: TextProps & Omit<TypewriterOptions, "text">) => {
  const ref = useTypewriter({
    text: children,
    speed,
    delay,
    caret,
    threshold,
    rootMargin,
  });
  const Tag: ElementType = as ?? "span";
  return (
    <Tag ref={ref} {...props}>
      {children}
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

/* -------------------------- Tilt / Magnetic / Spotlight / Ripple -------------------------- */

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

export const Magnetic = ({
  as,
  strength,
  radius,
  stiffness,
  damping,
  children,
  ...props
}: DivProps & As & MagneticOptions) => {
  const ref = useMagnetic({ strength, radius, stiffness, damping });
  const Tag: ElementType = as ?? "div";
  return (
    <Tag ref={ref} data-magnetic="" {...props}>
      {children}
    </Tag>
  );
};

export const Spotlight = ({
  selector,
  children,
  ...props
}: DivProps & SpotlightOptions) => {
  const ref = useSpotlight({ selector });
  return (
    <div ref={ref} data-spotlight="" {...props}>
      {children}
    </div>
  );
};

/** `<Ripple as="button" className="…">Click</Ripple>` */
export const Ripple = ({
  as,
  color,
  duration,
  children,
  ...props
}: DivProps & As & RippleOptions) => {
  const ref = useRipple({ color, duration });
  const Tag: ElementType = as ?? "div";
  return (
    <Tag ref={ref} data-ripple="" {...props}>
      {children}
    </Tag>
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

/* ---------------------------------- Draw SVG ---------------------------------- */

/** Wrap an inline <svg>: its strokes draw in when visible. */
export const Draw = ({
  step,
  duration,
  threshold,
  rootMargin,
  once,
  children,
  ...props
}: DivProps & DrawSvgOptions) => {
  const ref = useDrawSvg({ step, duration, threshold, rootMargin, once });
  return (
    <div ref={ref} data-draw="" {...props}>
      {children}
    </div>
  );
};

/* ------------------------- ScrollProgress / Cursor ------------------------- */

/** Fixed top bar that fills as the page scrolls. Colour = currentColor. */
export const ScrollProgress = (props: DivProps) => {
  const ref = useScrollProgress<HTMLDivElement>({ mode: "page" });
  return <div ref={ref} data-scroll-progress-bar="" aria-hidden="true" {...props} />;
};

/** Render once in your layout. Native cursor stays; hide it yourself with CSS if you want. */
export const Cursor = ({
  stiffness,
  damping,
  hoverSelector,
  ...props
}: DivProps & CursorOptions) => {
  const ref = useCursor<HTMLDivElement>({ stiffness, damping, hoverSelector });
  return <div ref={ref} data-cursor="" aria-hidden="true" {...props} />;
};

/* --------------------------- Scrub / Highlight / HScroll --------------------------- */

/** Scroll-scrubbed entrance. `<Scrub effect="slide-up">…</Scrub>` */
export const Scrub = ({
  as,
  effect = "fade",
  start,
  end,
  children,
  ...props
}: DivProps & As & ScrubOptions) => {
  const ref = useScrub({ effect, start, end });
  const Tag: ElementType = as ?? "div";
  return (
    <Tag ref={ref} data-scrub={effect} {...props}>
      {children}
    </Tag>
  );
};

/** Marker highlight that paints itself while scrolling. Colour: --hl-color. */
export const Highlight = ({
  as,
  start,
  end,
  children,
  ...props
}: Omit<ComponentProps<"span">, "ref"> & As & HighlightOptions) => {
  const ref = useHighlight({ start, end });
  const Tag: ElementType = as ?? "span";
  return (
    <Tag ref={ref} data-highlight="" {...props}>
      {children}
    </Tag>
  );
};

/**
 * Pinned section: vertical scroll moves its children (panels) horizontally.
 * Every direct child is one panel. Rendered fully in JSX, so SSR-safe.
 */
export const HorizontalScroll = ({
  as,
  children,
  style,
  ...props
}: DivProps & As) => {
  const ref = useHScroll();
  const Tag: ElementType = as ?? "section";
  return (
    <Tag
      ref={ref}
      data-hscroll=""
      style={{ ...vars({ "--panels": Math.max(Children.count(children), 1) }), ...style }}
      {...props}
    >
      <div data-hscroll-sticky="">
        <div data-hscroll-track="">{children}</div>
      </div>
    </Tag>
  );
};
