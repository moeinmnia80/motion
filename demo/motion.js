// src/core/utils.ts
var isBrowser = typeof window !== "undefined";
var prefersReducedMotion = () => isBrowser && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var canHover = () => isBrowser && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

// src/core/a11y.ts
var a11yText = (el, text) => {
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
    }
  };
};

// src/core/observer.ts
var pools = /* @__PURE__ */ new Map();
var getPool = (threshold, rootMargin) => {
  const key = `${threshold}|${rootMargin}`;
  const existing = pools.get(key);
  if (existing) return existing;
  const subs2 = /* @__PURE__ */ new WeakMap();
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const set = subs2.get(entry.target);
        if (!set) continue;
        for (const sub of [...set]) {
          if (sub.once && !entry.isIntersecting) continue;
          sub.cb(entry);
          if (sub.once) set.delete(sub);
        }
        if (set.size === 0) {
          subs2.delete(entry.target);
          io.unobserve(entry.target);
        }
      }
    },
    { threshold, rootMargin }
  );
  const pool = { io, subs: subs2 };
  pools.set(key, pool);
  return pool;
};
var observe = (el, cb, {
  threshold = 0,
  rootMargin = "0px 0px -10% 0px",
  once = true
} = {}) => {
  const { io, subs: subs2 } = getPool(threshold, rootMargin);
  const sub = { cb, once };
  let set = subs2.get(el);
  if (!set) subs2.set(el, set = /* @__PURE__ */ new Set());
  set.add(sub);
  io.observe(el);
  return () => {
    const current = subs2.get(el);
    if (!current) return;
    current.delete(sub);
    if (current.size === 0) {
      subs2.delete(el);
      io.unobserve(el);
    }
  };
};

// src/core/scroll.ts
var tasks = /* @__PURE__ */ new Set();
var queued = false;
var bound = false;
var run = () => {
  queued = false;
  const writes = [];
  tasks.forEach((task) => {
    const write = task();
    if (write) writes.push(write);
  });
  for (const write of writes) write();
};
var schedule = () => {
  if (queued) return;
  queued = true;
  requestAnimationFrame(run);
};
var onScrollFrame = (task) => {
  tasks.add(task);
  if (!bound) {
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    bound = true;
  }
  schedule();
  return () => {
    tasks.delete(task);
    if (tasks.size === 0 && bound) {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      bound = false;
    }
  };
};
var requestScrollFrame = schedule;

// src/core/pointer.ts
var subs = /* @__PURE__ */ new Set();
var OFFSCREEN = -1e4;
var x = OFFSCREEN;
var y = OFFSCREEN;
var queued2 = false;
var bound2 = false;
var flush = () => {
  queued2 = false;
  subs.forEach((sub) => sub(x, y));
};
var queue = () => {
  if (queued2) return;
  queued2 = true;
  requestAnimationFrame(flush);
};
var onMove = (e) => {
  if (e.pointerType === "touch") return;
  x = e.clientX;
  y = e.clientY;
  queue();
};
var onLeave = () => {
  x = OFFSCREEN;
  y = OFFSCREEN;
  queue();
};
var onPointerFrame = (sub) => {
  if (!isBrowser) return () => {
  };
  subs.add(sub);
  if (!bound2) {
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    bound2 = true;
  }
  return () => {
    subs.delete(sub);
    if (subs.size === 0 && bound2) {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      bound2 = false;
    }
  };
};

// src/core/spring.ts
var spring = (initial, onUpdate, { stiffness = 170, damping = 22, mass = 1, precision = 0.01 } = {}) => {
  const value = [...initial];
  const target = [...initial];
  const velocity = initial.map(() => 0);
  let frame = 0;
  let last = 0;
  const tick = (now) => {
    const dt = Math.min((now - last) / 1e3, 1 / 30);
    last = now;
    let moving = false;
    for (let i = 0; i < value.length; i++) {
      const force = -stiffness * (value[i] - target[i]) - damping * velocity[i];
      velocity[i] = velocity[i] + force / mass * dt;
      value[i] = value[i] + velocity[i] * dt;
      if (Math.abs(velocity[i]) > precision || Math.abs(value[i] - target[i]) > precision) {
        moving = true;
      }
    }
    if (!moving) {
      for (let i = 0; i < value.length; i++) {
        value[i] = target[i];
        velocity[i] = 0;
      }
      frame = 0;
      onUpdate(value);
      return;
    }
    onUpdate(value);
    frame = requestAnimationFrame(tick);
  };
  return {
    set(next) {
      if (next.every((v, i) => v === target[i])) return;
      next.forEach((v, i) => target[i] = v);
      if (!frame) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    },
    jump(next) {
      next.forEach((v, i) => {
        value[i] = v;
        target[i] = v;
        velocity[i] = 0;
      });
      onUpdate(value);
    },
    stop() {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  };
};

// src/core/inview.ts
var inview = (el, options = {}) => observe(
  el,
  (entry) => {
    el.dataset.inview = String(entry.isIntersecting);
  },
  options
);

// src/core/reveal.ts
var reveal = (el, { variant = "up", delay = 0, duration, ...io } = {}) => {
  el.dataset.reveal = variant;
  el.style.setProperty("--reveal-delay", `${delay}ms`);
  if (duration !== void 0) {
    el.style.setProperty("--reveal-duration", `${duration}ms`);
  }
  return inview(el, io);
};

// src/core/stagger.ts
var stagger = (container, {
  selector = ":scope > *",
  step = 80,
  start = 0,
  variant = "up",
  duration,
  ...io
} = {}) => {
  const items = container.querySelectorAll(selector);
  items.forEach((item, i) => {
    item.dataset.reveal = variant;
    item.style.setProperty("--reveal-delay", `${start + i * step}ms`);
    if (duration !== void 0) {
      item.style.setProperty("--reveal-duration", `${duration}ms`);
    }
  });
  container.dataset.stagger = "";
  return inview(container, io);
};

// src/core/countUp.ts
var easeOutExpo = (t) => t >= 1 ? 1 : 1 - 2 ** (-10 * t);
var countUp = (el, {
  to,
  from = 0,
  duration = 1600,
  locale,
  format,
  prefix = "",
  suffix = "",
  ...io
}) => {
  const nf = new Intl.NumberFormat(locale, format);
  const render = (value) => {
    el.textContent = prefix + nf.format(value) + suffix;
  };
  if (prefersReducedMotion()) {
    render(to);
    return;
  }
  render(from);
  let frame = 0;
  const run2 = () => {
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      render(from + (to - from) * easeOutExpo(p));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  };
  const stop = observe(el, run2, { ...io, once: true });
  return () => {
    stop();
    cancelAnimationFrame(frame);
    render(to);
  };
};

// src/core/splitText.ts
var splitInto = (el, text, by) => {
  const { visual, restore } = a11yText(el, text);
  let i = 0;
  for (const part of text.split(/(\s+)/)) {
    if (!part) continue;
    if (/^\s+$/.test(part)) {
      visual.append(" ");
      continue;
    }
    const word = document.createElement("span");
    word.dataset.splitWord = "";
    for (const chunk of by === "chars" ? Array.from(part) : [part]) {
      const unit = document.createElement("span");
      unit.dataset.splitUnit = "";
      unit.style.setProperty("--i", String(i++));
      unit.textContent = chunk;
      word.append(unit);
    }
    visual.append(word);
  }
  return { count: i, restore };
};
var splitText = (el, { by = "words", step = 40, ...io } = {}) => {
  const original = el.textContent ?? "";
  if (!original.trim()) return;
  const { restore } = splitInto(el, original, by);
  el.dataset.split = by;
  el.style.setProperty("--split-step", `${step}ms`);
  const stop = inview(el, io);
  return () => {
    stop();
    restore();
  };
};

// src/core/scramble.ts
var scramble = (el, {
  text,
  duration = 900,
  chars = "!<>-_\\/[]{}=+*^?#abcdefghijklmnopqrstuvwxyz",
  trigger = "inview",
  ...io
} = {}) => {
  const full = text ?? el.textContent ?? "";
  if (!full.trim()) return;
  const glyphs = Array.from(full);
  const noise = Array.from(chars);
  const { visual, restore } = a11yText(el, full);
  el.dataset.scramble = "";
  if (prefersReducedMotion()) {
    visual.textContent = full;
    return restore;
  }
  const rand = () => noise[Math.floor(Math.random() * noise.length)] ?? "";
  let frame = 0;
  let thresholds = [];
  const render = (p) => {
    let out = "";
    for (let i = 0; i < glyphs.length; i++) {
      const g = glyphs[i];
      out += /\s/.test(g) || p >= thresholds[i] ? g : rand();
    }
    visual.textContent = out;
  };
  const run2 = () => {
    cancelAnimationFrame(frame);
    thresholds = glyphs.map((_, i) => i / glyphs.length * 0.6 + Math.random() * 0.4);
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      render(p);
      if (p < 1) frame = requestAnimationFrame(tick);
      else visual.textContent = full;
    };
    frame = requestAnimationFrame(tick);
  };
  let stop = () => {
  };
  if (trigger === "hover") {
    visual.textContent = full;
    el.addEventListener("pointerenter", run2);
    el.addEventListener("focusin", run2);
    stop = () => {
      el.removeEventListener("pointerenter", run2);
      el.removeEventListener("focusin", run2);
    };
  } else {
    thresholds = glyphs.map(() => 2);
    render(0);
    stop = observe(el, run2, { ...io, once: true });
  }
  return () => {
    stop();
    cancelAnimationFrame(frame);
    restore();
  };
};

// src/core/typewriter.ts
var typewriter = (el, { text, speed = 45, delay = 0, caret = true, ...io } = {}) => {
  const full = text ?? el.textContent ?? "";
  if (!full.trim()) return;
  const chars = Array.from(full);
  const { visual, restore } = a11yText(el, full);
  const typed = document.createElement("span");
  typed.dataset.typed = "";
  const rest = document.createElement("span");
  rest.dataset.rest = "";
  rest.style.visibility = "hidden";
  visual.append(typed, rest);
  el.dataset.typewriter = "";
  if (caret) el.dataset.caret = "";
  const write = (n) => {
    typed.textContent = chars.slice(0, n).join("");
    rest.textContent = chars.slice(n).join("");
  };
  if (prefersReducedMotion()) {
    write(chars.length);
    return restore;
  }
  write(0);
  let frame = 0;
  let shown = 0;
  const run2 = () => {
    el.dataset.typing = "true";
    const t0 = performance.now() + delay;
    const tick = (now) => {
      const n = now < t0 ? 0 : Math.min(Math.floor((now - t0) / speed) + 1, chars.length);
      if (n !== shown) {
        shown = n;
        write(n);
      }
      if (n < chars.length) frame = requestAnimationFrame(tick);
      else el.dataset.typing = "false";
    };
    frame = requestAnimationFrame(tick);
  };
  const stop = observe(el, run2, { ...io, once: true });
  return () => {
    stop();
    cancelAnimationFrame(frame);
    restore();
  };
};

// src/core/parallax.ts
var parallax = (el, { speed = 0.15, axis = "y" } = {}) => {
  if (prefersReducedMotion()) return;
  el.dataset.parallax = axis;
  const y2 = axis === "y";
  const prop = y2 ? "--parallax-y" : "--parallax-x";
  let stopScroll = null;
  let dirty = true;
  let pos = 0;
  let size = 0;
  let current = 0;
  const ro = new ResizeObserver(() => dirty = true);
  ro.observe(el);
  ro.observe(document.documentElement);
  const task = () => {
    if (dirty) {
      dirty = false;
      const r = el.getBoundingClientRect();
      pos = (y2 ? r.top + window.scrollY : r.left + window.scrollX) - current;
      size = y2 ? r.height : r.width;
    }
    const view = y2 ? window.innerHeight : window.innerWidth;
    const scroll = y2 ? window.scrollY : window.scrollX;
    const next = Math.round(-(pos - scroll + size / 2 - view / 2) * speed * 10) / 10;
    if (next === current) return;
    return () => {
      current = next;
      el.style.setProperty(prop, `${next}px`);
    };
  };
  const stopObserve = observe(
    el,
    (entry) => {
      if (entry.isIntersecting) {
        dirty = true;
        stopScroll ?? (stopScroll = onScrollFrame(task));
      } else {
        stopScroll?.();
        stopScroll = null;
      }
    },
    { threshold: 0, rootMargin: "20% 0px 20% 0px", once: false }
  );
  return () => {
    stopObserve();
    stopScroll?.();
    ro.disconnect();
    el.style.removeProperty(prop);
  };
};

// src/core/tilt.ts
var tilt = (el, { max = 8, scale = 1.02, perspective = 800 } = {}) => {
  if (prefersReducedMotion()) return;
  el.dataset.tilt = "";
  el.style.setProperty("--tilt-scale", String(scale));
  el.style.setProperty("--tilt-perspective", `${perspective}px`);
  let frame = 0;
  let rect = null;
  const reset = () => {
    cancelAnimationFrame(frame);
    rect = null;
    el.dataset.tiltActive = "false";
    el.style.setProperty("--tilt-x", "0deg");
    el.style.setProperty("--tilt-y", "0deg");
  };
  const onEnter = (e) => {
    if (e.pointerType !== "mouse") return;
    rect = el.getBoundingClientRect();
    el.dataset.tiltActive = "true";
  };
  const onMove2 = (e) => {
    if (e.pointerType !== "mouse" || !rect) return;
    const { clientX, clientY } = e;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      if (!rect) return;
      const px = (clientX - rect.left) / rect.width - 0.5;
      const py = (clientY - rect.top) / rect.height - 0.5;
      el.style.setProperty("--tilt-x", `${(-py * max * 2).toFixed(2)}deg`);
      el.style.setProperty("--tilt-y", `${(px * max * 2).toFixed(2)}deg`);
    });
  };
  el.addEventListener("pointerenter", onEnter);
  el.addEventListener("pointermove", onMove2, { passive: true });
  el.addEventListener("pointerleave", reset);
  return () => {
    el.removeEventListener("pointerenter", onEnter);
    el.removeEventListener("pointermove", onMove2);
    el.removeEventListener("pointerleave", reset);
    cancelAnimationFrame(frame);
  };
};

// src/core/magnetic.ts
var magnetic = (el, { strength = 0.35, radius = 60, stiffness = 220, damping = 18 } = {}) => {
  if (prefersReducedMotion() || !canHover()) return;
  el.dataset.magnetic = "";
  let cx = 0;
  let cy = 0;
  let hw = 0;
  let hh = 0;
  let ox = 0;
  let oy = 0;
  let stale = true;
  const s = spring(
    [0, 0],
    ([x2, y2]) => {
      ox = x2;
      oy = y2;
      el.style.setProperty("--mx", `${ox.toFixed(2)}px`);
      el.style.setProperty("--my", `${oy.toFixed(2)}px`);
    },
    { stiffness, damping }
  );
  const measure = () => {
    const r = el.getBoundingClientRect();
    cx = r.left + r.width / 2 - ox;
    cy = r.top + r.height / 2 - oy;
    hw = r.width / 2;
    hh = r.height / 2;
    stale = false;
  };
  const stopScroll = onScrollFrame(() => {
    stale = true;
  });
  const stopPointer = onPointerFrame((px, py) => {
    if (stale) measure();
    const dx = px - cx;
    const dy = py - cy;
    const near = Math.abs(dx) < hw + radius && Math.abs(dy) < hh + radius;
    s.set(near ? [dx * strength, dy * strength] : [0, 0]);
  });
  return () => {
    stopScroll();
    stopPointer();
    s.stop();
  };
};

// src/core/spotlight.ts
var spotlight = (el, { selector } = {}) => {
  if (!canHover()) return;
  el.dataset.spotlight = "";
  let frame = 0;
  let px = 0;
  let py = 0;
  const update = () => {
    frame = 0;
    const items = selector ? Array.from(el.querySelectorAll(selector)) : [el];
    const rects = items.map((item) => item.getBoundingClientRect());
    items.forEach((item, i) => {
      const r = rects[i];
      item.dataset.spotlightItem = "";
      item.style.setProperty("--spot-x", `${(px - r.left).toFixed(1)}px`);
      item.style.setProperty("--spot-y", `${(py - r.top).toFixed(1)}px`);
    });
  };
  const onMove2 = (e) => {
    if (e.pointerType === "touch") return;
    px = e.clientX;
    py = e.clientY;
    if (!frame) frame = requestAnimationFrame(update);
  };
  const onEnter = () => {
    el.dataset.spotActive = "true";
  };
  const onLeave2 = () => {
    el.dataset.spotActive = "false";
  };
  el.addEventListener("pointermove", onMove2, { passive: true });
  el.addEventListener("pointerenter", onEnter);
  el.addEventListener("pointerleave", onLeave2);
  return () => {
    el.removeEventListener("pointermove", onMove2);
    el.removeEventListener("pointerenter", onEnter);
    el.removeEventListener("pointerleave", onLeave2);
    cancelAnimationFrame(frame);
  };
};

// src/core/ripple.ts
var ripple = (el, { color, duration = 600 } = {}) => {
  if (prefersReducedMotion()) return;
  el.dataset.ripple = "";
  const onDown = (e) => {
    if (e.button !== 0) return;
    const r = el.getBoundingClientRect();
    const x2 = e.clientX - r.left;
    const y2 = e.clientY - r.top;
    const size = Math.hypot(Math.max(x2, r.width - x2), Math.max(y2, r.height - y2)) * 2;
    const wave = document.createElement("span");
    wave.dataset.rippleWave = "";
    wave.style.width = wave.style.height = `${size}px`;
    wave.style.left = `${x2}px`;
    wave.style.top = `${y2}px`;
    wave.style.setProperty("--ripple-duration", `${duration}ms`);
    if (color) wave.style.setProperty("--ripple-color", color);
    el.append(wave);
    wave.addEventListener("animationend", () => wave.remove(), { once: true });
  };
  el.addEventListener("pointerdown", onDown);
  return () => el.removeEventListener("pointerdown", onDown);
};

// src/core/cursor.ts
var cursor = (el, {
  stiffness = 300,
  damping = 28,
  hoverSelector = "a,button,[role=button],input,textarea,select,[data-cursor-hover]"
} = {}) => {
  if (prefersReducedMotion() || !canHover()) return;
  el.dataset.cursor = "";
  el.dataset.cursorVisible = "false";
  let seen = false;
  const s = spring(
    [0, 0],
    ([x2, y2]) => {
      el.style.transform = `translate3d(${x2.toFixed(1)}px, ${y2.toFixed(1)}px, 0)`;
    },
    { stiffness, damping }
  );
  const stopPointer = onPointerFrame((x2, y2) => {
    if (x2 < 0 || y2 < 0) {
      el.dataset.cursorVisible = "false";
      return;
    }
    if (!seen) {
      seen = true;
      s.jump([x2, y2]);
    } else {
      s.set([x2, y2]);
    }
    el.dataset.cursorVisible = "true";
  });
  const onOver = (e) => {
    const t = e.target instanceof Element ? e.target : null;
    el.dataset.cursorHover = String(Boolean(t?.closest(hoverSelector)));
  };
  const onDown = () => {
    el.dataset.cursorDown = "true";
  };
  const onUp = () => {
    el.dataset.cursorDown = "false";
  };
  document.addEventListener("pointerover", onOver, { passive: true });
  document.addEventListener("pointerdown", onDown, { passive: true });
  document.addEventListener("pointerup", onUp, { passive: true });
  return () => {
    stopPointer();
    s.stop();
    document.removeEventListener("pointerover", onOver);
    document.removeEventListener("pointerdown", onDown);
    document.removeEventListener("pointerup", onUp);
  };
};

// src/core/marquee.ts
var marquee = (el, { speed = 50, direction = "left", pauseOnHover = true, gap } = {}) => {
  let built = false;
  let tracks = el.querySelectorAll(":scope > [data-marquee-track]");
  if (tracks.length === 0) {
    built = true;
    const track = document.createElement("div");
    track.dataset.marqueeTrack = "";
    track.append(...Array.from(el.childNodes));
    const clone = track.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    el.append(track, clone);
    tracks = el.querySelectorAll(":scope > [data-marquee-track]");
  }
  el.dataset.marquee = "";
  el.dataset.direction = direction;
  if (pauseOnHover) el.dataset.pause = "";
  else delete el.dataset.pause;
  if (gap !== void 0) el.style.setProperty("--marquee-gap", `${gap}px`);
  const first = tracks[0];
  const measure = () => {
    if (!first) return;
    const gapPx = parseFloat(getComputedStyle(el).columnGap) || 0;
    const seconds = (first.getBoundingClientRect().width + gapPx) / speed;
    el.style.setProperty("--marquee-duration", `${seconds.toFixed(2)}s`);
  };
  measure();
  const ro = new ResizeObserver(measure);
  ro.observe(el);
  if (first) ro.observe(first);
  return () => {
    ro.disconnect();
    if (built && first) {
      first.replaceWith(...Array.from(first.childNodes));
      tracks[1]?.remove();
    }
  };
};

// src/core/drawSvg.ts
var SHAPES = "path,line,polyline,polygon,circle,ellipse,rect";
var NOT_PAINTED = "defs,clipPath,mask,marker,pattern,symbol";
var drawSvg = (el, { step = 120, duration, ...io } = {}) => {
  const host = el;
  let i = 0;
  host.querySelectorAll(SHAPES).forEach((shape) => {
    if (shape.closest(NOT_PAINTED)) return;
    shape.setAttribute("pathLength", "1");
    shape.setAttribute("data-draw-shape", "");
    shape.style.setProperty("--draw-i", String(i++));
  });
  host.dataset.draw = "";
  host.style.setProperty("--draw-step", `${step}ms`);
  if (duration !== void 0) {
    host.style.setProperty("--draw-duration", `${duration}ms`);
  }
  return inview(host, io);
};

// src/core/scrollProgress.ts
var clamp01 = (n) => n < 0 ? 0 : n > 1 ? 1 : n;
var scrollProgress = (el, { mode = "page", start = 1, end = 0 } = {}) => {
  let last = "";
  let dirty = true;
  let top = 0;
  let height = 0;
  let docHeight = 0;
  const ro = new ResizeObserver(() => {
    dirty = true;
    requestScrollFrame();
  });
  ro.observe(document.documentElement);
  if (mode === "element") ro.observe(el);
  const span = (vh) => vh * (start - end) + height;
  const stop = onScrollFrame(() => {
    if (dirty) {
      dirty = false;
      docHeight = document.documentElement.scrollHeight;
      if (mode === "element") {
        const r = el.getBoundingClientRect();
        top = r.top + window.scrollY;
        height = r.height;
      }
    }
    const vh = window.innerHeight;
    const p = mode === "page" ? docHeight > vh ? window.scrollY / (docHeight - vh) : 0 : span(vh) > 0 ? (vh * start - (top - window.scrollY)) / span(vh) : Number(vh * start >= top - window.scrollY);
    const value = clamp01(p).toFixed(3);
    if (value === last) return;
    return () => {
      last = value;
      el.style.setProperty("--progress", value);
    };
  });
  return () => {
    stop();
    ro.disconnect();
  };
};

// src/core/scrollFill.ts
var scrollFill = (el, { start = 0.85, end = 0.35 } = {}) => {
  const original = el.textContent ?? "";
  if (!original.trim()) return;
  const { count, restore } = splitInto(el, original, "words");
  el.dataset.scrollFill = "";
  el.style.setProperty("--n", String(count));
  const stop = scrollProgress(el, { mode: "element", start, end });
  return () => {
    stop();
    restore();
  };
};

// src/core/scrollSpy.ts
var scrollSpy = (nav, {
  rootMargin = "-40% 0px -55% 0px",
  linkSelector = 'a[href^="#"]'
} = {}) => {
  const pairs = Array.from(
    nav.querySelectorAll(linkSelector)
  ).flatMap((link) => {
    const id = decodeURIComponent(link.hash.slice(1));
    const target = id ? document.getElementById(id) : null;
    return target ? [{ link, target }] : [];
  });
  const visible = /* @__PURE__ */ new Set();
  let current;
  const apply = () => {
    let next;
    for (const pair of pairs) if (visible.has(pair.target)) next = pair;
    if (next) current = next;
    for (const pair of pairs) {
      const on = pair === current;
      pair.link.dataset.active = String(on);
      if (on) pair.link.setAttribute("aria-current", "location");
      else pair.link.removeAttribute("aria-current");
    }
  };
  const stops = pairs.map(
    (pair) => observe(
      pair.target,
      (entry) => {
        if (entry.isIntersecting) visible.add(pair.target);
        else visible.delete(pair.target);
        apply();
      },
      { threshold: 0, rootMargin, once: false }
    )
  );
  return () => stops.forEach((stop) => stop());
};

// src/core/scrub.ts
var scrub = (el, { effect = "fade", start = 0.95, end = 0.55 } = {}) => {
  el.dataset.scrub = effect;
  if (prefersReducedMotion()) {
    el.style.setProperty("--progress", "1");
    return () => el.style.removeProperty("--progress");
  }
  return scrollProgress(el, { mode: "element", start, end });
};

// src/core/highlight.ts
var highlight = (el, { start = 0.9, end = 0.5 } = {}) => {
  el.dataset.highlight = "";
  if (prefersReducedMotion()) {
    el.style.setProperty("--progress", "1");
    return () => el.style.removeProperty("--progress");
  }
  return scrollProgress(el, { mode: "element", start, end });
};

// src/core/hscroll.ts
var hscroll = (el) => {
  let built = false;
  let sticky = el.querySelector(":scope > [data-hscroll-sticky]");
  let track = sticky?.querySelector(":scope > [data-hscroll-track]");
  if (!sticky || !track) {
    built = true;
    sticky = document.createElement("div");
    sticky.dataset.hscrollSticky = "";
    track = document.createElement("div");
    track.dataset.hscrollTrack = "";
    track.append(...Array.from(el.childNodes));
    sticky.append(track);
    el.append(sticky);
  }
  el.dataset.hscroll = "";
  el.style.setProperty("--panels", String(Math.max(track.children.length, 1)));
  const restore = () => {
    if (!built || !track || !sticky) return;
    el.replaceChildren(...Array.from(track.childNodes));
  };
  if (prefersReducedMotion()) return restore;
  const stop = scrollProgress(el, { mode: "element", start: 0, end: 1 });
  return () => {
    stop();
    restore();
  };
};
export {
  a11yText,
  canHover,
  countUp,
  cursor,
  drawSvg,
  highlight,
  hscroll,
  inview,
  isBrowser,
  magnetic,
  marquee,
  observe,
  onPointerFrame,
  onScrollFrame,
  parallax,
  prefersReducedMotion,
  requestScrollFrame,
  reveal,
  ripple,
  scramble,
  scrollFill,
  scrollProgress,
  scrollSpy,
  scrub,
  splitInto,
  splitText,
  spotlight,
  spring,
  stagger,
  tilt,
  typewriter
};
