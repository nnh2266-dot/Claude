/**
 * Einstellungen: API-Key, Modell, Tagesziele, Daten-Verwaltung.
 */

import { el, mount, viewHead, field, toast, confirmAction } from '../ui.js';
import {
  setSetting, exportData, importData, clearEntries, clearEverything, countMeals,
} from '../store.js';
import { MODELS, testConnection, ApiError } from '../claude.js';
import { macrosFromKcal, parseNumber, DEFAULT_GOALS } from '../nutrition.js';
import { energyPlan } from '../energy.js';
import { APP_VERSION, APP_DATE } from '../version.js';

const CONSOLE_URL = 'https://console.anthropic.com/settings/keys';

/* ---------------- API-Key ---------------- */

function apiKeySection(ctx) {
  const input = el('input', {
    class: 'input',
    type: 'password',
    id: 'api-key',
    value: ctx.settings.apiKey,
    placeholder: 'sk-ant-…',
    autocomplete: 'off',
    autocapitalize: 'off',
    spellcheck: 'false',
  });

  const status = el('p', { class: 'hint' });

  const showToggle = el(
    'label',
    { class: 'row small muted', style: { cursor: 'pointer' } },
    el('input', {
      type: 'checkbox',
      style: { width: '18px', height: '18px', accentColor: 'var(--kcal)' },
      onChange: (event) => { input.type = event.target.checked ? 'text' : 'password'; },
    }),
    'Key anzeigen'
  );

  const saveButton = el(
    'button',
    {
      class: 'btn btn-primary grow',
      type: 'button',
      onClick: async () => {
        const value = input.value.trim();
        await setSetting('apiKey', value);
        await ctx.refreshSettings();
        toast(value ? 'API-Key gespeichert.' : 'API-Key entfernt.');
      },
    },
    'Key speichern'
  );

  const testButton = el(
    'button',
    {
      class: 'btn grow',
      type: 'button',
      onClick: async () => {
        const key = input.value.trim();
        if (!key) {
          status.textContent = 'Trag zuerst einen Key ein.';
          return;
        }

        testButton.disabled = true;
        testButton.textContent = 'Teste …';
        status.textContent = '';

        try {
          // Vor dem Test speichern, damit ein erfolgreicher Key gleich aktiv ist.
          await setSetting('apiKey', key);
          await ctx.refreshSettings();

          const result = await testConnection(key, ctx.settings.model);
          status.innerHTML = '';
          status.append(
            el('span', {
              style: { color: 'var(--ok)', fontWeight: '600' },
              text: `Verbindung steht — ${result.model} antwortet.`,
            })
          );
        } catch (err) {
          const message = err instanceof ApiError ? err.message : 'Test fehlgeschlagen.';
          status.innerHTML = '';
          status.append(el('span', { style: { color: 'var(--danger)' }, text: message }));
        } finally {
          testButton.disabled = false;
          testButton.textContent = 'Verbindung testen';
        }
      },
    },
    'Verbindung testen'
  );

  return el(
    'div',
    { class: 'card stack' },
    field('Anthropic API-Key', input),
    showToggle,
    el('div', { class: 'row' }, saveButton, testButton),
    status,
    el(
      'p',
      { class: 'hint' },
      'Den Key bekommst du kostenlos unter ',
      el('a', {
        href: CONSOLE_URL,
        target: '_blank',
        rel: 'noopener',
        style: { color: 'var(--kcal)', fontWeight: '600' },
        text: 'console.anthropic.com',
      }),
      '. Es fällt keine Grundgebühr an — du zahlst nur den Verbrauch, ' +
      'und das Guthaben lädst du selbst auf (mindestens 5 $, das reicht für über 1.000 Fotos).'
    ),
    el(
      'p',
      { class: 'hint' },
      'Kein Key, kein Guthaben? Dann erscheint beim Foto der Weg ',
      el('strong', { text: '„Über die Claude-App analysieren"' }),
      ' — du kopierst Prompt und Foto in die Claude-App und die Antwort zurück. ' +
      'Mehr Handarbeit, kostet aber nichts extra und eignet sich gut zum Ausprobieren.'
    ),
    el(
      'div',
      { class: 'banner banner-info' },
      el('strong', { text: 'Wo der Key liegt' }),
      'Der Key wird unverschlüsselt in der Datenbank dieses Browsers gespeichert und nur ' +
      'an api.anthropic.com geschickt. Wer Zugriff auf dein entsperrtes Gerät hat, kann ihn ' +
      'auslesen. Leg dir am besten einen eigenen Key nur für diese App an — dann lässt er ' +
      'sich im Anthropic-Konto einzeln widerrufen.'
    )
  );
}

/* ---------------- Modell ---------------- */

function modelSection(ctx) {
  const cards = MODELS.map((model) => {
    const active = ctx.settings.model === model.id;
    return el(
      'button',
      {
        class: 'day-row',
        type: 'button',
        style: { alignItems: 'flex-start' },
        onClick: async () => {
          await setSetting('model', model.id);
          await ctx.refreshSettings();
          toast(`Modell: ${model.label}`);
          ctx.reload();
        },
      },
      el(
        'span',
        { class: 'grow' },
        el('span', {
          class: 'd-name',
          style: { display: 'block', color: active ? 'var(--kcal)' : undefined },
          text: `${model.label}${active ? ' · aktiv' : ''}`,
        }),
        el('span', { class: 'small muted', style: { display: 'block' }, text: `${model.cost} — ${model.hint}` })
      )
    );
  });

  return el('div', { class: 'card' }, ...cards);
}

/* ---------------- Tagesziele ---------------- */

function goalsSection(ctx) {
  const goals = ctx.settings.goals;

  // Mit Trainingsplan kommen die Ziele aus dem Profil und wechseln zwischen
  // Trainings- und Ruhetagen. Zwei Stellen, die dasselbe setzen, würden sich
  // nur widersprechen — deshalb hier nur der Hinweis und der Weg dorthin.
  if (ctx.state.profile && ctx.state.plan) {
    const { training, rest } = energyPlan(ctx.state.profile, ctx.state.kcalAdjust);

    return el('div', { class: 'card stack' },
      el('p', { class: 'small' },
        'Deine Tagesziele rechnet der Trainingsplan aus — an Trainingstagen mehr, an Ruhetagen weniger.'),
      el('dl', { class: 'macrolist tabular' },
        el('div', null, el('dt', { text: 'Trainingstag' }),
          el('dd', { text: `${training.kcal} kcal · ${training.protein} g Eiweiß` })),
        el('div', null, el('dt', { text: 'Ruhetag' }),
          el('dd', { text: `${rest.kcal} kcal · ${rest.protein} g Eiweiß` }))),
      ctx.state.kcalAdjust
        ? el('p', { class: 'hint',
            text: `Enthält deine Korrektur von ${ctx.state.kcalAdjust > 0 ? '+' : ''}${ctx.state.kcalAdjust} kcal aus dem Fortschritt.` })
        : null,
      el('button', {
        class: 'btn', type: 'button', onClick: () => ctx.go('plan'),
      }, 'Zum Trainingsplan'));
  }

  const kcalInput = el('input', {
    class: 'input', type: 'text', inputmode: 'numeric', value: String(goals.kcal),
  });
  const proteinInput = el('input', {
    class: 'input', type: 'text', inputmode: 'numeric', value: String(goals.protein),
  });
  const carbsInput = el('input', {
    class: 'input', type: 'text', inputmode: 'numeric', value: String(goals.carbs),
  });
  const fatInput = el('input', {
    class: 'input', type: 'text', inputmode: 'numeric', value: String(goals.fat),
  });

  return el(
    'div',
    { class: 'card stack' },
    field('Kalorien pro Tag', kcalInput),
    el(
      'div',
      { class: 'item-grid' },
      el('label', { class: 'span-2' }, 'Eiweiß g', proteinInput),
      el('label', { class: 'span-2' }, 'KH g', carbsInput),
      el('label', { class: 'span-2' }, 'Fett g', fatInput)
    ),
    el(
      'button',
      {
        class: 'btn',
        type: 'button',
        onClick: () => {
          const suggestion = macrosFromKcal(parseNumber(kcalInput.value));
          proteinInput.value = String(suggestion.protein);
          carbsInput.value = String(suggestion.carbs);
          fatInput.value = String(suggestion.fat);
          toast('Vorschlag eingesetzt: 25 % Eiweiß, 45 % KH, 30 % Fett.');
        },
      },
      'Makros aus Kalorien berechnen'
    ),
    el(
      'button',
      {
        class: 'btn btn-primary',
        type: 'button',
        onClick: async () => {
          const next = {
            kcal: Math.max(1, Math.round(parseNumber(kcalInput.value))) || DEFAULT_GOALS.kcal,
            protein: Math.max(0, Math.round(parseNumber(proteinInput.value))),
            carbs: Math.max(0, Math.round(parseNumber(carbsInput.value))),
            fat: Math.max(0, Math.round(parseNumber(fatInput.value))),
          };
          await setSetting('goals', next);
          await ctx.refreshSettings();
          toast('Ziele gespeichert.');
          ctx.reload();
        },
      },
      'Ziele speichern'
    ),
    el('p', { class: 'hint' },
      'Der Ring auf der Startseite misst gegen das Kalorienziel, die Balken gegen die Makros.')
  );
}

/* ---------------- Daten ---------------- */

function dataSection(ctx, mealCount) {
  const importInput = el('input', {
    type: 'file',
    accept: 'application/json,.json',
    hidden: true,
    onChange: async (event) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;

      try {
        const parsed = JSON.parse(await file.text());
        const result = await importData(parsed);
        toast(`${result.meals} Mahlzeiten und ${result.favorites} Favoriten importiert.`);
        ctx.reload();
      } catch (err) {
        toast(err.message || 'Die Datei konnte nicht gelesen werden.', 'err');
      }
    },
  });

  return el(
    'div',
    { class: 'card stack' },
    el('p', { class: 'small muted',
      text: `${mealCount} ${mealCount === 1 ? 'Mahlzeit' : 'Mahlzeiten'} gespeichert.` }),
    el(
      'button',
      {
        class: 'btn',
        type: 'button',
        onClick: async () => {
          const data = await exportData();
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = el('a', { href: url, download: `naehrwerte-${data.exportedAt.slice(0, 10)}.json` });
          document.body.append(link);
          link.click();
          link.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        },
      },
      'Daten exportieren'
    ),
    el(
      'button',
      { class: 'btn', type: 'button', onClick: () => importInput.click() },
      'Daten importieren'
    ),
    importInput,
    el('p', { class: 'hint' },
      'Der Export enthält Mahlzeiten, Favoriten, Trainingsplan, Einheiten und Gewichte — ohne Fotos (die würden die Datei ' +
      'um ein Vielfaches vergrößern) und ohne den API-Key.'),
    el(
      'button',
      {
        class: 'btn btn-danger',
        type: 'button',
        onClick: async () => {
          if (!confirmAction('Alle Mahlzeiten und Favoriten löschen? Das lässt sich nicht rückgängig machen.')) return;
          await clearEntries();
          toast('Alle Einträge gelöscht.');
          ctx.reload();
        },
      },
      'Alle Einträge löschen'
    ),
    el(
      'button',
      {
        class: 'btn btn-danger',
        type: 'button',
        onClick: async () => {
          if (!confirmAction('Wirklich alles löschen — Einträge, Ziele und den API-Key?')) return;
          await clearEverything();
          await ctx.refreshSettings();
          toast('Alles gelöscht.');
          ctx.reload();
        },
      },
      'Alles löschen, auch den API-Key'
    )
  );
}

/* ---------------- Ansicht ---------------- */

/* ---------------- Fassung ---------------- */

/**
 * Zeigt, welche Fassung gerade läuft, und bietet den Notausgang: Offline-Speicher
 * wegwerfen und neu laden. Nötig, wenn ein Gerät hartnäckig eine alte Fassung
 * festhält — die eingetragenen Daten bleiben davon unberührt, die liegen in der
 * Datenbank und nicht im Zwischenspeicher.
 */
function versionSection() {
  const status = el('p', { class: 'hint' });

  return el('div', { class: 'card stack' },
    el('div', { class: 'row-between' },
      el('span', { class: 'd-name', text: `Fassung ${APP_VERSION}` }),
      el('span', { class: 'muted small', text: APP_DATE })),
    el('button', {
      class: 'btn', type: 'button',
      onClick: async (event) => {
        const button = event.currentTarget;
        button.disabled = true;
        status.textContent = 'Suche …';
        try {
          if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
          }
          if ('serviceWorker' in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(regs.map((r) => r.unregister()));
          }
          status.textContent = 'Lade neu …';
          // Ohne kurze Pause startet der Neuladevorgang, bevor das Aufräumen
          // beim Browser angekommen ist.
          setTimeout(() => location.reload(), 300);
        } catch (err) {
          button.disabled = false;
          status.textContent = 'Hat nicht geklappt. Schließ die App ganz und öffne sie neu.';
        }
      },
    }, 'Offline-Speicher leeren und neu laden'),
    status,
    el('p', { class: 'hint',
      text: 'Zeigt die App eine veraltete Fassung, hilft das hier. Mahlzeiten, '
        + 'Trainingsdaten und Gewichte bleiben erhalten.' }));
}

export async function render(container, ctx) {
  const mealCount = await countMeals();

  mount(
    container,
    viewHead('Einstellungen'),
    el(
      'div',
      null,
      el('h2', { class: 'section-title', style: { marginTop: '4px' }, text: 'Foto-Analyse' }),
      apiKeySection(ctx),
      el('h2', { class: 'section-title', text: 'Modell' }),
      modelSection(ctx),
      el('h2', { class: 'section-title', text: 'Tagesziele' }),
      goalsSection(ctx),
      el('h2', { class: 'section-title', text: 'Daten' }),
      dataSection(ctx, mealCount),
      el('h2', { class: 'section-title', text: 'Fassung' }),
      versionSection(),
      el(
        'p',
        { class: 'hint', style: { padding: '18px 4px 0', textAlign: 'center' } },
        'Alle Mahlzeiten, Fotos und Trainingsdaten bleiben auf diesem Gerät. ' +
        'Nur das jeweils analysierte Foto wird an die Anthropic-API geschickt.'
      )
    )
  );
}
