# @moeinmnia/motion

Tiny, headless, dependency-free scroll & interaction animations.
A vanilla **core** (works anywhere) + a thin **React** adapter.

- **~4.7 KB gzip** for the whole core (minified). A single effect tree-shakes down to
  hundreds of bytes (`reveal` ≈ 0.4 KB) + ~2.5 KB optional CSS.
- **Compositor-only** animation (`opacity`, `transform`, `translate`, `scale`).
- **One** shared `IntersectionObserver`, **one** scroll listener, **one** pointer listener.
- Springs and rAF loops **sleep when idle**.
- Accessible: `prefers-reduced-motion` respected, split text keeps a screen-reader copy.

```bash
npm i @moeinmnia/motion
```

```tsx
// once, in your root layout
import "@moeinmnia/motion/styles.css";
```

## How it works

The core never animates styles directly. It sets `data-*` attributes and CSS variables;
the (replaceable) CSS does the motion. Scrubbed effects (`scrollFill`, `scrollProgress`)
write **one** variable (`--progress`) and the per-element maths happens in CSS.

## Effects

| Effect | What it does | Core | React |
|---|---|---|---|
| Reveal | enter-view animation, 12 variants | `reveal` | `Reveal` / `useReveal` |
| Stagger | children reveal one after another (one observer) | `stagger` | `Stagger` |
| CountUp | number counter, `Intl` formatting | `countUp` | `CountUp` |
| SplitText | words/chars animate in (accessible) | `splitText` | `SplitText` |
| Scramble | "decode" text effect (inview or hover) | `scramble` | `Scramble` |
| Typewriter | typing with caret, no layout shift | `typewriter` | `Typewriter` |
| ScrollFill | words light up while scrolling (scrub) | `scrollFill` | `ScrollFill` |
| DrawSvg | SVG strokes draw themselves | `drawSvg` | `Draw` |
| Parallax | depth on scroll (in-view only) | `parallax` | `Parallax` |
| Tilt | 3D tilt following the mouse | `tilt` | `Tilt` |
| Magnetic | element pulled towards the cursor (spring) | `magnetic` | `Magnetic` |
| Spotlight | cursor glow that travels across a card grid | `spotlight` | `Spotlight` |
| Ripple | click ripple | `ripple` | `Ripple` |
| Cursor | spring cursor follower with hover states | `cursor` | `Cursor` |
| Marquee | infinite marquee (CSS, JS measures only) | `marquee` | `Marquee` |
| ScrollProgress | `--progress` for page or element (scrub offsets) | `scrollProgress` | `ScrollProgress` |
| ScrollSpy | marks the nav link of the section being read | `scrollSpy` | `useScrollSpy` |
| spring | tiny damped-spring helper (also exported) | `spring` | — |

**Reveal variants:** `up` `down` `left` `right` `zoom` `fade` `blur` `flip` `rotate` `skew` `clip-up` `clip-left`

## React

```tsx
import {
  Reveal, Stagger, CountUp, SplitText, Scramble, Typewriter, ScrollFill, Draw,
  Parallax, Tilt, Magnetic, Spotlight, Ripple, Cursor, Marquee, ScrollProgress,
  useScrollSpy,
} from "@moeinmnia/motion/react";

<ScrollProgress className="text-primary" />
<Cursor />

<SplitText as="h1" by="words" step={70}>Tonight on Cinemax</SplitText>
<Typewriter speed={30} delay={400}>Headless and tiny.</Typewriter>
<Scramble trigger="hover" as="a">Contact</Scramble>

<Stagger step={90} variant="up" className="grid grid-cols-3 gap-4">
  <Card /><Card /><Card />
</Stagger>

<Reveal variant="clip-left" duration={1100}><img … /></Reveal>
<CountUp to={12840} suffix="+" />
<ScrollFill as="p" className="text-5xl font-black">Words light up as you scroll.</ScrollFill>

<Spotlight selector=".card" className="grid grid-cols-3 gap-4">
  <div className="card" /> <div className="card" /> <div className="card" />
</Spotlight>

<Magnetic><button>Buy</button></Magnetic>
<Ripple as="button" color="#000" className="btn">Click</Ripple>
<Tilt max={10}><Card /></Tilt>
<Parallax speed={0.2}><img … /></Parallax>
<Draw><svg viewBox="0 0 220 120"><path d="…" /></svg></Draw>
<Marquee speed={60} gap={32}>{logos}</Marquee>

// nav highlighting
const ref = useScrollSpy<HTMLElement>();
<nav ref={ref}><a href="#about">About</a><a href="#work">Work</a></nav>
// style: a[data-active="true"] { … }
```

Every effect also exists as a hook (`useReveal`, `useMagnetic`, …) when you don't want an
extra element:

```tsx
const ref = useReveal<HTMLLIElement>({ variant: "left" });
<li ref={ref} data-reveal="left">…</li>   // data-reveal in JSX = no flash before hydration
```

## Vanilla

```ts
import { reveal, stagger, scramble, magnetic, spring } from "@moeinmnia/motion/core";

const stop = reveal(document.querySelector(".card")!, { variant: "zoom" });
stop(); // removes observers / listeners
```

Try everything: build the package, then `npx serve .` and open `/demo/`.

## Theming (CSS variables)

`--reveal-distance` `--reveal-duration` `--reveal-ease` `--reveal-delay` `--split-step`
`--draw-duration` `--draw-step` `--marquee-gap` `--marquee-duration` `--tilt-scale`
`--spot-size` `--spot-color` `--ripple-color` `--cursor-size` `--fill-min`

## Notes

- Hidden states only apply under `@media (scripting: enabled)`.
- `Reveal` + `Parallax`/`Magnetic` compose (they use `translate`, not `transform`).
  `Reveal` + `Tilt` both use `transform`: put them on different elements.
- `clip-*` reveals also clip `box-shadow`; `blur` is the most expensive variant.
- Pointer effects (`magnetic`, `spotlight`, `cursor`, `tilt`) are skipped on touch-only devices.
- Pass `locale` to `CountUp` if you don't want `en-US` (same on server & client).
- Hook options must be JSON-serialisable (they are the dependency key).
- `Spotlight` re-queries its items on every move, so dynamically added cards just work.

## Development

```bash
npm install
npm test          # vitest + jsdom
npm run typecheck
npm run build
```

MIT
