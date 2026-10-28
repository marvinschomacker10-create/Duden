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
index.html         Die ganze Seite als einzelne Datei – per Doppelklick öffnen, läuft im Basis-Modus ohne Server
```

## Seelenernte (Spiel)

Im Ordner `seelenernte/` liegt ein Klickspiel nach dem Vorbild von Cookie Clicker, im Dark-Fantasy-Stil und in Pixel-Optik wie bei alten 8-Bit-Konsolen. Statt Kekse zu backen, erntest du Seelen, indem du auf einen leuchtenden Schädel klickst.

**Starten:** `seelenernte/index.html` per Doppelklick im Browser öffnen. Ein Server ist nicht nötig. Der Spielstand wird automatisch im Browser gespeichert.

- **12 Gebäude** von der Knochenhand über Hexe, Friedhof, Gruft und Nekromantenturm bis zum Auge des Abgrunds
- **93 Verbesserungen**: Stufen für jedes Gebäude, Klingen für stärkere Klicks, Opfergaben und Irrlicht-Köder
- **96 Trophäen**, darunter geheime. Jede bringt +1 % Seelen pro Sekunde
- **Irrlichter** schweben ab und zu über den Bildschirm. Wer sie fängt, bekommt einen Seelenregen, einen Blutrausch (×7) oder die Dämonenklaue (Klicks ×777)
- **Schicksalsrad** (eigener Reiter): einmal pro Tag drehen. Zu gewinnen sind Seelen, Blutmond, Höllenfaust, Gratis-Gebäude, Irrlicht-Schwärme, dauerhafte Relikte und als Hauptgewinn der Drachenschatz. Wer an mehreren Tagen hintereinander dreht, bekommt bis zu +60 % mehr Seelen vom Rad
- **Ritual der Wiedergeburt**: das Reich opfern und dafür Schattenessenz erhalten, die dauerhaft stärker macht
- Chronik mit Meldungen aus dem Reich, 8-Bit-Klänge, Ernte während der Abwesenheit, Export und Import des Spielstands; läuft auch auf dem Handy

Das ganze Spiel steckt in der einen Datei `seelenernte/index.html`, du kannst sie also einfach kopieren oder weitergeben. Nur die Pixelschriften lädt sie aus dem Internet (Google Fonts); ohne Verbindung erscheint eine Ersatzschrift. Innerhalb der Datei folgen nacheinander:

```
<style>   Pixel-Optik
<script>  Pixelgrafiken als Zeichenraster
<script>  Spielinhalte: Gebäude, Verbesserungen, Trophäen, Relikte, Schicksalsrad, Chronik
<script>  Spiellogik und Oberfläche
```

## Weitere Sprachen hinzufügen

1. In `server.js` die Sprache in `LANGUAGES` ergänzen.
2. In `public/app.js` bei der Sprache in `LANGUAGES` `available: true` setzen und `speech` (z. B. `"fr-FR"`) angeben; bei Bedarf Beispielwörter in `SAMPLE_WORDS`.
