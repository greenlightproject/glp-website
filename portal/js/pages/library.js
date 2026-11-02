window.GLPPages = window.GLPPages || {};

function renderLibraryItem(item, isPdf) {
  return `
    <div class="library-item">
      <div class="library-item-icon">${isPdf ? '📘' : '🔗'}</div>
      <div class="library-item-info">
        <div class="library-item-title">${item.title}</div>
        ${item.description ? `<div class="library-item-desc">${renderRichText(item.description)}</div>` : ''}
      </div>
      ${isPdf
        ? `<button class="btn btn-primary library-download-btn" data-path="${item.file_path}">Herunterladen</button>`
        : `<a class="btn btn-secondary" href="${item.external_url}" target="_blank" rel="noopener">Öffnen</a>`}
    </div>
  `;
}

window.GLPPages.library = {
  title: 'Bibliothek',
  async render(container, ctx) {
    container.innerHTML = '<div class="glass-card"><h2>Bibliothek</h2><p>Lade...</p></div>';

    const [{ data: items, error: itemsError }, { data: categories, error: catError }] = await Promise.all([
      supabaseClient.from('library_items').select('*').order('created_at', { ascending: true }),
      supabaseClient.from('library_categories').select('*').order('sort_order', { ascending: true })
    ]);

    if (itemsError || catError) {
      const msg = (itemsError || catError).message;
      container.innerHTML = `<div class="glass-card"><h2>Bibliothek</h2><p>Fehler beim Laden: ${msg}</p></div>`;
      return;
    }

    const handbuchItems = items.filter(i => i.item_type === 'pdf');
    const linkItems = items.filter(i => i.item_type === 'link');

    const handbuchHtml = handbuchItems.map(i => renderLibraryItem(i, true)).join('') ||
      '<p class="empty-state">Noch kein Handbuch hinterlegt.</p>';

    const categoryBlocks = categories.map(cat => {
      const catItems = linkItems.filter(i => i.category_id === cat.id);
      if (!catItems.length) return '';
      return `
        <div class="library-category-block">
          <h4>${cat.name}</h4>
          <div class="library-item-list">${catItems.map(i => renderLibraryItem(i, false)).join('')}</div>
        </div>
      `;
    }).join('');

    const uncategorized = linkItems.filter(i => !i.category_id);
    const uncategorizedHtml = uncategorized.length ? `
      <div class="library-category-block">
        <h4>Weitere Links</h4>
        <div class="library-item-list">${uncategorized.map(i => renderLibraryItem(i, false)).join('')}</div>
      </div>
    ` : '';

    const noLinks = !categoryBlocks.trim() && !uncategorizedHtml;

    container.innerHTML = `
      <div class="glass-card">
        <h2 style="margin-bottom:1.25rem;">Bibliothek</h2>
        <h3 style="margin-bottom:0.75rem;">Handbuch</h3>
        <div class="library-item-list" style="margin-bottom:2rem;">${handbuchHtml}</div>
        <h3 style="margin-bottom:0.75rem;">Links</h3>
        ${categoryBlocks}${uncategorizedHtml}
        ${noLinks ? '<p class="empty-state">Noch keine Links hinterlegt.</p>' : ''}
      </div>
    `;

    container.querySelectorAll('.library-download-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const { data, error } = await supabaseClient.storage
          .from('library-pdfs')
          .createSignedUrl(btn.dataset.path, 60);

        if (!error && data) window.open(data.signedUrl, '_blank');
      });
    });
  }
};
