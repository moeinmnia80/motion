import type { ComponentProps, CSSProperties, ElementType, ReactNode } from "react";
import { Children, useCallback } from "react";
import type {
  Cube3DOptions,
  HighlightOptions,
  HoverRollOptions,
  ImageRevealOptions,
  ScrubOptions,
  SplitFrom,
  SplitVariant,
  TypeLoopOptions,
} from "../core";
import { hoverRoll, splitOrder } from "../core";
import { useCube3D, useHighlight, useHscroll, useImageReveal, useScrub, useTypeLoop } from "./hooks";

import type {
  CountUpOptions,
  CursorOptions,
  Carousel3DOptions,
  CollapseOptions,
  CompareSliderOptions,
  FloatingDockOptions,
  MorphTabsOptions,
  ScrollVelocityOptions,
  DragOptions,
  GyroCard3DOptions,
  DrawSvgOptions,
  MagneticOptions,
  MarqueeOptions,
  ObserveOptions,
  ParallaxOptions,
  RevealOptions,
  RippleOptions,
  ScrollRailOptions,
  ScrambleOptions,
  ScrollFillOptions,
  SpotlightOptions,
  StaggerOptions,
  TiltOptions,
  TypewriterOptions,
} from "../core";
import {
  useCountUp,
  useCursor,
  useCarousel3D,
  useCollapse,
  useCompareSlider,
  useFloatingDock,
  useMorphTabs,
  useScrollVelocity,
  useDrag,
  useGyroCard3D,
  useDrawSvg,
  useInView,
  useMagnetic,
  useMarquee,
  useParallax,
  useReveal,
  useRipple,
  useScramble,
  useScrollProgress,
  useScrollRail,
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
  decimals,
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
    decimals,
    locale,
    format,
    prefix,
    suffix,
    threshold,
    rootMargin,
  });
  const dp = decimals ?? Math.max(
    String(to).split(".")[1]?.length ?? 0,
    String(from ?? 0).split(".")[1]?.length ?? 0
  );
  const text = prefix + new Intl.NumberFormat(locale, {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
    ...format,
  }).format(to) + suffix;
  return (
    <span ref={ref} {...props}>
      {text}
    </span>
  );
};

/* ------------------------- split units (JSX, SSR-safe) ------------------------- */

const renderUnits = (text: string, by: "words" | "chars", from: SplitFrom = "start") => {
  const parts = text.split(/(\s+)/);
  const total = parts.reduce(
    (n, part) => n + (!part || /^\s+$/.test(part) ? 0 : by === "chars" ? Array.from(part).length : 1),
    0,
  );
  const order = splitOrder(total, from);
  let i = 0;
  const nodes = parts.map((part, w) =>
    !part ? null : /^\s+$/.test(part) ? (
      " "
    ) : (
      <span key={w} data-split-word="">
        {(by === "chars" ? Array.from(part) : [part]).map((chunk, c) => (
          <span key={c} data-split-unit="" style={vars({ "--i": order[i++] ?? 0 })}>
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
  ObserveOptions & {
    by?: "words" | "chars";
    step?: number;
    /** entrance style: up (default) down fade blur scale rotate mask mask-down */
    variant?: SplitVariant;
    /** which unit goes first */
    from?: SplitFrom;
  };

/** Pure JSX (no DOM mutation), so it is SSR/hydration safe. */
export const SplitText = ({
  as,
  children,
  by = "words",
  step = 40,
  variant = "up",
  from = "start",
  threshold,
  rootMargin,
  once,
  style,
  ...props
}: SplitTextProps) => {
  const ref = useInView({ threshold, rootMargin, once });
  const Tag: ElementType = as ?? "p";
  const { nodes } = renderUnits(children, by, from);

  return (
    <Tag
      ref={ref}
      data-split={by}
      data-split-variant={variant === "up" ? undefined : variant}
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
  variant,
  hideNative,
  ...props
}: DivProps & CursorOptions) => {
  const ref = useCursor<HTMLDivElement>({ stiffness, damping, hoverSelector, variant, hideNative });
  return <div ref={ref} data-cursor="" aria-hidden="true" {...props} />;
};

/* ------------------------------- Drag / Rail ------------------------------- */

/** Draggable element with a spring release. Compose with `rotate`/`scale` (it only uses `translate`). */
export const Drag = ({
  axis,
  snap,
  throwFactor,
  stiffness,
  damping,
  children,
  ...props
}: DivProps & DragOptions) => {
  const ref = useDrag({ axis, snap, throwFactor, stiffness, damping });
  return (
    <div ref={ref} data-drag="" {...props}>
      {children}
    </div>
  );
};

/** Pinned horizontal scroll. `overlay` renders inside the pinned area and can read --progress. */
export const Rail = ({
  track,
  overlay,
  children,
  ...props
}: DivProps & ScrollRailOptions & { overlay?: ReactNode }) => {
  const ref = useScrollRail({ track });
  return (
    <div ref={ref} data-rail="" {...props}>
      <div data-rail-sticky="">
        {overlay}
        <div data-rail-track="">{children}</div>
      </div>
    </div>
  );
};

/* ------------------------------- 3D Components ------------------------------- */

export const GyroCard3D = ({
  maxTilt,
  perspective,
  scale,
  glare,
  children,
  ...props
}: DivProps & GyroCard3DOptions) => {
  const ref = useGyroCard3D({ maxTilt, perspective, scale, glare });
  return (
    <div ref={ref} {...props}>
      {children}
    </div>
  );
};

export const Carousel3D = ({
  radius,
  autoSpeed,
  perspective,
  children,
  ...props
}: DivProps & Carousel3DOptions) => {
  const ref = useCarousel3D({ radius, autoSpeed, perspective });
  return (
    <div ref={ref} {...props}>
      <div data-carousel3d-stage="">{children}</div>
    </div>
  );
};

/* ------------------------- New Interactive Primitives ------------------------- */

export const Collapse = ({
  open = false,
  children,
  ...props
}: DivProps & CollapseOptions) => {
  const ref = useCollapse<HTMLDivElement>({ open });
  return (
    <div ref={ref} data-collapse="" data-open={open ? "true" : "false"} {...props}>
      <div data-collapse-inner="">{children}</div>
    </div>
  );
};

export const CompareSlider = ({
  initial = 50,
  before,
  after,
  handleClassName,
  ...props
}: DivProps & CompareSliderOptions & { before: ReactNode; after: ReactNode; handleClassName?: string }) => {
  const ref = useCompareSlider<HTMLDivElement>({ initial });
  return (
    <div ref={ref} data-compare="" {...props}>
      <div>{before}</div>
      <div data-compare-after="">{after}</div>
      <div data-compare-handle="" className={handleClassName}>
        <span data-compare-grip="" aria-hidden="true">
          ⇄
        </span>
      </div>
    </div>
  );
};

export const FloatingDock = ({
  itemSelector,
  maxScale,
  radius,
  children,
  ...props
}: DivProps & FloatingDockOptions) => {
  const ref = useFloatingDock<HTMLDivElement>({ itemSelector, maxScale, radius });
  return (
    <div ref={ref} data-dock="" {...props}>
      {children}
    </div>
  );
};

export const ScrollVelocity = ({
  maxSkew,
  children,
  ...props
}: DivProps & ScrollVelocityOptions) => {
  const ref = useScrollVelocity<HTMLDivElement>({ maxSkew });
  return (
    <div ref={ref} data-scroll-velocity="" {...props}>
      {children}
    </div>
  );
};

export const MorphTabs = ({
  activeSelector,
  indicatorClassName,
  children,
  ...props
}: DivProps & MorphTabsOptions & { indicatorClassName?: string }) => {
  const ref = useMorphTabs<HTMLDivElement>({ activeSelector });
  return (
    <div ref={ref} data-morph-tabs="" {...props}>
      {children}
      <div data-morph-indicator="" className={indicatorClassName} />
    </div>
  );
};

export const Shimmer = ({
  children,
  ...props
}: DivProps) => {
  return (
    <div data-shimmer="" {...props}>
      {children}
    </div>
  );
};

/* ------------------------- scrub / highlight / hscroll / cube ------------------------- */

/** Scroll-scrubbed entrance (reverses when you scroll back). */
export const Scrub = ({ as, effect = "fade", start, end, children, ...props }: DivProps & As & ScrubOptions) => {
  const ref = useScrub({ effect, start, end });
  const Tag: ElementType = as ?? "div";
  return (
    <Tag ref={ref} data-scrub={effect} {...props}>
      {children}
    </Tag>
  );
};

/** Marker stroke that paints itself behind inline text as you scroll. */
export const Highlight = ({ as, start, end, children, ...props }: DivProps & As & HighlightOptions) => {
  const ref = useHighlight({ start, end });
  const Tag: ElementType = as ?? "span";
  return (
    <Tag ref={ref} data-highlight="" {...props}>
      {children}
    </Tag>
  );
};

/** Pinned section: vertical scroll moves full-width panels sideways. Each child is one panel. */
export const HScroll = ({ children, style, ...props }: DivProps) => {
  const ref = useHscroll<HTMLDivElement>();
  return (
    <div ref={ref} data-hscroll="" style={{ ...vars({ "--panels": Children.count(children) }), ...style }} {...props}>
      <div data-hscroll-sticky="">
        <div data-hscroll-track="">{children}</div>
      </div>
    </div>
  );
};

/** Pass exactly 6 children (the faces). */
export const Cube3D = ({ size, perspective, children, ...props }: DivProps & Cube3DOptions) => {
  const ref = useCube3D<HTMLDivElement>({ size, perspective });
  return (
    <div ref={ref} data-cube3d="" {...props}>
      <div>{children}</div>
    </div>
  );
};

/* ------------------------------ TypeLoop ------------------------------ */

/** Rotating typewriter: `<TypeLoop words={["design", "build", "ship"]} />` */
export const TypeLoop = ({
  as,
  words,
  speed,
  deleteSpeed,
  pause,
  delay,
  loop,
  caret,
  ...props
}: Omit<ComponentProps<"span">, "ref" | "children"> & As & TypeLoopOptions) => {
  const ref = useTypeLoop({ words, speed, deleteSpeed, pause, delay, loop, caret });
  const Tag: ElementType = as ?? "span";
  // the first word is in the server HTML, so there is no empty flash before hydration
  return (
    <Tag ref={ref} {...props}>
      {words[0]}
    </Tag>
  );
};

/* ------------------------------ HoverRoll ------------------------------ */

type HoverRollProps = Omit<ComponentProps<"span">, "ref" | "children"> &
  As &
  Omit<HoverRollOptions, "target"> & {
    children: string;
    /** a CSS selector of the ancestor that triggers the roll (e.g. "a" or "button"), default: the text itself */
    parent?: string;
  };

const rollLine = (text: string, name: "a" | "b", by: "chars" | "words", from: "start" | "end" | "center") => {
  const parts = by === "chars" ? Array.from(text) : text.split(/(\s+)/).filter(Boolean);
  const n = parts.length;
  const mid = (n - 1) / 2;
  return (
    <span data-roll-line={name} aria-hidden="true">
      {parts.map((part, i) => (
        <span
          key={i}
          data-roll-char=""
          style={vars({
            "--i": from === "end" ? n - 1 - i : from === "center" ? Math.round(Math.abs(i - mid)) : i,
          })}
        >
          {part}
        </span>
      ))}
    </span>
  );
};

/**
 * Hover text swap. Markup is rendered in JSX (SSR safe); the same word rolls over itself
 * or turns into `to`. Wrap it in a link or button and pass `parent` so hovering the whole
 * link triggers it:  <a><HoverRoll parent="a">Work</HoverRoll></a>
 */
export const HoverRoll = ({
  as,
  children,
  to,
  direction = "up",
  effect = "slide",
  by = "chars",
  step = 18,
  from = "start",
  parent,
  style,
  ...props
}: HoverRollProps) => {
  const Tag: ElementType = as ?? "span";
  // stable identity: React re-runs a ref callback (and its cleanup) whenever the function changes
  const ref = useCallback(
    (el: HTMLElement | null) => {
      if (!el) return;
      const target = parent ? (el.closest(parent) ?? undefined) : undefined;
      return hoverRoll(el, { to, direction, effect, by, step, from, target }) || undefined;
    },
    [to, direction, effect, by, step, from, parent],
  );
  return (
    <Tag
      ref={ref}
      data-hover-roll=""
      data-roll-dir={direction}
      data-roll-effect={effect}
      style={{ ...vars({ "--roll-step": `${step}ms` }), ...style }}
      {...props}
    >
      <span data-split-sr="">{children}</span>
      {rollLine(children, "a", by, from)}
      {rollLine(to ?? children, "b", by, from)}
    </Tag>
  );
};

/* ------------------------------ ImageReveal ------------------------------ */

type ImageRevealProps = Omit<ComponentProps<"div">, "ref" | "children"> &
  ImageRevealOptions & {
    src: string;
    alt: string;
    /** extra props for the real <img> (loading, width, height, sizes, srcSet...) */
    imgProps?: Omit<ComponentProps<"img">, "src" | "alt" | "ref">;
  };

/**
 * Slices fly in from alternating sides, snap together, then the image scales up to the
 * parent's size. Give the component a size (e.g. `aspect-ratio` or a height) and it fills it.
 */
export const ImageReveal = ({
  src,
  alt,
  imgProps,
  strips = 7,
  axis = "y",
  step,
  duration,
  scaleDuration,
  scaleFrom,
  threshold,
  rootMargin,
  once,
  style,
  ...props
}: ImageRevealProps) => {
  const n = Math.max(2, Math.round(strips));
  const ref = useImageReveal<HTMLDivElement>({
    strips: n,
    axis,
    step,
    duration,
    scaleDuration,
    scaleFrom,
    threshold,
    rootMargin,
    once,
  });
  return (
    <div
      ref={ref}
      data-img-reveal=""
      data-ir-axis={axis}
      style={{ ...vars({ "--ir-n": n }), ...style }}
      {...props}
    >
      <img src={src} alt={alt} data-ir-base="" {...imgProps} />
      <div data-ir-stage="" aria-hidden="true">
        {Array.from({ length: n }, (_, i) => (
          <img
            key={i}
            src={src}
            alt=""
            data-ir-strip=""
            decoding="async"
            style={vars({ "--i": i })}
          />
        ))}
      </div>
    </div>
  );
};
