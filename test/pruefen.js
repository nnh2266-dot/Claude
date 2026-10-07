/**
 * Eine sehr kleine Prüfbibliothek.
 *
 * Der Grund, warum es sie gibt: Die Prüfläufe dieser App haben lange Zahlen
 * ausgedruckt, und jemand musste sie ansehen. Was nur druckt, kann nicht
 * durchfallen — ein Fehler steht dann mitten im Text und niemand merkt es.
 * Hier muss jede Erwartung ausgesprochen werden, und was nicht stimmt, zählt
 * am Ende in einer Zahl.
 */

export function neuerLauf(name) {
  const ergebnisse = [];

  const merke = (ok, titel, detail) => {
    ergebnisse.push({ ok, titel, detail });
    return ok;
  };

  return {
    name,
    ergebnisse,

    /** Muss wahr sein. */
    ist(bedingung, titel, detail = '') {
      return merke(Boolean(bedingung), titel, detail);
    },

    /** Muss gleich sein — verglichen wird über JSON, das reicht hier. */
    gleich(wert, erwartet, titel) {
      const a = JSON.stringify(wert);
      const b = JSON.stringify(erwartet);
      return merke(a === b, titel, a === b ? '' : `war ${a}, erwartet ${b}`);
    },

    /** Muss im Bereich liegen, Grenzen eingeschlossen. */
    zwischen(wert, unten, oben, titel) {
      const ok = typeof wert === 'number' && wert >= unten && wert <= oben;
      return merke(ok, titel, ok ? '' : `war ${wert}, erwartet ${unten}–${oben}`);
    },

    /** Text muss das Gesuchte enthalten. */
    enthaelt(text, teil, titel) {
      const ok = String(text || '').includes(teil);
      return merke(ok, titel, ok ? '' : `„${teil}" fehlt in: ${String(text || '').slice(0, 160)}`);
    },

    /** Text darf das Gesuchte gerade nicht enthalten. */
    enthaeltNicht(text, teil, titel) {
      const ok = !String(text || '').includes(teil);
      return merke(ok, titel, ok ? '' : `„${teil}" steht in: ${String(text || '').slice(0, 160)}`);
    },

    /** Eine Liste muss leer sein — für Fehlerlisten. */
    leer(liste, titel) {
      const arr = [...(liste || [])];
      return merke(arr.length === 0, titel, arr.slice(0, 5).join(' | '));
    },
  };
}
