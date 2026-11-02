window.GLPPages = window.GLPPages || {};

const MEIN_KALENDER_CATEGORY_LABELS = {
  ausbildung: 'Ausbildung',
  workshops: 'Workshop',
  events: 'Event'
};

function formatMeinKalenderRange(startIso, endIso) {
  const dateOpts = { day: 'numeric', month: 'long', year: 'numeric' };
  const timeOpts = { hour: '2-digit', minute: '2-digit' };
  const start = new Date(startIso);
  const startDateStr = start.toLocaleDateString('de-DE', dateOpts);
  const startTimeStr = start.toLocaleTimeString('de-DE', timeOpts);

  if (!endIso) return `${startDateStr}, ${startTimeStr} Uhr`;

  const end = new Date(endIso);
  const endTimeStr = end.toLocaleTimeString('de-DE', timeOpts);

  if (start.toDateString() === end.toDateString()) {
    return `${startDateStr}, ${startTimeStr}–${endTimeStr} Uhr`;
  }

  const endDateStr = end.toLocaleDateString('de-DE', dateOpts);
  return `${startDateStr}, ${startTimeStr} Uhr – ${endDateStr}, ${endTimeStr} Uhr`;
}

window.GLPPages['mein-kalender'] = {
  title: 'Mein Kalender',
  async render(container, ctx) {
    container.innerHTML = '<div class="glass-card"><h2>Mein Kalender</h2><p>Lade Anmeldungen...</p></div>';

    const { data: regs, error } = await supabaseClient
      .from('event_registrations')
      .select('event_id, events(id, title, category, description, start_date, end_date, location)')
      .eq('member_id', ctx.member.id);

    if (error) {
      container.innerHTML = `<div class="glass-card"><h2>Mein Kalender</h2><p>Fehler beim Laden: ${error.message}</p></div>`;
      return;
    }

    const sorted = (regs || [])
      .filter(r => r.events)
      .sort((a, b) => new Date(a.events.start_date) - new Date(b.events.start_date));

    const rows = sorted.map(r => {
      const ev = r.events;

      return `
        <div class="event-card" data-event-id="${ev.id}">
          <div class="event-card-header">
            <div>
              <span class="event-category-tag">${MEIN_KALENDER_CATEGORY_LABELS[ev.category] || ev.category}</span>
              <h4>${ev.title}</h4>
              <div class="event-meta">${formatMeinKalenderRange(ev.start_date, ev.end_date)}${ev.location ? ' · ' + ev.location : ''}</div>
            </div>
            <button class="btn btn-secondary event-unregister-btn" data-event-id="${ev.id}">Abmelden</button>
          </div>
          ${ev.description ? `<div class="event-description">${renderRichText(ev.description)}</div>` : ''}
        </div>
      `;
    }).join('') || '<p class="empty-state">Du bist aktuell für keine Termine angemeldet.</p>';

    container.innerHTML = `
      <div class="glass-card">
        <h2 style="margin-bottom:1.25rem;">Mein Kalender</h2>
        <div class="event-list">${rows}</div>
      </div>
    `;

    container.querySelectorAll('.event-unregister-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        await supabaseClient
          .from('event_registrations')
          .delete()
          .eq('event_id', btn.dataset.eventId)
          .eq('member_id', ctx.member.id);

        this.render(container, ctx);
      });
    });
  }
};
