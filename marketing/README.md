# NackenFrei — Projektübersicht und Übergabe

Einstiegspunkt für alles, was zu diesem Vorhaben entschieden, recherchiert und gebaut
wurde. Die Einzelheiten stehen in den verlinkten Dateien; hier steht, was gilt.

**Stand: 10. September 2026.**

---

## 0. Arbeitsanweisung für jede Sitzung

> **Nach jeder Antwort die Prüfliste des Mustertests mit aktuellem Stand anhängen.**
> Ausdrücklicher Wunsch des Inhabers, gilt dauerhaft.

Weitere feste Regeln aus dem bisherigen Verlauf:

- **Beim Thema bleiben.** Nicht vom laufenden Test auf Registrierungen oder andere
  Baustellen umlenken, solange der Test läuft.
- **Nachrichten an Lieferanten ohne Markdown-Sternchen** — die erscheinen im
  Alibaba-Chat als Zeichen.
- **Höchstens drei bis vier Punkte je Lieferantennachricht.** Bei sechs Punkten wurde
  nur der einfachste beantwortet.
- **Behauptungen belegen.** Erfundene Zahlen sind auf dieser Seite schon einmal
  passiert und wurden entfernt.

---

## 1. Was das Vorhaben ist

Verkauf einer **Perkussionsmassagepistole mit fest gebogenem Griff** über einen eigenen
Shop in Deutschland, beworben über Meta-Anzeigen. Das Verkaufsargument: Der Bogen führt
den Massagekopf über die Schulter an die Stelle zwischen den Schulterblättern, die
weder von oben noch von unten mit der Hand erreichbar ist.

**Diese Kernbehauptung ist am Muster bestätigt.**

---

## 2. Die Firma

| | |
|---|---|
| Rechtsform | Deutsches Einzelunternehmen, Gewerbe angemeldet |
| Inhaber | Nik Hoffmann, Friedrich-Schauer-Weg 6, 59494 Soest |
| Umsatzsteuer | **Kleinunternehmer nach § 19 UStG** — keine MwSt., kein Vorsteuerabzug |
| Folge | Auf der Seite steht der § 19-Hinweis, **nicht** „inkl. MwSt." |
| Grenze | 25.000 € Vorjahresumsatz = bei 79 € **316 Geräte**, danach Regelbesteuerung |

**Konsequenz:** Meta und Shopify rechnen im Reverse-Charge ab. Die 19 % nach § 13b UStG
sind als Kleinunternehmer **nicht abziehbar**. Werbung kostet real 19 % mehr, als Meta
anzeigt.

---

## 3. Das Produkt

**Modell GB-868**, verkauft von Shenzhen ScPanda Technology Co., Limited.
**Gefertigt von Wenzhou Yi Xiang Electronic Technology Co., Ltd.** unter der
Werksbezeichnung **KK-26** — bestätigt, siehe Abschnitt 6.

### Am Muster gemessen und belegt

| Angabe | Wert | Quelle |
|---|---|---|
| Kraftstufen | **9** | geprüft |
| **Rhythmen** | **9**, separate Modustaste | geprüft, steht auf dem Karton |
| Aufsätze | 4: Kugel, U-Form, Flach, Spitz („Bullet") | geprüft |
| Farbe | Mattschwarz | geprüft |
| Ladeanschluss | **USB-C, 5 V / 2 A** | Handbuch |
| Akkuspannung | 7,4 V | Handbuch |
| **Gewicht ohne Zubehör** | **500 g** | gewogen, Seite korrigiert |
| Gewicht Gesamtpaket | **800 g** | gewogen, durch Frachtbrief bestätigt |
| **Abschaltautomatik** | **15 Minuten** | Handbuch, kein Akkuende |
| Lautstärke Stufe 9 | 52 dB direkt, 45 dB auf ~1 m | Handy-App |
| Amplitude | 7,5 mm | Karton |
| Griff | **fest gebogen, nicht steckbar** | geprüft — Kernargument |
| Kein Netzteil im Lieferumfang | nur USB-C-Kabel | Karton und Handbuch |

### Widersprüchliche Herstellerangaben

| Angabe | Karton | Listing | Lieferant | Bewertung |
|---|---|---|---|---|
| Leistung | 17 W | 20 W | **8,4 W** | 8,4 W ist plausibel. **Keine Wattzahl auf der Seite.** |
| Schlagzahl | 3.000 rpm | 2.000–3.200 | — | Seite nennt die niedrigere gedruckte Zahl |
| Akku | 1200 mAh | 1200 mAh | 1200 mAh | **Geklärt: 800 mAh.** MSDS und UN38.3 nennen die Zelle INR14500-800mAh. Seite korrigiert |
| Ladeeingang | — | — | 5 V / 1 A | **Handbuch sagt 2 A. Seite bleibt bei 2 A.** |

### Der Akku — geklärt am 9. September 2026

MSDS und UN38.3-Bericht nennen übereinstimmend dieselbe Zelle:

> **INR14500-800mAh · 3,7 V · 800 mAh · 2,96 Wh**

Das Gerät läuft mit 7,4 V, das sind **zwei Zellen in Reihe**. In Reihenschaltung
verdoppelt sich die Spannung, die Kapazität bleibt gleich:

> **800 mAh bei 7,4 V = 5,92 Wh**

Die 1200 mAh von Karton, Listing und Landingpage sind durch kein Dokument gedeckt.
**Sie sind an allen sechs Stellen von der Seite entfernt.**

**Der Lieferant hat die 800 mAh bestätigt.** Karton und Listing waren falsch, die
Papiere richtig. Der Punkt ist geschlossen.

**Die Laufzeitmessung passt dazu.** Am 10. September wurden **zehn Durchläufe à
15 Minuten auf Stufe 9** gefahren, die Stufe nach jeder Abschaltung wieder gesetzt —
mindestens **150 Minuten je Ladung**:

| Annahme | Wattstunden | mittlere Aufnahme über 150 min |
|---|---|---|
| **800 mAh** (belegt und bestätigt) | 5,92 Wh | **2,4 W** |
| 1200 mAh (Karton, Listing) | 8,88 Wh | 3,6 W |

2,4 W sind für ein freilaufendes Gerät dieser Größe plausibel. Die Wattangaben von
Lieferant (8,4 W), Karton (17 W) und Listing (20 W) sind damit erkennbar **Nenn- oder
Lastwerte** — bei 8,4 W wäre nach 42 Minuten Schluss gewesen.

> **Ein früherer Schluss in `anfrage-scpanda-ce.md` ist zurückgenommen:** der
> Laufzeittest „widerlege die Akkudokumente", vermutlich sei ein größerer Akku verbaut.
> Das war eine Überinterpretation einer ungeprüften Wattzahl. Die Dokumente hatten
> recht.

### Wichtiger Bedienbefund

**Die Ladeanzeige hat zwei Stellen und kann 100 nicht darstellen. Bei 99 % ist der Akku
voll.** Ohne diesen Hinweis hält jeder Kunde den Akku für defekt — das ist ein
vermeidbarer Retourengrund. Steht jetzt in FAQ und JSON-LD, **muss auch in die deutsche
Anleitung**.

**Die Prozentanzeige taugt nicht als Messgröße.** Nach 60 Minuten auf Stufe 9 stand sie
noch bei 81 %; die Lithium-Spannungskurve ist im mittleren Bereich flach. Nur Minuten
bis zum Stillstand zählen.

### Was noch offen ist, bevor eine Laufzeit auf die Seite darf

**Unter Last zieht ein Perkussionsgerät ein Vielfaches des Leerlaufs.** Lief das Gerät
während der 150 Minuten angesetzt oder frei? Davon hängt ab, ob die Zahl eine
Anwendungslaufzeit ist oder nur eine Leerlaufzeit. Solange das offen ist, steht auf der
Seite **keine Laufzeitangabe**.

Sobald es geklärt ist, wäre die ehrlichste Formulierung die beobachtete Tatsache statt
einer Minutenzahl: **„Zehn Anwendungen à 15 Minuten je Ladung."**

---

## 4. Der Mustertest

Vollständig in [`mustertest.md`](mustertest.md), einschließlich Protokoll für den
Präzisionsdurchlauf.

| Block | Stand |
|---|---|
| **A — Sofort** | ✅ **bestanden** |
| **B — Messen** | 🟡 Gewicht ✅ · Lautstärke Stufe 9 ✅ · **offen: Raumpegel, Stufe 1** |
| **C — Zeiten** | 🟢 **150 min auf Stufe 9** gemessen (10.9.2026), Stufe je Durchlauf neu gesetzt · offen: lief das Gerät angesetzt oder frei? |
| **D — Belastung** | ✅ **bestanden**, beide Abbruchkriterien geklärt |
| **E — Anwendung** | ✅ **bestanden** (9.9.2026) — Amplitude spürbar, Ergonomie trägt, Reichweite bestätigt |
| **F — Verpackung** | ✅ **abgeschlossen** |
| **G — Kennzeichnung** | 🟡 Prüfberichte da, **Konformitätserklärung fehlt** |
| **H — Fotos** | 🔴 offen |

### Block D — bestanden

Kein Blockieren des Motors unter Arbeitsdruck. Der Bogen gibt unter Kraft nicht nach.
Kein Heißwerden, kein Geruch, kein Kraftverlust. **Kein Ausschlusskriterium eingetreten.**

### Block E — bestanden

Am 9. September 2026 am eigenen Rücken geprüft. Vollständig in
[`mustertest.md`](mustertest.md).

- **Die Amplitude ist spürbar** — auf Stufe 9 deutlich. Das war das größte Einzelrisiko
  am Produkt, denn 7,5 mm sind das untere Ende der Klasse
- **Die Reichweite trägt:** Bereiche, an die ohne den Bogen nicht heranzukommen ist
- Handgelenk knickt nicht ab, Griff rutscht nicht
- **U-Kopf läuft seitlich neben der Wirbelsäule** — keine Warnung nötig
- Verarbeitung wird als hochwertig empfunden

**Zur 79-Euro-Frage:** Der Inhaber würde selbst nicht zahlen, aber ausdrücklich nicht
wegen des Produkts — er hat das Geld nicht übrig und kaum Rückenprobleme. Er ist nicht
die Zielgruppe. **Die Zahlungsbereitschaft beantwortet der Markt**, und genau dafür ist
das Werbebudget da.

**Entscheidung: 79 € bleiben.** Ein niedrigerer Preis macht den Test schwerer, nicht
sicherer — bei 59 € fällt der Deckungsbeitrag auf 36 €, der Break-even-CPA auf 30 € und
die nötige Kaufrate auf über 3 %.

### Block F — Ergebnis: Verpackung reicht nicht

Der Karton bewirbt drei Farbvarianten und zeigt vorn ein **graues** Gerät, geliefert
wurde ein schwarzes. Generikware, für 79 € nicht wertig genug.

**Lösung: bedruckte Papierbanderole**, rund 1–1,50 € je Stück bei 100er-Auflage. Sie
verdeckt Farbliste und falsches Foto **und trägt zugleich die vier fehlenden
Pflichtkennzeichen**. Kennzeichnung und Aufwertung sind dieselbe Arbeit.

### Block G — was fehlt und was da ist

Weder auf dem Gerät noch auf dem Karton noch in der Anleitung steht **CE, eine
Anschrift, die durchgestrichene Mülltonne oder ein Batteriesymbol.** Das Gerät hat
überhaupt kein Typenschild — auch keine Rückverfolgbarkeitskennung nach EMV Art. 7.

Welche Richtlinien greifen:

| Richtlinie | Gilt | Grund |
|---|---|---|
| Niederspannung 2014/35/EU | **nein** | erst ab 75 V Gleichspannung, hier 7,4 V |
| **EMV 2014/30/EU** | **ja** | verlangt CE |
| **RoHS 2011/65/EU** | **ja** | verlangt CE |
| **GPSR (EU) 2023/988** | **ja** | Name und Anschrift auf Produkt oder Verpackung |

---

## 5. Die Anleitung

Nur Englisch, Prüfnorm chinesisch (GB4706). **Eine deutsche Bedienungsanleitung muss vor
dem Verkauf erstellt und beigelegt werden.**

**Drei Befunde, die zählen:**

1. **Die Anleitung macht medizinische Aussagen** — *„Pain and spasm"*, *„Help the edema
   fluid flow"*, *„Reduce the accumulation of lactic acid"*. **Diese dürfen nicht auf die
   Landingpage.** Wer sie übernimmt, macht aus dem Wellnessprodukt ein Medizinprodukt.
2. **Die Gegenanzeigen sind breiter als bisher angenommen** — zusätzlich Aneurysmen,
   Blutungsneigung, Herzerkrankungen, Krebserkrankungen, Implantate binnen 90 Tagen nach
   einer Operation. Auf der Seite ergänzt.
3. **Garantielücke:** Hersteller gibt 1 Jahr, Akku 6 Monate. Dem Kunden geschuldet sind
   **2 Jahre** gesetzliche Gewährleistung. **Die Lücke trägt der Verkäufer.**

---

## 6. Lieferant und Unterlagen

Vollständig in [`lieferanten-status.md`](lieferanten-status.md) und
[`anfrage-scpanda-ce.md`](anfrage-scpanda-ce.md).

### Wer ist wer

| Rolle | Firma |
|---|---|
| Verkäufer auf Alibaba | **Shenzhen ScPanda Technology Co., Limited**, 6D, No.5 Golf Avenue, Guangpei Community, Guanlan Street, Longhua District, Shenzhen, Guangdong |
| **Fabrik** | **Wenzhou Yi Xiang Electronic Technology Co., Ltd.**, B17-7 Mechanical Industrial Park, Wanquan Light Industry Production Base, Pingyang County, Wenzhou City, Zhejiang |
| Prüflabor | Ningbo Zhengou Testing Technology Co., Ltd (ZOL) |
| Akkuzelle | Xinxiang Hongli Supply Source Technology Co., Ltd |
| Akkuprüfung | Shanghai Institute of Chemical Industry Testing Co., Ltd |

**KK-26 und GB-868 sind dasselbe Gerät.** Bestätigt vom Lieferanten und belegt durch das
Foto „General Appearance of the EUT" im EMV-Prüfbericht: fest gebogener Griff,
montierter Kugelkopf, daneben U-Kopf, Spitzkopf, Flachkopf und USB-Kabel.

### Was vorliegt

**Seit dem 9. September 2026 liegen die Belege im Repo** unter
[`dokumente/`](dokumente/) statt nur in Chat-Verläufen. Das ist keine Ordnungsfrage:
Die technische Dokumentation ist **zehn Jahre aufbewahrungspflichtig**.

| Dokument | Für Deutschland | Status |
|---|---|---|
| EMV-Zertifikat ZOL250324Y8079-3EC | ✅ relevant | **im Repo** |
| EMV-Prüfbericht, 42 Seiten | ✅ relevant | ❌ **nicht im Repo** — nachfordern |
| RoHS-Zertifikat ZOL250304Y6040-1RC | ✅ relevant | **im Repo** |
| RoHS-Prüfbericht ZOL250324Y8079-1RC, 20 Seiten | ✅ relevant | **im Repo**, bestanden |
| UN38.3-Prüfbericht Nr. 1125100232 | ✅ Luftfracht | **im Repo** — deckt nur die **Zelle** |
| MSDS Nr. 262670100929 | ✅ Luftfracht | **im Repo** |
| FCC-Bericht und FCC-Erklärung | ❌ USA | im Repo, wertlos für die EU |
| **EU-Konformitätserklärung** | ✅ **Pflicht** | ❌ **fehlt** |

**Achtung bei den Nummern.** `-3EC` und `-1RC` tragen die Überschrift *Certificate of
Conformity*, `ZOL250324Y8079-1RC` die Überschrift *Test Report*. Die Vorlage nannte
`-3EC` früher fälschlich einen Prüfbericht; das ist korrigiert. Jede Zeile in Punkt 8
der Erklärung benennt jetzt die Dokumentart, die auf dem Dokument selbst steht.

**Es fehlt genau ein Dokument.** Alle Prüfungen dahinter existieren. Ein ausfüllfertiges
Formular liegt bereit:
[`konformitaetserklaerung-vorlage.md`](konformitaetserklaerung-vorlage.md) und
[`dokumente/EU-Declaration-of-Conformity-TEMPLATE.pdf`](dokumente/EU-Declaration-of-Conformity-TEMPLATE.pdf).

**Reihenfolge, die eingehalten werden muss:** erst die unterschriebene Erklärung, **dann**
darf das CE-Zeichen auf die Verpackung. Ein CE-Zeichen ohne Erklärung ist eine falsche
Kennzeichnung, und die Haftung liegt beim Importeur in Deutschland.

### Offene Punkte beim Lieferanten

- [ ] **Unterschriebene EU-Konformitätserklärung** für GB-868
- [x] **Akku: erledigt.** Der Lieferant hat **800 mAh** bestätigt, übereinstimmend
      mit MSDS und UN38.3. Die 1200 mAh von Karton und Listing waren falsch. Die
      Seite steht auf 800 mAh (7,4 V, 5,9 Wh)
- [ ] **UN38.3 auf Akkuebene:** Der vorliegende Bericht deckt nur die Einzelzelle.
      Für den zusammengebauten 7,4-V-Akku ist in der Regel eine eigene Prüfung nötig,
      sonst ist die Gefahrgutdeklaration unvollständig
- [ ] **EMV-Prüfbericht** (42 Seiten) nachfordern — nur das Zertifikat liegt vor
- [ ] **GB-868 für EMV bestätigen:** Beide Zertifikate nennen nur KK-26. Für RoHS
      trägt der Satz im Prüfbericht *„All models are same as the samples except model
      name and appearance"*; für EMV steht ein solcher Satz nirgends
- [ ] **Logo-Gebühr von 45 $ streichen** — kein Logo bei dieser Bestellung
- [ ] Bestimmungsland Deutschland auf Handelsrechnung und Versandpapieren
- [ ] HS-Nummer, unter der exportiert wird

---

## 7. Das Angebot für 60 Stück

```
Ware       $5,60 × 60      =  $336,00
Fracht, Zoll und EUSt      =  $552,20
Logo (wird gestrichen)     = ($45,00)
                           =  $888,20   entspricht rund 778 €
```

Produktionszeit 5 Tage, Versand 8–15 Tage, **DDP, keine Nachforderungen bei Ankunft.**

| | Kalkulation bisher | Angebot |
|---|---|---|
| Kapitaleinsatz | 982 € | **778 €** |
| Einstandspreis je Stück | 16,37 € | **12,96 €** |
| mit Banderole | — | 14,46 € |
| Deckungsbeitrag bei 79 € | 54 € | **rund 56 €** |
| Break-even-CPA | 45 € | **47 €** |

**204 € günstiger als geplant.** Nützt nichts ohne die Konformitätserklärung.

---

## 8. Die Logo-Entscheidung: kein Logo bei 60 Stück

> Wer ein Produkt unter eigenem Namen oder eigener Marke in Verkehr bringt, gilt als
> **Hersteller** — Art. 6 GPSR, ebenso der Blue Guide der EU-Kommission.

| Weg | Folge |
|---|---|
| Ware trägt ScPanda/Wenzhou als Hersteller, eigene Anschrift als Importeur | **die Konformitätserklärung des Lieferanten genügt** |
| Ware trägt „NackenFrei" | eigene Erklärung nötig: EMV-Messung 800–2.000 €, RoHS 300–600 €, technische Unterlagen zehn Jahre, volle Produkthaftung |

**Die Marke auf Webseite, Anzeigen, Rechnung und Paketaufkleber ist unproblematisch.**
Auslöser ist die Marke **auf Produkt oder Verpackung**. Ab 500 Stück ändert sich die
Rechnung.

---

## 9. Preis und Rechnung

Vollständig in [`rechnung.md`](rechnung.md).

**Verkaufspreis 79 €**, Bestellmenge **60 Stück**.

| | |
|---|---|
| Fixkosten Testphase | rund 788 € |
| Muster tatsächlich | **69,76 €** (Ware 9,92 · Versand 45,15 · EUSt 12,67 · Gebühr 2,04) |
| Werbebudget | 700 € (real 833 € mit Reverse Charge) |
| **Nötige Kaufrate der Seite** | **über 2,3 %** |

**Kernaussage:** Die erste Bestellung ist kein Geschäft, sondern der Kauf einer Zahl —
des CPA. Mit abverkauftem Restbestand endet die Testphase bei plus/minus null. Erst die
Nachbestellung über 500 Stück ist ein Geschäft: bei CPA 35 € rund **+7.300 €** im Jahr.

**Offener Punkt: Zollsatz.** Die kalkulierten 146 € sind reine Einfuhrumsatzsteuer, ohne
Zoll. Das trifft bei Einreihung unter **9019** (Massagegeräte) zu; bei **8543** kämen
rund 30 € hinzu. Beim Spediteur klären, oder aus der HS-Nummer des Lieferanten.

---

## 10. Was über die Musterlieferung gelernt wurde

- **Die Sendung kam nicht aus China**, sondern wurde in **Duiven, Niederlande** abgeholt.
  Kein Zollereignis in der Sendungsverfolgung. Die EU-Einfuhr erfolgte in den
  Niederlanden auf fremden Namen — der Empfänger war **nie Importeur of Record**.
- **ScPanda hat aber kein eigenes EU-Lager** („We are only based in China"). Die Muster
  liefen über die Sammelverzollung der Plattform. **Luftfracht und Einfuhrumsatzsteuer
  bleiben in der Kalkulation.**
- **Es kommt keine FedEx-Rechnung.** Terms: Shipper, kein Zollereignis. Die 12,67 € hat
  Alibaba über IOSS erhoben, weil die Sendung unter 150 € lag.
- **Die Länderangabe „Poland" stammt vom Lieferanten**, nicht aus dem Alibaba-Konto. Bei
  den Mustern folgenlos; bei der Warenbestellung ist die Handelsrechnung das
  Zollwertdokument und muss Deutschland nennen.
- **Keine Papierrechnung im Karton** — bei FedEx mit Electronic Trade Documents normal.

---

## 11. Wettbewerb

Ausführlich in [`wettbewerb.md`](wettbewerb.md). **Vorbehalt: Shop-Seiten waren beim
Recherchieren blockiert, die Preise sind Größenordnungen.**

```
  40 €  --  RENPHO Reach im Angebot
  46 €  --  RENPHO regulär, No-Name unteres Ende
  75 €  --  No-Name oberes Ende
 117 €  --  Beurer MG 180
 300 €  --  Theragun
```

**Der gebogene Griff ist kein Alleinstellungsmerkmal mehr.** Das einzige verbliebene
Argument: **fest gebauter Bogen statt ansteckbarem Verlängerungsgriff** — und der Bogen
hat im Belastungstest nicht nachgegeben, das Argument trägt also.

**Kein Lautstärkevorteil.** RENPHO wirbt mit bürstenlosem Motor unter 45 dB.

---

## 12. Die Webseite

`index.html` im Wurzelverzeichnis. Eine Datei, keine externen Abhängigkeiten,
eingebettete Schriften, hell und dunkel, ohne JavaScript bedienbar.

**Abschnitte:** Bühne · Reichweite · Aufsätze und Zonen · Technik · Vergleich ·
Bestellen · Fragen

**Was aus dem Mustertest geändert wurde:**

- Gewicht 590 g → **500 g** an neun Stellen
- Laufzeit-Kachel „30–35 min" → **„15 min Abschaltautomatik"**
- Ladung 5 V/1 A → **USB-C, 5 V / 2 A**
- „20 Watt" entfernt → **„bis 3.000/min"**
- **„Netzteil nicht enthalten"** im Lieferumfang und als FAQ
- **99-%-Hinweis** in FAQ und JSON-LD — Retourenvermeidung
- Gegenanzeigen erweitert
- Rhythmus-Abschnitt neu
- **Akku 1200 mAh → 800 mAh (7,4 V, 5,9 Wh)** an allen sechs Stellen, belegt durch
  MSDS und UN38.3
- **FAQ „Wie lange hält der Akku?"** — die unbelegten „30 bis 35 Minuten auf Stufe 1"
  sind ersetzt durch die gemessene Untergrenze **„über 45 Minuten auf höchster Stufe"**

**Noch offen: zehn Platzhalter**, die alle den Shop brauchen —
`SHOPIFY_PRODUKT_URL_EINTRAGEN` (2×), `SHOPIFY_SHOPDOMAIN_EINTRAGEN`,
`SHOPIFY_IMPRESSUM_URL`, `SHOPIFY_DATENSCHUTZ_URL` (2×), `SHOPIFY_WIDERRUF_URL`,
`LIEFERZEIT_EINTRAGEN` (3×).

**Eine offene Frage zur Seite:**

1. **„Reichweite" und „Aufsätze und Zonen" zeigen dieselbe Torso-Silhouette zweimal.**
   Der Inhaber hat das als „zu viel" bemängelt. Vorschlag: beide zu einem Abschnitt
   zusammenlegen — eine Figur, zwei Steuerungen. Nicht entschieden.

*(Die Akku-Frage ist erledigt, siehe Abschnitt 3.)*

**Ein auskommentierter Bewertungsabschnitt** wird erst aktiviert, wenn echte
Rückmeldungen vorliegen. Erfundene Bewertungen sind wettbewerbswidrig und bei Meta ein
Sperrgrund.

---

## 13. Was rechtlich zwingend ist

Ausführlich in [`checkliste.md`](checkliste.md), Block 1.

| Register | Warum | Aufwand |
|---|---|---|
| **LUCID / VerpackG** | Verpackung | kostenlos, am selben Tag |
| **Systembeteiligung** | duales System | 30–60 € im Jahr |
| **Stiftung EAR / ElektroG** | Elektrogerät | **der Engpass**, Wochen, braucht insolvenzsichere Garantie |
| **Batterieregister** | Lithiumakku | über die EAR |
| **EORI-Nummer** | gewerbliche Einfuhr | kostenlos beim Zoll |
| **USt-IdNr.** | Reverse Charge bei Meta | kostenlos beim BZSt |

Dazu Rechtstexte und die GPSR-Angabe von Name und Anschrift auf Produkt oder Verpackung.

**Offene Frage für den Steuerberater:** Da die Ware über eine Sammelverzollung in den
Niederlanden kommt und der Inhaber nicht Importeur of Record ist — ändert das etwas an
den EAR-Pflichten? Er bringt die Ware in Deutschland in Verkehr, die Pflichten dürften
bleiben. **Belegt: die Sendungsverfolgung des Musters.**

**Ebenfalls für die Rechtsberatung:** Die Batterieverordnung (EU) 2023/1542 begründet
eigene Pflichten und ist bisher nicht bearbeitet.

**Vor dem ersten Verkauf:** Konformitätserklärung vom Rechtstexte-Anbieter gegenlesen
lassen. Die 50 € Mitgliedschaft stehen ohnehin in der Kalkulation.

---

## 14. Marke und Werbung

`logo/` — Wortmarke „NACKENFREI" in Fira Sans Condensed, Schrift in Pfade ausgelegt.
**Wird bei dieser Bestellung nicht gedruckt** (siehe Abschnitt 8).

Kampagnenplan in [`instagram-plan.md`](instagram-plan.md), Creatives in
[`werbevideos.md`](werbevideos.md).

**Nicht „Instagram", sondern Meta.** Vier Anzeigenkonzepte, drei aus dem Produktfoto
generierbar, das vierte braucht eine Handyaufnahme am eigenen Rücken.

**Regel, die über allem steht:** über das Produkt sprechen, nie über die Person.
Anzeigen, die dem Betrachter ein Leiden unterstellen, werden abgelehnt.

**Kampagnenrahmen:** eine Kampagne, breite Zielgruppe DE 30–65, 25 €/Tag, 4–6 Creatives,
Auswertung nur montags.

**Meta-Kundenzufriedenheitswert im Blick behalten** — unter 2,0 werden Anzeigen
eingeschränkt, unter 1,0 wird das Konto gesperrt.

⚠️ **Alle technischen Angaben in `werbevideos.md` sind veraltet** — dort stehen noch
590 g und 20 W. Vor Verwendung gegen Abschnitt 3 abgleichen.

---

## 15. Nächste Schritte

**Sofort, hängt an niemandem:**

1. **Block H** — Fotos, vor allem das Gerät am eigenen Rücken angesetzt
2. **Leistungsaufnahme messen** — die fehlende Zahl. Ohne sie bleibt die Laufzeitfrage
   offen, und deshalb steht auf der Seite gerade keine Laufzeitangabe
3. **Kostenlose Registrierungen:** EORI beim Zoll, USt-IdNr. beim BZSt, LUCID. Kosten
   nichts, haben aber Vorlauf

*(Block E ist am 9.9.2026 bestanden — siehe Abschnitt 4.)*

> **Stiftung EAR bewusst noch nicht.** Die rund 500 € mit insolvenzsicherer Garantie
> schließen den günstigen Ausstieg, der derzeit bei 69,76 € liegt. Erst ausgeben, wenn
> die unterschriebene Konformitätserklärung da ist.

**Wartet auf ScPanda — nur noch eines:** die **unterschriebene
Konformitätserklärung**. **Nachricht mit Anhang am 10. September 2026 abgeschickt.**
Bleibt eine Antwort bis etwa zum 17. September aus, genau einmal nachfassen — nur mit
dieser einen Bitte. Wortlaut der Nachricht in
[`anfrage-scpanda-ce.md`](anfrage-scpanda-ce.md), die ausfüllfertige Vorlage liegt
bei und ist gegen 38 Punkte geprüft.

*Danach nachfordern, nicht jetzt:* EMV-Prüfbericht, UN38.3 auf Akkuebene, und in der
Bestellnachricht Logo-Gebühr, Bestimmungsland und HS-Nummer.

**Danach in dieser Reihenfolge:** LUCID · Stiftung EAR (dauert am längsten) ·
Batterieregister · EORI · USt-IdNr. · Rechtstexte · Banderole gestalten und drucken ·
Shopify mit den zehn Platzhaltern · Pixel und Conversions-API · Testkauf ·
Instagram-Profil · **dann die 60 Stück** · dann Anzeigen.

---

## 16. Was unterwegs korrigiert wurde

Damit dieselben Irrtümer nicht zweimal passieren.

- **Der Vorwurf, ScPanda biete über Listenpreis an, war falsch.** 5,66 $ entsprechen
  4,96 € — Alibaba zeigt Europreise nur umgerechnet an.
- **„Rund ein Fünftel des Rückens" war eine erfundene Zahl** und wurde entfernt.
- **Die 590 g der Seite waren falsch**, es sind 500 g.
- **Die 15:05 Laufzeit waren nicht der leere Akku**, sondern die Abschaltautomatik. Die
  daraus gezogene Schlussfolgerung „35 W wären unmöglich" ging von einer falschen
  Prämisse aus.
- **Das 1-A-Netzteil war nicht die Ursache des Stehenbleibens bei 99 %.** Die Anzeige
  kann 100 gar nicht darstellen. Die falsche Erklärung stand wörtlich auf der Seite und
  ist ersetzt.
- **Der Frachthebel über ein EU-Lager existiert nicht.** ScPanda hat kein Lager in Europa.
- **Die Länderangabe Polen war nicht der Fehler des Inhabers**, sondern die Deklaration
  des Lieferanten.
- **Die Vorlage der Konformitätserklärung hatte in drei Durchgängen Fehler** — acht statt
  sieben Punkte nach Anhang IV, falsche Fundstelle für das RoHS-Verfahren (Modul A des
  Anhangs II zum Beschluss 768/2008/EG, nicht Anhang II der RoHS-Richtlinie), fehlende
  Chargenangabe. **Konsequenz: PDFs werden seither nach dem Erzeugen ausgelesen und
  gegen eine Prüfliste kontrolliert, statt sich auf die Absicht zu verlassen.**
- **100 Stück waren die falsche Empfehlung.** Ein 700-€-Test verkauft nur 15 bis 25
  Geräte.
- **Die 1200 mAh waren nie belegt.** MSDS und UN38.3 nennen eine 800-mAh-Zelle; zwei
  davon in Reihe ergeben 7,4 V bei weiterhin 800 mAh. Die Zahl stand an sechs Stellen
  auf der Seite und ist entfernt.
- **Die Konformitätserklärung nannte das EMV-Zertifikat einen Prüfbericht.**
  `ZOL250324Y8079-3EC` trägt die Überschrift *Certificate of Conformity*. Punkt 8
  benennt jetzt jedes Dokument mit seiner echten Art.
- **Der Produktname war nicht die Laborschreibweise.** Alle vier ZOL-Dokumente sagen
  **FASCIAL GUN MASSAGE**; die Vorlage sagte „Percussion massage gun" bzw. „Fascial
  gun massager". Jetzt wörtlich übernommen, damit die Fabrik nichts vergleichen muss.
- **`instagram-plan.md` und `checkliste.md` rechneten weiter mit 99,99 €** und
  AliExpress-Bezug. Der maximale CPA stand dort auf 55 € statt 47 € — eine Kampagne
  nach diesen Zahlen hätte rechnerisch im Plus und real im Minus gelaufen. Beide
  Dokumente sind auf 79 € durchgerechnet.
- **Die §-19-Grenze waren nie 250 Geräte.** 250 × 99,99 € ergeben 25.000 €; bei 79 €
  sind es **316 Geräte**. Die Zahl war aus der alten Preisannahme stehengeblieben und
  stand auch in dieser Übersicht.
- **Der maximale CPA nach dem Wechsel in die Regelbesteuerung war falsch gerechnet.**
  Er stand mit 42 € da, also durch 1,19 geteilt. Dieser Faktor gilt nur unter § 19,
  wo die Steuer auf die Werbung nicht abziehbar ist.
- **Eine ältere Fassung der Konformitätserklärung war fast abgeschickt worden.** Die
  Datei war byte-identisch mit dem Stand vor allen drei Korrekturdurchgängen. Deshalb
  wird die Vorlage jetzt aus
  [`dokumente/make-konformitaetserklaerung.py`](dokumente/make-konformitaetserklaerung.py)
  erzeugt und von
  [`dokumente/check-konformitaetserklaerung.py`](dokumente/check-konformitaetserklaerung.py)
  gegen 38 Punkte geprüft — es gibt nur noch eine gültige Fassung, und sie liegt im
  Repo.

---

## 17. Arbeitsumgebung

- Branch: `claude/website-instagram-werbung-l2dx07`
- **Der Netzwerkzugang blockiert amtliche Quellen** — EUR-Lex, ec.europa.eu,
  legislation.gov.uk, auskunft.ezt-online.de, Shop-Seiten. `code.claude.com` und die
  Websuche funktionieren.
- **Abhilfe:** claude.ai/code → Wolken-Symbol über dem Eingabefeld → Zahnrad an der
  Umgebung → **Network access** von *Trusted* auf **Custom** → Domains eintragen, Häkchen
  bei *Also include default list of common package managers*. Gilt erst für **neue**
  Sitzungen. Empfohlene Liste: `*.europa.eu`, `auskunft.ezt-online.de`, `*.zoll.de`,
  `*.amazon.de`, `*.geizhals.de`, `*.stiftung-ear.de`, `*.verpackungsregister.org`
- **PDFs mit Bildinhalt** lassen sich auslesen: JPEG-Ströme mit `pypdf` extrahieren
  und als Bild lesen; verschlüsselte PDFs über `pypdf` mit leerem Passwort, wobei das
  gebrochene `cryptography`-Modul über einen Shim ausgeblendet werden muss.
- **`poppler-utils` fehlt und lässt sich nicht nachinstallieren**, `pdftoppm` also
  nicht verfügbar. Ganze PDF-Seiten können nicht gerendert werden — deshalb der Weg
  über die eingebetteten JPEG-Ströme. Nachzuinstallieren sind dagegen problemlos:
  `pypdf`, `pillow`, `reportlab`.
- **Hochgeladene Dateien liegen unter `/root/.claude/uploads/<sitzung>/` und sind
  flüchtig.** Sie verschwinden mit der Sitzung. Alles, was aufbewahrungspflichtig ist,
  gehört sofort ins Repo — die acht Belege lagen bis zum 9. September 2026 nur in
  Chat-Verläufen.
