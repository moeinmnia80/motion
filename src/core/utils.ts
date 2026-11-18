export type Cleanup = () => void;

export const isBrowser = typeof window !== "undefined";

export const prefersReducedMotion = () =>
  isBrowser && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** true for mouse/trackpad devices (not touch-only) */
export const canHover = () =>
  isBrowser && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

export const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

export const setVar = (el: HTMLElement, name: string, value: string) => {
  el.style.setProperty(name, value);
};

export const listen = <K extends keyof HTMLElementEventMap>(
  el: EventTarget,
  type: K,
  listener: (ev: HTMLElementEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions,
): Cleanup => {
  el.addEventListener(type as string, listener as EventListener, options);
  return () => {
    el.removeEventListener(type as string, listener as EventListener, options);
  };
};
