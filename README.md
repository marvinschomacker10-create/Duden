# Wortwerk

Wörterbuch und Echtzeit-Übersetzer für **Deutsch ↔ Englisch**, im Stil eines Nachschlagewerks wie dem Duden, mit schwarzem Interface.

- **Wörterbuch**: Worttrennung, Aussprache (IPA), Wortart, Grammatik, Häufigkeit, Bedeutungen mit Beispielsätzen, Übersetzungen, Wendungen, Synonyme, Gegenteile und Herkunft. Tippfehler werden erkannt („Gesucht: … – angezeigt wird …“).
- **Echtzeit-Übersetzer** (Reiter links): übersetzt beim Tippen und zeigt die Übersetzung Wort für Wort, während sie entsteht.
- **Sprachstile**: Standard, Gehoben, Formell, Umgangssprachlich, Slang, Einfach. Im Übersetzer bestimmt der Stil die Übersetzung, im Wörterbuch werden die passenden Übersetzungen hervorgehoben.
- **Sprachwahl oben rechts** mit Tausch-Knopf. Weitere Sprachen sind schon als „bald“ vorgesehen.
- Vorlesen (Sprachausgabe des Browsers), Kopieren, Suchverlauf, funktioniert auch auf dem Handy.

## Starten

Voraussetzung: [Node.js](https://nodejs.org) ab Version 20.12.

```bash
npm install
cp .env.example .env   # dann ANTHROPIC_API_KEY in .env eintragen
npm start
```

Danach im Browser **http://localhost:3000** öffnen.

Einen API-Key bekommst du unter [platform.claude.com](https://platform.claude.com/settings/keys). Er bleibt auf dem Server und wird nie an den Browser geschickt.

### Ohne API-Key (Basis-Modus)

Ohne Key läuft die Seite trotzdem: Übersetzungen kommen dann vom kostenlosen Dienst [MyMemory](https://mymemory.translated.net), englische Definitionen von der [Free Dictionary API](https://dictionaryapi.dev). Sprachstile und ausführliche Wörterbucheinträge gibt es nur im KI-Modus. Unten links in der Seitenleiste steht, welcher Modus aktiv ist.

## Konfiguration (`.env`)

| Variable | Standard | Bedeutung |
|---|---|---|
| `ANTHROPIC_API_KEY` | – | Schaltet den KI-Modus ein |
| `PORT` | `3000` | Port des Servers |
| `WORTWERK_MODEL` | `claude-opus-5-5` | Claude-Modell |
| `WORTWERK_EFFORT` | `low` | Denkaufwand (`low` … `max`); `low` hält den Übersetzer schnell |
| `AI_MODE` | – | `off` erzwingt den Basis-Modus |

**Kosten:** Jede Suche und jede Tipp-Pause im Übersetzer ist eine API-Anfrage. Der Übersetzer wartet 400 ms nach dem letzten Tastendruck und bricht veraltete Anfragen ab. Gleiche Wörterbuchanfragen werden zwischengespeichert. Lehnt das Modell eine Anfrage ab, beantwortet die API sie automatisch mit einem Ersatzmodell (`fallbacks: "default"`).

## Aufbau

```
server.js          Node-Server: liefert die Seite aus, /api/lookup (Wörterbuch), /api/translate (Streaming)
public/index.html  Oberfläche
public/styles.css  Schwarzes Design
public/app.js      Logik im Browser (inkl. Basis-Modus)
```

## Weitere Sprachen hinzufügen

1. In `server.js` die Sprache in `LANGUAGES` ergänzen.
2. In `public/app.js` bei der Sprache in `LANGUAGES` `available: true` setzen und `speech` (z. B. `"fr-FR"`) angeben; bei Bedarf Beispielwörter in `SAMPLE_WORDS`.
