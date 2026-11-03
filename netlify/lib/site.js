// Shared by the edge functions: site URLs, the German/English page pairs, slugs,
// Supabase access and the SEO tags every page carries in its <head>.

export const ORIGIN = 'https://greenlightproject.eu';

// Same public project + anon key as assets/js/form-submit.js and portal/js/supabase-config.js.
// The anon key is public by design; Row Level Security protects the data.
export const SUPABASE_URL = 'https://iaqcjnphaiuhiatrigzu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhcWNqbnBoYWl1aGlhdHJpZ3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MzA4OTIsImV4cCI6MjEwNDEwNjg5Mn0.aR83KXrza78TTue6oNV9mcl6ojk3LEcKOQr1uCB2Css';

// Static pages as German/English URL pairs (en: null = German only, e.g. the Impressum).
// Keep in sync with the folders on disk; the sitemap is built from this list.
export const PAGES = [
  { de: '/', en: '/en/' },
  { de: '/mitmachen/', en: '/en/get-involved/' },
  { de: '/partner/', en: '/en/partners/' },
  { de: '/ueber-uns/', en: '/en/about-us/' },
  { de: '/workshops-fuer-schulen/', en: '/en/workshops-for-schools/' },
  { de: '/kontakt/', en: '/en/contact/' },
  { de: '/blog/', en: '/en/blog/' },
  { de: '/datenschutz/', en: '/en/privacy/' },
  { de: '/impressum/', en: null },
];

export const blogPath = (lang, slug) => (lang === 'en' ? `/en/blog/${slug}/` : `/blog/${slug}/`);
export const helpPath = (lang, slug) => (lang === 'en' ? `/en/help/${slug}/` : `/hilfe/${slug}/`);

// "Talk, Don't Guess" -> "talk-dont-guess", "Wenn das Ja trügt" -> "wenn-das-ja-truegt"
export function slugify(text) {
  return String(text || '').toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// URL slug of a post. Derived from the title unless a slug_de / slug_en column exists
// (adding those columns in Supabase freezes the URLs, so later title edits don't change them).
export function postSlug(post, lang) {
  if (lang === 'en') return post.slug_en || slugify(post.title_en || post.title_de);
  return post.slug_de || slugify(post.title_de);
}

// German page: /hilfe/<city>/, English page: /en/help/<english city>/ (city_en falls back to the German name)
export const helpSlug = (item, lang = 'de') =>
  lang === 'en' ? slugify(item.city_en || item.city) : (item.slug || slugify(item.city));
export const helpCity = (item, lang = 'de') => (lang === 'en' ? (item.city_en || item.city) : item.city);

export async function db(query) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
  });
  if (!res.ok) throw new Error(`Supabase ${res.status} for ${query}`);
  return res.json();
}

// Same URLs supabase-js getPublicUrl() returns.
export function storageUrl(bucket, path, downloadName) {
  const url = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${encodeURI(path)}`;
  return downloadName ? `${url}?download=${encodeURIComponent(downloadName)}` : url;
}

export function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// <head> tags for a page: canonical, hreflang pair, icons and social preview.
// `de` / `en` are the page's two language URLs (pass only `url` for single-language pages).
export function headTags({ lang, url, de, en, type = 'website', title, description }) {
  const tags = [];
  if (description) tags.push(`<meta name="description" content="${escapeHtml(description)}" />`);
  tags.push(`<link rel="canonical" href="${ORIGIN}${url}" />`);
  if (de && en) {
    tags.push(
      `<link rel="alternate" hreflang="de" href="${ORIGIN}${de}" />`,
      `<link rel="alternate" hreflang="en" href="${ORIGIN}${en}" />`,
      `<link rel="alternate" hreflang="x-default" href="${ORIGIN}${de}" />`
    );
  }
  tags.push(
    ...ICON_TAGS,
    `<meta property="og:type" content="${type}" />`,
    ...(title ? [`<meta property="og:title" content="${escapeHtml(title)}" />`] : []),
    ...(description ? [`<meta property="og:description" content="${escapeHtml(description)}" />`] : []),
    `<meta property="og:site_name" content="Green Light Project" />`,
    `<meta property="og:url" content="${ORIGIN}${url}" />`,
    `<meta property="og:locale" content="${lang === 'en' ? 'en_GB' : 'de_AT'}" />`,
    `<meta property="og:image" content="${ORIGIN}/assets/images/social/share.png" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`
  );
  return tags;
}

export const ICON_TAGS = [
  `<link rel="icon" href="/favicon.ico" sizes="48x48" />`,
  `<link rel="icon" href="/favicon.svg" type="image/svg+xml" />`,
  `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />`
];

// The DE/EN switch in the nav: a plain link to the same page in the other language.
export function langSwitch(lang, href) {
  const other = lang === 'en' ? 'de' : 'en';
  return `<a class="lang-toggle" href="${href}" hreflang="${other}" lang="${other}">${other.toUpperCase()}</a>`;
}

// Shortens a text to about `max` characters at a word boundary, e.g. for a post's meta description.
export function shorten(text, max = 155) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(' ') > 80 ? cut.lastIndexOf(' ') : cut.length).replace(/[\s,;:.–-]+$/, '') + '…';
}
