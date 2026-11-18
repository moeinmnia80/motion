import { a11yText } from "./a11y";
import { tickWhileVisible } from "./ticker";
import { prefersReducedMotion, type Cleanup } from "./utils";

export type TypeLoopOptions = {
  /** words (or phrases) to cycle through */
  words: string[];
  /** ms per typed character */
  speed?: number;
  /** ms per deleted character */
  deleteSpeed?: number;
  /** ms the finished word stays on screen */
  pause?: number;
  /** ms before the first word starts typing */
  delay?: number;
  /** keep cycling. false: stop after the last word is typed */
  loop?: boolean;
  caret?: boolean;
};

/**
 * Rotating typewriter: types a word, waits, deletes it, types the next one.
 * Runs on the shared ticker and only while the element is on screen.
 */
export const typeLoop = (
  el: HTMLElement,
  {
    words,
    speed = 70,
    deleteSpeed = 38,
    pause = 1400,
    delay = 0,
    loop = true,
    caret = true,
  }: TypeLoopOptions,
): Cleanup | void => {
  const list = words.filter((w) => w.length > 0);
  if (list.length === 0) return;

  const { visual, restore } = a11yText(el, list.join(", "));
  const typed = document.createElement("span");
  typed.dataset.typed = "";
  visual.append(typed);

  el.dataset.typewriter = "";
  el.dataset.typeLoop = "";
  if (caret) el.dataset.caret = "";

  if (prefersReducedMotion()) {
    typed.textContent = list[0]!;
    return restore;
  }

  type Phase = "wait" | "type" | "hold" | "delete";
  let phase: Phase = "wait";
  let word = 0;
  let chars = 0;
  let clock = -delay; // ms accumulated in the current phase
  let glyphs = Array.from(list[0]!);

  const show = () => {
    typed.textContent = glyphs.slice(0, chars).join("");
  };
  show();

  const stop = tickWhileVisible(el, (_now, dt) => {
    clock += dt * 1000;
    if (clock < 0) return;

    if (phase === "wait") {
      phase = "type";
      clock = 0;
    }

    if (phase === "type") {
      el.dataset.typing = "true";
      const n = Math.min(Math.floor(clock / speed) + 1, glyphs.length);
      if (n !== chars) {
        chars = n;
        show();
      }
      if (chars >= glyphs.length) {
        el.dataset.typing = "false";
        phase = "hold";
        clock = 0;
      }
    } else if (phase === "hold") {
      if (clock >= pause) {
        if (!loop && word === list.length - 1) return false; // done, ticker sleeps
        phase = "delete";
        clock = 0;
        el.dataset.typing = "true";
      }
    } else if (phase === "delete") {
      const n = Math.max(glyphs.length - Math.floor(clock / deleteSpeed) - 1, 0);
      if (n !== chars) {
        chars = n;
        show();
      }
      if (chars === 0) {
        word = (word + 1) % list.length;
        glyphs = Array.from(list[word]!);
        phase = "type";
        clock = 0;
      }
    }
  });

  return () => {
    stop();
    delete el.dataset.typeLoop;
    restore();
  };
};
