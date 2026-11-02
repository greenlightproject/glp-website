window.GLPPages = window.GLPPages || {};

const NETWORK_PLACEHOLDER_PHOTO = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="16" fill="#dff0c8"/><text x="50" y="62" font-size="36" text-anchor="middle" fill="#1d4810" font-family="sans-serif">?</text></svg>'
);

const NETWORK_BEREICHE = [
  'Research & Workshops',
  'Social Media',
  'Operations & IT',
  'Finance'
];

function openMemberModal(m) {
  const photo = m.profile_picture_url || m.google_photo_url || NETWORK_PLACEHOLDER_PHOTO;

  const fields = [
    ['Telefon', m.phone],
    ['Standort', m.standort],
    ['Universität', m.universitaet],
    ['Studiengang', m.studiengang],
    ['Bereich', m.bereich],
    ['Rolle', m.rolle]
  ].filter(([, value]) => value);

  const overlay = document.createElement('div');
  overlay.className = 'member-modal-overlay';
  overlay.innerHTML = `
    <div class="member-modal glass-card">
      <button class="member-modal-close" aria-label="Schließen">&times;</button>
      <img src="${photo}" alt="">
      <h3>${m.name || m.email}</h3>
      <a class="member-modal-email" href="mailto:${m.email}">${m.email}</a>
      <div class="member-modal-fields">
        ${fields.map(([label, value]) => `
          <div class="member-modal-field">
            <span class="member-modal-label">${label}</span>
            <span>${value}</span>
          </div>
        `).join('') || '<p class="empty-state">Keine weiteren Angaben.</p>'}
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  overlay.querySelector('.member-modal-close').addEventListener('click', close);
}

function renderMemberCard(m) {
  const photo = m.profile_picture_url || m.google_photo_url || NETWORK_PLACEHOLDER_PHOTO;
  const name = m.name || m.email;
  const roleLine = m.rolle || '';

  return `
    <div class="member-card" data-id="${m.id}">
      <img src="${photo}" alt="">
      <h4>${name}</h4>
      ${roleLine ? `<div class="member-role">${roleLine}</div>` : ''}
    </div>
  `;
}

window.GLPPages.network = {
  title: 'Teams und Mitglieder',
  async render(container, ctx) {
    container.innerHTML = '<div class="glass-card"><h2>Teams und Mitglieder</h2><p>Lade Mitglieder...</p></div>';

    const { data: members, error } = await supabaseClient
      .from('members')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      container.innerHTML = `<div class="glass-card"><h2>Teams und Mitglieder</h2><p>Fehler beim Laden: ${error.message}</p></div>`;
      return;
    }

    const sections = NETWORK_BEREICHE.map(bereich => {
      const groupMembers = members.filter(m => m.bereich === bereich);
      return `
        <div class="network-section">
          <h3>${bereich}</h3>
          <div class="network-grid">
            ${groupMembers.map(renderMemberCard).join('') || '<p class="empty-state">Noch keine Mitglieder in diesem Bereich.</p>'}
          </div>
        </div>
      `;
    }).join('<hr class="content-divider">');

    const unassigned = members.filter(m => !NETWORK_BEREICHE.includes(m.bereich));
    const unassignedHtml = unassigned.length ? `
      <hr class="content-divider">
      <div class="network-section">
        <h3>Ohne Bereich</h3>
        <div class="network-grid">${unassigned.map(renderMemberCard).join('')}</div>
      </div>
    ` : '';

    container.innerHTML = `
      <div class="glass-card">
        <h2 style="margin-bottom:1.25rem;">Teams und Mitglieder</h2>
        ${sections}${unassignedHtml}
      </div>
    `;

    container.querySelectorAll('.member-card').forEach(card => {
      card.addEventListener('click', () => {
        const member = members.find(m => m.id === card.dataset.id);
        if (member) openMemberModal(member);
      });
    });
  }
};
