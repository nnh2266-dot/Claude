# NackenFrei — Checkliste bis zur ersten Anzeige

Vollständige Abarbeitungsliste. Reihenfolge innerhalb eines Blocks egal,
Reihenfolge der Blöcke nicht. Begründungen stehen in `instagram-plan.md`.

`(dort)` = von Thailand aus erledigbar · `(DE)` = braucht die Rückkehr

**Grobe Zuordnung:** Block 0–2 in Woche 1 · Block 3–5 in Woche 2 ·
Block 6–7 in Woche 3 · Block 8 nach Ankunft · Block 9–10 danach.

---

## Block 0 — Blockierende Entscheidungen

Ohne diese drei Antworten kann der Rest schiefgehen.

- [ ] **Verkauft eine EU-Firma?** Deutsches Gewerbe / UG / GmbH vorhanden — ja oder
      nein? Bei nein: EU-Bevollmächtigten, EAR-Bevollmächtigten und IOSS-Vermittler
      beauftragen oder eine deutsche UG gründen. *(dort)*
- [ ] **Ist 15,91 € der Landepreis** oder der reine Warenwert? Fracht, Zoll und
      Einfuhrabgaben dazurechnen und den Deckungsbeitrag neu bestimmen. *(dort)*
- [ ] **Steuerberater terminieren** — Themen: Einfuhrumsatzsteuer, IOSS, Vorsteuerabzug
      bei AliExpress-Einkäufen, Ansässigkeit bei längerem Auslandsaufenthalt. *(dort)*

---

## Block 1 — Recht und Registrierungen

Alles vor dem ersten Verkauf, nicht vor der ersten Anzeige. Zuerst anstoßen,
weil Bearbeitungszeiten dranhängen.

- [ ] **Stiftung EAR / ElektroG** — Registrierung als Hersteller. Dauert am längsten,
      deshalb zuerst *(dort)*
- [ ] **Batterierecht** — Batterien registrieren, Rücknahmepflicht klären *(dort)*
- [ ] **VerpackG** — LUCID-Registrierung und Beteiligung an einem dualen System *(dort)*
- [ ] **GPSR** — verantwortliche Person in der EU benennen; Hersteller- und
      Importeurangaben für Produkt und Angebot vorbereiten *(dort)*
- [ ] **CE-Konformitätserklärung** beim Lieferanten anfordern, auf EMV und RoHS prüfen *(dort)*
- [ ] **Rechtstexte beauftragen**: Impressum, Datenschutzerklärung, Widerrufsbelehrung,
      AGB. Anwalt oder geprüfter Dienst, kein Gratisgenerator *(dort)*
- [ ] **IOSS** klären: Umsatzsteuer beim Verkauf erheben und abführen, damit der Kunde
      nicht beim Zoll nachzahlt *(dort)*

---

## Block 2 — Lieferant und Muster

Der wichtigste Block dieser Woche. Die Muster brauchen die drei Wochen Laufzeit.

- [ ] **2–3 Lieferanten mit EU-Lager** auswählen — Filter „Versand aus Deutschland /
      Polen / Tschechien", oft über AliExpress Choice *(dort)*
- [ ] **Von jedem ein Muster an die deutsche Heimatadresse bestellen** *(dort)*
- [ ] Beim Lieferanten **vor** der Bestellung erfragen: keine Rechnung, kein Preis,
      kein Werbematerial im Paket *(dort)*
- [ ] Bestelldatum je Lieferant notieren, um die echte Laufzeit zu messen *(dort)*
- [ ] Nach Ankunft: jemanden vor Ort bitten, **Paket und Beilagen zu fotografieren**,
      bevor du da bist *(dort)*
- [ ] **Lieferant entscheiden** anhand Laufzeit, Verpackung, Verarbeitung *(dort)*
- [ ] Klären, wohin Retouren gehen und wer sie annimmt *(dort)*

---

## Block 3 — Shop aufsetzen

- [ ] Shopify-Konto, Produkt anlegen, Preis 99,99 € *(dort)*
- [ ] Versandzonen: **Deutschland und Österreich**, kostenfrei. **Schweiz nicht
      anbieten** *(dort)*
- [ ] Zahlungsarten einrichten (Karte, PayPal, Klarna oder Kauf auf Rechnung) *(dort)*
- [ ] Rechtstexte aus Block 1 als Seiten anlegen und verlinken *(dort)*
- [ ] Bestell- und Versandbestätigungsmails einrichten *(dort)*
- [ ] Newsletter-Anmeldung mit **Double-Opt-In** und automatischem Rabattcode
      (10 % auf die erste Bestellung) *(dort)*
- [ ] Domain `nackenfrei-shop.de` verbinden, `www` als kanonische Fassung *(dort)*
- [ ] `og.jpg` im Wurzelverzeichnis der Domain ablegen — sonst zeigt kein Teilen ein Bild *(dort)*

---

## Block 4 — Landingpage anpassen

Datei: `index.html` auf Branch `claude/side-landing-checklist-criteria-8rejna`.

- [ ] `SHOPIFY_PRODUKT_URL_EINTRAGEN` ersetzen — **2 Stellen** (Kopfzeilen-Button und
      „In den Warenkorb") *(dort)*
- [ ] `SHOPIFY_SHOPDOMAIN_EINTRAGEN` im Newsletter-Formular ersetzen *(dort)*
- [ ] `SHOPIFY_IMPRESSUM_URL` ersetzen *(dort)*
- [ ] `SHOPIFY_DATENSCHUTZ_URL` ersetzen *(dort)*
- [ ] `SHOPIFY_WIDERRUF_URL` ersetzen *(dort)*
- [ ] `LIEFERZEIT_EINTRAGEN` ersetzen — **2 Stellen** (FAQ und strukturierte Daten) *(dort)*
- [ ] **Rückgabefrist von 30 auf 14 Tage** ändern — an allen Stellen inklusive FAQ *(dort)*
- [ ] **Schweiz entfernen** — Bestellabschnitt, Versandhinweis, FAQ, Zollhinweis *(dort)*
- [ ] **Sozialbeweis-Abschnitt ergänzen** — Bewertungen und Kundenstimmen. Aufbau jetzt,
      Inhalte nach den ersten Bestellungen. Größter Hebel auf die Kaufrate *(dort)*
- [ ] **Vergleichsabschnitt** gerade vs. gebogene Massagepistole wieder aufnehmen *(dort)*
- [ ] Widerspruch klären: Seite nennt **vier** Aufsätze, das Video-Prompt-Dokument
      spricht von **fünf**. Gegen das echte Produkt prüfen *(DE)*

---

## Block 5 — Messung und Meta-Konten

Ohne diesen Block ist jede Anzeige Blindflug.

- [ ] **Meta Business Suite**: Unternehmenskonto anlegen *(dort)*
- [ ] Werbekonto anlegen, Zahlungsmethode hinterlegen *(dort)*
- [ ] Facebook-Seite „NackenFrei" anlegen *(dort)*
- [ ] **Meta-Pixel** einbinden *(dort)*
- [ ] **Conversions-API** einbinden (nicht optional — der Pixel allein verliert Käufe) *(dort)*
- [ ] Ereignisse einrichten: `ViewContent`, `AddToCart`, `InitiateCheckout`, `Purchase` *(dort)*
- [ ] **Domain in Meta verifizieren** und Ereignisse priorisieren *(dort)*
- [ ] **Consent-Banner** einbauen — Pixel darf erst **nach** Einwilligung feuern *(dort)*
- [ ] **Testkauf im eigenen Shop** mit echter Zahlung durchführen *(dort)*
- [ ] Im Ereignis-Manager prüfen: Kommt der Testkauf als `Purchase` an? *(dort)*

> **Stopp-Schild:** Erst wenn dieser Haken sitzt, darf Werbebudget fließen.

---

## Block 6 — Creatives

Produktvideos per Image-to-Video nach `nackenfrei-video-prompt.md`
(Branch `claude/container-scroll-animation-3f0qs8`), Startframe `produktfoto.png`.

- [ ] Konzept A „Reichweite" in **9:16** erzeugen *(dort)*
- [ ] Konzept B als **animierte Reichweiten-Grafik** — Rückensilhouette, Zonen leuchten
      auf, Kupfer auf Graphit *(dort)*
- [ ] Konzept C **Vier-Aufsätze-Erklärer** — je Aufsatz eine Zone *(dort)*
- [ ] Konzept D **Sicherheitsserie** aus dem FAQ — nicht auf Knochen, zwei Finger
      Abstand zur Wirbelsäule, max. 15 Sekunden je Punkt *(dort)*
- [ ] Konzept E **Drei-Minuten-Feierabendroutine** *(dort/DE)*
- [ ] Anwendungsszene „Die Stelle" testweise generieren — hält die Geometrie Arm hinter
      der Schulter? Wenn nein: mit dem Handy aufnehmen *(dort, ggf. DE)*
- [ ] **Voiceover** mit ElevenLabs, Untertitel für stummes Abspielen *(dort)*
- [ ] Je Anzeigenkonzept **3–4 Varianten der ersten drei Sekunden**, Rest identisch *(dort)*
- [ ] Alle Assets in **9:16 und 4:5** exportieren *(dort)*
- [ ] Anzeigentexte schreiben — **produktbezogen, nie personenbezogen.** Kein „Leidest
      du unter …", keine Heil- oder Linderungsversprechen *(dort)*

---

## Block 7 — Instagram-Kanal

- [ ] Profi-Konto anlegen, mit Facebook-Seite und Business-Konto verbinden *(dort)*
- [ ] Profilname „NackenFrei", Bio mit dem tragenden Satz, Link zum Shop *(dort)*
- [ ] Profilbild und einheitliche Bildsprache aus der Farbwelt der Seite *(dort)*
- [ ] Highlights anlegen: **Aufsätze · Anwendung · Sicherheit · Versand & Rückgabe** *(dort)*
- [ ] 12–15 Beiträge vorbereiten und terminieren *(dort)*
- [ ] Veröffentlichen starten, 3–4 Beiträge pro Woche *(dort)*

> **Stopp-Schild:** Vor der ersten Anzeige mindestens **neun Beiträge** und
> **vier Highlights** sichtbar.

---

## Block 8 — Nach Ankunft: Produkt prüfen

Alles gegen das echte Gerät, nicht gegen das Datenblatt.

- [ ] Auspacken und **Laufzeit der Lieferung** notieren *(DE)*
- [ ] **Neun Kraftstufen** vorhanden? *(DE)*
- [ ] **Gewicht 590 g** nachwiegen *(DE)*
- [ ] **Akku 1200 mAh**, Ladung USB 5 V *(DE)*
- [ ] **Laufzeit auf Stufe 1: 30–35 Minuten** messen *(DE)*
- [ ] **Ladezeit 3–4 Stunden** messen *(DE)*
- [ ] **Leistung 20 Watt** plausibel? *(DE)*
- [ ] **Anzahl und Form der Aufsätze** — vier oder fünf? *(DE)*
- [ ] **Kartonmaß 34 × 25 × 5 cm** *(DE)*
- [ ] Material: ABS-Gehäuse, Silikonaufsätze *(DE)*
- [ ] **Kernversprechen selbst testen:** Kommt man mit dem Bogengriff allein zwischen
      die eigenen Schulterblätter? *(DE)*
- [ ] Lautstärke beurteilen — das häufigste Retourenargument bei Massagepistolen *(DE)*
- [ ] **Jede abweichende Angabe auf der Seite korrigieren** *(DE)*
- [ ] Fehlende Handyaufnahmen nachholen, falls die Generierung nicht getragen hat *(DE)*

> **Stopp-Schild:** Keine Anzeige mit ungeprüften Angaben. Falsche technische
> Daten sind wettbewerbsrechtlich angreifbar und erzeugen Retouren.

---

## Block 9 — Kampagne starten

- [ ] **Eine** Kampagne, Ziel Verkäufe *(DE)*
- [ ] Advantage+ Shopping oder breite Zielgruppe **DE, 30–65, alle Geschlechter** —
      kein Interessen-Micro-Targeting *(DE)*
- [ ] Platzierungen automatisch — **Instagram und Facebook**, Reels, Feed, Stories *(DE)*
- [ ] Budget **25 €/Tag** *(DE)*
- [ ] **4–6 Creatives** gleichzeitig, Konzepte A und B vorn *(DE)*
- [ ] **Ab Tag 10:** Retargeting auf Besucher der letzten 30 Tage, Konzepte C und G,
      8 €/Tag *(DE)*
- [ ] **Auswertung nur montags.** Jede Änderung setzt die Lernphase zurück *(DE)*
- [ ] Ab der ersten Bestellung **systematisch Rückmeldungen einsammeln** für den
      Sozialbeweis-Abschnitt *(DE)*

---

## Block 10 — Auswerten und entscheiden

Wöchentlich prüfen:

| Kennzahl | Ziel | Wenn sie reißt |
|---|---|---|
| Hook-Rate (3-Sek.-Views ÷ Impressionen) | > 25 % | Neue erste drei Sekunden, Rest behalten |
| Ausgehende Klickrate | > 1,0 % | Versprechen zu schwach oder unklar |
| Kaufrate der Seite | > 1,5 % | Anzeige und Seite versprechen Verschiedenes |
| Kosten pro Kauf | < 50 € | Jeder Verkauf zahlt drauf |
| ROAS | > 2,0 | Unter Break-even |
| Meta-Kundenzufriedenheit | > 3,0 | Lieferzeit oder Produkt — sofort handeln |

**Entscheidung nach vier Wochen und rund 700 € Budget:**

- [ ] **ROAS über 2,5** → skalieren. Budget alle 3–4 Tage um 20 %, Gewinner-Creative in
      fünf Varianten weiterbauen, Österreich dazunehmen
- [ ] **ROAS 1,3–2,5** → reparieren statt skalieren. Schwächste Kennzahl zuerst, meist
      die Hook-Rate, danach die Kaufrate der Seite
- [ ] **ROAS unter 1,3** → Meta aussetzen. Stattdessen Google Shopping und Suchanzeigen,
      dort greift man bestehende Nachfrage ab statt sie zu erzeugen

---

## Was dauerhaft zu beobachten ist

- [ ] **Meta-Kundenzufriedenheitswert** im Commerce Manager. Unter 2,0 werden Anzeigen
      eingeschränkt, unter 1,0 wird das Konto gesperrt. Der wahrscheinlichste Weg, dieses
      Geschäft zu verlieren
- [ ] **Tatsächliche Lieferzeiten** je Bestellung — die Zahl, die alles andere treibt
- [ ] **Retourenquote** — über 12 % stimmt etwas mit Produkt oder Erwartung nicht
- [ ] **Lagerbestand beim Lieferanten** — bei Dropshipping der blinde Fleck
