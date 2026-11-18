import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cursor, hoverRoll, imageReveal, splitOrder, splitText, ticker, typeLoop } from "../src/core";

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

let reduced = false;
let hover = true;

beforeEach(() => {
  now = 0;
  frames = [];
  reduced = false;
  hover = true;
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (q: string) => ({
      matches: q.includes("reduce") ? reduced : q.includes("hover") ? hover : false,
      addEventListener() {},
      removeEventListener() {},
    }),
  });
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    frames.push(cb);
    return frames.length;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
  // IntersectionObserver stub: everything is "in view" immediately
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(private cb: IntersectionObserverCallback) {}
      observe(el: Element) {
        this.cb([{ target: el, isIntersecting: true } as IntersectionObserverEntry], this as never);
      }
      unobserve() {}
      disconnect() {}
    },
  );
  vi.spyOn(performance, "now").mockImplementation(() => now);
  document.body.innerHTML = "";
  document.documentElement.removeAttribute("data-cursor-native");
});
afterEach(() => {
  ticker.clear();
  vi.unstubAllGlobals();
});

const el = (tag: string, html = "") => {
  const e = document.createElement(tag);
  e.innerHTML = html;
  document.body.append(e);
  return e as HTMLElement;
};

describe("splitOrder", () => {
  it("is a permutation for every mode", () => {
    for (const from of ["start", "end", "center", "random"] as const) {
      const order = splitOrder(9, from);
      expect([...order].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    }
  });
  it("start/end/center behave as named", () => {
    expect(splitOrder(4, "start")).toEqual([0, 1, 2, 3]);
    expect(splitOrder(4, "end")).toEqual([3, 2, 1, 0]);
    const c = splitOrder(5, "center");
    expect(c[2]).toBe(0); // the middle unit goes first
  });
  it("random is deterministic (SSR safe)", () => {
    expect(splitOrder(12, "random")).toEqual(splitOrder(12, "random"));
  });
});

describe("splitText variants", () => {
  it("sets data-split-variant and reorders units", () => {
    const p = el("p", "hello");
    const stop = splitText(p, { by: "chars", variant: "mask", from: "center" })!;
    expect(p.dataset.splitVariant).toBe("mask");
    const units = p.querySelectorAll<HTMLElement>("[data-split-unit]");
    expect(units).toHaveLength(5);
    expect(units[2]!.style.getPropertyValue("--i")).toBe("0");
    stop();
    expect(p.dataset.splitVariant).toBeUndefined();
    expect(p.textContent).toBe("hello");
  });
});

describe("hoverRoll", () => {
  it("builds two aria-hidden lines and keeps the text readable", () => {
    const a = el("span", "Work");
    const stop = hoverRoll(a, { to: "Projects" })!;
    expect(a.querySelectorAll("[data-roll-line]")).toHaveLength(2);
    expect(a.querySelector('[data-roll-line="b"]')!.textContent).toBe("Projects");
    expect(a.querySelector("[data-split-sr]")!.textContent).toBe("Work");
    expect(a.querySelector('[data-roll-line="a"]')!.getAttribute("aria-hidden")).toBe("true");
    stop();
    expect(a.textContent).toBe("Work");
  });

  it("rolls over itself when `to` is omitted, and supports `from`", () => {
    const a = el("span", "abc");
    hoverRoll(a, { from: "end" });
    const b = a.querySelector('[data-roll-line="b"]')!;
    expect(b.textContent).toBe("abc");
    const idx = [...b.children].map((c) => (c as HTMLElement).style.getPropertyValue("--i"));
    expect(idx).toEqual(["2", "1", "0"]);
  });

  it("a parent target toggles data-roll-active", () => {
    const link = el("a", "<span>Go</span>");
    const label = link.querySelector("span") as HTMLElement;
    hoverRoll(label, { target: link });
    link.dispatchEvent(new MouseEvent("pointerenter"));
    expect(label.dataset.rollActive).toBe("true");
    link.dispatchEvent(new MouseEvent("pointerleave"));
    expect(label.dataset.rollActive).toBe("false");
  });

  it("does not double-build pre-rendered markup", () => {
    const a = el(
      "span",
      '<span data-roll-line="a"><span data-roll-char>x</span></span><span data-roll-line="b"><span data-roll-char>y</span></span>',
    );
    hoverRoll(a);
    expect(a.querySelectorAll("[data-roll-line]")).toHaveLength(2);
  });
});

describe("typeLoop", () => {
  it("types, holds, deletes and moves to the next word", () => {
    const s = el("span", "x");
    const stop = typeLoop(s, { words: ["ab", "cd"], speed: 50, deleteSpeed: 50, pause: 200 })!;
    const typed = () => s.querySelector("[data-typed]")!.textContent!;
    expect(typed()).toBe("");
    const seen: string[] = [];
    for (let t = 0; t < 1200; t += 16) {
      advance(16);
      if (seen[seen.length - 1] !== typed()) seen.push(typed());
    }
    // first word typed in full, then deleted down to nothing, then the second word typed in full
    const after = (v: string, from: number) => seen.indexOf(v, from + 1);
    const ab = seen.indexOf("ab");
    const a = after("a", ab);
    const empty = after("", a);
    const c = after("c", empty);
    expect(ab).toBeGreaterThan(-1);
    expect(a).toBeGreaterThan(ab);
    expect(empty).toBeGreaterThan(a);
    expect(c).toBeGreaterThan(empty);
    expect(after("cd", c)).toBeGreaterThan(c);
    stop();
    expect(s.textContent).toBe("ab, cd");
  });

  it("with loop:false it stops on the last word", () => {
    const s = el("span", "x");
    typeLoop(s, { words: ["go"], speed: 20, pause: 50, loop: false });
    advance(500);
    expect(s.querySelector("[data-typed]")!.textContent).toBe("go");
    expect(ticker.size).toBe(0);
  });

  it("reduced motion shows the first word and runs nothing", () => {
    reduced = true;
    const s = el("span", "x");
    typeLoop(s, { words: ["one", "two"] });
    expect(s.querySelector("[data-typed]")!.textContent).toBe("one");
    expect(ticker.size).toBe(0);
  });
});

describe("imageReveal", () => {
  const html = '<img src="/a.jpg" alt="A">';

  it("builds N slices, marks the base and finishes on transitionend", () => {
    const box = el("div", html);
    const stop = imageReveal(box, { strips: 5 })!;
    const strips = box.querySelectorAll("[data-ir-strip]");
    expect(strips).toHaveLength(5);
    expect(box.querySelector("img[data-ir-base]")).not.toBeNull();
    expect(box.querySelector("[data-ir-stage]")!.getAttribute("aria-hidden")).toBe("true");
    expect(box.dataset.inview).toBe("true");
    expect(box.dataset.irDone).toBeUndefined();

    const ev = new Event("transitionend", { bubbles: true }) as TransitionEvent;
    Object.defineProperty(ev, "propertyName", { value: "transform" });
    box.querySelector("[data-ir-stage]")!.dispatchEvent(ev);
    expect(box.dataset.irDone).toBe("true");

    stop();
    expect(box.querySelector("[data-ir-stage]")).toBeNull();
    expect(box.querySelector("img")!.getAttribute("src")).toBe("/a.jpg");
  });

  it("reduced motion: finished at once", () => {
    reduced = true;
    const box = el("div", html);
    imageReveal(box);
    expect(box.dataset.irDone).toBe("true");
  });

  it("does nothing without an <img>", () => {
    const box = el("div", "<p>no image</p>");
    expect(imageReveal(box)).toBeUndefined();
  });
});

describe("cursor variants", () => {
  it("label variant creates a text node and follows data-cursor-label", () => {
    const c = el("div");
    const stop = cursor(c, { variant: "label" })!;
    expect(c.dataset.cursorVariant).toBe("label");
    const target = el("a", "x");
    target.dataset.cursorLabel = "View";
    target.dispatchEvent(new MouseEvent("pointerover", { bubbles: true }));
    expect(c.querySelector("[data-cursor-text]")!.textContent).toBe("View");
    expect(c.dataset.cursorHasLabel).toBe("true");
    stop();
  });

  it("data-cursor-style switches the variant while hovered", () => {
    const c = el("div");
    cursor(c, { variant: "dot" });
    const t = el("div", "x");
    t.dataset.cursorStyle = "blend";
    t.dispatchEvent(new MouseEvent("pointerover", { bubbles: true }));
    expect(c.dataset.cursorVariant).toBe("blend");
    el("div", "y").dispatchEvent(new MouseEvent("pointerover", { bubbles: true }));
    expect(c.dataset.cursorVariant).toBe("dot");
  });

  it("dual adds and removes the instant dot; hideNative is reversible", () => {
    const c = el("div");
    const stop = cursor(c, { variant: "dual", hideNative: true })!;
    expect(document.querySelector("[data-cursor-dot]")).not.toBeNull();
    expect(document.documentElement.dataset.cursorNative).toBe("hidden");
    stop();
    expect(document.querySelector("[data-cursor-dot]")).toBeNull();
    expect(document.documentElement.dataset.cursorNative).toBeUndefined();
  });

  it("does nothing on touch devices", () => {
    hover = false;
    const c = el("div");
    expect(cursor(c, { variant: "dual" })).toBeUndefined();
    expect(document.querySelector("[data-cursor-dot]")).toBeNull();
  });
});
