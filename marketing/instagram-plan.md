# NackenFrei Solo — Instagram-Kanal und Meta-Werbung

Bewertung, Ideen und Umsetzungsplan. Stand: 6. August 2026,
**Zahlen durchgerechnet am 9. September 2026.**
Grundlage: `index.html` (Produktseite, **79 €**, Shopify, Versand DE und AT).

> **Alle Geldzahlen in diesem Dokument standen bis zum 9. September 2026 auf
> 99,99 € Verkaufspreis und AliExpress-Bezug.** Verkauft wird für **79 €** aus
> einer Alibaba-Bestellung über 60 Stück. Der Deckungsbeitrag ist damit nicht
> 66 €, sondern **rund 56 €**, und der maximale CPA nicht 55 €, sondern
> **47 €**. Die Abschnitte unten sind auf diesen Stand gebracht. Einzige
> Ausnahme ist Abschnitt 3a — der beschreibt den **nicht gewählten** Weg über
> AliExpress und behält seine eigene Grundlage.

---

## 1. Bewertung: Ist das sinnvoll?

**Ja — mit zwei Korrekturen an der Fragestellung.**

### Warum das Produkt für Meta-Werbung ungewöhnlich gut geeignet ist

Der Bogengriff ist ein **sichtbares** Argument. Das ist selten. Die meisten
Produkte in dieser Preisklasse müssen erklärt werden; NackenFrei muss nur gezeigt
werden: eine Person versucht, mit einer geraden Massagepistole zwischen die
eigenen Schulterblätter zu kommen — scheitert — greift zum Bogengriff — kommt hin.
Das versteht man in vier Sekunden, ohne Ton, ohne Text. Genau das ist die Währung
auf Reels und im Feed.

Dazu kommt: Der Nutzen ist emotional aufgeladen und unabhängig vom Preis. „Ich muss
niemanden mehr fragen" ist ein stärkeres Verkaufsargument als jede Wattzahl.

### Korrektur 1: Nicht „Instagram", sondern Meta

Die Hauptzielgruppe für dieses Produkt sind zwei Gruppen:

- **35–55, Schreibtischarbeit** — Trapez- und Nackenverspannung, kauft aus Routineleid.
- **55+** — kommt körperlich schlicht nicht mehr hinten hin. Das ist die Gruppe mit
  dem stärksten Leidensdruck und der höchsten Zahlungsbereitschaft.

Die zweite Gruppe ist auf Instagram unterrepräsentiert und auf Facebook zu Hause.
Kampagnen werden deshalb über den Meta-Werbeanzeigenmanager mit **beiden Plattformen**
als Platzierung gefahren. Der Instagram-Kanal bleibt trotzdem nötig — er ist die
Visitenkarte, die geklickt wird, bevor gekauft wird —, aber „Instagram-Werbung" als
alleiniger Kanal würde die kaufkräftigere Hälfte ausschließen.

### Korrektur 2: Die Reihenfolge stimmt noch nicht

Werbung schalten kann man erst, wenn die Seite verkaufsfähig ist. Aktuell ist sie das
nicht. Konkret gefunden im HTML:

| Fund | Bedeutung |
|---|---|
| `SHOPIFY_PRODUKT_URL_EINTRAGEN` (2×) | „In den Warenkorb" führt ins Leere |
| `SHOPIFY_SHOPDOMAIN_EINTRAGEN` | Newsletter-Formular sendet nirgendwohin |
| `SHOPIFY_IMPRESSUM_URL`, `SHOPIFY_DATENSCHUTZ_URL`, `SHOPIFY_WIDERRUF_URL` | Pflichtangaben fehlen |
| `LIEFERZEIT_EINTRAGEN` (2×) | Lieferzeit unbenannt |
| kein `fbq`, kein Consent-Banner | Kein Meta-Pixel, keine Einwilligungsabfrage |

Ohne Pixel misst Meta keine Käufe. Ohne gemessene Käufe kann der Algorithmus nicht
auf Käufer optimieren — man zahlt dann für Klicks von Leuten, die nie kaufen. Das
ist der teuerste Fehler beim Start, und er ist unsichtbar, weil die Kampagne
„läuft".

Ohne Impressum, Widerrufsbelehrung und Datenschutzerklärung ist Werbung in
Deutschland zusätzlich abmahnfähig, und Meta lehnt Anzeigen ab, deren Zielseite
Pflichtangaben vermissen lässt.

### Der Wirtschaftlichkeits-Check

Massagepistolen sind eine überlaufene Kategorie. Der Bogengriff rettet das
Produkt — aber nur, wenn jede Anzeige mit der **Reichweite** öffnet und nie mit dem
Wort „Massagepistole". Sobald eine Anzeige wie eine generische Massagepistolen-Anzeige
aussieht, wird sie wie eine behandelt: weggescrollt.

Ausgangslage: Einstandspreis **12,96 €** je Stück aus dem Angebot über 60 Stück —
Ware, Fracht, Zoll und Einfuhrumsatzsteuer sind darin enthalten, es ist der
Landepreis. Dazu **1,50 €** für die bedruckte Banderole, die den Originalkarton
aufwertet und die vier fehlenden Pflichtkennzeichen trägt. Verkauft wird über ein
**deutsches Einzelunternehmen als Kleinunternehmer nach § 19 UStG** — es wird also
keine Umsatzsteuer erhoben, und die vollen 79 € bleiben im Haus.

```
Einnahme je Verkauf (ohne USt., § 19)   79,00 €

./. Einstandspreis (Landepreis)         12,96 €
./. Banderole                            1,50 €
./. Versand an den Kunden (DHL + Verp.)  5,30 €
./. Zahlungsgebühr (2,3 % + 0,35 €)      2,17 €
= Rohertrag je Verkauf                  57,07 €

./. Retouren (12 %, je Fall rund 11 € — die Ware
    kommt zurueck und ist wieder verkaeuflich)
= Deckungsbeitrag je Verkauf       rund 56 €
```

Die Rechenweise ist dieselbe wie in [`rechnung.md`](rechnung.md) Abschnitt 3, damit
beide Dokumente dieselbe Zahl tragen.

**Aber die Werbung ist für dich 19 % teurer, als Meta anzeigt.** Meta Platforms Ireland
rechnet im Reverse-Charge-Verfahren ab: Die Rechnung kommt ohne Umsatzsteuer, die
deutsche Umsatzsteuer schuldest du selbst nach § 13b UStG — und als Kleinunternehmer
kannst du sie **nicht als Vorsteuer abziehen.** Aus 700 € Werbebudget werden real 833 €.
Dasselbe gilt für Shopify-Gebühren.

Beides zusammen ergibt die Steuergrößen:

| | |
|---|---|
| Deckungsbeitrag je Verkauf | **56 €** |
| Maximaler CPA laut Meta bei Break-even | **47 €** (weil 47 € × 1,19 = 56 €) |
| Break-even-ROAS | **1,7** |
| CPA für 20 € Gewinn je Stück | **30 €** |
| ROAS für 20 € Gewinn je Stück | **2,6** |
| Verkäufe, damit sich der 700-€-Test selbst trägt | **15** |

Der Vorteil aus § 19 wird also zu einem guten Teil von der nicht abziehbaren Steuer auf
die Werbeausgaben wieder aufgezehrt. Der Break-even-ROAS liegt bei **1,7**, und der
Deckungsbeitrag von 56 € ist der Puffer, der die Sache tragfähig macht.

**Der Abstand ist schmaler geworden.** Bei 99,99 € lagen zwischen einem realistischen
CPA von 50 € und dem Break-even bei 55 € noch fünf Euro Luft. Bei 79 € liegt der
Break-even bei 47 € — ein CPA von 50 € ist jetzt ein Verlust je Verkauf, kein Gewinn.

### Der Haken an § 19: Er endet genau dann, wenn es funktioniert

Die Kleinunternehmergrenze liegt bei **25.000 € Vorjahresumsatz** und 100.000 € im
laufenden Jahr. Bei 79 € sind das **316 verkaufte Geräte**. Läuft die Kampagne mit
drei Verkäufen am Tag, ist die Grenze in rund drei Monaten erreicht — und im Folgejahr
gilt Regelbesteuerung.

Dann sinkt die Einnahme je Verkauf von 79 € auf 66,39 € netto und der Deckungsbeitrag
von 56 € auf **rund 43 €**. Im Gegenzug wird die Vorsteuer abziehbar, die Werbung
kostet also wieder genau das, was Meta anzeigt — der Faktor 1,19 fällt weg. **Der
maximale CPA ist damit gleich dem Deckungsbeitrag: 43 €.**

> **Hier stand vorher ein Rechenfehler.** Der maximale CPA nach dem Wechsel war mit
> „42 €" angegeben, also durch 1,19 geteilt. Dieser Faktor gilt aber nur unter § 19,
> wo die Steuer auf die Werbung nicht abziehbar ist. Unter Regelbesteuerung ist sie
> es — dann ist der maximale CPA der Deckungsbeitrag selbst.
>
> **Konservativ gerechnet:** Unter Regelbesteuerung wird auch die
> Einfuhrumsatzsteuer im Einstandspreis abziehbar. Der Deckungsbeitrag liegt real
> also etwas über 43 €. Die Zahl oben lässt das bewusst weg.

**Konsequenz für die Planung:** Die Kampagne muss auch mit 43 € Deckungsbeitrag
funktionieren. Wer sie so auslegt, dass sie nur unter § 19 trägt, baut etwas, das in
dem Moment zusammenbricht, in dem es erfolgreich wird. Als Zielwert deshalb **CPA unter
43 €** anpeilen, nicht unter 47 €.

Realistisch in DE: CPM 9–15 €, Klickrate 1–2 %, also CPC um 1 €. Bei 2 % Kaufrate der
Landingpage landet man bei einem CPA von rund 50 € — bei 79 € Verkaufspreis ist das
**knapp im Minus**, denn der Break-even liegt bei 47 €. Bei 3 % landet man bei rund
33 € — klar profitabel.

**Damit steht die Anforderung an die Seite fest: Die Kaufrate muss über 2,3 % liegen.**
Bei 99,99 € hätten 2 % noch getragen. Bei 79 € nicht mehr. Die Seite, nicht die
Anzeige, entscheidet über den Test.

**Der Hebel ist damit benannt: die Kaufrate der Landingpage.** Zwischen 2 % und 3 %
liegt der Unterschied zwischen „trägt sich gerade so" und „verdient Geld". Der
Einkaufspreis ist gut genug, dass die Kampagne funktionieren *kann*; ob sie es tut,
entscheidet die Seite.

Und da fehlt aktuell das Wichtigste: **auf der Seite steht kein einziger
Sozialbeweis.** Die Abschnitte sind Bühne, Anwendung, Technik, Preis, Fragen — keine
Bewertungen, keine Kundenstimmen, kein Vergleich mit einer geraden Massagepistole.
Bei 79 € von einem unbekannten Anbieter ist das der größte einzelne Grund, warum
jemand nicht bestellt. Eine frühere Fassung der Seite hatte „Vergleich" und „Stimmen";
beides gehört zurück, sobald die ersten echten Rückmeldungen da sind.

Die Frage, ob der Einkaufspreis der Landepreis ist, ist inzwischen **beantwortet**:
Das Angebot über 60 Stück ist DDP kalkuliert, Fracht, Zoll und Einfuhrumsatzsteuer
sind in den 12,96 € enthalten. Offen bleibt allein der **Zollsatz** — die Rechnung
unterstellt Einreihung unter Position 9019 ohne Zoll; bei 8543 kämen rund 30 € auf die
Gesamtbestellung hinzu, also gut 0,50 € je Gerät. Und:
Versand in die **Schweiz** kostet ein Vielfaches des DE-Versands. Bei kostenfreiem
Versand dorthin ist die Marge je CH-Bestellung deutlich dünner — im Test deshalb
zunächst nur DE bewerben.

### Was zusätzlich Ärger machen kann: Meta-Werberichtlinien

Das Produkt ist ein Wellnessprodukt, kein Medizinprodukt — das steht so auch im FAQ,
gut. Zwei Fallen bleiben:

1. **Persönliche Eigenschaften.** Anzeigen dürfen nicht unterstellen, dass die
   betrachtende Person ein Leiden hat. „Leidest du unter Nackenschmerzen?" wird
   abgelehnt. „Der Griff, der über die Schulter reicht" nicht. Merksatz: **über das
   Produkt sprechen, nie über die Person.**
2. **Gesundheitsversprechen.** Keine Heilungs-, Linderungs- oder Vorher-Nachher-Aussagen.
   Beschreiben, was das Gerät *tut* (Perkussion, Reichweite, neun Stufen), nicht, was es
   *bewirkt*.

### Fazit

Sinnvoll: ja. Aber nicht als „Kanal anlegen und Werbung schalten", sondern in der
Reihenfolge **Shop fertigstellen → Messung und Recht → Creatives produzieren →
organischer Grundstock → bezahlter Test → skalieren oder abbrechen**. Wer bei Schritt
fünf anfängt, verbrennt das Budget in der ersten Woche.

---

## 2. Ideen

Neun Konzepte, sortiert nach erwartetem Beitrag. Die ersten drei sind die
Anzeigen-Kandidaten, der Rest trägt den Kanal und das Retargeting.

### A — „Die Stelle" (Haupt-Anzeige)
Split-Screen, dieselbe Person, dieselbe Stelle zwischen den Schulterblättern: links
die gerade Massagepistole, verrenkter Arm, kommt nicht hin. Rechts der Bogengriff,
entspannte Schulter, trifft. Vier Sekunden, kein Ton nötig, Text nur als Einblendung.

*Warum:* Es ist kein Werbeversprechen, sondern eine Demonstration. Das ist der einzige
Anzeigentyp, gegen den Werbemüdigkeit nicht hilft.

### B — Die Reichweiten-Grafik als Animation
Die Rückensilhouette der Landingpage als Video: Zonen leuchten nacheinander auf, während
der Kopf entlangfährt. Kupfer auf Graphit, die Farbwelt der Seite.

*Warum:* Sieht nach niemandem sonst aus. Massagepistolen-Anzeigen sehen alle gleich aus
— weißes Studio, Zeitlupe, Bassmusik. Diese hier sieht aus wie ein Messgerät. Zusätzlich
zahlt die Wiedererkennung auf die Landingpage ein: Wer klickt, findet dieselbe Grafik
interaktiv wieder, und das senkt die Absprungrate.

### C — Der Vier-Aufsätze-Erklärer
Karussell oder Reel, je Aufsatz eine Zone: Kugel für die Fläche, Flach fürs Gesäß,
U-Form links und rechts an der Wirbelsäule vorbei, Spitz punktweise.

*Warum:* Das ist das Retargeting-Asset. Wer die Seite besucht hat und nicht gekauft hat,
zweifelt meist an der Anwendbarkeit, nicht am Preis. Diese Anzeige beantwortet genau das.

### D — „Wo du nicht arbeiten darfst"
Der Sicherheits-FAQ als eigene Serie: nicht auf Knochen und Gelenken, zwei Finger Abstand
zur Wirbelsäule, nicht vorn am Hals, maximal fünfzehn Sekunden auf einem Punkt.

*Warum:* Der stärkste Vertrauensbaustein, den ihr habt, und er ist schon geschrieben.
Ein Anbieter, der Grenzen benennt, unterscheidet sich sofort von der Dropshipping-Konkurrenz,
die nur Versprechen kennt. Solche Beiträge werden außerdem gespeichert und geteilt — beides
zählt für die Reichweite mehr als Likes.

### E — Die Drei-Minuten-Feierabendroutine
Loop-Reel: Schreibtisch, Laptop zu, drei Minuten, drei Zonen, fertig. Wiederholbar als
Format (Routine für Autofahrer, nach dem Sport, morgens).

*Warum:* Verankert das Gerät in einem Anlass. Produkte ohne Anlass werden nicht gekauft,
sondern verglichen.

### F — Umfrage-Story: „Wo kommst du noch selbst hin?"
Rückengrafik als Story mit Umfrage-Sticker über mehreren Zonen.

*Warum:* Kostet zehn Minuten Produktion, liefert Interaktion und nebenbei echte Aussagen,
die als Anzeigentext weiterverwendbar sind.

### G — Testimonials, ab Woche 4
Kein Studio-Testimonial, sondern eine Aussage: „Ich musste immer meinen Mann fragen."
Unabhängigkeit ist der emotionale Kern, nicht Entspannung.

*Warum:* Bei 79 € ist Sozialbeweis der Hebel mit dem größten Effekt auf die Kaufrate.
Deshalb ab der ersten Bestellung systematisch Rückmeldungen einsammeln.

### H — „Wann du keine Massagepistole brauchst"
Bewusst gegen das eigene Produkt argumentieren: bei akuten Verletzungen, bei Bandscheibenvorfall,
wenn der Schmerz vom Gelenk kommt.

*Warum:* Hohe Verweildauer, hohe Glaubwürdigkeit, praktisch kein Risiko — die Einschränkungen
stehen ohnehin im FAQ.

### I — Kommentar-zu-DM-Automatisierung
Reel mit Aufruf „Kommentiere REICHWEITE" → automatische Direktnachricht mit dem
Newsletter-Rabattcode (10 % auf die erste Bestellung, den es auf der Seite bereits gibt).
Technisch über ManyChat oder ein vergleichbares Werkzeug.

*Warum:* Verwandelt Reichweite in E-Mail-Adressen, und E-Mail ist der einzige Kanal, den
ihr besitzt. **Nur mit Doppel-Opt-In und Datenschutzhinweis in der DM** — die Seite macht
das mit ihrer Bestätigungsmail bereits richtig, das muss hier genauso laufen.

---

## 3. Plan

### Phase 0 — Verkaufsfähig werden (vor allem anderen)

Ohne diese Phase kein Werbe-Euro. Reihenfolge egal, Vollständigkeit nicht.

- [ ] Lieferant mit **EU-Lager** auswählen (Versand aus DE/PL/CZ) oder kleine Charge
      selbst einkaufen — siehe Abschnitt 3a. Vor allem anderen, weil die Lieferzeit
      über den Rest entscheidet
- [ ] Registrierungen: Stiftung EAR (ElektroG), Batterierecht, LUCID (VerpackG);
      GPSR-Angaben und CE-Konformitätserklärung vom Lieferanten anfordern
- [ ] Umsatzsteuer beim Import klären (IOSS, Vorsteuerabzug) — mit dem Steuerberater
- [ ] Shopify-Shop aufsetzen, Produkt anlegen, Preis 79 €, Versand **DE und AT**
      kostenfrei; CH vorerst nicht anbieten
- [ ] Alle sechs Platzhalter in `index.html` ersetzen: Produkt-URL (2×), Shop-Domain,
      Impressum, Datenschutz, Widerruf, Lieferzeit (2×)
- [ ] Auf der Seite anpassen: Versandländer auf DE und AT, Rückgabefrist von 30 auf
      14 Tage, Schweiz-Hinweis im FAQ und im Bestellabschnitt entfernen
- [ ] Impressum, Datenschutzerklärung, Widerrufsbelehrung und AGB erstellen —
      rechtlich prüfen lassen, nicht aus einem Generator übernehmen und hoffen
- [ ] Consent-Banner einbauen; Pixel darf erst **nach** Einwilligung feuern
- [ ] Meta Business Suite: Unternehmenskonto, Werbekonto, Zahlungsmethode
- [ ] Meta-Pixel **und** Conversions-API einbinden (Ereignisse: `ViewContent`,
      `AddToCart`, `InitiateCheckout`, `Purchase`)
- [ ] Domain `nackenfrei-shop.de` in Meta verifizieren, Ereignisse priorisieren
- [ ] Testkauf durchführen — mit echter Karte, bis zur Bestätigungsmail
- [ ] Im Ereignis-Manager prüfen: Kommt der Testkauf als `Purchase` an?

**Abnahme:** Ein fremder Mensch kann auf dem Handy bestellen, und der Kauf taucht
im Meta-Ereignis-Manager auf. Erst dann weiter.

### Phase 1 — Kanal und Creatives (Woche 1–2)

- [ ] Instagram-Profi-Konto anlegen, mit der Facebook-Seite und dem Business-Konto verbinden
- [ ] Profil: Name „NackenFrei", Bio mit dem einen Satz, der alles trägt
      („Perkussion für den Teil des Rückens, an den die Hand nicht kommt"), Link zum Shop
- [ ] Highlights anlegen: Aufsätze · Anwendung · Sicherheit · Versand & Rückgabe
- [ ] **Ein Drehtag** für alles: Konzepte A, B, C, D, E — je 3–4 Varianten der ersten drei
      Sekunden, gleicher Inhalt danach. Der Anfang entscheidet, sonst nichts.
- [ ] 12–15 Beiträge vorproduzieren, davon 6 als Anzeigen-Rohmaterial in 9:16 und 4:5
- [ ] Ab jetzt 3–4 Beiträge pro Woche veröffentlichen

**Abnahme:** Das Profil sieht bewohnt aus. Wer von einer Anzeige kommt, findet mindestens
neun Beiträge und vier Highlights.

### Phase 2 — Bezahlter Test (Woche 3–6)

- [ ] **Eine** Kampagne, Ziel Verkäufe, Advantage+ Shopping oder eine breite Zielgruppe
      DE, 30–65 Jahre, alle Geschlechter — **kein** Interessen-Micro-Targeting
- [ ] Platzierungen automatisch (Instagram **und** Facebook, Reels, Feed, Stories)
- [ ] Budget 25 €/Tag, entspricht rund 700 € über vier Wochen
- [ ] 4–6 Creatives gleichzeitig, Konzepte A und B vorne
- [ ] Ab Tag 10 zusätzlich Retargeting auf Seitenbesucher der letzten 30 Tage mit
      Konzept C und G, 8 €/Tag
- [ ] **Nicht täglich eingreifen.** Auswertung montags, sonst nichts anfassen — jede
      Änderung setzt die Lernphase zurück

Zu beobachtende Zahlen, mit Zielwerten:

| Kennzahl | Ziel | Was es bedeutet, wenn sie reißt |
|---|---|---|
| Hook-Rate (3-Sek.-Views ÷ Impressionen) | > 25 % | Die ersten drei Sekunden funktionieren nicht — neue Anfänge, gleicher Rest |
| Ausgehende Klickrate | > 1,0 % | Das Versprechen ist zu schwach oder zu unklar |
| Kaufrate der Seite | > 1,5 % | Anzeige und Seite versprechen Verschiedenes |
| Kosten pro Kauf | < 47 € | Darüber zahlt jeder Verkauf drauf. Zielwert **43 €** — der trägt auch nach dem Wechsel in die Regelbesteuerung |
| ROAS | > 1,7 | Unter Break-even |

### Phase 3 — Entscheiden (Ende Woche 6)

Drei mögliche Ausgänge, vorab festgelegt, damit die Entscheidung nicht am Bauchgefühl hängt:

- **ROAS über 2,5 →** Budget in 20-%-Schritten alle 3–4 Tage erhöhen, Gewinner-Creative
  in fünf Varianten weiterbauen, AT dazunehmen (CH erst, wenn der Versand dorthin
  eingepreist ist).
- **ROAS 1,3–2,5 →** nicht skalieren, sondern reparieren. Erst die schwächste Kennzahl
  aus der Tabelle angehen — meist die Hook-Rate, danach die Kaufrate der Seite. Bei
  56 € Deckungsbeitrag lohnt sich diese Arbeit: Von 2 % auf 3 % Kaufrate senkt den CPA
  um rund ein Drittel — und genau dieser Schritt entscheidet bei 79 € über Plus oder
  Minus.
- **ROAS unter 1,3 nach 700 € →** Meta-Werbung für dieses Produkt aussetzen. Dann ist
  nicht die Marge das Problem — die reicht —, sondern die Nachfrage oder das
  Creative. Stattdessen: Google
  Shopping und Suchanzeigen auf „Massagepistole für den Rücken selbst" — dort greift man
  bestehende Nachfrage ab, statt sie zu erzeugen, und das ist bei einem Produkt mit
  klarem Suchbegriff oft billiger.

### Aufwand und Kosten (Schätzung)

| Posten | Einmalig | Laufend |
|---|---|---|
| Shop, Recht, Tracking (Phase 0) | 1–2 Wochen Arbeit + Anwaltskosten | — |
| Creative-Produktion | 1 Drehtag | ~4 Std./Woche |
| Kanalpflege | — | ~3 Std./Woche |
| Werbebudget Test | — | ~700 € über 4 Wochen |
| Retargeting | — | ~150 € über 3 Wochen |

---

## 3a. Dropshipping von AliExpress — was daran hängt

> **Dieser Weg wurde nicht gewählt.** Bestellt wird stattdessen über Alibaba, 60 Stück
> auf Lager, Versand aus Deutschland. Der Abschnitt bleibt als Bewertung der
> Alternative stehen; **seine Zahlen beruhen auf 99,99 € Verkaufspreis und
> AliExpress-Bezug und sind nicht auf 79 € umgestellt.** Wer sie mit den Zahlen
> weiter oben vergleicht, vergleicht zwei verschiedene Geschäftsmodelle.

Die Ware geht direkt aus China an den Kunden. Das lässt die Marge weitgehend intakt,
verändert aber alles andere.

### Die Marge bleibt tragfähig

```
Nettoerlös                            84,03 €
./. Wareneinsatz                      15,91 €
./. AliExpress-Versand                 6,00 €   Annahme — echten Wert einsetzen
./. Zahlungsgebühr                     2,65 €
= Rohertrag                           59,47 €
./. Retouren (realistisch 12 %, faktisch Totalverlust je Fall)
= Deckungsbeitrag              rund   50 €
```

Retouren sind beim Dropshipping teurer als beim Lagerverkauf: Zurück nach China geht
praktisch nicht, eine Rücksendung landet bei dir zu Hause und lässt sich nicht wieder
in den Bestand legen. Rechne mit dem vollen Verlust je Fall. Die auf der Seite
zugesagten **30 Tage Rückgabe — doppelt so lang wie gesetzlich nötig — sind für dieses
Modell eine selbstgestellte Falle.** Bei Direktversand aus China gehören da 14 Tage hin,
nicht 30.

### Das eigentliche Problem: Lieferzeit

Standardversand von AliExpress nach Deutschland dauert typisch 10–25 Tage. Bei einem
Produkt für 99,99 € ist das der Punkt, an dem das Geschäft kippt:

- **Retouren und Rückbuchungen steigen stark.** Wer 100 € zahlt und drei Wochen wartet,
  storniert oder eröffnet einen PayPal-Fall. Jeder solche Fall ist ein Totalverlust.
- **Meta bestraft es direkt.** Im Commerce Manager läuft ein Kundenzufriedenheitswert
  von 1 bis 5, gespeist aus Käuferbefragungen. Unter 2,0 werden Anzeigen eingeschränkt,
  unter 1,0 wird das Werbekonto gesperrt. Lange Lieferzeit plus AliExpress-Verpackung
  ist genau das Muster, das diesen Wert kippt. Man merkt es erst, wenn das Konto
  schon eingeschränkt ist.
- **Das Paket verrät den Preis.** Es kommt in AliExpress-Verpackung mit chinesischem
  Absender, oft mit Warenwert auf dem Zolldokument. Der Kunde sieht, dass er für
  einen Artikel von 16 € hundert Euro gezahlt hat.

**Die Lösung ist einfacher als sie klingt: Lieferanten mit EU-Lager.** Auf AliExpress
nach „Versand aus Deutschland / Polen / Tschechien" filtern (bei AliExpress Choice oft
verfügbar). Dann sind es 3–7 Tage, die Verpackung ist meist neutral, es fällt kein Zoll
beim Kunden an, und Retouren bleiben in der EU. Der Einkauf ist etwas teurer — bei
50 € Deckungsbeitrag ist das leicht zu verkraften.

### Lieferantensuche: Reihenfolge der Kriterien

Beides zu wollen — schnell **und** individuell bedruckt — führt auf AliExpress ins
Leere. Die Prioritäten:

1. **Versand aus einem EU-Lager.** Nicht verhandelbar. Alles andere ist zweitrangig,
   weil die Lieferzeit über Retouren, Rückbuchungen und den Meta-Zufriedenheitswert
   entscheidet.
2. **Neutrale Verpackung ohne Preisangabe.** Vor der ersten Bestellung beim Lieferanten
   erfragen: keine Rechnung, kein Preis, kein Werbematerial im Paket. Bei
   Dropshipping-erfahrenen Anbietern ist das eine Standardbitte.
3. **Ein Testkauf an die eigene Adresse.** Vor jeder Anzeige. Prüfen: tatsächliche
   Laufzeit, Zustand, was im Karton liegt, wie das Gerät wirklich klingt und wirkt.
   Ohne diesen Testkauf bewirbst du ein Produkt, das du nie in der Hand hattest.
4. **Bedruckte Verpackung und Logo** sind ein anderes Spiel. Das gibt es nicht auf
   AliExpress, sondern über OEM-Anbieter auf Alibaba, mit Mindestabnahme von meist
   100–500 Stück. Bei 15,91 € sind 100 Stück rund 1.600 € Vorleistung. Sinnvoll —
   aber **erst, wenn der Werbetest gezeigt hat, dass das Produkt verkauft wird.**
   Vorher ist es totes Kapital.

Kurz: Für den Test reicht ein EU-Lager mit neutraler Verpackung. Eigene Verpackung
kommt in die Skalierungsphase, nicht in den Start.

**Die bessere Alternative bei diesem Preis:** eine kleine Charge selbst einkaufen.
50 Stück zu 15,91 € sind rund 800 € — weniger als das geplante Werbebudget. Dafür
bekommst du Versand in ein bis zwei Tagen, eigene Verpackung, beherrschbare Retouren
und einen Zufriedenheitswert, der die Anzeigen nicht gefährdet. Bei 99,99 € Verkaufspreis
ist Direktversand aus China schlicht das falsche Werkzeug.

### Versandländer: nur DE und AT, nicht CH

- **Deutschland und Österreich** sind EU-Binnenmarkt — kein Zoll, keine
  Einfuhrabgaben für den Kunden, gleiche Rechtslage. Beide unproblematisch.
- **Die Schweiz ist Drittland.** Der Kunde zahlt Schweizer Einfuhrsteuer plus
  Verzollungsgebühr des Transporteurs, oft 20–30 CHF, und zwar an der Haustür. Die
  Seite sagt das zwar ehrlich dazu, aber bei einer 100-€-Bestellung ist das der
  häufigste Grund für Annahmeverweigerung. **CH aus dem Angebot nehmen**, solange nicht
  verzollt versendet wird.

### Steuer und Recht — vor der ersten Anzeige klären

Beim Direktimport bist du **Importeur** und damit der Verantwortliche im Rechtssinn.
Das ist keine Formalie; die folgenden Punkte sind in Deutschland die klassischen
Abmahnziele:

| Thema | Was zu tun ist |
|---|---|
| **ElektroG / WEEE** | Registrierung bei der Stiftung EAR **vor** dem ersten Verkauf. Elektrogerät mit Akku. Verstoß ist bußgeldbewehrt und abmahnfähig. |
| **Batterierecht** | Registrierung der Batterien, Rücknahmepflicht |
| **VerpackG** | LUCID-Registrierung und Beteiligung an einem dualen System |
| **GPSR** (EU 2023/988, seit 12/2024) | Verantwortliche Person in der EU, Hersteller- und Importeurangaben am Produkt und im Angebot |
| **CE / EMV / RoHS** | Konformitätserklärung vom Lieferanten anfordern und prüfen |
| **Einfuhrumsatzsteuer / IOSS** | Bei Sendungen bis 150 € muss die deutsche Umsatzsteuer beim Verkauf erhoben und über IOSS abgeführt werden. Ohne IOSS zahlt der Kunde beim Zoll drauf. |
| **Doppelte Umsatzsteuer** | Klassischer Dropshipping-Fehler: erst Mehrwertsteuer an AliExpress zahlen, dann nochmal auf den eigenen Verkauf abführen. Ohne ordentliche Rechnung ist kein Vorsteuerabzug möglich. Steuerberater fragen. |
| **Gewährleistung** | Zwei Jahre, gesetzlich, nicht verhandelbar — auch ohne Ersatzteile und ohne Lager. |

Das ist kein Grund, es zu lassen. Aber es gehört in **Phase 0**, nicht in ein
„machen wir später": Eine Abmahnung wegen fehlender EAR-Registrierung kostet mehr als
der gesamte Werbetest.

### Vom Ausland aus verkaufen

Der eigene Aufenthaltsort spielt für den Betrieb keine Rolle. Meta-Werbung, Shopify,
Lieferantenkontakt und Kundenservice laufen von überall — aus Thailand genauso wie aus
Deutschland. Entscheidend ist nicht, wo du sitzt, sondern **welche Firma verkauft.**

**Fall A — es gibt ein deutsches Gewerbe, eine UG oder GmbH** und du bist nur gerade
nicht im Land: Dann gilt alles oben Beschriebene unverändert. Kein zusätzlicher
Aufwand, keine Sonderregel. Steuerlich ist zu klären, ob der Aufenthalt an der
Ansässigkeit etwas ändert — das ist eine Frage an den Steuerberater, keine an den
Werbeplan.

**Fall B — es gibt keine EU-Firma**, verkauft wird als thailändisches oder gar kein
Unternehmen: Dann ist der Verkauf an EU-Verbraucher **ohne EU-Vertretung nicht zulässig.**
Konkret:

- **GPSR Art. 16** verlangt einen in der EU niedergelassenen Wirtschaftsakteur, der
  für die Produktkonformität verantwortlich ist. Ohne diese Person darf das Produkt
  nicht auf den EU-Markt.
- **ElektroG** verlangt von Herstellern ohne deutsche Niederlassung einen
  **Bevollmächtigten in Deutschland**, der bei der Stiftung EAR registriert ist.
- **Umsatzsteuer:** Für IOSS braucht ein Anbieter ohne EU-Sitz einen in der EU
  ansässigen Vermittler.
- **Impressumspflicht** besteht unabhängig vom Sitz. Eine ladungsfähige Anschrift
  außerhalb der EU senkt zusätzlich das Vertrauen — bei einem 100-€-Kauf messbar.

Es gibt Dienstleister, die EU-Bevollmächtigung, EAR-Registrierung und IOSS-Vermittlung
gebündelt anbieten; die Kosten liegen üblicherweise im niedrigen dreistelligen Bereich
pro Jahr. Die häufigere und meist einfachere Lösung ist aber eine deutsche UG.

**Diese Frage gehört vor den Werbetest**, weil sie darüber entscheidet, ob überhaupt
verkauft werden darf — nicht, wie gut es läuft.

## 3b. Zeitplan: drei Wochen Vorlauf nutzen

Rückkehr nach Deutschland in drei Wochen. Das ist kein Hindernis, sondern der bessere
Ablauf: Fast die gesamte Phase 0 ist Schreibtischarbeit und von überall erledigbar.
Was Deutschland wirklich braucht, ist genau eine Sache — **das Gerät in der Hand, um
damit zu drehen.**

Der entscheidende Zug ist deshalb, die Muster **jetzt** zu bestellen, an die deutsche
Adresse, damit sie dort liegen, wenn du ankommst. Bei EU-Lager-Versand sind sie in
einer Woche da; bei Direktversand aus China braucht es genau diese drei Wochen.

### Woche 1 — noch vor Ort

- [ ] Firmenfrage klären (Fall A oder B aus Abschnitt 3a). Alles Weitere hängt daran
- [ ] 2–3 Lieferanten mit EU-Lager auswählen
- [ ] **Von jedem ein Muster an die deutsche Adresse bestellen.** Der wichtigste
      Einzelschritt dieser Woche — Laufzeit, Verpackung und Verarbeitung lassen sich
      nicht recherchieren, nur messen
- [ ] Registrierungen anstoßen: Stiftung EAR, Batterierecht, LUCID. Die EAR-Registrierung
      kann mehrere Wochen dauern, deshalb zuerst
- [ ] Rechtstexte beauftragen (Impressum, Datenschutz, Widerruf, AGB) — läuft online
- [ ] CE-Konformitätserklärung beim Lieferanten anfordern

### Woche 2 — noch vor Ort

- [ ] Shopify aufsetzen, Produkt anlegen, Versand DE und AT
- [ ] Die sechs Platzhalter in `index.html` ersetzen, Rückgabefrist auf 14 Tage,
      Schweiz entfernen
- [ ] Consent-Banner, Meta-Pixel und Conversions-API, Domain verifizieren
- [ ] Meta Business Suite, Werbekonto, Zahlungsmethode
- [ ] Instagram-Profil anlegen, Bio, Link
- [ ] **Drehbuch und Shotlist** für den Drehtag schreiben — jede Einstellung der
      Konzepte A bis E vorher festlegen. Ein durchgeplanter Drehtag bringt fünfzehn
      Assets, ein improvisierter drei

### Woche 3 — noch vor Ort

- [ ] Muster sind angekommen: jemanden vor Ort bitten, das Paket zu fotografieren —
      Verpackung, Beilagen, Rechnung? Danach entscheiden, welcher Lieferant es wird
- [ ] Anzeigentexte und Bildunterschriften schreiben
- [ ] Sozialbeweis-Abschnitt für die Landingpage vorbereiten (Aufbau steht, Inhalte
      folgen nach den ersten Bestellungen)
- [ ] Testkauf im eigenen Shop, Pixel-Ereignis prüfen

### Woche 4 — angekommen

- [ ] Gerät auspacken, ausprobieren, alle Angaben der Seite gegen das echte Produkt
      prüfen: neun Stufen? 590 g? Laufzeit auf Stufe 1?
- [ ] **Drehtag.** Konzepte A, B, C, D, E nach Shotlist
- [ ] Schnitt, 12–15 Assets, davon 6 in 9:16 und 4:5 als Anzeigenmaterial

### Woche 5 — organisch

- [ ] 3–4 Beiträge veröffentlichen, Highlights füllen
- [ ] Profil erreicht neun Beiträge und vier Highlights

### Woche 6 — Anzeigen an

- [ ] Kampagne starten wie in Phase 2 beschrieben, 25 €/Tag
- [ ] Entscheidung nach Woche 9 gemäß Phase 3

**Eine Warnung zur Wartezeit:** Drei Wochen Vorlauf verleiten dazu, die Webseite weiter
zu polieren. Die Seite ist gut. Der Engpass ist das Produkt vor der Kamera, nicht das
nächste Detail im CSS. Wenn in Woche 2 Zeit übrig ist, gehört sie in das Drehbuch.

## 4. Offen

Für die Marge noch zu klären:

- **Ist 15,91 € der Landepreis** (inkl. Fracht, Zoll, Einfuhrabgaben) oder der Warenwert
  ab Werk? Der Unterschied verschiebt den Deckungsbeitrag um etwa 4 € und den
  Break-even-ROAS von 1,8 auf 2,0.
- **Tatsächliche Versandkosten** je Paket nach DE, AT und CH. Der kostenfreie
  CH-Versand ist der wahrscheinlichste stille Margenfresser.
- **Retourenquote** nach den ersten hundert Bestellungen. Die 7 % oben sind ein
  Erfahrungswert, kein gemessener.

Inhaltlich der wichtigste offene Punkt: **Sozialbeweis auf der Landingpage.** Solange
dort keine Bewertungen stehen, arbeitet die Kaufrate gegen die Kampagne — und die
Kaufrate ist bei dieser Marge der Hebel, an dem alles hängt.
