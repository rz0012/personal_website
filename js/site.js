/* ==========================================================================
   ramzaveri.com — interactive layer
   Everything animated here is procedurally generated: no external libraries.
   ========================================================================== */
(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const TAU = Math.PI * 2;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DPR = () => Math.min(window.devicePixelRatio || 1, 2);
  const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

  // Canvas palette, read from the active theme's CSS tokens (see :root and css/themes.css)
  const C = {
    cyan: "56,232,255", violet: "139,108,255", magenta: "255,79,216",
    lime: "125,255,178", red: "255,84,112", white: "230,236,255", dim: "99,112,143",
    bg: "4,6,12", core: "255,255,255",
  };
  const THEME = { blend: "lighter", mono: '"JetBrains Mono", monospace', fx: "none" };
  function readTheme() {
    const cs = getComputedStyle(document.documentElement);
    const v = (n) => cs.getPropertyValue(n).trim().replace(/\s+/g, "");
    const map = { cyan: "cyan", violet: "violet", magenta: "magenta", lime: "lime", red: "red", white: "text", dim: "dim", bg: "bg", core: "core" };
    for (const k in map) { const x = v("--rgb-" + map[k]); if (x) C[k] = x; }
    THEME.blend = cs.getPropertyValue("--canvas-blend").trim() || "lighter";
    THEME.mono = cs.getPropertyValue("--mono").trim() || THEME.mono;
    THEME.fx = cs.getPropertyValue("--fx").trim() || "none";
  }
  readTheme();
  const rgba = (c, a) => `rgba(${c},${a})`;

  /* ---------------- themes: chosen on the entry screen or from the nav dots ---------------- */
  const THEMES = [
    ["neural", "Neural", "Dark lab console: cyan and violet glow, live spiking network."],
    ["matrix", "Matrix", "Phosphor green on black, monospace everything, digital rain."],
    ["lab", "Lab Journal", "Light paper, ink-colored traces, serif type. Calm and academic."],
  ];
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return undefined; } },   // undefined = storage blocked
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  };
  const retheme = [];   // callbacks run after the theme changes (rebuild sprites, effects, ...)
  const currentTheme = () => document.documentElement.getAttribute("data-theme") || "neural";
  function setTheme(t, persist) {
    const d = document.documentElement;
    if (t === "neural") d.removeAttribute("data-theme"); else d.setAttribute("data-theme", t);
    if (window.rzFont) window.rzFont(t);
    if (persist) store.set("rz-theme", t);
    readTheme();
    retheme.forEach((fn) => fn());
    const m = $('meta[name="theme-color"]'), bg = getComputedStyle(d).getPropertyValue("--bg").trim();
    if (m && bg) m.content = bg;
    $$(".tdot").forEach((b) => b.classList.toggle("on", b.dataset.t === t));
  }

  function navThemes() {
    const links = $("#navLinks"); if (!links) return;
    const box = document.createElement("div");
    box.className = "theme-dots"; box.setAttribute("role", "group"); box.setAttribute("aria-label", "Color theme");
    box.innerHTML = '<span class="td-label">THEME</span>' + THEMES.map(([k, n]) =>
      `<button class="tdot${k === currentTheme() ? " on" : ""}" data-t="${k}" title="${n} theme" aria-label="${n} theme"><i data-theme="${k}"></i></button>`).join("");
    box.addEventListener("click", (e) => { const b = e.target.closest(".tdot"); if (b) setTheme(b.dataset.t, true); });
    links.appendChild(box);
  }

  // small three-trace preview, drawn in each card's own theme colors
  function previewSvg() {
    const wave = (y, f, a, ph) => { let d = ""; for (let x = 0; x <= 300; x += 5) { const v = y + Math.sin((x / 300) * f * TAU + ph) * a * (0.55 + 0.45 * Math.sin(x * 0.045 + ph)); d += (x ? "L" : "M") + x + " " + v.toFixed(1); } return d; };
    const sp = [22, 61, 70, 118, 164, 171, 178, 233, 270].map((x) => `M${x} 74V83`).join("");
    return `<path d="${wave(20, 6, 9, 0)}" style="fill:none;stroke:var(--cyan);stroke-width:1.6"/>` +
      `<path d="${wave(40, 9, 7, 1.3)}" style="fill:none;stroke:var(--violet);stroke-width:1.3"/>` +
      `<path d="${wave(58, 4, 8, 2.1)}" style="fill:none;stroke:var(--lime);stroke-width:1.3"/>` +
      `<path d="${sp}" style="stroke:var(--magenta);stroke-width:1.6"/>`;
  }

  function showGate(el, done) {
    ["matrix", "lab"].forEach((t) => window.rzFont && window.rzFont(t));   // so previews render in their own type
    el.classList.add("gate");
    el.removeAttribute("aria-hidden");
    el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "Choose a theme");
    const panel = document.createElement("div");
    panel.className = "gate-panel";
    panel.innerHTML =
      `<h2 class="gate-title">Select your interface</h2>
       <p class="gate-sub">Same research, three ways to see it. Hover to preview. You can switch anytime from the dots in the menu.</p>
       <div class="gate-cards">${THEMES.map(([k, n, desc], i) =>
         `<button class="gate-card" data-theme="${k}" data-t="${k}">
            <svg viewBox="0 0 300 86" preserveAspectRatio="none" aria-hidden="true">${previewSvg()}</svg>
            <span class="gc-body"><span class="gc-key">[${i + 1}]${i === 0 ? " · DEFAULT" : ""}</span><span class="gc-name">${n}</span><span class="gc-desc">${desc}</span></span>
          </button>`).join("")}</div>
       <div class="gate-foot"><button class="btn btn-glow gate-enter">Enter as <b class="ge-name">Neural</b> <span class="arr">→</span></button><span class="hint mono">1 · 2 · 3 to choose · Enter to continue</span></div>`;
    $(".boot-inner", el).appendChild(panel);
    const cards = $$(".gate-card", panel), enterBtn = $(".gate-enter", panel);
    let sel = "neural";
    const preview = (t) => { if (t !== currentTheme()) setTheme(t, false); $(".ge-name", panel).textContent = THEMES.find((x) => x[0] === t)[1]; };
    const close = (t) => { setTheme(t, true); document.removeEventListener("keydown", onKey); done(); };
    cards.forEach((c) => {
      c.addEventListener("mouseenter", () => preview(c.dataset.t));
      c.addEventListener("focus", () => { sel = c.dataset.t; preview(sel); });
      c.addEventListener("click", () => close(c.dataset.t));
    });
    $(".gate-cards", panel).addEventListener("mouseleave", () => preview(sel));
    enterBtn.addEventListener("click", () => close(currentTheme()));
    function onKey(e) {
      const i = "123".indexOf(e.key);
      if (i >= 0) { cards[i].focus(); e.preventDefault(); }
      else if (e.key === "Escape") close("neural");
      else if (e.key === "Enter" && !e.target.closest("button")) close(currentTheme());
    }
    document.addEventListener("keydown", onKey);
    enterBtn.focus({ preventScroll: true });
  }

  /* ---------------- boot sequence (once per session) ---------------- */
  function boot() {
    const el = $("#boot");
    if (!el) return;
    const done = () => { el.classList.add("done"); try { sessionStorage.setItem("rz-boot", "1"); } catch (e) {} };
    // first visit = storage works but no theme chosen yet (a ?theme= link counts as a choice)
    const gate = store.get("rz-theme") === null;
    if (gate) document.documentElement.classList.remove("no-boot");
    else if (reduced || document.documentElement.classList.contains("no-boot")) { done(); return; }
    const lines = [
      "&gt; initializing neural interface",
      "&gt; loading spiking network ........ <b>OK</b>",
      "&gt; calibrating electrodes ......... <b>OK</b>",
      "&gt; phase-locking θ oscillators .... <b>OK</b>",
      "&gt; handshake: RAM.ZAVERI ........... <b>LINKED</b>",
    ];
    const box = $("#bootLines"), bar = $("#bootBar"), step = reduced ? 0 : 170;
    lines.forEach((l, i) => setTimeout(() => {
      const d = document.createElement("div"); d.innerHTML = l; box.appendChild(d);
      bar.style.width = ((i + 1) / lines.length) * 100 + "%";
    }, step && 140 + i * step));
    setTimeout(gate ? () => showGate(el, done) : done, step && 140 + lines.length * step + 250);
  }

  /* ---------------- nav ---------------- */
  function nav() {
    const n = $("#nav"), t = $("#navToggle"), links = $("#navLinks");
    const onScroll = () => n && n.classList.toggle("scrolled", window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
    if (t) t.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      t.setAttribute("aria-expanded", open);
    });
    $$("#navLinks a").forEach((a) => a.addEventListener("click", () => { links.classList.remove("open"); t && t.setAttribute("aria-expanded", false); }));
    const page = document.body.dataset.page;
    $$("#navLinks a[data-page]").forEach((a) => a.classList.toggle("active", a.dataset.page === page));
  }

  /* ---------------- cursor ring ---------------- */
  function cursor() {
    const ring = $(".cursor-ring");
    if (!ring || window.matchMedia("(hover: none)").matches) return;
    let x = -100, y = -100, cx = x, cy = y;
    window.addEventListener("pointermove", (e) => { x = e.clientX; y = e.clientY; ring.classList.add("on"); }, { passive: true });
    document.addEventListener("pointerleave", () => ring.classList.remove("on"));
    document.addEventListener("pointerover", (e) => ring.classList.toggle("hover", !!e.target.closest("a,button,input,textarea,summary,.proj")));
    (function loop() { cx += (x - cx) * 0.22; cy += (y - cy) * 0.22; ring.style.transform = `translate(${cx}px,${cy}px)`; requestAnimationFrame(loop); })();
  }

  /* ---------------- reveal + counters ---------------- */
  function reveals() {
    const els = $$(".reveal");
    if (reduced || !("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
    const io = new IntersectionObserver((ents) => ents.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    }), { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    els.forEach((e, i) => { e.style.transitionDelay = (i % 4) * 60 + "ms"; io.observe(e); });
  }

  function counters() {
    const els = $$(".count");
    if (!els.length) return;
    const run = (el) => {
      const to = +el.dataset.to, t0 = performance.now(), d = 1400;
      const step = (now) => {
        const p = clamp((now - t0) / d, 0, 1), e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(to * e);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if (reduced || !("IntersectionObserver" in window)) { els.forEach((e) => (e.textContent = e.dataset.to)); return; }
    const io = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } }), { threshold: 0.6 });
    els.forEach((e) => io.observe(e));
  }

  /* ---------------- text effects ---------------- */
  function scramble() {
    const glyphs = "01<>/\\|{}[]#%&*+=~θαβγΔΣ";
    $$(".scramble").forEach((el, k) => {
      const final = el.dataset.text || el.textContent;
      if (reduced) { el.textContent = final; return; }
      const start = performance.now() + 250 + k * 220, dur = 900;
      const tick = (now) => {
        const p = clamp((now - start) / dur, 0, 1);
        const n = Math.floor(p * final.length);
        let s = final.slice(0, n);
        for (let i = n; i < final.length; i++) s += final[i] === " " ? " " : glyphs[(Math.random() * glyphs.length) | 0];
        el.textContent = s;
        if (p < 1) requestAnimationFrame(tick); else el.textContent = final;
      };
      requestAnimationFrame(tick);
    });
  }

  function typed() {
    const el = $("#typed");
    if (!el) return;
    const roles = [
      "neural engineering",
      "computational neuroscience",
      "speech motor control",
      "neuromorphic systems",
      "machine learning",
      "neural signal processing",
    ];
    if (reduced) { el.textContent = roles[0]; return; }
    let r = 0, i = 0, del = false;
    (function tick() {
      const w = roles[r];
      el.textContent = w.slice(0, i);
      if (!del && i < w.length) { i++; setTimeout(tick, 55 + Math.random() * 40); }
      else if (!del) { del = true; setTimeout(tick, 1700); }
      else if (i > 0) { i--; setTimeout(tick, 26); }
      else { del = false; r = (r + 1) % roles.length; setTimeout(tick, 300); }
    })();
  }

  /* ---------------- canvas helpers ---------------- */
  function fit(cv) {
    const d = DPR(), w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return null;
    if (cv.width !== Math.round(w * d) || cv.height !== Math.round(h * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); }
    const ctx = cv.getContext("2d");
    ctx.setTransform(d, 0, 0, d, 0, 0);
    return { ctx, w, h };
  }
  function glowSprite(color, size = 64) {
    const c = document.createElement("canvas"); c.width = c.height = size;
    const g = c.getContext("2d"), r = size / 2;
    const grd = g.createRadialGradient(r, r, 0, r, r, r);
    grd.addColorStop(0, rgba(C.core, 1)); grd.addColorStop(0.15, rgba(color, 0.95));
    grd.addColorStop(0.45, rgba(color, 0.25)); grd.addColorStop(1, rgba(color, 0));
    g.fillStyle = grd; g.fillRect(0, 0, size, size);
    return c;
  }
  function softGrid(ctx, w, h, s = 24, a = 0.05) {
    ctx.strokeStyle = rgba(C.cyan, a); ctx.lineWidth = 1; ctx.beginPath();
    for (let x = 0.5; x < w; x += s) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (let y = 0.5; y < h; y += s) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();
  }
  function label(ctx, txt, x, y, color = C.dim, size = 9, align = "left") {
    ctx.font = `500 ${size}px ${THEME.mono}`; ctx.fillStyle = rgba(color, 0.95); ctx.textAlign = align; ctx.fillText(txt, x, y); ctx.textAlign = "left";
  }
  function trace(ctx, w, f, y0, amp, color, alpha = 1, lw = 1.4) {
    ctx.beginPath();
    for (let x = 0; x <= w; x += 1.5) { const y = y0 - f(x) * amp; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.strokeStyle = rgba(color, alpha); ctx.lineWidth = lw; ctx.stroke();
  }

  /* ---------------- spiking network (hero background) ---------------- */
  const NET = { spikes: [], rate: 0 }; // shared with the telemetry panel

  function SpikingNet(cv) {
    let sprC, sprM, sprV;
    const sprites = () => { sprC = glowSprite(C.cyan); sprM = glowSprite(C.magenta); sprV = glowSprite(C.violet); };
    sprites(); retheme.push(sprites);
    let nodes = [], pulses = [], W = 0, H = 0, ctx;
    const mouse = { x: -1e4, y: -1e4, inside: false };
    let spikeCount = 0, rateT = 0;

    function build() {
      const f = fit(cv); if (!f) return; ({ ctx, w: W, h: H } = f);
      const n = Math.round(clamp((W * H) / 13000, 36, 150));
      nodes = [];
      for (let i = 0; i < n; i++) {
        // bias density to the right, where the text is not
        const x = Math.pow(Math.random(), 0.7) * W, y = Math.random() * H;
        nodes.push({ ax: x, ay: y, x, y, ph: rand(TAU), sp: rand(0.15, 0.4), v: rand(0.5), ref: 0, flash: 0, z: rand(0.4, 1), out: [], kind: Math.random() < 0.18 ? 1 : 0 });
      }
      const D = clamp(Math.sqrt((W * H) / n) * 1.6, 90, 190);
      nodes.forEach((a, i) => {
        const near = [];
        nodes.forEach((b, j) => { if (i !== j) { const d = Math.hypot(a.ax - b.ax, a.ay - b.ay); if (d < D) near.push([d, j]); } });
        near.sort((p, q) => p[0] - q[0]);
        a.out = near.slice(0, 4).map(([d, j]) => ({ j, d, w: rand(0.3, 0.5) }));
      });
      pulses = [];
    }

    function fire(i, t) {
      const a = nodes[i];
      a.v = 0; a.ref = 0.12; a.flash = 1; spikeCount++;
      NET.spikes.push({ t, i }); if (NET.spikes.length > 600) NET.spikes.splice(0, 200);
      for (const e of a.out) if (pulses.length < 700 && Math.random() < 0.85) pulses.push({ a: i, b: e.j, w: e.w, p: 0, len: e.d, kind: a.kind });
    }

    function step(dt, t) {
      const md = 150;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        a.x = a.ax + Math.sin(t * a.sp + a.ph) * 7; a.y = a.ay + Math.cos(t * a.sp * 0.8 + a.ph) * 7;
        a.v *= Math.exp(-dt / 0.28);
        if (Math.random() < 0.4 * dt) a.v += 0.75;           // background drive
        if (mouse.inside) {                                     // stimulation electrode
          const d = Math.hypot(a.x - mouse.x, a.y - mouse.y);
          if (d < md) a.v += dt * 4.2 * (1 - d / md);
        }
        a.flash = Math.max(0, a.flash - dt * 2.6);
        if (a.ref > 0) a.ref -= dt; else if (a.v >= 1) fire(i, t);
      }
      for (let k = pulses.length - 1; k >= 0; k--) {
        const p = pulses[k]; p.p += (dt * 260) / p.len;
        if (p.p >= 1) { nodes[p.b].v += p.w; pulses.splice(k, 1); }
      }
      rateT += dt;
      if (rateT > 0.5) { NET.rate = NET.rate * 0.5 + (spikeCount / rateT) * 0.5; spikeCount = 0; rateT = 0; }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      // edges
      ctx.lineWidth = 1;
      for (const a of nodes) for (const e of a.out) {
        const b = nodes[e.j];
        let al = 0.07 + 0.08 * a.z;
        if (mouse.inside) { const d = Math.hypot((a.x + b.x) / 2 - mouse.x, (a.y + b.y) / 2 - mouse.y); if (d < 200) al += 0.22 * (1 - d / 200); }
        al += a.flash * 0.25;
        ctx.strokeStyle = rgba(a.kind ? C.violet : C.cyan, al);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      // action potentials travelling along axons
      ctx.globalCompositeOperation = THEME.blend;
      for (const p of pulses) {
        const a = nodes[p.a], b = nodes[p.b];
        const x = a.x + (b.x - a.x) * p.p, y = a.y + (b.y - a.y) * p.p;
        const q = Math.max(0, p.p - 0.18), x0 = a.x + (b.x - a.x) * q, y0 = a.y + (b.y - a.y) * q;
        const g = ctx.createLinearGradient(x0, y0, x, y);
        const col = p.kind ? C.magenta : C.cyan;
        g.addColorStop(0, rgba(col, 0)); g.addColorStop(1, rgba(col, 0.9));
        ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x, y); ctx.stroke();
        ctx.drawImage(p.kind ? sprM : sprC, x - 5, y - 5, 10, 10);
      }
      // somata
      for (const a of nodes) {
        const r = 1.3 + a.z * 1.5;
        ctx.fillStyle = rgba(C.white, 0.25 + a.z * 0.35 + Math.min(a.v, 1) * 0.3);
        ctx.beginPath(); ctx.arc(a.x, a.y, r, 0, TAU); ctx.fill();
        if (a.flash > 0.02) {
          const s = 10 + a.flash * 36 * a.z;
          ctx.globalAlpha = a.flash; ctx.drawImage(a.kind ? sprV : sprC, a.x - s / 2, a.y - s / 2, s, s); ctx.globalAlpha = 1;
        }
      }
      // electrode
      if (mouse.inside) {
        ctx.strokeStyle = rgba(C.magenta, 0.35); ctx.setLineDash([3, 5]);
        ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 150, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
        ctx.drawImage(sprM, mouse.x - 12, mouse.y - 12, 24, 24);
      }
      ctx.globalCompositeOperation = "source-over";
    }

    const host = cv.parentElement;
    window.addEventListener("pointermove", (e) => {
      const r = cv.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
      mouse.inside = mouse.x >= 0 && mouse.y >= 0 && mouse.x <= r.width && mouse.y <= r.height && e.pointerType !== "touch";
    }, { passive: true });
    host.addEventListener("pointerdown", (e) => {
      if (e.target.closest("a,button,input,.hud")) return;
      const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      nodes.forEach((a) => { if (Math.hypot(a.x - x, a.y - y) < 190) a.v += 1.2; });
    });
    document.addEventListener("pointerleave", () => (mouse.inside = false));
    new ResizeObserver(build).observe(cv);
    build();
    if (reduced) { for (let i = 0; i < 200; i++) step(1 / 60, i / 60); draw(); }
    return { el: cv, frame(dt, t) { if (!nodes.length) return; step(dt, t); draw(); } };
  }

  /* ---------------- telemetry panel ---------------- */
  function Telemetry(cv) {
    const pxPerSec = 70, chans = 3;
    let buf = [], W = 0, H = 0, ctx, tSim = 0;
    const ar = [0, 0, 0];
    const rateEl = $("#spikeRate"), thEl = $("#thetaPow"), syEl = $("#syncVal"), clk = $("#hudClock");
    const t0 = Date.now();
    let uiT = 0, thetaAcc = 0, syncAcc = 0;

    function sample(t) {
      const env = 0.35 + 0.65 * Math.pow(Math.max(0, Math.sin(t * 0.55)), 2);  // theta bouts
      const drive = clamp(NET.rate / 60, 0, 1.5);
      const out = [];
      for (let c = 0; c < chans; c++) {
        ar[c] = ar[c] * 0.92 + (Math.random() - 0.5) * 0.5;                    // 1/f-ish noise
        const th = Math.sin(TAU * 6.5 * t + c * 0.7) * env;
        const al = Math.sin(TAU * 10.5 * t + c * 1.9) * 0.25;
        const ga = Math.sin(TAU * 38 * t + c) * 0.18 * drive * Math.random();
        out.push(c === 2 ? th : th * 0.7 + al + ar[c] * 0.5 + ga);
      }
      out.push(env);
      return out;
    }

    function resize() {
      const f = fit(cv); if (!f) return; ({ ctx, w: W, h: H } = f);
      buf = []; for (let x = 0; x < W; x++) buf.push(sample(tSim - (W - x) / pxPerSec));
    }

    function frame(dt) {
      if (!ctx) return;
      const n = Math.max(1, Math.round(dt * pxPerSec));
      for (let i = 0; i < n; i++) { tSim += 1 / pxPerSec; buf.push(sample(tSim)); }
      while (buf.length > W) buf.shift();
      ctx.clearRect(0, 0, W, H);
      softGrid(ctx, W, H, 22, 0.05);
      const rows = [H * 0.14, H * 0.34, H * 0.54], amp = H * 0.075;
      const names = ["Fz", "Cz", "θ 4–12Hz"], cols = [C.cyan, C.violet, C.lime];
      for (let c = 0; c < chans; c++) {
        if (c === 2) { // envelope band
          ctx.fillStyle = rgba(C.lime, 0.07); ctx.beginPath();
          for (let x = 0; x < buf.length; x++) ctx.lineTo(x, rows[c] - buf[x][3] * amp);
          for (let x = buf.length - 1; x >= 0; x--) ctx.lineTo(x, rows[c] + buf[x][3] * amp);
          ctx.fill();
        }
        ctx.beginPath();
        for (let x = 0; x < buf.length; x++) { const y = rows[c] - buf[x][c] * amp; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.strokeStyle = rgba(cols[c], 0.9); ctx.lineWidth = 1.2; ctx.stroke();
        label(ctx, names[c], 6, rows[c] - amp - 2, cols[c], 9);
      }
      // spike raster from the live network
      const top = H * 0.66, rowsN = 14, rh = (H - top - 8) / rowsN;
      label(ctx, "RASTER · live", 6, top - 2, C.magenta, 9);
      const now = performance.now() / 1000, span = W / pxPerSec;
      ctx.fillStyle = rgba(C.white, 0.9);
      for (const s of NET.spikes) {
        const age = now - s.wall; if (age > span || age < 0) continue;
        const x = W - age * pxPerSec, y = top + 4 + (s.i % rowsN) * rh;
        ctx.fillRect(x, y, 1.4, Math.max(2, rh - 2));
      }
      // HUD numbers
      uiT += dt; thetaAcc += buf[buf.length - 1][3]; syncAcc++;
      if (uiT > 0.35) {
        rateEl && (rateEl.textContent = Math.round(NET.rate));
        thEl && (thEl.textContent = (thetaAcc / syncAcc).toFixed(2));
        syEl && (syEl.textContent = (0.72 + 0.2 * Math.sin(tSim * 0.31) + 0.05 * Math.random()).toFixed(2));
        uiT = 0; thetaAcc = 0; syncAcc = 0;
      }
      if (clk) { const s = Math.floor((Date.now() - t0) / 1000); clk.textContent = [s / 3600, (s / 60) % 60, s % 60].map((v) => String(Math.floor(v)).padStart(2, "0")).join(":"); }
    }
    new ResizeObserver(resize).observe(cv);
    resize();
    return { el: cv, frame };
  }
  // stamp spikes with wall-clock time for the raster
  const _push = NET.spikes.push.bind(NET.spikes);
  NET.spikes.push = (s) => { s.wall = performance.now() / 1000; return _push(s); };

  /* ---------------- mini visualizations for project cards ---------------- */
  const MINI = {
    speech(ctx, w, h, t) {
      softGrid(ctx, w, h);
      const span = 3, at = (x) => t - (w - x) / w * span;
      const env = (tt) => Math.max(0, Math.sin(TAU * 2.2 * tt + 0.8 * Math.sin(tt))) ** 1.5 * (0.55 + 0.45 * Math.sin(TAU * 0.3 * tt) ** 2);
      ctx.beginPath();
      for (let x = 0; x <= w; x += 1) { const tt = at(x), y = env(tt) * Math.sin(TAU * 38 * tt) * h * 0.3; x ? ctx.lineTo(x, h / 2 - y) : ctx.moveTo(x, h / 2 - y); }
      ctx.strokeStyle = rgba(C.cyan, 0.85); ctx.lineWidth = 1; ctx.stroke();
      trace(ctx, w, (x) => env(at(x)), h / 2, h * 0.32, C.violet, 0.9, 1.4);
      trace(ctx, w, (x) => -env(at(x)), h / 2, h * 0.32, C.violet, 0.9, 1.4);
      label(ctx, "speech · in progress", 8, 14, C.cyan);
    },
    theta(ctx, w, h, t, s) {
      if (!s.comp) s.comp = Array.from({ length: 22 }, (_, i) => { const f = 1 + i * 1.8; return { f, a: 1 / Math.sqrt(f), p: rand(TAU) }; });
      softGrid(ctx, w, h);
      const span = 3, at = (x) => t - (w - x) / w * span;
      const env = (tt) => Math.max(0, Math.sin(TAU * 0.16 * tt)) ** 2;
      for (let x = 0; x < w; x += 2) if (env(at(x)) > 0.3) { ctx.fillStyle = rgba(C.lime, 0.08); ctx.fillRect(x, 0, 2, h); }
      const f = (x) => { const tt = at(x); let v = 0; for (const c of s.comp) v += c.a * Math.sin(TAU * c.f * tt + c.p); return v * 0.35 + env(tt) * Math.sin(TAU * 7 * tt) * 1.1; };
      trace(ctx, w, f, h * 0.42, h * 0.11, C.cyan, 0.95, 1.2);
      trace(ctx, w, (x) => env(at(x)) * Math.sin(TAU * 7 * at(x)), h * 0.82, h * 0.1, C.lime, 0.9, 1.2);
      label(ctx, "RNS · MTL depth", 8, 14, C.cyan); label(ctx, "θ bout > 1/f", 8, h * 0.68, C.lime);
    },
    auditory(ctx, w, h, t, s, dt) {
      softGrid(ctx, w, h);
      const n = 5, att = Math.floor(t / 2.6) % n, lx = w * 0.3, ly = h * 0.86;
      const src = Array.from({ length: n }, (_, i) => { const a = Math.PI * (0.15 + 0.7 * i / (n - 1)); return [lx - Math.cos(a) * w * 0.24, ly - Math.sin(a) * h * 0.66]; });
      const [ax, ay] = src[att], ang = Math.atan2(ay - ly, ax - lx);
      const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, h * 0.8); g.addColorStop(0, rgba(C.cyan, 0.25)); g.addColorStop(1, rgba(C.cyan, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.arc(lx, ly, h * 0.8, ang - 0.2, ang + 0.2); ctx.fill();
      src.forEach(([x, y], i) => {
        for (let k = 0; k < 3; k++) { const r = ((t * 22 + k * 10 + i * 5) % 30); ctx.strokeStyle = rgba(i === att ? C.cyan : C.dim, (1 - r / 30) * (i === att ? 0.9 : 0.4)); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); }
        ctx.fillStyle = rgba(i === att ? C.cyan : C.white, i === att ? 1 : 0.5); ctx.beginPath(); ctx.arc(x, y, 3, 0, TAU); ctx.fill();
      });
      ctx.fillStyle = rgba(C.violet, 0.9); ctx.beginPath(); ctx.arc(lx, ly, 6, 0, TAU); ctx.fill();
      // raster on the right
      const rx = w * 0.62, rw = w - rx - 8;
      if (!s.sp) s.sp = [];
      for (let r = 0; r < n * 2; r++) { const ch = r >> 1; if (Math.random() < dt * (ch === att ? 22 : 2.5)) s.sp.push({ x: rw, r }); }
      s.sp.forEach((p) => (p.x -= dt * 40)); s.sp = s.sp.filter((p) => p.x > 0);
      const rh = (h - 30) / (n * 2);
      s.sp.forEach((p) => { ctx.fillStyle = rgba((p.r >> 1) === att ? C.cyan : C.white, (p.r >> 1) === att ? 0.95 : 0.35); ctx.fillRect(rx + p.x, 20 + p.r * rh, 1.5, rh - 2); });
      label(ctx, "E/I · attended channel", rx, 13, C.magenta, 8);
    },
    events(ctx, w, h, t) {
      softGrid(ctx, w, h);
      const span = 6, at = (x) => t - (w - x) / w * span;
      const seg = (tt, p) => Math.floor(tt / p + 0.35 * Math.sin(Math.floor(tt / p)));
      trace(ctx, w, (x) => { const tt = at(x), k = seg(tt, 0.7); return Math.sin(TAU * (1.5 + hash(k) * 5) * tt) * (0.4 + hash(k + 9) * 0.6); }, h * 0.38, h * 0.2, C.cyan, 0.95, 1.3);
      const levels = [[0.7, C.cyan, "fast"], [2.1, C.violet, "mid"], [6.3, C.magenta, "slow"]];
      levels.forEach(([p, col, nm], li) => {
        const y = h * (0.7 + li * 0.1);
        ctx.strokeStyle = rgba(col, 0.25); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        let prev = seg(at(0), p);
        for (let x = 1; x < w; x++) { const k = seg(at(x), p); if (k !== prev) { ctx.fillStyle = rgba(col, 1); ctx.fillRect(x - 1, y - 5, 2, 10); if (li === 0) { ctx.fillStyle = rgba(col, 0.12); ctx.fillRect(x, 0, 1, h * 0.62); } prev = k; } }
        label(ctx, nm, w - 6, y - 3, col, 8, "right");
      });
      label(ctx, "event demarcation", 8, 14, C.cyan);
    },
    stream(ctx, w, h, t, s, dt) {
      softGrid(ctx, w, h);
      if (!s.p) { s.p = []; s.m = h / 2; }
      const mu = h * (0.5 + 0.28 * Math.sin(t * 0.7) + 0.1 * Math.sin(t * 1.9));
      for (let i = 0; i < 2; i++) if (Math.random() < 0.9) s.p.push({ x: w, y: mu + (Math.random() - 0.5) * h * 0.22 + Math.sin(t * 6) * 6 });
      s.p.forEach((p) => (p.x -= dt * 60)); s.p = s.p.filter((p) => p.x > -4);
      s.p.forEach((p) => { ctx.fillStyle = rgba(C.white, 0.15 + 0.6 * (p.x / w)); ctx.fillRect(p.x, p.y, 2, 2); });
      if (!s.hist) s.hist = [];
      s.m += (mu - s.m) * Math.min(1, dt * 3.2);
      s.hist.push({ x: w, y: s.m }); s.hist.forEach((q) => (q.x -= dt * 60)); s.hist = s.hist.filter((q) => q.x > 0);
      ctx.beginPath(); s.hist.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
      ctx.strokeStyle = rgba(C.cyan, 0.95); ctx.lineWidth = 2; ctx.stroke(); ctx.lineWidth = 1;
      ctx.fillStyle = rgba(C.magenta, 0.9); ctx.beginPath(); ctx.arc(w - 2, s.m, 4, 0, TAU); ctx.fill();
      label(ctx, "non-i.i.d. stream → online model", 8, 14, C.cyan);
    },
    track(ctx, w, h, t, s) {
      // perspective floor
      ctx.strokeStyle = rgba(C.cyan, 0.08);
      for (let i = -10; i <= 10; i++) { ctx.beginPath(); ctx.moveTo(w / 2 + i * 12, h * 0.45); ctx.lineTo(w / 2 + i * 70, h); ctx.stroke(); }
      for (let j = 0; j < 8; j++) { const y = h * 0.45 + Math.pow(j / 8, 1.8) * h * 0.55; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      const x = w * (0.5 + 0.32 * Math.sin(t * 0.9)), y = h * (0.5 + 0.22 * Math.sin(t * 1.7 + 1));
      ctx.globalCompositeOperation = THEME.blend;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 22); g.addColorStop(0, rgba(C.white, 0.95)); g.addColorStop(0.3, rgba(C.violet, 0.6)); g.addColorStop(1, rgba(C.violet, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 22, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = "source-over";
      // adverse visibility: drifting fog
      const fog = Math.max(0, Math.sin(t * 0.5)) * 0.55;
      for (let i = 0; i < 26; i++) { ctx.fillStyle = rgba(C.dim, fog * 0.2); const fx = (hash(i) * w + t * 20 * (0.5 + hash(i + 3))) % (w + 60) - 30; ctx.beginPath(); ctx.arc(fx, hash(i + 7) * h, 20 + hash(i + 1) * 30, 0, TAU); ctx.fill(); }
      if (s.bx === undefined) { s.bx = x; s.by = y; }
      s.bx += (x - s.bx) * 0.2; s.by += (y - s.by) * 0.2;
      const bw = 52, bh = 44, l = s.bx - bw / 2, tp = s.by - bh / 2, k = 10;
      ctx.strokeStyle = rgba(C.cyan, 1); ctx.lineWidth = 2; ctx.beginPath();
      [[l, tp, 1, 1], [l + bw, tp, -1, 1], [l, tp + bh, 1, -1], [l + bw, tp + bh, -1, -1]].forEach(([cx, cy, dx, dy]) => { ctx.moveTo(cx + dx * k, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + dy * k); });
      ctx.stroke(); ctx.lineWidth = 1;
      ctx.strokeStyle = rgba(C.cyan, 0.3); ctx.strokeRect(l, tp, bw, bh);
      ctx.fillStyle = rgba(C.cyan, 0.9); ctx.fillRect(l, tp - 14, 74, 12);
      label(ctx, `target ${(0.97 - fog * 0.08).toFixed(2)}`, l + 3, tp - 5, C.bg, 8);
      label(ctx, "CPU · real-time · TTA on", 8, 14, C.cyan); if (fog > 0.2) label(ctx, "LOW VISIBILITY", w - 8, 14, C.magenta, 8, "right");
    },
    cells(ctx, w, h, t, s, dt, opt = {}) {
      if (!s.c) s.c = Array.from({ length: opt.rods ? 9 : 13 }, (_, i) => ({ x: rand(0.06, 0.94) * w, y: rand(0.1, 0.9) * h, r: rand(10, 20), ph: rand(TAU), a: rand(TAU), hue: i % 4, len: rand(28, 50), bend: rand(-0.6, 0.6) }));
      const pal = [C.cyan, C.violet, C.magenta, C.lime];
      ctx.fillStyle = rgba(C.bg, 1); ctx.fillRect(0, 0, w, h);
      const scan = ((t * 0.22) % 1.25) * w;
      for (const c of s.c) {
        const seg = c.x < scan;
        if (opt.rods) {
          const dx = Math.cos(c.a + Math.sin(t * 0.4 + c.ph) * 0.1) * c.len / 2, dy = Math.sin(c.a) * c.len / 2;
          const mx = c.x - dy * c.bend, my = c.y + dx * c.bend;
          ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(c.x - dx, c.y - dy); ctx.quadraticCurveTo(mx, my, c.x + dx, c.y + dy);
          ctx.lineWidth = 13; ctx.strokeStyle = seg ? rgba(pal[c.hue], 0.95) : rgba(C.dim, 0.5); ctx.stroke();
          ctx.lineWidth = 9; ctx.strokeStyle = seg ? rgba(pal[c.hue], 0.3) : rgba(C.white, 0.15); ctx.stroke();
          ctx.lineWidth = 1; ctx.lineCap = "butt";
        } else {
          ctx.beginPath();
          for (let k = 0; k <= 14; k++) { const a = (k / 14) * TAU, r = c.r * (1 + 0.12 * Math.sin(a * 3 + t + c.ph) + 0.06 * Math.sin(a * 5 - t)); const px = c.x + Math.cos(a) * r, py = c.y + Math.sin(a) * r; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
          ctx.closePath();
          if (seg) { ctx.fillStyle = rgba(pal[c.hue], opt.entropy ? 0.15 + 0.25 * (1 - opt.entropy) : 0.28); ctx.fill(); ctx.strokeStyle = rgba(pal[c.hue], 1); ctx.lineWidth = 1.5; ctx.stroke(); ctx.lineWidth = 1; }
          else { const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r * 1.2); g.addColorStop(0, rgba(C.white, 0.45)); g.addColorStop(1, rgba(C.white, 0)); ctx.fillStyle = g; ctx.fill(); }
        }
      }
      ctx.fillStyle = rgba(C.cyan, 0.9); ctx.fillRect(scan, 0, 1.5, h);
      const g = ctx.createLinearGradient(scan - 40, 0, scan, 0); g.addColorStop(0, rgba(C.cyan, 0)); g.addColorStop(1, rgba(C.cyan, 0.15)); ctx.fillStyle = g; ctx.fillRect(scan - 40, 0, 40, h);
      label(ctx, opt.rods ? "few-shot · non-convex" : opt.entropy !== undefined ? "test-time adaptation" : "few-shot · convex", 8, 14, C.cyan);
    },
    rods(ctx, w, h, t, s, dt) { MINI.cells(ctx, w, h, t, s, dt, { rods: true }); },
    entropy(ctx, w, h, t, s, dt) {
      const e = 0.5 + 0.5 * Math.cos(t * 0.6);
      MINI.cells(ctx, w, h, t, s, dt, { entropy: e });
      for (let i = 0; i < 70; i++) { ctx.fillStyle = rgba(C.magenta, e * 0.25 * hash(i + Math.floor(t * 8))); ctx.fillRect(hash(i * 3) * w, hash(i * 7) * h, 6, 6); }
      label(ctx, `H(p) = ${(e * 0.9 + 0.05).toFixed(2)} ${e < 0.5 ? "↓" : ""}`, w - 8, 14, C.magenta, 9, "right");
    },
    cloud(ctx, w, h, t, s) {
      if (!s.p) { s.p = Array.from({ length: 140 }, () => [rand(-1, 1), rand(-1, 1), rand(-1, 1)]); s.tr = Array.from({ length: 6 }, () => ({ o: [rand(-0.7, 0.7), rand(-0.7, 0.7), rand(-0.7, 0.7)], f: rand(0.3, 0.8), ph: rand(TAU) })); }
      const a = t * 0.35, ca = Math.cos(a), sa = Math.sin(a), sc = Math.min(w, h) * 0.38, cx = w / 2, cy = h / 2;
      const P = ([x, y, z]) => { const X = x * ca - z * sa, Z = x * sa + z * ca, Y = y * 0.9 + Z * 0.2; const k = 1 / (1.9 + Z * 0.5); return [cx + X * sc * k * 1.9, cy + Y * sc * k * 1.9, Z]; };
      ctx.strokeStyle = rgba(C.cyan, 0.18);
      const cub = [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(P);
      [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]].forEach(([i, j]) => { ctx.beginPath(); ctx.moveTo(cub[i][0], cub[i][1]); ctx.lineTo(cub[j][0], cub[j][1]); ctx.stroke(); });
      s.p.forEach((p) => { const [x, y, z] = P(p); ctx.fillStyle = rgba(C.white, 0.2 + (1 - z) * 0.2); ctx.fillRect(x, y, 1.6, 1.6); });
      s.tr.forEach((tr, i) => {
        const pos = (tt) => [tr.o[0] + 0.25 * Math.sin(tt * tr.f + tr.ph), tr.o[1] + 0.25 * Math.cos(tt * tr.f * 1.3 + tr.ph), tr.o[2] + 0.25 * Math.sin(tt * tr.f * 0.7)];
        ctx.beginPath();
        for (let k = 0; k < 40; k++) { const [x, y] = P(pos(t - k * 0.08)); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.strokeStyle = rgba(i % 2 ? C.magenta : C.cyan, 0.8); ctx.stroke();
        const [x, y] = P(pos(t)); ctx.fillStyle = rgba(i % 2 ? C.magenta : C.cyan, 1); ctx.beginPath(); ctx.arc(x, y, 3.2, 0, TAU); ctx.fill();
      });
      label(ctx, "3D+t microscopy · tracks", 8, 14, C.cyan);
    },
    telemetry(ctx, w, h, t) {
      softGrid(ctx, w, h);
      const span = 8, at = (x) => t - (w - x) / w * span;
      const anom = (tt) => { const c = ((tt % 7) + 7) % 7; return c > 5 && c < 6 ? Math.sin((c - 5) * Math.PI) : 0; };
      for (let x = 0; x < w; x += 2) if (anom(at(x)) > 0.1) { ctx.fillStyle = rgba(C.red, 0.12); ctx.fillRect(x, 0, 2, h); }
      const cols = [C.cyan, C.violet, C.lime, C.cyan];
      for (let c = 0; c < 4; c++) trace(ctx, w, (x) => { const tt = at(x); return Math.sin(tt * (0.8 + c * 0.4) + c) * 0.5 + Math.sin(tt * 3.1 + c * 2) * 0.15 + (c === 1 ? anom(tt) * 1.4 : 0) + (hash(Math.floor(tt * 30) + c * 99) - 0.5) * 0.12; }, h * (0.17 + c * 0.18), h * 0.06, cols[c], 0.85, 1.1);
      trace(ctx, w, (x) => anom(at(x)) + hash(Math.floor(at(x) * 20)) * 0.1, h * 0.95, h * 0.18, C.red, 0.9, 1.2);
      label(ctx, "VAE-LSTM residual", 8, h * 0.76, C.red, 8);
      if (anom(t) > 0.1) label(ctx, "⚠ ANOMALY", w - 8, 14, C.red, 9, "right"); else label(ctx, "nominal", w - 8, 14, C.lime, 9, "right");
    },
    pc(ctx, w, h, t) {
      softGrid(ctx, w, h);
      const layers = [5, 4, 3, 2], L = layers.length;
      const pos = layers.map((n, li) => Array.from({ length: n }, (_, i) => [w * (0.2 + 0.6 * (i + 0.5) / n), h * (0.85 - li * (0.7 / (L - 1)))]));
      for (let li = 0; li < L - 1; li++) pos[li].forEach((a, i) => pos[li + 1].forEach((b, j) => {
        ctx.strokeStyle = rgba(C.violet, 0.22); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
        const ph = (t * 0.8 + hash(li * 31 + i * 7 + j)) % 1, up = hash(li * 13 + i + j * 3) > 0.5;
        const p = up ? ph : 1 - ph, x = a[0] + (b[0] - a[0]) * p, y = a[1] + (b[1] - a[1]) * p;
        ctx.fillStyle = rgba(up ? C.magenta : C.cyan, 0.9); ctx.beginPath(); ctx.arc(x, y, 1.8, 0, TAU); ctx.fill();
      }));
      pos.forEach((ly, li) => ly.forEach(([x, y], i) => {
        const act = 0.5 + 0.5 * Math.sin(t * 2 + li + i * 1.3);
        ctx.fillStyle = rgba(C.violet, 0.3 + act * 0.6); ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.fill();
        ctx.strokeStyle = rgba(C.white, 0.5); ctx.stroke();
      }));
      label(ctx, "↓ prediction", 8, 14, C.cyan); label(ctx, "↑ error", 8, 26, C.magenta);
    },
    lif(ctx, w, h, t, s, dt) {
      const fs = 60, xs = 1.5;                     // samples per second, px per sample
      if (!s.hist) {
        s.v = 0; s.th = 1; s.n = 0; s.ts = 0; s.acc = 0; s.hist = [];
        while (s.hist.length < w / xs + 2) lifStep(s, fs);   // pre-fill so the trace starts full
      }
      s.acc += dt * fs;
      while (s.acc >= 1) { s.acc -= 1; lifStep(s, fs); }
      while (s.hist.length > w / xs + 2) s.hist.shift();
      softGrid(ctx, w, h);
      // fractional offset scrolls smoothly between samples instead of jumping whole samples
      const y0 = h * 0.9, sc = h * 0.3, last = s.hist.length - 1;
      const X = (i) => w - (last - i + s.acc) * xs;
      const path = (k, y) => { ctx.beginPath(); s.hist.forEach((p, i) => (i ? ctx.lineTo(X(i), y(p[k])) : ctx.moveTo(X(i), y(p[k])))); };
      path(1, (th) => y0 - th * sc); ctx.setLineDash([4, 4]); ctx.strokeStyle = rgba(C.magenta, 0.9); ctx.stroke(); ctx.setLineDash([]);
      path(0, (v) => y0 - v * sc); ctx.strokeStyle = rgba(C.cyan, 0.95); ctx.lineWidth = 1.4; ctx.stroke(); ctx.lineWidth = 1;
      ctx.fillStyle = rgba(C.white, 0.95);
      s.hist.forEach((p, i) => { if (p[2]) ctx.fillRect(X(i), h * 0.12, 1.5, h * 0.14); });
      label(ctx, "V_m", 8, 14, C.cyan); label(ctx, "adaptive θ", 40, 14, C.magenta);
    },
    plant(ctx, w, h, t) {
      softGrid(ctx, w, h);
      const sway = Math.sin(t * 0.8) * 4, bx = w * 0.42, by = h * 0.95;
      ctx.strokeStyle = rgba(C.lime, 0.8); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx - 10, h * 0.55, bx + sway, h * 0.18); ctx.stroke(); ctx.lineWidth = 1;
      const leaf = (x, y, a, s) => { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.beginPath(); ctx.ellipse(s, 0, s, s * 0.42, 0, 0, TAU); ctx.fillStyle = rgba(C.lime, 0.35); ctx.fill(); ctx.strokeStyle = rgba(C.lime, 0.9); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s * 2, 0); ctx.stroke(); ctx.restore(); };
      leaf(bx - 4, h * 0.7, -2.6 + sway * 0.02, 22); leaf(bx - 2, h * 0.55, -0.4 + sway * 0.02, 24); leaf(bx - 1, h * 0.4, -2.9, 18);
      const fx = bx + sway, fy = h * 0.18;
      for (let k = 0; k < 6; k++) { const a = k * TAU / 6 + t * 0.2; ctx.fillStyle = rgba(C.magenta, 0.6); ctx.beginPath(); ctx.ellipse(fx + Math.cos(a) * 9, fy + Math.sin(a) * 9, 7, 4, a, 0, TAU); ctx.fill(); }
      ctx.fillStyle = rgba("255,210,90", 0.95); ctx.beginPath(); ctx.arc(fx, fy, 4, 0, TAU); ctx.fill();
      ctx.fillStyle = rgba(C.red, 0.8); ctx.beginPath(); ctx.arc(bx + 26, h * 0.47, 6, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(bx + 34, h * 0.5, 5, 0, TAU); ctx.fill();
      const boxes = [["FLOWER .96", fx - 18, fy - 18, 36, 36], ["LEAF .93", bx, h * 0.47, 50, 22], ["FRUIT .89", bx + 18, h * 0.4, 24, 20], ["LEAF .91", bx - 46, h * 0.62, 44, 26]];
      const k = Math.floor(t / 1.1) % boxes.length;
      boxes.forEach(([lb, x, y, bw, bh], i) => {
        const on = i === k; ctx.strokeStyle = rgba(on ? C.cyan : C.white, on ? 1 : 0.18); ctx.lineWidth = on ? 1.6 : 1; ctx.strokeRect(x, y, bw, bh); ctx.lineWidth = 1;
        if (on) { ctx.fillStyle = rgba(C.cyan, 0.9); ctx.fillRect(x, y - 12, lb.length * 5.6 + 6, 11); label(ctx, lb, x + 3, y - 3, C.bg, 8); }
      });
      const sp = ["Q. alba", "A. rubrum", "C. florida"][Math.floor(t / 4.4) % 3];
      label(ctx, "organ-fused prediction", w - 8, h * 0.8, C.dim, 8, "right"); label(ctx, sp, w - 8, h * 0.8 + 14, C.cyan, 10, "right");
    },
    hr(ctx, w, h, t) {
      softGrid(ctx, w, h);
      const span = 4, at = (x) => t - (w - x) / w * span, bpm = 66 + 6 * Math.sin(t * 0.3), per = 60 / bpm;
      const ecg = (tt) => { const p = ((tt % per) + per) % per / per; const g = (m, s, a) => a * Math.exp(-((p - m) ** 2) / (2 * s * s)); return g(0.18, 0.025, 0.15) - g(0.28, 0.008, 0.18) + g(0.3, 0.01, 1.1) - g(0.32, 0.01, 0.3) + g(0.55, 0.04, 0.3); };
      trace(ctx, w, (x) => ecg(at(x)), h * 0.5, h * 0.32, C.red, 0.95, 1.5);
      const stages = [3, 2, 1, 1, 2, 3, 2, 0, 1, 2, 3, 3, 2, 1, 0, 2];
      const bw = w / 32, off = (t * 6) % bw;
      for (let i = 0; i < 34; i++) { const st = stages[(Math.floor(t * 6 / bw) + i) % stages.length]; ctx.fillStyle = rgba([C.violet, C.cyan, C.lime, C.white][st], 0.55); ctx.fillRect(i * bw - off, h * 0.92 - st * 5, bw - 1, 4); }
      label(ctx, `HR ${Math.round(bpm)} bpm`, 8, 14, C.red); label(ctx, "sleep stage", 8, h * 0.74, C.dim, 8);
    },
  };

  // one Euler step of a leaky integrate-and-fire neuron with an adaptive threshold
  function lifStep(s, fs) {
    const d = 2.2 / fs;
    s.ts += 1 / fs;
    s.n = s.n * 0.9 + (Math.random() - 0.5) * 0.35;           // low-pass noise: smooth, not jagged
    const I = 1.0 + 0.55 * Math.sin(s.ts * 1.3) + s.n;
    s.v += d * (-s.v + I * 1.25) * 3;
    s.th += d * (1 - s.th) * 0.8;
    let sp = false;
    if (s.v > s.th) { s.v = 0; s.th += 0.22; sp = true; }
    s.hist.push([s.v, s.th, sp]);
  }

  function Mini(cv) {
    const fn = MINI[cv.dataset.viz]; if (!fn) return null;
    const s = {}; let t = rand(0, 5);
    return {
      el: cv,
      frame(dt) { const f = fit(cv); if (!f) return; t += dt; f.ctx.clearRect(0, 0, f.w, f.h); fn(f.ctx, f.w, f.h, t, s, dt); },
    };
  }

  /* ---------------- animation scheduler (only draws what is on screen) ---------------- */
  const SCHED = { list: [], vis: new Set(), io: null };
  function startLoop() {
    if (reduced) { retheme.push(() => SCHED.list.forEach((a) => a.frame(1 / 30, 3))); return; }   // static frames: redraw on theme change
    SCHED.io = new IntersectionObserver((ents) => ents.forEach((e) => (e.isIntersecting ? SCHED.vis.add(e.target) : SCHED.vis.delete(e.target))), { rootMargin: "80px" });
    let last = performance.now(), T = 0;
    (function loop(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now; T += dt;
      for (const a of SCHED.list) if (SCHED.vis.has(a.el)) a.frame(dt, T);
      requestAnimationFrame(loop);
    })(last);
  }
  function addActor(a) {
    if (!a) return;
    SCHED.list.push(a);
    if (reduced) { for (let i = 0; i < 90; i++) a.frame(1 / 30, i / 30); } else SCHED.io.observe(a.el);
  }
  function removeActor(a) {
    SCHED.list = SCHED.list.filter((x) => x !== a);
    if (SCHED.io) SCHED.io.unobserve(a.el);
    SCHED.vis.delete(a.el);
  }

  /* ---------------- portfolio filters + detail dialog ---------------- */
  function portfolio() {
    $$(".filter").forEach((b) => b.addEventListener("click", () => {
      $$(".filter").forEach((x) => x.classList.toggle("active", x === b));
      const f = b.dataset.f;
      $$(".proj").forEach((p) => p.classList.toggle("hide", f !== "all" && !p.dataset.tags.split(" ").includes(f)));
    }));
    const dlg = $("#projDialog"); if (!dlg) return;
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".details"); if (!btn) return;
      const card = btn.closest(".proj");
      $(".dlg-meta", dlg).textContent = $(".proj-meta", card).textContent;
      $(".dlg-title", dlg).textContent = $("h3", card).textContent;
      $(".dlg-body", dlg).innerHTML = $(".proj-detail", card).innerHTML;
      $(".dlg-links", dlg).innerHTML = "";
      $$(".proj-links a", card).forEach((a) => $(".dlg-links", dlg).appendChild(a.cloneNode(true)));
      dlg.showModal ? dlg.showModal() : dlg.setAttribute("open", "");
    });
    $(".dlg-close", dlg).addEventListener("click", () => dlg.close());
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  }

  /* ---------------- theme effect: digital rain (Matrix theme) ---------------- */
  function Rain() {
    const cv = document.createElement("canvas");
    cv.className = "fx-rain"; cv.setAttribute("aria-hidden", "true");
    document.body.prepend(cv);
    const glyphs = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789θΔΣ";
    const fs = 16; let cols = [], W = 0, H = 0, ctx, acc = 0;
    const resize = () => { if (!cv.isConnected) return; const f = fit(cv); if (!f) return; ({ ctx, w: W, h: H } = f); cols = Array.from({ length: Math.ceil(W / fs) }, () => rand(-H / fs, 0)); ctx.fillStyle = rgba(C.bg, 1); ctx.fillRect(0, 0, W, H); };
    window.addEventListener("resize", resize); resize();
    return {
      el: cv,
      frame(dt) {
        if (!ctx) return;
        acc += dt; if (acc < 1 / 20) return; acc = 0;          // classic stepped look
        ctx.fillStyle = rgba(C.bg, 0.12); ctx.fillRect(0, 0, W, H);
        ctx.font = `${fs}px ${THEME.mono}`;
        cols.forEach((y, i) => {
          const ch = glyphs[(Math.random() * glyphs.length) | 0];
          ctx.fillStyle = rgba(C.core, 0.9); ctx.fillText(ch, i * fs, y * fs);
          ctx.fillStyle = rgba(C.cyan, 0.75); ctx.fillText(glyphs[(Math.random() * glyphs.length) | 0], i * fs, (y - 1) * fs);
          cols[i] = y * fs > H && Math.random() > 0.975 ? 0 : y + 1;
        });
      },
    };
  }

  /* ---------------- init ---------------- */
  navThemes(); boot(); nav(); cursor(); reveals(); counters(); scramble(); typed(); portfolio();
  const yr = $("#yr"); if (yr) yr.textContent = new Date().getFullYear();
  startLoop();
  let rain = null;
  const syncFx = () => {
    const want = THEME.fx === "rain" && !reduced;
    if (want && !rain) { rain = Rain(); addActor(rain); }
    else if (!want && rain) { removeActor(rain); rain.el.remove(); rain = null; }
  };
  syncFx(); retheme.push(syncFx);
  const n = $("#neural"); if (n) addActor(SpikingNet(n));
  const e = $("#eeg"); if (e) addActor(Telemetry(e));
  $$("canvas[data-viz]").forEach((c) => addActor(Mini(c)));
})();
