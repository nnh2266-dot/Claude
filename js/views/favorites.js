/**
 * Favoriten: häufige Mahlzeiten mit einem Tipp erneut eintragen —
 * ohne neues Foto und ohne API-Kosten.
 */

import { el, mount, viewHead, iconButton, emptyState, toast, confirmAction } from '../ui.js';
import { listFavorites, deleteFavorite, saveFavorite } from '../store.js';
import { MEAL_TYPE_LABEL, localDateKey } from '../nutrition.js';

export async function render(container, ctx) {
  const favorites = await listFavorites();

  const head = viewHead(
    'Favoriten',
    favorites.length
      ? `${favorites.length} ${favorites.length === 1 ? 'Eintrag' : 'Einträge'}`
      : 'noch keine gespeichert'
  );

  if (!favorites.length) {
    mount(
      container,
      head,
      el('div', { class: 'card' },
        emptyState(
          'Noch keine Favoriten',
          'Setze beim Speichern einer Mahlzeit den Haken „Als Favorit merken". ' +
          'Danach trägst du sie hier mit einem Tipp erneut ein.'
        )
      )
    );
    return;
  }

  const rows = favorites.map((fav) =>
    el(
      'div',
      { class: 'meal' },
      el('div', { class: 'meal-thumb', 'aria-hidden': 'true', text: '⭐' }),
      el(
        'button',
        {
          class: 'meal-body',
          type: 'button',
          style: { background: 'none', border: '0', padding: '0', textAlign: 'left', cursor: 'pointer' },
          onClick: async () => {
            // usedAt aktualisieren, damit die zuletzt genutzten oben stehen.
            await saveFavorite({ ...fav, usedAt: Date.now() });
            ctx.openEditor({
              mode: 'favorite',
              dateKey: ctx.state.date || localDateKey(),
              name: fav.name,
              mealType: fav.mealType,
              items: fav.items,
            });
          },
        },
        el('div', { class: 'meal-name', text: fav.name }),
        el('div', {
          class: 'meal-sub',
          text: `${MEAL_TYPE_LABEL[fav.mealType] || 'Snack'} · ${fav.items.length} ${
            fav.items.length === 1 ? 'Komponente' : 'Komponenten'
          }`,
        })
      ),
      el('div', { class: 'meal-kcal tabular' }, String(fav.totals.kcal), el('span', { text: 'kcal' })),
      iconButton('trash', `${fav.name} löschen`, async () => {
        if (!confirmAction(`„${fav.name}" aus den Favoriten entfernen?`)) return;
        await deleteFavorite(fav.id);
        toast('Favorit entfernt.');
        ctx.reload();
      })
    )
  );

  mount(
    container,
    head,
    el(
      'div',
      null,
      el('p', { class: 'hint', style: { padding: '0 4px 12px' } },
        'Tippe auf einen Favoriten, um ihn für den ausgewählten Tag einzutragen. ' +
        'Mengen lassen sich vor dem Speichern noch anpassen.'),
      ...rows
    )
  );
}
