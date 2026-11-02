window.GLPPages = window.GLPPages || {};

const ADMIN_CATEGORY_LABELS = {
  ausbildung: 'Ausbildung',
  workshops: 'Workshop',
  events: 'Event'
};

const ADMIN_PLACEHOLDER_PHOTO = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="16" fill="#dff0c8"/><text x="50" y="62" font-size="36" text-anchor="middle" fill="#1d4810" font-family="sans-serif">?</text></svg>'
);

function standortOptions(selected) {
  const options = [
    { value: '', label: '—' },
    { value: 'München', label: 'München' },
    { value: 'Wien', label: 'Wien' }
  ];
  return options.map(o =>
    `<option value="${o.value}" ${o.value === (selected || '') ? 'selected' : ''}>${o.label}</option>`
  ).join('');
}

function formatAdminEventRange(startIso, endIso) {
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

function categoryOptions(selected) {
  const options = [
    { value: 'ausbildung', label: 'Ausbildung' },
    { value: 'workshops', label: 'Workshop' },
    { value: 'events', label: 'Event' }
  ];
  return options.map(o =>
    `<option value="${o.value}" ${o.value === selected ? 'selected' : ''}>${o.label}</option>`
  ).join('');
}

function toDatetimeLocalValue(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function bereichOptions(selected) {
  const options = [
    { value: '', label: '—' },
    { value: 'Finance', label: 'Finance' },
    { value: 'Social Media', label: 'Social Media' },
    { value: 'Operations & IT', label: 'Operations & IT' },
    { value: 'Research & Workshops', label: 'Research & Workshops' }
  ];
  return options.map(o =>
    `<option value="${o.value}" ${o.value === (selected || '') ? 'selected' : ''}>${o.label}</option>`
  ).join('');
}

async function renderAdminMembers(container, ctx) {
  const { data: members, error } = await supabaseClient
    .from('members')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    return `<p>Fehler beim Laden der Mitglieder: ${error.message}</p>`;
  }

  const blocks = members.map(m => {
    const photo = m.profile_picture_url || m.google_photo_url || ADMIN_PLACEHOLDER_PHOTO;
    return `
      <div class="admin-member-block" data-id="${m.id}">
        <div class="admin-member-row">
          <img src="${photo}" alt="">
          <div class="admin-member-info">
            <div class="admin-member-name">${m.name || m.email}</div>
            <div class="admin-member-email">${m.email}</div>
          </div>
          <button class="btn btn-secondary admin-edit-toggle" data-id="${m.id}">Bearbeiten</button>
        </div>
        <div class="admin-member-edit-panel">
          <div class="profile-avatar-row" style="margin-top:1rem; margin-bottom:1.25rem;">
            <img class="admin-edit-photo-preview" data-id="${m.id}" src="${photo}" alt="">
            <label class="btn btn-secondary" style="cursor:pointer;">
              Foto hochladen
              <input type="file" class="admin-avatar-upload" data-id="${m.id}" accept="image/jpeg,image/png,image/webp" style="display:none;">
            </label>
          </div>
          <div class="profile-fields-grid">
            <div class="form-group">
              <label>Name</label>
              <input type="text" class="admin-field-name" data-id="${m.id}" value="${m.name || ''}">
            </div>
            <div class="form-group">
              <label>Telefon</label>
              <input type="text" class="admin-field-phone" data-id="${m.id}" value="${m.phone || ''}">
            </div>
            <div class="form-group">
              <label>Standort</label>
              <select class="admin-field-standort" data-id="${m.id}">${standortOptions(m.standort)}</select>
            </div>
            <div class="form-group">
              <label>Universität</label>
              <input type="text" class="admin-field-universitaet" data-id="${m.id}" value="${m.universitaet || ''}">
            </div>
            <div class="form-group">
              <label>Studiengang</label>
              <input type="text" class="admin-field-studiengang" data-id="${m.id}" value="${m.studiengang || ''}">
            </div>
            <div class="form-group">
              <label>Bereich</label>
              <select class="admin-field-bereich" data-id="${m.id}">${bereichOptions(m.bereich)}</select>
            </div>
            <div class="form-group">
              <label>Rolle</label>
              <input type="text" class="admin-field-rolle" data-id="${m.id}" value="${m.rolle || ''}">
            </div>
          </div>
          <button type="button" class="btn btn-primary admin-save-btn" data-id="${m.id}">Speichern</button>
          <p class="admin-edit-status form-status" data-id="${m.id}"></p>
        </div>
      </div>
    `;
  }).join('');

  return `<div class="admin-member-list">${blocks}</div>`;
}

async function renderAdminEvents(container, ctx) {
  const { data: events, error } = await supabaseClient
    .from('events')
    .select('*')
    .order('start_date', { ascending: true });

  if (error) {
    return `<p>Fehler beim Laden der Termine: ${error.message}</p>`;
  }

  const rows = (events || []).map(ev => {
    return `
      <div class="admin-event-block" data-id="${ev.id}">
        <div class="admin-event-row">
          <div>
            <span class="event-category-tag">${ADMIN_CATEGORY_LABELS[ev.category] || ev.category}</span>
            <div class="admin-member-name">${ev.title}</div>
            <div class="admin-member-email">${formatAdminEventRange(ev.start_date, ev.end_date)}${ev.location ? ' · ' + ev.location : ''}</div>
          </div>
          <div class="admin-event-row-actions">
            <button class="btn btn-secondary admin-event-edit-toggle" data-id="${ev.id}">Bearbeiten</button>
            <button class="btn btn-secondary admin-event-delete-btn" data-id="${ev.id}">Löschen</button>
          </div>
        </div>
        <div class="admin-event-edit-panel">
          <div class="profile-fields-grid">
            <div class="form-group">
              <label>Kategorie</label>
              <select class="admin-event-field-category" data-id="${ev.id}">${categoryOptions(ev.category)}</select>
            </div>
            <div class="form-group">
              <label>Titel</label>
              <input type="text" class="admin-event-field-title" data-id="${ev.id}" value="${ev.title}">
            </div>
            <div class="form-group">
              <label>Beginn (Datum & Uhrzeit)</label>
              <input type="datetime-local" class="admin-event-field-start" data-id="${ev.id}" value="${toDatetimeLocalValue(ev.start_date)}">
            </div>
            <div class="form-group">
              <label>Ende (Datum & Uhrzeit)</label>
              <input type="datetime-local" class="admin-event-field-end" data-id="${ev.id}" value="${toDatetimeLocalValue(ev.end_date)}">
            </div>
            <div class="form-group">
              <label>Ort</label>
              <input type="text" class="admin-event-field-location" data-id="${ev.id}" value="${ev.location || ''}">
            </div>
          </div>
          <div class="form-group">
            <label>Beschreibung</label>
            <textarea class="admin-event-field-description" data-id="${ev.id}" rows="4" placeholder="Zeilen mit &quot;- &quot; werden zu Aufzählungspunkten. **fett** für Fettdruck.">${escapeHtml(ev.description || '')}</textarea>
          </div>
          <button type="button" class="btn btn-primary admin-event-save-btn" data-id="${ev.id}">Speichern</button>
          <p class="admin-event-edit-status form-status" data-id="${ev.id}"></p>
        </div>
      </div>
    `;
  }).join('') || '<p class="empty-state">Noch keine Termine angelegt.</p>';

  return `
    <form id="admin-event-form" class="event-form">
      <div class="profile-fields-grid">
        <div class="form-group">
          <label for="event-category">Kategorie</label>
          <select id="event-category">
            <option value="ausbildung">Ausbildung</option>
            <option value="workshops">Workshop</option>
            <option value="events">Event</option>
          </select>
        </div>
        <div class="form-group">
          <label for="event-title">Titel</label>
          <input type="text" id="event-title" required>
        </div>
        <div class="form-group">
          <label for="event-start">Beginn (Datum & Uhrzeit)</label>
          <input type="datetime-local" id="event-start" required>
        </div>
        <div class="form-group">
          <label for="event-end">Ende (Datum & Uhrzeit)</label>
          <input type="datetime-local" id="event-end">
        </div>
        <div class="form-group">
          <label for="event-location">Ort</label>
          <input type="text" id="event-location">
        </div>
      </div>
      <div class="form-group">
        <label for="event-description">Beschreibung</label>
        <textarea id="event-description" rows="4" placeholder="Zeilen mit &quot;- &quot; werden zu Aufzählungspunkten. **fett** für Fettdruck."></textarea>
      </div>
      <button type="submit" class="btn btn-primary">Termin hinzufügen</button>
      <p id="admin-event-status" class="form-status"></p>
    </form>
    <div class="admin-event-list">${rows}</div>
  `;
}

function libraryCategoryOptions(categories, selected) {
  const opts = ['<option value="">— Keine Kategorie —</option>'].concat(
    categories.map(c => `<option value="${c.id}" ${String(c.id) === String(selected) ? 'selected' : ''}>${c.name}</option>`)
  );
  return opts.join('');
}

async function renderAdminLibrary(container, ctx) {
  const [{ data: items, error: itemsError }, { data: categories, error: catError }] = await Promise.all([
    supabaseClient.from('library_items').select('*').order('created_at', { ascending: true }),
    supabaseClient.from('library_categories').select('*').order('sort_order', { ascending: true })
  ]);

  if (itemsError || catError) {
    return `<p>Fehler beim Laden: ${(itemsError || catError).message}</p>`;
  }

  const categoryRows = categories.map(cat => `
    <div class="admin-event-row" data-cat-id="${cat.id}">
      <input type="text" class="admin-category-name" data-id="${cat.id}" value="${cat.name}" style="flex:1;">
      <button class="btn btn-secondary admin-category-save-btn" data-id="${cat.id}">Speichern</button>
      <button class="btn btn-secondary admin-category-delete-btn" data-id="${cat.id}">Löschen</button>
    </div>
  `).join('') || '<p class="empty-state">Noch keine Kategorien.</p>';

  const itemRows = items.map(item => {
    const catName = categories.find(c => c.id === item.category_id);
    return `
      <div class="admin-library-block" data-id="${item.id}">
        <div class="admin-event-row">
          <div>
            <span class="event-category-tag">${item.item_type === 'pdf' ? 'PDF' : 'Link'}${catName ? ' · ' + catName.name : ''}</span>
            <div class="admin-member-name">${item.title}</div>
          </div>
          <div class="admin-event-row-actions">
            <button class="btn btn-secondary admin-library-edit-toggle" data-id="${item.id}">Bearbeiten</button>
            <button class="btn btn-secondary admin-library-delete-btn" data-id="${item.id}">Löschen</button>
          </div>
        </div>
        <div class="admin-library-edit-panel">
          <div class="profile-fields-grid">
            <div class="form-group">
              <label>Titel</label>
              <input type="text" class="admin-library-field-title" data-id="${item.id}" value="${item.title}">
            </div>
            <div class="form-group">
              <label>Kategorie</label>
              <select class="admin-library-field-category" data-id="${item.id}">${libraryCategoryOptions(categories, item.category_id)}</select>
            </div>
          </div>
          <div class="form-group">
            <label>Beschreibung</label>
            <textarea class="admin-library-field-description" data-id="${item.id}" rows="4" placeholder="Zeilen mit &quot;- &quot; werden zu Aufzählungspunkten. **fett** für Fettdruck.">${escapeHtml(item.description || '')}</textarea>
          </div>
          ${item.item_type === 'link' ? `
            <div class="form-group">
              <label>URL</label>
              <input type="text" class="admin-library-field-url" data-id="${item.id}" value="${item.external_url || ''}">
            </div>
          ` : ''}
          <button type="button" class="btn btn-primary admin-library-save-btn" data-id="${item.id}">Speichern</button>
          <p class="admin-library-edit-status form-status" data-id="${item.id}"></p>
        </div>
      </div>
    `;
  }).join('') || '<p class="empty-state">Noch keine Einträge.</p>';

  return `
    <h4 style="margin-bottom:0.75rem;">Kategorien</h4>
    <div class="admin-member-list" style="margin-bottom:1rem;">${categoryRows}</div>
    <form id="admin-category-form" class="event-form">
      <div class="form-group" style="display:flex; gap:0.75rem; align-items:flex-end;">
        <div style="flex:1;">
          <label for="new-category-name">Neue Kategorie</label>
          <input type="text" id="new-category-name" placeholder="z. B. Vorlagen">
        </div>
        <button type="submit" class="btn btn-secondary">Hinzufügen</button>
      </div>
      <p id="admin-category-status" class="form-status"></p>
    </form>

    <hr class="admin-section-divider">

    <h4 style="margin-bottom:0.75rem;">Handbuch & Links</h4>
    <form id="admin-library-form" class="event-form">
      <div class="profile-fields-grid">
        <div class="form-group">
          <label for="library-type">Typ</label>
          <select id="library-type">
            <option value="pdf">PDF (Handbuch)</option>
            <option value="link">Link</option>
          </select>
        </div>
        <div class="form-group">
          <label for="library-title">Titel</label>
          <input type="text" id="library-title" required>
        </div>
        <div class="form-group" id="library-category-group">
          <label for="library-category">Kategorie</label>
          <select id="library-category">${libraryCategoryOptions(categories, '')}</select>
        </div>
        <div class="form-group" id="library-url-group">
          <label for="library-url">URL</label>
          <input type="text" id="library-url" placeholder="https://...">
        </div>
        <div class="form-group" id="library-file-group" style="display:none;">
          <label for="library-file">PDF-Datei</label>
          <input type="file" id="library-file" accept="application/pdf">
        </div>
      </div>
      <div class="form-group">
        <label for="library-description">Beschreibung</label>
        <textarea id="library-description" rows="4" placeholder="Zeilen mit &quot;- &quot; werden zu Aufzählungspunkten. **fett** für Fettdruck."></textarea>
      </div>
      <button type="submit" class="btn btn-primary">Hinzufügen</button>
      <p id="admin-library-status" class="form-status"></p>
    </form>
    <div class="admin-library-list">${itemRows}</div>
  `;
}

const NEWS_ADMIN_DEPARTMENTS = [
  'GLP Organisation',
  'Research & Workshops',
  'Social Media',
  'Operations & IT',
  'Finance'
];

function newsDepartmentOptions(selected) {
  return NEWS_ADMIN_DEPARTMENTS.map(dep =>
    `<option value="${dep}" ${dep === selected ? 'selected' : ''}>${dep}</option>`
  ).join('');
}

async function renderAdminNews(container, ctx) {
  const [{ data: updates, error: updatesError }, { data: news, error: newsError }] = await Promise.all([
    supabaseClient.from('department_updates').select('*').order('created_at', { ascending: false }),
    supabaseClient.from('news').select('*').order('created_at', { ascending: false })
  ]);

  if (updatesError || newsError) {
    return `<p>Fehler beim Laden: ${(updatesError || newsError).message}</p>`;
  }

  const updateRows = (updates || []).map(u => `
    <div class="admin-library-block" data-id="${u.id}">
      <div class="admin-event-row">
        <div>
          <span class="event-category-tag">${u.department}</span>
          <div class="admin-member-name">${u.title}</div>
        </div>
        <div class="admin-event-row-actions">
          <button class="btn btn-secondary admin-update-edit-toggle" data-id="${u.id}">Bearbeiten</button>
          <button class="btn btn-secondary admin-update-delete-btn" data-id="${u.id}">Löschen</button>
        </div>
      </div>
      <div class="admin-library-edit-panel">
        <div class="form-group">
          <label>Bereich</label>
          <select class="admin-update-field-department" data-id="${u.id}">${newsDepartmentOptions(u.department)}</select>
        </div>
        <div class="form-group">
          <label>Titel</label>
          <input type="text" class="admin-update-field-title" data-id="${u.id}" value="${u.title}">
        </div>
        <div class="form-group">
          <label>Text</label>
          <textarea class="admin-update-field-body" data-id="${u.id}" rows="4" placeholder="Zeilen mit &quot;- &quot; werden zu Aufzählungspunkten. **fett** für Fettdruck.">${escapeHtml(u.body)}</textarea>
        </div>
        <button type="button" class="btn btn-primary admin-update-save-btn" data-id="${u.id}">Speichern</button>
        <p class="admin-update-edit-status form-status" data-id="${u.id}"></p>
      </div>
    </div>
  `).join('') || '<p class="empty-state">Noch keine Bereichs-Updates.</p>';

  const newsRows = (news || []).map(n => `
    <div class="admin-library-block" data-id="${n.id}">
      <div class="admin-event-row">
        <div class="admin-member-name">${n.title}</div>
        <div class="admin-event-row-actions">
          <button class="btn btn-secondary admin-news-edit-toggle" data-id="${n.id}">Bearbeiten</button>
          <button class="btn btn-secondary admin-news-delete-btn" data-id="${n.id}">Löschen</button>
        </div>
      </div>
      <div class="admin-library-edit-panel">
        <div class="form-group">
          <label>Titel</label>
          <input type="text" class="admin-news-field-title" data-id="${n.id}" value="${n.title}">
        </div>
        <div class="form-group">
          <label>Text</label>
          <textarea class="admin-news-field-body" data-id="${n.id}" rows="4" placeholder="Zeilen mit &quot;- &quot; werden zu Aufzählungspunkten. **fett** für Fettdruck.">${escapeHtml(n.body)}</textarea>
        </div>
        <button type="button" class="btn btn-primary admin-news-save-btn" data-id="${n.id}">Speichern</button>
        <p class="admin-news-edit-status form-status" data-id="${n.id}"></p>
      </div>
    </div>
  `).join('') || '<p class="empty-state">Noch keine Neuigkeiten.</p>';

  return `
    <h4 style="margin-bottom:0.75rem;">Bereichs-Update hinzufügen</h4>
    <form id="admin-update-form" class="event-form">
      <div class="profile-fields-grid">
        <div class="form-group">
          <label for="update-department">Bereich</label>
          <select id="update-department">${newsDepartmentOptions('')}</select>
        </div>
        <div class="form-group">
          <label for="update-title">Titel</label>
          <input type="text" id="update-title" required>
        </div>
      </div>
      <div class="form-group">
        <label for="update-body">Text</label>
        <textarea id="update-body" rows="4" required placeholder="Zeilen mit &quot;- &quot; werden zu Aufzählungspunkten. **fett** für Fettdruck."></textarea>
      </div>
      <button type="submit" class="btn btn-primary">Update hinzufügen</button>
      <p id="admin-update-status" class="form-status"></p>
    </form>
    <div class="admin-library-list" style="margin-bottom:1.5rem;">${updateRows}</div>

    <hr class="admin-section-divider">

    <h4 style="margin-bottom:0.75rem;">Neuigkeit hinzufügen</h4>
    <form id="admin-news-form" class="event-form">
      <div class="form-group">
        <label for="news-title">Titel</label>
        <input type="text" id="news-title" required>
      </div>
      <div class="form-group">
        <label for="news-body">Text</label>
        <textarea id="news-body" rows="4" required placeholder="Zeilen mit &quot;- &quot; werden zu Aufzählungspunkten. **fett** für Fettdruck."></textarea>
      </div>
      <button type="submit" class="btn btn-primary">Neuigkeit hinzufügen</button>
      <p id="admin-news-status" class="form-status"></p>
    </form>
    <div class="admin-library-list">${newsRows}</div>
  `;
}


function wireAdminMembers(container, ctx, rerender) {
  container.querySelectorAll('.admin-edit-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.admin-member-block').classList.toggle('open');
    });
  });

  container.querySelectorAll('.admin-avatar-upload').forEach(input => {
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      const memberId = input.dataset.id;
      if (!file) return;

      const statusEl = container.querySelector(`.admin-edit-status[data-id="${memberId}"]`);
      statusEl.classList.remove('error');
      statusEl.textContent = 'Foto wird hochgeladen...';

      const ext = file.name.split('.').pop();
      const path = `${memberId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabaseClient.storage
        .from('profile-pictures')
        .upload(path, file, { upsert: true });

      if (uploadError) {
        statusEl.textContent = 'Fehler beim Hochladen: ' + uploadError.message;
        statusEl.classList.add('error');
        return;
      }

      const { data: urlData } = supabaseClient.storage.from('profile-pictures').getPublicUrl(path);

      const { error: updateError } = await supabaseClient
        .from('members')
        .update({ profile_picture_url: urlData.publicUrl, updated_at: new Date().toISOString() })
        .eq('id', memberId);

      if (updateError) {
        statusEl.textContent = 'Fehler beim Speichern: ' + updateError.message;
        statusEl.classList.add('error');
        return;
      }

      statusEl.classList.remove('error');
      statusEl.textContent = 'Foto aktualisiert!';
      rerender();
    });
  });

  container.querySelectorAll('.admin-save-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const memberId = btn.dataset.id;
      const statusEl = container.querySelector(`.admin-edit-status[data-id="${memberId}"]`);

      const updates = {
        name: container.querySelector(`.admin-field-name[data-id="${memberId}"]`).value.trim(),
        phone: container.querySelector(`.admin-field-phone[data-id="${memberId}"]`).value.trim(),
        standort: container.querySelector(`.admin-field-standort[data-id="${memberId}"]`).value || null,
        universitaet: container.querySelector(`.admin-field-universitaet[data-id="${memberId}"]`).value.trim(),
        studiengang: container.querySelector(`.admin-field-studiengang[data-id="${memberId}"]`).value.trim(),
        bereich: container.querySelector(`.admin-field-bereich[data-id="${memberId}"]`).value.trim(),
        rolle: container.querySelector(`.admin-field-rolle[data-id="${memberId}"]`).value.trim(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabaseClient.from('members').update(updates).eq('id', memberId);

      if (error) {
        statusEl.textContent = 'Fehler beim Speichern: ' + error.message;
        statusEl.classList.add('error');
        return;
      }

      statusEl.classList.remove('error');
      statusEl.textContent = 'Gespeichert!';
      const nameEl = btn.closest('.admin-member-block').querySelector('.admin-member-row .admin-member-name');
      if (nameEl) nameEl.textContent = updates.name || nameEl.textContent;
    });
  });
}

function wireAdminEvents(container, ctx, rerender) {
  const eventStatusEl = container.querySelector('#admin-event-status');

  container.querySelector('#admin-event-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const category = container.querySelector('#event-category').value;
    const title = container.querySelector('#event-title').value.trim();
    const startVal = container.querySelector('#event-start').value;
    const endVal = container.querySelector('#event-end').value;
    const location = container.querySelector('#event-location').value.trim();
    const description = container.querySelector('#event-description').value.trim();

    if (!title || !startVal) return;

    const { error } = await supabaseClient.from('events').insert({
      category,
      title,
      start_date: new Date(startVal).toISOString(),
      end_date: endVal ? new Date(endVal).toISOString() : null,
      location: location || null,
      description: description || null
    });

    if (error) {
      eventStatusEl.textContent = 'Fehler: ' + error.message;
      eventStatusEl.classList.add('error');
      return;
    }

    rerender();
  });

  container.querySelectorAll('.admin-event-delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      await supabaseClient.from('events').delete().eq('id', btn.dataset.id);
      rerender();
    });
  });

  container.querySelectorAll('.admin-event-edit-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.admin-event-block').classList.toggle('open');
    });
  });

  container.querySelectorAll('.admin-event-save-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const eventId = btn.dataset.id;
      const statusEl = container.querySelector(`.admin-event-edit-status[data-id="${eventId}"]`);

      const startVal = container.querySelector(`.admin-event-field-start[data-id="${eventId}"]`).value;
      if (!startVal) {
        statusEl.textContent = 'Beginn ist erforderlich.';
        statusEl.classList.add('error');
        return;
      }
      const endVal = container.querySelector(`.admin-event-field-end[data-id="${eventId}"]`).value;

      const updates = {
        category: container.querySelector(`.admin-event-field-category[data-id="${eventId}"]`).value,
        title: container.querySelector(`.admin-event-field-title[data-id="${eventId}"]`).value.trim(),
        start_date: new Date(startVal).toISOString(),
        end_date: endVal ? new Date(endVal).toISOString() : null,
        location: container.querySelector(`.admin-event-field-location[data-id="${eventId}"]`).value.trim() || null,
        description: container.querySelector(`.admin-event-field-description[data-id="${eventId}"]`).value.trim() || null
      };

      const { error } = await supabaseClient.from('events').update(updates).eq('id', eventId);

      if (error) {
        statusEl.textContent = 'Fehler beim Speichern: ' + error.message;
        statusEl.classList.add('error');
        return;
      }

      rerender();
    });
  });
}

function wireAdminLibrary(container, ctx, rerender) {
  const libraryTypeSelect = container.querySelector('#library-type');
  if (libraryTypeSelect) {
    const updateLibraryFormVisibility = () => {
      const isPdf = libraryTypeSelect.value === 'pdf';
      container.querySelector('#library-file-group').style.display = isPdf ? '' : 'none';
      container.querySelector('#library-url-group').style.display = isPdf ? 'none' : '';
      container.querySelector('#library-category-group').style.display = isPdf ? 'none' : '';
    };
    libraryTypeSelect.addEventListener('change', updateLibraryFormVisibility);
    updateLibraryFormVisibility();
  }

  const categoryForm = container.querySelector('#admin-category-form');
  if (categoryForm) {
    categoryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nameInput = container.querySelector('#new-category-name');
      const name = nameInput.value.trim();
      const statusEl = container.querySelector('#admin-category-status');
      if (!name) return;

      const { error } = await supabaseClient.from('library_categories').insert({ name, sort_order: 0 });

      if (error) {
        statusEl.textContent = 'Fehler: ' + error.message;
        statusEl.classList.add('error');
        return;
      }

      rerender();
    });
  }

  container.querySelectorAll('.admin-category-save-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const name = container.querySelector(`.admin-category-name[data-id="${id}"]`).value.trim();
      if (!name) return;
      await supabaseClient.from('library_categories').update({ name }).eq('id', id);
      rerender();
    });
  });

  container.querySelectorAll('.admin-category-delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      await supabaseClient.from('library_categories').delete().eq('id', btn.dataset.id);
      rerender();
    });
  });

  const libraryForm = container.querySelector('#admin-library-form');
  if (libraryForm) {
    libraryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const statusEl = container.querySelector('#admin-library-status');
      const type = container.querySelector('#library-type').value;
      const title = container.querySelector('#library-title').value.trim();
      const description = container.querySelector('#library-description').value.trim();

      if (!title) return;

      if (type === 'pdf') {
        const fileInput = container.querySelector('#library-file');
        const file = fileInput.files[0];
        if (!file) {
          statusEl.textContent = 'Bitte eine PDF-Datei auswählen.';
          statusEl.classList.add('error');
          return;
        }

        statusEl.classList.remove('error');
        statusEl.textContent = 'Wird hochgeladen...';

        const path = `${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabaseClient.storage
          .from('library-pdfs')
          .upload(path, file);

        if (uploadError) {
          statusEl.textContent = 'Fehler beim Hochladen: ' + uploadError.message;
          statusEl.classList.add('error');
          return;
        }

        const { error } = await supabaseClient.from('library_items').insert({
          title,
          description: description || null,
          item_type: 'pdf',
          file_path: path
        });

        if (error) {
          statusEl.textContent = 'Fehler: ' + error.message;
          statusEl.classList.add('error');
          return;
        }
      } else {
        const url = container.querySelector('#library-url').value.trim();
        const categoryId = container.querySelector('#library-category').value || null;

        if (!url) {
          statusEl.textContent = 'Bitte eine URL angeben.';
          statusEl.classList.add('error');
          return;
        }

        const { error } = await supabaseClient.from('library_items').insert({
          title,
          description: description || null,
          item_type: 'link',
          external_url: url,
          category_id: categoryId
        });

        if (error) {
          statusEl.textContent = 'Fehler: ' + error.message;
          statusEl.classList.add('error');
          return;
        }
      }

      rerender();
    });
  }

  container.querySelectorAll('.admin-library-edit-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.admin-library-block').classList.toggle('open');
    });
  });

  container.querySelectorAll('.admin-library-delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      await supabaseClient.from('library_items').delete().eq('id', btn.dataset.id);
      rerender();
    });
  });

  container.querySelectorAll('.admin-library-save-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const statusEl = container.querySelector(`.admin-library-edit-status[data-id="${id}"]`);

      const updates = {
        title: container.querySelector(`.admin-library-field-title[data-id="${id}"]`).value.trim(),
        description: container.querySelector(`.admin-library-field-description[data-id="${id}"]`).value.trim() || null,
        category_id: container.querySelector(`.admin-library-field-category[data-id="${id}"]`).value || null
      };

      const urlField = container.querySelector(`.admin-library-field-url[data-id="${id}"]`);
      if (urlField) updates.external_url = urlField.value.trim();

      const { error } = await supabaseClient.from('library_items').update(updates).eq('id', id);

      if (error) {
        statusEl.textContent = 'Fehler beim Speichern: ' + error.message;
        statusEl.classList.add('error');
        return;
      }

      rerender();
    });
  });
}

function wireAdminNews(container, ctx, rerender) {
  const updateForm = container.querySelector('#admin-update-form');
  if (updateForm) {
    updateForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const statusEl = container.querySelector('#admin-update-status');
      const department = container.querySelector('#update-department').value;
      const title = container.querySelector('#update-title').value.trim();
      const body = container.querySelector('#update-body').value.trim();

      if (!title || !body) return;

      const { error } = await supabaseClient.from('department_updates').insert({ department, title, body });

      if (error) {
        statusEl.textContent = 'Fehler: ' + error.message;
        statusEl.classList.add('error');
        return;
      }

      rerender();
    });
  }

  container.querySelectorAll('.admin-update-edit-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.admin-library-block').classList.toggle('open');
    });
  });

  container.querySelectorAll('.admin-update-delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      await supabaseClient.from('department_updates').delete().eq('id', btn.dataset.id);
      rerender();
    });
  });

  container.querySelectorAll('.admin-update-save-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const statusEl = container.querySelector(`.admin-update-edit-status[data-id="${id}"]`);

      const updates = {
        department: container.querySelector(`.admin-update-field-department[data-id="${id}"]`).value,
        title: container.querySelector(`.admin-update-field-title[data-id="${id}"]`).value.trim(),
        body: container.querySelector(`.admin-update-field-body[data-id="${id}"]`).value.trim()
      };

      const { error } = await supabaseClient.from('department_updates').update(updates).eq('id', id);

      if (error) {
        statusEl.textContent = 'Fehler beim Speichern: ' + error.message;
        statusEl.classList.add('error');
        return;
      }

      rerender();
    });
  });

  const newsForm = container.querySelector('#admin-news-form');
  if (newsForm) {
    newsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const statusEl = container.querySelector('#admin-news-status');
      const title = container.querySelector('#news-title').value.trim();
      const body = container.querySelector('#news-body').value.trim();

      if (!title || !body) return;

      const { error } = await supabaseClient.from('news').insert({ title, body });

      if (error) {
        statusEl.textContent = 'Fehler: ' + error.message;
        statusEl.classList.add('error');
        return;
      }

      rerender();
    });
  }

  container.querySelectorAll('.admin-news-edit-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.admin-library-block').classList.toggle('open');
    });
  });

  container.querySelectorAll('.admin-news-delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      await supabaseClient.from('news').delete().eq('id', btn.dataset.id);
      rerender();
    });
  });

  container.querySelectorAll('.admin-news-save-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const statusEl = container.querySelector(`.admin-news-edit-status[data-id="${id}"]`);

      const updates = {
        title: container.querySelector(`.admin-news-field-title[data-id="${id}"]`).value.trim(),
        body: container.querySelector(`.admin-news-field-body[data-id="${id}"]`).value.trim()
      };

      const { error } = await supabaseClient.from('news').update(updates).eq('id', id);

      if (error) {
        statusEl.textContent = 'Fehler beim Speichern: ' + error.message;
        statusEl.classList.add('error');
        return;
      }

      rerender();
    });
  });
}

window.GLPPages['admin-members'] = {
  title: 'Admin Mitglieder',
  adminOnly: true,
  async render(container, ctx) {
    container.innerHTML = '<div class="glass-card"><h2>Admin Mitglieder</h2><p>Lade...</p></div>';
    const html = await renderAdminMembers(container, ctx);
    container.innerHTML = `<div class="glass-card"><h2 style="margin-bottom:1.25rem;">Admin Mitglieder</h2>${html}</div>`;
    wireAdminMembers(container, ctx, () => this.render(container, ctx));
  }
};

window.GLPPages['admin-events'] = {
  title: 'Admin Veranstaltungen',
  adminOnly: true,
  async render(container, ctx) {
    container.innerHTML = '<div class="glass-card"><h2>Admin Veranstaltungen</h2><p>Lade...</p></div>';
    const html = await renderAdminEvents(container, ctx);
    container.innerHTML = `<div class="glass-card"><h2 style="margin-bottom:1.25rem;">Admin Veranstaltungen</h2>${html}</div>`;
    wireAdminEvents(container, ctx, () => this.render(container, ctx));
  }
};

window.GLPPages['admin-library'] = {
  title: 'Admin Bibliothek',
  adminOnly: true,
  async render(container, ctx) {
    container.innerHTML = '<div class="glass-card"><h2>Admin Bibliothek</h2><p>Lade...</p></div>';
    const html = await renderAdminLibrary(container, ctx);
    container.innerHTML = `<div class="glass-card"><h2 style="margin-bottom:1.25rem;">Admin Bibliothek</h2>${html}</div>`;
    wireAdminLibrary(container, ctx, () => this.render(container, ctx));
  }
};

window.GLPPages['admin-news'] = {
  title: 'Admin News',
  adminOnly: true,
  async render(container, ctx) {
    container.innerHTML = '<div class="glass-card"><h2>Admin News</h2><p>Lade...</p></div>';
    const html = await renderAdminNews(container, ctx);
    container.innerHTML = `<div class="glass-card"><h2 style="margin-bottom:1.25rem;">Admin News</h2>${html}</div>`;
    wireAdminNews(container, ctx, () => this.render(container, ctx));
  }
};
