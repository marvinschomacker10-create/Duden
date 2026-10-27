(() => {
  "use strict";

  // ---------------------------------------------------------------------------
  // Konfiguration
  // ---------------------------------------------------------------------------

  const LANGUAGES = [
    { code: "de", name: "Deutsch", speech: "de-DE", available: true },
    { code: "en", name: "Englisch", speech: "en-GB", available: true },
    { code: "fr", name: "Französisch", available: false },
    { code: "es", name: "Spanisch", available: false },
    { code: "it", name: "Italienisch", available: false },
  ];
  const LANG = Object.fromEntries(LANGUAGES.map((l) => [l.code, l]));
  const AVAILABLE = LANGUAGES.filter((l) => l.available).map((l) => l.code);

  const REGISTERS = [
    { id: "neutral", label: "Standard", hint: "Neutrale Standardsprache – passt fast immer." },
    { id: "gehoben", label: "Gehoben", hint: "Gewählte, literarische Ausdrucksweise." },
    { id: "formell", label: "Formell", hint: "Höflich und sachlich – für Behörden, Kunden und Bewerbungen." },
    { id: "umgangssprachlich", label: "Umgangssprachlich", hint: "Locker, wie im Gespräch unter Freunden." },
    { id: "slang", label: "Slang", hint: "Sehr salopp, Jugendsprache." },
    { id: "einfach", label: "Einfach", hint: "Kurze Sätze und einfache Wörter – ideal zum Lernen." },
  ];
  const REG = Object.fromEntries(REGISTERS.map((r) => [r.id, r]));

  const SAMPLE_WORDS = {
    de: ["Fernweh", "Gemütlichkeit", "Feierabend", "verschlimmbessern", "Kummerspeck", "Zeitgeist"],
    en: ["serendipity", "awkward", "cosy", "procrastinate", "gist", "wholesome"],
  };

  const POS_DE = {
    noun: "Substantiv", verb: "Verb", adjective: "Adjektiv", adverb: "Adverb",
    pronoun: "Pronomen", preposition: "Präposition", conjunction: "Konjunktion",
    interjection: "Interjektion", exclamation: "Ausruf",
  };

  const MAX_TEXT = 5000;

  // ---------------------------------------------------------------------------
  // Zustand
  // ---------------------------------------------------------------------------

  const store = {
    get(key, fallback) {
      try {
        const value = localStorage.getItem("wortwerk." + key);
        return value == null ? fallback : JSON.parse(value);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem("wortwerk." + key, JSON.stringify(value));
      } catch {
        // Speicher nicht verfügbar – Einstellungen gelten dann nur für diese Sitzung
      }
    },
  };

  const savedFrom = store.get("from", "de");
  const state = {
    view: "dictionary",
    from: AVAILABLE.includes(savedFrom) ? savedFrom : "de",
    to: "en",
    register: REG[store.get("register", "neutral")] ? store.get("register", "neutral") : "neutral",
    ai: false,
    statusKnown: false,
    history: store.get("history", []),
    current: null, // { entry, query, from, to }
  };
  state.to = otherLanguage(state.from);

  const lookupCache = new Map();

  const $ = (id) => document.getElementById(id);
  const el = {
    tabs: document.querySelectorAll(".tab"),
    views: { dictionary: $("view-dictionary"), translator: $("view-translator") },
    brandSub: $("brand-sub"),
    engine: $("engine"),
    engineLabel: $("engine-label"),
    from: $("lang-from"),
    to: $("lang-to"),
    swap: $("lang-swap"),
    registers: $("registers"),
    registerHint: $("register-hint"),
    searchForm: $("search-form"),
    searchInput: $("search-input"),
    result: $("dictionary-result"),
    source: $("source-text"),
    target: $("target-text"),
    paneFrom: $("pane-from"),
    paneTo: $("pane-to"),
    paneSwap: $("pane-swap"),
    clear: $("clear-btn"),
    charCount: $("char-count"),
    status: $("translate-status"),
    registerBadge: $("register-badge"),
    copy: $("copy-btn"),
    speak: $("speak-btn"),
    toast: $("toast"),
  };

  // ---------------------------------------------------------------------------
  // Hilfsfunktionen
  // ---------------------------------------------------------------------------

  function otherLanguage(code) {
    return AVAILABLE.find((c) => c !== code);
  }

  function h(tag, props, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(props || {})) {
      if (value == null || value === false) continue;
      if (key === "class") node.className = value;
      else if (key === "dataset") Object.assign(node.dataset, value);
      else if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
      else node.setAttribute(key, value === true ? "" : value);
    }
    for (const child of children.flat()) {
      if (child == null || child === false || child === "") continue;
      node.append(child instanceof Node ? child : String(child));
    }
    return node;
  }

  function icon(name) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "icon");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", "#i-" + name);
    svg.append(use);
    return svg;
  }

  let toastTimer;
  function toast(message) {
    el.toast.textContent = message;
    el.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (el.toast.hidden = true), 3200);
  }

  function speak(text, lang) {
    if (!text) return;
    if (!("speechSynthesis" in window)) {
      toast("Vorlesen wird von diesem Browser nicht unterstützt.");
      return;
    }
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG[lang].speech;
    speechSynthesis.speak(utterance);
  }

  function decodeEntities(text) {
    const area = document.createElement("textarea");
    area.innerHTML = text;
    return area.value;
  }

  // ---------------------------------------------------------------------------
  // Datenquellen: KI-Server oder kostenloser Basis-Modus
  // ---------------------------------------------------------------------------

  const ready = fetch("api/status")
    .then((res) => (res.ok ? res.json() : { ai: false }))
    .catch(() => ({ ai: false }))
    .then((status) => {
      state.ai = Boolean(status.ai);
      state.statusKnown = true;
      el.engine.title = status.model ? "Modell: " + status.model : "";
      renderEngine();
    });

  async function errorFrom(res) {
    let message = "Anfrage fehlgeschlagen (" + res.status + ").";
    try {
      message = (await res.json()).error || message;
    } catch {
      // keine JSON-Antwort
    }
    const error = new Error(message);
    error.status = res.status;
    return error;
  }

  // Ist der Key ungültig oder der KI-Modus aus, wechseln wir in den Basis-Modus.
  function handleAiFailure(error) {
    if (error.status !== 401 && error.status !== 503) return false;
    state.ai = false;
    renderEngine();
    toast(error.message + " Wechsle in den Basis-Modus.");
    return true;
  }

  async function lookup(word, from, to) {
    await ready;
    const key = [from, to, word.toLowerCase()].join("|");
    if (lookupCache.has(key)) return lookupCache.get(key);

    let entry;
    if (state.ai) {
      try {
        const res = await fetch("api/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ word, from, to }),
        });
        if (!res.ok) throw await errorFrom(res);
        entry = await res.json();
      } catch (error) {
        if (!handleAiFailure(error)) throw error;
      }
    }
    if (!entry) entry = await basicLookup(word, from, to);

    lookupCache.set(key, entry);
    return entry;
  }

  async function translateStream(text, { from, to, register, signal, onChunk }) {
    await ready;
    if (state.ai) {
      try {
        const res = await fetch("api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, from, to, register }),
          signal,
        });
        if (!res.ok) throw await errorFrom(res);
        await readNdjson(res, onChunk);
        return;
      } catch (error) {
        if (!handleAiFailure(error)) throw error;
      }
    }
    await basicTranslate(text, { from, to, signal, onChunk });
  }

  async function readNdjson(res, onChunk) {
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;
      let newline;
      while ((newline = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (!line) continue;
        const message = JSON.parse(line);
        if (message.error) throw new Error(message.error);
        if (message.t) onChunk(message.t);
      }
    }
  }

  // --- Basis-Modus: MyMemory (Übersetzung) + Free Dictionary API (Englisch) ---

  async function myMemory(text, from, to, signal) {
    const url =
      "https://api.mymemory.translated.net/get?q=" + encodeURIComponent(text) + "&langpair=" + from + "|" + to;
    let res;
    try {
      res = await fetch(url, { signal });
    } catch (error) {
      if (error.name === "AbortError") throw error;
      throw new Error("Der kostenlose Übersetzungsdienst ist gerade nicht erreichbar.");
    }
    if (!res.ok) throw new Error("Der kostenlose Übersetzungsdienst ist gerade nicht erreichbar.");
    const data = await res.json();
    if (Number(data.responseStatus) !== 200) {
      throw new Error(data.responseDetails || "Die Übersetzung ist fehlgeschlagen.");
    }
    return data;
  }

  // MyMemory erlaubt nur ~500 Zeichen pro Anfrage – längere Texte satzweise aufteilen.
  function chunkText(text, max = 450) {
    const parts = text.match(/[^.!?\n]+[.!?]*\s*|\n+\s*/g) || [text];
    const chunks = [];
    let current = "";
    for (const part of parts) {
      if (current && (current + part).length > max) {
        chunks.push(current);
        current = "";
      }
      if (part.length > max) {
        for (let i = 0; i < part.length; i += max) chunks.push(part.slice(i, i + max));
      } else {
        current += part;
      }
    }
    if (current) chunks.push(current);
    return chunks;
  }

  async function basicTranslate(text, { from, to, signal, onChunk }) {
    for (const chunk of chunkText(text)) {
      const core = chunk.trim();
      if (!core) {
        onChunk(chunk);
        continue;
      }
      const lead = chunk.match(/^\s*/)[0];
      const trail = chunk.match(/\s*$/)[0];
      const data = await myMemory(core, from, to, signal);
      onChunk(lead + decodeEntities(data.responseData.translatedText).trim() + trail);
    }
  }

  async function freeDictionary(word) {
    if (!word || /\s/.test(word.trim())) return null;
    try {
      const res = await fetch(
        "https://api.dictionaryapi.dev/api/v2/entries/en/" + encodeURIComponent(word.trim().toLowerCase()),
      );
      if (!res.ok) return null;
      const data = await res.json();
      if (!Array.isArray(data) || !data.length) return null;

      const phonetic =
        data.map((d) => d.phonetic || ((d.phonetics || []).find((p) => p.text) || {}).text).find(Boolean) || "";
      const groups = [];
      const synonyms = new Set();
      const antonyms = new Set();
      for (const item of data) {
        for (const meaning of item.meanings || []) {
          let group = groups.find((g) => g.pos === meaning.partOfSpeech);
          if (!group) groups.push((group = { pos: meaning.partOfSpeech, defs: [] }));
          for (const def of meaning.definitions || []) {
            if (group.defs.length < 4) group.defs.push({ definition: def.definition, example: def.example || "" });
            (def.synonyms || []).forEach((s) => synonyms.add(s));
            (def.antonyms || []).forEach((s) => antonyms.add(s));
          }
          (meaning.synonyms || []).forEach((s) => synonyms.add(s));
          (meaning.antonyms || []).forEach((s) => antonyms.add(s));
        }
      }
      return {
        word: data[0].word,
        phonetic,
        groups,
        synonyms: [...synonyms].slice(0, 8),
        antonyms: [...antonyms].slice(0, 6),
      };
    } catch {
      return null;
    }
  }

  async function basicLookup(word, from, to) {
    const data = await myMemory(word, from, to);
    const main = decodeEntities(data.responseData.translatedText).trim();
    // Weitere Treffer aus dem Übersetzungsspeicher, aber nur für genau dieses Wort
    const exact = (data.matches || []).filter(
      (m) => m.segment && m.segment.trim().toLowerCase() === word.toLowerCase(),
    );
    const seen = new Set([word.toLowerCase()]);
    const terms = [];
    for (const candidate of [main, ...exact.map((m) => m.translation)]) {
      const term = decodeEntities(candidate || "").trim();
      if (!term || term.length > 60 || seen.has(term.toLowerCase())) continue;
      seen.add(term.toLowerCase());
      terms.push(term);
      if (terms.length >= 8) break;
    }

    const english = await freeDictionary(from === "en" ? word : terms[0]);
    const fromEnglish = from === "en" && english;
    const pos = fromEnglish ? english.groups.map((g) => POS_DE[g.pos] || g.pos).join(", ") : "";

    return {
      basic: true,
      found: terms.length > 0 || Boolean(fromEnglish),
      headword: fromEnglish ? english.word : word,
      corrected_from: "",
      syllables: "",
      pronunciation: fromEnglish ? english.phonetic : "",
      part_of_speech: pos,
      grammar: "",
      frequency: 0,
      usage: "",
      meanings: [],
      translations: terms.map((term) => ({ term, register: "neutral", note: "" })),
      idioms: [],
      synonyms: fromEnglish ? english.synonyms : [],
      antonyms: fromEnglish ? english.antonyms : [],
      etymology: "",
      suggestions: [],
      english,
    };
  }

  // ---------------------------------------------------------------------------
  // Oberfläche: Navigation, Sprachen, Sprachstil
  // ---------------------------------------------------------------------------

  function setView(view, { focus = false } = {}) {
    state.view = view;
    el.tabs.forEach((tab) => {
      const active = tab.dataset.view === view;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    for (const [name, section] of Object.entries(el.views)) section.hidden = name !== view;
    el.brandSub.textContent = view === "dictionary" ? "Wörterbuch" : "Echtzeit-Übersetzer";
    const hash = view === "translator" ? "#uebersetzer" : "#woerterbuch";
    if (location.hash !== hash) history.replaceState(null, "", hash);
    renderRegisterHint();
    if (focus) (view === "dictionary" ? el.searchInput : el.source).focus();
  }

  function renderLanguageSelects() {
    for (const [select, value] of [[el.from, state.from], [el.to, state.to]]) {
      select.replaceChildren(
        ...LANGUAGES.map((lang) =>
          h("option", { value: lang.code, disabled: !lang.available }, lang.available ? lang.name : lang.name + " (bald)"),
        ),
      );
      select.value = value;
    }
    el.paneFrom.textContent = LANG[state.from].name;
    el.paneTo.textContent = LANG[state.to].name;
    el.searchInput.placeholder =
      state.from === "de" ? "Deutsches Wort nachschlagen …" : "Englisches Wort nachschlagen …";
    el.source.lang = state.from;
    el.target.lang = state.to;
  }

  function setLanguages(from, to) {
    if (from === to) to = otherLanguage(from);
    const changed = from !== state.from || to !== state.to;
    state.from = from;
    state.to = to;
    store.set("from", from);
    renderLanguageSelects();
    if (!changed) return;
    // Ein Eintrag gehört zu einer Sprachrichtung – nach dem Wechsel zur Startansicht.
    state.current = null;
    renderWelcome();
    scheduleTranslation(0);
  }

  function swapLanguages() {
    const output = el.target.classList.contains("is-error") ? "" : el.target.textContent;
    setLanguages(state.to, state.from);
    if (state.view === "translator" && output) {
      el.source.value = output.slice(0, MAX_TEXT);
      onSourceInput(0);
    }
  }

  function renderRegisters() {
    el.registers.replaceChildren(
      ...REGISTERS.map((reg) =>
        h(
          "button",
          {
            type: "button",
            class: "register",
            role: "radio",
            "aria-checked": String(reg.id === state.register),
            tabindex: reg.id === state.register ? "0" : "-1",
            dataset: { register: reg.id },
            title: reg.hint,
            onclick: () => setRegister(reg.id),
          },
          reg.label,
        ),
      ),
    );
    renderRegisterHint();
  }

  function setRegister(id) {
    if (id === state.register) return;
    state.register = id;
    store.set("register", id);
    renderRegisters();
    el.registers.querySelector('[aria-checked="true"]').focus();
    if (state.current) renderEntry(state.current, { animate: false });
    if (state.ai) scheduleTranslation(0);
  }

  function renderRegisterHint() {
    const reg = REG[state.register];
    let hint = reg.hint;
    let warn = false;
    if (state.statusKnown && !state.ai) {
      hint = "Basis-Modus: Sprachstile benötigen den KI-Modus (Server mit ANTHROPIC_API_KEY). Bis dahin wird neutral übersetzt.";
      warn = true;
    } else if (state.view === "dictionary") {
      hint += " Im Wörterbuch werden passende Übersetzungen hervorgehoben.";
    }
    el.registerHint.textContent = hint;
    el.registerHint.classList.toggle("warn", warn);
    el.registerBadge.textContent = "Stil: " + (state.statusKnown && !state.ai ? "Standard" : reg.label);
  }

  function renderEngine() {
    el.engine.classList.toggle("is-ai", state.ai);
    el.engine.classList.toggle("is-basic", state.statusKnown && !state.ai);
    el.engineLabel.textContent = !state.statusKnown ? "…" : state.ai ? "KI-Modus" : "Basis-Modus";
    renderRegisterHint();
  }

  // ---------------------------------------------------------------------------
  // Wörterbuch
  // ---------------------------------------------------------------------------

  function renderWelcome() {
    const recent = state.history.filter((item) => item.from === state.from).slice(0, 8);
    const chips = (words) =>
      h("div", { class: "chips" }, words.map((w) => h("button", { type: "button", class: "chip", onclick: () => search(w) }, w)));

    el.result.replaceChildren(
      h(
        "div",
        { class: "welcome" },
        h("h2", null, state.from === "de" ? "Deutsch – Englisch" : "Englisch – Deutsch"),
        h(
          "p",
          null,
          "Schlage ein Wort nach und erhalte Bedeutungen, Aussprache, Grammatik, Beispiele und Übersetzungen – sortiert nach Sprachstil.",
        ),
        recent.length ? h("div", { class: "chip-group" }, h("h3", null, "Zuletzt gesucht"), chips(recent.map((r) => r.word))) : null,
        SAMPLE_WORDS[state.from]
          ? h("div", { class: "chip-group" }, h("h3", null, "Zum Ausprobieren"), chips(SAMPLE_WORDS[state.from]))
          : null,
      ),
    );
  }

  function renderSkeleton() {
    const bar = (w, hgt) => h("div", { class: "sk", style: `width:${w};height:${hgt}px` });
    el.result.replaceChildren(
      h("div", { class: "skeleton", "aria-label": "Eintrag wird geladen" }, bar("38%", 50), bar("24%", 16), bar("100%", 86), bar("100%", 70), bar("70%", 16), bar("85%", 16)),
    );
  }

  let lookupId = 0;
  async function search(rawWord) {
    const word = rawWord.trim().replace(/\s+/g, " ");
    if (!word) return;
    el.searchInput.value = word;
    const id = ++lookupId;
    const { from, to } = state;
    renderSkeleton();
    try {
      const entry = await lookup(word, from, to);
      if (id !== lookupId) return;
      state.current = { entry, query: word, from, to };
      renderEntry(state.current, { animate: true });
      if (entry.found) remember(entry.headword || word, from);
    } catch (error) {
      if (id !== lookupId) return;
      state.current = null;
      el.result.replaceChildren(
        h(
          "div",
          { class: "message-box error" },
          h("h3", null, "Nachschlagen fehlgeschlagen"),
          h("p", null, error.message),
          h("button", { type: "button", class: "btn-ghost", onclick: () => search(word) }, "Erneut versuchen"),
        ),
      );
    }
  }

  function remember(word, from) {
    state.history = [{ word, from }, ...state.history.filter((i) => !(i.word === word && i.from === from))].slice(0, 20);
    store.set("history", state.history);
  }

  function section(title, ...content) {
    return h("section", { class: "section" }, h("h2", { class: "section-title" }, title), ...content);
  }

  function wordChips(words) {
    return h(
      "div",
      { class: "word-list" },
      words.map((w) => h("button", { type: "button", class: "chip", onclick: () => search(w) }, w)),
    );
  }

  function renderEntry({ entry, query, from, to }, { animate }) {
    if (!entry.found) {
      el.result.replaceChildren(
        h(
          "div",
          { class: "message-box" },
          h("h3", null, `Kein Eintrag für »${query}«`),
          h(
            "p",
            null,
            entry.suggestions && entry.suggestions.length
              ? "Meinten Sie vielleicht eines dieser Wörter?"
              : `Prüfe die Schreibweise oder die Sprachrichtung (${LANG[from].name} → ${LANG[to].name}).`,
          ),
          entry.suggestions && entry.suggestions.length ? wordChips(entry.suggestions) : null,
        ),
      );
      return;
    }

    const translations = entry.translations || [];
    const highlight = state.register === "einfach" ? "neutral" : state.register;
    const matches = entry.basic ? [] : translations.filter((t) => t.register === highlight);

    // Stil-Box: die passende Übersetzung für den gewählten Sprachstil
    let styleBox = null;
    if (translations.length) {
      const reg = REG[state.register];
      let label;
      let shown = matches;
      let note = "";
      if (entry.basic) {
        label = h("p", { class: "style-box-label" }, "Übersetzung");
        shown = translations.slice(0, 1);
      } else if (matches.length) {
        label = h("p", { class: "style-box-label" }, "Im Stil ", h("b", null, reg.label));
        note = matches[0].note;
      } else {
        const neutral = translations.filter((t) => t.register === "neutral");
        shown = neutral.length ? neutral : translations.slice(0, 1);
        label = h(
          "p",
          { class: "style-box-label" },
          "Für ",
          h("b", null, reg.label),
          " gibt es keine eigene Entsprechung – im Standard:",
        );
      }
      styleBox = h(
        "div",
        { class: "style-box", dataset: { register: entry.basic ? "neutral" : state.register } },
        label,
        h("p", { class: "style-box-terms", lang: to }, shown.map((t) => t.term).join(" · ")),
        note ? h("p", { class: "style-box-note" }, note) : null,
      );
    }

    const facts = [
      ["Worttrennung", entry.syllables],
      ["Aussprache", entry.pronunciation],
      ["Grammatik", entry.grammar],
      [
        "Häufigkeit",
        entry.frequency > 0
          ? h(
              "span",
              { class: "freq", "aria-label": `${Math.min(5, entry.frequency)} von 5` },
              [1, 2, 3, 4, 5].map((n) => h("i", { class: n <= entry.frequency ? "on" : "" })),
            )
          : "",
      ],
    ].filter(([, value]) => value);

    const article = h(
      "article",
      { class: animate ? "entry entry-in" : "entry" },
      entry.corrected_from
        ? h(
            "p",
            { class: "entry-notice" },
            `Gesucht: »${entry.corrected_from}« – angezeigt wird `,
            h("strong", null, entry.headword),
            ".",
          )
        : null,
      h(
        "div",
        { class: "entry-head" },
        h("h1", { class: "headword", lang: from }, entry.headword),
        h(
          "button",
          { type: "button", class: "icon-btn", "aria-label": "Aussprache anhören", title: "Aussprache anhören", onclick: () => speak(entry.headword, from) },
          icon("speak"),
        ),
      ),
      entry.part_of_speech || entry.usage
        ? h("p", { class: "entry-pos" }, entry.part_of_speech, entry.usage ? h("span", { class: "usage-tag" }, entry.usage) : null)
        : null,
      facts.length
        ? h("dl", { class: "facts" }, facts.map(([label, value]) => h("div", { class: "fact" }, h("dt", null, label), h("dd", null, value))))
        : null,
      styleBox,
      translations.length > 1 || (!entry.basic && translations.length)
        ? section(
            `Übersetzungen ins ${LANG[to].name}e`,
            h(
              "div",
              { class: "translations" + (matches.length ? " has-match" : "") },
              translations.map((t) =>
                h(
                  "div",
                  { class: "translation" + (matches.includes(t) ? " is-match" : ""), dataset: { register: t.register } },
                  h("div", { class: "translation-term", lang: to }, t.term),
                  t.note ? h("div", { class: "translation-note" }, t.note) : null,
                  entry.basic ? null : h("div", { class: "reg-tag" }, REG[t.register] ? REG[t.register].label : t.register),
                ),
              ),
            ),
          )
        : null,
      entry.meanings && entry.meanings.length
        ? section(
            "Bedeutungen",
            h(
              "ol",
              { class: "meanings" },
              entry.meanings.map((m) =>
                h(
                  "li",
                  { class: "meaning" },
                  h("p", { class: "meaning-def" }, m.definition),
                  m.translation ? h("p", { class: "meaning-tr", lang: to }, "→ " + m.translation) : null,
                  m.example
                    ? h(
                        "div",
                        { class: "example" },
                        h("p", { class: "example-src", lang: from }, m.example),
                        m.example_translation ? h("p", { class: "example-tr", lang: to }, m.example_translation) : null,
                      )
                    : null,
                ),
              ),
            ),
          )
        : null,
      entry.english && entry.english.groups.length
        ? section(
            from === "en" ? "Bedeutungen (Englisch)" : `Englische Bedeutungen von »${entry.english.word}«`,
            h(
              "div",
              { class: "definition-groups", lang: "en" },
              entry.english.groups.map((g) =>
                h(
                  "div",
                  { class: "definition-group" },
                  h("h4", null, POS_DE[g.pos] || g.pos),
                  h("ol", null, g.defs.map((d) => h("li", null, d.definition, d.example ? h("span", null, d.example) : null))),
                ),
              ),
            ),
          )
        : null,
      entry.idioms && entry.idioms.length
        ? section(
            "Wendungen & Redensarten",
            h(
              "ul",
              { class: "idioms" },
              entry.idioms.map((i) =>
                h("li", { class: "idiom" }, h("span", { class: "idiom-phrase", lang: from }, i.phrase), h("span", { class: "idiom-tr", lang: to }, i.translation)),
              ),
            ),
          )
        : null,
      (entry.synonyms && entry.synonyms.length) || (entry.antonyms && entry.antonyms.length)
        ? section(
            "Synonyme & Gegenteile",
            entry.synonyms.length ? wordChips(entry.synonyms) : null,
            entry.antonyms.length
              ? h("div", { style: "margin-top:16px" }, h("p", { class: "sub-label" }, "Gegenteil"), wordChips(entry.antonyms))
              : null,
          )
        : null,
      entry.etymology ? section("Herkunft", h("p", { class: "etymology" }, entry.etymology)) : null,
      h(
        "p",
        { class: "entry-foot" },
        entry.basic
          ? "Basis-Modus · Quellen: MyMemory, Free Dictionary API. Für vollständige Einträge den KI-Modus aktivieren."
          : "KI-generierter Eintrag · Angaben ohne Gewähr.",
      ),
    );

    el.result.replaceChildren(article);
  }

  // ---------------------------------------------------------------------------
  // Echtzeit-Übersetzer
  // ---------------------------------------------------------------------------

  let translateTimer;
  let translateController;

  function setStatus(text, busy) {
    el.status.textContent = text;
    el.status.classList.toggle("is-busy", Boolean(busy));
  }

  function onSourceInput(delay) {
    const length = el.source.value.length;
    el.charCount.textContent = `${length} / ${MAX_TEXT}`;
    el.clear.hidden = length === 0;
    scheduleTranslation(delay);
  }

  function scheduleTranslation(delay) {
    clearTimeout(translateTimer);
    if (delay == null) delay = state.ai ? 400 : 750;
    translateTimer = setTimeout(translateNow, delay);
  }

  async function translateNow() {
    if (translateController) translateController.abort();
    const text = el.source.value;
    if (!text.trim()) {
      translateController = null;
      el.target.textContent = "";
      el.target.classList.remove("is-stale", "is-error");
      setStatus("", false);
      return;
    }

    const controller = new AbortController();
    translateController = controller;
    let received = false;
    el.target.classList.remove("is-error");
    el.target.classList.add("is-stale");
    setStatus("übersetzt …", true);

    try {
      await translateStream(text, {
        from: state.from,
        to: state.to,
        register: state.register,
        signal: controller.signal,
        onChunk(chunk) {
          if (controller.signal.aborted) return;
          if (!received) {
            received = true;
            el.target.textContent = "";
            el.target.classList.remove("is-stale");
          }
          el.target.textContent += chunk;
        },
      });
      if (controller.signal.aborted) return;
      if (!received) el.target.textContent = "";
      el.target.classList.remove("is-stale");
      setStatus("", false);
    } catch (error) {
      if (controller.signal.aborted || error.name === "AbortError") return;
      el.target.classList.remove("is-stale");
      el.target.classList.add("is-error");
      el.target.textContent = error.message;
      setStatus("", false);
    } finally {
      if (translateController === controller) translateController = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Ereignisse
  // ---------------------------------------------------------------------------

  el.tabs.forEach((tab) => {
    tab.addEventListener("click", () => setView(tab.dataset.view, { focus: true }));
    tab.addEventListener("keydown", (event) => {
      const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
      if (!keys.includes(event.key)) return;
      event.preventDefault();
      const next = state.view === "dictionary" ? "translator" : "dictionary";
      setView(next);
      document.querySelector(`.tab[data-view="${next}"]`).focus();
    });
  });

  el.registers.addEventListener("keydown", (event) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const index = REGISTERS.findIndex((r) => r.id === state.register);
    setRegister(REGISTERS[(index + step + REGISTERS.length) % REGISTERS.length].id);
  });

  el.from.addEventListener("change", () => setLanguages(el.from.value, el.from.value === state.to ? state.from : state.to));
  el.to.addEventListener("change", () => setLanguages(el.to.value === state.from ? state.to : state.from, el.to.value));
  el.swap.addEventListener("click", swapLanguages);
  el.paneSwap.addEventListener("click", swapLanguages);

  el.searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    search(el.searchInput.value);
  });

  el.source.addEventListener("input", () => onSourceInput());
  el.source.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) onSourceInput(0);
  });
  el.clear.addEventListener("click", () => {
    el.source.value = "";
    onSourceInput(0);
    el.source.focus();
  });

  el.copy.addEventListener("click", async () => {
    const text = el.target.classList.contains("is-error") ? "" : el.target.textContent;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast("In die Zwischenablage kopiert.");
    } catch {
      toast("Kopieren nicht möglich.");
    }
  });
  el.speak.addEventListener("click", () => {
    if (!el.target.classList.contains("is-error")) speak(el.target.textContent, state.to);
  });

  window.addEventListener("hashchange", () => setView(location.hash === "#uebersetzer" ? "translator" : "dictionary"));

  // ---------------------------------------------------------------------------
  // Start
  // ---------------------------------------------------------------------------

  renderLanguageSelects();
  renderRegisters();
  renderEngine();
  renderWelcome();
  setView(location.hash === "#uebersetzer" ? "translator" : "dictionary");
})();
