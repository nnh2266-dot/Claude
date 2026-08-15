#!/usr/bin/env python3
"""Baut index.html: bettet die Schriften als data:-URI in src/app.html ein.

Die Artifact-CSP blockiert externe Font-Hosts, darum muss alles in einer Datei
liegen. Aufruf: python3 build.py
"""
import base64
import pathlib
import sys

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "src" / "app.html"
OUT = ROOT / "index.html"
FONTS = ROOT / "assets" / "fonts"

# (Datei, CSS-family, weight)
FACES = [
    ("BigShoulders-Bold.ttf", "Big Shoulders", 700),
    ("InstrumentSans-Regular.ttf", "Instrument Sans", 400),
    ("InstrumentSans-Bold.ttf", "Instrument Sans", 700),
    ("GeistMono-Regular.ttf", "Geist Mono", 400),
    ("GeistMono-Bold.ttf", "Geist Mono", 700),
]

MARKER = "/*@FONTS@*/"


def main() -> int:
    html = SRC.read_text(encoding="utf-8")
    if MARKER not in html:
        print(f"Marker {MARKER} fehlt in {SRC}", file=sys.stderr)
        return 1

    blocks = []
    for filename, family, weight in FACES:
        path = FONTS / filename
        if not path.exists():
            print(f"Schrift fehlt: {path}", file=sys.stderr)
            return 1
        b64 = base64.b64encode(path.read_bytes()).decode("ascii")
        blocks.append(
            "@font-face{"
            f"font-family:'{family}';font-style:normal;font-weight:{weight};"
            "font-display:block;"
            f"src:url(data:font/ttf;base64,{b64}) format('truetype');"
            "}"
        )

    OUT.write_text(html.replace(MARKER, "\n".join(blocks)), encoding="utf-8")
    print(f"{OUT.name} geschrieben — {OUT.stat().st_size / 1024:.0f} KB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
