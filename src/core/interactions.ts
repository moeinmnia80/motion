import { onScroll } from "./scroll";
import { subscribe } from "./ticker";
import { clamp, listen, prefersReducedMotion, setVar, type Cleanup } from "./utils";

/* ---------------------------- Collapse / Accordion ---------------------------- */
export type CollapseOptions = {
  open?: boolean;
};

/**
 * Controlled: you (or the React adapter) own `open`; the height animation is CSS.
 * Markup: <div data-collapse><div data-collapse-inner>…</div></div>
 * A closed panel is `inert`, so hidden links/buttons are not reachable with the keyboard.
 */
export const collapse = (
  el: HTMLElement,
  { open = false }: CollapseOptions = {},
): Cleanup => {
  const inner = el.querySelector<HTMLElement>(":scope > [data-collapse-inner]");
  el.dataset.collapse = "";
  el.dataset.open = String(open);
  if (inner) inner.inert = !open;
  return () => {
    delete el.dataset.collapse;
    delete el.dataset.open;
    if (inner) inner.inert = false;
  };
};

/* ------------------------------- CompareSlider ------------------------------- */
export type CompareSliderOptions = {
  initial?: number; // 0..100
};

/** Before/after slider. Direct manipulation, so it stays interactive with reduced motion. */
export const compareSlider = (
  el: HTMLElement,
  { initial = 50 }: CompareSliderOptions = {},
): Cleanup => {
  let pct = clamp(initial, 0, 100);
  el.dataset.compare = "";
  el.tabIndex = 0;
  el.setAttribute("role", "slider");
  el.setAttribute("aria-label", "Comparison");
  el.setAttribute("aria-valuemin", "0");
  el.setAttribute("aria-valuemax", "100");

  const apply = (next: number) => {
    pct = clamp(next, 0, 100);
    setVar(el, "--compare", `${pct.toFixed(2)}%`);
    el.setAttribute("aria-valuenow", String(Math.round(pct)));
  };
  apply(pct);

  let dragging = false;
  const fromEvent = (clientX: number) => {
    const rect = el.getBoundingClientRect();
    if (rect.width) apply(((clientX - rect.left) / rect.width) * 100);
  };
  const stopDrag = () => {
    dragging = false;
    delete el.dataset.compareActive;
  };

  const offs = [
    listen(el, "pointerdown", (e) => {
      dragging = true;
      el.dataset.compareActive = "true";
      el.setPointerCapture?.(e.pointerId);
      fromEvent(e.clientX);
    }),
    listen(el, "pointermove", (e) => {
      if (dragging) fromEvent(e.clientX);
    }),
    listen(el, "pointerup", stopDrag),
    listen(el, "pointercancel", stopDrag),
    listen(
      el,
      "keydown",
      (e) => {
        const step = e.shiftKey ? 10 : 2;
        const next =
          e.key === "ArrowLeft" || e.key === "ArrowDown" ? pct - step
          : e.key === "ArrowRight" || e.key === "ArrowUp" ? pct + step
          : e.key === "Home" ? 0
          : e.key === "End" ? 100
          : null;
        if (next === null) return;
        e.preventDefault();
        apply(next);
      },
      { passive: false },
    ),
  ];

  return () => {
    offs.forEach((off) => off());
    ["data-compare", "data-compare-active", "role", "aria-label", "aria-valuemin", "aria-valuemax", "aria-valuenow", "tabindex"].forEach(
      (name) => el.removeAttribute(name),
    );
  };
};

/* --------------------- FloatingDock (proximity magnification) --------------------- */
export type FloatingDockOptions = {
  itemSelector?: string;
  maxScale?: number;
  radius?: number;
};

export const floatingDock = (
  el: HTMLElement,
  { itemSelector = "[data-dock-item]", maxScale = 1.45, radius = 140 }: FloatingDockOptions = {},
): Cleanup => {
  const items = Array.from(el.querySelectorAll<HTMLElement>(itemSelector));
  if (!items.length || prefersReducedMotion()) return () => {};
  el.dataset.dock = "";

  const scales = items.map(() => 1);
  let pointerX = -1e4;
  let active = false;
  let stopTick: Cleanup | null = null;

  const tick = () => {
    // read every rect first, then write (no layout thrash)
    const targets = items.map((item) => {
      if (!active) return 1;
      const r = item.getBoundingClientRect();
      const dist = Math.abs(pointerX - (r.left + r.width / 2));
      if (dist >= radius) return 1;
      const f = Math.cos((dist / radius) * (Math.PI / 2));
      return 1 + (maxScale - 1) * f * f;
    });

    let settled = true;
    items.forEach((item, i) => {
      const next = scales[i]! + (targets[i]! - scales[i]!) * 0.22;
      if (Math.abs(next - targets[i]!) > 0.002) settled = false;
      scales[i] = !active && Math.abs(next - 1) < 0.002 ? 1 : next;
      setVar(item, "--dock-scale", scales[i]!.toFixed(3));
      setVar(item, "--dock-lift", `${((scales[i]! - 1) * -18).toFixed(2)}px`);
    });

    if (!active && settled) {
      stopTick = null;
      return false; // sleep until the pointer comes back
    }
  };
  const wake = () => {
    stopTick ??= subscribe(tick);
  };

  const offs = [
    listen(el, "pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      pointerX = e.clientX;
      active = true;
      wake();
    }),
    listen(el, "pointerleave", () => {
      active = false;
      pointerX = -1e4;
      wake();
    }),
  ];

  return () => {
    offs.forEach((off) => off());
    stopTick?.();
    delete el.dataset.dock;
    items.forEach((item) => {
      item.style.removeProperty("--dock-scale");
      item.style.removeProperty("--dock-lift");
    });
  };
};

/* ----------------------------- ScrollVelocity ----------------------------- */
export type ScrollVelocityOptions = {
  maxSkew?: number;
};

/** Kinetic skew that follows scroll speed. Writes --scroll-skew / --scroll-vel, sleeps at rest. */
export const scrollVelocity = (
  el: HTMLElement,
  { maxSkew = 6 }: ScrollVelocityOptions = {},
): Cleanup => {
  if (prefersReducedMotion()) return () => {};
  el.dataset.scrollVelocity = "";

  let lastY = window.scrollY;
  let velocity = 0;
  let skew = 0;
  let stopTick: Cleanup | null = null;

  const write = () => {
    setVar(el, "--scroll-skew", `${skew.toFixed(2)}deg`);
    setVar(el, "--scroll-vel", skew.toFixed(3));
  };
  const tick = () => {
    velocity *= 0.86;
    skew += (velocity - skew) * 0.2;
    if (Math.abs(skew) < 0.01 && Math.abs(velocity) < 0.01) {
      skew = 0;
      velocity = 0;
      write();
      stopTick = null;
      return false;
    }
    write();
  };

  const offScroll = onScroll(() => {
    const y = window.scrollY;
    velocity = clamp((y - lastY) * 0.18, -maxSkew, maxSkew);
    lastY = y;
    stopTick ??= subscribe(tick);
  });

  return () => {
    offScroll();
    stopTick?.();
    delete el.dataset.scrollVelocity;
    el.style.removeProperty("--scroll-skew");
    el.style.removeProperty("--scroll-vel");
  };
};

/* ------------------------- MorphTabs (sliding indicator) ------------------------- */
export type MorphTabsOptions = {
  activeSelector?: string;
};

export const morphTabs = (
  el: HTMLElement,
  { activeSelector = "[data-active='true']" }: MorphTabsOptions = {},
): Cleanup => {
  el.dataset.morphTabs = "";

  const sync = () => {
    const active = el.querySelector<HTMLElement>(activeSelector);
    if (!active) return;
    setVar(el, "--tab-x", `${active.offsetLeft}px`);
    setVar(el, "--tab-w", `${active.offsetWidth}px`);
  };

  sync();
  const mo = new MutationObserver(sync);
  mo.observe(el, { attributes: true, subtree: true, attributeFilter: ["data-active"] });
  const ro = new ResizeObserver(sync); // fonts loading / viewport changes
  ro.observe(el);

  return () => {
    mo.disconnect();
    ro.disconnect();
    delete el.dataset.morphTabs;
  };
};
