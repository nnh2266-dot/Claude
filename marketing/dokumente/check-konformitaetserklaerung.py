#!/usr/bin/env python3
"""Liest die erzeugte Konformitaetserklaerung aus und prueft sie.

Geprueft wird die fertige PDF, nicht der Quelltext des Erzeugerskripts.
Grund: Die Vorlage hatte in drei Durchgaengen Fehler, die niemand gesehen
hat, weil auf die Absicht statt auf das Ergebnis geschaut wurde.

Aufruf:  python3 marketing/dokumente/check-konformitaetserklaerung.py
Rueckgabe: 0 wenn alle Punkte bestehen, sonst 1.
"""

import sys

# Das ausgelieferte cryptography-Modul dieser Umgebung ist gebrochen und
# laesst pypdf beim Import abstuerzen. pypdf braucht es nur fuer
# verschluesselte PDFs, also blenden wir es aus.
for _m in [m for m in sys.modules if m.startswith("cryptography")]:
    del sys.modules[_m]


class _BlockCryptography:
    def find_module(self, name, path=None):
        return self if name.startswith("cryptography") else None

    def load_module(self, name):
        raise ImportError("cryptography absichtlich ausgeblendet")


sys.meta_path.insert(0, _BlockCryptography())

from pypdf import PdfReader  # noqa: E402

PDF = "marketing/dokumente/EU-Declaration-of-Conformity-TEMPLATE.pdf"

# (Beschreibung, erwarteter Text) -- jeder Eintrag muss woertlich vorkommen.
MUST_CONTAIN = [
    ("Produktname wie im Zertifikat", "FASCIAL GUN MASSAGE"),
    ("Modell aus den Zertifikaten", "KK-26"),
    ("Bestellbezeichnung", "GB-868"),
    ("Hersteller", "Wenzhou Yi Xiang Electronic Technology Co., Ltd."),
    ("Anschrift", "B17-7 Mechanical Industrial Park"),
    ("Haftungssatz", "sole responsibility of the manufacturer"),
    ("EMV-Richtlinie", "2014/30/EU"),
    ("RoHS-Richtlinie", "2011/65/EU"),
    ("RoHS-Aenderung 1", "2015/863"),
    ("RoHS-Aenderung 2", "2017/2102"),
    ("Norm 1", "EN IEC 55014-1:2021"),
    ("Norm 2", "EN IEC 55014-2:2021"),
    ("Norm 3", "EN IEC 61000-3-2:2019+A1:2021"),
    ("Norm 4", "EN 61000-3-3:2013+A1:2019+A2:2021"),
    ("Norm 5 (RoHS-Dokumentation)", "EN IEC 63000:2018"),
    ("EMV-Verfahren", "Annex II of Directive 2014/30/EU"),
    ("RoHS-Verfahren", "Module A of Annex II to Decision"),
    ("RoHS-Verfahren Fundstelle", "768/2008/EC"),
    ("EMV-Beleg mit richtiger Dokumentart", "EMC certificate    ZOL250324Y8079-3EC"),
    ("RoHS-Zertifikat", "RoHS certificate   ZOL250304Y6040-1RC"),
    ("RoHS-Bericht", "RoHS test report   ZOL250324Y8079-1RC"),
    ("Pruflabor", "Ningbo Zhengou Testing Technology Co., Ltd"),
    ("Chargenfeld", "Batch or production date"),
    ("Nummernfeld", "No."),
    ("Unterschriftsblock", "Signed for and on behalf of:"),
    ("Ort", "Place of issue"),
    ("Datum", "Date of issue"),
    ("Name", "Name"),
    ("Funktion", "Function"),
    ("Unterschrift", "Signature and company stamp"),
    ("Beide Anhaenge im Kopf", "Annex IV of Directive 2014/30/EU  |  "
                               "Annex VI of Directive 2011/65/EU"),
]

# Was nicht drinstehen darf.
MUST_NOT_CONTAIN = [
    ("FCC gehoert in kein EU-Dokument", "FCC"),
    ("Batterieverordnung gehoert nicht hierher", "2023/1542"),
    ("Das EMV-Zertifikat ist kein Pruefbericht", "EMC test report"),
]

NUMBERED_HEADINGS = [
    "1.", "2.", "3.", "4.", "5.", "6.", "7.", "8.",
]


def main():
    reader = PdfReader(PDF)
    failures = []
    checks = 0

    if len(reader.pages) != 1:
        failures.append(f"Seitenzahl ist {len(reader.pages)}, erwartet 1")
    checks += 1

    text = reader.pages[0].extract_text()

    for label, needle in MUST_CONTAIN:
        checks += 1
        if needle not in text:
            failures.append(f"fehlt: {label} -- erwartet {needle!r}")

    for label, needle in MUST_NOT_CONTAIN:
        checks += 1
        if needle in text:
            failures.append(f"darf nicht vorkommen: {label} -- gefunden {needle!r}")

    # Anhang IV verlangt acht Nummern.
    checks += 1
    missing = [n for n in NUMBERED_HEADINGS if n not in text]
    if missing:
        failures.append(f"Nummern fehlen: {', '.join(missing)}")

    # Nicht-ASCII zerfaellt in manchen Anzeigeprogrammen des Lieferanten.
    checks += 1
    non_ascii = sorted({ch for ch in text if ord(ch) > 127})
    if non_ascii:
        failures.append(f"Nicht-ASCII-Zeichen: {non_ascii}")

    # Ausfuellbare Linien: No., Charge, Ort, Datum, Name, Funktion,
    # Unterschrift -- dazu zwei Trennlinien und die Fussnotenlinie.
    checks += 1
    content = reader.pages[0].get_contents().get_data().decode("latin-1")
    lines = content.count(" l S")
    if lines < 10:
        failures.append(f"nur {lines} gezeichnete Linien, erwartet mindestens 10")

    print(f"{checks} Pruefpunkte")
    if failures:
        for f in failures:
            print(f"  FEHLER  {f}")
        print(f"\n{len(failures)} Punkte nicht bestanden.")
        return 1
    print("alle bestanden.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
