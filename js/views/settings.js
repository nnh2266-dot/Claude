/**
 * Einstellungen: API-Key, Modell, Tagesziele, Daten-Verwaltung.
 */

import { el, mount, viewHead, field, toast, confirmAction } from '../ui.js';
import {
  setSetting, exportData, importData, clearEntries, clearEverything, countMeals,
  saveActivity, saveWeight, listProgressPhotos,
} from '../store.js';
import { MODELS, testConnection, ApiError } from '../claude.js';
import { macrosFromKcal, parseNumber, DEFAULT_GOALS, localDateKey, formatDateKey } from '../nutrition.js';
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

/* ---------------- Apple Health ---------------- */

/**
 * Übernahme aus dem Health-Export.
 *
 * Der Abschnitt beginnt mit der Absage, und das ist Absicht: wer „Apple Health"
 * liest, erwartet einen Schalter, der die Daten laufend abgleicht. Den kann es
 * nicht geben, und das früh zu sagen ist ehrlicher, als es hinter einer
 * Anleitung zu verstecken.
 */
function healthSection(ctx) {
  const stand = el('p', { class: 'hint' });

  const eingabe = el('input', {
    type: 'file', accept: '.xml,text/xml,application/xml', hidden: true,
    onChange: async (event) => {
      const datei = event.target.files?.[0];
      event.target.value = '';
      if (!datei) return;

      if (datei.name.toLowerCase().endsWith('.zip')) {
        stand.textContent = 'Das ist noch das ZIP. Entpack es zuerst und wähl die '
          + 'Datei „Export.xml" daraus.';
        return;
      }

      stand.textContent = 'Wird gelesen … das dauert bei großen Dateien eine Weile.';

      try {
        const { parseExport } = await import('../health.js');
        const ergebnis = await parseExport(datei, (anteil) => {
          stand.textContent = `Wird gelesen … ${Math.round(anteil * 100)} %`;
        });

        for (const w of ergebnis.workouts) await saveActivity(w);

        // Von Hand eingetragene Gewichte bleiben stehen: der Wert von der
        // Waage am Morgen ist mehr wert als irgendeiner aus dem Tagesverlauf.
        let uebersprungeneGewichte = 0;
        for (const g of ergebnis.gewichte) {
          const vorher = await saveWeight(g.date, g.kg, { source: 'health', nurWennNeu: true });
          if (vorher.source !== 'health') uebersprungeneGewichte += 1;
        }

        await ctx.refreshTraining();
        await ctx.refreshActivities();

        const neueGewichte = ergebnis.gewichte.length - uebersprungeneGewichte;
        stand.textContent = `${ergebnis.workouts.length} Aktivitäten und `
          + `${neueGewichte} Gewichtswerte übernommen`
          + (uebersprungeneGewichte
              ? `, ${uebersprungeneGewichte} Tage übergangen, weil dort schon dein eigener Wert stand`
              : '')
          + (ergebnis.uebersprungen
              ? `. ${ergebnis.uebersprungen} `
                + `${ergebnis.uebersprungen === 1 ? 'Krafteinheit übersprungen' : 'Krafteinheiten übersprungen'}`
                + ' — die führt die App selbst.'
              : '.');
        toast('Übernahme fertig.');
      } catch (err) {
        console.error(err);
        stand.textContent = 'Die Datei ließ sich nicht lesen. Ist es wirklich die Export.xml?';
      }
    },
  });

  return el('div', { class: 'card stack' },
    el('p', { class: 'small' },
      el('strong', { text: 'Eine laufende Verbindung ist nicht möglich. ' }),
      'Apple Health hat keine Schnittstelle für Web-Apps — nur richtige iOS-Apps mit '
      + 'eigener Berechtigung kommen an die Daten. Diese App läuft im Browser und '
      + 'kann Health weder lesen noch schreiben.'),
    el('p', { class: 'small' },
      'Was geht, ist der Export: Health legt auf Wunsch eine Datei mit allem an, und '
      + 'die kannst du hier einlesen. Handarbeit statt Abgleich — dafür verlässt nichts '
      + 'dein Gerät.'),
    el('details', { class: 'bridge-details' },
      el('summary', { text: 'So kommst du an die Datei' }),
      el('ol', { class: 'howto mt-16' },
        el('li', { text: 'Health öffnen, oben rechts aufs eigene Bild tippen.' }),
        el('li', { text: 'Ganz unten „Alle Gesundheitsdaten exportieren" wählen und bestätigen.' }),
        el('li', { text: 'Das dauert einige Minuten. Danach die Datei in „Dateien" sichern.' }),
        el('li', { text: 'In „Dateien" die ZIP lange antippen und „Entpacken" wählen.' }),
        el('li', { text: 'Hier unten auf den Knopf tippen und im Ordner die Datei „Export.xml" auswählen.' })),
      el('p', { class: 'hint mt-16',
        text: 'Die Datei ist oft mehrere hundert Megabyte groß, weil jeder Schritt seit '
          + 'Jahren darin steht. Die App liest sie in Stücken und nimmt nur Workouts und '
          + 'Körpergewicht heraus.' })),
    el('button', {
      class: 'btn btn-block', type: 'button', onClick: () => eingabe.click(),
    }, 'Export.xml auswählen'),
    stand,
    el('p', { class: 'hint',
      text: 'Krafteinheiten aus Health werden übersprungen — die führt diese App selbst, '
        + 'und ein zweiter Eintrag würde die Kalorien doppelt zählen. Ein erneuter Import '
        + 'überschreibt bereits übernommene Einträge, statt sie zu verdoppeln.' }),
    eingabe);
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
        toast(`${result.meals} Mahlzeiten, ${result.favorites} Favoriten und ${result.activities || 0} Aktivitäten importiert.`);
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
          // Merken, wann zuletzt gesichert wurde — der Bericht erinnert daran,
          // wenn es zu lange her ist.
          await setSetting('lastBackup', localDateKey());
          await ctx.refreshSettings();
          ctx.reload();
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
      'Der Export enthält Mahlzeiten, Favoriten, Trainingsplan, Einheiten, Gewichte, ' +
      'Beweglichkeitstests, Aktivitäten und Schlaf. Nicht enthalten sind der API-Key und ' +
      'alle Bilder: Fortschrittsfotos, Essensfotos und die Warteschlange. Bilder würden die ' +
      'Datei um ein Vielfaches vergrößern — dafür gibt es den eigenen Knopf darunter.'),
    el(
      'button',
      {
        class: 'btn',
        type: 'button',
        onClick: async () => {
          const fotos = await listProgressPhotos();
          if (!fotos.length) { toast('Noch keine Fortschrittsfotos da.'); return; }

          // Eines nach dem anderen, mit Pause dazwischen: der Browser bricht
          // ab, wenn zwanzig Downloads gleichzeitig anklopfen.
          for (const foto of fotos) {
            const url = URL.createObjectURL(foto.blob);
            const link = el('a', { href: url, download: `fortschritt-${foto.date}.jpg` });
            document.body.append(link);
            link.click();
            link.remove();
            await new Promise((r) => setTimeout(r, 350));
            URL.revokeObjectURL(url);
          }
          toast(`${fotos.length} ${fotos.length === 1 ? 'Foto' : 'Fotos'} gesichert.`);
        },
      },
      'Fortschrittsfotos sichern'
    ),
    el('p', { class: 'hint' },
      'Legt jedes Foto einzeln in deine Dateien, benannt nach dem Aufnahmetag. '
      + 'Getrennt vom Datenexport, damit der klein bleibt — Fotos sind das Einzige, '
      + 'was sich später nicht nachtragen lässt.'),
    ctx.settings.lastBackup
      ? el('p', { class: 'hint',
          text: `Zuletzt gesichert: ${formatDateKey(ctx.settings.lastBackup)}.` })
      : el('p', { class: 'hint', text: 'Noch nie gesichert.' }),
    el(
      'button',
      {
        class: 'btn btn-danger mt-16',
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
      el('h2', { class: 'section-title', text: 'Apple Health' }),
      healthSection(ctx),
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
