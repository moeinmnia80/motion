import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  countUp,
  drawSvg,
  highlight,
  hscroll,
  magnetic,
  onScrollFrame,
  parallax,
  observe,
  reveal,
  ripple,
  scramble,
  scrollFill,
  scrollProgress,
  scrollSpy,
  scrub,
  spring,
  splitText,
  stagger,
  typewriter,
} from "../src/core";

/* ----------------------------- test environment ----------------------------- */

class MockIO {
  static all: MockIO[] = [];
  els = new Set<Element>();
  constructor(
    public cb: IntersectionObserverCallback,
    public opts?: IntersectionObserverInit,
  ) {
    MockIO.all.push(this);
  }
  observe(el: Element) {
    this.els.add(el);
  }
  unobserve(el: Element) {
    this.els.delete(el);
  }
  disconnect() {}
  takeRecords() {
    return [];
  }
}
class MockRO {
  static all: MockRO[] = [];
  constructor(public cb: () => void) {
    MockRO.all.push(this);
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}
/** simulate a layout change (size / page height) */
const resized = () => MockRO.all.forEach((r) => r.cb());
const scrollTo = (y: number) => {
  Object.defineProperty(window, "scrollY", { configurable: true, value: y });
  window.dispatchEvent(new Event("scroll"));
};

const fire = (el: Element, isIntersecting = true) => {
  const io = MockIO.all.find((o) => o.els.has(el));
  if (!io) throw new Error("element is not observed");
  io.cb([{ target: el, isIntersecting } as IntersectionObserverEntry], io as never);
};

let now = 0;
let frames: FrameRequestCallback[] = [];
/** advance the fake clock, running queued animation frames every 16ms */
const advance = (ms: number) => {
  const end = now + ms;
  while (now < end) {
    now = Math.min(now + 16, end);
    const batch = frames;
    frames = [];
    batch.forEach((cb) => cb(now));
  }
};

const setMedia = (opts: { reduced?: boolean; hover?: boolean }) => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (q: string) => ({
      matches: q.includes("reduce") ? !!opts.reduced : opts.hover ?? true,
      addEventListener() {},
      removeEventListener() {},
    }),
  });
};

beforeEach(() => {
  now = 0;
  frames = [];
  setMedia({});
  vi.stubGlobal("IntersectionObserver", MockIO);
  vi.stubGlobal("ResizeObserver", MockRO);
  MockRO.all = [];
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
  advance(32); // flush pending frames so the shared scheduler is idle for the next test
  vi.unstubAllGlobals();
});

const el = (html = "") => {
  const d = document.createElement("div");
  d.innerHTML = html;
  document.body.append(d);
  return d;
};

/* --------------------------------- tests --------------------------------- */

describe("observer pool", () => {
  it("shares one IntersectionObserver for the same options", () => {
    const before = MockIO.all.length;
    observe(el(), () => {});
    observe(el(), () => {});
    observe(el(), () => {});
    expect(MockIO.all.length - before).toBeLessThanOrEqual(1);
  });

  it("once=true unobserves after the first intersection", () => {
    const a = el();
    const cb = vi.fn();
    observe(a, cb);
    fire(a, false);
    expect(cb).not.toHaveBeenCalled();
    fire(a, true);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(MockIO.all.some((o) => o.els.has(a))).toBe(false);
  });
});

describe("observer pool (shared elements)", () => {
  it("lets several effects watch the same element without overriding each other", () => {
    const a = el();
    const one = vi.fn();
    const two = vi.fn();
    const stopOne = observe(a, one);
    observe(a, two);
    fire(a);
    expect(one).toHaveBeenCalledTimes(1);
    expect(two).toHaveBeenCalledTimes(1);
    stopOne();
  });
});

describe("reveal / stagger", () => {
  it("sets attributes and data-inview when entering", () => {
    const a = el();
    reveal(a, { variant: "zoom", delay: 120, duration: 400 });
    expect(a.dataset.reveal).toBe("zoom");
    expect(a.style.getPropertyValue("--reveal-delay")).toBe("120ms");
    expect(a.style.getPropertyValue("--reveal-duration")).toBe("400ms");
    expect(a.dataset.inview).toBeUndefined();
    fire(a);
    expect(a.dataset.inview).toBe("true");
  });

  it("stagger observes the container once and delays children by index", () => {
    const c = el("<i></i><i></i><i></i>");
    stagger(c, { step: 100, start: 50, variant: "left" });
    const kids = [...c.children] as HTMLElement[];
    expect(kids.map((k) => k.style.getPropertyValue("--reveal-delay"))).toEqual([
      "50ms",
      "150ms",
      "250ms",
    ]);
    expect(kids.every((k) => k.dataset.reveal === "left")).toBe(true);
    fire(c);
    expect(c.dataset.inview).toBe("true");
  });
});

describe("text effects", () => {
  it("splitText keeps an accessible copy and restores on cleanup", () => {
    const h = el("Hello brave world");
    const stop = splitText(h, { by: "words" }) as () => void;
    expect(h.querySelector("[data-split-sr]")?.textContent).toBe("Hello brave world");
    expect(h.querySelectorAll("[data-split-unit]").length).toBe(3);
    expect(h.querySelector("[aria-hidden='true']")).not.toBeNull();
    stop();
    expect(h.textContent).toBe("Hello brave world");
    expect(h.children.length).toBe(0);
  });

  it("splitText by chars creates one unit per character", () => {
    const h = el("abc de");
    splitText(h, { by: "chars" });
    expect(h.querySelectorAll("[data-split-unit]").length).toBe(5);
  });

  it("scramble ends on the exact original text", () => {
    const h = el("Decode me");
    scramble(h, { duration: 500 });
    fire(h);
    advance(200);
    expect(h.querySelector("[aria-hidden='true']")?.textContent).toHaveLength(9);
    advance(600);
    expect(h.querySelector("[aria-hidden='true']")?.textContent).toBe("Decode me");
  });

  it("typewriter types progressively and keeps layout text", () => {
    const h = el("abcd");
    typewriter(h, { speed: 100 });
    const typed = () => h.querySelector("[data-typed]")?.textContent;
    const rest = () => h.querySelector("[data-rest]")?.textContent;
    expect(typed()).toBe("");
    expect(rest()).toBe("abcd");
    fire(h);
    advance(220);
    expect(typed()).toBe("abc".slice(0, 3));
    advance(400);
    expect(typed()).toBe("abcd");
    expect(rest()).toBe("");
    expect(h.dataset.typing).toBe("false");
  });

  it("respects prefers-reduced-motion (instant final text)", () => {
    setMedia({ reduced: true });
    const t = el("typed text");
    typewriter(t);
    expect(t.querySelector("[data-typed]")?.textContent).toBe("typed text");
    const c = el("5");
    countUp(c, { to: 1234 });
    expect(c.textContent).toBe("1,234");
  });
});

describe("countUp", () => {
  it("animates from → to after entering the viewport", () => {
    const c = el();
    countUp(c, { to: 100, from: 0, duration: 1000, locale: "en-US" });
    expect(c.textContent).toBe("0");
    fire(c);
    advance(2000);
    expect(c.textContent).toBe("100");
  });

  it("supports prefix/suffix and Intl format options", () => {
    const c = el();
    countUp(c, {
      to: 4.5,
      from: 0,
      duration: 100,
      locale: "en-US",
      prefix: "★ ",
      suffix: "/5",
      format: { minimumFractionDigits: 1 },
    });
    fire(c);
    advance(500);
    expect(c.textContent).toBe("★ 4.5/5");
  });
});

describe("drawSvg", () => {
  it("normalises every shape with pathLength=1 and index delays", () => {
    const w = el(
      '<svg><path d="M0 0L10 10"/><circle r="5"/><rect width="1" height="1"/></svg>',
    );
    drawSvg(w, { step: 200 });
    const shapes = [...w.querySelectorAll("path,circle,rect")] as SVGElement[];
    expect(shapes.every((s) => s.getAttribute("pathLength") === "1")).toBe(true);
    expect(shapes.map((s) => s.style.getPropertyValue("--draw-i"))).toEqual(["0", "1", "2"]);
    fire(w);
    expect(w.dataset.inview).toBe("true");
  });
});

describe("scrollSpy", () => {
  it("marks the link of the visible section (and keeps it between sections)", () => {
    document.body.innerHTML = `
      <nav id="nav"><a href="#a">A</a><a href="#b">B</a></nav>
      <section id="a"></section><section id="b"></section>`;
    const nav = document.getElementById("nav")!;
    const [a, b] = [...nav.querySelectorAll("a")] as HTMLAnchorElement[];
    scrollSpy(nav);

    fire(document.getElementById("a")!, true);
    expect(a!.dataset.active).toBe("true");
    expect(a!.getAttribute("aria-current")).toBe("location");
    expect(b!.dataset.active).toBe("false");

    fire(document.getElementById("a")!, false); // gap between sections
    expect(a!.dataset.active).toBe("true");

    fire(document.getElementById("b")!, true);
    expect(b!.dataset.active).toBe("true");
    expect(a!.dataset.active).toBe("false");
  });
});

describe("scroll scheduler", () => {
  it("runs every read before any write within a frame", () => {
    const log: string[] = [];
    const mk = (n: string) => () => {
      log.push(`read ${n}`);
      return () => log.push(`write ${n}`);
    };
    const s1 = onScrollFrame(mk("a"));
    const s2 = onScrollFrame(mk("b"));
    advance(20);
    expect(log.slice(0, 4)).toEqual(["read a", "read b", "write a", "write b"]);
    s1();
    s2();
  });
});

describe("scroll-driven (scrollProgress / scrollFill)", () => {
  const rect = (node: HTMLElement, top: number, height: number) =>
    vi.spyOn(node, "getBoundingClientRect").mockReturnValue({
      top,
      height,
      bottom: top + height,
      left: 0,
      right: 0,
      width: 0,
      x: 0,
      y: top,
      toJSON() {},
    });

  beforeEach(() => {
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 1000 });
  });

  it("element mode with start/end maps correctly (0 → 1) using cached geometry", () => {
    const n = el();
    // document position: top 800, height 200 (measured once, at scrollY = 0)
    const spy = rect(n, 800, 200);
    const stop = scrollProgress(n, { mode: "element", start: 0.8, end: 0.4 });
    advance(20);
    expect(n.style.getPropertyValue("--progress")).toBe("0.000");
    scrollTo(300); // element top now at 500 → halfway
    advance(20);
    expect(Number(n.style.getPropertyValue("--progress"))).toBeCloseTo(0.5, 2);
    scrollTo(600); // top at 200 → bottom at 400 → done
    advance(20);
    expect(n.style.getPropertyValue("--progress")).toBe("1.000");
    expect(spy).toHaveBeenCalledTimes(1); // no layout read while scrolling
    stop();
  });

  it("re-measures only when the layout changes", () => {
    const n = el();
    const spy = rect(n, 800, 200);
    const stop = scrollProgress(n, { mode: "element", start: 0.8, end: 0.4 });
    advance(20);
    rect(n, 400, 200).mockClear();
    resized(); // e.g. images loaded above the element
    advance(20);
    expect(n.style.getPropertyValue("--progress")).not.toBe("0.000");
    expect(spy).toBeDefined();
    stop();
  });

  it("does not write when the value did not change", () => {
    const n = el();
    rect(n, 5000, 200); // far below the viewport
    const set = vi.spyOn(n.style, "setProperty");
    const stop = scrollProgress(n, { mode: "element" });
    advance(20);
    scrollTo(10);
    advance(20);
    scrollTo(20);
    advance(20);
    expect(set).toHaveBeenCalledTimes(1); // only the first 0.000
    stop();
  });

  it("never produces NaN for a degenerate range", () => {
    const n = el();
    rect(n, 0, 1000); // hscroll with a single panel: height == viewport
    const stop = scrollProgress(n, { mode: "element", start: 0, end: 1 });
    advance(20);
    expect(n.style.getPropertyValue("--progress")).not.toContain("NaN");
    stop();
  });

  it("page mode follows the document scroll", () => {
    const n = el();
    Object.defineProperty(document.documentElement, "scrollHeight", {
      configurable: true,
      value: 3000,
    });
    const stop = scrollProgress(n, { mode: "page" });
    advance(20);
    expect(n.style.getPropertyValue("--progress")).toBe("0.000");
    scrollTo(1000); // max scroll = 3000 - 1000
    advance(20);
    expect(n.style.getPropertyValue("--progress")).toBe("0.500");
    stop();
  });

  it("scrollFill splits into words and exposes --n", () => {
    const p = el("one two three four");
    const stop = scrollFill(p) as () => void;
    expect(p.style.getPropertyValue("--n")).toBe("4");
    expect(p.dataset.scrollFill).toBeDefined();
    stop();
    expect(p.textContent).toBe("one two three four");
  });
});

describe("scrub / highlight / hscroll", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 1000 });
  });

  it("scrub sets the effect and drives --progress", () => {
    const n = el();
    vi.spyOn(n, "getBoundingClientRect").mockReturnValue({ top: 2000, height: 100 } as DOMRect);
    const stop = scrub(n, { effect: "slide-up" });
    expect(n.dataset.scrub).toBe("slide-up");
    advance(20);
    expect(n.style.getPropertyValue("--progress")).toBe("0.000");
    scrollTo(1700); // top at 300 → past the end line → fully done
    advance(20);
    expect(n.style.getPropertyValue("--progress")).toBe("1.000");
    stop();
  });

  it("scrub / highlight jump to the final state with reduced motion", () => {
    setMedia({ reduced: true });
    const a = el();
    scrub(a);
    expect(a.style.getPropertyValue("--progress")).toBe("1");
    const b = el("marker");
    highlight(b);
    expect(b.style.getPropertyValue("--progress")).toBe("1");
    expect(b.dataset.highlight).toBeDefined();
  });

  it("hscroll builds the structure, counts panels and restores on cleanup", () => {
    const s = el("<i></i><i></i><i></i><i></i>");
    const stop = hscroll(s) as () => void;
    expect(s.dataset.hscroll).toBeDefined();
    expect(s.style.getPropertyValue("--panels")).toBe("4");
    expect(s.querySelector("[data-hscroll-sticky] > [data-hscroll-track]")?.children.length).toBe(4);
    stop();
    expect(s.querySelector("[data-hscroll-sticky]")).toBeNull();
    expect(s.children.length).toBe(4);
  });

  it("hscroll keeps existing (SSR/React) markup untouched", () => {
    const s = el(
      '<div data-hscroll-sticky><div data-hscroll-track><i></i><i></i></div></div>',
    );
    const before = s.innerHTML;
    const stop = hscroll(s) as () => void;
    expect(s.innerHTML).toBe(before);
    expect(s.style.getPropertyValue("--panels")).toBe("2");
    stop();
    expect(s.innerHTML).toBe(before);
  });
});

describe("parallax", () => {
  it("moves exactly `speed` of the distance (no self-feedback)", () => {
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 1000 });
    const n = el();
    // simulate layout: the rect INCLUDES the parallax offset applied so far
    const base = 1500; // resting document top
    vi.spyOn(n, "getBoundingClientRect").mockImplementation(() => {
      const off = parseFloat(n.style.getPropertyValue("--parallax-y")) || 0;
      return { top: base + off - window.scrollY, height: 200, left: 0, width: 0 } as DOMRect;
    });
    const stop = parallax(n, { speed: 0.2 }) as () => void;
    fire(n); // enters the viewport
    scrollTo(1000);
    advance(20);
    // centre = 1500 + 100 - 1000 - 500 = 100 → -100 * 0.2 = -20
    expect(n.style.getPropertyValue("--parallax-y")).toBe("-20px");
    resized(); // force a re-measure while the offset is applied
    advance(20);
    expect(n.style.getPropertyValue("--parallax-y")).toBe("-20px"); // stable
    stop();
  });
});

describe("drawSvg (extra)", () => {
  it("skips geometry that is not painted directly (defs, clipPath, mask…)", () => {
    const w = el(
      '<svg><defs><clipPath id="c"><rect width="1" height="1"/></clipPath></defs><path d="M0 0L9 9"/></svg>',
    );
    drawSvg(w);
    expect(w.querySelectorAll("[data-draw-shape]").length).toBe(1);
    expect(w.querySelector("clipPath rect")?.hasAttribute("pathLength")).toBe(false);
  });
});

describe("spring", () => {
  it("converges to the target and then sleeps", () => {
    const seen: number[] = [];
    const s = spring([0], ([v]) => seen.push(v!));
    s.set([100]);
    advance(3000);
    expect(seen.at(-1)).toBe(100);
    const calls = seen.length;
    advance(1000);
    expect(seen.length).toBe(calls); // no more frames once at rest
    expect(frames.length).toBe(0);
  });

  it("ignores a set() to the same target (no wasted frames)", () => {
    const s = spring([5], () => {});
    s.set([5]);
    expect(frames.length).toBe(0);
  });
});

describe("pointer effects", () => {
  it("ripple adds a wave element on pointerdown and removes it when done", () => {
    const b = el("Click");
    ripple(b, { color: "red", duration: 300 });
    b.dispatchEvent(new MouseEvent("pointerdown", { clientX: 5, clientY: 5, button: 0 }));
    const wave = b.querySelector("[data-ripple-wave]") as HTMLElement;
    expect(wave).not.toBeNull();
    expect(wave.style.getPropertyValue("--ripple-color")).toBe("red");
    wave.dispatchEvent(new Event("animationend"));
    expect(b.querySelector("[data-ripple-wave]")).toBeNull();
  });

  it("magnetic is skipped on touch-only devices", () => {
    setMedia({ hover: false });
    const b = el();
    expect(magnetic(b)).toBeUndefined();
    expect(b.dataset.magnetic).toBeUndefined();
  });
});
