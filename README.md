# Nährwerte

Essen abfotografieren, Nährwerte schätzen lassen, Kalorien pro Tag im Blick behalten.

Eine Web-App fürs Handy (PWA) ohne Server, ohne Account, ohne Build-Schritt.
Alle Mahlzeiten und Fotos bleiben auf deinem Gerät.

## Was die App kann

- **Foto → Nährwerte**: Mahlzeit fotografieren, Claude zerlegt sie in Komponenten und
  schätzt Menge, Kalorien, Eiweiß, Kohlenhydrate und Fett
- **Alles korrigierbar**: jede Zahl ist editierbar, ein Portionsregler skaliert die
  ganze Mahlzeit auf einmal (25–250 %)
- **Tagesübersicht**: Kalorienring gegen dein Tagesziel, Makrobalken, Mahlzeiten nach
  Frühstück / Mittag / Abend / Snack gruppiert
- **Verlauf**: Balkendiagramm der letzten 7 oder 30 Tage, Durchschnittswerte, Tage im Ziel
- **Favoriten**: häufige Mahlzeiten mit einem Tipp erneut eintragen — ohne Foto, ohne Kosten
- **Ohne Internet nutzbar**: alles außer der Foto-Analyse funktioniert offline
- **Von Hand eintragen**: die App ist auch ganz ohne API-Key voll benutzbar

## Einrichten

### 1. API-Key holen

Die Foto-Analyse läuft über die Anthropic-API mit **deinem eigenen Schlüssel**.

1. Konto anlegen auf [console.anthropic.com](https://console.anthropic.com)
2. Unter **Settings → API keys** einen neuen Key erstellen (beginnt mit `sk-ant-`)
3. Unter **Billing** Guthaben aufladen — **Minimum 5 $**

**Was das kostet:** Der Key selbst ist kostenlos, es gibt kein Abo und keine
Grundgebühr. Du zahlst nur, was du verbrauchst:

| Modell | pro Foto | 5 $ Guthaben reichen für |
|---|---|---|
| **Haiku 4.5** (Voreinstellung) | ca. 0,4 Cent | ~1.250 Fotos |
| Sonnet 5 | ca. 1,2 Cent | ~420 Fotos |
| Opus 5 | ca. 2 Cent | ~250 Fotos |

Bei drei Mahlzeiten am Tag reichen 5 $ mit Haiku gut über ein Jahr. Ist das Guthaben
leer, hört die Analyse einfach auf — es wird nichts automatisch abgebucht.

> Dein Claude-Abo auf claude.ai und der API-Key sind zwei getrennte Dinge.
> Das Abo gibt keinen API-Zugang.

### 2. App veröffentlichen (GitHub Pages)

Die App braucht HTTPS — sonst erlaubt der Browser keinen Kamerazugriff.
GitHub Pages liefert das kostenlos:

1. Im Repository auf **Settings → Pages**
2. Unter *Source* **Deploy from a branch** wählen
3. Branch auf `main` (oder den Branch mit diesem Code), Ordner `/ (root)`
4. Speichern und ein paar Minuten warten

Danach ist die App erreichbar unter
`https://<dein-benutzername>.github.io/<repo-name>/`

### 3. Aufs Handy legen

Die URL im Handy-Browser öffnen, dann:

- **iPhone (Safari)**: Teilen-Symbol → *Zum Home-Bildschirm*
- **Android (Chrome)**: Menü ⋮ → *App installieren* bzw. *Zum Startbildschirm zufügen*

Sie verhält sich danach wie eine normale App: eigenes Icon, kein Browser-Rahmen,
startet auch ohne Netz.

### 4. Key eintragen

In der App unten rechts auf **Mehr** → API-Key einfügen → **Key speichern** →
**Verbindung testen**. Der Test kostet Bruchteile eines Cents und sagt dir sofort,
ob Key und Guthaben funktionieren.

## Datenschutz und Sicherheit

- **Mahlzeiten und Fotos bleiben auf dem Gerät** (IndexedDB). Es gibt keinen Server
  und keine Übertragung an Dritte.
- **Nur das jeweils analysierte Foto** wird an `api.anthropic.com` geschickt.
- **Der API-Key liegt unverschlüsselt** in der Browser-Datenbank dieses Geräts. Das
  ist bei diesem Muster ("bring your own key") normal, heißt aber: wer Zugriff auf
  dein entsperrtes Handy hat, kann ihn auslesen.
  **Empfehlung:** einen eigenen Key nur für diese App anlegen — dann lässt er sich im
  Anthropic-Konto einzeln widerrufen, ohne andere Dinge zu stören.
- Beim Löschen der Browserdaten für diese Seite sind auch die Mahlzeiten weg.
  Unter *Mehr → Daten exportieren* gibt es eine Sicherungsdatei (ohne Fotos, ohne Key).

## Lokal ausprobieren

```bash
python3 -m http.server 8000
```

Dann `http://localhost:8000` öffnen. `localhost` gilt als sicherer Kontext, deshalb
funktionieren dort Kamera und Service Worker auch ohne HTTPS.

## Aufbau

```
index.html               App-Shell
css/app.css              Design-Tokens, Light/Dark, Komponenten
js/app.js                Routing, gemeinsamer Zustand, Bootstrap
js/store.js              IndexedDB: Mahlzeiten, Favoriten, Einstellungen
js/nutrition.js          Summen, Datumslogik, Portionsskalierung
js/claude.js             Anthropic-API: Prompt, JSON-Schema, Fehlerübersetzung
js/image.js              Kamera-Foto verkleinern, Thumbnail, Base64
js/ui.js                 DOM-Helfer
js/views/                today · capture · history · favorites · settings
sw.js                    Service Worker (Offline-Betrieb)
manifest.webmanifest     PWA-Manifest
```

Reine ES-Module, keine Abhängigkeiten, kein Build. Änderungen an den App-Dateien
brauchen eine neue `CACHE_VERSION` in `sw.js`, damit Geräte die neue Fassung laden.

## Technische Anmerkungen

- Die App ruft die Anthropic-API direkt aus dem Browser auf. Das erlaubt Anthropic
  mit dem Header `anthropic-dangerous-direct-browser-access: true` ausdrücklich für
  genau diesen Fall — deshalb braucht es keinen Proxy-Server.
- Die Antwort wird über **Structured Outputs** (`output_config.format`) erzwungen,
  ist also garantiert gültiges JSON nach festem Schema. Kein Parsen aus Fließtext.
- Fotos werden vor dem Senden auf 1024 px lange Kante verkleinert. Das halbiert
  ungefähr die Bildkosten, ohne die Erkennung von Essen spürbar zu verschlechtern.
- Der Tag richtet sich nach dem **lokalen** Kalendertag, nicht nach UTC — sonst
  würden späte Mahlzeiten auf dem falschen Tag landen.
- Schlägt die Analyse fehl (kein Netz, Guthaben leer, Key ungültig), bleibt das Foto
  erhalten und die Mahlzeit lässt sich von Hand eintragen. Es geht nie etwas verloren.
