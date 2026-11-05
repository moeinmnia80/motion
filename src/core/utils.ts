export type Cleanup = () => void;

export const isBrowser = typeof window !== "undefined";

export const prefersReducedMotion = () =>
  isBrowser && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
