import {
  countUp,
  cursor,
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
  splitText,
  spotlight,
  stagger,
  tilt,
  typewriter,
  type CountUpOptions,
  type CursorOptions,
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
  type ScrollSpyOptions,
  type SplitTextOptions,
  type SpotlightOptions,
  type StaggerOptions,
  type TiltOptions,
  type TypewriterOptions,
} from "../core";
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
