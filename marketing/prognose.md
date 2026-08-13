# Durchrechnung und Erfolgsaussicht

Stand: 12. August 2026. Grundlage für die Entscheidung, ob und wie gestartet wird.

**Vorbemerkung zur Ehrlichkeit dieser Rechnung:** Die Kostenseite ist belastbar. Die
Wahrscheinlichkeiten sind begründete Einschätzungen, keine Messwerte — sie stützen sich
auf die Bandbreiten aus `instagram-plan.md`, auf `wettbewerb.md` und auf allgemeine
Erfahrungswerte für Erstkampagnen. Wer andere Annahmen für richtig hält, bekommt andere
Zahlen. Die Rechenwege stehen deshalb offen da.

---

## Teil 1 — Was der Trichter hergibt

Werbebudget 700 € (was Meta abrechnet; die 19 % nach § 13b kommen für dich obendrauf,
erzeugen aber keine Reichweite).

| | schlecht | mittel | gut |
|---|---|---|---|
| CPM | 15 € | 12 € | 10 € |
| **Impressionen** | 46.700 | 58.300 | 70.000 |
| Klickrate | 1,0 % | 1,5 % | 2,0 % |
| **Klicks auf die Seite** | 467 | 875 | 1.400 |
| CPC | 1,50 € | 0,80 € | 0,50 € |
| Kaufrate der Seite | 0,5 % | 1,2 % | 2,5 % |
| **Verkäufe** | **2** | **10** | **35** |
| CPA | 304 € | 67 € | 20 € |

Zum Vergleich: Break-even-CPA liegt bei **44 €**.

**Damit ist die entscheidende Einsicht schon da:** Das mittlere Szenario verliert Geld.
Nicht das schlechte — das mittlere. Bei 10 Verkäufen und 67 € CPA zahlst du für jeden
Verkauf 23 € drauf.

### Was wahr sein müsste

Rückwärts gerechnet, welche Kaufrate der Seite nötig ist:

| Ziel | Verkäufe | nötige Kaufrate |
|---|---|---|
| Die Werbung trägt sich selbst | 16 | **1,1–1,8 %** |
| Der **gesamte** Einsatz kommt zurück | 36 | **2,6–4,1 %** |

Ein etablierter deutscher Shop liegt bei 2–3 % Kaufrate — bei bekannten Marken,
Bewertungen und meist billigeren Produkten. Für eine unbekannte Marke, ohne eine
einzige Bewertung, zu 79,99 € gegen einen bekannten Wettbewerber zu 39,99 € sind
**1–1,5 % ein gutes Ergebnis.**

Daraus folgt nüchtern:

- **„Die Kampagne trägt sich"** ist erreichbar, aber nicht wahrscheinlich.
- **„Alles kommt in Runde 1 zurück"** verlangt eine Kaufrate, die deutlich über dem
  liegt, was für diese Ausgangslage realistisch ist.

---

## Teil 2 — Ein strukturelles Problem, das im Plan nicht steht

**25 € Tagesbudget sind für Meta zu wenig, um auf Käufe zu optimieren.**

Der Algorithmus braucht Signale. Als Faustzahl gelten rund 50 Conversions pro Anzeigengruppe
und Woche, damit die Lernphase abgeschlossen wird. Bei 25 €/Tag und einem 80-€-Produkt
bekommst du **1 bis 3 Käufe pro Woche**. Die Kampagne kommt aus der Lernphase nie
heraus, und die Auslieferung bleibt dauerhaft schlechter als das, was Meta eigentlich
kann.

Das verschiebt alle drei Spalten oben nach unten, nicht nur die schlechte.

**Gegenmittel:**

- Zu Beginn auf ein **häufigeres Ereignis** optimieren — `AddToCart` oder
  `InitiateCheckout` statt `Purchase`. Davon gibt es zehn- bis zwanzigmal so viele,
  die Lernphase schließt.
- Erst auf `Purchase` umstellen, wenn genug Kaufdaten da sind.
- **Eine** Anzeigengruppe, nicht drei. Das Budget nicht zersplittern.

Das ist kein Detail, sondern einer der Gründe, warum Erstkampagnen mit kleinem Budget
scheitern, obwohl Produkt und Anzeige in Ordnung waren.

---

## Teil 3 — Die drei Wege durchgerechnet

### Weg A — Eigenimport, 50 Stück, volle Kampagne

| | |
|---|---|
| Muster | 25 € |
| Registrierungen, Garantie, Rechtstexte | ~600 € |
| Shop, 3 Monate | ~100 € |
| Ware, 50 Stück gelandet | ~645 € |
| Werbung | 833 € |
| **Einsatz gesamt** | **~2.200 €** |

Deckungsbeitrag je Verkauf: **52 €** · Break-even: **36 Geräte**

**Bei Misserfolg:** Die Ware behält Wert. 50 Geräte zu 25–35 € abverkauft bringen
1.250–1.750 € zurück. Realistischer Maximalverlust: **1.200–1.500 €.**

### Weg B — Bezug über EU-Händler, ohne eigenes Lager

Kein Eigenimport, also kein EAR, keine Batterieregistrierung, keine Garantie, kein
Zoll, keine 6–8 Wochen Wartezeit. Ware wird bestellt, wenn ein Kunde kauft.

| | |
|---|---|
| LUCID + duales System (nur Versandkarton) | ~50 € |
| Rechtstexte | ~250 € |
| Shop, 3 Monate | ~100 € |
| Werbung | 833 € |
| Ware — nur was verkauft wird, ~25 €/Stück | variabel |
| **Fixer Einsatz** | **~1.230 €** |

Deckungsbeitrag je Verkauf: **~45 €** · Break-even: **28 Geräte**

**Bei Misserfolg:** Kein Lagerrisiko. Und der wichtigste Unterschied — nach einer
Woche Kampagne (175 €) kannst du abbrechen. Verlust dann: **~600 €.**

### Weg C — Nachfragetest zuerst

Landingpage mit Warteliste statt Kaufknopf, kostenlos gehostet. Preis sichtbar.
Zwei Wochen, 200 € Anzeigen.

| | |
|---|---|
| Muster, damit du das Produkt kennst | 25 € |
| Domain | 15 € |
| Werbung | 238 € |
| **Einsatz gesamt** | **~280 €** |

Kein Verkauf, also keine Registrierungen nötig. Du erfährst Hook-Rate, Klickrate und
— der eigentliche Punkt — ob Leute ihre Mailadresse dalassen, **nachdem** sie 99,99 €
gesehen haben.

**Grenze dieses Wegs:** Eine Mail ist kein Kauf. Wartelisten überschätzen echte
Nachfrage immer. Der Test beantwortet zuverlässig, ob der Aufhänger trägt — nicht, ob
79,99 € bezahlt werden.

---

## Teil 4 — Wie wahrscheinlich ist es?

Begründete Schätzung, keine Messung.

| Ergebnis | Wahrscheinlichkeit |
|---|---|
| Mindestens ein Verkauf | **~85–90 %** |
| Die Werbung trägt sich (16+ Verkäufe) | **~25 %** |
| Der gesamte Einsatz kommt zurück (36+) | **~10 %** |
| Klar profitabel, ROAS über 2,5 | **~10 %** |

### Was dafür spricht

- **Der Bogengriff löst ein echtes, benennbares Problem.** „Zwischen die eigenen
  Schulterblätter kommen" ist ein Satz, den man in drei Sekunden versteht — genau
  das, was ein Reel braucht.
- **Die Zahlungsbereitschaft im Segment existiert.** Beurer verkauft für 117 € ein
  Gerät *ohne* Griffverlängerung.
- **Die Landingpage steht** und ist inhaltlich durchgearbeitet, nicht improvisiert.
- **DACH ist ein kaufkräftiger Markt** mit ordentlichen Conversion-Raten.

### Was dagegen spricht

- **RENPHO verkauft dieselbe Grundidee für 39,99 €** — mit abnehmbarem
  Verlängerungsgriff, bürstenlosem Motor unter 45 dB, USB-C, LED-Display und
  Markenname. Du willst das Doppelte für ein No-Name-Gerät.
- **Null Bewertungen zum Start.** Bei 80 € von einem unbekannten Anbieter ist
  Sozialbeweis der stärkste einzelne Hebel auf die Kaufrate — und er fehlt genau
  dann, wenn er am meisten gebraucht wird.
- **Sechs konkurrierende No-Name-Listings** allein auf Amazon, 45–75 €. Wer sucht,
  findet sofort Günstigeres.
- **Die Lernphase schließt nie** (Teil 2).
- **Die Creatives sind unerprobt.** Ob die Bild-zu-Video-Generierung eine glaubwürdige
  Anwendungsszene hergibt, weiß niemand, bis sie erzeugt ist.
- **Erste Kampagne, erster Shop.** Handwerkliche Fehler sind wahrscheinlich, nicht
  möglich — und sie kosten Budget, das nicht zurückkommt.

### Erwartungswert

Mit den Szenarien aus Teil 1 und den Gewichten 45 % / 35 % / 20 %:

```
Erwartete Verkäufe   = 0,45×2 + 0,35×10 + 0,20×35  ≈ 11 Stück
```

**Weg A:** 11 Verkäufe bringen ~570 € Deckungsbeitrag, dazu ~975 € Restwert der
unverkauften Ware. Gegen 2.200 € Einsatz: **Erwartungswert rund −650 €.**

**Weg B:** 11 Verkäufe bringen ~495 €. Gegen ~1.230 € fixen Einsatz:
**Erwartungswert rund −735 €** — aber mit der Möglichkeit, nach Woche 1 bei ~600 €
Verlust auszusteigen, statt das volle Budget zu verbrennen.

**Der Erwartungswert der ersten Runde ist in beiden Fällen negativ.** Das ist keine
Besonderheit dieses Produkts, sondern der Normalfall bei Erstkampagnen: Man kauft in
Runde 1 vor allem Information. Der Gewinn, wenn er kommt, entsteht in Runde 2 — mit
bezahlten Fixkosten, echten Bewertungen und einem Creative, von dem man weiß, dass es
zieht.

---

## Teil 5 — Was das für die Entscheidung heißt

Drei ehrliche Sätze:

1. **Die Wahrscheinlichkeit, dass die erste Runde Geld einbringt, liegt bei etwa
   einem Zehntel.** Wer das nicht akzeptieren kann, sollte nicht mit Weg A starten.
2. **Die Wahrscheinlichkeit, dass du danach weißt, ob es geht, liegt bei nahezu
   hundert Prozent.** Das ist der eigentliche Gegenwert der ersten Runde.
3. **Diese Information ist für 280 € zu haben statt für 2.200 €** — schlechter, aber
   nicht viel schlechter. Weg C beantwortet die Frage „zieht der Aufhänger?"
   fast genauso gut wie Weg A, und die Frage „zahlt jemand 79,99 €?" deutlich
   schlechter.

**Wenn 1.200–1.500 € möglicher Verlust ein Betrag ist, der wehtut, aber nicht schadet,**
ist Weg A vertretbar — mit der Korrektur aus Teil 2 zur Lernphase.

**Wenn er wehtut und schadet,** ist Weg C der Anfang und Weg B die Fortsetzung: erst
280 € für die Frage, ob überhaupt jemand hinsieht; dann ohne Registrierungen und ohne
Lager verkaufen; und erst importieren, wenn feststeht, dass es sich lohnt.
