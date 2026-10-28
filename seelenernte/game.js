/* Seelenernte – Spiellogik und Oberfläche */
"use strict";

(function () {
  const { BUILDINGS, UPGRADES, ACHIEVEMENTS, RELICS, WHEEL, NEWS } = SE;
  const BLD = Object.fromEntries(BUILDINGS.map((b) => [b.id, b]));
  const UPG = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));
  const RELIC = Object.fromEntries(RELICS.map((r) => [r.id, r]));
  const ACH = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

  const SAVE_KEY = "seelenernte-v1";
  const TWO_PI = Math.PI * 2;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const $ = (id) => document.getElementById(id);
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mod = (a, n) => ((a % n) + n) % n;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  /* ---------- Grafiken ---------- */
  const canvasCache = {};
  function spriteCanvas(name, pal, key) {
    const k = name + "|" + (key || "");
    return canvasCache[k] || (canvasCache[k] = SE.spriteCanvas(name, { pal }));
  }
  function iconURL(icon) {
    const key = icon.key || (icon.pal && typeof icon.pal === "object" ? JSON.stringify(icon.pal) : "");
    return SE.spriteURL(icon.sprite, { pal: icon.pal, key });
  }
  const shadowURL = (name) => SE.spriteURL(name, { pal: SE.PAL.shadow(), key: "shadow" });
  const imgTag = (src, cls = "") => `<img${cls ? ` class="${cls}"` : ""} src="${src}" alt="">`;
  const SOUL_URL = () => SE.spriteURL("soul");
  const RED_HAND = { W: "#ff8a7e", w: "#e0303f", x: "#6e0d1c" };

  /* ---------- Zahlen und Zeiten ---------- */
  const BIG = [
    [1e6, "Millionen", "Mio."],
    [1e9, "Milliarden", "Mrd."],
    [1e12, "Billionen", "Bio."],
    [1e15, "Billiarden", "Brd."],
    [1e18, "Trillionen", "Trio."],
    [1e21, "Trilliarden", "Trd."],
    [1e24, "Quadrillionen", "Quadr."],
    [1e27, "Quadrilliarden", "Qd."],
    [1e30, "Quintillionen", "Quint."],
    [1e33, "Quintilliarden", "Qid."],
  ];
  const NF = [0, 1, 2, 3].map((d) => new Intl.NumberFormat("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: d }));
  const NF3 = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 3, maximumFractionDigits: 3 });

  // long: "1,234 Millionen" · sonst "1,23 Mio." · dec: Nachkommastelle unter 100 (für Seelen pro Sekunde)
  function fmt(n, opt = {}) {
    if (!isFinite(n)) return "unendlich";
    if (n < 0) return "−" + fmt(-n, opt);
    if (n < 1e6) {
      if (opt.dec && n < 100) return NF[1].format(Math.floor(n * 10) / 10);
      return NF[0].format(Math.floor(n));
    }
    if (n >= BIG[BIG.length - 1][0] * 1000) return n.toExponential(3).replace(".", ",");
    let i = BIG.length - 1;
    while (i > 0 && n < BIG[i][0]) i--;
    const v = n / BIG[i][0];
    if (opt.long) return NF3.format(Math.floor(v * 1000) / 1000) + " " + BIG[i][1];
    const d = v < 10 ? 2 : v < 100 ? 1 : 0;
    return NF[d].format(Math.floor(v * 10 ** d) / 10 ** d) + " " + BIG[i][2];
  }
  const fmtPct = (x) => NF[1].format(x * 100) + " %";

  function fmtDuration(sec) {
    sec = Math.max(0, Math.floor(sec));
    const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    if (d) return `${d} ${d === 1 ? "Tag" : "Tage"} ${h} Std.`;
    if (h) return `${h} Std. ${m} Min.`;
    if (m) return `${m} Min. ${s} Sek.`;
    return `${s} Sek.`;
  }
  const fmtClock = (sec) => {
    sec = Math.max(0, Math.floor(sec));
    return [Math.floor(sec / 3600), Math.floor((sec % 3600) / 60), sec % 60].map((v) => String(v).padStart(2, "0")).join(":");
  };
  const fmtDate = (ms) => new Date(ms).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });

  const dayKey = (d = new Date()) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const yesterdayKey = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return dayKey(d);
  };
  const secondsToMidnight = () => {
    const now = new Date();
    const next = new Date(now);
    next.setHours(24, 0, 0, 0);
    return (next - now) / 1000;
  };

  /* ---------- Spielstand ---------- */
  function freshState() {
    const now = Date.now();
    return {
      v: 1,
      souls: 0,
      runSouls: 0,
      allTimeSouls: 0,
      clicks: 0,
      clickSouls: 0,
      buildings: Object.fromEntries(BUILDINGS.map((b) => [b.id, 0])),
      seen: {},
      upgrades: [],
      upSeen: [],
      achievements: [],
      wispsClicked: 0,
      buffs: {},
      relics: [],
      essence: 0,
      rituals: 0,
      sold: 0,
      wheel: { last: null, streak: 0, bestStreak: 0, spins: 0, hoards: 0, pending: null, lastResult: null },
      settings: { sound: true, particles: !reduceMotion },
      hints: {},
      started: now,
      runStarted: now,
      playTime: 0,
      lastSave: now,
    };
  }

  function mergeState(data) {
    const base = freshState();
    if (!data || typeof data !== "object") return base;
    const out = { ...base };
    for (const k of Object.keys(base)) {
      if (typeof base[k] === "number" && typeof data[k] === "number" && isFinite(data[k])) out[k] = data[k];
    }
    for (const k of ["upgrades", "upSeen", "achievements", "relics"]) {
      if (Array.isArray(data[k])) out[k] = [...new Set(data[k].filter((id) => typeof id === "string"))];
    }
    for (const b of BUILDINGS) {
      const n = data.buildings && data.buildings[b.id];
      out.buildings[b.id] = Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
    }
    if (data.seen && typeof data.seen === "object") out.seen = { ...data.seen };
    if (data.buffs && typeof data.buffs === "object") out.buffs = { ...data.buffs };
    if (data.hints && typeof data.hints === "object") out.hints = { ...data.hints };
    if (data.wheel && typeof data.wheel === "object") out.wheel = { ...base.wheel, ...data.wheel };
    if (data.settings && typeof data.settings === "object") out.settings = { ...base.settings, ...data.settings };
    out.upgrades = out.upgrades.filter((id) => UPG[id]);
    out.achievements = out.achievements.filter((id) => ACH[id]);
    out.relics = out.relics.filter((id) => RELIC[id]);
    return out;
  }

  let st = freshState();
  let owned = new Set();
  let won = new Set();
  function syncSets() {
    owned = new Set(st.upgrades);
    won = new Set(st.achievements);
  }

  function loadLocal() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
  function save(note) {
    st.lastSave = Date.now();
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(st));
      if (note) setNote("Gespeichert um " + new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) + " Uhr.");
      return true;
    } catch {
      if (note) setNote("Speichern ist in diesem Browser nicht möglich. Exportiere deinen Spielstand, um ihn zu sichern.");
      return false;
    }
  }
  function setNote(text) {
    $("saveNote").textContent = text;
  }

  /* ---------- Effekte ---------- */
  const BUFFS = {
    frenzy: { name: "Blutrausch", icon: { sprite: "potion" }, sps: 7, text: "Seelen/s ×7", color: "#ff5a4e" },
    claw: { name: "Dämonenklaue", icon: { sprite: "demon" }, click: 777, text: "Klicks ×777", color: "#f8c531" },
    bloodmoon: { name: "Blutmond", icon: { sprite: "moon" }, sps: 5, text: "Seelen/s ×5", color: "#e0303f" },
    fist: { name: "Höllenfaust", icon: { sprite: "hand", pal: RED_HAND, key: "red" }, click: 77, text: "Klicks ×77", color: "#e2691c" },
  };

  function addBuff(id, seconds) {
    st.buffs[id] = { until: Date.now() + seconds * 1000, dur: seconds * 1000 };
    recalc();
    renderBuffs();
    checkAchievements();
  }

  /* ---------- Berechnung ---------- */
  const G = {
    each: {}, bSps: {}, baseSps: 0, sps: 0, buffSps: 1, buffClick: 1, click: 1, clickNoBuff: 1,
    globalMult: 1, costMult: 1, wispFreq: 1, wispDur: 1, buffDur: 1, wheelMult: 1, offline: 0.5,
    totalBuildings: 0, clickBurst: 0,
  };

  function recalc() {
    const bm = Object.fromEntries(BUILDINGS.map((b) => [b.id, 1]));
    let cmult = 1, clickPct = 0, finger = 0, fingerMult = 1, gUp = 0, wispFreq = 1, wispDur = 1;
    for (const id of st.upgrades) {
      for (const e of UPG[id].effects) {
        if (e.type === "bmult") bm[e.b] *= e.x;
        else if (e.type === "cmult") cmult *= e.x;
        else if (e.type === "clickpct") clickPct += e.x;
        else if (e.type === "finger") finger += e.x;
        else if (e.type === "fingermult") fingerMult *= e.x;
        else if (e.type === "gmult") gUp += e.x;
        else if (e.type === "wispfreq") wispFreq *= e.x;
        else if (e.type === "wispdur") wispDur *= e.x;
      }
    }
    let gRelic = 0, relicClick = 1, buffDur = 1, costMult = 1, wheelMult = 1, offline = 0.5;
    for (const id of st.relics) {
      const e = RELIC[id].effect;
      if (e.gmult) gRelic += e.gmult;
      if (e.cmult) relicClick *= e.cmult;
      if (e.buffdur) buffDur *= e.buffdur;
      if (e.costmult) costMult *= e.costmult;
      if (e.wispfreq) wispFreq *= e.wispfreq;
      if (e.wheel) wheelMult *= e.wheel;
      if (e.offline) offline = e.offline;
    }

    let total = 0;
    for (const b of BUILDINGS) total += st.buildings[b.id];
    const fingerBonus = finger * fingerMult * (total - st.buildings.hand);

    G.globalMult = (1 + gUp + gRelic) * (1 + 0.01 * st.achievements.length) * (1 + 0.01 * st.essence);
    let base = 0;
    for (const b of BUILDINGS) {
      const each = (b.sps + (b.id === "hand" ? fingerBonus : 0)) * bm[b.id] * G.globalMult;
      G.each[b.id] = each;
      G.bSps[b.id] = each * st.buildings[b.id];
      base += G.bSps[b.id];
    }
    G.baseSps = base;

    let bs = 1, bc = 1;
    for (const id of Object.keys(st.buffs)) {
      const def = BUFFS[id];
      if (!def) continue;
      if (def.sps) bs *= def.sps;
      if (def.click) bc *= def.click;
    }
    G.buffSps = bs;
    G.buffClick = bc;
    G.sps = base * bs;
    const clickBase = (1 + fingerBonus) * cmult;
    G.clickNoBuff = (clickBase + clickPct * base) * relicClick;
    G.click = (clickBase + clickPct * G.sps) * relicClick * bc;

    G.totalBuildings = total;
    G.costMult = costMult;
    G.wispFreq = wispFreq;
    G.wispDur = wispDur;
    G.buffDur = buffDur;
    G.wheelMult = wheelMult;
    G.offline = offline;
  }

  function earn(n) {
    st.souls += n;
    st.runSouls += n;
    st.allTimeSouls += n;
  }

  function priceOf(b, have, k) {
    return Math.ceil(b.cost * G.costMult * Math.pow(1.15, have) * (Math.pow(1.15, k) - 1) / 0.15);
  }
  function sellValue(b, have, k) {
    k = Math.min(k, have);
    if (k <= 0) return 0;
    return Math.floor(0.25 * b.cost * G.costMult * Math.pow(1.15, have - k) * (Math.pow(1.15, k) - 1) / 0.15);
  }
  const essenceFor = (souls) => Math.floor(Math.cbrt(souls / 1e12));

  /* ---------- Klänge (8 Bit) ---------- */
  const Sfx = (() => {
    let ac = null, out = null, lastTick = 0;
    function ctx() {
      if (!st.settings.sound) return null;
      try {
        if (!ac) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return null;
          ac = new AC();
          out = ac.createGain();
          out.gain.value = 0.06;
          out.connect(ac.destination);
        }
        if (ac.state === "suspended") ac.resume();
        return ac;
      } catch {
        return null;
      }
    }
    function note(freq, at, dur, { type = "square", vol = 1, to = 0 } = {}) {
      const a = ctx();
      if (!a) return;
      const t = a.currentTime + at;
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g);
      g.connect(out);
      o.start(t);
      o.stop(t + dur + 0.02);
    }
    const seq = (notes, step, dur, opt) => notes.forEach((f, i) => note(f, i * step, dur, opt));
    return {
      click: () => note(rand(500, 580), 0, 0.06, { to: 240, vol: 0.7 }),
      buy: () => { note(988, 0, 0.07); note(1319, 0.07, 0.3); },
      sell: () => { note(660, 0, 0.08); note(440, 0.08, 0.16); },
      deny: () => note(130, 0, 0.16, { type: "sawtooth", vol: 0.5 }),
      ach: () => seq([523, 659, 784, 1047], 0.08, 0.16),
      wisp: () => { note(880, 0, 0.3, { type: "triangle", to: 1320, vol: 0.6 }); note(1320, 0.18, 0.3, { type: "triangle", to: 880, vol: 0.4 }); },
      catch: () => seq([392, 523, 659, 784, 1047, 1319], 0.05, 0.12),
      tick: () => {
        const now = performance.now();
        if (now - lastTick < 45) return;
        lastTick = now;
        note(1700, 0, 0.025, { vol: 0.35 });
      },
      win: () => seq([523, 523, 523, 784, 698, 880, 1047], 0.11, 0.2),
      ritual: () => seq([196, 185, 175, 165, 98], 0.18, 0.45, { type: "triangle" }),
    };
  })();

  /* ---------- Szene am Altar ---------- */
  const EYES = {
    hover: [{ C: "#8affe6", e: "#ffffff" }, "hover"],
    flash: [{ C: "#ffffff", e: "#ffffff" }, "flash"],
    red: [{ C: "#c42332", e: "#ff5a4e" }, "red"],
    gold: [{ C: "#f8c531", e: "#fff2a8" }, "gold"],
  };

  const Scene = {
    S: 4, W: 0, H: 0, bg: null, cx: 0, skullX: 0, skullY: 0, groundY: 0, pedTop: 0, horizon: 0,
    stars: [], souls: [], parts: [], braziers: [], flames: [], flameAt: 0, rings: {},
    bumpUntil: 0, flashUntil: 0, hover: false, soulAcc: 0,

    init() {
      this.canvas = $("scene");
      this.ctx = this.canvas.getContext("2d");
    },

    resize() {
      const sec = $("altar");
      const cw = sec.clientWidth, ch = sec.clientHeight;
      if (!cw || !ch) return;
      const S = clamp(Math.floor(Math.min(cw / 64, ch / 84)), 3, 7);
      const W = Math.ceil(cw / S), H = Math.ceil(ch / S);
      Object.assign(this, { S, W, H });
      const c = this.canvas;
      c.width = W;
      c.height = H;
      c.style.width = W * S + "px";
      c.style.height = H * S + "px";
      this.offX = Math.floor((cw - W * S) / 2);
      this.offY = ch - H * S;
      c.style.left = this.offX + "px";

      const hud = $("hud");
      const hudBottom = Math.ceil((hud.offsetTop + hud.offsetHeight - this.offY) / S);
      this.hudBottom = hudBottom;
      this.groundY = H - 12;
      this.pedTop = this.groundY - 10;
      this.horizon = this.groundY - 14;
      this.cx = Math.floor(W / 2);
      const minY = hudBottom + 3, maxY = this.pedTop - 35;
      this.skullY = maxY <= minY ? maxY : Math.max(Math.round((minY + maxY) / 2), maxY - 22);
      this.skullX = this.cx - 16;
      this.braziers = W >= 64 ? [this.cx - 23, this.cx + 22] : [];

      const btn = $("skullBtn");
      btn.style.left = this.offX + this.skullX * S + "px";
      btn.style.top = this.offY + this.skullY * S + "px";
      btn.style.width = btn.style.height = 32 * S + "px";

      this.stars = [];
      const n = Math.round((W * this.horizon) / 55);
      for (let i = 0; i < n; i++) {
        this.stars.push({
          x: Math.floor(Math.random() * W),
          y: Math.floor(Math.random() * (this.horizon - 6)),
          c: Math.random() < 0.3 ? "#b18cff" : "#ece3d2",
          tw: Math.random() < 0.35,
          ph: Math.random() * TWO_PI,
        });
      }
      this.souls = this.souls.filter((s) => s.x < W);
      this.renderBg();
    },

    renderBg() {
      const { W, H } = this;
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      const x = c.getContext("2d");
      const px = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };

      // Himmel in Streifen mit Rasterübergängen
      const bands = ["#06040b", "#0a0612", "#0f0919", "#150c22", "#1d102e"];
      const skyH = this.horizon + 8;
      const bh = skyH / bands.length;
      for (let y = 0; y < skyH; y++) {
        const f = y / bh, i = Math.min(bands.length - 1, Math.floor(f)), fr = f - i;
        px(0, y, W, 1, bands[i]);
        if (i + 1 < bands.length && fr > 0.68) {
          x.fillStyle = bands[i + 1];
          const step = fr > 0.84 ? 2 : 4;
          for (let xx = (y % 2) * (step / 2); xx < W; xx += step) x.fillRect(xx, y, 1, 1);
        }
      }

      // feste Sterne
      for (const s of this.stars) if (!s.tw) px(s.x, s.y, 1, 1, s.c);

      // Blutmond mit Hof
      const mx = W - 23, my = Math.min(this.hudBottom + 3, this.horizon - 30);
      x.fillStyle = "#2a0812";
      for (let j = -12; j <= 12; j++) {
        for (let i = -12; i <= 12; i++) {
          const d = Math.hypot(i, j);
          if (d > 9.5 && d < 12 && (i + j) % 2 === 0) x.fillRect(mx + 8 + i, my + 8 + j, 1, 1);
        }
      }
      x.drawImage(spriteCanvas("moon"), mx, my);

      // Burg in der Ferne
      const castle = "#120a1c";
      const by = this.horizon + 3, bx = 3;
      const roof = (cx, top, half) => { for (let r = 0; r <= half; r++) px(cx - r, top + r, r * 2 + 1, 1, castle); };
      px(bx, by - 8, 22, 8, castle);
      for (let i = 0; i < 22; i += 3) px(bx + i, by - 10, 2, 2, castle);
      px(bx, by - 16, 5, 16, castle);
      roof(bx + 2, by - 20, 3);
      px(bx + 8, by - 22, 7, 22, castle);
      roof(bx + 11, by - 27, 4);
      px(bx + 17, by - 13, 5, 13, castle);
      roof(bx + 19, by - 16, 3);
      px(bx + 2, by - 12, 1, 2, "#e2a01c");
      px(bx + 11, by - 18, 1, 2, "#e2a01c");
      px(bx + 10, by - 12, 1, 1, "#a8741a");
      px(bx + 19, by - 9, 1, 1, "#e2a01c");

      // toter Baum
      const tree = "#140c1e", tx = W - 12, ty = this.horizon + 4;
      px(tx, ty - 16, 2, 16, tree);
      px(tx - 1, ty - 1, 4, 1, tree);
      [[-1, -11], [-2, -12], [-3, -13], [-4, -13], [2, -9], [3, -10], [4, -11], [5, -11], [2, -14], [3, -15], [-1, -17], [-2, -18], [1, -18]]
        .forEach(([a, b]) => px(tx + a, ty + b, 1, 1, tree));

      // Hügel mit Grabsteinen
      for (let xx = 0; xx < W; xx++) {
        const h = Math.round(5 + 3 * Math.sin(xx * 0.13) + 2 * Math.sin(xx * 0.29 + 1.3));
        px(xx, this.groundY - h - 2, 1, h + 2, "#1a1027");
        px(xx, this.groundY - h - 2, 1, 1, "#2a1a3c");
      }
      const stone = "#2e1f42";
      for (const gx of [Math.round(W * 0.12), Math.round(W * 0.31), Math.round(W * 0.7), Math.round(W * 0.86)]) {
        const h = Math.round(5 + 3 * Math.sin(gx * 0.13) + 2 * Math.sin(gx * 0.29 + 1.3));
        const gy = this.groundY - h - 2;
        px(gx, gy - 4, 3, 4, stone);
        px(gx + 1, gy - 5, 1, 1, stone);
        px(gx + 1, gy - 3, 1, 1, "#1a1027");
      }

      // Boden aus Steinblöcken
      const tile = spriteCanvas("ground");
      for (let xx = 0; xx < W; xx += 16) x.drawImage(tile, xx, this.groundY);

      // Altarsockel
      const cx = this.cx, pt = this.pedTop, gy = this.groundY;
      const block = (a, b, w, h, fill, hi) => {
        px(a, b, w, h, "#0a0710");
        px(a + 1, b + 1, w - 2, h - 2, fill);
        if (hi) px(a + 1, b + 1, w - 2, 1, hi);
      };
      block(cx - 9, gy - 4, 18, 4, "#5b5068", "#8a809a");
      block(cx - 6, pt + 2, 12, gy - 3 - (pt + 2), "#3a2f45");
      px(cx - 5, pt + 3, 1, gy - 6 - pt, "#5b5068");
      block(cx - 10, pt, 20, 4, "#8a809a", "#b8b0c4");
      px(cx - 1, pt + 4, 2, 1, "#22a596");
      px(cx - 2, pt + 5, 1, 1, "#22a596");
      px(cx + 1, pt + 5, 1, 1, "#22a596");
      px(cx - 1, pt + 6, 2, 1, "#4ff0cf");

      // Feuerschalen
      for (const bxp of this.braziers) {
        px(bxp, gy - 9, 1, 9, "#2a2233");
        px(bxp - 1, gy - 1, 3, 1, "#2a2233");
        px(bxp - 3, gy - 11, 7, 1, "#0a0710");
        px(bxp - 3, gy - 12, 7, 1, "#5b5068");
        px(bxp - 2, gy - 10, 5, 1, "#3a2f45");
      }
      this.bg = c;
    },

    ring(color, phase) {
      const k = color + phase;
      if (this.rings[k]) return this.rings[k];
      const R = 24;
      const c = document.createElement("canvas");
      c.width = c.height = R * 2 + 1;
      const x = c.getContext("2d");
      x.fillStyle = color;
      for (let j = -R; j <= R; j++) {
        for (let i = -R; i <= R; i++) {
          const d = Math.hypot(i, j);
          if (d < 17 || d > R) continue;
          const on = d < 20.5 ? (i + j + phase) % 2 === 0 : mod(i + 2 * j + phase * 2, 4) === 0;
          if (on) x.fillRect(i + R, j + R, 1, 1);
        }
      }
      return (this.rings[k] = c);
    },

    burst(clientX, clientY) {
      if (!st.settings.particles) return;
      const r = this.canvas.getBoundingClientRect();
      const ix = (clientX - r.left) / this.S, iy = (clientY - r.top) / this.S;
      for (let i = 0; i < 9; i++) {
        this.parts.push({
          x: ix, y: iy, vx: rand(-28, 28), vy: rand(-48, -14), life: rand(0.35, 0.75),
          c: pick(["#4ff0cf", "#d6fff4", "#d8cfbf", "#22a596"]),
        });
      }
      if (this.parts.length > 160) this.parts.splice(0, this.parts.length - 160);
    },

    update(dt, t) {
      // fallende Seelen, je nach Produktion
      if (st.settings.particles && !reduceMotion && G.baseSps > 0) {
        this.soulAcc += dt * clamp(Math.log10(G.baseSps + 1) * 0.3, 0.15, 1.5);
        while (this.soulAcc >= 1) {
          this.soulAcc -= 1;
          if (this.souls.length < 14) {
            this.souls.push({ x: rand(0, this.W - 8), y: -10, vy: rand(6, 11), ph: rand(0, TWO_PI), a: rand(0.22, 0.42) });
          }
        }
      }
      for (const s of this.souls) s.y += s.vy * dt;
      this.souls = this.souls.filter((s) => s.y < this.groundY - 8);

      for (const p of this.parts) {
        p.vy += 110 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
      }
      this.parts = this.parts.filter((p) => p.life > 0);

      if (t > this.flameAt) {
        this.flameAt = t + 90;
        this.flames = this.braziers.map(() => [rand(1, 3), rand(3, 5), rand(4, 7), rand(3, 5), rand(1, 3)].map(Math.round));
      }
    },

    render(t) {
      const { ctx } = this;
      if (!this.bg) return;
      ctx.drawImage(this.bg, 0, 0);

      for (const s of this.stars) {
        if (!s.tw) continue;
        if (Math.sin(t / 600 + s.ph) > -0.2) {
          ctx.fillStyle = s.c;
          ctx.fillRect(s.x, s.y, 1, 1);
        }
      }

      const soul = spriteCanvas("soul");
      for (const s of this.souls) {
        ctx.globalAlpha = s.a * clamp((s.y - this.hudBottom) / 12, 0, 1);
        if (!ctx.globalAlpha) continue;
        ctx.drawImage(soul, Math.round(s.x + Math.sin(t / 700 + s.ph) * 2), Math.round(s.y));
      }
      ctx.globalAlpha = 1;

      // Flammen der Feuerschalen
      const gy = this.groundY;
      const phase = Math.floor(t / 180) % 2;
      this.braziers.forEach((bx, k) => {
        ctx.globalAlpha = 0.14;
        ctx.fillStyle = "#e2691c";
        for (let j = -7; j <= 7; j++) {
          for (let i = -7; i <= 7; i++) {
            if (Math.hypot(i, j) < 7 && (i + j + phase) % 2 === 0) ctx.fillRect(bx + i, gy - 15 + j, 1, 1);
          }
        }
        ctx.globalAlpha = 1;
        const heights = this.flames[k] || [1, 3, 5, 3, 1];
        heights.forEach((h, i) => {
          for (let y = 0; y < h; y++) {
            const f = y / Math.max(1, h);
            ctx.fillStyle = y === 0 && i > 0 && i < 4 ? "#fff2a8" : f < 0.4 ? "#f8c531" : f < 0.75 ? "#e2691c" : "#c42332";
            ctx.fillRect(bx - 2 + i, gy - 13 - y, 1, 1);
          }
        });
      });

      // Schädel mit Aura
      const red = st.buffs.frenzy || st.buffs.bloodmoon;
      const gold = st.buffs.claw || st.buffs.fist;
      const bob = reduceMotion ? 0 : Math.round(Math.sin(t / 650));
      const bump = t < this.bumpUntil ? -2 : 0;
      const sx = this.skullX, sy = this.skullY + bob + bump;
      ctx.globalAlpha = 0.5;
      ctx.drawImage(this.ring(gold ? "#f8c531" : red ? "#c42332" : "#22a596", Math.floor(t / 400) % 2), sx + 16 - 24, sy + 16 - 24);
      ctx.globalAlpha = 1;
      let eyes = null;
      if (t < this.flashUntil) eyes = EYES.flash;
      else if (gold) eyes = EYES.gold;
      else if (red) eyes = EYES.red;
      else if (this.hover) eyes = EYES.hover;
      ctx.drawImage(eyes ? spriteCanvas("skull", eyes[0], eyes[1]) : spriteCanvas("skull"), sx, sy);

      for (const p of this.parts) {
        ctx.fillStyle = p.c;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
      }
    },
  };

  /* ---------- Klick auf den Schädel ---------- */
  const clickTimes = [];
  function clickSkull(ev) {
    const t = performance.now();
    clickTimes.push(t);
    while (clickTimes.length && clickTimes[0] < t - 1000) clickTimes.shift();
    G.clickBurst = clickTimes.length;

    const gain = G.click;
    earn(gain);
    st.clicks++;
    st.clickSouls += gain;
    Scene.bumpUntil = t + 90;
    Scene.flashUntil = t + 70;
    Sfx.click();

    const altar = $("altar").getBoundingClientRect();
    let cx = ev.clientX, cy = ev.clientY;
    if (!ev.detail || (!cx && !cy)) {
      const b = $("skullBtn").getBoundingClientRect();
      cx = b.left + b.width / 2 + rand(-20, 20);
      cy = b.top + b.height / 3;
    }
    Scene.burst(cx, cy);
    floater("+" + fmt(gain, { dec: true }), cx - altar.left + rand(-8, 8), cy - altar.top - 10, gain >= G.clickNoBuff * 50);
    if (G.clickBurst >= 12) checkAchievements();
  }

  function floater(text, x, y, big) {
    const box = $("floaters");
    if (box.children.length > 28) box.firstChild.remove();
    const f = document.createElement("span");
    f.className = "floater" + (big ? " big" : "");
    f.textContent = text;
    f.style.left = x + "px";
    f.style.top = y + "px";
    f.addEventListener("animationend", () => f.remove());
    box.appendChild(f);
  }

  /* ---------- Meldungen und Dialoge ---------- */
  function toast(title, html, icon) {
    const box = $("toasts");
    while (box.children.length >= (window.innerWidth < 720 ? 2 : 3)) box.firstChild.remove();
    const t = document.createElement("div");
    t.className = "toast px-box";
    t.innerHTML = `${imgTag(icon ? iconURL(icon) : SOUL_URL())}<div><strong>${esc(title)}</strong><span>${html}</span></div>`;
    box.appendChild(t);
    setTimeout(() => {
      t.classList.add("leaving");
      setTimeout(() => t.remove(), 320);
    }, 4600);
  }

  let modalReturn = null;
  let modalDismiss = null;
  function openModal({ title, body, actions, onDismiss }) {
    modalReturn = document.activeElement;
    modalDismiss = onDismiss || null;
    $("modalTitle").textContent = title;
    $("modalBody").innerHTML = body;
    const box = $("modalActions");
    box.innerHTML = "";
    for (const a of actions) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "px-btn " + (a.cls || "");
      b.textContent = a.label;
      b.addEventListener("click", () => {
        if (a.run && a.run() === false) return;
        closeModal(false);
      });
      box.appendChild(b);
    }
    $("modalBack").hidden = false;
    const focusTarget = $("modalBody").querySelector("textarea") || box.lastElementChild;
    if (focusTarget) focusTarget.focus();
  }
  function closeModal(dismissed) {
    if ($("modalBack").hidden) return;
    $("modalBack").hidden = true;
    if (dismissed && modalDismiss) modalDismiss();
    modalDismiss = null;
    if (modalReturn && modalReturn.focus) modalReturn.focus();
  }

  /* ---------- Tooltip ---------- */
  let lastPointer = "mouse";
  const Tip = {
    target: null,
    render: null,
    show(target, render) {
      this.target = target;
      this.render = render;
      this.refresh();
    },
    refresh() {
      if (!this.target || !this.target.isConnected) return this.hide();
      const el = $("tooltip");
      el.innerHTML = this.render();
      el.hidden = false;
      const r = this.target.getBoundingClientRect();
      const tw = el.offsetWidth, th = el.offsetHeight;
      const vw = window.innerWidth, vh = window.innerHeight;
      let x = r.left - tw - 14, y;
      if (x < 8) x = r.right + 14;
      if (x + tw > vw - 8) {
        x = clamp(r.left + r.width / 2 - tw / 2, 8, vw - tw - 8);
        y = r.top - th - 12;
        if (y < 8) y = r.bottom + 12;
      } else {
        y = r.top + r.height / 2 - th / 2;
      }
      el.style.left = Math.round(x) + "px";
      el.style.top = Math.round(clamp(y, 8, Math.max(8, vh - th - 8))) + "px";
    },
    hide() {
      this.target = null;
      $("tooltip").hidden = true;
    },
  };

  function tipBuilding(id) {
    const b = BLD[id];
    const vis = visibleBuildings().find((v) => v.b.id === id);
    if (!vis || vis.mystery) {
      return `<div class="tip-head">${imgTag(shadowURL(b.sprite))}<span class="tip-title">???</span><span></span></div>
        <div class="tip-cost ${st.souls >= priceOf(b, 0, 1) ? "" : "no"}">${imgTag(SOUL_URL())}${fmt(priceOf(b, 0, 1))}</div>
        <p class="tip-flavor">Ernte mehr Seelen, um dieses Gebäude zu entdecken.</p>`;
    }
    const have = st.buildings[id];
    const selling = shop.mode === "sell";
    const price = selling ? sellValue(b, have, shop.amount) : priceOf(b, have, shop.amount);
    const ok = selling ? have > 0 : st.souls >= price;
    const share = G.baseSps > 0 ? G.bSps[id] / G.baseSps : 0;
    return `<div class="tip-head">${imgTag(SE.spriteURL(b.sprite))}<span class="tip-title">${esc(b.name)}</span><span class="tip-owned">${have} im Besitz</span></div>
      <div class="tip-cost ${ok ? "" : "no"}">${imgTag(SOUL_URL())}${selling ? "Erlös: " : ""}${fmt(price)}${shop.amount > 1 ? ` <span class="tip-meta">(${Math.min(shop.amount, selling ? have : shop.amount)} Stück)</span>` : ""}</div>
      <p class="tip-flavor">„${esc(b.desc)}“</p>
      <p class="tip-meta">Pro Stück: <b>${fmt(G.each[id], { dec: true })}</b> Seelen pro Sekunde.</p>
      ${have ? `<p class="tip-meta">Alle zusammen: <b>${fmt(G.bSps[id], { dec: true })}</b> pro Sekunde (${fmtPct(share)} deiner Ernte).</p>` : ""}`;
  }

  function tipUpgrade(id) {
    const u = UPG[id];
    const ok = st.souls >= u.cost;
    const need = u.need || (u.needFn ? u.needFn(fmt) : "");
    return `<div class="tip-head">${imgTag(iconURL(u.icon))}<span class="tip-title">${esc(u.name)}</span><span class="tip-owned">${u.icon.badge ? "Stufe " + u.icon.badge : "Verbesserung"}</span></div>
      <div class="tip-cost ${ok ? "" : "no"}">${imgTag(SOUL_URL())}${fmt(u.cost)}</div>
      <p class="tip-desc">${esc(u.desc)}</p>
      ${need ? `<p class="tip-meta">Freigeschaltet durch ${esc(need)}.</p>` : ""}
      ${lastPointer !== "mouse" ? `<p class="tip-hint">${ok ? "Noch einmal tippen zum Kaufen." : "Dafür fehlen dir noch Seelen."}</p>` : ""}`;
  }

  function tipTrophy(id) {
    const a = ACH[id];
    const has = won.has(id);
    if (a.hidden && !has) {
      return `<div class="tip-head">${imgTag(SE.spriteURL("lock"))}<span class="tip-title">???</span><span class="tip-owned">geheim</span></div>
        <p class="tip-flavor">Eine geheime Trophäe. Manche Dinge zeigen sich erst, wenn man sie tut.</p>`;
    }
    return `<div class="tip-head">${imgTag(has ? iconURL(a.icon) : shadowURL(a.icon.sprite))}<span class="tip-title">${esc(a.name)}</span><span class="tip-owned">${has ? "errungen" : "offen"}</span></div>
      <p class="tip-desc">${esc(a.desc(fmt))}</p>
      <p class="tip-meta">Jede Trophäe: +1 % Seelen pro Sekunde.</p>`;
  }

  /* ---------- Händler ---------- */
  const shop = { mode: "buy", amount: 1, sig: "", upSig: "" };

  function visibleBuildings() {
    const out = [];
    let mysteries = 0;
    BUILDINGS.forEach((b, i) => {
      if (i === 0 || st.seen[b.id] || st.buildings[b.id] > 0 || st.runSouls >= b.cost * 0.5) {
        st.seen[b.id] = true;
        out.push({ b, mystery: false });
      } else if (mysteries < 2) {
        mysteries++;
        out.push({ b, mystery: true });
      }
    });
    return out;
  }

  function renderBuildings(force) {
    const list = visibleBuildings();
    const sig = list.map((v) => v.b.id + (v.mystery ? "?" : "")).join(",");
    const box = $("buildingList");
    if (force || sig !== shop.sig) {
      shop.sig = sig;
      box.innerHTML = list
        .map(({ b, mystery }) => `<button type="button" class="bld${mystery ? " is-mystery" : ""}" data-id="${b.id}">
          ${imgTag(mystery ? shadowURL(b.sprite) : SE.spriteURL(b.sprite))}
          <span class="bld-main"><span class="bld-name">${mystery ? "???" : esc(b.name)}</span>
          <span class="bld-cost">${imgTag(SOUL_URL())}<span class="cost-val"></span></span></span>
          <span class="bld-count"></span></button>`)
        .join("");
    }
    for (const row of box.children) {
      const b = BLD[row.dataset.id];
      const have = st.buildings[b.id];
      const mystery = row.classList.contains("is-mystery");
      const selling = shop.mode === "sell" && !mystery;
      const price = selling ? sellValue(b, have, shop.amount) : priceOf(b, have, shop.amount);
      const ok = selling ? have > 0 : st.souls >= price;
      row.querySelector(".cost-val").textContent = fmt(price);
      row.querySelector(".bld-count").textContent = mystery || !have ? "" : have;
      row.classList.toggle("too-expensive", !ok);
      row.classList.toggle("sell-mode", selling);
      row.setAttribute(
        "aria-label",
        mystery
          ? `Unbekanntes Gebäude, Preis ${fmt(price)} Seelen`
          : `${b.name} ${selling ? "verkaufen, Erlös" : "kaufen, Preis"} ${fmt(price)} Seelen, ${have} im Besitz`,
      );
    }
  }

  function availableUpgrades() {
    const seen = new Set(st.upSeen);
    const list = [];
    for (const u of UPGRADES) {
      if (owned.has(u.id)) continue;
      if (seen.has(u.id) || u.unlock(st)) {
        if (!seen.has(u.id)) st.upSeen.push(u.id);
        list.push(u);
      }
    }
    return list.sort((a, b) => a.cost - b.cost);
  }

  function renderUpgrades(force) {
    const list = availableUpgrades();
    const sig = list.map((u) => u.id).join(",");
    const box = $("upgradeGrid");
    if (force || sig !== shop.upSig) {
      shop.upSig = sig;
      box.innerHTML = list
        .map((u) => `<button type="button" class="upg" data-id="${u.id}" style="--frame:${u.icon.frame || "#f8c531"}" aria-label="${esc(u.name)}, ${fmt(u.cost)} Seelen">
          ${imgTag(iconURL(u.icon))}${u.icon.badge ? `<span class="badge">${u.icon.badge}</span>` : ""}</button>`)
        .join("");
      $("upgradeEmpty").hidden = list.length > 0;
      if (Tip.target && !Tip.target.isConnected) Tip.hide();
    }
    for (const el of box.children) el.classList.toggle("can-buy", st.souls >= UPG[el.dataset.id].cost);
  }

  function buyBuilding(id, row) {
    const b = BLD[id];
    if (row && row.classList.contains("is-mystery")) return;
    const have = st.buildings[id];
    if (shop.mode === "sell") {
      const k = Math.min(shop.amount, have);
      if (!k) return deny(row);
      earnBack(sellValue(b, have, k));
      st.buildings[id] -= k;
      st.sold += k;
      Sfx.sell();
    } else {
      const price = priceOf(b, have, shop.amount);
      if (st.souls < price) return deny(row);
      st.souls -= price;
      st.buildings[id] += shop.amount;
      st.seen[id] = true;
      Sfx.buy();
    }
    recalc();
    renderBuildings();
    renderUpgrades();
    renderRealm();
    checkAchievements();
    if (Tip.target === row) Tip.refresh();
  }
  // Verkaufserlös zählt nicht als neu geerntete Seelen
  function earnBack(n) {
    st.souls += n;
  }

  function buyUpgrade(id, el) {
    const u = UPG[id];
    if (!u || owned.has(id)) return;
    if (st.souls < u.cost) return deny(el);
    st.souls -= u.cost;
    st.upgrades.push(id);
    owned.add(id);
    Sfx.buy();
    Tip.hide();
    recalc();
    renderUpgrades(true);
    renderBuildings();
    renderRealm();
    checkAchievements();
  }

  function deny(el) {
    Sfx.deny();
    if (!el) return;
    el.classList.remove("denied");
    void el.offsetWidth;
    el.classList.add("denied");
  }

  /* ---------- Reich ---------- */
  const strips = {};
  let realmFrame = 0;
  function renderRealm() {
    const box = $("realm");
    const have = BUILDINGS.filter((b) => st.buildings[b.id] > 0);
    $("realmEmpty").hidden = have.length > 0;
    $("realmSub").textContent = have.length
      ? `${NF[0].format(G.totalBuildings)} Gebäude ernten ${fmt(G.baseSps, { dec: true })} Seelen pro Sekunde.`
      : "Hier siehst du alles, was für dich Seelen erntet.";
    for (const id of Object.keys(strips)) {
      if (!st.buildings[id]) {
        strips[id].wrap.remove();
        delete strips[id];
      }
    }
    for (const b of have) {
      let s = strips[b.id];
      if (!s) {
        const wrap = document.createElement("div");
        wrap.className = "strip";
        wrap.innerHTML = `<p class="strip-label"></p><div class="strip-view"><canvas></canvas></div>`;
        s = strips[b.id] = { wrap, b, canvas: wrap.querySelector("canvas"), label: wrap.querySelector(".strip-label"), view: wrap.querySelector(".strip-view") };
      }
      box.appendChild(s.wrap); // hält die Reihenfolge
      const n = st.buildings[b.id];
      const share = G.baseSps > 0 ? G.bSps[b.id] / G.baseSps : 0;
      s.label.innerHTML = `<b>${NF[0].format(n)}</b> ${esc(n === 1 ? b.name : b.plural)} <span>· ${fmt(G.bSps[b.id], { dec: true })} pro Sekunde · ${fmtPct(share)}</span>`;
      drawStrip(s);
    }
  }

  function drawStrip(s) {
    const S = 2, H = 26;
    const cw = s.view.clientWidth;
    if (!cw) return;
    const W = Math.ceil(cw / S);
    const c = s.canvas;
    if (c.width !== W) {
      c.width = W;
      c.height = H;
      c.style.width = W * S + "px";
      c.style.height = H * S + "px";
    }
    const x = c.getContext("2d");
    const b = s.b;
    x.fillStyle = b.sky;
    x.fillRect(0, 0, W, H);
    x.fillStyle = "rgba(236,227,210,0.5)";
    for (let i = 0; i < W; i += 23) x.fillRect((i * 7 + b.cost) % W, (i * 3) % 9 + 1, 1, 1);
    x.fillStyle = b.floor;
    x.fillRect(0, H - 5, W, 5);
    x.fillStyle = "rgba(255,255,255,0.12)";
    x.fillRect(0, H - 5, W, 1);
    x.fillStyle = "rgba(0,0,0,0.3)";
    for (let i = 0; i < W; i += 6) x.fillRect(i, H - 3 + (i % 12 ? 0 : 1), 3, 1);
    const n = st.buildings[b.id];
    const step = 13;
    const max = Math.floor((W - 6) / step);
    const sp = spriteCanvas(b.sprite);
    for (let i = 0; i < Math.min(n, max); i++) {
      const jx = ((i * 7919) % 5) - 2, jy = ((i * 104729) % 3);
      const bob = !reduceMotion && (i + realmFrame) % 4 === 0 ? -1 : 0;
      x.drawImage(sp, 3 + i * step + jx, H - 5 - 16 + 2 - jy + bob);
    }
  }

  /* ---------- Irrlichter ---------- */
  const wisps = new Set();
  let nextWispAt = 0;
  function scheduleWisp(first) {
    const secs = first ? rand(50, 110) : rand(120, 300) * G.wispFreq;
    nextWispAt = performance.now() + secs * 1000;
  }

  function spawnWisp() {
    const layer = $("wispLayer");
    const size = 72;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "wisp";
    btn.setAttribute("aria-label", "Irrlicht fangen");
    btn.innerHTML = imgTag(SE.spriteURL("wisp"));
    btn.style.left = Math.round(rand(16, Math.max(20, window.innerWidth - size - 16))) + "px";
    btn.style.top = Math.round(rand(70, Math.max(80, window.innerHeight - size - 110))) + "px";
    btn.style.animationDelay = `0s, ${-rand(0, 1.6).toFixed(2)}s`;
    const w = { el: btn };
    w.timer = setTimeout(() => removeWisp(w), 13000 * G.wispDur);
    btn.addEventListener("click", () => catchWisp(w));
    layer.appendChild(btn);
    wisps.add(w);
    Sfx.wisp();
    if (!st.hints.wisp) {
      st.hints.wisp = true;
      toast("Ein Irrlicht!", "Fang es, bevor es verlischt. Irrlichter bringen Seelen oder einen <b>Blutrausch</b>.", { sprite: "wisp" });
    }
  }

  function removeWisp(w) {
    if (!wisps.has(w)) return;
    wisps.delete(w);
    clearTimeout(w.timer);
    w.el.classList.add("leaving");
    setTimeout(() => w.el.remove(), 650);
  }

  function catchWisp(w) {
    if (!wisps.has(w)) return;
    removeWisp(w);
    st.wispsClicked++;
    const dur = G.wispDur * G.buffDur;
    const r = Math.random();
    const rect = w.el.getBoundingClientRect();
    if (r < 0.5) {
      const gain = Math.min(st.souls * 0.15, G.baseSps * 900) + 13;
      earn(gain);
      toast("Seelenregen", `Das Irrlicht zerplatzt: <b>+${fmt(gain)}</b> Seelen.`, { sprite: "soul" });
      bigFloater("+" + fmt(gain), rect);
    } else if (r < 0.88) {
      addBuff("frenzy", 77 * dur);
      toast("Blutrausch", `${Math.round(77 * dur)} Sekunden lang <b>siebenfache</b> Seelen pro Sekunde.`, BUFFS.frenzy.icon);
    } else {
      addBuff("claw", 13 * dur);
      toast("Dämonenklaue", `${Math.round(13 * dur)} Sekunden lang ernten Klicks das <b>777-Fache</b>.`, BUFFS.claw.icon);
    }
    Sfx.catch();
    checkAchievements();
  }

  function bigFloater(text, rect) {
    const f = document.createElement("span");
    f.className = "floater big";
    f.textContent = text;
    f.style.left = rect.left + rect.width / 2 + "px";
    f.style.top = rect.top + "px";
    f.style.position = "fixed";
    f.style.zIndex = 45;
    f.addEventListener("animationend", () => f.remove());
    document.body.appendChild(f);
  }

  /* ---------- Effekt-Leiste ---------- */
  let buffSig = "";
  function renderBuffs() {
    const box = $("buffs");
    const now = Date.now();
    const ids = Object.keys(st.buffs).filter((id) => BUFFS[id]);
    const sig = ids.join(",");
    if (sig !== buffSig) {
      buffSig = sig;
      box.innerHTML = ids
        .map((id) => `<div class="buff" style="--buff:${BUFFS[id].color}" data-id="${id}">${imgTag(iconURL(BUFFS[id].icon))}
          <span>${esc(BUFFS[id].name)} <b>${BUFFS[id].text}</b> <span class="buff-time"></span></span></div>`)
        .join("");
    }
    for (const el of box.children) {
      const b = st.buffs[el.dataset.id];
      if (b) el.querySelector(".buff-time").textContent = Math.ceil((b.until - now) / 1000) + "s";
    }
  }

  /* ---------- Schicksalsrad ---------- */
  const Wheel = {
    R: 78,
    angle: 0,
    spinning: false,
    bounceUntil: 0,
    segs: [],

    init() {
      const total = WHEEL.reduce((s, w) => s + w.weight, 0);
      let a = 0;
      this.segs = WHEEL.map((w) => {
        const a0 = a;
        a += (w.weight / total) * TWO_PI;
        const hex = w.color.replace("#", "");
        const rgb = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
        const lite = rgb.map((v) => Math.min(255, Math.round(v * 1.35 + 14)));
        return { w, a0, a1: a, rgb, lite };
      });
      this.W = this.R * 2 + 6;
      this.H = this.R * 2 + 12;
      this.cx = this.W / 2;
      this.cy = this.H - this.R - 3;
      this.canvas = $("wheelCanvas");
      this.canvas.width = this.W;
      this.canvas.height = this.H;
      this.ctx = this.canvas.getContext("2d");
      this.img = this.ctx.createImageData(this.W, this.H);
      this.angle = -(this.segs[0].a0 + this.segs[0].a1) / 2; // erstes Feld oben
    },

    layout() {
      const avail = $("wheelStage").clientWidth;
      if (!avail) return;
      const byWidth = Math.floor(avail / this.W);
      const byHeight = Math.floor(($("panels").clientHeight - 240) / this.H);
      const S = clamp(window.innerWidth < 720 ? byWidth : Math.min(byWidth, byHeight), 1, 3);
      this.canvas.style.width = this.W * S + "px";
      this.canvas.style.height = this.H * S + "px";
    },

    segAt(psi) {
      for (let i = 0; i < this.segs.length; i++) if (psi < this.segs[i].a1) return i;
      return this.segs.length - 1;
    },
    segAtPointer() {
      return this.segAt(mod(-this.angle, TWO_PI));
    },

    draw(t = performance.now()) {
      const { W, H, R, cx, cy, segs } = this;
      const d = this.img.data;
      d.fill(0);
      const th = this.angle;
      const lights = this.spinning ? Math.floor(t / 70) % 3 : Math.floor(t / 500) % 2;
      const put = (i, r, g, b) => { d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255; };
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
          const r = Math.sqrt(dx * dx + dy * dy);
          if (r > R + 0.5) continue;
          const i = (y * W + x) * 4;
          const a = Math.atan2(dx, -dy);
          if (r > R - 0.8) { put(i, 10, 7, 16); continue; }
          if (r > R - 6) {
            // Rand mit Lichtern
            const k = mod(a, TWO_PI) / (TWO_PI / 24);
            const near = Math.abs(k - Math.round(k)) * r * (TWO_PI / 24) < 1.3 && r > R - 4.6 && r < R - 1.6;
            if (near) {
              const on = this.spinning ? Math.round(k) % 3 === lights : Math.round(k) % 2 === lights;
              on ? put(i, 255, 242, 168) : put(i, 168, 116, 26);
            } else if (r > R - 1.8 || r < R - 5.2) put(i, 10, 7, 16);
            else put(i, 74, 46, 28);
            continue;
          }
          if (r < 10) {
            if (r > 9) put(i, 10, 7, 16);
            else put(i, 26, 19, 32);
            continue;
          }
          const psi = mod(a - th, TWO_PI);
          const s = segs[this.segAt(psi)];
          const edge = Math.min(psi - s.a0, s.a1 - psi) * r;
          if (edge < 0.75) { put(i, 10, 7, 16); continue; }
          const col = r > R - 9 && (x + y) % 2 === 0 ? s.rgb.map((v) => v * 0.7) : r < 22 && (x + y) % 2 === 0 ? s.rgb.map((v) => v * 0.8) : edge < 2 ? s.lite : s.rgb;
          put(i, col[0], col[1], col[2]);
        }
      }
      this.ctx.putImageData(this.img, 0, 0);

      for (const s of segs) {
        const mid = (s.a0 + s.a1) / 2 + th;
        const rr = R - 22;
        const ix = cx + Math.sin(mid) * rr - 8, iy = cy - Math.cos(mid) * rr - 8;
        this.ctx.drawImage(spriteCanvas(s.w.sprite, s.w.pal, s.w.pal ? "wheel-" + s.w.id : ""), Math.round(ix), Math.round(iy));
      }
      this.ctx.drawImage(spriteCanvas("soul"), Math.round(cx - 4), Math.round(cy - 5));
      const bounce = t < this.bounceUntil ? -2 : 0;
      this.ctx.drawImage(spriteCanvas("pointer"), Math.round(cx - 5), cy - R - 6 + bounce);
    },

    spin(index, done) {
      const s = this.segs[index];
      const margin = Math.min(0.2 * (s.a1 - s.a0), 0.06);
      const psi = rand(s.a0 + margin, s.a1 - margin);
      const start = this.angle;
      const turns = reduceMotion ? 1 : 6;
      const end = start + turns * TWO_PI + mod(-psi - start, TWO_PI);
      const dur = reduceMotion ? 1600 : 5600;
      const t0 = performance.now();
      let last = this.segAtPointer();
      this.spinning = true;
      const step = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        this.angle = start + (end - start) * (1 - Math.pow(1 - p, 4));
        const cur = this.segAtPointer();
        if (cur !== last) {
          last = cur;
          this.bounceUntil = now + 60;
          Sfx.tick();
        }
        this.draw(now);
        if (p < 1) requestAnimationFrame(step);
        else {
          this.spinning = false;
          this.angle = mod(this.angle, TWO_PI);
          this.draw(now);
          done();
        }
      };
      requestAnimationFrame(step);
    },
  };

  const canSpin = () => st.wheel.last !== dayKey() && !Wheel.spinning && !st.wheel.pending;

  function rollWheel() {
    const total = WHEEL.reduce((s, w) => s + w.weight, 0);
    let r = Math.random() * total;
    for (let i = 0; i < WHEEL.length; i++) {
      r -= WHEEL[i].weight;
      if (r < 0) return i;
    }
    return 0;
  }

  function wheelPrize(seg) {
    const streak = Math.max(1, st.wheel.streak);
    const mult = (1 + 0.1 * Math.min(streak - 1, 6)) * G.wheelMult;
    const souls = (secs, minClicks, min) => Math.max(G.baseSps * secs, G.clickNoBuff * minClicks, min) * mult;
    switch (seg.id) {
      case "bag": return { id: seg.id, amount: souls(900, 150, 150) };
      case "chest": return { id: seg.id, amount: souls(3600, 600, 600) };
      case "hoard": return { id: seg.id, amount: souls(14400, 2500, 2500) };
      case "coffin": {
        const have = BUILDINGS.filter((b) => st.buildings[b.id] > 0);
        return { id: seg.id, building: (have.length ? have[have.length - 1] : BUILDINGS[0]).id, count: 3 };
      }
      case "relic": {
        const missing = RELICS.filter((r) => !st.relics.includes(r.id));
        if (missing.length) return { id: seg.id, relic: pick(missing).id };
        return { id: seg.id, amount: souls(14400, 2500, 2500) * 2 };
      }
      default: return { id: seg.id };
    }
  }

  function spinWheel() {
    if (!canSpin()) return;
    const index = rollWheel();
    const today = dayKey();
    st.wheel.streak = st.wheel.last === yesterdayKey() ? st.wheel.streak + 1 : 1;
    st.wheel.bestStreak = Math.max(st.wheel.bestStreak, st.wheel.streak);
    st.wheel.last = today;
    st.wheel.spins++;
    st.wheel.pending = wheelPrize(WHEEL[index]);
    save();
    $("wheelResult").hidden = true;
    renderWheelStatus();
    Wheel.spin(index, () => {
      applyWheelPrize(st.wheel.pending, false);
      renderWheelStatus();
    });
  }

  function applyWheelPrize(p, quiet) {
    if (!p) return;
    const seg = WHEEL.find((w) => w.id === p.id) || WHEEL[0];
    let text;
    let icon = { sprite: seg.sprite, pal: seg.pal, key: seg.pal ? "wheel-" + seg.id : "" };
    if (p.relic) {
      const r = RELIC[p.relic];
      if (!st.relics.includes(r.id)) st.relics.push(r.id);
      text = `Relikt gefunden: <b>${esc(r.name)}</b>. ${esc(r.desc)}`;
      icon = { sprite: r.sprite };
    } else if (p.amount) {
      earn(p.amount);
      if (p.id === "hoard") st.wheel.hoards++;
      text = p.id === "relic"
        ? `Du besitzt schon alle Relikte. Dafür gibt es <b>+${fmt(p.amount)}</b> Seelen.`
        : `<b>+${fmt(p.amount)}</b> Seelen.`;
    } else if (p.building) {
      const b = BLD[p.building];
      st.buildings[b.id] += p.count;
      st.seen[b.id] = true;
      text = `<b>+${p.count} ${esc(b.plural)}</b> ziehen gratis in dein Reich.`;
      icon = { sprite: b.sprite };
    } else if (p.id === "bloodmoon") {
      addBuff("bloodmoon", 300);
      text = "5 Minuten lang <b>fünffache</b> Seelen pro Sekunde.";
    } else if (p.id === "fist") {
      addBuff("fist", 60);
      text = "60 Sekunden lang ernten Klicks das <b>77-Fache</b>.";
    } else if (p.id === "swarm") {
      [0, 700, 1400].forEach((ms) => setTimeout(spawnWisp, ms));
      text = "<b>Drei Irrlichter</b> schwirren umher. Fang sie!";
    }
    st.wheel.pending = null;
    st.wheel.lastResult = { id: seg.id, name: seg.name, text, icon, date: dayKey() };
    recalc();
    renderBuildings();
    renderUpgrades();
    renderRealm();
    renderRelics();
    renderWheelResult();
    checkAchievements();
    save();
    if (!quiet) Sfx.win();
    toast(quiet ? "Schicksalsrad (letzter Dreh)" : "Schicksalsrad: " + seg.name, text, icon);
  }

  function renderWheelLegend() {
    const total = WHEEL.reduce((s, w) => s + w.weight, 0);
    $("wheelLegend").innerHTML = WHEEL.map((w) => `<li>${imgTag(iconURL({ sprite: w.sprite, pal: w.pal, key: w.pal ? "wheel-" + w.id : "" }))}
      <span><span class="name">${esc(w.name)}</span><span class="what">${esc(w.desc)}</span></span>
      <span class="chance" style="background:${w.color}">${Math.round((w.weight / total) * 100)} %</span></li>`).join("");
  }

  function renderWheelResult() {
    const r = st.wheel.lastResult;
    const box = $("wheelResult");
    if (!r || r.date !== dayKey()) {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    box.innerHTML = `${imgTag(iconURL(r.icon))}<div><strong>Heute gewonnen: ${esc(r.name)}</strong>${r.text}</div>`;
  }

  function renderWheelStatus() {
    const btn = $("spinBtn");
    const today = st.wheel.last === dayKey();
    const ready = canSpin();
    btn.disabled = !ready;
    btn.textContent = Wheel.spinning ? "Es dreht sich …" : ready ? "Drehen" : "Morgen wieder";
    $("wheelStatus").innerHTML = Wheel.spinning
      ? "Das Rad entscheidet …"
      : ready
        ? "Das Rad wartet auf dich."
        : `Nächster Dreh in <b>${fmtClock(secondsToMidnight())}</b>`;
    const alive = today || st.wheel.last === yesterdayKey();
    const streak = alive ? st.wheel.streak : 0;
    const next = ready ? (st.wheel.last === yesterdayKey() ? st.wheel.streak + 1 : 1) : streak;
    const bonus = Math.round(10 * Math.min(Math.max(next, 1) - 1, 6));
    $("wheelStreak").innerHTML = `Serie: <b>${streak} ${streak === 1 ? "Tag" : "Tage"}</b>. ${
      bonus ? `Seelen vom Rad +${bonus} %.` : "Jeder Tag in Folge bringt +10 % Seelen vom Rad, bis +60 %."
    }`;
    $("wheelDot").hidden = !ready;
  }

  /* ---------- Trophäen ---------- */
  function renderTrophies() {
    const box = $("trophyGrid");
    if (!box.children.length) {
      box.innerHTML = ACHIEVEMENTS.map((a) => `<button type="button" class="trophy" data-id="${a.id}"></button>`).join("");
    }
    for (const el of box.children) {
      const a = ACH[el.dataset.id];
      const has = won.has(a.id);
      if (el.dataset.state === String(has)) continue;
      el.dataset.state = String(has);
      el.classList.toggle("is-won", has);
      const src = has ? iconURL(a.icon) : a.hidden ? SE.spriteURL("lock") : shadowURL(a.icon.sprite);
      el.innerHTML = imgTag(src);
      el.setAttribute("aria-label", has || !a.hidden ? `${a.name}${has ? ", errungen" : ", offen"}` : "Geheime Trophäe");
    }
    const n = st.achievements.length;
    $("trophySub").innerHTML = `${n} von ${ACHIEVEMENTS.length} errungen. <span class="trophy-bonus">Bonus: +${n} % Seelen pro Sekunde.</span>`;
  }

  function checkAchievements() {
    let changed = false;
    for (const a of ACHIEVEMENTS) {
      if (won.has(a.id)) continue;
      let ok = false;
      try {
        ok = a.check(st, G);
      } catch {
        ok = false;
      }
      if (!ok) continue;
      won.add(a.id);
      st.achievements.push(a.id);
      changed = true;
      toast("Trophäe errungen", `<b>${esc(a.name)}</b>: ${esc(a.desc(fmt))}`, a.icon);
    }
    if (changed) {
      Sfx.ach();
      recalc();
      renderTrophies();
    }
  }

  /* ---------- Grimoire ---------- */
  function renderStats() {
    const rows = [
      ["Seelen im Besitz", fmt(st.souls, { long: true })],
      ["Geerntet in diesem Leben", fmt(st.runSouls, { long: true })],
      ["Geerntet insgesamt", fmt(st.allTimeSouls, { long: true })],
      ["Seelen pro Sekunde", fmt(G.baseSps, { dec: true })],
      ["Seelen pro Klick", fmt(G.clickNoBuff, { dec: true })],
      ["Klicks auf den Schädel", NF[0].format(st.clicks)],
      ["Durch Klicks geerntet", fmt(st.clickSouls)],
      ["Gebäude", NF[0].format(G.totalBuildings)],
      ["Verbesserungen", `${st.upgrades.length} von ${UPGRADES.length}`],
      ["Trophäen", `${st.achievements.length} von ${ACHIEVEMENTS.length}`],
      ["Irrlichter gefangen", NF[0].format(st.wispsClicked)],
      ["Am Schicksalsrad gedreht", `${st.wheel.spins}-mal`],
      ["Längste Serie am Rad", `${st.wheel.bestStreak} ${st.wheel.bestStreak === 1 ? "Tag" : "Tage"}`],
      ["Rituale", NF[0].format(st.rituals)],
      ["Schattenessenz", `${NF[0].format(st.essence)} (+${st.essence} %)`],
      ["Gesamtbonus auf Seelen pro Sekunde", "×" + NF[2].format(G.globalMult)],
      ["Spielzeit", fmtDuration(st.playTime)],
      ["Spiel begonnen", fmtDate(st.started)],
    ];
    $("stats").innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
  }

  function renderRelics() {
    $("relicGrid").innerHTML = RELICS.map((r) => {
      const has = st.relics.includes(r.id);
      return `<div class="relic px-inset${has ? "" : " is-missing"}">${imgTag(has ? SE.spriteURL(r.sprite) : shadowURL(r.sprite))}
        <div><strong>${has ? esc(r.name) : "Unbekanntes Relikt"}</strong><span>${has ? esc(r.desc) : "Noch nicht gefunden."}</span></div></div>`;
    }).join("");
  }

  /* ---------- Ritual ---------- */
  function renderRitual() {
    const target = essenceFor(st.allTimeSouls);
    const gain = Math.max(0, target - st.essence);
    const nextAt = Math.pow(Math.max(target, st.essence) + 1, 3) * 1e12;
    const sig = [st.essence, gain, target].join("|");
    const box = $("ritual");
    if (box.dataset.sig === sig && box.children.length) {
      const left = box.querySelector(".ritual-left");
      if (left) left.textContent = fmt(Math.max(0, nextAt - st.allTimeSouls));
      return;
    }
    box.dataset.sig = sig;
    box.innerHTML = `
      <div class="essence px-inset">${imgTag(SE.spriteURL("orb"))}
        <div><strong>${NF[0].format(st.essence)} Schattenessenz</strong>
        <span>Jede Essenz gibt dir für immer +1 % Seelen pro Sekunde.</span></div></div>
      <p>Das Ritual nimmt dir Seelen, Gebäude und Verbesserungen. Trophäen, Relikte, Schattenessenz und deine Serie am Schicksalsrad bleiben.</p>
      <p class="ritual-gain">Ein Ritual jetzt bringt dir <b>+${NF[0].format(gain)} Schattenessenz</b>.</p>
      <p>Die nächste Essenz gibt es bei ${fmt(nextAt)} geernteten Seelen insgesamt (es fehlen noch <span class="ritual-left">${fmt(Math.max(0, nextAt - st.allTimeSouls))}</span>)</p>
      <div><button class="px-btn btn-danger" id="ritualBtn" type="button" ${gain < 1 ? "disabled" : ""}>Ritual vollziehen</button></div>`;
    $("ritualBtn").addEventListener("click", confirmRitual);
  }

  function confirmRitual() {
    const gain = essenceFor(st.allTimeSouls) - st.essence;
    if (gain < 1) return;
    openModal({
      title: "Ritual der Wiedergeburt",
      body: `<p>Dein Reich wird geopfert: alle Seelen, Gebäude und Verbesserungen sind danach fort.</p>
        <p>Du erhältst <b>+${NF[0].format(gain)} Schattenessenz</b> und damit dauerhaft +${NF[0].format(st.essence + gain)} % Seelen pro Sekunde.</p>`,
      actions: [
        { label: "Abbrechen" },
        { label: "Opfern", cls: "btn-danger", run: doRitual },
      ],
    });
  }

  function doRitual() {
    const keep = {
      allTimeSouls: st.allTimeSouls, clicks: st.clicks, clickSouls: st.clickSouls, achievements: st.achievements,
      wispsClicked: st.wispsClicked, relics: st.relics, essence: essenceFor(st.allTimeSouls), rituals: st.rituals + 1,
      sold: st.sold, wheel: st.wheel, settings: st.settings, hints: st.hints, started: st.started, playTime: st.playTime,
    };
    st = { ...freshState(), ...keep, runStarted: Date.now() };
    syncSets();
    recalc();
    renderAll(true);
    Sfx.ritual();
    toast("Wiedergeburt", `Du kehrst stärker zurück: <b>${st.essence} Schattenessenz</b>.`, { sprite: "orb" });
    checkAchievements();
    save();
  }

  /* ---------- Chronik ---------- */
  const Ticker = {
    last: -1,
    timer: 0,
    next() {
      const pool = NEWS.map((n, i) => [n, i]).filter(([n, i]) => i !== this.last && (!n.if || n.if(st, G)));
      if (!pool.length) return;
      const special = pool.filter(([n]) => n.if);
      const [n, i] = special.length && Math.random() < 0.6 ? pick(special) : pick(pool);
      this.last = i;
      const el = $("tickerText");
      clearInterval(this.timer);
      if (reduceMotion) {
        el.textContent = n.t;
        return;
      }
      let k = 0;
      el.textContent = "";
      this.timer = setInterval(() => {
        k += 2;
        el.textContent = n.t.slice(0, k);
        if (k >= n.t.length) clearInterval(this.timer);
      }, 28);
    },
  };

  /* ---------- Reiter ---------- */
  const mqShopTab = window.matchMedia("(max-width: 1099px)");
  let activeTab = mqShopTab.matches ? "shop" : "realm";

  function setTab(id) {
    if (id === "shop" && !mqShopTab.matches) id = "realm";
    if (id !== activeTab) $("panels").scrollTop = 0;
    activeTab = id;
    for (const tab of document.querySelectorAll(".tab")) {
      const on = tab.dataset.tab === id;
      tab.setAttribute("aria-selected", String(on));
      tab.tabIndex = on ? 0 : -1;
    }
    for (const p of document.querySelectorAll("#panels > .panel")) p.hidden = p.id !== "panel-" + id;
    $("panel-shop").hidden = mqShopTab.matches && id !== "shop";
    Tip.hide();
    if (id === "wheel") {
      Wheel.layout();
      Wheel.draw();
      renderWheelStatus();
    }
    if (id === "realm") renderRealm();
    if (id === "grimoire") { renderStats(); renderRelics(); }
    if (id === "ritual") renderRitual();
    if (id === "trophies") renderTrophies();
  }

  function placeShop() {
    const shopEl = $("panel-shop");
    if (mqShopTab.matches) {
      if (shopEl.parentElement !== $("panels")) {
        $("panels").prepend(shopEl);
        shopEl.classList.add("is-embedded");
        shopEl.classList.remove("px-box");
      }
    } else if (shopEl.parentElement !== $("app")) {
      $("app").appendChild(shopEl);
      shopEl.classList.remove("is-embedded");
      shopEl.classList.add("px-box");
    }
    setTab(activeTab);
  }

  /* ---------- Spielstand übertragen ---------- */
  function encodeSave() {
    const bytes = new TextEncoder().encode(JSON.stringify(st));
    let bin = "";
    bytes.forEach((b) => (bin += String.fromCharCode(b)));
    return btoa(bin);
  }
  function decodeSave(text) {
    const bin = atob(text.trim());
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  function exportSave() {
    st.lastSave = Date.now();
    const code = encodeSave();
    openModal({
      title: "Spielstand exportieren",
      body: `<p>Kopier diesen Code und heb ihn gut auf. Mit „Spielstand importieren“ holst du ihn zurück.</p>
        <textarea id="exportText" readonly>${code}</textarea>`,
      actions: [
        { label: "Schließen" },
        {
          label: "Kopieren",
          cls: "btn-gold",
          run: () => {
            const ta = $("exportText");
            const fallback = () => { ta.focus(); ta.select(); setNote("Code markiert. Kopier ihn mit Strg+C."); };
            try {
              navigator.clipboard.writeText(code).then(() => setNote("Code kopiert."), fallback);
            } catch {
              fallback();
            }
          },
        },
      ],
    });
  }

  function importSave() {
    openModal({
      title: "Spielstand importieren",
      body: `<p>Füg deinen exportierten Code ein. Dein aktueller Spielstand wird dabei ersetzt.</p>
        <textarea id="importText" placeholder="Code hier einfügen"></textarea><p id="importError" class="tip-hint"></p>`,
      actions: [
        { label: "Abbrechen" },
        {
          label: "Laden",
          cls: "btn-gold",
          run: () => {
            try {
              const data = decodeSave($("importText").value);
              if (!data || typeof data !== "object" || !data.buildings) throw new Error();
              st = mergeState(data);
              syncSets();
              recalc();
              renderAll(true);
              save();
              toast("Spielstand geladen", `Willkommen zurück. Du hast <b>${fmt(st.souls)}</b> Seelen.`);
              return true;
            } catch {
              $("importError").textContent = "Dieser Code ist ungültig. Prüf, ob du ihn vollständig eingefügt hast.";
              return false;
            }
          },
        },
      ],
    });
  }

  function confirmReset() {
    openModal({
      title: "Alles vernichten?",
      body: "<p>Der komplette Spielstand wird gelöscht, auch Trophäen, Relikte und Schattenessenz. Das lässt sich nicht rückgängig machen.</p>",
      actions: [
        { label: "Behalten" },
        {
          label: "Löschen",
          cls: "btn-danger",
          run: () => {
            const settings = st.settings;
            st = freshState();
            st.settings = settings;
            syncSets();
            recalc();
            renderAll(true);
            save();
            toast("Neubeginn", "Alles ist vernichtet. Der Schädel wartet.");
          },
        },
      ],
    });
  }

  /* ---------- Darstellung ---------- */
  let shownSouls = -1, shownSps = -1;
  function updateCounters() {
    const s = Math.floor(st.souls);
    if (s !== shownSouls) {
      shownSouls = s;
      const long = s >= 1e6;
      const text = long ? fmt(s, { long: true }) : fmt(s);
      const [num, ...unit] = text.split(" ");
      $("souls").textContent = long ? num : text;
      $("soulsUnit").textContent = long ? unit.join(" ") + " Seelen" : s === 1 ? "Seele" : "Seelen";
    }
    if (G.sps !== shownSps) {
      shownSps = G.sps;
      $("sps").textContent = fmt(G.sps, { dec: true });
    }
  }

  function renderAll(force) {
    shownSouls = shownSps = -1;
    shop.sig = shop.upSig = "";
    buffSig = "";
    for (const id of Object.keys(strips)) {
      strips[id].wrap.remove();
      delete strips[id];
    }
    $("trophyGrid").innerHTML = "";
    renderBuildings(force);
    renderUpgrades(force);
    renderRealm();
    renderBuffs();
    renderTrophies();
    renderRelics();
    renderStats();
    $("ritual").dataset.sig = "";
    renderRitual();
    renderWheelStatus();
    renderWheelResult();
    $("optSound").checked = st.settings.sound;
    $("optParticles").checked = st.settings.particles;
    updateCounters();
  }

  /* ---------- Spielschleife ---------- */
  let lastTick = Date.now();
  let slowAt = 0, secAt = 0, saveAt = 0, realmAt = 0;

  function tick() {
    const now = Date.now();
    const dt = Math.max(0, (now - lastTick) / 1000);
    lastTick = now;
    st.playTime += Math.min(dt, 5);
    let expired = false;
    for (const [id, b] of Object.entries(st.buffs)) {
      if (!b || b.until <= now) {
        delete st.buffs[id];
        expired = true;
      }
    }
    if (expired) {
      recalc();
      renderBuffs();
    }
    if (G.sps > 0) earn(G.sps * dt);
  }

  function frame() {
    const t = performance.now();
    tick();
    Scene.update(1 / 60, t);
    Scene.render(t);
    updateCounters();

    if (t > slowAt) {
      slowAt = t + 250;
      renderBuildings();
      renderUpgrades();
      renderBuffs();
      if (Tip.target) Tip.refresh();
      if (!wisps.size && t > nextWispAt) {
        spawnWisp();
        scheduleWisp(false);
      }
    }
    if (t > secAt) {
      secAt = t + 1000;
      checkAchievements();
      renderWheelStatus();
      if (activeTab === "grimoire") renderStats();
      if (activeTab === "ritual") renderRitual();
      if (activeTab === "wheel" && !Wheel.spinning) Wheel.draw(t);
      document.title = `${fmt(st.souls)} Seelen · Seelenernte`;
    }
    if (t > realmAt && activeTab === "realm") {
      realmAt = t + 700;
      realmFrame++;
      renderRealm();
    }
    if (t > saveAt) {
      if (saveAt) save();
      saveAt = t + 20000;
    }
    requestAnimationFrame(frame);
  }

  /* ---------- Ereignisse ---------- */
  function bindEvents() {
    document.addEventListener("pointerdown", (e) => {
      lastPointer = e.pointerType || "mouse";
      if (lastPointer !== "mouse" && Tip.target && !e.target.closest(".upg, .trophy")) Tip.hide();
    }, true);

    const skull = $("skullBtn");
    skull.addEventListener("click", clickSkull);
    skull.addEventListener("pointerenter", () => (Scene.hover = true));
    skull.addEventListener("pointerleave", () => (Scene.hover = false));

    // Händler
    for (const b of document.querySelectorAll(".seg-btn")) {
      b.addEventListener("click", () => {
        if (b.dataset.mode) shop.mode = b.dataset.mode;
        if (b.dataset.amount) shop.amount = Number(b.dataset.amount);
        for (const o of document.querySelectorAll(".seg-btn")) {
          o.setAttribute("aria-pressed", String(o.dataset.mode ? o.dataset.mode === shop.mode : Number(o.dataset.amount) === shop.amount));
        }
        renderBuildings();
      });
    }
    $("buildingList").addEventListener("click", (e) => {
      const row = e.target.closest(".bld");
      if (row) buyBuilding(row.dataset.id, row);
    });
    $("upgradeGrid").addEventListener("click", (e) => {
      const el = e.target.closest(".upg");
      if (!el) return;
      if (lastPointer !== "mouse" && Tip.target !== el) {
        Tip.show(el, () => tipUpgrade(el.dataset.id));
        return;
      }
      buyUpgrade(el.dataset.id, el);
    });
    $("trophyGrid").addEventListener("click", (e) => {
      const el = e.target.closest(".trophy");
      if (el && lastPointer !== "mouse") Tip.show(el, () => tipTrophy(el.dataset.id));
    });

    const tipFor = (el) => {
      if (el.matches(".bld")) return () => tipBuilding(el.dataset.id);
      if (el.matches(".upg")) return () => tipUpgrade(el.dataset.id);
      if (el.matches(".trophy")) return () => tipTrophy(el.dataset.id);
      return null;
    };
    document.addEventListener("pointerover", (e) => {
      if (e.pointerType !== "mouse") return;
      const el = e.target.closest(".bld, .upg, .trophy");
      if (el && el !== Tip.target) Tip.show(el, tipFor(el));
    });
    document.addEventListener("pointerout", (e) => {
      if (e.pointerType !== "mouse" || !Tip.target) return;
      const to = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(".bld, .upg, .trophy");
      if (to !== Tip.target) Tip.hide();
    });
    document.addEventListener("focusin", (e) => {
      const el = e.target.closest && e.target.closest(".bld, .upg, .trophy");
      if (el && el.matches(":focus-visible")) Tip.show(el, tipFor(el));
    });
    document.addEventListener("focusout", (e) => {
      if (Tip.target && e.target === Tip.target && lastPointer === "keyboard") Tip.hide();
    });
    document.addEventListener("keydown", (e) => {
      lastPointer = "keyboard";
      if (e.key === "Escape") {
        if (!$("modalBack").hidden) closeModal(true);
        else Tip.hide();
      }
    });

    // Reiter, mit Pfeiltasten bedienbar
    const tabs = [...document.querySelectorAll(".tab")];
    for (const tab of tabs) {
      tab.addEventListener("click", () => setTab(tab.dataset.tab));
      tab.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        const visible = tabs.filter((t) => t.offsetParent !== null);
        const i = visible.indexOf(tab);
        const next = visible[mod(i + (e.key === "ArrowRight" ? 1 : -1), visible.length)];
        setTab(next.dataset.tab);
        next.focus();
      });
    }

    $("spinBtn").addEventListener("click", spinWheel);
    $("optSound").addEventListener("change", (e) => { st.settings.sound = e.target.checked; save(); });
    $("optParticles").addEventListener("change", (e) => {
      st.settings.particles = e.target.checked;
      if (!st.settings.particles) { Scene.souls = []; Scene.parts = []; }
      save();
    });
    $("btnSave").addEventListener("click", () => save(true));
    $("btnExport").addEventListener("click", exportSave);
    $("btnImport").addEventListener("click", importSave);
    $("btnReset").addEventListener("click", confirmReset);
    $("modalBack").addEventListener("click", (e) => { if (e.target === $("modalBack")) closeModal(true); });

    const onResize = () => {
      Scene.resize();
      if (activeTab === "wheel") Wheel.layout();
      if (activeTab === "realm") renderRealm();
      Tip.hide();
    };
    if (window.ResizeObserver) new ResizeObserver(onResize).observe($("altar"));
    window.addEventListener("resize", onResize);
    mqShopTab.addEventListener("change", () => {
      if (mqShopTab.matches && activeTab === "realm") activeTab = "shop";
      placeShop();
      onResize();
    });

    document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });
    window.addEventListener("pagehide", () => save());
    // im Hintergrund läuft die Ernte weiter
    setInterval(() => { if (document.hidden) tick(); }, 1000);
  }

  /* ---------- Start ---------- */
  let started = false;
  function start(data) {
    if (started) return;
    started = true;
    let loaded = null;
    if (data && typeof data.save === "string") {
      try { loaded = JSON.parse(data.save); } catch { loaded = null; }
    }
    loaded = loaded || loadLocal();
    st = mergeState(loaded);
    syncSets();
    recalc();

    document.body.style.setProperty("--brick", `url(${SE.spriteURL("brick")})`);
    $("logoSoul").src = SOUL_URL();
    Scene.init();
    Wheel.init();
    renderWheelLegend();
    bindEvents();
    placeShop();
    renderAll(true);
    Scene.resize();
    Wheel.draw();
    Ticker.next();
    setInterval(() => Ticker.next(), 11000);
    scheduleWisp(st.wispsClicked === 0);

    // Ernte während der Abwesenheit
    const away = (Date.now() - st.lastSave) / 1000;
    if (loaded && away > 60 && G.baseSps > 0) {
      const secs = Math.min(away, 7 * 86400);
      const gain = G.baseSps * secs * G.offline;
      earn(gain);
      openModal({
        title: "Willkommen zurück",
        body: `<p>Du warst ${fmtDuration(away)} fort. Deine Diener haben in der Zeit weitergeerntet${G.offline < 1 ? " (zur Hälfte, ohne dich arbeiten sie langsamer)" : ""}.</p>
          <p><b>+${fmt(gain, { long: true })}</b> Seelen</p>`,
        actions: [{ label: "Weiter ernten", cls: "btn-gold" }],
      });
    }
    // ein Dreh, der beim letzten Mal nicht fertig wurde
    if (st.wheel.pending) applyWheelPrize(st.wheel.pending, true);

    lastTick = Date.now();
    checkAchievements();
    save();
    requestAnimationFrame(frame);
  }

  const hot = window.claude && window.claude.hot;
  try {
    if (hot && typeof hot.snapshot === "function") hot.snapshot(() => ({ save: JSON.stringify(st) }));
  } catch {
    /* Vorschau ohne Hot-Reload */
  }
  if (hot && typeof hot.ready === "function") hot.ready(start);
  else start((hot && hot.data) || {});
})();
