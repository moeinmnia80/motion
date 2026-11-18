import { isBrowser, prefersReducedMotion } from "./utils";

type Doc = Document & {
  startViewTransition?: (cb: () => void | Promise<void>) => { finished: Promise<void> };
};

/**
 * Runs a DOM/state update inside a View Transition (shared-element morphs between states).
 * Falls back to a plain update when unsupported or when reduced motion is on.
 * In React: `viewTransition(() => flushSync(() => setOpen(id)))`.
 */
export const viewTransition = (update: () => void | Promise<void>): Promise<void> => {
  const doc = isBrowser ? (document as Doc) : undefined;
  if (!doc?.startViewTransition || prefersReducedMotion()) {
    return Promise.resolve(update());
  }
  return doc.startViewTransition(update).finished;
};
