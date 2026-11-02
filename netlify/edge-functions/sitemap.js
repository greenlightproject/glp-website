// /sitemap.xml, built on request: the static pages from PAGES plus every post and help page in Supabase,
// so new posts appear in it without anyone editing a file.

import { ORIGIN, PAGES, db, postSlug, helpSlug, blogPath, helpPath } from '../lib/site.js';

export default async () => {
  let posts, help;
  try {
    [posts, help] = await Promise.all([
      db('blog_posts?select=*&order=published_date.desc'),
      db('help_resources?select=*&order=city.asc'),
    ]);
  } catch (err) {
    console.error(err);
    return new Response('Sitemap temporarily unavailable', { status: 503, headers: { 'retry-after': '600' } });
  }

  const urls = [];
  for (const page of PAGES) {
    urls.push({ loc: page.de });
    if (page.en) urls.push({ loc: page.en });
  }
  for (const post of posts) {
    urls.push({ loc: blogPath('de', postSlug(post, 'de')), lastmod: post.published_date });
    if (post.title_en) urls.push({ loc: blogPath('en', postSlug(post, 'en')), lastmod: post.published_date });
  }
  for (const item of help) {
    if (!item.content_de || !item.content_de.trim()) continue; // no page of its own, only the PDF
    urls.push({ loc: helpPath('de', helpSlug(item)) });
    if (item.content_en) urls.push({ loc: helpPath('en', helpSlug(item, 'en')) });
  }

  const body = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(u => `  <url><loc>${ORIGIN}${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n') +
    '\n</urlset>\n';

  return new Response(body, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=0, must-revalidate',
      'netlify-cdn-cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
};

export const config = { path: '/sitemap.xml', cache: 'manual' };
