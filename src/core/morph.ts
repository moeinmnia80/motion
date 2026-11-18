import { ticker } from "./ticker";
import type { Cleanup } from "./utils";

/** درون‌یابی مقادیر جئومتریک و مسیرها برای انیمیشن‌های مورفینگ */
export const morph = (el: HTMLElement, targetProps: Record<string, string>, duration = 300): Cleanup => {
  let startTime: number | null = null;

  const frame = (now: number) => {
    if (startTime === null) startTime = now;
    const progress = Math.min((now - startTime) / duration, 1);

    for (const [key, raw] of Object.entries(targetProps)) {
      if (key.includes("transform") || key.includes("scale")) {
        el.style.transform = `scale(${1 + (parseFloat(raw) - 1) * progress})`;
      }
    }

    if (progress < 1) {
      return true;
    }
    return false;
  };

  const unsub = ticker.update((now) => {
    return frame(now);
  });

  return () => {
    unsub();
  };
};
