# Changelog

## 0.5.0
Package and website are now separate repositories; this repo is the package only.

- **Removed (breaking):** `createRaymarch3D`, `createWaveTerrain3D`, `createPolyhedron3D`, `createVortex3D`
  (+ types `VortexShape`, `PolyhedronType`), the React `Raymarch3D` / `WaveTerrain3D` / `Polyhedron3D` /
  `Vortex3D`, and everything that only they used: `createPhysicsArena` / `wasmBridge`, the Rust crate and
  the WASM binary. The DOM/CSS 3D effects stay: `gyroCard3d`, `carousel3d`, `cube3d`.
- New `hoverRoll` / `HoverRoll`: per-letter hover swap with growing delay, same word or another (`to`),
  effects `slide` `flip` `blur`, direction, `from`, `parent` trigger.
- New `typeLoop` / `TypeLoop`: rotating typewriter (type, hold, delete, next word), sleeps off-screen.
- New `imageReveal` / `ImageReveal`: rectangular slices arrive alternately from both sides, then the
  image scales up to its parent. Slices are dropped from rendering when it finishes.
- `splitText` / `SplitText`: `variant` (`down` `fade` `blur` `scale` `rotate` `mask` `mask-down`) and
  `from` (`end` `center` `random`, deterministic so SSR matches). New export `splitOrder`.
- `cursor` / `Cursor`: `variant` (`blend` `ring` `dual` `label`), per-element `data-cursor-style` and
  `data-cursor-label`, `hideNative`.
- CSS utilities `data-blend`, `data-text-shimmer`.
- Removed the stale duplicate `src/styles/motion.css` (the shipped file is `src/motion.css`).
- Core is ~10 KB gzip (was ~12 KB with the 3D canvas effects); 52 tests.

## 0.4.1
- Fix: `ticker` isolates a throwing callback (it used to kill the shared loop), gets `ticker.clear()` for tests/teardown, and `tickWhileVisible` pauses canvas/3D effects when they are off-screen
- Fix: `floatingDock` and `scrollVelocity` kept the frame loop alive forever; they now sleep when idle (dock also batches reads before writes)
- Fix: `compareSlider` is keyboard accessible (arrows/Home/End, `role="slider"`) and is no longer disabled by reduced motion; `collapse` makes a closed panel `inert`
- Fix: `pin` was hard-coded to 100px, ignored `pinSpacing` and ran a loop forever; it is now `position: sticky` + parent spacing, zero JS per frame
- Fix: `morph` strict-TypeScript error and the `startTime === 0` edge case
- Fix: `scrub`, `highlight`, `hscroll`, `pin`, `morph` were not exported from `core`; `src/index.ts` now just re-exports core
- New React: `Scrub`, `Highlight`, `HScroll`, `Cube3D`, `Vortex3D`, `Raymarch3D`, `WaveTerrain3D`, `Polyhedron3D` + hooks; CSS for scrub / highlight / hscroll
- Fix: every strict-TypeScript error in `interactions.ts`, `motion3d.ts` and the examples page; the failing spring test (the shared ticker leaked between tests)
- Fix (web): page was white because Tailwind v4 dropped unused theme variables; `@theme static` + hard dark values
- Tests: 35 (ticker, collapse, compare, dock, velocity, morph, pin)

## 0.3.0
- New: `drag` (pointer drag, spring release or throw), `scrollRail` (pinned horizontal scroll, CSS-driven), `scrolled` (`data-scrolled` / `data-scroll-dir` for headers), `viewTransition` (View Transitions API with fallback)
- React: `Drag`, `Rail` (with `overlay`), `useDrag`, `useScrollRail`, `useScrolled`
- React entry now carries `"use client"` in source (server components can import it directly)
- `scripts/postbuild.mjs` and `scripts/size.mjs`; demo site in `apps/web`

## 0.2.0
- New: `scramble`, `typewriter`, `scrollFill`, `drawSvg`, `magnetic`, `spotlight`, `ripple`, `cursor`, `scrollSpy`
- New: `spring` helper, shared pointer loop, `scrollProgress` start/end offsets (ScrollTrigger-style scrub)
- New reveal variants: `rotate`, `skew`, `clip-up`, `clip-left`
- Parallax now uses the `translate` property (composes with Reveal)
- Default observer threshold is 0 (tall elements always trigger)
- Tests (vitest + jsdom), demo page

## 0.1.x
- Initial release: `reveal`, `stagger`, `countUp`, `splitText`, `parallax`, `tilt`, `marquee`, `scrollProgress`
