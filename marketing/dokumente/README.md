# Technische Unterlagen — NackenFrei / FASCIAL GUN MASSAGE

Dies ist die technische Dokumentation zum Gerät. **Sie muss nach EMV-Richtlinie
Artikel 7 und RoHS Artikel 7 zehn Jahre ab dem letzten Inverkehrbringen
aufbewahrt werden.** Bis zum 9. September 2026 existierte sie nur in
Chat-Verläufen; seitdem liegt sie hier.

Der Produktname lautet in allen Labordokumenten **FASCIAL GUN MASSAGE**, das
geprüfte Modell **KK-26**. **GB-868** ist die Bestellbezeichnung desselben
Geräts. Hersteller ist **Wenzhou Yi Xiang Electronic Technology Co., Ltd.**,
Verkäufer auf Alibaba ist Shenzhen ScPanda Technology Co., Limited.

---

## Was hier liegt

| Datei | Nummer | Was es ist | Für Deutschland |
|---|---|---|---|
| `EMV-Zertifikat-ZOL250324Y8079-3EC.pdf` | ZOL250324Y8079-3EC | Certificate of Conformity, EMV 2014/30/EU, nennt die vier EMV-Normen | ✅ **relevant** |
| `RoHS-Zertifikat-ZOL250304Y6040-1RC.pdf` | ZOL250304Y6040-1RC | Certificate of Conformity, RoHS 2011/65/EU | ✅ **relevant** |
| `RoHS-Pruefbericht-ZOL250324Y8079-1RC.pdf` | ZOL250324Y8079-1RC | Test Report, 20 Seiten, IEC-62321-Prüfungen, bestanden | ✅ **relevant** |
| `UN38-3-Pruefbericht-1125100232.pdf` | 1125100232 | Test Report der Akku**zelle**, Shanghai Institute of Chemical Industry Testing | ✅ Luftfracht |
| `MSDS-Akkuzelle-INR14500-262670100929.pdf` | 262670100929 | Sicherheitsdatenblatt derselben Zelle | ✅ Luftfracht |
| `FCC-Erklaerung-ZOL250304Y6040-2EC.pdf` | ZOL250304Y6040-2EC | Supplier's Declaration of Conformity, FCC Part 15 | ❌ USA, für die EU wertlos |
| `FCC-Pruefbericht-ZOL250324Y8079-2RC.pdf` | ZOL250324Y8079-2RC | FCC Report, 18 Seiten | ❌ USA, für die EU wertlos |
| `EU-Declaration-of-Conformity-TEMPLATE.pdf` | — | **Ausfüllfertige Vorlage für die Fabrik**, erzeugt von `make-konformitaetserklaerung.py` | ✅ **das fehlende Stück** |

## Was fehlt

- ❌ **Die unterschriebene EU-Konformitätserklärung.** Das ist das einzige
  Dokument, das noch aussteht, und ohne das nicht verkauft werden darf. Alle
  Prüfungen dahinter existieren — es fehlt nur die Unterschrift der Fabrik.
- ❌ **Der EMV-Prüfbericht** (42 Seiten). Das Zertifikat `-3EC` liegt vor, der
  dazugehörige Bericht nicht. Für die technische Dokumentation gehört er dazu.
- ❌ **UN38.3 auf Akkuebene.** Siehe unten.

---

## Zwei Befunde aus den Belegen

### Der Akku hat 800 mAh, nicht 1200 mAh

MSDS und UN38.3-Bericht nennen übereinstimmend dieselbe Zelle:

> **INR14500-800mAh · 3,7 V · 800 mAh · 2,96 Wh**

Das Gerät läuft mit 7,4 V, das sind **zwei Zellen in Reihe**. In Reihenschaltung
verdoppelt sich die Spannung, die Kapazität bleibt gleich:

> **800 mAh bei 7,4 V = 5,92 Wh**

Die 1200 mAh von Karton, Alibaba-Listing und ursprünglicher Landingpage sind
durch kein Dokument gedeckt. Sie wurden am 9. September 2026 von der Seite
entfernt.

**Gegenprobe:** 5,92 Wh geteilt durch die 8,4 W Leistungsaufnahme, die der
Lieferant angibt, ergibt rund 42 Minuten. Gemessen wurden über 45 Minuten auf
Stufe 9. Mit 1200 mAh wären es rechnerisch 63 Minuten gewesen. Die Messung
stützt die 800 mAh.

### Die UN38.3-Prüfung deckt nur die Zelle

Der Bericht ist auf die **Einzelzelle** ausgestellt, Auftraggeber ist der
Zellhersteller Xinxiang Hongli Supply Source Technology. Für einen aus zwei
Zellen zusammengebauten 7,4-V-Akku verlangt UN 38.3 in der Regel zusätzlich
eine Prüfung **auf Akkuebene**. Das ist beim Lieferanten offen und steht in der
Frageliste.

---

## Die Vorlage neu erzeugen

```bash
python3 marketing/dokumente/make-konformitaetserklaerung.py
python3 marketing/dokumente/check-konformitaetserklaerung.py
```

Das zweite Skript liest die **fertige PDF** aus und prüft sie gegen 38
Prüfpunkte — nicht den Quelltext des ersten Skripts, sondern das Ergebnis.
Grund: Die Vorlage hatte in drei Durchgängen Fehler, die niemand gesehen hat,
weil auf die Absicht statt auf das Erzeugnis geschaut wurde.

Zwei Eigenheiten dieser Arbeitsumgebung sind in den Skripten berücksichtigt:

- Das ausgelieferte `cryptography`-Modul ist gebrochen und lässt `pypdf` beim
  Import abstürzen. Es wird über einen Shim ausgeblendet.
- `poppler-utils` ist nicht installiert, PDF-Seiten lassen sich also nicht
  rendern. Gescannte Belege werden gelesen, indem die eingebetteten
  JPEG-Ströme mit `pypdf` extrahiert und als Bild geöffnet werden.

---

## Reihenfolge, die eingehalten werden muss

1. Fabrik unterschreibt die Erklärung
2. **erst danach** darf das CE-Zeichen auf die Verpackung
3. Erklärung zehn Jahre aufbewahren, zusammen mit den Prüfberichten

Ein CE-Zeichen ohne unterschriebene Erklärung ist eine falsche Kennzeichnung,
und die Haftung dafür liegt beim Importeur in Deutschland.
