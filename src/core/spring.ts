import { ticker } from "./ticker";
import type { Cleanup } from "./utils";

export type SpringOptions = {
  stiffness?: number;
  damping?: number;
  mass?: number;
  /** rest threshold */
  precision?: number;
};

export type Spring = {
  /** animate towards a new target */
  set: (target: number[]) => void;
  /** snap to a value, no animation */
  jump: (value: number[]) => void;
  stop: () => void;
};

/**
 * Zero-allocation N-dimensional damped-spring simulation backed by the shared ticker.
 * Uses typed Float64Arrays internally to eliminate GC pressure during 60/120fps animations.
 */
export const spring = (
  initial: number[],
  onUpdate: (value: number[]) => void,
  { stiffness = 170, damping = 22, mass = 1, precision = 0.01 }: SpringOptions = {},
): Spring => {
  const len = initial.length;
  const value = new Float64Array(initial);
  const target = new Float64Array(initial);
  const velocity = new Float64Array(len);
  const out = [...initial];
  const invMass = 1 / mass;

  let stopTick: Cleanup | null = null;

  const step = (_now: number, dt: number): boolean | void => {
    let moving = false;

    for (let i = 0; i < len; i++) {
      const v = value[i]!;
      const t = target[i]!;
      const vel = velocity[i]!;
      const force = -stiffness * (v - t) - damping * vel;
      const nextVel = vel + force * invMass * dt;
      const nextVal = v + nextVel * dt;

      velocity[i] = nextVel;
      value[i] = nextVal;
      out[i] = nextVal;

      if (Math.abs(nextVel) > precision || Math.abs(nextVal - t) > precision) {
        moving = true;
      }
    }

    if (!moving) {
      for (let i = 0; i < len; i++) {
        const t = target[i]!;
        value[i] = t;
        velocity[i] = 0;
        out[i] = t;
      }
      stopTick = null;
      onUpdate(out);
      return false; // auto-unsubscribe from ticker
    }

    onUpdate(out);
  };

  return {
    set(next) {
      let changed = false;
      for (let i = 0; i < len; i++) {
        if (next[i] !== target[i]) {
          target[i] = next[i]!;
          changed = true;
        }
      }
      if (!changed) return;
      if (!stopTick) {
        stopTick = ticker.update(step);
      }
    },
    jump(next) {
      for (let i = 0; i < len; i++) {
        const v = next[i]!;
        value[i] = v;
        target[i] = v;
        velocity[i] = 0;
        out[i] = v;
      }
      onUpdate(out);
    },
    stop() {
      if (stopTick) {
        stopTick();
        stopTick = null;
      }
    },
  };
};
