# Veröffentlichen — was du selbst machen musst

Der Code ist fertig und getestet. Die folgenden Schritte kann nur jemand mit deinem
Namen und deiner Bankverbindung erledigen — deshalb machst du sie.

Reihenfolge einhalten: Schritt 3 ist der lange, der zwei Wochen dauert.

---

## 1. Erst auf deinem Handy ausprobieren (kostenlos, 10 Minuten)

Bevor du 25 € ausgibst, schau dir die App auf deinem Gerät an.

1. **Expo Go** aus dem Play Store oder App Store installieren.
2. Am Rechner im Ordner `app/`:
   ```
   npm install
   npx expo start
   ```
3. Den QR-Code mit Expo Go scannen (Android) bzw. mit der Kamera (iOS).

Damit prüfst du, was ich hier nicht testen konnte:

- Kommt die **tägliche Erinnerung** zur eingestellten Uhrzeit?
- Spürst du das **Vibrieren** bei jedem Wechsel?
- Bleibt der **Bildschirm an**, während die Einheit läuft?
- Fühlt sich das Tempo auf deinem Gerät richtig an?

---

## 2. Konten anlegen

| Konto | Kosten | Wofür |
|---|---|---|
| [expo.dev](https://expo.dev) | kostenlos | baut die App in der Cloud, du brauchst keinen Mac |
| [Play Console](https://play.google.com/console) | **25 $ einmalig** | Veröffentlichung bei Google |

Bei Google gehört eine Identitätsprüfung dazu — das dauert manchmal ein paar Tage.
Fang also früh damit an.

---

## 3. Geschlossener Test — 12 Personen, 14 Tage

**Das ist die längste Hürde.** Neue private Entwicklerkonten müssen vor der
Veröffentlichung einen geschlossenen Test bestehen:

- mindestens **12 Testpersonen**
- **14 zusammenhängende Tage** angemeldet
- fällt jemand raus, beginnt die Frist von vorn

Die Testpersonen müssen die App nur installieren und ab und zu öffnen — nicht wirklich
trainieren. Freunde und Familie reichen. **Frag lieber 15 statt 12**, damit Ausfälle
die Frist nicht zurücksetzen.

Praktisch: Diese zwei Wochen sind zugleich der Test, ob überhaupt jemand dranbleibt.

---

## 4. Vor dem Hochladen erledigen

- [ ] In `datenschutz.html` **Name, Anschrift und E-Mail** eintragen. Ohne
      Verantwortlichen lehnt Google die Datenschutzerklärung ab.
- [ ] Prüfen, ob `android.package` in `app/app.json` so bleiben soll. Aktuell:
      `com.beckenboden.training`. **Nach der ersten Veröffentlichung lässt sich das
      nie wieder ändern.**
- [ ] Eine **Feature-Grafik 1024 × 500** erstellen (Pflicht im Store).

---

## 5. Bauen und hochladen

Im Ordner `app/`:

```bash
npx eas login
npx eas build:configure          # legt die Projekt-ID an
npx eas build --platform android --profile production
npx eas submit --platform android
```

Der Bau läuft auf Expos Rechnern, du brauchst weder Mac noch Android Studio.

Danach im Play Console den Store-Eintrag ausfüllen — die fertigen Texte stehen in
`play-listing.md`, die Screenshots liegen in `screenshots/`.

---

## 6. Später iOS

Der Code ist derselbe. Es kommt dazu:

- Apple Developer Program, **99 $ pro Jahr**
- strengere Prüfung, aber **keine** 12-Tester-Auflage
- `npx eas build --platform ios` und `npx eas submit --platform ios`

Mein Rat: erst, wenn Android zeigt, dass Leute die App wirklich benutzen.

---

## Was inhaltlich gilt

Die App ist als **Fitness- und Wellness-App** positioniert. Schreib nirgends, dass sie
bei Inkontinenz oder anderen Beschwerden *hilft* — sobald ein Heilversprechen im Spiel
ist, gilt sie in der EU als Medizinprodukt und braucht CE-Kennzeichnung,
technische Dokumentation und Risikomanagement.

Und der ehrliche Hinweis, der auch in der App steht: **die Trainingszeiten sind von mir
plausibel gewählt, nicht klinisch geprüft.** Für dich persönlich ist das in Ordnung. Wenn
Fremde die App benutzen, wäre der Blick einer Physiotherapeutin oder eines Urologen
darauf das Richtige — spätestens bevor du sie größer bewirbst.
