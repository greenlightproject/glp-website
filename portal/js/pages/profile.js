window.GLPPages = window.GLPPages || {};

window.GLPPages.profile = {
  title: 'Profil',
  async render(container, ctx) {
    const member = ctx.member;
    const placeholder = 'data:image/svg+xml;utf8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="20" fill="#dff0c8"/><text x="64" y="80" font-size="48" text-anchor="middle" fill="#1d4810" font-family="sans-serif">?</text></svg>'
    );
    const currentPhoto = member.profile_picture_url || member.google_photo_url || placeholder;

    container.innerHTML = `
      <div class="glass-card profile-form">
        <h2>Profil</h2>
        <div class="profile-avatar-row">
          <img id="profile-avatar-preview" src="${currentPhoto}" alt="">
          <div class="profile-avatar-actions">
            <label class="btn btn-secondary" style="cursor:pointer;">
              Neues Foto hochladen
              <input type="file" id="avatar-upload" accept="image/jpeg,image/png,image/webp" style="display:none;">
            </label>
            ${member.profile_picture_url ? '<button type="button" class="btn btn-secondary" id="avatar-reset">Zurücksetzen</button>' : ''}
          </div>
        </div>

        <p class="profile-note">Diese Angaben werden vom Admin verwaltet. Nur dein Profilbild kannst du selbst ändern.</p>

        <div class="profile-fields-grid">
          <div class="form-group">
            <label for="field-name">Name</label>
            <input type="text" id="field-name" value="${member.name || ''}" disabled>
          </div>
          <div class="form-group">
            <label for="field-email">E-Mail</label>
            <input type="email" id="field-email" value="${member.email}" disabled>
          </div>
          <div class="form-group">
            <label for="field-phone">Telefon</label>
            <input type="text" id="field-phone" value="${member.phone || ''}" disabled>
          </div>
          <div class="form-group">
            <label for="field-standort">Standort</label>
            <input type="text" id="field-standort" value="${member.standort || ''}" disabled>
          </div>
          <div class="form-group">
            <label for="field-universitaet">Universität</label>
            <input type="text" id="field-universitaet" value="${member.universitaet || ''}" disabled>
          </div>
          <div class="form-group">
            <label for="field-studiengang">Studiengang</label>
            <input type="text" id="field-studiengang" value="${member.studiengang || ''}" disabled>
          </div>
          <div class="form-group">
            <label for="field-bereich">Bereich</label>
            <input type="text" id="field-bereich" value="${member.bereich || ''}" disabled>
          </div>
          <div class="form-group">
            <label for="field-rolle">Rolle</label>
            <input type="text" id="field-rolle" value="${member.rolle || ''}" disabled>
          </div>
        </div>

        <p id="profile-status" class="form-status"></p>
      </div>
    `;

    const statusEl = container.querySelector('#profile-status');

    container.querySelector('#avatar-upload').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      statusEl.classList.remove('error');
      statusEl.textContent = 'Foto wird hochgeladen...';

      const ext = file.name.split('.').pop();
      const path = `${member.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabaseClient.storage
        .from('profile-pictures')
        .upload(path, file, { upsert: true });

      if (uploadError) {
        statusEl.textContent = 'Fehler beim Hochladen: ' + uploadError.message;
        statusEl.classList.add('error');
        return;
      }

      const { data: urlData } = supabaseClient.storage.from('profile-pictures').getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      const { error: updateError } = await supabaseClient
        .from('members')
        .update({ profile_picture_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', member.id);

      if (updateError) {
        statusEl.textContent = 'Fehler beim Speichern: ' + updateError.message;
        statusEl.classList.add('error');
        return;
      }

      member.profile_picture_url = publicUrl;
      statusEl.classList.remove('error');
      statusEl.textContent = 'Profilbild aktualisiert!';
      this.render(container, ctx);
    });

    const resetBtn = container.querySelector('#avatar-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', async () => {
        const { error } = await supabaseClient
          .from('members')
          .update({ profile_picture_url: null, updated_at: new Date().toISOString() })
          .eq('id', member.id);

        if (!error) {
          member.profile_picture_url = null;
          this.render(container, ctx);
        }
      });
    }
  }
};
