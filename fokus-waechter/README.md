# Fokus-Wächter

Chrome-Erweiterung gegen zu viel YouTube und Instagram. Ein bisschen ist okay, zu viel nicht.

## Was sie macht

- **YouTube Shorts und Instagram Reels sind gesperrt.** Wer eine Shorts- oder Reels-Adresse öffnet, landet auf einer Sperrseite. Zusätzlich werden Shorts-Regale und Reels-Links auf den Seiten ausgeblendet.
- **Normales YouTube und Instagram bleiben erlaubt.** Die Zeit wird nur gezählt und unten rechts angezeigt.
- **Einstellungen sind gesperrt.** Zum Ändern gibt es einen Test: 10 Minuten auf der Einstellungsseite bleiben, und die Zeit läuft nur, solange die Seite im Vordergrund ist. Danach einen Satz von Hand abtippen, Einfügen ist gesperrt. Dann sind die Einstellungen 5 Minuten offen, und mit dem Speichern wird sofort wieder gesperrt. Direkt nach der Installation sind die Einstellungen 15 Minuten ohne Test offen.
- **Optionale Tageslimits** pro Seite mit Sperrseite und einer verzögerten Verlängerung um 5 Minuten. Ein leeres Feld bedeutet kein Limit.
- **Statistik** der letzten 7 Tage. Alle Daten bleiben lokal in deinem Browser.

## Installation (ca. 2 Minuten)

1. Diesen Ordner `fokus-waechter` auf deinen Computer laden. Auf GitHub: **Code → Download ZIP** wählen und das ZIP entpacken.
2. In Chrome `chrome://extensions` öffnen.
3. Oben rechts den **Entwicklermodus** einschalten.
4. **Entpackte Erweiterung laden** anklicken und den Ordner `fokus-waechter` auswählen. Gemeint ist der Ordner, in dem die `manifest.json` liegt.
5. Über das Puzzle-Symbol in der Chrome-Leiste den Fokus-Wächter **anheften**. Ein Klick darauf zeigt deinen heutigen Stand.

Den Ordner danach nicht löschen oder verschieben, sonst lädt Chrome die Erweiterung nicht mehr.

Funktioniert genauso in Edge, Brave, Opera und anderen Chromium-Browsern.

## Feste Sperre auf dem Mac (optional)

`fokus-waechter-sperre.mobileconfig` ist ein macOS-Konfigurationsprofil. Damit erzwingt Chrome selbst folgende Regeln:

- `youtube.com/shorts`, `instagram.com/reels` und `instagram.com/reel` sind gesperrt.
- `chrome://extensions` ist gesperrt. Der Fokus-Wächter lässt sich dort also nicht mehr ausschalten.
- Inkognito-Modus, Gastmodus und neue Chrome-Profile sind abgeschaltet.

**Reihenfolge beachten:** Erst die Erweiterung installieren, dann das Profil. Danach ist die Erweiterungsseite gesperrt.

1. Doppelklick auf `fokus-waechter-sperre.mobileconfig`.
2. **Systemeinstellungen → Allgemein → Geräteverwaltung** (bei älteren macOS-Versionen: **Datenschutz & Sicherheit → Profile**) öffnen, das Profil „Fokus-Wächter Sperre“ doppelklicken, **Installieren** wählen und das Mac-Passwort eingeben.
3. Chrome komplett beenden (⌘Q) und neu starten.
4. Prüfen: `chrome://policy` öffnen. Dort sollten `URLBlocklist` und die anderen Regeln stehen.

**Entfernen** (z. B. für ein Update): an derselben Stelle in den Systemeinstellungen das Profil auswählen, auf **–** klicken und das Mac-Passwort eingeben.

Für echte Härte: Lass jemand anderen das Admin-Passwort festlegen und nutze im Alltag ein Standard-Benutzerkonto ohne Adminrechte.

## Ehrlich gesagt

Ohne das Profil lässt sich die Erweiterung unter `chrome://extensions` jederzeit ausschalten. Mit Profil bleibt ein Weg: Puzzle-Symbol → ⋮ → „Aus Chrome entfernen“. Die Shorts- und Reels-Sperre des Profils gilt aber auch dann weiter. Andere Browser wie Safari sind nicht betroffen. Die lassen sich per Bildschirmzeit mit einem fremden Code begrenzen. Reels, die direkt im Instagram-Feed abgespielt werden, erkennt sie nicht. Sie sperrt aber den Reels-Bereich und jede Reel-Seite. YouTube und Instagram ändern ihre Seiten öfter, deshalb kann das Ausblenden einzelner Shorts-Elemente irgendwann nicht mehr greifen. Die Sperrseite für Shorts- und Reels-Adressen funktioniert davon unabhängig.

Auf dem Handy wirkt sie nicht. Dafür eignen sich die Bildschirmzeit (iPhone) bzw. das Digital Wellbeing (Android).
