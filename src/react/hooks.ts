import {
  countUp,
  inview,
  marquee,
  parallax,
  reveal,
  scrollProgress,
  splitText,
  stagger,
  tilt,
  type CountUpOptions,
  type MarqueeOptions,
  type ObserveOptions,
  type ParallaxOptions,
  type RevealOptions,
  type ScrollProgressOptions,
  type SplitTextOptions,
  type StaggerOptions,
  type TiltOptions,
} from "../core";
import { useMotionRef } from "./useMotionRef";

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

export const useParallax = <T extends HTMLElement = HTMLElement>(
  options: ParallaxOptions = {},
) => useMotionRef<T, ParallaxOptions>(parallax, options);

export const useTilt = <T extends HTMLElement = HTMLElement>(
  options: TiltOptions = {},
) => useMotionRef<T, TiltOptions>(tilt, options);

export const useMarquee = <T extends HTMLElement = HTMLElement>(
  options: MarqueeOptions = {},
) => useMotionRef<T, MarqueeOptions>(marquee, options);

export const useScrollProgress = <T extends HTMLElement = HTMLElement>(
  options: ScrollProgressOptions = {},
) => useMotionRef<T, ScrollProgressOptions>(scrollProgress, options);
