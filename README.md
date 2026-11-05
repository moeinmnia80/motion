# @moeinmnia80/motion

Tiny, headless, dependency-free scroll & interaction animations.
Vanilla **core** (works anywhere) + thin **React** adapter. ~3 KB gzip core, ~1.5 KB gzip CSS.

```bash
npm i @moeinmnia80/motion
```

```tsx
// once, in your root layout
import "@moeinmnia80/motion/styles.css";
```

## How it works

The core never touches styles directly. It only sets `data-*` attributes and CSS variables;
the (replaceable) CSS does the animating with `opacity`/`transform` only.
One shared `IntersectionObserver` and one shared scroll listener serve every element.

## React

```tsx
import {
  Reveal, Stagger, CountUp, SplitText, Parallax, Tilt, Marquee, ScrollProgress,
} from "@moeinmnia80/motion/react";

<ScrollProgress className="text-primary" />

<Reveal variant="zoom" delay={120}>…</Reveal>
<Reveal as="section" variant="blur">…</Reveal>

<Stagger step={90} variant="up" className="grid grid-cols-3 gap-4">
  <Card /><Card /><Card />
</Stagger>

<CountUp to={12840} suffix="+" duration={1800} />
<CountUp to={4.9} format={{ minimumFractionDigits: 1 }} />

<SplitText as="h1" by="words" step={60}>Tonight on Cinemax</SplitText>

<Parallax speed={0.2}><img … /></Parallax>
<Tilt max={10}><Card /></Tilt>
<Marquee speed={60} gap={32}>{logos}</Marquee>
```

Hooks (when you don't want an extra element):
`useReveal`, `useStagger`, `useCountUp`, `useSplitText`, `useParallax`, `useTilt`,
`useMarquee`, `useScrollProgress`, `useInView`.

```tsx
const ref = useReveal<HTMLLIElement>({ variant: "left" });
<li ref={ref} data-reveal="left">…</li>   // data-reveal in JSX = no flash before hydration
```

## Vanilla

```ts
import { reveal, stagger, countUp, splitText, marquee } from "@moeinmnia80/motion/core";

const stop = reveal(document.querySelector(".card")!, { variant: "zoom" });
// stop() removes observers/listeners
```

## Reveal variants

`up` `down` `left` `right` `zoom` `fade` `blur` `flip`

## Theming (CSS variables)

`--reveal-distance` `--reveal-duration` `--reveal-ease` `--reveal-delay`
`--split-step` `--marquee-gap` `--marquee-duration` `--tilt-scale`

## Notes

- `prefers-reduced-motion` is respected (CSS + JS).
- Hidden states only apply under `@media (scripting: enabled)`.
- `Reveal` + `Tilt`/`Parallax` both use `transform`: put them on different elements.
- Pass `locale` to `CountUp` if you don't want `en-US` (same on server & client).
- Hook options must be JSON-serialisable (they are the dependency key).
- `blur` is the most expensive variant; use it sparingly.

MIT
