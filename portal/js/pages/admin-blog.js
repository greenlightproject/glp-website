window.GLPPages = window.GLPPages || {};


// Same rules as slugify() in netlify/lib/site.js: "Wenn das Ja trügt" -> "wenn-das-ja-truegt"
function slugifyTitle(text) {
  return String(text || '').toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function isValidSlug(slug) {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
}

function formatAdminBlogDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
}

function blogCategoryCheckboxes(categories, selectedIds) {
  selectedIds = selectedIds || [];
  return categories.map(c => `
    <label class="blog-category-checkbox">
      <input type="checkbox" value="${c.id}" ${selectedIds.includes(c.id) ? 'checked' : ''}>
      ${escapeHtml(c.name_de)} / ${escapeHtml(c.name_en)}
    </label>
  `).join('');
}

async function renderAdminBlogCategories(ctx) {
  const { data: categories, error } = await supabaseClient
    .from('blog_categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) return { html: `<p>Fehler beim Laden der Kategorien: ${error.message}</p>`, categories: [] };

  const rows = (categories || []).map(c => `
    <div class="admin-event-row" data-id="${c.id}">
      <input type="text" class="admin-blog-cat-name-de" data-id="${c.id}" value="${escapeHtml(c.name_de)}" placeholder="Deutsch" style="flex:1;">
      <input type="text" class="admin-blog-cat-name-en" data-id="${c.id}" value="${escapeHtml(c.name_en)}" placeholder="Englisch" style="flex:1;">
      <button class="btn btn-secondary admin-blog-cat-save-btn" data-id="${c.id}">Speichern</button>
      <button class="btn btn-secondary admin-blog-cat-delete-btn" data-id="${c.id}">Löschen</button>
    </div>
  `).join('') || '<p class="empty-state">Noch keine Kategorien.</p>';

  const html = `
    <h4 style="margin-bottom:0.75rem;">Kategorien</h4>
    <div class="admin-member-list" style="margin-bottom:1rem;">${rows}</div>
    <form id="admin-blog-cat-form" class="event-form">
      <div class="profile-fields-grid">
        <div class="form-group">
          <label for="new-blog-cat-de">Neue Kategorie (Deutsch)</label>
          <input type="text" id="new-blog-cat-de" placeholder="z. B. Konsens">
        </div>
        <div class="form-group">
          <label for="new-blog-cat-en">Neue Kategorie (Englisch)</label>
          <input type="text" id="new-blog-cat-en" placeholder="e.g. Consent">
        </div>
      </div>
      <button type="submit" class="btn btn-secondary">Hinzufügen</button>
      <p id="admin-blog-cat-status" class="form-status"></p>
    </form>
  `;

  return { html, categories: categories || [] };
}

function renderAdminBlogPostFields(prefix, categories, post) {
  post = post || {};
  const id = post.id != null ? `data-id="${post.id}"` : '';
  const selectedIds = post._categoryIds || [];

  return `
    <div class="blog-category-group">${blogCategoryCheckboxes(categories, selectedIds)}</div>
    <div class="profile-fields-grid">
      <div class="form-group">
        <label>Titel (Deutsch)</label>
        <input type="text" class="${prefix}-title-de" ${id} value="${escapeHtml(post.title_de || '')}">
      </div>
      <div class="form-group">
        <label>Titel (Englisch)</label>
        <input type="text" class="${prefix}-title-en" ${id} value="${escapeHtml(post.title_en || '')}">
      </div>
      <div class="form-group">
        <label>Vorschautext (Deutsch)</label>
        <textarea class="${prefix}-excerpt-de" ${id} rows="2">${escapeHtml(post.excerpt_de || '')}</textarea>
      </div>
      <div class="form-group">
        <label>Vorschautext (Englisch)</label>
        <textarea class="${prefix}-excerpt-en" ${id} rows="2">${escapeHtml(post.excerpt_en || '')}</textarea>
      </div>
    </div>
    <div class="form-group">
      <label>Text (Deutsch)</label>
      <textarea class="${prefix}-body-de" ${id} rows="8" placeholder="Leerzeile trennt Absätze. **Text** auf einer eigenen Zeile wird zur Zwischenüberschrift.">${escapeHtml(post.body_de || '')}</textarea>
    </div>
    <div class="form-group">
      <label>Text (Englisch)</label>
      <textarea class="${prefix}-body-en" ${id} rows="8" placeholder="Blank line separates paragraphs. **Text** on its own line becomes a subtitle.">${escapeHtml(post.body_en || '')}</textarea>
    </div>
    <div class="profile-fields-grid">
      <div class="form-group">
        <label>Autor</label>
        <input type="text" class="${prefix}-author" ${id} value="${escapeHtml(post.author || '')}">
      </div>
      <div class="form-group">
        <label>Datum</label>
        <input type="date" class="${prefix}-date" ${id} value="${post.published_date || new Date().toISOString().slice(0, 10)}">
      </div>
    </div>
    <div class="profile-fields-grid">
      <div class="form-group">
        <label>Adresse im Web (Deutsch)</label>
        <input type="text" class="${prefix}-slug-de" ${id} value="${escapeHtml(post.slug_de || '')}" placeholder="wird beim Speichern aus dem Titel erzeugt">
      </div>
      <div class="form-group">
        <label>Adresse im Web (Englisch)</label>
        <input type="text" class="${prefix}-slug-en" ${id} value="${escapeHtml(post.slug_en || '')}" placeholder="wird beim Speichern aus dem Titel erzeugt">
      </div>
    </div>
    <p class="workspace-intro" style="margin:-0.5rem 0 1rem;font-size:0.8rem;">So heißt der Beitrag in der Adresszeile, zum Beispiel greenlightproject.eu/blog/<strong>reden-statt-raten</strong>/. Nur Kleinbuchstaben, Zahlen und Bindestriche. Sie bleibt gleich, auch wenn du den Titel später änderst. Ändere sie nur, wenn es nötig ist: Links auf die alte Adresse (zum Beispiel in Google) funktionieren dann nicht mehr.</p>
    <div class="form-group">
      <label>Quellen</label>
      <textarea class="${prefix}-sources" ${id} rows="4" placeholder="Eine Quelle pro Zeile. Ein http(s)-Link am Ende der Zeile wird automatisch verlinkt.">${escapeHtml(post.sources || '')}</textarea>
    </div>
  `;
}

async function renderAdminBlogPosts(ctx, categories) {
  const { data: posts, error } = await supabaseClient
    .from('blog_posts')
    .select('*, blog_post_categories(category_id)')
    .order('published_date', { ascending: false });

  if (error) return `<p>Fehler beim Laden der Beiträge: ${error.message}</p>`;

  const rows = (posts || []).map(p => {
    const catIds = (p.blog_post_categories || []).map(pc => pc.category_id);
    const catNames = categories.filter(c => catIds.includes(c.id)).map(c => c.name_de).join(' & ');
    const postWithCats = Object.assign({}, p, { _categoryIds: catIds });

    return `
      <div class="admin-library-block" data-id="${p.id}">
        <div class="admin-event-row">
          <div>
            ${catNames ? `<span class="event-category-tag">${escapeHtml(catNames)}</span>` : ''}
            <div class="admin-member-name">${escapeHtml(p.title_de)}</div>
            <div class="admin-member-email">${formatAdminBlogDate(p.published_date)} · ${escapeHtml(p.author)}</div>
          </div>
          <div class="admin-event-row-actions">
            <button class="btn btn-secondary admin-blog-post-edit-toggle" data-id="${p.id}">Bearbeiten</button>
            <button class="btn btn-secondary admin-blog-post-delete-btn" data-id="${p.id}">Löschen</button>
          </div>
        </div>
        <div class="admin-library-edit-panel">
          ${renderAdminBlogPostFields('admin-blog-edit', categories, postWithCats)}
          <button type="button" class="btn btn-primary admin-blog-post-save-btn" data-id="${p.id}">Speichern</button>
          <p class="admin-blog-post-edit-status form-status" data-id="${p.id}"></p>
        </div>
      </div>
    `;
  }).join('') || '<p class="empty-state">Noch keine Beiträge.</p>';

  return `
    <h4 style="margin-bottom:0.75rem;">Beitrag hinzufügen</h4>
    <form id="admin-blog-post-form" class="event-form">
      ${renderAdminBlogPostFields('admin-blog-new', categories, {})}
      <button type="submit" class="btn btn-primary">Beitrag hinzufügen</button>
      <p id="admin-blog-post-status" class="form-status"></p>
    </form>
    <div class="admin-library-list">${rows}</div>
  `;
}

function readBlogPostFields(container, prefix, id) {
  const sel = suffix => id
    ? container.querySelector(`.${prefix}-${suffix}[data-id="${id}"]`)
    : container.querySelector(`.${prefix}-${suffix}`);

  const categoryContainer = id
    ? sel('title-de').closest('.admin-library-edit-panel')
    : container.querySelector('#admin-blog-post-form');

  const categoryIds = Array.from(categoryContainer.querySelectorAll('.blog-category-group input[type="checkbox"]:checked'))
    .map(cb => Number(cb.value));

  return {
    title_de: sel('title-de').value.trim(),
    title_en: sel('title-en').value.trim(),
    excerpt_de: sel('excerpt-de').value.trim(),
    excerpt_en: sel('excerpt-en').value.trim(),
    body_de: sel('body-de').value.trim(),
    body_en: sel('body-en').value.trim(),
    author: sel('author').value.trim(),
    published_date: sel('date').value,
    sources: sel('sources').value.trim(),
    slug_de: sel('slug-de').value.trim(),
    slug_en: sel('slug-en').value.trim(),
    categoryIds
  };
}

// Fills empty web addresses from the titles and checks them. Returns an error text or null.
function finalizeBlogSlugs(fields) {
  if (!fields.slug_de) fields.slug_de = slugifyTitle(fields.title_de);
  if (!fields.slug_en) fields.slug_en = slugifyTitle(fields.title_en || fields.title_de);
  if (!isValidSlug(fields.slug_de) || !isValidSlug(fields.slug_en)) {
    return 'Die Adresse im Web darf nur Kleinbuchstaben, Zahlen und einzelne Bindestriche enthalten (zum Beispiel reden-statt-raten).';
  }
  return null;
}

function blogSlugErrorMessage(error) {
  if (error && /slug_(de|en)/.test(error.message || '') && /column|schema cache/i.test(error.message || '')) {
    return 'Die Datenbank kennt die Spalten für die Web-Adresse noch nicht. Bitte zuerst das SQL für slug_de und slug_en in Supabase ausführen.';
  }
  if (error && /duplicate key|unique/i.test(error.message || '')) {
    return 'Diese Adresse im Web gibt es schon bei einem anderen Beitrag. Bitte eine andere wählen.';
  }
  return 'Fehler: ' + (error ? error.message : '');
}

async function saveBlogPostCategories(postId, categoryIds) {
  await supabaseClient.from('blog_post_categories').delete().eq('post_id', postId);
  if (categoryIds.length) {
    await supabaseClient.from('blog_post_categories').insert(
      categoryIds.map(categoryId => ({ post_id: postId, category_id: categoryId }))
    );
  }
}

const HELP_FORMAT_HINT = `# Titel der Seite
> Untertitel

Einleitungstext als normaler Absatz.

@ Name der Anlaufstelle | https://link-der-anlaufstelle
Fokus: ...
Angebot: ...
Für wen: ...
Telefon: 030 123 45 67

!! Bei akuter Gefahr
110 – Polizei: ...
112 – Rettungsdienst: ...

-- Kleiner Hinweis am Ende`;

function helpContentFields(prefix, item) {
  item = item || {};
  const id = item.id != null ? `data-id="${item.id}"` : '';
  return `
    <details class="help-format-hint" style="margin-bottom:0.75rem;">
      <summary style="cursor:pointer;font-weight:600;font-size:0.85rem;">So wird der Text für die Seite geschrieben</summary>
      <pre style="font-size:0.78rem;white-space:pre-wrap;margin-top:0.5rem;">${escapeHtml(HELP_FORMAT_HINT)}</pre>
      <p style="font-size:0.78rem;">Tipp: Einfach das PDF im Chat mit Claude in dieses Format umwandeln lassen und das Ergebnis hier einfügen.</p>
    </details>
    <div class="form-group">
      <label>Text für die Seite (Deutsch)</label>
      <textarea class="${prefix}-content-de" ${id} rows="10">${escapeHtml(item.content_de || '')}</textarea>
    </div>
    <div class="form-group">
      <label>Text für die Seite (Englisch, optional – sonst wird der deutsche Text gezeigt)</label>
      <textarea class="${prefix}-content-en" ${id} rows="10">${escapeHtml(item.content_en || '')}</textarea>
    </div>
  `;
}

async function renderAdminHelpResources() {
  const { data: items, error } = await supabaseClient
    .from('help_resources')
    .select('*')
    .order('city', { ascending: true });

  if (error) {
    return `<h4 style="margin-bottom:0.75rem;">Lokale Hilfsangebote</h4>
      <p>Fehler beim Laden: ${escapeHtml(error.message)}. (Wurden <code>portal/help-resources.sql</code> und <code>portal/help-resources-page.sql</code> in Supabase ausgeführt?)</p>`;
  }

  const rows = (items || []).map(item => {
    const url = supabaseClient.storage.from('help-pdfs').getPublicUrl(item.file_path).data.publicUrl;
    return `
      <div class="admin-library-block" data-id="${item.id}">
        <div class="admin-event-row">
          <div>
            <div class="admin-member-name">${escapeHtml(item.city)}</div>
            <div class="admin-member-email">${item.content_de ? 'Mit Textseite' : 'Nur PDF (noch keine Textseite)'}</div>
          </div>
          <div class="admin-event-row-actions">
            <a class="btn btn-secondary" href="${url}" target="_blank" rel="noopener">PDF ansehen</a>
            <button class="btn btn-secondary admin-help-edit-toggle" data-id="${item.id}">Bearbeiten</button>
            <button class="btn btn-secondary admin-help-delete-btn" data-id="${item.id}" data-path="${escapeHtml(item.file_path)}">Löschen</button>
          </div>
        </div>
        <div class="admin-library-edit-panel">
          <div class="form-group">
            <label>Stadt (Deutsch)</label>
            <input type="text" class="admin-help-edit-city" data-id="${item.id}" value="${escapeHtml(item.city)}">
          </div>
          <div class="form-group">
            <label>Stadt (Englisch)</label>
            <input type="text" class="admin-help-edit-city-en" data-id="${item.id}" value="${escapeHtml(item.city_en || '')}" placeholder="z. B. Vienna (leer lassen = gleicher Name)">
          </div>
          <div class="form-group">
            <label>PDF ersetzen (optional)</label>
            <input type="file" class="admin-help-edit-file" data-id="${item.id}" accept="application/pdf">
          </div>
          ${helpContentFields('admin-help-edit', item)}
          <button type="button" class="btn btn-primary admin-help-save-btn" data-id="${item.id}" data-path="${escapeHtml(item.file_path)}">Speichern</button>
          <p class="admin-help-edit-status form-status" data-id="${item.id}"></p>
        </div>
      </div>
    `;
  }).join('') || '<p class="empty-state">Noch keine Hilfsangebote.</p>';

  return `
    <h4 style="margin-bottom:0.35rem;">Lokale Hilfsangebote</h4>
    <p class="workspace-intro" style="margin-bottom:1rem;">Erscheinen unten auf der öffentlichen Blog-Seite: Stadt mit "Mehr lesen" (eigene Textseite) und "PDF herunterladen".</p>
    <div class="admin-library-list" style="margin-bottom:1.25rem;">${rows}</div>
    <h4 style="margin-bottom:0.75rem;">Hilfsangebot hinzufügen</h4>
    <form id="admin-help-form" class="event-form">
      <div class="profile-fields-grid">
        <div class="form-group">
          <label for="new-help-city">Stadt (Deutsch)</label>
          <input type="text" id="new-help-city" placeholder="z. B. Wien">
        </div>
        <div class="form-group">
          <label for="new-help-city-en">Stadt (Englisch)</label>
          <input type="text" id="new-help-city-en" placeholder="z. B. Vienna (leer lassen = gleicher Name)">
        </div>
        <div class="form-group">
          <label for="new-help-file">PDF</label>
          <input type="file" id="new-help-file" accept="application/pdf">
        </div>
      </div>
      ${helpContentFields('admin-help-new', {})}
      <button type="submit" class="btn btn-primary">Hilfsangebot hinzufügen</button>
      <p id="admin-help-status" class="form-status"></p>
    </form>
  `;
}

window.GLPPages['admin-blog'] = {
  title: 'Admin Blog',
  adminOnly: true,
  async render(container, ctx) {
    container.innerHTML = '<div class="glass-card"><h2>Admin Blog</h2><p>Lade...</p></div>';

    const { html: categoriesHtml, categories } = await renderAdminBlogCategories(ctx);
    const postsHtml = await renderAdminBlogPosts(ctx, categories);
    const helpHtml = await renderAdminHelpResources();

    container.innerHTML = `
      <div class="glass-card">
        <h2 style="margin-bottom:1.25rem;">Admin Blog</h2>
        ${categoriesHtml}
        <hr class="admin-section-divider">
        ${postsHtml}
        <hr class="admin-section-divider">
        ${helpHtml}
      </div>
    `;

    // ---- Categories ----
    const catForm = container.querySelector('#admin-blog-cat-form');
    if (catForm) {
      catForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const statusEl = container.querySelector('#admin-blog-cat-status');
        const nameDe = container.querySelector('#new-blog-cat-de').value.trim();
        const nameEn = container.querySelector('#new-blog-cat-en').value.trim();
        if (!nameDe || !nameEn) return;

        const { error } = await supabaseClient.from('blog_categories').insert({ name_de: nameDe, name_en: nameEn, sort_order: 0 });

        if (error) {
          statusEl.textContent = 'Fehler: ' + error.message;
          statusEl.classList.add('error');
          return;
        }

        this.render(container, ctx);
      });
    }

    container.querySelectorAll('.admin-blog-cat-save-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const nameDe = container.querySelector(`.admin-blog-cat-name-de[data-id="${id}"]`).value.trim();
        const nameEn = container.querySelector(`.admin-blog-cat-name-en[data-id="${id}"]`).value.trim();
        if (!nameDe || !nameEn) return;
        await supabaseClient.from('blog_categories').update({ name_de: nameDe, name_en: nameEn }).eq('id', id);
        this.render(container, ctx);
      });
    });

    container.querySelectorAll('.admin-blog-cat-delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        await supabaseClient.from('blog_categories').delete().eq('id', btn.dataset.id);
        this.render(container, ctx);
      });
    });

    // ---- Add post ----
    const postForm = container.querySelector('#admin-blog-post-form');
    if (postForm) {
      postForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const statusEl = container.querySelector('#admin-blog-post-status');
        const fields = readBlogPostFields(container, 'admin-blog-new', null);

        if (!fields.title_de || !fields.title_en || !fields.body_de || !fields.body_en) {
          statusEl.textContent = 'Bitte mindestens Titel und Text (DE + EN) ausfüllen.';
          statusEl.classList.add('error');
          return;
        }

        const slugError = finalizeBlogSlugs(fields);
        if (slugError) {
          statusEl.textContent = slugError;
          statusEl.classList.add('error');
          return;
        }

        const { categoryIds, ...postData } = fields;

        const { data: inserted, error } = await supabaseClient.from('blog_posts').insert(postData).select().single();

        if (error) {
          statusEl.textContent = blogSlugErrorMessage(error);
          statusEl.classList.add('error');
          return;
        }

        await saveBlogPostCategories(inserted.id, categoryIds);
        this.render(container, ctx);
      });
    }

    // ---- Edit / delete post ----
    container.querySelectorAll('.admin-blog-post-edit-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.closest('.admin-library-block').classList.toggle('open');
      });
    });

    container.querySelectorAll('.admin-blog-post-delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        await supabaseClient.from('blog_posts').delete().eq('id', btn.dataset.id);
        this.render(container, ctx);
      });
    });

    container.querySelectorAll('.admin-blog-post-save-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const statusEl = container.querySelector(`.admin-blog-post-edit-status[data-id="${id}"]`);
        const fields = readBlogPostFields(container, 'admin-blog-edit', id);
        const slugError = finalizeBlogSlugs(fields);
        if (slugError) {
          statusEl.textContent = slugError;
          statusEl.classList.add('error');
          return;
        }
        const { categoryIds, ...postData } = fields;

        const { error } = await supabaseClient.from('blog_posts').update(postData).eq('id', id);

        if (error) {
          statusEl.textContent = blogSlugErrorMessage(error);
          statusEl.classList.add('error');
          return;
        }

        await saveBlogPostCategories(Number(id), categoryIds);
        statusEl.classList.remove('error');
        statusEl.textContent = 'Gespeichert!';
      });
    });

    // ---- Local help resources ----
    function helpSafeName(name) { return name.replace(/[^a-zA-Z0-9._-]/g, '_'); }

    async function uploadHelpPdf(file) {
      const path = `${Date.now()}-${helpSafeName(file.name)}`;
      const { error } = await supabaseClient.storage.from('help-pdfs').upload(path, file, { contentType: 'application/pdf' });
      return { path, error };
    }

    const helpForm = container.querySelector('#admin-help-form');
    if (helpForm) {
      helpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const statusEl = container.querySelector('#admin-help-status');
        const city = container.querySelector('#new-help-city').value.trim();
        const cityEn = container.querySelector('#new-help-city-en').value.trim();
        const file = container.querySelector('#new-help-file').files[0];
        const contentDe = helpForm.querySelector('.admin-help-new-content-de').value.trim();
        const contentEn = helpForm.querySelector('.admin-help-new-content-en').value.trim();

        if (!city || !file) {
          statusEl.textContent = 'Bitte Stadt eintragen und ein PDF auswählen.';
          statusEl.classList.add('error');
          return;
        }

        statusEl.classList.remove('error');
        statusEl.textContent = 'Wird hochgeladen...';

        const { path, error: uploadError } = await uploadHelpPdf(file);
        if (uploadError) {
          statusEl.textContent = 'Fehler beim Hochladen: ' + uploadError.message;
          statusEl.classList.add('error');
          return;
        }

        const { error } = await supabaseClient.from('help_resources').insert({
          city, city_en: cityEn || null, file_path: path, content_de: contentDe || null, content_en: contentEn || null
        });
        if (error) {
          await supabaseClient.storage.from('help-pdfs').remove([path]);
          statusEl.textContent = 'Fehler: ' + error.message;
          statusEl.classList.add('error');
          return;
        }

        this.render(container, ctx);
      });
    }

    container.querySelectorAll('.admin-help-edit-toggle').forEach(btn => {
      btn.addEventListener('click', () => btn.closest('.admin-library-block').classList.toggle('open'));
    });

    container.querySelectorAll('.admin-help-save-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const panel = btn.closest('.admin-library-edit-panel');
        const statusEl = container.querySelector(`.admin-help-edit-status[data-id="${id}"]`);
        const city = panel.querySelector('.admin-help-edit-city').value.trim();
        const file = panel.querySelector('.admin-help-edit-file').files[0];
        const update = {
          city,
          city_en: panel.querySelector('.admin-help-edit-city-en').value.trim() || null,
          content_de: panel.querySelector('.admin-help-edit-content-de').value.trim() || null,
          content_en: panel.querySelector('.admin-help-edit-content-en').value.trim() || null
        };
        if (!city) return;

        statusEl.classList.remove('error');
        statusEl.textContent = 'Wird gespeichert...';

        let newPath = null;
        if (file) {
          const { path, error: uploadError } = await uploadHelpPdf(file);
          if (uploadError) {
            statusEl.textContent = 'Fehler beim Hochladen: ' + uploadError.message;
            statusEl.classList.add('error');
            return;
          }
          newPath = path;
          update.file_path = path;
        }

        const { error } = await supabaseClient.from('help_resources').update(update).eq('id', id);
        if (error) {
          if (newPath) await supabaseClient.storage.from('help-pdfs').remove([newPath]);
          statusEl.textContent = 'Fehler beim Speichern: ' + error.message;
          statusEl.classList.add('error');
          return;
        }

        if (newPath && btn.dataset.path) await supabaseClient.storage.from('help-pdfs').remove([btn.dataset.path]);
        statusEl.textContent = 'Gespeichert!';
        if (newPath) this.render(container, ctx);
      });
    });

    container.querySelectorAll('.admin-help-delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Dieses Hilfsangebot wirklich löschen?')) return;
        await supabaseClient.from('help_resources').delete().eq('id', btn.dataset.id);
        if (btn.dataset.path) await supabaseClient.storage.from('help-pdfs').remove([btn.dataset.path]);
        this.render(container, ctx);
      });
    });
  }
};
