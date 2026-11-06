export type Cleanup = () => void;

export const isBrowser = typeof window !== "undefined";

export const prefersReducedMotion = () =>
  isBrowser && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** true for mouse/trackpad devices (not touch-only) */
export const canHover = () =>
  isBrowser && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
