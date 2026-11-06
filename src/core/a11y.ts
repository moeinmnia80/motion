/**
 * Replaces the element's content with:
 *   [visually hidden original text for screen readers] + [aria-hidden visual layer]
 * so animated/split/scrambled text is still read correctly.
 */
export const a11yText = (el: HTMLElement, text: string) => {
  const sr = document.createElement("span");
  sr.dataset.splitSr = "";
  sr.textContent = text;

  const visual = document.createElement("span");
  visual.setAttribute("aria-hidden", "true");

  el.replaceChildren(sr, visual);
  return {
    visual,
    restore: () => {
      el.textContent = text;
    },
  };
};
