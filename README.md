# @moeinmnia/motion

Tiny, headless, dependency-free **scroll & interaction animations**.
A vanilla **core** that works anywhere, plus a thin **React** adapter.

![license](https://img.shields.io/badge/license-MIT-blue) ![types](https://img.shields.io/badge/types-TypeScript-3178c6) ![deps](https://img.shields.io/badge/dependencies-0-brightgreen)

- **Small.** The whole core is ≈ **5.3 KB gzip** (minified). Effects tree-shake: `reveal` ≈ 0.5 KB,
  `scrub` ≈ 0.7 KB, `drawSvg` ≈ 0.65 KB. The optional stylesheet is ≈ **2.3 KB gzip** (minified).
- **Fast by design.** One shared `IntersectionObserver`, one scroll listener, one pointer listener, one
  `requestAnimationFrame` per frame. No layout reads while scrolling (geometry is cached), reads and writes
  are batched, nothing is written when a value did not change, and springs sleep when idle.
- **Compositor-friendly.** Motion uses `opacity`, `transform`, `translate`, `scale`, `rotate`.
- **Headless.** JS only sets `data-*` attributes and CSS variables. The look lives in CSS you can replace.
- **Accessible.** `prefers-reduced-motion` is respected everywhere; split text keeps a screen-reader copy;
  hidden states only apply when JavaScript is available.
- **SSR-friendly.** React components render their markup on the server (no hydration flash for `Reveal`).

```bash
npm i @moeinmnia/motion
```

```tsx
// once, in your root layout
import "@moeinmnia/motion/styles.css";
```

## Quick start

```tsx
import { Reveal, Scrub, SplitText, CountUp } from "@moeinmnia/motion/react";

<SplitText as="h1" by="words">Tonight on Cinemax</SplitText>

<Reveal variant="up"><Card /></Reveal>                 {/* plays when it enters the viewport */}
<Scrub effect="slide-up"><Card /></Scrub>              {/* follows the scroll position, reversible */}
<CountUp to={12840} suffix="+" />
```

```ts
// vanilla
import { reveal, scrub } from "@moeinmnia/motion/core";

const stop = reveal(document.querySelector(".card")!, { variant: "zoom" });
stop(); // removes observers / listeners
```

## Effects

Two families, and it helps to know which one you want:

- **Trigger** effects play once when something happens (enter the viewport, hover, click).
- **Scrub** effects are tied to the scroll position: they run forward and backward as you scroll.

| Effect               | Family  | What it does                                        | Core             | React                  |
| -------------------- | ------- | --------------------------------------------------- | ---------------- | ---------------------- |
| Reveal               | trigger | enter-view animation, 12 variants                   | `reveal`         | `Reveal` / `useReveal` |
| Stagger              | trigger | children reveal one after another (one observer)    | `stagger`        | `Stagger`              |
| CountUp              | trigger | number counter, `Intl` formatting                   | `countUp`        | `CountUp`              |
| SplitText            | trigger | words/chars animate in (accessible)                 | `splitText`      | `SplitText`            |
| Scramble             | trigger | "decode" text effect (in view or on hover)          | `scramble`       | `Scramble`             |
| Typewriter           | trigger | typing with caret, no layout shift                  | `typewriter`     | `Typewriter`           |
| DrawSvg              | trigger | SVG strokes draw themselves                         | `drawSvg`        | `Draw`                 |
| Tilt                 | pointer | 3D tilt following the mouse                         | `tilt`           | `Tilt`                 |
| Magnetic             | pointer | element pulled towards the cursor (spring)          | `magnetic`       | `Magnetic`             |
| Spotlight            | pointer | cursor glow travelling across a card grid           | `spotlight`      | `Spotlight`            |
| Ripple               | pointer | click ripple                                        | `ripple`         | `Ripple`               |
| Cursor               | pointer | spring cursor follower with hover states            | `cursor`         | `Cursor`               |
| Marquee              | ambient | infinite marquee (CSS, JS only measures)            | `marquee`        | `Marquee`              |
| **Scrub**            | scrub   | 11 scroll-scrubbed entrances                        | `scrub`          | `Scrub` / `useScrub`   |
| **Highlight**        | scrub   | marker paints itself behind text                    | `highlight`      | `Highlight`            |
| **HorizontalScroll** | scrub   | pinned section, vertical scroll → horizontal panels | `hscroll`        | `HorizontalScroll`     |
| ScrollFill           | scrub   | words light up while scrolling                      | `scrollFill`     | `ScrollFill`           |
| Parallax             | scrub   | depth on scroll (only while in view)                | `parallax`       | `Parallax`             |
| ScrollProgress       | scrub   | `--progress` for the page or an element             | `scrollProgress` | `ScrollProgress`       |
| ScrollSpy            | scrub   | marks the nav link of the section being read        | `scrollSpy`      | `useScrollSpy`         |
| spring               | helper  | tiny damped-spring helper                           | `spring`         | n/a                    |

### Reveal

`up` `down` `left` `right` `zoom` `fade` `blur` `flip` `rotate` `skew` `clip-up` `clip-left`

```tsx
<Reveal variant="clip-left" duration={1100} delay={100}><img … /></Reveal>
<Stagger step={90} variant="up" className="grid grid-cols-3 gap-4"><Card /><Card /><Card /></Stagger>
```

### Scrub

`fade` `scale` `zoom-out` `slide-up` `slide-down` `slide-left` `slide-right` `rotate` `blur` `clip-up` `clip-left`

```tsx
<Scrub effect="slide-up"><Card /></Scrub>
<Scrub effect="clip-left" start={0.9} end={0.5}><img … /></Scrub>
```

`start` is the viewport fraction (0 = top, 1 = bottom) where the element's **top** starts the effect, `end` is
where its **bottom** completes it. Defaults: `0.95` and `0.55`. Distance: `--scrub-distance` (default `80px`).

### Highlight

```tsx
<h2>
  Build <Highlight>creative</Highlight> things
</h2>
```

Colour and thickness: `--hl-color`, `--hl-height`. Without JavaScript the highlight is fully painted.

### HorizontalScroll

Every direct child is one panel. The section is `panels × 100vh` tall and pins while it scrolls.

```tsx
<HorizontalScroll>
  <section className="grid place-items-center">One</section>
  <section className="grid place-items-center">Two</section>
  <section className="grid place-items-center">Three</section>
</HorizontalScroll>
```

With reduced motion it becomes a normal horizontally scrollable strip (no scroll hijacking).

### Draw (SVG)

```tsx
<Draw>
  <svg viewBox="0 0 220 120" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 60 C 60 0, 160 120, 210 60" />
  </svg>
</Draw>
```

Shapes **need a visible stroke** to be drawn. If a shape has no `stroke` attribute it is drawn as an outline in
`currentColor`; any `stroke`/`fill` you set yourself (attribute, class, Tailwind) always wins.
Don't use `vector-effect: non-scaling-stroke` on drawn shapes (browsers compute the dash in screen space).

### Text

```tsx
<Typewriter speed={30} delay={400}>Headless and tiny.</Typewriter>
<Scramble trigger="hover" as="a">Contact</Scramble>
<ScrollFill as="p" className="text-5xl font-black">Words light up as you scroll.</ScrollFill>
```

### Pointer & misc

```tsx
<Spotlight selector=".card" className="grid grid-cols-3 gap-4"><div className="card" />…</Spotlight>
<Magnetic><button>Buy</button></Magnetic>
<Ripple as="button" color="#000" className="btn">Click</Ripple>
<Tilt max={10}><Card /></Tilt>
<Parallax speed={0.2}><img … /></Parallax>
<Marquee speed={60} gap={32}>{logos}</Marquee>
<ScrollProgress className="text-primary" />
<Cursor />

// nav highlighting
const ref = useScrollSpy<HTMLElement>();
<nav ref={ref}><a href="#about">About</a><a href="#work">Work</a></nav>
// style: a[data-active="true"] { … }
```

### Hooks

Every effect also exists as a hook when you don't want an extra element:

```tsx
const ref = useReveal<HTMLLIElement>({ variant: "left" });
<li ref={ref} data-reveal="left">
  …
</li>; // data-reveal in JSX = no flash before hydration
```

Hook options must be JSON-serialisable (they are the dependency key).

## How it works

```
 scroll / resize ─┐                 ┌─ read phase : every task measures (cached, cheap)
                  ├─► one rAF/frame ┤
 pointermove ─────┘                 └─ write phase: every task writes ONE css variable
 IntersectionObserver (shared) ─► data-inview="true|false"
```

1. **The core never animates styles directly.** It sets `data-*` attributes and CSS variables. CSS does the motion.
2. **Scrubbed effects share one contract:** JS writes a single `--progress` (0..1). Every look
   (`scrub`, `highlight`, `scrollFill`, `hscroll`) is pure CSS reading that variable.
3. **Geometry is cached.** An element is measured once, and again only when it or the page changes size
   (`ResizeObserver`). While scrolling, a frame is arithmetic on `scrollY`.
4. **Two-phase frames.** All reads happen before all writes, so ten effects cost the same layout work as one.
5. **Quiet when idle.** Values that did not change are not written, off-screen parallax is asleep, springs stop.

### Build your own scroll effect

A scroll task reads, then returns the function that writes:

```ts
import { onScrollFrame } from "@moeinmnia/motion/core";

const stop = onScrollFrame(() => {
  const y = window.scrollY; // read
  return () => el.style.setProperty("--y", `${y}`); // write
});
```

For the common "progress through the viewport" case use `scrollProgress(el, { mode: "element", start, end })`
and style it with CSS (`opacity: var(--progress)`).

## Theming (CSS variables)

`--reveal-distance` `--reveal-duration` `--reveal-ease` `--reveal-delay` `--split-step` `--draw-duration`
`--draw-step` `--marquee-gap` `--marquee-duration` `--tilt-scale` `--spot-size` `--spot-color`
`--ripple-color` `--cursor-size` `--fill-min` `--scrub-distance` `--hl-color` `--hl-height`

## Notes

- Hidden states only apply under `@media (scripting: enabled)`, so content is never lost without JS.
- Reveal / scrub / parallax / magnetic compose (they use `translate`/`scale`/`rotate`, not `transform`).
  `Reveal` + `Tilt` both use `transform`: put them on different elements.
- `clip-*` effects also clip `box-shadow`; `blur` is the most expensive variant.
- Pointer effects (`magnetic`, `spotlight`, `cursor`, `tilt`) are skipped on touch-only devices.
- Pass `locale` to `CountUp` if you don't want `en-US` (same on server & client).
- `Spotlight` re-queries its items on every move, so dynamically added cards just work.
- Scrub effects read `--progress` from the element itself: don't put two scrub effects on one element.

## Troubleshooting

| Problem                                | Fix                                                                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `Draw` shows nothing                   | The shape needs a visible stroke. Add `fill="none" stroke="currentColor"` to the `<svg>`, and check you imported `styles.css`. |
| Nothing animates at all                | Import `@moeinmnia/motion/styles.css` once in your root layout.                                                                |
| Element is invisible and never appears | Its effect never ran: check it is rendered on the client and not inside `display: none`.                                       |
| Scrub starts too late / too early      | Tune `start` and `end` (viewport fractions).                                                                                   |
| Horizontal scroll doesn't pin          | A parent has `overflow: hidden/auto`; `position: sticky` needs a scrolling ancestor that is the page.                          |

## Browser support

Evergreen browsers (needs `IntersectionObserver`, `ResizeObserver`, and the individual `translate`/`scale`/`rotate`
CSS properties). `@media (scripting: enabled)` is supported in current Chrome, Safari and Firefox; where it is not,
hidden states simply don't apply and content stays visible.

## Development

```bash
npm install
npm test          # vitest + jsdom
npm run typecheck
npm run build
```

Try everything: build the package, then `npx serve .` and open `/demo/` (and `/demo/scroll.html` for the scroll effects).

## License

MIT
