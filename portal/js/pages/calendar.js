window.GLPPages = window.GLPPages || {};

const CATEGORY_LABELS = {
  ausbildung: 'Anmeldung für Ausbildungen',
  workshops: 'Anmeldung für Workshops',
  events: 'Anmeldung für Events'
};

function formatEventRange(startIso, endIso) {
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

async function renderCategoryPage(container, ctx, category) {
  const title = CATEGORY_LABELS[category];
  container.innerHTML = `<div class="glass-card"><h2>${title}</h2><p>Lade Termine...</p></div>`;

  const { data: events, error } = await supabaseClient
    .from('events')
    .select('*')
    .eq('category', category)
    .order('start_date', { ascending: true });

  if (error) {
    container.innerHTML = `<div class="glass-card"><h2>${title}</h2><p>Fehler beim Laden: ${error.message}</p></div>`;
    return;
  }

  let regsByEvent = {};
  if (events.length) {
    const { data: regs } = await supabaseClient
      .from('event_registrations')
      .select('event_id, member_id, members(name, email)')
      .in('event_id', events.map(e => e.id));

    regsByEvent = (regs || []).reduce((acc, r) => {
      (acc[r.event_id] = acc[r.event_id] || []).push(r);
      return acc;
    }, {});
  }

  const eventCards = events.map(ev => {
    const attendees = regsByEvent[ev.id] || [];
    const isRegistered = attendees.some(a => a.member_id === ctx.member.id);
    const attendeeNames = attendees.map(a => (a.members && a.members.name) || (a.members && a.members.email) || 'Mitglied');

    return `
      <div class="event-card" data-event-id="${ev.id}">
        <div class="event-card-header">
          <div>
            <h4>${ev.title}</h4>
            <div class="event-meta">${formatEventRange(ev.start_date, ev.end_date)}${ev.location ? ' · ' + ev.location : ''}</div>
          </div>
          <button class="btn ${isRegistered ? 'btn-secondary' : 'btn-primary'} event-register-btn" data-event-id="${ev.id}" data-registered="${isRegistered}">
            ${isRegistered ? 'Abmelden' : 'Anmelden'}
          </button>
        </div>
        ${ev.description ? `<div class="event-description">${renderRichText(ev.description)}</div>` : ''}
        <div class="event-attendees">
          <strong>${attendees.length}</strong> angemeldet${attendees.length ? ': ' + attendeeNames.join(', ') : ''}
        </div>
      </div>
    `;
  }).join('') || '<p class="empty-state">Aktuell keine Termine.</p>';

  container.innerHTML = `
    <div class="glass-card">
      <h2 style="margin-bottom:1.25rem;">${title}</h2>
      <div class="event-list">${eventCards}</div>
    </div>
  `;

  container.querySelectorAll('.event-register-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const eventId = btn.dataset.eventId;
      const registered = btn.dataset.registered === 'true';

      if (registered) {
        await supabaseClient
          .from('event_registrations')
          .delete()
          .eq('event_id', eventId)
          .eq('member_id', ctx.member.id);
      } else {
        await supabaseClient
          .from('event_registrations')
          .insert({ event_id: eventId, member_id: ctx.member.id });
      }

      renderCategoryPage(container, ctx, category);
    });
  });
}

window.GLPPages['calendar-ausbildung'] = {
  title: 'Anmeldung für Ausbildungen',
  render: (container, ctx) => renderCategoryPage(container, ctx, 'ausbildung')
};

window.GLPPages['calendar-workshops'] = {
  title: 'Anmeldung für Workshops',
  render: (container, ctx) => renderCategoryPage(container, ctx, 'workshops')
};

window.GLPPages['calendar-events'] = {
  title: 'Anmeldung für Events',
  render: (container, ctx) => renderCategoryPage(container, ctx, 'events')
};
