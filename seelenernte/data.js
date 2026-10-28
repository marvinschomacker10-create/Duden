/* Seelenernte – Spielinhalte */
"use strict";

window.SE = window.SE || {};

/* ---------- Gebäude ---------- */
// cost: Grundpreis, sps: Seelen pro Sekunde je Stück, floor/sky: Farben der Reihe im Reich
SE.BUILDINGS = [
  { id: "hand", name: "Knochenhand", plural: "Knochenhände", sprite: "hand", cost: 15, sps: 0.1,
    desc: "Greift alle zehn Sekunden aus dem Grab nach einer Seele.", sky: "#1a1220", floor: "#4a2e1c" },
  { id: "witch", name: "Hexe", plural: "Hexen", sprite: "witch", cost: 100, sps: 1,
    desc: "Braut in ihrem Kessel Seelen aus Krötenschleim und Mondlicht.", sky: "#161226", floor: "#2b1d3a" },
  { id: "graveyard", name: "Friedhof", plural: "Friedhöfe", sprite: "graveyard", cost: 1100, sps: 8,
    desc: "Wo Tote ruhen, lassen sich Seelen ernten. Niemand beschwert sich.", sky: "#121a1a", floor: "#1f4a23" },
  { id: "crypt", name: "Gruft", plural: "Grüfte", sprite: "crypt", cost: 12000, sps: 47,
    desc: "Tief unter der Erde warten uralte Seelen auf ihre Befreiung.", sky: "#141218", floor: "#3a2f45" },
  { id: "tower", name: "Nekromantenturm", plural: "Nekromantentürme", sprite: "tower", cost: 130000, sps: 260,
    desc: "Nekromanten beschwören rund um die Uhr. Pausen sind abgeschafft.", sky: "#170f22", floor: "#35184f" },
  { id: "altar", name: "Blutaltar", plural: "Blutaltäre", sprite: "altar", cost: 1.4e6, sps: 1400,
    desc: "Jedes Opfer lockt neue Seelen an. Die Flecken gehen nie wieder raus.", sky: "#1c0c12", floor: "#6e0d1c" },
  { id: "demon", name: "Dämonentempel", plural: "Dämonentempel", sprite: "demon", cost: 2e7, sps: 7800,
    desc: "Dämonen beten zu dir und zahlen den Zehnten in Seelen.", sky: "#210b0b", floor: "#5a1a0e" },
  { id: "lich", name: "Lich-Zitadelle", plural: "Lich-Zitadellen", sprite: "lich", cost: 3.3e8, sps: 44000,
    desc: "Untote Könige verwalten dein Reich mit kalter Effizienz.", sky: "#150c20", floor: "#2a1640" },
  { id: "portal", name: "Höllenportal", plural: "Höllenportale", sprite: "portal", cost: 5.1e9, sps: 260000,
    desc: "Ein Tor in die Unterwelt, aus dem Seelen in Strömen fließen.", sky: "#1f0a06", floor: "#7a2a0c" },
  { id: "egg", name: "Drachenbrut", plural: "Drachenbruten", sprite: "egg", cost: 7.5e10, sps: 1.6e6,
    desc: "Junge Drachen schlüpfen und bringen Seelen aus fernen Reichen.", sky: "#1a100a", floor: "#5a3a12" },
  { id: "moon", name: "Blutmond", plural: "Blutmonde", sprite: "moon", cost: 1e12, sps: 1e7,
    desc: "Unter rotem Mondlicht erwachen die Toten der ganzen Welt.", sky: "#1d0710", floor: "#3b0a16" },
  { id: "eye", name: "Auge des Abgrunds", plural: "Augen des Abgrunds", sprite: "eye", cost: 1.4e13, sps: 6.5e7,
    desc: "Der Abgrund blickt zurück und zieht Seelen aus allen Welten.", sky: "#0c0614", floor: "#1d0f30" },
];

/* ---------- Verbesserungen ---------- */
SE.TIERS = [
  { need: 1, mult: 10, roman: "I", color: "#b0793a" },
  { need: 5, mult: 50, roman: "II", color: "#b8b2c4" },
  { need: 25, mult: 500, roman: "III", color: "#f8c531" },
  { need: 50, mult: 50000, roman: "IV", color: "#e0303f" },
  { need: 100, mult: 5e6, roman: "V", color: "#4ff0cf" },
  { need: 150, mult: 5e8, roman: "VI", color: "#b18cff" },
];

SE.TIER_NAMES = {
  hand: ["Geschärfte Fingerknochen", "Grabesgriff", "Schwarzmagische Sehnen", "Knöchel aus Obsidian", "Hände des Nichts", "Griff der Ewigkeit"],
  witch: ["Eichenbesen", "Kessel aus Gusseisen", "Krötenschleim", "Mondkraut-Ernte", "Hexensabbat", "Uralter Zirkel"],
  graveyard: ["Frische Erde", "Rostige Spaten", "Totenglocke", "Ewiger Nebel", "Unruhige Gräber", "Totenacker der Ahnen"],
  crypt: ["Schwere Steinplatten", "Ewige Fackeln", "Knochenkammern", "Mumifizierte Wächter", "Gewölbe der Stille", "Sarkophag der Urahnen"],
  tower: ["Verbotene Folianten", "Schädelleuchter", "Seelenspiegel", "Turm aus Knochen", "Zirkel der Nekromanten", "Spitze des Wahnsinns"],
  altar: ["Opferdolche", "Kerzen aus Talg", "Blutrunen", "Ewige Flamme", "Hohepriesterin", "Altar der tausend Opfer"],
  demon: ["Höllenweihrauch", "Dämonenglocken", "Infernale Gebete", "Schwefelorgeln", "Segen der Erzdämonen", "Thron des Höllenfürsten"],
  lich: ["Polierte Phylakterien", "Knochenkronen", "Untote Leibgarde", "Seelengefängnis", "Unsterbliche Bürokratie", "Kaiser der Toten"],
  portal: ["Stabilisierte Risse", "Schwefeldampf", "Höllenhunde-Zucht", "Feuer der Unterwelt", "Dimensionsriss", "Die neun Kreise"],
  egg: ["Warmes Nest", "Lavabrut", "Drachenschuppen", "Feuerodem", "Drachenmutter", "Uralter Wyrm"],
  moon: ["Rote Linsen", "Mondfinsternis", "Gezeiten aus Blut", "Werwolf-Rudel", "Mond der Wahnsinnigen", "Ewige Mondnacht"],
  eye: ["Wimpern der Finsternis", "Blick ins Nichts", "Flüstern der Leere", "Augen hinter den Sternen", "Das Allsehende", "Der Blick, der Welten frisst"],
};

// Farbvarianten für Waffen- und Trank-Symbole
const bladePal = (edge, light, guard) => ({ W: light, w: edge, y: guard });
const potionPal = (dark, mid, light) => ({ r: dark, R: mid, L: light });

SE.UPGRADES = [];

SE.BUILDINGS.forEach((b) => {
  SE.TIERS.forEach((t, i) => {
    const clickToo = b.id === "hand" && i < 3;
    SE.UPGRADES.push({
      id: `${b.id}-${i + 1}`,
      name: SE.TIER_NAMES[b.id][i],
      desc: `${b.plural} sind doppelt so stark.` + (clickToo ? " Dein Klick ebenfalls." : ""),
      cost: b.cost * t.mult,
      icon: { sprite: b.sprite, frame: t.color, badge: t.roman },
      unlock: (st) => st.buildings[b.id] >= t.need,
      need: `${t.need} × ${t.need === 1 ? b.name : b.plural}`,
      effects: clickToo ? [{ type: "bmult", b: b.id, x: 2 }, { type: "cmult", x: 2 }] : [{ type: "bmult", b: b.id, x: 2 }],
    });
  });
});

[
  ["Tausend Knochenfinger", 25, 1e5, 0.1, "Knochenhände und dein Klick erhalten +0,1 Seelen für jedes andere Gebäude."],
  ["Millionen Knochenfinger", 50, 1e7, 5, "Der Bonus der Knochenfinger wird verfünffacht."],
  ["Milliarden Knochenfinger", 100, 1e9, 10, "Der Bonus der Knochenfinger wird verzehnfacht."],
].forEach(([name, need, cost, x, desc], i) => {
  SE.UPGRADES.push({
    id: `finger-${i + 1}`, name, desc, cost,
    icon: { sprite: "hand", pal: { W: "#fff2a8", w: "#f8c531", x: "#a8741a" }, key: "gold", frame: "#f8c531" },
    unlock: (st) => st.buildings.hand >= need,
    need: `${need} Knochenhände`,
    effects: [i === 0 ? { type: "finger", x } : { type: "fingermult", x }],
  });
});

[
  ["Rostiger Dolch", 1e3, 5e4, bladePal("#8a5a32", "#c08850", "#6b4a2a")],
  ["Silberne Sichel", 1e5, 5e6, bladePal("#b8b2c4", "#ffffff", "#8a809a")],
  ["Runenklinge", 1e7, 5e8, bladePal("#22a596", "#4ff0cf", "#f8c531")],
  ["Seelenschnitter", 1e9, 5e10, bladePal("#6d34a8", "#b18cff", "#f8c531")],
  ["Klinge der Leere", 1e11, 5e12, bladePal("#231a2c", "#5b5068", "#c42332")],
  ["Hand des Todes", 1e13, 5e14, bladePal("#c42332", "#ff5a4e", "#0a0710")],
].forEach(([name, need, cost, pal], i) => {
  SE.UPGRADES.push({
    id: `click-${i + 1}`, name, cost,
    desc: "Jeder Klick erntet zusätzlich 1 % deiner Seelen pro Sekunde.",
    icon: { sprite: "blade", pal, key: name, frame: "#d8cfbf" },
    unlock: (st) => st.clickSouls >= need,
    needFn: (fmt) => `${fmt(need)} Seelen durch Klicks`,
    effects: [{ type: "clickpct", x: 0.01 }],
  });
});

[
  ["Rabenblut", 5e5, 0.05, potionPal("#2a0a10", "#5a1020", "#8a2030")],
  ["Fledermausflügel", 5e6, 0.05, potionPal("#231a2c", "#3a2f45", "#8a809a")],
  ["Spinnengift", 5e7, 0.05, potionPal("#1f4a23", "#3f8a35", "#86c84a")],
  ["Mandragorawurzel", 5e8, 0.05, potionPal("#4a2e1c", "#7d5130", "#c08850")],
  ["Basiliskenauge", 5e9, 0.1, potionPal("#a8741a", "#f8c531", "#fff2a8")],
  ["Drachenblut", 5e10, 0.1, potionPal("#6e0d1c", "#c42332", "#ff5a4e")],
  ["Phönixasche", 5e11, 0.1, potionPal("#a8400c", "#e2691c", "#f8c531")],
  ["Sternenstaub der Leere", 5e12, 0.15, potionPal("#35184f", "#6d34a8", "#b18cff")],
  ["Tränen eines Gottes", 5e13, 0.2, potionPal("#0f5550", "#22a596", "#4ff0cf")],
].forEach(([name, cost, x, pal], i) => {
  SE.UPGRADES.push({
    id: `potion-${i + 1}`, name, cost,
    desc: `Opfergabe: alle Seelen pro Sekunde +${Math.round(x * 100)} %.`,
    icon: { sprite: "potion", pal, key: name, frame: "#b18cff" },
    unlock: (st) => st.runSouls >= cost / 4,
    needFn: (fmt) => `${fmt(cost / 4)} Seelen in diesem Leben`,
    effects: [{ type: "gmult", x }],
  });
});

[
  ["Irrlicht-Köder", 3, 77777, "Irrlichter erscheinen häufiger.", { type: "wispfreq", x: 0.8 }],
  ["Laterne der Verirrten", 7, 7777777, "Irrlichter erscheinen noch häufiger.", { type: "wispfreq", x: 0.8 }],
  ["Ewiges Irrlicht", 27, 777777777, "Irrlicht-Effekte halten doppelt so lange, und Irrlichter bleiben länger.", { type: "wispdur", x: 2 }],
].forEach(([name, need, cost, desc, eff], i) => {
  SE.UPGRADES.push({
    id: `wisp-${i + 1}`, name, desc, cost,
    icon: { sprite: "lantern", frame: "#4ff0cf" },
    unlock: (st) => st.wispsClicked >= need,
    need: `${need} gefangene Irrlichter`,
    effects: [eff],
  });
});

/* ---------- Relikte (vom Schicksalsrad) ---------- */
SE.RELICS = [
  { id: "amulet", name: "Amulett des Wiedergängers", sprite: "amulet", desc: "+10 % Seelen pro Sekunde.", effect: { gmult: 0.1 } },
  { id: "ring", name: "Ring der Gruft", sprite: "ring", desc: "Klicks ernten 50 % mehr.", effect: { cmult: 1.5 } },
  { id: "chalice", name: "Kelch des Blutes", sprite: "chalice", desc: "Effekte von Irrlichtern halten 25 % länger.", effect: { buffdur: 1.25 } },
  { id: "grimoire", name: "Grimoire der Toten", sprite: "grimoire", desc: "Alle Gebäude kosten 5 % weniger.", effect: { costmult: 0.95 } },
  { id: "feather", name: "Rabenfeder", sprite: "feather", desc: "Irrlichter erscheinen 20 % häufiger.", effect: { wispfreq: 0.8 } },
  { id: "dice", name: "Knochenwürfel", sprite: "dice", desc: "Seelen vom Schicksalsrad +50 %.", effect: { wheel: 1.5 } },
  { id: "crown", name: "Krone des Lichkönigs", sprite: "crown", desc: "+15 % Seelen pro Sekunde.", effect: { gmult: 0.15 } },
  { id: "orb", name: "Kugel der Seherin", sprite: "orb", desc: "Während du fort bist, ernten deine Diener voll statt halb.", effect: { offline: 1 } },
];

/* ---------- Schicksalsrad ---------- */
// weight: Anteil in Prozent; die Größe der Felder entspricht der Chance.
SE.WHEEL = [
  { id: "bag", name: "Seelenbeutel", short: "15 Min.", sprite: "bag", weight: 24, color: "#3a2f45",
    desc: "Seelen für 15 Minuten Produktion." },
  { id: "bloodmoon", name: "Blutmond", short: "×5", sprite: "moon", weight: 14, color: "#6e0d1c",
    desc: "5 Minuten lang fünffache Seelen pro Sekunde." },
  { id: "chest", name: "Seelentruhe", short: "1 Std.", sprite: "chest", weight: 16, color: "#4a2e1c",
    desc: "Seelen für eine Stunde Produktion." },
  { id: "fist", name: "Höllenfaust", short: "Klick ×77", sprite: "hand", pal: { W: "#ff8a7e", w: "#e0303f", x: "#6e0d1c" }, weight: 12, color: "#5a1a0e",
    desc: "60 Sekunden lang ernten Klicks das 77-Fache." },
  { id: "coffin", name: "Grabbeigaben", short: "+3", sprite: "coffin", weight: 12, color: "#2a1640",
    desc: "3 Exemplare deines stärksten Gebäudes gratis." },
  { id: "swarm", name: "Irrlicht-Schwarm", short: "3×", sprite: "wisp", weight: 10, color: "#0f3a38",
    desc: "Drei Irrlichter erscheinen sofort." },
  { id: "relic", name: "Relikt", short: "Relikt", sprite: "amulet", weight: 8, color: "#35184f",
    desc: "Ein zufälliges Relikt mit dauerhafter Wirkung." },
  { id: "hoard", name: "Drachenschatz", short: "4 Std.", sprite: "chest", pal: { B: "#f8c531", b: "#a8741a", y: "#fff2a8" }, weight: 4, color: "#7a5a0c",
    desc: "Der Hauptgewinn: Seelen für vier Stunden Produktion." },
];

/* ---------- Trophäen ---------- */
SE.ACHIEVEMENTS = [];
const ach = (id, name, desc, icon, check, extra = {}) => SE.ACHIEVEMENTS.push({ id, name, desc, icon, check, ...extra });

[
  [1, "Erste Seele"], [100, "Grabräuber"], [1e3, "Seelenfänger"], [1e4, "Leichenfledderer"],
  [1e5, "Totengräber"], [1e6, "Nekromant"], [1e7, "Seelenhändler"], [1e8, "Herr der Gräber"],
  [1e9, "Schattenfürst"], [1e10, "Fürst der Verdammten"], [1e11, "Der bleiche König"], [1e12, "Lichkönig"],
  [1e13, "Weltenverschlinger"], [1e15, "Ewige Nacht"], [1e18, "Das Ende aller Tage"],
].forEach(([n, name], i) =>
  ach(`souls-${i}`, name, (fmt) => `Ernte insgesamt ${fmt(n)} ${n === 1 ? "Seele" : "Seelen"}.`, { sprite: "soul" },
    (st) => st.allTimeSouls >= n));

[
  [1, "Ein Flüstern im Dunkeln"], [10, "Leises Wehklagen"], [100, "Chor der Verdammten"], [1e3, "Totentanz"],
  [1e4, "Seelensturm"], [1e5, "Mahlstrom der Seelen"], [1e6, "Ewige Prozession"], [1e7, "Der Fluss Styx"],
  [1e8, "Ozean der Seelen"], [1e9, "Die unendliche Ernte"],
].forEach(([n, name], i) =>
  ach(`sps-${i}`, name, (fmt) => `Erreiche ${fmt(n)} Seelen pro Sekunde.`, { sprite: "hourglass" },
    (st, g) => g.baseSps >= n));

[
  [1, "Erstes Klopfen"], [100, "Fingerknöchel"], [1000, "Knochenbrecher"], [5000, "Blutige Finger"], [25000, "Raserei ohne Ende"],
].forEach(([n, name], i) =>
  ach(`clicks-${i}`, name, (fmt) => `Klicke ${fmt(n)}-mal auf den Schädel.`, { sprite: "skull", small: true },
    (st) => st.clicks >= n));

[
  [1e3, "Handarbeit"], [1e5, "Schnitter"], [1e7, "Sensenmann"], [1e9, "Hand des Todes"],
].forEach(([n, name], i) =>
  ach(`clicksouls-${i}`, name, (fmt) => `Ernte ${fmt(n)} Seelen durch Klicks.`, { sprite: "blade" },
    (st) => st.clickSouls >= n));

const BUILDING_ACH = {
  hand: ["Aus dem Grab", "Hände hoch", "Hundert helfende Hände"],
  witch: ["Die erste Hexe", "Hexenzirkel", "Walpurgisnacht"],
  graveyard: ["Ruhe sanft", "Totenacker", "Stadt der Toten"],
  crypt: ["Unter der Erde", "Katakomben", "Ewige Gruft"],
  tower: ["Turm der Schatten", "Dunkle Akademie", "Spitze der Verderbnis"],
  altar: ["Erstes Opfer", "Blutströme", "Rotes Meer"],
  demon: ["Dämonenpakt", "Höllischer Klerus", "Kathedrale der Hölle"],
  lich: ["Phylakterium", "Untote Aristokratie", "Ewige Herrschaft"],
  portal: ["Das Tor öffnet sich", "Höllenschlund", "Die Hölle ist leer"],
  egg: ["Brutpflege", "Drachennest", "Mutter der Drachen"],
  moon: ["Rote Nacht", "Rote Gezeiten", "Der Himmel blutet"],
  eye: ["Der Abgrund blickt zurück", "Tausend Augen", "Allsehend"],
};
SE.BUILDINGS.forEach((b) => {
  [1, 50, 100].forEach((n, i) =>
    ach(`b-${b.id}-${n}`, BUILDING_ACH[b.id][i],
      () => (n === 1 ? `Besitze ${b.name === "Hexe" ? "eine Hexe" : "1 × " + b.name}.` : `Besitze ${n} ${b.plural}.`),
      { sprite: b.sprite }, (st) => st.buildings[b.id] >= n));
});

[
  [50, "Grundstein der Finsternis"], [200, "Dunkles Fürstentum"], [500, "Imperium der Nacht"], [1000, "Herrscher der Schatten"],
].forEach(([n, name], i) =>
  ach(`total-${i}`, name, () => `Besitze insgesamt ${n} Gebäude.`, { sprite: "crypt" },
    (st, g) => g.totalBuildings >= n));

[
  [1, "Gefangenes Licht"], [7, "Sieben Lichter"], [27, "Lichtfänger"], [77, "Herr der Irrlichter"],
].forEach(([n, name], i) =>
  ach(`wisp-${i}`, name, () => (n === 1 ? "Fange ein Irrlicht." : `Fange ${n} Irrlichter.`), { sprite: "wisp" },
    (st) => st.wispsClicked >= n));

[
  [10, "Verbotenes Wissen"], [30, "Arkane Studien"], [60, "Meister der dunklen Künste"],
].forEach(([n, name], i) =>
  ach(`upg-${i}`, name, () => `Kaufe ${n} Verbesserungen.`, { sprite: "grimoire" },
    (st) => st.upgrades.length >= n));

ach("wheel-1", "Rad des Schicksals", () => "Drehe zum ersten Mal am Schicksalsrad.", { sprite: "pointer" }, (st) => st.wheel.spins >= 1);
ach("wheel-10", "Liebling der Nornen", () => "Drehe 10-mal am Schicksalsrad.", { sprite: "pointer" }, (st) => st.wheel.spins >= 10);
ach("wheel-streak", "Wochenpakt", () => "Drehe an 7 Tagen hintereinander.", { sprite: "hourglass" }, (st) => st.wheel.bestStreak >= 7);
ach("wheel-hoard", "Drachengold", () => "Gewinne den Drachenschatz.", { sprite: "chest", pal: SE.WHEEL[7].pal, key: "gold" }, (st) => st.wheel.hoards >= 1);

ach("relic-1", "Reliktjäger", () => "Besitze ein Relikt.", { sprite: "amulet" }, (st) => st.relics.length >= 1);
ach("relic-all", "Kurator des Grauens", () => "Besitze alle Relikte.", { sprite: "crown" }, (st) => st.relics.length >= SE.RELICS.length);

ach("ritual-1", "Wiedergeburt", () => "Vollziehe das Ritual der Wiedergeburt.", { sprite: "orb" }, (st) => st.rituals >= 1);
ach("ritual-5", "Ewiger Kreislauf", () => "Vollziehe das Ritual fünfmal.", { sprite: "orb" }, (st) => st.rituals >= 5);

ach("sell", "Verrat", () => "Verkaufe ein Gebäude.", { sprite: "coffin" }, (st) => st.sold >= 1);
ach("bank", "Seelenhort", () => "Besitze eine Million Seelen gleichzeitig.", { sprite: "bag" }, (st) => st.souls >= 1e6);
ach("all", "Vollständiges Pantheon", () => "Besitze mindestens eins von jedem Gebäude.", { sprite: "lich" },
  (st) => SE.BUILDINGS.every((b) => st.buildings[b.id] >= 1));
ach("thirteen", "Dreizehn", () => "Besitze genau 13 Hexen.", { sprite: "witch" }, (st) => st.buildings.witch === 13, { hidden: true });
ach("midnight", "Geisterstunde", () => "Spiele zwischen Mitternacht und ein Uhr.", { sprite: "moon" },
  () => new Date().getHours() === 0, { hidden: true });
ach("frenzy", "Doppelter Blutdurst", () => "Habe Blutrausch und Blutmond gleichzeitig.", { sprite: "potion" },
  (st) => !!(st.buffs.frenzy && st.buffs.bloodmoon), { hidden: true });
ach("speed", "Wahnsinn", () => "Klicke 12-mal in einer Sekunde.", { sprite: "demon" }, (st, g) => g.clickBurst >= 12, { hidden: true });

/* ---------- Chronik ---------- */
const has = (id, n = 1) => (st) => st.buildings[id] >= n;
SE.NEWS = [
  { t: "Der Herold verkündet: Die Nacht ist jung, und die Seelen sind willig." },
  { t: "Ein Rabe krächzt dreimal. Niemand weiß, was es bedeutet." },
  { t: "Wetterbericht: Nebel, später Nebel. Gegen Abend dichter Nebel." },
  { t: "Dorfbewohner berichten von einem Schädel, der leuchtet, wenn man ihn berührt." },
  { t: "Gelehrte streiten, ob eine Seele etwas wiegt. Erste Messungen ergeben 21 Gramm." },
  { t: "Ein Barde singt ein Lied über dich. Man hat ihn seitdem nicht mehr gesehen." },
  { t: "Die Nornen drehen ihr Rad nur einmal am Tag. Mehr erlaubt ihre Zunft nicht." },
  { t: "Irrlichter gesichtet. Wer ihnen folgt, wird reich oder landet im Sumpf." },
  { t: "Totengräber fordern einen Feiertag. Die Toten sind dagegen." },
  { t: "Ein Wanderer fragt nach dem Weg ins Licht. Man lacht ihn aus." },
  { t: "Friedhofswärter klagt: „Die Hände winken mir jeden Morgen zu.“", if: has("hand") },
  { t: "Handschuhmacher melden Rekordumsätze in der Größe „Skelett“.", if: has("hand", 10) },
  { t: "Besenverleih meldet Engpässe. Die Wartezeit beträgt drei Vollmonde.", if: has("witch") },
  { t: "Eine Hexe verflucht einen Steuereintreiber. Das Dorf feiert drei Tage lang.", if: has("witch", 5) },
  { t: "Grabsteinpreise steigen. Steinmetze kommen mit dem Meißeln kaum nach.", if: has("graveyard") },
  { t: "Archäologen öffnen eine Gruft. Kurz darauf öffnet die Gruft die Archäologen.", if: has("crypt") },
  { t: "Nekromantenturm sucht Lehrlinge. Voraussetzung: kein Puls.", if: has("tower") },
  { t: "Der Blutspendedienst beschwert sich über unlautere Konkurrenz.", if: has("altar") },
  { t: "Dämonen fordern die Fünf-Tage-Woche. Der Höllenfürst lacht sehr lange.", if: has("demon") },
  { t: "Ein Lich verlegt sein Phylakterium und findet es unter dem Sofa wieder.", if: has("lich") },
  { t: "Anwohner der Höllenportale klagen über Schwefelgeruch und Lärm.", if: has("portal") },
  { t: "Ein Drachenjunges schlüpft. Seine ersten Worte: „Mehr Seelen.“", if: has("egg") },
  { t: "Werwölfe melden Überstunden. Der Mond ist inzwischen dauerhaft voll.", if: has("moon") },
  { t: "Der Abgrund blickt zurück. Er wirkt ein wenig enttäuscht.", if: has("eye") },
  { t: "Priester warnen: Für den Himmel bleiben kaum noch Seelen übrig.", if: (st, g) => g.baseSps >= 1000 },
  { t: "Das Totenreich ist überfüllt. Charon verlangt jetzt Eintritt.", if: (st, g) => g.baseSps >= 1e5 },
  { t: "Selbst die Götter fragen inzwischen, wer du eigentlich bist.", if: (st, g) => g.baseSps >= 1e8 },
  { t: "Eine Seele bittet um Rückgabe. Antrag abgelehnt.", if: (st) => st.allTimeSouls >= 1e4 },
  { t: "In den Tavernen spricht man nur noch flüsternd von dir.", if: (st) => st.allTimeSouls >= 1e6 },
  { t: "Kartografen zeichnen dein Reich als großen schwarzen Fleck.", if: (st, g) => g.totalBuildings >= 100 },
  { t: "Ein Relikt flüstert nachts deinen Namen. Es klingt zufrieden.", if: (st) => st.relics.length >= 1 },
];
