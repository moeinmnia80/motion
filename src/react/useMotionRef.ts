import { useCallback } from "react";

import type { Cleanup } from "../core";

/**
 * The whole React adapter in one function: connects a core function to a ref.
 * React 19 ref callbacks may return a cleanup, so no useEffect is needed.
 * Options must be JSON-serialisable (they are used as the dependency key).
 */
export function useMotionRef<T extends HTMLElement, O extends object>(
  attach: (el: T, options: O) => Cleanup | void,
  options: O,
) {
  const key = JSON.stringify(options);

  return useCallback(
    (el: T | null) => {
      if (!el) return;
      const cleanup = attach(el, JSON.parse(key) as O);
      return cleanup ? () => void cleanup() : undefined;
    },
    [attach, key],
  );
}
