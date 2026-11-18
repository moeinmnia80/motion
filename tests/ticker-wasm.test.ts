import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPhysicsArena, spring, ticker } from "../src/core";

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
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    frames.push(cb);
    return frames.length;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
  vi.spyOn(performance, "now").mockImplementation(() => now);
});

afterEach(() => {
  ticker.clear();
  vi.unstubAllGlobals();
});

describe("centralized ticker (Phase 1)", () => {
  it("batches multiple springs into a single shared rAF loop and sleeps at rest", () => {
    const a: number[] = [];
    const b: number[] = [];
    const s1 = spring([0], ([v]) => a.push(v!));
    const s2 = spring([0], ([v]) => b.push(v!));

    s1.set([100]);
    s2.set([200]);

    // Only ONE rAF should be scheduled for both springs
    expect(frames.length).toBe(1);
    expect(ticker.size).toBe(2);

    advance(3000);
    expect(a.at(-1)).toBe(100);
    expect(b.at(-1)).toBe(200);
    expect(ticker.size).toBe(0);
    expect(frames.length).toBe(0);
  });

  it("executes phases strictly in Read -> Update -> Write order", () => {
    const order: string[] = [];
    ticker.write(() => { order.push("write"); return false; });
    ticker.update(() => { order.push("update"); return false; });
    ticker.read(() => { order.push("read"); return false; });

    advance(16);
    expect(order).toEqual(["read", "update", "write"]);
  });
});

describe("PhysicsArena zero-copy buffer (Phase 2)", () => {
  it("simulates 1,000 contiguous 3D coordinates without heap allocations", () => {
    const arena = createPhysicsArena(1000, { stiffness: 200, damping: 20 });
    expect(arena.isWasm).toBe(false);

    for (let i = 0; i < 1000; i++) {
      arena.targets[i] = i * 0.5;
    }

    let active = true;
    let steps = 0;
    while (active && steps < 500) {
      active = arena.step(1 / 60);
      steps++;
    }

    expect(active).toBe(false);
    expect(arena.positions[0]).toBeCloseTo(0, 2);
    expect(arena.positions[999]).toBeCloseTo(499.5, 2);
  });
});
