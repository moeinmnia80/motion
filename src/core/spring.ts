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
 * Tiny damped-spring simulation (N dimensions). Runs a rAF loop only while
 * moving and sleeps at rest, so idle cost is zero.
 */
export const spring = (
  initial: number[],
  onUpdate: (value: number[]) => void,
  { stiffness = 170, damping = 22, mass = 1, precision = 0.01 }: SpringOptions = {},
): Spring => {
  const value = [...initial];
  const target = [...initial];
  const velocity = initial.map(() => 0);
  let frame = 0;
  let last = 0;

  const tick = (now: number) => {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    let moving = false;

    for (let i = 0; i < value.length; i++) {
      const force = -stiffness * (value[i]! - target[i]!) - damping * velocity[i]!;
      velocity[i] = velocity[i]! + (force / mass) * dt;
      value[i] = value[i]! + velocity[i]! * dt;
      if (
        Math.abs(velocity[i]!) > precision ||
        Math.abs(value[i]! - target[i]!) > precision
      ) {
        moving = true;
      }
    }

    if (!moving) {
      for (let i = 0; i < value.length; i++) {
        value[i] = target[i]!;
        velocity[i] = 0;
      }
      frame = 0;
      onUpdate(value);
      return;
    }
    onUpdate(value);
    frame = requestAnimationFrame(tick);
  };

  return {
    set(next) {
      if (next.every((v, i) => v === target[i])) return;
      next.forEach((v, i) => (target[i] = v));
      if (!frame) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    },
    jump(next) {
      next.forEach((v, i) => {
        value[i] = v;
        target[i] = v;
        velocity[i] = 0;
      });
      onUpdate(value);
    },
    stop() {
      cancelAnimationFrame(frame);
      frame = 0;
    },
  };
};
