// Renders the sidebar navigation and keeps the active item in sync with the router.

const SIDEBAR_ITEMS = [
  { key: 'news', label: 'News & Bereiche' },
  { key: 'library', label: 'Bibliothek' },
  { key: 'network', label: 'Teams und Mitglieder' },
  { key: 'workspace', label: 'Workspace' },
  { key: 'profile', label: 'Profil' },
  { type: 'divider' },
  { key: 'calendar-ausbildung', label: 'Anmeldung für Ausbildungen' },
  { key: 'calendar-workshops', label: 'Anmeldung für Workshops' },
  { key: 'calendar-events', label: 'Anmeldung für Events' },
  { type: 'divider' },
  { key: 'mein-kalender', label: 'Mein Kalender' }
];

function renderSidebar(isAdmin) {
  const nav = document.getElementById('sidebar-nav');
  nav.innerHTML = '';

  SIDEBAR_ITEMS.forEach(item => {
    if (item.type === 'divider') {
      const hr = document.createElement('hr');
      hr.className = 'sidebar-divider';
      nav.appendChild(hr);
      return;
    }

    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#' + item.key;
    a.dataset.key = item.key;
    a.textContent = item.label;
    li.appendChild(a);
    nav.appendChild(li);
  });

  if (isAdmin) {
    const hr = document.createElement('hr');
    hr.className = 'sidebar-divider';
    nav.appendChild(hr);

    const adminItems = [
      { key: 'admin-members', label: 'Admin Mitglieder' },
      { key: 'admin-events', label: 'Admin Veranstaltungen' },
      { key: 'admin-library', label: 'Admin Bibliothek' },
      { key: 'admin-news', label: 'Admin News' },
      { key: 'admin-blog', label: 'Admin Blog' }
    ];

    adminItems.forEach(item => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#' + item.key;
      a.dataset.key = item.key;
      a.textContent = item.label;
      li.appendChild(a);
      nav.appendChild(li);
    });
  }
}

function setSidebarActive(key) {
  document.querySelectorAll('#sidebar-nav a').forEach(a => {
    a.classList.toggle('active', a.dataset.key === key);
  });
}
