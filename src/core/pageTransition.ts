import { isBrowser, prefersReducedMotion, type Cleanup } from "./utils";

/**
 * Page transitions built on the View Transitions API (one snapshot of the old page, one of the new
 * one, animated with CSS on the compositor: no layout work, no JS per frame).
 *
 *   curtain   the new page is wiped in from the top
 *   circle    the new page opens as a circle from the click point
 *   split     the new page opens from the center line
 *   blinds    vertical blinds open across the screen
 *   slide     the old page leaves left, the new one arrives from the right (`slide-back`: reversed)
 *   zoom      soft scale + blur
 *   fade      cross-fade with a small lift
 *   none      plain navigation
 *
 * `variant` may also be a function of (from, to) so the effect can follow your route structure.
 * Unsupported browsers and reduced motion get a plain, instant navigation.
 */
export type PageTransitionVariant = "fade" | "slide" | "slide-back" | "curtain" | "circle" | "split" | "blinds" | "zoom" | "none";

export type PageTransitionOptions = {
  variant?: PageTransitionVariant | ((from: string, to: string) => PageTransitionVariant);
  /** ms, default 650 */
  duration?: number;
  easing?: string;
};

type Doc = Document & {
  startViewTransition?: (cb: () => void | Promise<void>) => { finished: Promise<void>; ready: Promise<void> };
};

const STYLE_ID = "motion-page-transition";

const css = `
@property --pt-w { syntax: "<percentage>"; inherits: false; initial-value: 0%; }
html[data-pt] { --pt-d: 650ms; --pt-e: cubic-bezier(.65,0,.15,1); }
html[data-pt]::view-transition-group(root) { animation: none; }
html[data-pt]::view-transition-old(root),
html[data-pt]::view-transition-new(root) { animation-duration: var(--pt-d); animation-timing-function: var(--pt-e); animation-fill-mode: both; mix-blend-mode: normal; }

html[data-pt="fade"]::view-transition-old(root) { animation-name: pt-out; }
html[data-pt="fade"]::view-transition-new(root) { animation-name: pt-up; }

html[data-pt="slide"]::view-transition-old(root) { animation-name: pt-left-out; }
html[data-pt="slide"]::view-transition-new(root) { animation-name: pt-right-in; }
html[data-pt="slide-back"]::view-transition-old(root) { animation-name: pt-right-out; }
html[data-pt="slide-back"]::view-transition-new(root) { animation-name: pt-left-in; }

html[data-pt="zoom"]::view-transition-old(root) { animation-name: pt-zoom-out; }
html[data-pt="zoom"]::view-transition-new(root) { animation-name: pt-zoom-in; }

html[data-pt="curtain"]::view-transition-old(root) { animation-name: pt-dim; z-index: 1; }
html[data-pt="curtain"]::view-transition-new(root) { animation-name: pt-curtain; z-index: 2; }

html[data-pt="circle"]::view-transition-old(root) { animation-name: pt-dim; z-index: 1; }
html[data-pt="circle"]::view-transition-new(root) { animation-name: pt-circle; z-index: 2; }

html[data-pt="split"]::view-transition-old(root) { animation-name: pt-dim; z-index: 1; }
html[data-pt="split"]::view-transition-new(root) { animation-name: pt-split; z-index: 2; }

html[data-pt="blinds"]::view-transition-old(root) { animation-name: none; z-index: 1; }
html[data-pt="blinds"]::view-transition-new(root) {
  animation-name: pt-blinds; z-index: 2;
  -webkit-mask-image: repeating-linear-gradient(90deg, #000 0, #000 var(--pt-w), transparent var(--pt-w), transparent 10%);
  mask-image: repeating-linear-gradient(90deg, #000 0, #000 var(--pt-w), transparent var(--pt-w), transparent 10%);
}

@keyframes pt-out { to { opacity: 0; } }
@keyframes pt-up { from { opacity: 0; transform: translate3d(0, 14px, 0); } }
@keyframes pt-left-out { to { opacity: 0; transform: translate3d(-9%, 0, 0); } }
@keyframes pt-right-in { from { opacity: 0; transform: translate3d(9%, 0, 0); } }
@keyframes pt-right-out { to { opacity: 0; transform: translate3d(9%, 0, 0); } }
@keyframes pt-left-in { from { opacity: 0; transform: translate3d(-9%, 0, 0); } }
@keyframes pt-zoom-out { to { opacity: 0; transform: scale(.94); filter: blur(8px); } }
@keyframes pt-zoom-in { from { opacity: 0; transform: scale(1.06); filter: blur(8px); } }
@keyframes pt-dim { to { filter: brightness(.55); transform: scale(.985); } }
@keyframes pt-curtain { from { clip-path: inset(0 0 100% 0); } to { clip-path: inset(0 0 0 0); } }
@keyframes pt-circle { from { clip-path: circle(0 at var(--pt-x, 50%) var(--pt-y, 50%)); } to { clip-path: circle(150vmax at var(--pt-x, 50%) var(--pt-y, 50%)); } }
@keyframes pt-split { from { clip-path: inset(0 50% 0 50%); } to { clip-path: inset(0 0 0 0); } }
@keyframes pt-blinds { from { --pt-w: 0%; } to { --pt-w: 10.01%; } }

@media (prefers-reduced-motion: reduce) {
  html[data-pt]::view-transition-group(*), html[data-pt]::view-transition-old(*), html[data-pt]::view-transition-new(*) { animation: none !important; }
}
`;

const ensureStyle = () => {
  if (!isBrowser || document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = css;
  document.head.append(style);
};

/** true when the browser can run a page transition */
export const canPageTransition = () => isBrowser && typeof (document as Doc).startViewTransition === "function";

/**
 * Runs `update` (a route change, a state flush) inside a page transition.
 * `origin` (a point in px) is where the `circle` variant opens from; default is the screen center.
 */
export const pageTransition = async (
  update: () => void | Promise<void>,
  options: PageTransitionOptions & { variant?: PageTransitionVariant; origin?: { x: number; y: number } } = {},
): Promise<void> => {
  const variant = options.variant ?? "fade";
  const doc = isBrowser ? (document as Doc) : undefined;
  if (!doc?.startViewTransition || variant === "none" || prefersReducedMotion()) {
    await update();
    return;
  }
  ensureStyle();
  const root = document.documentElement;
  root.dataset.pt = variant;
  root.style.setProperty("--pt-d", `${options.duration ?? 650}ms`);
  if (options.easing) root.style.setProperty("--pt-e", options.easing);
  root.style.setProperty("--pt-x", `${options.origin?.x ?? innerWidth / 2}px`);
  root.style.setProperty("--pt-y", `${options.origin?.y ?? innerHeight / 2}px`);
  const clean = () => {
    delete root.dataset.pt;
    root.style.removeProperty("--pt-e");
  };
  try {
    await doc.startViewTransition(update).finished;
  } finally {
    clean();
  }
};

export type PageLinksOptions = PageTransitionOptions & {
  /** perform the navigation (router.push). It may return a promise. */
  navigate: (href: string) => void | Promise<void>;
  /** current pathname; the new page counts as "arrived" when it changes. Default: location.pathname */
  pathname?: () => string;
  /** return false to leave a link alone (default: every same-origin link) */
  filter?: (a: HTMLAnchorElement) => boolean;
  /** give up waiting for the new page after this many ms (default 1500) */
  timeout?: number;
};

/**
 * Turns every same-origin link into a page transition. Works with any client router: pass its
 * `push` as `navigate`. Modified clicks, new tabs, downloads and hash-only links are left alone.
 * The snapshot of the new page is taken once `pathname()` changes and two frames have painted.
 */
export const pageLinks = (options: PageLinksOptions): Cleanup => {
  if (!isBrowser) return () => {};
  const path = options.pathname ?? (() => location.pathname);
  let busy = false;

  const onClick = (e: MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element | null)?.closest?.("a");
    if (!a || !a.href || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    const to = url.pathname + url.search;
    const from = location.pathname + location.search;
    if (url.pathname === location.pathname && url.search === location.search) return; // same page or hash jump
    if (options.filter && !options.filter(a)) return;
    if (busy || !canPageTransition()) return;

    e.preventDefault();
    busy = true;
    const v = typeof options.variant === "function" ? options.variant(from, to) : options.variant;
    const before = path();
    void pageTransition(
      () =>
        new Promise<void>((resolve) => {
          const done = () => requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
          const t0 = performance.now();
          const poll = () => {
            if (path() !== before) return done();
            if (performance.now() - t0 > (options.timeout ?? 1500)) return resolve();
            requestAnimationFrame(poll);
          };
          void Promise.resolve(options.navigate(to)).then(poll, () => resolve());
        }),
      { ...options, variant: v, origin: { x: e.clientX, y: e.clientY } },
    ).finally(() => {
      busy = false;
    });
  };

  document.addEventListener("click", onClick, true);
  return () => document.removeEventListener("click", onClick, true);
};
