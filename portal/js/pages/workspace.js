window.GLPPages = window.GLPPages || {};

const WORKSPACE_APPS = [
  {
    name: 'Google Drive',
    description: 'Gemeinsame Dateien und Ordner',
    url: 'https://drive.google.com',
    icon: 'drive.png'
  },
  {
    name: 'Google Calendar',
    description: 'Team-Kalender und Termine',
    url: 'https://calendar.google.com',
    icon: 'calendar.png'
  },
  {
    name: 'Gmail',
    description: 'E-Mails',
    url: 'https://mail.google.com',
    icon: 'gmail.png'
  },
  {
    name: 'Google Docs',
    description: 'Dokumente erstellen und bearbeiten',
    url: 'https://docs.google.com',
    icon: 'docs.png'
  },
  {
    name: 'Google Meet',
    description: 'Videokonferenzen',
    url: 'https://meet.google.com',
    icon: 'meet.png'
  }
];

window.GLPPages.workspace = {
  title: 'Workspace',
  async render(container, ctx) {
    const cards = WORKSPACE_APPS.map(app => `
      <a class="workspace-app-card" href="${app.url}" target="_blank" rel="noopener">
        <img class="app-icon" src="assets/icons/${app.icon}" alt="">
        <h4>${app.name}</h4>
        <p>${app.description}</p>
      </a>
    `).join('');

    container.innerHTML = `
      <div class="glass-card">
        <h2 style="margin-bottom:0.5rem;">Google Workspace</h2>
        <p class="workspace-intro">Schnellzugriff auf unsere Workspace-Apps.</p>
        <div class="workspace-grid">${cards}</div>
      </div>
    `;
  }
};
