# Musterprüfung — Befunde am echten Gerät

**Geprüftes Gerät: ScPanda GB-868.** Ein Muster, bestellt ~13. August, angekommen
5. September — **23 Tage Laufzeit**, die Schätzung von drei Wochen war richtig.

Von Youmei wurde **kein** Muster bestellt. Ein Quervergleich der beiden Bauformen ist
damit nicht möglich; die Drucksensorik hängt allein an der schriftlichen Bestätigung
durch ScPanda.

**Stufe 1 des Testplans bestanden** (Stand 5. September): keine Wärmeentwicklung unter
Dauerlast, und der Bogen erreicht den eigenen Rücken. Damit trägt das Kernversprechen
der Landingpage.

---

## Befund 1 — Das Gerät hat eine Drucksensorik

**Beobachtung:** Bei stärkerem Andruck gegen den Körper läuft der Motor schneller
und die Massage wird deutlich intensiver.

**Messung:**

| Prüfung | Ergebnis |
|---|---|
| Stufenanzeige bei Andruck | **bleibt unverändert** |
| Tonhöhe bei Andruck (= Schlagfrequenz) | **steigt hörbar** |
| Andruck auf Stufe 9 | **wird noch schneller** |

**Auswertung:** Ein elektrischer Fehler — etwa eine Überbrückung der Leistungs-
regelung durch Gehäuseverformung — könnte den Motor höchstens auf Stufe-9-Niveau
bringen. Vollgas ist Vollgas. Dass der Andruck *über* Stufe 9 hinausführt, heißt:
Die neun Stufen sind nicht das Maximum. Der Controller hält Reserve zurück und gibt
sie unter Last frei.

**Das ist eine gewollte Funktion, kein Defekt.** Sie steht in keinem Listing und in
keiner Anleitung.

### Drei Folgen

**1. Ein Verkaufsargument, das der Wettbewerb wahrscheinlich nicht hat.**
Die Intensität wird über den Andruck gesteuert, nicht nur über die Stufe. Das Gerät
gibt nach, wenn man mehr braucht. RENPHO für 39,99 € bewirbt so etwas nicht. Genau
die Art Unterschied, die einen Preisaufschlag trägt — **sobald der Lieferant es
schriftlich bestätigt hat.** Ohne Bestätigung darf es nicht auf die Seite.

**2. Der Sicherheitshinweis muss größer werden, nicht kleiner.**
Die FAQ sagt: nicht auf Knochen, zwei Finger Abstand zur Wirbelsäule, höchstens
15 Sekunden je Punkt. Wenn das Gerät bei stärkerem Andruck **automatisch** stärker
wird, bekommt ein Nutzer, der fester drückt, mehr als er erwartet — und zwar
unangekündigt. Der Hinweis gehört an den Anfang des Anwendungsteils.

**3. Die Laufzeitangabe der Seite ist jetzt fraglich.**
Bisherige Rechnung: 1200 mAh × 7,4 V = 8,9 Wh, bei 20 W rund 27 Minuten
Dauerbetrieb. Mit Leistungsreserve über Stufe 9 liegt die Aufnahme unter Andruck
höher — 25 bis 30 W sind plausibel, das wären **18 bis 21 Minuten**.

Die Seite verspricht **30–35 Minuten**. Das ist unter realer Nutzung womöglich zu
hoch gegriffen, und eine zu hohe Laufzeitangabe ist ein Retourengrund und
wettbewerbsrechtlich angreifbar.

- [ ] **Laufzeit unter Andruck messen**, nicht frei laufend. Beide Werte notieren
      und den niedrigeren auf die Seite schreiben

---

## Offen — bevor die 50 Stück bestellt werden

- [ ] **Zweites Muster prüfen:** Macht es dasselbe? Beide gleich = Merkmal der
      Bauform. Nur eins = doch ein Fehler, und der andere Lieferant gewinnt
- [ ] **Wärmeprüfung:** 60 Sekunden fest andrücken auf Stufe 9, danach das Gehäuse
      am Motor anfassen. Wärme entscheidet über die Lebensdauer — zwei Jahre
      Gewährleistung liegen bei dir
- [ ] **Lieferantenbestätigung** der Drucksensorik, schriftlich
- [ ] Lautstärke in dB, frei und unter Andruck
- [ ] Laufzeit Stufe 1 und Stufe 9, unter Andruck
- [ ] Gewicht: ohne Zubehör, mit einem Aufsatz, Gesamtpaket
- [ ] Aufsätze zählen — vier oder fünf?
- [ ] Kerntest: Kommt man mit dem Bogen allein zwischen die Schulterblätter?
- [ ] Importeurangabe auf Gerät oder Verpackung vorhanden?

## Anfrage an den Lieferanten

> Does the GB-868 have a pressure or load sensor that increases motor power when the
> head is pressed harder against the body? Our sample speeds up noticeably under
> pressure — the pitch of the motor rises and it goes beyond speed level 9 — while
> the displayed speed level stays unchanged.
>
> 1. Is this intended behaviour, and how is it called?
> 2. What is the power consumption under load compared to level 9 unloaded?
> 3. What is the real battery runtime under load, not free-running?
> 4. Please confirm in writing, as we intend to describe this feature on our website.
