import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { collapse, compareSlider, floatingDock, morph, pin, scrollVelocity, ticker } from "../src/core";

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
  Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
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

describe("ticker", () => {
  it("runs phases read → update → write and survives a throwing callback", () => {
    const order: string[] = [];
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    ticker.write(() => { order.push("write"); return false; });
    ticker.update(() => { throw new Error("boom"); });
    ticker.update(() => { order.push("update"); return false; });
    ticker.read(() => { order.push("read"); return false; });
    advance(16);
    expect(order).toEqual(["read", "update", "write"]);
    expect(ticker.size).toBe(0); // the broken one was dropped, the loop kept going
    error.mockRestore();
  });
});

describe("collapse (controlled)", () => {
  it("mirrors `open` onto data-open and makes a closed panel inert", () => {
    const c = div("<div data-collapse-inner><button>x</button></div>");
    const inner = c.querySelector<HTMLElement>("[data-collapse-inner]")!;
    const stop = collapse(c, { open: false });
    expect(c.dataset.open).toBe("false");
    expect(inner.inert).toBe(true);
    stop();
    collapse(c, { open: true });
    expect(c.dataset.open).toBe("true");
    expect(inner.inert).toBe(false);
  });
});

describe("compareSlider", () => {
  it("is keyboard accessible and clamps to 0..100", () => {
    const s = div();
    const stop = compareSlider(s, { initial: 50 });
    expect(s.getAttribute("role")).toBe("slider");
    s.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    expect(s.getAttribute("aria-valuenow")).toBe("52");
    s.dispatchEvent(new KeyboardEvent("keydown", { key: "End" }));
    s.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", shiftKey: true }));
    expect(s.getAttribute("aria-valuenow")).toBe("100");
    stop();
    expect(s.getAttribute("role")).toBeNull();
  });

  it("stays interactive with prefers-reduced-motion", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: () => ({ matches: true, addEventListener() {}, removeEventListener() {} }),
    });
    const s = div();
    compareSlider(s);
    s.dispatchEvent(new KeyboardEvent("keydown", { key: "Home" }));
    expect(s.getAttribute("aria-valuenow")).toBe("0");
  });
});

describe("loops that must sleep", () => {
  it("scrollVelocity writes skew while scrolling, then unsubscribes from the ticker", () => {
    const h = div();
    const stop = scrollVelocity(h);
    advance(32); // the initial scroll frame settles
    Object.defineProperty(window, "scrollY", { configurable: true, value: 100 });
    window.dispatchEvent(new Event("scroll"));
    advance(48);
    expect(Math.abs(Number.parseFloat(h.style.getPropertyValue("--scroll-skew")))).toBeGreaterThan(0);
    advance(6000);
    expect(ticker.size).toBe(0);
    expect(h.style.getPropertyValue("--scroll-skew")).toBe("0.00deg");
    stop();
  });

  it("floatingDock magnifies near the pointer and sleeps after it leaves", () => {
    const d = div("<i data-dock-item></i><i data-dock-item></i>");
    const stop = floatingDock(d);
    d.dispatchEvent(Object.assign(new MouseEvent("pointermove", { clientX: 10 }), { pointerType: "mouse" }));
    advance(200);
    const item = d.querySelector<HTMLElement>("[data-dock-item]")!;
    expect(Number(item.style.getPropertyValue("--dock-scale"))).toBeGreaterThan(1);
    d.dispatchEvent(new MouseEvent("pointerleave"));
    advance(3000);
    expect(item.style.getPropertyValue("--dock-scale")).toBe("1.000");
    expect(ticker.size).toBe(0);
    stop();
  });

  it("morph reaches its target and unsubscribes", () => {
    const el = div();
    morph(el, { scale: "1.5" }, 200);
    advance(400);
    expect(el.style.transform).toBe("scale(1.5)");
    expect(ticker.size).toBe(0);
  });
});

describe("pin", () => {
  it("pins with sticky (no per-frame work) and restores the parent", () => {
    const parent = div('<section id="p">x</section>');
    parent.style.paddingBottom = "10px";
    const el = parent.querySelector<HTMLElement>("#p")!;
    const stop = pin(el, { end: 300, top: 8 });
    expect(el.style.position).toBe("sticky");
    expect(el.style.top).toBe("8px");
    expect(parent.style.paddingBottom).toMatch(/^calc\(/);
    expect(ticker.size).toBe(0);
    stop();
    expect(el.style.position).toBe("");
    expect(parent.style.paddingBottom).toBe("10px");
  });
});
