import { ticker, tickWhileVisible } from "./ticker";
import { prefersReducedMotion, type Cleanup } from "./utils";

/* --------------------------- 1. 3D Gyro Card --------------------------- */
export type GyroCard3DOptions = {
  maxTilt?: number;
  perspective?: number;
  scale?: number;
  glare?: boolean;
};

export const gyroCard3d = (
  el: HTMLElement,
  { maxTilt = 14, perspective = 1000, scale = 1.03, glare = true }: GyroCard3DOptions = {},
): Cleanup | void => {
  if (prefersReducedMotion()) return;

  el.dataset.gyro3d = "";
  el.style.setProperty("--g3d-persp", `${perspective}px`);
  el.style.setProperty("--g3d-scale", String(scale));

  let glareEl: HTMLDivElement | null = null;
  if (glare) {
    glareEl = document.createElement("div");
    glareEl.dataset.gyro3dGlare = "";
    el.appendChild(glareEl);
  }

  let rect: DOMRect | null = null;
  let targetX = 0;
  let targetY = 0;
  let curX = 0;
  let curY = 0;
  let active = false;
  let stopTick: Cleanup | null = null;

  const ensureLoop = () => {
    if (stopTick) return;
    stopTick = ticker.update((_, dt) => {
      const ease = 1 - Math.exp(-14 * dt);
      curX += (targetX - curX) * ease;
      curY += (targetY - curY) * ease;

      el.style.setProperty("--g3d-rx", `${curX.toFixed(2)}deg`);
      el.style.setProperty("--g3d-ry", `${curY.toFixed(2)}deg`);

      if (!active && Math.abs(curX) < 0.02 && Math.abs(curY) < 0.02) {
        el.style.setProperty("--g3d-rx", "0deg");
        el.style.setProperty("--g3d-ry", "0deg");
        stopTick = null;
        return false;
      }
    });
  };

  const onEnter = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    rect = el.getBoundingClientRect();
    active = true;
    el.dataset.gyro3dActive = "true";
    ensureLoop();
  };

  const onMove = (e: PointerEvent) => {
    if (!active || !rect) return;
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    targetX = -ny * maxTilt * 2;
    targetY = nx * maxTilt * 2;
    el.style.setProperty("--g3d-gx", `${((nx + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty("--g3d-gy", `${((ny + 0.5) * 100).toFixed(1)}%`);
  };

  const onLeave = () => {
    active = false;
    rect = null;
    targetX = 0;
    targetY = 0;
    el.dataset.gyro3dActive = "false";
    ensureLoop();
  };

  el.addEventListener("pointerenter", onEnter);
  el.addEventListener("pointermove", onMove, { passive: true });
  el.addEventListener("pointerleave", onLeave);

  return () => {
    el.removeEventListener("pointerenter", onEnter);
    el.removeEventListener("pointermove", onMove);
    el.removeEventListener("pointerleave", onLeave);
    stopTick?.();
    glareEl?.remove();
  };
};

/* ------------------------- 2. 3D Cylinder Ring ------------------------- */
export type Carousel3DOptions = {
  radius?: number;
  autoSpeed?: number;
  perspective?: number;
};

export const carousel3d = (
  container: HTMLElement,
  { radius = 280, autoSpeed = 14, perspective = 1100 }: Carousel3DOptions = {},
): Cleanup => {
  container.dataset.carousel3d = "";
  container.style.setProperty("--c3d-persp", `${perspective}px`);

  const stage = container.firstElementChild as HTMLElement | null;
  const items = stage ? (Array.from(stage.children) as HTMLElement[]) : [];
  const count = Math.max(items.length, 1);
  const stepAngle = 360 / count;

  items.forEach((item, i) => {
    item.dataset.carousel3dItem = "";
    item.style.transform = `rotateY(${i * stepAngle}deg) translateZ(${radius}px)`;
  });

  let angle = 0;
  let velocity = 0;
  let dragging = false;
  let lastX = 0;

  const onDown = (e: PointerEvent) => {
    dragging = true;
    lastX = e.clientX;
    velocity = 0;
    container.setPointerCapture(e.pointerId);
  };

  const onMove = (e: PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    velocity = dx * 0.45;
    angle += velocity;
  };

  const onUp = () => {
    dragging = false;
  };

  container.addEventListener("pointerdown", onDown);
  container.addEventListener("pointermove", onMove);
  container.addEventListener("pointerup", onUp);
  container.addEventListener("pointercancel", onUp);

  const stopTick = tickWhileVisible(container, (_, dt) => {
    if (!dragging) {
      angle += autoSpeed * dt + velocity;
      velocity *= Math.pow(0.05, dt);
    }
    if (stage) {
      stage.style.transform = `translateZ(-${radius * 0.4}px) rotateY(${angle.toFixed(2)}deg)`;
    }
  });

  return () => {
    container.removeEventListener("pointerdown", onDown);
    container.removeEventListener("pointermove", onMove);
    container.removeEventListener("pointerup", onUp);
    container.removeEventListener("pointercancel", onUp);
    stopTick();
  };
};

/* ---------------- 7. 3D Flip Cube & Spatial Fold Stage ----------------- */
export type Cube3DOptions = {
  size?: number;
  perspective?: number;
};

export const cube3d = (
  el: HTMLElement,
  { size = 220, perspective = 950 }: Cube3DOptions = {},
) => {
  el.dataset.cube3d = "";
  el.style.setProperty("--cube-size", `${size}px`);
  el.style.setProperty("--cube-persp", `${perspective}px`);

  const box = el.firstElementChild as HTMLElement | null;
  const faces = box ? (Array.from(box.children) as HTMLElement[]) : [];
  const half = size / 2;
  const transforms = [
    `rotateY(0deg) translateZ(${half}px)`,
    `rotateY(90deg) translateZ(${half}px)`,
    `rotateY(180deg) translateZ(${half}px)`,
    `rotateY(-90deg) translateZ(${half}px)`,
    `rotateX(90deg) translateZ(${half}px)`,
    `rotateX(-90deg) translateZ(${half}px)`,
  ];

  faces.forEach((f, i) => {
    f.dataset.cube3dFace = "";
    if (transforms[i]) f.style.transform = transforms[i]!;
  });

  let rx = -18;
  let ry = 28;
  let targetRx = rx;
  let targetRy = ry;
  let auto = true;

  const rotateToFace = (index: number) => {
    auto = false;
    const presets: [number, number][] = [
      [0, 0],
      [0, -90],
      [0, -180],
      [0, 90],
      [-90, 0],
      [90, 0],
    ];
    const p = presets[index % presets.length]!;
    targetRx = p[0];
    targetRy = p[1];
  };

  const stopTick = tickWhileVisible(el, (_, dt) => {
    if (auto) {
      targetRy += dt * 28;
      targetRx = Math.sin(targetRy * 0.02) * 20;
    }
    const ease = 1 - Math.exp(-10 * dt);
    rx += (targetRx - rx) * ease;
    ry += (targetRy - ry) * ease;
    if (box) {
      box.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    }
  });

  return {
    rotateToFace,
    resumeAuto: () => {
      auto = true;
    },
    destroy: stopTick,
  };
};
