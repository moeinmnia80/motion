import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { drag, scrollRail, scrolled, ticker, viewTransition } from "../src/core";

let now = 0;
let frames: FrameRequestCallback[] = [];
const advance = (ms: number) => {
  const end = now + ms;
  while (now < end) {
    now = Math.min(now + 16, end);
    const batch = frames;
    frames = [];
    batch.forEach((cb) => cb(now));
  }
};

beforeEach(() => {
  now = 0;
  frames = [];
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  });
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    frames.push(cb);
    return frames.length;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
  vi.spyOn(performance, "now").mockImplementation(() => now);
  document.body.innerHTML = "";
});
afterEach(() => {
  ticker.clear();
  vi.unstubAllGlobals();
});

const div = (html = "") => {
  const d = document.createElement("div");
  d.innerHTML = html;
  document.body.append(d);
  return d;
};

describe("v0.3 effects", () => {
  it("scrolled flips data-scrolled and the direction", () => {
    const h = div();
    const stop = scrolled(h, { threshold: 10 });
    advance(32);
    expect(h.dataset.scrolled).toBe("false");
    Object.defineProperty(window, "scrollY", { configurable: true, value: 120 });
    window.dispatchEvent(new Event("scroll"));
    advance(32);
    expect(h.dataset.scrolled).toBe("true");
    expect(h.dataset.scrollDir).toBe("down");
    stop();
  });

  it("drag follows the pointer, then springs back", () => {
    const b = div();
    const stop = drag(b) as () => void;
    b.dispatchEvent(new MouseEvent("pointerdown", { clientX: 0, clientY: 0, button: 0 }));
    expect(b.dataset.dragging).toBe("true");
    b.dispatchEvent(new MouseEvent("pointermove", { clientX: 50, clientY: 20 }));
    expect(b.style.getPropertyValue("--dx")).toBe("50.0px");
    expect(b.style.getPropertyValue("--dy")).toBe("20.0px");
    b.dispatchEvent(new MouseEvent("pointerup"));
    advance(4000);
    expect(b.style.getPropertyValue("--dx")).toBe("0.0px");
    expect(b.dataset.dragging).toBe("false");
    stop();
  });

  it("drag axis=x ignores vertical movement", () => {
    const b = div();
    drag(b, { axis: "x" });
    b.dispatchEvent(new MouseEvent("pointerdown", { button: 0 }));
    b.dispatchEvent(new MouseEvent("pointermove", { clientX: 30, clientY: 99 }));
    expect(b.style.getPropertyValue("--dy")).toBe("0.0px");
  });

  it("scrollRail marks ready, sizes the section and cleans up", () => {
    vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
    const s = div("<div data-rail-track></div>");
    const stop = scrollRail(s) as () => void;
    expect(s.dataset.railReady).toBeDefined();
    expect(s.style.height).toBe(`${window.innerHeight}px`);
    stop();
    expect(s.dataset.railReady).toBeUndefined();
  });

  it("viewTransition falls back to a plain update", async () => {
    const update = vi.fn();
    await viewTransition(update);
    expect(update).toHaveBeenCalledOnce();
  });
});
