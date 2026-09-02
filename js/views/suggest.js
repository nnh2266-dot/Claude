/**
 * Essensvorschläge: eine Karte auf der Tagesansicht.
 *
 * Sie erscheint nur, wenn sie etwas zu sagen hat — also wenn heute noch
 * nennenswert etwas übrig ist. Morgens um acht mit dem vollen Tagesbudget
 * vorzuschlagen, was man essen könnte, wäre albern; da weiß man es selbst.
 *
 * Ein Tippen auf einen Vorschlag öffnet den Editor mit den Nährwerten drin.
 * Nichts wird ungefragt eingetragen: Ein Vorschlag ist eine Idee, keine
 * Mahlzeit, und was du am Ende isst, weiß nur du.
 */

import { el, toast } from '../ui.js';
import { localDateKey } from '../nutrition.js';
import { suggest, mealTypeForHour, suggestionPrompt } from '../suggest.js';
import { suggestMeals } from '../claude.js';

/** Vorschläge von Claude, solange die Ansicht steht. */
let vonClaude = null;
let laeuft = false;

/** Beim Tageswechsel gehören die alten Vorschläge nicht mehr dazu. */
let fuerTag = null;

function zeile(v, ctx, dateKey) {
  const eintragen = () => ctx.openEditor({
    mode: 'manual',
    dateKey,
    name: v.name,
    items: [{
      name: v.zutaten || v.name,
      grams: v.grams || 0,
      kcal: v.kcal, protein: v.protein, carbs: v.carbs, fat: v.fat,
    }],
  });

  return el('button', { class: 'vorschlag', type: 'button', onClick: eintragen },
    el('div', { class: 'grow' },
      el('div', { class: 'vorschlagname', text: v.name }),
      el('div', { class: 'muted small',
        text: v.grund || v.zutaten
          || (v.quelle === 'favorit' ? 'aus deinen Favoriten' : 'Baustein') })),
    el('div', { class: 'vorschlagzahlen tabular' },
      el('div', { text: `${v.kcal} kcal` }),
      el('div', { class: 'muted small', text: `${v.protein} g EW` })));
}

/**
 * @param {object} ctx
 * @param {string} dateKey
 * @param {object} rest  { kcal, protein } — was heute noch übrig ist
 */
export function suggestSection(ctx, dateKey, rest) {
  if (dateKey !== localDateKey()) return null;
  // Unter 250 kcal Rest ist nichts mehr vorzuschlagen, was eine Mahlzeit wäre.
  if (!rest || rest.kcal < 250) return null;

  if (fuerTag !== dateKey) { vonClaude = null; fuerTag = dateKey; }

  const stunde = new Date().getHours();
  const mealType = mealTypeForHour(stunde);
  const eigene = suggest({
    rest,
    favorites: ctx.state.favorites || [],
    stunde,
    anzahl: 3,
  });

  const liste = vonClaude && vonClaude.length ? vonClaude : eigene;
  if (!liste.length) return null;

  const holen = async () => {
    if (laeuft) return;
    laeuft = true;
    ctx.reload();
    try {
      vonClaude = await suggestMeals({
        apiKey: ctx.settings.apiKey,
        model: ctx.settings.model,
        rest,
        mealType,
        // Was du oft isst, ist der beste Hinweis auf deinen Geschmack.
        mag: (ctx.state.favorites || []).slice(0, 6).map((f) => f.name),
      });
      toast('Drei Ideen von Claude.');
    } catch (err) {
      toast(err.message || 'Hat nicht geklappt.', 'err');
    } finally {
      laeuft = false;
      ctx.reload();
    }
  };

  const online = navigator.onLine !== false;
  const mitKey = Boolean(ctx.settings?.apiKey);

  const fuss = el('div', { class: 'row' },
    mitKey
      ? el('button', {
          class: 'btn grow', type: 'button', disabled: !online || laeuft,
          onClick: holen,
        }, laeuft ? 'Claude denkt nach …' : vonClaude ? 'Neue Ideen' : 'Idee von Claude')
      : el('button', {
          class: 'btn grow', type: 'button',
          onClick: async () => {
            const text = suggestionPrompt(rest, {
              mealType,
              mag: (ctx.state.favorites || []).slice(0, 6).map((f) => f.name),
            });
            try {
              await navigator.clipboard.writeText(text);
              toast('Frage kopiert — in der Claude-App einfügen.');
            } catch {
              toast('Kopieren ging nicht. Text steht in den Einstellungen.', 'err');
            }
          },
        }, 'Frage für die Claude-App kopieren'),
    vonClaude
      ? el('button', { class: 'btn', type: 'button',
          onClick: () => { vonClaude = null; ctx.reload(); } }, 'Eigene')
      : null);

  return el('div', { class: 'card stack' },
    el('div', { class: 'row-between' },
      el('h3', { class: 'card-title', text: 'Was noch reinpasst' }),
      el('span', { class: 'pill pill-kcal tabular',
        text: `${Math.round(rest.kcal)} kcal · ${Math.round(Math.max(0, rest.protein))} g EW` })),
    el('div', { class: 'vorschlagliste' }, ...liste.map((v) => zeile(v, ctx, dateKey))),
    vonClaude
      ? el('p', { class: 'muted small',
          text: 'Von Claude geschätzt. Die Nährwerte sind Näherungen — beim Eintragen '
            + 'lassen sie sich korrigieren.' })
      : null,
    fuss);
}
