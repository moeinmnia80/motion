import {
  pageLinks,
  type PageLinksOptions,
  countUp,
  cursor,
  carousel3d,
  collapse,
  compareSlider,
  floatingDock,
  morphTabs,
  scrollVelocity,
  drag,
  gyroCard3d,
  drawSvg,
  inview,
  magnetic,
  marquee,
  parallax,
  reveal,
  ripple,
  scrollFill,
  scrollProgress,
  scrollSpy,
  scramble,
  scrollRail,
  scrolled,
  splitText,
  spotlight,
  stagger,
  tilt,
  typewriter,
  type CountUpOptions,
  type CursorOptions,
  type Carousel3DOptions,
  type CollapseOptions,
  type CompareSliderOptions,
  type FloatingDockOptions,
  type MorphTabsOptions,
  type ScrollVelocityOptions,
  type DragOptions,
  type GyroCard3DOptions,
  type DrawSvgOptions,
  type MagneticOptions,
  type MarqueeOptions,
  type ObserveOptions,
  type ParallaxOptions,
  type RevealOptions,
  type RippleOptions,
  type ScrambleOptions,
  type ScrollFillOptions,
  type ScrollProgressOptions,
  type ScrollRailOptions,
  type ScrollSpyOptions,
  type ScrolledOptions,
  type SplitTextOptions,
  type SpotlightOptions,
  type StaggerOptions,
  type TiltOptions,
  type TypewriterOptions,
} from "../core";
import {
  cube3d,
  highlight,
  hoverRoll,
  hscroll,
  imageReveal,
  scrub,
  typeLoop,
  type Cube3DOptions,
  type HighlightOptions,
  type HoverRollOptions,
  type ImageRevealOptions,
  type ScrubOptions,
  type TypeLoopOptions,
} from "../core";
import { useEffect, useRef } from "react";
import { useMotionRef } from "./useMotionRef";

/* every hook: `const ref = useX(options)` → `<element ref={ref} />` */

export const useInView = <T extends HTMLElement = HTMLElement>(
  options: ObserveOptions = {},
) => useMotionRef<T, ObserveOptions>(inview, options);

export const useReveal = <T extends HTMLElement = HTMLElement>(
  options: RevealOptions = {},
) => useMotionRef<T, RevealOptions>(reveal, options);

export const useStagger = <T extends HTMLElement = HTMLElement>(
  options: StaggerOptions = {},
) => useMotionRef<T, StaggerOptions>(stagger, options);

export const useCountUp = <T extends HTMLElement = HTMLElement>(
  options: CountUpOptions,
) => useMotionRef<T, CountUpOptions>(countUp, options);

export const useSplitText = <T extends HTMLElement = HTMLElement>(
  options: SplitTextOptions = {},
) => useMotionRef<T, SplitTextOptions>(splitText, options);

export const useScramble = <T extends HTMLElement = HTMLElement>(
  options: ScrambleOptions = {},
) => useMotionRef<T, ScrambleOptions>(scramble, options);

export const useTypewriter = <T extends HTMLElement = HTMLElement>(
  options: TypewriterOptions = {},
) => useMotionRef<T, TypewriterOptions>(typewriter, options);

export const useParallax = <T extends HTMLElement = HTMLElement>(
  options: ParallaxOptions = {},
) => useMotionRef<T, ParallaxOptions>(parallax, options);

export const useTilt = <T extends HTMLElement = HTMLElement>(
  options: TiltOptions = {},
) => useMotionRef<T, TiltOptions>(tilt, options);

export const useMagnetic = <T extends HTMLElement = HTMLElement>(
  options: MagneticOptions = {},
) => useMotionRef<T, MagneticOptions>(magnetic, options);

export const useSpotlight = <T extends HTMLElement = HTMLElement>(
  options: SpotlightOptions = {},
) => useMotionRef<T, SpotlightOptions>(spotlight, options);

export const useRipple = <T extends HTMLElement = HTMLElement>(
  options: RippleOptions = {},
) => useMotionRef<T, RippleOptions>(ripple, options);

export const useCursor = <T extends HTMLElement = HTMLElement>(
  options: CursorOptions = {},
) => useMotionRef<T, CursorOptions>(cursor, options);

export const useMarquee = <T extends HTMLElement = HTMLElement>(
  options: MarqueeOptions = {},
) => useMotionRef<T, MarqueeOptions>(marquee, options);

export const useDrawSvg = <T extends HTMLElement = HTMLElement>(
  options: DrawSvgOptions = {},
) => useMotionRef<T, DrawSvgOptions>(drawSvg, options);

export const useScrollProgress = <T extends HTMLElement = HTMLElement>(
  options: ScrollProgressOptions = {},
) => useMotionRef<T, ScrollProgressOptions>(scrollProgress, options);

export const useScrollFill = <T extends HTMLElement = HTMLElement>(
  options: ScrollFillOptions = {},
) => useMotionRef<T, ScrollFillOptions>(scrollFill, options);

export const useScrollSpy = <T extends HTMLElement = HTMLElement>(
  options: ScrollSpyOptions = {},
) => useMotionRef<T, ScrollSpyOptions>(scrollSpy, options);

export const useDrag = <T extends HTMLElement = HTMLElement>(
  options: DragOptions = {},
) => useMotionRef<T, DragOptions>(drag, options);

export const useScrollRail = <T extends HTMLElement = HTMLElement>(
  options: ScrollRailOptions = {},
) => useMotionRef<T, ScrollRailOptions>(scrollRail, options);

export const useScrolled = <T extends HTMLElement = HTMLElement>(
  options: ScrolledOptions = {},
) => useMotionRef<T, ScrolledOptions>(scrolled, options);

export const useGyroCard3D = <T extends HTMLElement = HTMLElement>(
  options: GyroCard3DOptions = {},
) => useMotionRef<T, GyroCard3DOptions>(gyroCard3d, options);

export const useCarousel3D = <T extends HTMLElement = HTMLElement>(
  options: Carousel3DOptions = {},
) => useMotionRef<T, Carousel3DOptions>(carousel3d, options);

export const useCollapse = <T extends HTMLElement = HTMLElement>(
  options: CollapseOptions = {},
) => useMotionRef<T, CollapseOptions>(collapse, options);

export const useCompareSlider = <T extends HTMLElement = HTMLElement>(
  options: CompareSliderOptions = {},
) => useMotionRef<T, CompareSliderOptions>(compareSlider, options);

export const useFloatingDock = <T extends HTMLElement = HTMLElement>(
  options: FloatingDockOptions = {},
) => useMotionRef<T, FloatingDockOptions>(floatingDock, options);

export const useScrollVelocity = <T extends HTMLElement = HTMLElement>(
  options: ScrollVelocityOptions = {},
) => useMotionRef<T, ScrollVelocityOptions>(scrollVelocity, options);

export const useMorphTabs = <T extends HTMLElement = HTMLElement>(
  options: MorphTabsOptions = {},
) => useMotionRef<T, MorphTabsOptions>(morphTabs, options);

export const useScrub = <T extends HTMLElement = HTMLElement>(options: ScrubOptions = {}) =>
  useMotionRef<T, ScrubOptions>(scrub, options);

export const useHighlight = <T extends HTMLElement = HTMLElement>(options: HighlightOptions = {}) =>
  useMotionRef<T, HighlightOptions>(highlight, options);

export const useHscroll = <T extends HTMLElement = HTMLElement>() =>
  useMotionRef<T, object>(hscroll, {});

// module-level so the ref callback keeps a stable identity between renders
const attachCube = (el: HTMLElement, options: Cube3DOptions) => cube3d(el, options).destroy;
export const useCube3D = <T extends HTMLElement = HTMLElement>(options: Cube3DOptions = {}) =>
  useMotionRef<T, Cube3DOptions>(attachCube, options);

/** Options are serialised, so `target` (an element) is not supported here: use the HoverRoll `parent` prop. */
export const useHoverRoll = <T extends HTMLElement = HTMLElement>(
  options: Omit<HoverRollOptions, "target"> = {},
) => useMotionRef<T, Omit<HoverRollOptions, "target">>(hoverRoll, options);

export const useImageReveal = <T extends HTMLElement = HTMLElement>(
  options: ImageRevealOptions = {},
) => useMotionRef<T, ImageRevealOptions>(imageReveal, options);

export const useTypeLoop = <T extends HTMLElement = HTMLElement>(options: TypeLoopOptions) =>
  useMotionRef<T, TypeLoopOptions>(typeLoop, options);

/**
 * Page transitions for every same-origin link (View Transitions API). Pass your router's `push`:
 * `usePageLinks({ navigate: router.push, variant: "curtain" })`. Mount once, near the root.
 */
export const usePageLinks = (options: PageLinksOptions) => {
  const ref = useRef(options);
  ref.current = options;
  useEffect(
    () =>
      pageLinks({
        ...ref.current,
        navigate: (href) => ref.current.navigate(href),
        variant: (from, to) => {
          const v = ref.current.variant;
          return typeof v === "function" ? v(from, to) : (v ?? "fade");
        },
      }),
    [],
  );
};
