// Renders the blog overview, the posts and the help resource pages from Supabase on each request,
// so search engines and link previews get complete HTML (the old pages filled themselves in via JS).
// Page frames live in /_templates/<name>.<de|en>.html; their <!--@name--> markers are replaced here.
// Responses are cached on Netlify's CDN for 60 s, so a post published in the portal shows up within a minute.

import { db, storageUrl, escapeHtml, headTags, langSwitch, postSlug, helpSlug, helpCity, blogPath, helpPath, shorten } from '../lib/site.js';
import { renderBlogBody, renderBlogSources, renderHelpContent, formatDate } from '../lib/render.js';

const t = (lang, de, en) => (lang === 'en' ? en : de);
const other = lang => (lang === 'en' ? 'de' : 'en');

// The first three posts used to be static files; they are database posts 1-3 now.
const LEGACY_POSTS = { '1-konsens.html': 1, '2-kommunikation.html': 2, '3-inkongruente-kommunikation.html': 3 };

export default async request => {
  const url = new URL(request.url);
  const path = url.pathname;
  const lang = path.startsWith('/en/') ? 'en' : 'de';
  let m;
  try {
    if (/^\/(en\/)?blog\/?$/.test(path)) return await blogIndex(url, lang);
    if (path === '/blog/index.html' || path === '/en/blog/index.html') return redirect(url, path.replace('index.html', ''));
    if (path === '/blog/post.html') return await legacyPost(url, url.searchParams.get('id'));
    if ((m = path.match(/^\/blog\/([\w-]+\.html)$/)) && LEGACY_POSTS[m[1]]) return await legacyPost(url, LEGACY_POSTS[m[1]]);
    if (path === '/blog/hilfe.html') return await legacyHelp(url, url.searchParams.get('id'));
    if ((m = path.match(/^\/(?:en\/)?blog\/([a-z0-9-]+)\/?$/))) return await postPage(url, lang, m[1]);
    if ((m = path.match(/^\/(?:hilfe|en\/help)\/([a-z0-9-]+)\/?$/))) return await helpPage(url, lang, m[1]);
    return await notFound(url, lang);
  } catch (err) {
    console.error(err);
    return await unavailable(url, lang);
  }
};

export const config = {
  path: ['/blog', '/blog/*', '/en/blog', '/en/blog/*', '/hilfe/*', '/en/help/*'],
  cache: 'manual',
};

async function blogIndex(url, lang) {
  const [tpl, categories, posts, help] = await Promise.all([
    template(url, 'blog-index', lang),
    db('blog_categories?select=*&order=sort_order.asc,id.asc'),
    db('blog_posts?select=*,blog_post_categories(category_id)&order=published_date.desc'),
    db('help_resources?select=*&order=city.asc'),
  ]);
  const catName = c => t(lang, c.name_de, c.name_en);

  const pills = [`<button class="blog-filter-pill active" data-cat="">${t(lang, 'Alle', 'All')}</button>`]
    .concat(categories.map(c => `<button class="blog-filter-pill" data-cat="${c.id}">${escapeHtml(catName(c))}</button>`))
    .join('');

  const cards = posts.map(p => {
    const ids = (p.blog_post_categories || []).map(pc => pc.category_id);
    const tag = categories.filter(c => ids.includes(c.id)).map(catName).join(' & ');
    return `
        <a class="blog-card" href="${blogPath(lang, postSlug(p, lang))}" data-cats="${ids.join(' ')}">
          <div class="blog-card-header">
            <span class="blog-card-tag">${escapeHtml(tag)}</span>
            <span class="blog-card-date">${formatDate(p.published_date, lang)}</span>
          </div>
          <h2>${escapeHtml(t(lang, p.title_de, p.title_en))}</h2>
          <p class="blog-card-excerpt">${escapeHtml(t(lang, p.excerpt_de, p.excerpt_en))}</p>
          <span class="blog-card-cta">${t(lang, 'Weiterlesen →', 'Read more →')}</span>
        </a>`;
  }).join('');
  const empty = `<p class="blog-empty"${posts.length ? ' style="display:none"' : ''}>${t(lang, 'Noch keine Beiträge.', 'No posts yet.')}</p>`;

  const helpRows = help.length ? help.map(item => {
    const viewUrl = storageUrl('help-pdfs', item.file_path);
    const downloadUrl = storageUrl('help-pdfs', item.file_path, `${t(lang, 'Hilfsangebote', 'Help-resources')}-${helpCity(item, lang)}.pdf`);
    const hasPage = !!(item.content_de && item.content_de.trim());
    return `
        <div class="help-row">
          <span class="help-city">${escapeHtml(helpCity(item, lang))}</span>
          <span class="help-actions">
            ${hasPage
              ? `<a class="btn btn-primary" href="${helpPath(lang, helpSlug(item, lang))}">${t(lang, 'Mehr lesen', 'Read more')}</a>`
              : `<a class="btn btn-primary" href="${escapeHtml(viewUrl)}" target="_blank" rel="noopener">${t(lang, 'PDF ansehen', 'View PDF')}</a>`}
            <a class="btn btn-glass" href="${escapeHtml(downloadUrl)}" download>${t(lang, 'PDF herunterladen', 'Download PDF')}</a>
          </span>
        </div>`;
  }).join('') : `<p class="help-empty">${t(lang, 'Hier erscheinen bald Übersichten für weitere Städte.', 'Overviews for more cities will appear here soon.')}</p>`;

  const pair = { de: '/blog/', en: '/en/blog/' };
  return html(fill(tpl, {
    head: headTags({
      lang, url: pair[lang], ...pair,
      title: t(lang, 'GLP Blog – Wissen zu Konsens, Grenzen & Beziehungen', 'GLP Blog – Consent, Boundaries & Relationships'),
      description: t(lang,
        'Hintergrundwissen zu Konsens, Kommunikation und sexueller Selbstbestimmung, geschrieben von Student:innen, mit Quellen und Hilfsangeboten.',
        'Background knowledge on consent, communication and sexual self-determination, written by students, with sources and help resources.'),
    }),
    langswitch: langSwitch(lang, pair[other(lang)]),
    pills,
    cards: cards + '\n        ' + empty,
    help: helpRows,
  }));
}

async function postPage(url, lang, slug) {
  const [posts, categories] = await Promise.all([
    db('blog_posts?select=*,blog_post_categories(category_id)'),
    db('blog_categories?select=*'),
  ]);
  const post = posts.find(p => postSlug(p, lang) === slug);
  if (!post) {
    // e.g. /en/blog/<german slug>/ -> the English URL of that post
    const otherLang = posts.find(p => postSlug(p, other(lang)) === slug);
    return otherLang ? redirect(url, blogPath(lang, postSlug(otherLang, lang))) : notFound(url, lang);
  }
  if (!url.pathname.endsWith('/')) return redirect(url, blogPath(lang, slug));

  const tpl = await template(url, 'blog-post', lang);
  const catIds = (post.blog_post_categories || []).map(pc => pc.category_id);
  const category = categories.filter(c => catIds.includes(c.id)).map(c => t(lang, c.name_de, c.name_en)).join(' & ');
  const title = t(lang, post.title_de, post.title_en || post.title_de);
  const pair = { de: blogPath('de', postSlug(post, 'de')), en: blogPath('en', postSlug(post, 'en')) };

  return html(fill(tpl, {
    pagetitle: escapeHtml(`${title} – GLP Blog`),
    head: headTags({
      lang, url: pair[lang], ...pair, type: 'article',
      title: `${title} – GLP Blog`,
      description: shorten(t(lang, post.excerpt_de, post.excerpt_en || post.excerpt_de)),
    }),
    langswitch: langSwitch(lang, pair[other(lang)]),
    category: escapeHtml(category),
    title: escapeHtml(title),
    body: renderBlogBody(t(lang, post.body_de, post.body_en || post.body_de)),
    byline: escapeHtml(`– ${post.author}, ${formatDate(post.published_date, lang)}`),
    sources: renderBlogSources(post.sources),
  }));
}

async function helpPage(url, lang, slug) {
  const items = await db('help_resources?select=*');
  const item = items.find(i => helpSlug(i, lang) === slug);
  if (!item) {
    // e.g. /en/help/wien/ -> /en/help/vienna/
    const otherLang = items.find(i => helpSlug(i, other(lang)) === slug);
    return otherLang ? redirect(url, helpPath(lang, helpSlug(otherLang, lang))) : notFound(url, lang);
  }
  if (!url.pathname.endsWith('/')) return redirect(url, helpPath(lang, slug));

  const tpl = await template(url, 'help', lang);
  const city = helpCity(item, lang);
  // English falls back to German if there is no English text yet
  const c = renderHelpContent((lang === 'en' && item.content_en) ? item.content_en : item.content_de);
  const pair = { de: helpPath('de', helpSlug(item, 'de')), en: helpPath('en', helpSlug(item, 'en')) };
  const pageTitle = `${t(lang, 'Hilfsangebote', 'Help resources')} ${city} – Green Light Project`;

  return html(fill(tpl, {
    pagetitle: escapeHtml(pageTitle),
    head: headTags({
      lang, url: pair[lang], ...pair,
      title: pageTitle,
      description: t(lang,
        `Hilfe bei sexueller Übergriffigkeit in ${city}: Beratungsstellen, Notrufe und Telefonnummern im Überblick.`,
        `Help regarding sexual assault in ${city}: counselling centres, emergency lines and phone numbers at a glance.`),
    }),
    langswitch: langSwitch(lang, pair[other(lang)]),
    subtitle: c.subtitle ? `<p id="helpSubtitle">${escapeHtml(c.subtitle)}</p>` : '',
    heading: escapeHtml(c.title || t(lang, `Hilfsangebote in ${city}`, `Help resources in ${city}`)),
    body: c.html || `<p class="help-text">${t(lang, 'Zu diesem Angebot gibt es noch keine Textversion – bitte das PDF herunterladen.', 'There is no text version yet – please download the PDF.')}</p>`,
    pdf: escapeHtml(storageUrl('help-pdfs', item.file_path, `${t(lang, 'Hilfsangebote', 'Help-resources')}-${city}.pdf`)),
  }));
}

// /blog/post.html?id=N and the old static post files -> the post's current URL
async function legacyPost(url, id) {
  const [post] = /^\d+$/.test(String(id)) ? await db(`blog_posts?select=*&id=eq.${id}`) : [];
  return post ? redirect(url, blogPath('de', postSlug(post, 'de'))) : notFound(url, 'de');
}

// /blog/hilfe.html?id=N -> /hilfe/<city>/
async function legacyHelp(url, id) {
  const [item] = /^\d+$/.test(String(id)) ? await db(`help_resources?select=*&id=eq.${id}`) : [];
  return item ? redirect(url, helpPath('de', helpSlug(item, 'de'))) : notFound(url, 'de');
}

async function template(url, name, lang) {
  const res = await fetch(new URL(`/_templates/${name}.${lang}.html`, url));
  if (!res.ok) throw new Error(`template ${name}.${lang}: ${res.status}`);
  return res.text();
}

function fill(tpl, values) {
  return tpl
    .replace(/\s*<meta name="robots" content="noindex" data-template \/>/, '')
    .replace(/<!--@(\w+)-->/g, (_, key) => {
      const v = values[key] ?? '';
      return Array.isArray(v) ? v.join('\n  ') : v;
    });
}

function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, must-revalidate',
      'netlify-cdn-cache-control': 'public, s-maxage=60, stale-while-revalidate=86400',
    },
  });
}

const redirect = (url, path) => Response.redirect(new URL(path, url).toString(), 301);

async function notFound(url, lang) {
  const res = await fetch(new URL(lang === 'en' ? '/en/404.html' : '/404.html', url));
  return new Response(await res.text(), { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

// Supabase unreachable: 503 tells search engines to come back later instead of dropping the page.
// (Only the existing German error text exists so far; an English one is pending approval.)
async function unavailable(url, lang) {
  const message = 'Fehler beim Laden der Beiträge.';
  let body = message;
  try {
    const tpl = await template(url, 'blog-index', lang);
    body = fill(tpl, { head: ['<meta name="robots" content="noindex" />'], cards: `<p class="blog-empty">${message}</p>` });
  } catch (e) { /* template unreachable too: plain text */ }
  return new Response(body, { status: 503, headers: { 'content-type': 'text/html; charset=utf-8', 'retry-after': '120' } });
}
