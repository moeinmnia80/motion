# Changelog

## 0.3.0

### New
- `scrub`: scroll-scrubbed entrances, 11 effects: `fade` `scale` `zoom-out` `slide-up` `slide-down`
  `slide-left` `slide-right` `rotate` `blur` `clip-up` `clip-left` (React: `Scrub`, `useScrub`)
- `highlight`: marker stroke that paints itself behind text while scrolling (React: `Highlight`)
- `hscroll`: pinned section where vertical scroll moves a horizontal strip of panels (React: `HorizontalScroll`)
- `requestScrollFrame` and the `ScrollTask` type are exported for building your own scroll effects

### Fixed
- **`drawSvg` / `Draw`**: shapes without a `stroke` were invisible, so nothing seemed to draw. They are now
  drawn as an outline in `currentColor` (any `stroke`/`fill` you set still wins).
  Geometry inside `<defs>`, `<clipPath>`, `<mask>`, `<marker>`, `<pattern>`, `<symbol>` is no longer touched,
  and the transition only runs while drawing (no "un-draw" flash when JS attaches).
- **`parallax`** measured its own offset, so the real speed was lower than `speed` (and unstable for large
  negative values). The offset is now excluded from the measurement.
- **`observe`**: two effects on the same element with the same options overwrote each other's callback.
- `scrollProgress` could output `NaN` for a degenerate range.

### Performance
- Scroll scheduler is now two-phase: every task reads, then every task writes (no layout thrashing).
  Existing tasks that return nothing keep working.
- `scrollProgress` (and so `scrollFill`, `scrub`, `highlight`, `hscroll`) measures an element once and again
  only when its size or the page height changes (`ResizeObserver`). Per frame it is arithmetic on `scrollY`:
  **no `getBoundingClientRect` while scrolling**, and nothing is written when the value did not change.
- `parallax` re-measures only on layout change or when it re-enters the viewport.

### Breaking (minor)
- `--progress` is written with 3 decimals instead of 4.
- `scrollProgress` no longer re-reads layout on every scroll frame. Layout shifts that change neither the
  element's size nor the page height (e.g. reordering siblings with JS) are picked up on the next resize.

## 0.2.0
- New: `scramble`, `typewriter`, `scrollFill`, `drawSvg`, `magnetic`, `spotlight`, `ripple`, `cursor`, `scrollSpy`
- New: `spring` helper, shared pointer loop, `scrollProgress` start/end offsets (ScrollTrigger-style scrub)
- New reveal variants: `rotate`, `skew`, `clip-up`, `clip-left`
- Parallax now uses the `translate` property (composes with Reveal)
- Default observer threshold is 0 (tall elements always trigger)
- Tests (vitest + jsdom), demo page

## 0.1.x
- Initial release: `reveal`, `stagger`, `countUp`, `splitText`, `parallax`, `tilt`, `marquee`, `scrollProgress`
