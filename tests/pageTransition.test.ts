import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { pageLinks, pageTransition, canPageTransition } from "../src/core";

type Doc = Document & { startViewTransition?: unknown };

beforeEach(() => {
  window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof matchMedia;
});

afterEach(() => {
  delete (document as Doc).startViewTransition;
  document.body.innerHTML = "";
  delete document.documentElement.dataset.pt;
});

const fakeVT = () => {
  const seen: string[] = [];
  (document as Doc).startViewTransition = (cb: () => unknown) => {
    seen.push(document.documentElement.dataset.pt ?? "");
    const p = Promise.resolve(cb());
    return { finished: p, ready: p };
  };
  return seen;
};

describe("pageTransition", () => {
  it("runs the update directly when the API is missing", async () => {
    const fn = vi.fn();
    expect(canPageTransition()).toBe(false);
    await pageTransition(fn, { variant: "circle" });
    expect(fn).toHaveBeenCalledOnce();
  });

  it("sets data-pt during the transition and clears it after", async () => {
    const seen = fakeVT();
    await pageTransition(() => {}, { variant: "curtain", duration: 400, origin: { x: 10, y: 20 } });
    expect(seen).toEqual(["curtain"]);
    expect(document.documentElement.dataset.pt).toBeUndefined();
    expect(document.getElementById("motion-page-transition")).not.toBeNull();
  });

  it("variant none skips the API", async () => {
    const seen = fakeVT();
    const fn = vi.fn();
    await pageTransition(fn, { variant: "none" });
    expect(seen).toEqual([]);
    expect(fn).toHaveBeenCalledOnce();
  });
});

describe("pageLinks", () => {
  it("intercepts same-origin links, ignores modified clicks and external links", async () => {
    fakeVT();
    document.body.innerHTML = `<a id="a" href="/x">x</a><a id="b" href="https://other.example/y">y</a>`;
    const navigate = vi.fn((href: string) => {
      history.pushState({}, "", href);
    });
    const variant = vi.fn(() => "fade" as const);
    const stop = pageLinks({ navigate, variant });

    document.getElementById("b")!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(navigate).not.toHaveBeenCalled();

    document.getElementById("a")!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, ctrlKey: true }));
    expect(navigate).not.toHaveBeenCalled();

    const ev = new MouseEvent("click", { bubbles: true, cancelable: true });
    document.getElementById("a")!.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
    expect(navigate).toHaveBeenCalledWith("/x");
    expect(variant).toHaveBeenCalledWith(expect.any(String), "/x");
    stop();
  });
});
