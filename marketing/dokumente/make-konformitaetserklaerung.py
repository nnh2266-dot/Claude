#!/usr/bin/env python3
"""Erzeugt die EU-Konformitaetserklaerung als ausfuellfertige Vorlage.

Jede Angabe stammt aus einem Beleg, der unter marketing/dokumente/ liegt.
Die Quelle steht jeweils als Kommentar an der Angabe. Nach dem Erzeugen
prueft check-konformitaetserklaerung.py die PDF gegen eine Pruefliste --
nicht gegen die Absicht dieses Skripts.

Aufruf:  python3 marketing/dokumente/make-konformitaetserklaerung.py
"""

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

OUT = "marketing/dokumente/EU-Declaration-of-Conformity-TEMPLATE.pdf"

PAGE_W, PAGE_H = A4
LEFT = 70.87           # 25 mm
RIGHT = PAGE_W - LEFT
INDENT = LEFT + 17.0   # Einzug fuer Fliesstext unter einer Nummer

# --- Belegte Angaben -------------------------------------------------------
# Produktname woertlich wie im EMV-Zertifikat, RoHS-Zertifikat, RoHS-Bericht
# und FCC-Bericht: "FASCIAL GUN MASSAGE"
PRODUCT = "FASCIAL GUN MASSAGE"
# KK-26 aus beiden Zertifikaten. GB-868 ist die Bestellbezeichnung und muss
# zusaetzlich genannt werden, weil darunter geliefert wird.
MODELS = "KK-26  /  GB-868"
# Hersteller und Anschrift woertlich aus beiden Zertifikaten
MANUFACTURER = "Wenzhou Yi Xiang Electronic Technology Co., Ltd."
ADDRESS = [
    "B17-7 Mechanical Industrial Park, Wanquan Light Industry Production Base,",
    "Pingyang County, Wenzhou City, Zhejiang Province, China",
]
# Normen woertlich aus dem EMV-Zertifikat ZOL250324Y8079-3EC.
# EN IEC 63000:2018 ist die harmonisierte Norm fuer die technische
# Dokumentation nach RoHS (Nachfolgerin von EN 50581:2012).
STANDARDS = [
    "EN IEC 55014-1:2021",
    "EN IEC 55014-2:2021",
    "EN IEC 61000-3-2:2019+A1:2021",
    "EN 61000-3-3:2013+A1:2019+A2:2021",
    "EN IEC 63000:2018",
]
# Jede Zeile mit der Dokumentart benannt, die auf dem Dokument selbst steht:
# -3EC und -1RC tragen die Ueberschrift "Certificate of Conformity",
# ZOL250324Y8079-1RC die Ueberschrift "Test Report".
EVIDENCE = [
    "EMC certificate    ZOL250324Y8079-3EC    issued 24 Mar 2025",
    "RoHS certificate   ZOL250304Y6040-1RC    issued 24 Mar 2025",
    "RoHS test report   ZOL250324Y8079-1RC    issued 24 Mar 2025",
    "all issued by Ningbo Zhengou Testing Technology Co., Ltd",
]


class Sheet:
    def __init__(self, c):
        self.c = c
        self.y = PAGE_H - 62

    def move(self, dy):
        self.y -= dy

    def text(self, s, size=9.5, font="Helvetica", x=INDENT, dy=11.4):
        self.c.setFont(font, size)
        self.c.drawString(x, self.y, s)
        self.move(dy)

    def heading(self, num, title):
        self.move(9.5)
        self.c.setFont("Helvetica-Bold", 9)
        self.c.drawString(LEFT, self.y, f"{num}.")
        self.c.drawString(LEFT + 17, self.y, title)
        self.move(12.5)

    def note(self, s):
        """Der Klammerzusatz des Anhangs, klein unter der Ueberschrift."""
        self.c.setFont("Helvetica-Oblique", 7.5)
        self.c.drawString(INDENT, self.y, s)
        self.move(11.0)

    def rule(self, x0=LEFT, x1=RIGHT, dy=0):
        self.c.setLineWidth(0.6)
        self.c.line(x0, self.y + dy, x1, self.y + dy)

    def blank(self, x0, x1, caption):
        """Ausfuellbare Linie mit Beschriftung darunter."""
        self.c.setLineWidth(0.6)
        self.c.line(x0, self.y, x1, self.y)
        self.c.setFont("Helvetica", 7.5)
        self.c.drawString(x0, self.y - 10.2, caption)


def build():
    c = canvas.Canvas(OUT, pagesize=A4)
    c.setTitle("EU Declaration of Conformity - FASCIAL GUN MASSAGE KK-26 / GB-868")
    c.setAuthor(MANUFACTURER)
    c.setSubject("Annex IV of Directive 2014/30/EU and Annex VI of Directive 2011/65/EU")
    s = Sheet(c)

    # --- Kopf --------------------------------------------------------------
    c.setFont("Helvetica-Bold", 15)
    c.drawCentredString(PAGE_W / 2, s.y, "EU DECLARATION OF CONFORMITY")
    s.move(15.5)
    c.setFont("Helvetica", 8)
    c.drawCentredString(
        PAGE_W / 2, s.y,
        "Annex IV of Directive 2014/30/EU  |  Annex VI of Directive 2011/65/EU")
    s.move(19)

    # "No." mit Ausfuelllinie -- RoHS Anhang VI Punkt 1 verlangt eine
    # eindeutige Kennung der Erklaerung.
    c.setFont("Helvetica", 9)
    c.drawString(LEFT + 224, s.y, "No.")
    c.setLineWidth(0.6)
    c.line(LEFT + 224 + 17, s.y - 1.5, LEFT + 334, s.y - 1.5)
    s.move(11)
    s.rule(dy=0)
    s.move(4)

    # --- 1 -----------------------------------------------------------------
    s.heading(1, "Apparatus model / product")
    s.note("(product, type, batch or serial number)")
    s.text(PRODUCT, font="Helvetica-Bold")
    s.text("hand-held, battery-powered percussion massage device", size=9)
    s.move(2)
    c.setFont("Helvetica", 9.5)
    c.drawString(INDENT, s.y, "Model(s):")
    c.setFont("Helvetica-Bold", 9.5)
    c.drawString(INDENT + 55, s.y, MODELS)
    s.move(15)
    c.setFont("Helvetica", 9)
    c.drawString(INDENT, s.y, "Batch or production date")
    c.setLineWidth(0.6)
    c.line(INDENT + 118, s.y - 1.5, INDENT + 270, s.y - 1.5)
    s.move(9)

    # --- 2 -----------------------------------------------------------------
    s.heading(2, "Name and address of the manufacturer")
    s.text(MANUFACTURER, font="Helvetica-Bold")
    for line in ADDRESS:
        s.text(line, size=9)
    s.move(3)

    # --- 3 -----------------------------------------------------------------
    s.heading(3, "Responsibility")
    s.text("This declaration of conformity is issued under the sole responsibility "
           "of the manufacturer.")
    s.move(3)

    # --- 4 -----------------------------------------------------------------
    s.heading(4, "Object of the declaration")
    s.note("(identification allowing traceability)")
    s.text(f"{PRODUCT}, hand-held battery-powered percussion massage device,")
    s.text("models KK-26 and GB-868, as identified in the documents listed under")
    s.text("point 8.")
    s.move(3)

    # --- 5 -----------------------------------------------------------------
    s.heading(5, "The object of the declaration described above is in conformity")
    c.setFont("Helvetica-Bold", 9)
    c.drawString(LEFT + 17, s.y, "with the relevant Union harmonisation legislation:")
    s.move(13.5)
    c.setFont("Helvetica-Bold", 9.5)
    c.drawString(INDENT, s.y, "Directive 2014/30/EU")
    c.setFont("Helvetica", 9.5)
    c.drawString(INDENT + 118, s.y, "Electromagnetic Compatibility (EMC)")
    s.move(12.5)
    c.setFont("Helvetica-Bold", 9.5)
    c.drawString(INDENT, s.y, "Directive 2011/65/EU")
    c.setFont("Helvetica", 9.5)
    c.drawString(INDENT + 118, s.y, "Restriction of Hazardous Substances (RoHS),")
    s.move(11.4)
    c.drawString(INDENT + 118, s.y, "as amended by Directive (EU) 2015/863 and")
    s.move(11.4)
    c.drawString(INDENT + 118, s.y, "Directive (EU) 2017/2102")
    s.move(12)

    # --- 6 -----------------------------------------------------------------
    s.heading(6, "References to the relevant harmonised standards used")
    for std in STANDARDS:
        s.text(std, size=9, dy=11.0)
    s.move(3)

    # --- 7 -- Anhang IV Punkt 7 ist die benannte Stelle, nicht die Berichte.
    s.heading(7, "Notified body")
    s.text("Not applicable. Conformity has been assessed by internal production "
           "control:")
    s.text("Annex II of Directive 2014/30/EU, and Module A of Annex II to Decision")
    s.text("No 768/2008/EC for Directive 2011/65/EU.")
    s.move(3)

    # --- 8 -----------------------------------------------------------------
    s.heading(8, "Additional information")
    for line in EVIDENCE[:-1]:
        s.text(line, size=9, dy=11.0)
    s.text(EVIDENCE[-1], size=8.5, dy=11.0)
    s.move(10)

    # --- Unterschriftsblock ------------------------------------------------
    s.rule()
    s.move(14)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(LEFT, s.y, "Signed for and on behalf of:")
    c.setFont("Helvetica-Bold", 9.5)
    c.drawString(LEFT + 136, s.y, MANUFACTURER)
    s.move(30)

    half = LEFT + 226.8
    s.blank(LEFT, LEFT + 164.4, "Place of issue")
    s.blank(half, half + 164.4, "Date of issue")
    s.move(31)
    s.blank(LEFT, LEFT + 164.4, "Name")
    s.blank(half, half + 164.4, "Function")
    s.move(33)
    s.blank(LEFT, LEFT + 255.1, "Signature and company stamp")

    # --- Fussnote ----------------------------------------------------------
    c.setLineWidth(0.6)
    c.line(LEFT, 53.86, RIGHT, 53.86)
    c.setFont("Helvetica", 7)
    c.drawString(LEFT, 42.5,
                 "Template for completion by the manufacturer. Please print on "
                 "company letterhead, complete the open fields and sign.")
    c.drawString(LEFT, 33.4,
                 "Content follows the mandatory structure of Annex IV of Directive "
                 "2014/30/EU and Annex VI of Directive 2011/65/EU.")

    c.showPage()
    c.save()
    print(f"geschrieben: {OUT}")
    print(f"unterste Grundlinie im Textkoerper: y = {s.y:.1f} (Fussnote ab y = 53.9)")


if __name__ == "__main__":
    build()
