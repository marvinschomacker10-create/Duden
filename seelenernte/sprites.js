/* Seelenernte – Pixelgrafiken
 * Jede Grafik ist ein Raster aus Zeichen; jedes Zeichen steht für eine Farbe aus PALETTE.
 * "." ist durchsichtig. Bei mirror: true ist nur die linke Hälfte gezeichnet,
 * die rechte wird gespiegelt. overlay setzt danach einzelne Pixel: [x, y, Zeichen].
 */
"use strict";

window.SE = window.SE || {};

SE.PALETTE = {
  k: "#0a0710", // Umriss
  K: "#231a2c", // sehr dunkel
  d: "#3a2f45", // dunkler Stein
  g: "#5b5068", // Stein
  G: "#8a809a", // heller Stein
  x: "#9c917f", // Knochen, Schatten
  w: "#d8cfbf", // Knochen
  W: "#f7f1e3", // Knochen, Licht
  r: "#6e0d1c", // dunkles Blut
  R: "#c42332", // Blut
  L: "#ff5a4e", // helles Rot
  o: "#e2691c", // Orange
  u: "#a8741a", // dunkles Gold
  y: "#f8c531", // Gold
  Y: "#fff2a8", // helles Gold
  p: "#35184f", // dunkles Violett
  P: "#6d34a8", // Violett
  v: "#b18cff", // helles Violett
  V: "#e8dcff", // sehr helles Violett
  t: "#0f5550", // dunkles Seelengrün
  c: "#22a596", // Seelengrün
  C: "#4ff0cf", // Seele
  e: "#d6fff4", // Seele, Licht
  b: "#4a2e1c", // dunkles Braun
  B: "#7d5130", // Braun
  n: "#1f4a23", // dunkles Grün
  N: "#3f8a35", // Grün
  M: "#86c84a", // helles Grün
  s: "#1c2540", // Nachtblau
  S: "#3a4c7a", // Blau
  Z: "#6f86c2", // helles Blau
};

SE.SPRITES = {
  /* ---------- Der Schädel (32×32) ---------- */
  skull: {
    mirror: true,
    mirrorMap: { W: "w" },
    rows: [
      "................",
      "...........kkkkk",
      "........kkkwwwww",
      "......kkwwwwwwww",
      ".....kwwwwWWWWww",
      "....kwwwWWWWWwww",
      "...kwwwWWWwwwwww",
      "...kwwWWwwwwwwww",
      "..kwwwWWwwwwwwww",
      "..kwwWWwwwwwwwww",
      "..kwwWwwwwwwwwww",
      "..kxwwwwwwwwwwww",
      "..kxwwwwwwwwwwww",
      "..kxwwwkkkkwwwww",
      "..kxwwkkkkkkwwww",
      "..kxwkkkkkkkkwww",
      "..kxwkkkCCkkkwww",
      "..kxwkkCeeCkkwww",
      "..kxwkkCeeCkkwww",
      "..kxwkkkCCkkkwww",
      "..kxwwkkkkkkkwww",
      "...kxwwkkkkkwwwk",
      "...kxxwwwwwwwwkk",
      "....kxxwwwwwwwkk",
      ".....kxxwwwwwwwk",
      "......kxxwwwwwww",
      "......kkkkkkkkkk",
      "......kWkWWkWWkW",
      "......kxkxxkxxkx",
      ".......kkkkkkkkk",
      ".......kxkwwkwwk",
      "........kkkkkkkk",
    ],
    // Riss in der Schädeldecke
    overlay: [
      [20, 3, "k"], [21, 4, "k"], [21, 5, "k"], [22, 6, "k"], [21, 7, "k"],
      [22, 8, "k"], [23, 9, "k"], [23, 10, "x"],
    ],
  },

  /* ---------- Währung & Irrlicht ---------- */
  soul: {
    rows: [
      "...c....",
      "...cc...",
      "..cCc...",
      "..cCCc..",
      ".cCeCCc.",
      ".cCeeCc.",
      "cCekekCc",
      "cCeeeeCc",
      ".cCeeCc.",
      "..cccc..",
    ],
  },
  wisp: {
    mirror: true,
    rows: [
      "....cc",
      "..ccCC",
      ".cCCee",
      ".cCeee",
      "cCeeke",
      "cCeeke",
      "cCeeee",
      "cCeeek",
      ".cCeee",
      ".cCCee",
      "..ccCC",
      "....cc",
    ],
  },

  /* ---------- Gebäude (16×16) ---------- */
  hand: {
    rows: [
      "....k.k.k.......",
      "...kWkWkWk......",
      "...kwkwkwk......",
      "...kxkxkxk.k....",
      "...kWkWkWkkWk...",
      "...kwkwkwkkwk...",
      "...kwkwkwkwxk...",
      "...kwwwwwwwwk...",
      "...kxwwwwwwk....",
      "....kxwwwwxk....",
      ".....kwkkwk.....",
      ".....kwkkwk.....",
      "...bbkwkkwkbb...",
      "..bBBBkxxkBBBb..",
      ".bBBbBBBBBBbBBb.",
      "bbbbbbbbbbbbbbbb",
    ],
  },
  witch: {
    rows: [
      "...........kk...",
      "..........kPPk..",
      ".........kPPk...",
      "........kPPPk...",
      ".......kPPvPk...",
      ".......kPvPPPk..",
      "......kPPPPPPk..",
      "......kyyyyyyk..",
      "...kkkPPPPPPPPkk",
      ".kkPPPPPPPPPPPPk",
      "..kkkkkkkkkkkkk.",
      "...kpNNNNNNNNpk.",
      "...kpNkNNNNkNpk.",
      "...kpNNNNnNNNpk.",
      "...kpNNkkkkNNpk.",
      "....kpkNNNNkpk..",
    ],
  },
  graveyard: {
    mirror: true,
    rows: [
      "........",
      "....kkkk",
      "...kGGGG",
      "..kGGGGG",
      "..kGgGGk",
      "..kGgkkk",
      "..kGgGGk",
      "..kGgGGk",
      "..kGgGGk",
      "..kGgggg",
      "..kgdddd",
      ".nkgdddd",
      "nNkkkkkk",
      "NMNnNNNn",
      "nNnNnnNN",
      "nnnnnnnn",
    ],
    overlay: [[4, 9, "N"], [5, 10, "N"], [4, 10, "n"], [11, 3, "W"]],
  },
  crypt: {
    mirror: true,
    rows: [
      ".......k",
      "......kG",
      ".....kGg",
      "....kGgg",
      "...kGggg",
      "..kkkkkk",
      "..kGGGGG",
      "..kkkkkk",
      "..kGkgKK",
      "..kGkgKK",
      "..kGkgKC",
      "..kGkgKK",
      "..kGkgKK",
      ".kkkkkkk",
      "kGGGGGGG",
      "kkkkkkkk",
    ],
  },
  tower: {
    mirror: true,
    rows: [
      "..kkk.kk",
      "..kGk.kG",
      "..kGkkkG",
      "..kgGGGG",
      "..kkkkkk",
      "...kgggg",
      "...kggkk",
      "...kgkvv",
      "...kgkPv",
      "...kgkkk",
      "...kgggg",
      "...kdggg",
      "...kggkk",
      "...kgkKK",
      "..kkgkKK",
      ".kkkkkkk",
    ],
    overlay: [[9, 11, "d"], [6, 5, "G"]],
  },
  altar: {
    mirror: true,
    rows: [
      "..y.....",
      ".yYy....",
      "..o.....",
      ".kWk....",
      ".kwk.kkk",
      ".kwkkRRR",
      ".kwkkrRR",
      ".kxk.kgg",
      "kkkkkkkk",
      "kGGGGGGG",
      "kggggggg",
      "kkkkkkkk",
      "..kgggrg",
      "..kgggrg",
      "..kdddrd",
      ".kkkkkkk",
    ],
    overlay: [[9, 13, "g"], [9, 12, "g"], [9, 14, "d"], [7, 5, "L"]],
  },
  demon: {
    mirror: true,
    rows: [
      "kk......",
      "kwk.....",
      "kwk.....",
      ".kwk....",
      ".kxwkkkk",
      "..kxRRRR",
      "..kRRRRR",
      ".kRRyyRR",
      ".kRRkyRR",
      ".kRRRRRR",
      "..kRRRRr",
      "..kRkWkk",
      "...kRWkR",
      "....kRRR",
      ".....kkk",
      "........",
    ],
  },
  lich: {
    mirror: true,
    rows: [
      "...y..y.",
      "...yy.yy",
      "...yyyyy",
      "...yRyyu",
      ".ppkkkkk",
      "pPkwwwww",
      "pPkwkkww",
      "pPkwkCww",
      "pPkwwwwk",
      "pPPkwwww",
      "pPPkwkwk",
      "pPPPkkkk",
      "pPPPPPPP",
      "pPPvPPPP",
      "ppPPPPPP",
      ".ppppppp",
    ],
  },
  portal: {
    mirror: true,
    rows: [
      ".....kkk",
      "...kkggg",
      "..kggkkk",
      ".kgkkrrr",
      ".kgkrRRR",
      "kgkrRooo",
      "kgkrRoyy",
      "kgkrRoyY",
      "kgkrRoyY",
      "kgkrRoyy",
      "kgkrRooo",
      ".kgkrRRR",
      ".kgkkrrr",
      "..kggkkk",
      "...kkggg",
      ".....kkk",
    ],
  },
  egg: {
    mirror: true,
    rows: [
      "........",
      "......kk",
      ".....kRR",
      "....kRLR",
      "...kRLRR",
      "...kRRRR",
      "..kRRRrR",
      "..kRRRRR",
      "..kRRrRR",
      "..krRRRR",
      "..krRRRr",
      "...krrRr",
      ".bbkkrrr",
      "bBbBkkkk",
      ".bBbBbBb",
      "..bbbbbb",
    ],
    // glühender Riss
    overlay: [
      [8, 4, "o"], [7, 5, "y"], [8, 6, "o"], [9, 7, "y"], [8, 8, "o"], [7, 9, "y"], [8, 10, "o"],
    ],
  },
  moon: {
    mirror: true,
    rows: [
      ".....kkk",
      "...kkRRR",
      "..kRLLLR",
      ".kRLLRRR",
      ".kRLRRRR",
      "kRLRRRRR",
      "kRLRRRRR",
      "kRRRRRRR",
      "kRRRRRRR",
      "kRRRRRRR",
      "krRRRRRR",
      ".krRRRRR",
      ".krrRRRR",
      "..krrrRR",
      "...kkrrr",
      ".....kkk",
    ],
    overlay: [
      [9, 4, "r"], [10, 4, "r"], [9, 5, "r"], [10, 5, "r"], [11, 5, "L"],
      [5, 9, "r"], [6, 9, "r"], [5, 10, "r"],
      [10, 10, "r"], [11, 10, "r"], [10, 11, "r"], [11, 11, "r"], [12, 11, "L"],
    ],
  },
  eye: {
    mirror: true,
    rows: [
      "........",
      "........",
      "....kkkk",
      "..kkVVVV",
      ".kVVVVyy",
      "kVVVVyoo",
      "kVVVyook",
      "kVVVyook",
      "kVVVyook",
      "kVVVVyoo",
      ".kVVVVyy",
      "..kkVVVV",
      "...pkkkk",
      "..pP.p.P",
      "..p..P.p",
      ".....p..",
    ],
    overlay: [[2, 6, "R"], [3, 6, "R"], [3, 7, "R"], [13, 8, "R"], [12, 8, "R"], [12, 9, "R"], [6, 6, "Y"]],
  },

  /* ---------- Verbesserungen ---------- */
  blade: {
    rows: [
      ".............kk.",
      "............kWWk",
      "...........kWwk.",
      "..........kWwk..",
      ".........kWwk...",
      "........kWwk....",
      ".......kWwk.....",
      "......kWwk......",
      "..kk.kWwk.......",
      "..kykWwk........",
      "...kywk.........",
      "...kkyyk........",
      "..kbk.kyk.......",
      ".kbk...kk.......",
      "kbk.............",
      "kk..............",
    ],
  },
  potion: {
    mirror: true,
    rows: [
      "......kk",
      "......kB",
      "......kk",
      "......kV",
      ".....kkV",
      "...kkVVV",
      "..kVVVVV",
      ".kVRRRRR",
      ".kRRRRRR",
      "kRRRRRRR",
      "kRRRRRRR",
      "kRRRRRRR",
      ".krRRRRR",
      ".krrRRRR",
      "..kkrrrr",
      "....kkkk",
    ],
    overlay: [[4, 8, "W"], [4, 9, "W"], [5, 10, "W"], [10, 11, "L"]],
  },
  lantern: {
    mirror: true,
    rows: [
      "......kk",
      ".....k..",
      ".....kkk",
      "....kuyy",
      "...kkkkk",
      "...kucCC",
      "...kuCee",
      "...kuCee",
      "...kucCC",
      "...kucCC",
      "...kkkkk",
      "....kuyy",
      ".....kkk",
      "........",
      "........",
      "........",
    ],
  },
  hourglass: {
    mirror: true,
    rows: [
      ".kkkkkkk",
      ".kBBBBBB",
      ".kkkkkkk",
      "..kVCCCC",
      "..kVCCCC",
      "...kVCCC",
      "....kVCC",
      ".....kVC",
      ".....kVc",
      "....kV..",
      "...kV..C",
      "..kV.cCC",
      "..kVCCCC",
      ".kkkkkkk",
      ".kBBBBBB",
      ".kkkkkkk",
    ],
  },

  /* ---------- Relikte ---------- */
  amulet: {
    mirror: true,
    rows: [
      ".k......",
      ".yk.....",
      "..yk....",
      "...yk...",
      "....yk..",
      ".....yk.",
      "......yk",
      ".....kky",
      "....kyyy",
      "...kyyRR",
      "...kyRLR",
      "...kyRRR",
      "...kuyRR",
      "....kuyy",
      ".....kku",
      ".......k",
    ],
  },
  ring: {
    mirror: true,
    rows: [
      "......kk",
      ".....kPv",
      "....kPvV",
      ".....kPP",
      "....kkyk",
      "...kyyYy",
      "..kyykkk",
      ".kyyk...",
      ".kyk....",
      ".kyk....",
      ".kuyk...",
      "..kuyk..",
      "...kuykk",
      "....kkuu",
      "......kk",
      "........",
    ],
  },
  chalice: {
    mirror: true,
    rows: [
      "........",
      ".kkkkkkk",
      ".kyRRRRR",
      ".kyRLRRR",
      ".kyyyyyy",
      "..kyyYyy",
      "..kuyyyy",
      "...kuyyy",
      "....kkuy",
      "......ky",
      "......ky",
      ".....kuy",
      "....kuyy",
      "...kuuyy",
      "...kkkkk",
      "........",
    ],
  },
  grimoire: {
    rows: [
      "..kkkkkkkkkkkk..",
      ".kyPPPPPPPPPPyk.",
      ".kPPPPPPPPPPPPkW",
      ".kPPPPkkkkPPPPkW",
      ".kPPPkwwwwkPPPkW",
      ".kPPPkwkkwkPPPkW",
      ".kPPPkwkkwkPPPkW",
      ".kPPPkwwwwkPPPkW",
      ".kPPPPkwwkPPPPkW",
      ".kPPPPkkkkPPPPkW",
      ".kPPPPPPPPPPPPkW",
      ".kPPPPPPPPPPPPkW",
      ".kyPPPPPPPPPPykW",
      ".kkkkkkkkkkkkkkW",
      "..kWWWWWWWWWWWWk",
      "...kkkkkkkkkkkk.",
    ],
  },
  feather: {
    rows: [
      "............kkk.",
      "...........kPvk.",
      "..........kPvPk.",
      ".........kPvPKk.",
      "........kPvPKk..",
      ".......kPvPKKk..",
      "......kPvPKKk...",
      ".....kPvPKKk....",
      "....kPvPKKk.....",
      "...kPvPKKk......",
      "...kvPKKk.......",
      "..kvPKkk........",
      "..kGkk..........",
      ".kGk............",
      "kGk.............",
      "kk..............",
    ],
  },
  dice: {
    mirror: true,
    rows: [
      "........",
      "..kkkkkk",
      ".kWWWWWW",
      ".kWkkWWW",
      ".kWkkWWW",
      ".kWWWWWW",
      ".kWWWWWW",
      ".kWWWWWk",
      ".kWWWWWk",
      ".kWWWWWW",
      ".kWWWWWW",
      ".kWkkWWW",
      ".kxkkxxx",
      ".kxxxxxx",
      "..kkkkkk",
      "........",
    ],
  },
  crown: {
    mirror: true,
    rows: [
      "........",
      "........",
      "........",
      ".k.....k",
      "kyk...ky",
      "kyyk.kyy",
      "kyyykyyy",
      "kyyyyyyy",
      "kyRyyyCy",
      "kyyyyyyy",
      "kuuuuuuu",
      "kyyyyyyy",
      "kkkkkkkk",
      "........",
      "........",
      "........",
    ],
  },
  orb: {
    mirror: true,
    rows: [
      "........",
      ".....kkk",
      "...kkPPP",
      "..kPPvvv",
      ".kPvVVvv",
      ".kPvVvvP",
      "kPPvvvPP",
      "kPPPvPPp",
      "kpPPPPPp",
      ".kpPPPpp",
      ".kppppp.",
      "..kkpppp",
      "...kkkkk",
      "..kBBBBB",
      ".kbBBBBB",
      ".kkkkkkk",
    ],
  },

  /* ---------- Schicksalsrad ---------- */
  bag: {
    mirror: true,
    rows: [
      "........",
      "......kk",
      ".....kBB",
      "......kk",
      ".....kRk",
      "....kBBB",
      "...kBBBB",
      "..kBBBBB",
      ".kBBBBkC",
      ".kBBBkCe",
      "kBBBBkCe",
      "kBBBBBkC",
      "kbBBBBBk",
      ".kbbBBBB",
      "..kkbbbb",
      "....kkkk",
    ],
  },
  chest: {
    mirror: true,
    rows: [
      "........",
      "........",
      "...kkkkk",
      "..kBBBBB",
      ".kBBBBBB",
      ".kyyyyyy",
      ".kBBBBBk",
      "kkkkkkky",
      "kBBBBBky",
      "kyBBBBBk",
      "kyBBBBBB",
      "kBBBBBBB",
      "kbBBBBBB",
      "kyyyyyyy",
      "kkkkkkkk",
      "........",
    ],
  },
  coffin: {
    mirror: true,
    rows: [
      ".....kkk",
      "....kBBB",
      "...kBBBB",
      "..kBBBBk",
      "..kBBBky",
      ".kBBBBky",
      ".kBBkkky",
      ".kBByyyy",
      ".kBBkkky",
      "..kBBBky",
      "..kBBBky",
      "..kBBBBk",
      "...kBBBB",
      "...kbBBB",
      "....kbbb",
      ".....kkk",
    ],
  },
  pointer: {
    mirror: true,
    rows: [
      "kkkkk",
      "kRRRR",
      "kRLLL",
      ".kRRR",
      ".kRRR",
      "..kRR",
      "..kRR",
      "...kR",
      "...kk",
    ],
  },
  lock: {
    mirror: true,
    rows: [
      "........",
      "........",
      ".....kkk",
      "....kggg",
      "...kgk..",
      "...kgk..",
      "..kkkkkk",
      "..kGGGGG",
      "..kGgggg",
      "..kGggkk",
      "..kGggkk",
      "..kGgggk",
      "..kGgggg",
      "..kkkkkk",
      "........",
      "........",
    ],
  },

  /* ---------- Szene ---------- */
  brick: {
    rows: [
      "gggggggkgggggggk",
      "dddddddkdddgdddk",
      "dddddddkdddddddk",
      "KKKKKKKkKKKKKKKk",
      "kkkkkkkkkkkkkkkk",
      "gggkgggggggkgggg",
      "dddkdddddddkdgdd",
      "dddkdddddddkdddd",
      "KKKkKKKKKKKkKKKK",
      "kkkkkkkkkkkkkkkk",
    ],
  },
  ground: {
    rows: [
      "gGGGGGGkgGGGGGGk",
      "gdddddgkgddddgdk",
      "gddddddkgdddddgk",
      "gddgdddkgddddddk",
      "KKKKKKKkKKKKKKKk",
      "kkkkkkkkkkkkkkkk",
      "dddkgGGGGGGkgddd",
      "dddkgddgdddkgddd",
      "dgdkgdddddgkgddd",
      "dddkgddddddkgdgd",
      "KKKkKKKKKKKkKKKK",
      "kkkkkkkkkkkkkkkk",
    ],
  },
  sconce: {
    rows: [
      ".kkkkk.",
      "kuyyyuk",
      ".kuyuk.",
      "..kyk..",
      "..kuk..",
      "..kuk..",
      "..kuk..",
      ".kkukk.",
      ".kuuuk.",
      "..kkk..",
    ],
  },
};

/* ---------- Bauen und Zeichnen ---------- */
(function () {
  const cache = {};
  const urlCache = {};

  function build(name) {
    if (cache[name]) return cache[name];
    const def = SE.SPRITES[name];
    if (!def) throw new Error("Unbekannte Grafik: " + name);
    let rows = def.rows;
    if (def.mirror) {
      const map = def.mirrorMap || {};
      rows = rows.map((r) => r + r.split("").reverse().map((c) => map[c] || c).join(""));
    }
    const h = rows.length;
    const w = Math.max(...rows.map((r) => r.length));
    const grid = rows.map((r) => r.padEnd(w, ".").split(""));
    for (const [x, y, c] of def.overlay || []) {
      if (grid[y] && x < w) grid[y][x] = c;
    }
    return (cache[name] = { w, h, grid });
  }

  // pal: optionales Objekt { Zeichen: Farbe } oder Funktion (Zeichen, Farbe) => Farbe
  function colorFor(ch, pal) {
    if (ch === "." || ch === " ") return null;
    const base = SE.PALETTE[ch] || null;
    if (!pal) return base;
    if (typeof pal === "function") return pal(ch, base);
    return pal[ch] !== undefined ? pal[ch] : base;
  }

  SE.spriteSize = (name) => {
    const s = build(name);
    return { w: s.w, h: s.h };
  };

  SE.drawSprite = function (ctx, name, x, y, opts = {}) {
    const s = build(name);
    const scale = opts.scale || 1;
    const flip = !!opts.flip;
    for (let j = 0; j < s.h; j++) {
      for (let i = 0; i < s.w; i++) {
        const col = colorFor(s.grid[j][i], opts.pal);
        if (!col) continue;
        ctx.fillStyle = col;
        const px = flip ? s.w - 1 - i : i;
        ctx.fillRect(Math.round(x + px * scale), Math.round(y + j * scale), scale, scale);
      }
    }
  };

  SE.spriteCanvas = function (name, opts = {}) {
    const s = build(name);
    const scale = opts.scale || 1;
    const c = document.createElement("canvas");
    c.width = s.w * scale;
    c.height = s.h * scale;
    SE.drawSprite(c.getContext("2d"), name, 0, 0, opts);
    return c;
  };

  // Daten-URL für <img>; key unterscheidet Farbvarianten im Zwischenspeicher
  SE.spriteURL = function (name, opts = {}) {
    const key = name + "|" + (opts.key || "") + "|" + (opts.scale || 1);
    if (!urlCache[key]) urlCache[key] = SE.spriteCanvas(name, opts).toDataURL();
    return urlCache[key];
  };

  // Farbvarianten
  SE.PAL = {
    // alles außer durchsichtig in einer Farbe: für gesperrte Dinge
    silhouette: (color) => (ch) => (ch === "." ? null : color),
    // dunkler machen (für "???"-Gebäude)
    shadow: () => (ch) => {
      if (ch === ".") return null;
      return ch === "k" ? "#050308" : "#1d1626";
    },
  };
})();
