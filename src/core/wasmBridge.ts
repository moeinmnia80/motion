/**
 * Zero-Copy Bridge for Rust/WASM PhysicsArena (Phase 2 & 3 Foundation).
 * Maps WASM linear memory directly into JS Float32Array views so 3D vertex/matrix
 * buffers can be uploaded straight to WebGL/WebGPU without serialization overhead.
 */

export interface WasmPhysicsExports {
  memory: WebAssembly.Memory;
  PhysicsArena: new (
    count: number,
    stiffness: number,
    damping: number,
    mass: number,
  ) => {
    positions_ptr(): number;
    targets_ptr(): number;
    len(): number;
    step(dt: number, precision: number): boolean;
    free(): void;
  };
}

export type BatchPhysicsBuffer = {
  /** Direct Float32Array view over positions (ready for gl.bufferSubData) */
  readonly positions: Float32Array;
  /** Direct Float32Array view over targets (mutate in-place without GC) */
  readonly targets: Float32Array;
  /** Advance simulation by dt seconds; returns true while active */
  step: (dt: number, precision?: number) => boolean;
  /** Release arena memory */
  dispose: () => void;
  /** Whether backed by native Rust/WASM or pure JS TypedArray fallback */
  readonly isWasm: boolean;
};

/**
 * Creates a contiguous Arena buffer for batch spring / 3D particle simulation.
 * Automatically uses compiled Rust/WASM if loaded, or falls back to a zero-GC
 * Float32Array solver in pure JS so the package stays 100% dependency-free.
 */
export const createPhysicsArena = (
  count: number,
  {
    stiffness = 170,
    damping = 22,
    mass = 1,
    wasmModule,
  }: {
    stiffness?: number;
    damping?: number;
    mass?: number;
    wasmModule?: WasmPhysicsExports;
  } = {},
): BatchPhysicsBuffer => {
  if (wasmModule) {
    const arena = new wasmModule.PhysicsArena(count, stiffness, damping, mass);
    const getPosView = () =>
      new Float32Array(wasmModule.memory.buffer, arena.positions_ptr(), count);
    const getTargetView = () =>
      new Float32Array(wasmModule.memory.buffer, arena.targets_ptr(), count);

    return {
      get positions() {
        return getPosView();
      },
      get targets() {
        return getTargetView();
      },
      step(dt, precision = 0.001) {
        return arena.step(dt, precision);
      },
      dispose() {
        arena.free();
      },
      isWasm: true,
    };
  }

  // Pure JS Zero-GC TypedArray fallback (identical memory layout to Rust PhysicsArena)
  const positions = new Float32Array(count);
  const targets = new Float32Array(count);
  const velocities = new Float32Array(count);
  const invMass = mass > 0 ? 1 / mass : 1;

  return {
    positions,
    targets,
    step(dt, precision = 0.001) {
      let moving = false;
      for (let i = 0; i < count; i++) {
        const v = positions[i]!;
        const t = targets[i]!;
        const vel = velocities[i]!;
        const force = -stiffness * (v - t) - damping * vel;
        const nextVel = vel + force * invMass * dt;
        const nextVal = v + nextVel * dt;

        if (Math.abs(nextVel) > precision || Math.abs(nextVal - t) > precision) {
          velocities[i] = nextVel;
          positions[i] = nextVal;
          moving = true;
        } else {
          velocities[i] = 0;
          positions[i] = t;
        }
      }
      return moving;
    },
    dispose() {},
    isWasm: false,
  };
};
