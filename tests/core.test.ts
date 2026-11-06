import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  countUp,
  drawSvg,
  magnetic,
  observe,
  reveal,
  ripple,
  scramble,
  scrollFill,
  scrollProgress,
  scrollSpy,
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
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    frames.push(cb);
    return frames.length;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
  vi.spyOn(performance, "now").mockImplementation(() => now);
  document.body.innerHTML = "";
});
afterEach(() => vi.unstubAllGlobals());

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

  it("element mode with start/end maps correctly (0 → 1)", () => {
    const n = el();
    const stop = scrollProgress(n, { mode: "element", start: 0.8, end: 0.4 });
    // height 200: progress 0 when top = 800, progress 1 when bottom = 400 (top = 200)
    rect(n, 800, 200);
    advance(20);
    expect(n.style.getPropertyValue("--progress")).toBe("0.0000");
    rect(n, 500, 200);
    window.dispatchEvent(new Event("scroll"));
    advance(20);
    expect(Number(n.style.getPropertyValue("--progress"))).toBeCloseTo(0.5, 2);
    rect(n, 200, 200);
    window.dispatchEvent(new Event("scroll"));
    advance(20);
    expect(n.style.getPropertyValue("--progress")).toBe("1.0000");
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
