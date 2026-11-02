window.GLPPages = window.GLPPages || {};

const NEWS_DEPARTMENTS = [
  'GLP Organisation',
  'Research & Workshops',
  'Social Media',
  'Operations & IT',
  'Finance'
];

function formatNewsDate(iso) {
  return new Date(iso).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
}

function renderNewsEntry(entry) {
  return `
    <div class="news-entry">
      <div class="news-entry-date">${formatNewsDate(entry.created_at)}</div>
      <div class="news-entry-title">${entry.title}</div>
      <div class="news-entry-body">${renderRichText(entry.body)}</div>
    </div>
  `;
}

window.GLPPages.news = {
  title: 'News & Bereiche',
  async render(container, ctx) {
    container.innerHTML = '<div class="glass-card"><h2>News & Bereiche</h2><p>Lade...</p></div>';

    const [{ data: updates, error: updatesError }, { data: news, error: newsError }] = await Promise.all([
      supabaseClient.from('department_updates').select('*').order('created_at', { ascending: false }),
      supabaseClient.from('news').select('*').order('created_at', { ascending: false })
    ]);

    if (updatesError || newsError) {
      const msg = (updatesError || newsError).message;
      container.innerHTML = `<div class="glass-card"><h2>News & Bereiche</h2><p>Fehler beim Laden: ${msg}</p></div>`;
      return;
    }

    const newsHtml = (news || []).map(renderNewsEntry).join('') ||
      '<p class="empty-state">Noch keine Neuigkeiten.</p>';

    function renderMain() {
      const cardsHtml = NEWS_DEPARTMENTS.map(dep => `
        <button class="news-department-card" data-dep="${dep}">${dep}</button>
      `).join('');

      container.innerHTML = `
        <div class="glass-card">
          <h2 style="margin-bottom:1.25rem;">News & Bereiche</h2>

          <h3 style="margin-bottom:1rem;">Einblicke in die verschiedenen Bereiche</h3>
          <div class="news-department-cards">${cardsHtml}</div>

          <hr class="content-divider">

          <h3 style="margin-bottom:1rem;">Neuigkeiten</h3>
          <div class="news-feed">${newsHtml}</div>
        </div>
      `;

      container.querySelectorAll('.news-department-card').forEach(btn => {
        btn.addEventListener('click', () => renderDepartment(btn.dataset.dep));
      });
    }

    function renderDepartment(dep) {
      const entries = (updates || []).filter(u => u.department === dep);
      const entriesHtml = entries.map(renderNewsEntry).join('') ||
        `<p class="empty-state">Noch keine Updates für ${dep}.</p>`;

      container.innerHTML = `
        <div class="glass-card">
          <button class="btn btn-secondary news-back-btn">← Zurück</button>
          <h2 style="margin-top:1.25rem; margin-bottom:1.25rem;">${dep}</h2>
          <div class="news-feed">${entriesHtml}</div>
        </div>
      `;

      container.querySelector('.news-back-btn').addEventListener('click', renderMain);
    }

    renderMain();
  }
};
