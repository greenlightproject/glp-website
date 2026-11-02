// Minimal hash-based router: swaps the content area based on window.location.hash
// and keeps the sidebar's active state in sync.

const DEFAULT_ROUTE = 'news';

function currentRouteKey() {
  const key = window.location.hash.replace('#', '');
  return key || DEFAULT_ROUTE;
}

async function renderRoute(ctx) {
  let key = currentRouteKey();
  const page = GLPPages[key];

  if (!page || (page.adminOnly && !ctx.member.is_admin)) {
    key = DEFAULT_ROUTE;
    window.location.hash = DEFAULT_ROUTE;
    return; // hashchange will re-trigger renderRoute
  }

  setSidebarActive(key);
  const container = document.getElementById('content');
  await page.render(container, ctx);
}

function initRouter(ctx) {
  window.addEventListener('hashchange', () => renderRoute(ctx));
  renderRoute(ctx);
}
