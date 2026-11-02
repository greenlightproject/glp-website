// Turns the text stored in Supabase into HTML. Ported from the former browser scripts
// (blog-common.js, help-detail.js) so pages render on the server with the same markup.

import { escapeHtml } from './site.js';

// Inline links: [text](https://example.org) or [text](/blog/other-post/) inside a paragraph or bullet.
// Only http(s) and site-internal links are turned into <a>; everything else stays plain text.
function inlineHtml(text) {
  return escapeHtml(text).replace(/\[([^\]\n]+)\]\(((?:https?:\/\/|\/)[^\s)]+)\)/g, (_, label, href) => {
    const external = /^https?:/.test(href);
    return `<a href="${href}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>`;
  });
}

// Splits body text on blank lines into blocks. A block entirely wrapped in
// "**...**" becomes a subtitle (h3). Within any other block, lines starting
// with "-", "*", or "•" become a bullet list; remaining lines are joined
// into a paragraph (so a paragraph can still be soft-wrapped across lines).
export function renderBlogBody(text) {
  if (!text) return '';
  const htmlParts = [];

  text.split(/\n\s*\n/).forEach(rawBlock => {
    const block = rawBlock.trim();
    if (!block) return;

    const subtitleMatch = block.match(/^\*\*([\s\S]+)\*\*$/);
    if (subtitleMatch) {
      htmlParts.push(`<h3>${escapeHtml(subtitleMatch[1].trim())}</h3>`);
      return;
    }

    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    let paragraphLines = [];
    let listItems = [];

    function flushParagraph() {
      if (paragraphLines.length) {
        htmlParts.push(`<p>${inlineHtml(paragraphLines.join(' '))}</p>`);
        paragraphLines = [];
      }
    }

    function flushList() {
      if (listItems.length) {
        htmlParts.push('<ul class="article-list">' + listItems.map(i => `<li>${inlineHtml(i)}</li>`).join('') + '</ul>');
        listItems = [];
      }
    }

    lines.forEach(line => {
      const bulletMatch = line.match(/^[-*•]\s+(.*)/);
      if (bulletMatch) {
        flushParagraph();
        listItems.push(bulletMatch[1]);
      } else {
        flushList();
        paragraphLines.push(line);
      }
    });

    flushParagraph();
    flushList();
  });

  return htmlParts.join('\n');
}

// One source per line; a trailing http(s) URL in a line becomes a link
// (shown by its hostname), matching the site's existing citation style.
export function renderBlogSources(text) {
  if (!text || !text.trim()) return '';

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const items = lines.map(line => {
    const urlMatch = line.match(/(https?:\/\/\S+)/);
    if (urlMatch) {
      const url = urlMatch[1];
      const before = line.slice(0, urlMatch.index).trim();
      let label;
      try { label = new URL(url).hostname.replace(/^www\./, ''); } catch (e) { label = url; }
      return `<li style="font-size:0.85rem;color:var(--text-muted);line-height:1.6;">${escapeHtml(before)} <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a></li>`;
    }
    return `<li style="font-size:0.85rem;color:var(--text-muted);line-height:1.6;">${escapeHtml(line)}</li>`;
  });

  return `<hr style="border:none;border-top:1px solid var(--border);margin:2.5rem 0 0;" />` +
    `<ul style="list-style:none;padding:0;margin-top:1.5rem;display:flex;flex-direction:column;gap:0.6rem;">${items.join('')}</ul>`;
}

export function formatDate(dateStr, lang) {
  const d = new Date(dateStr + 'T00:00:00Z');
  return d.toLocaleDateString(lang === 'en' ? 'en-GB' : 'de-DE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

// Help resource pages store their text in help_resources.content_de / content_en using a very small markup:
//   # Title            -> page title (first one)
//   > Subtitle         -> line under the title
//   ## Heading         -> section heading
//   @ Name | https://  -> organisation card; following "Label: value" lines are its details
//   !! Heading         -> highlighted notice box; following lines are its text
//   -- Text            -> small note
//   anything else      -> normal paragraph

function helpLinkify(escaped) {
  return escaped.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
}

function helpPhoneLinks(value) {
  return value.split(/\s*\/\s*/).map(num => {
    const tel = num.replace(/[^\d+]/g, '');
    return `<a class="help-phone" href="tel:${tel}">${escapeHtml(num.trim())}</a>`;
  }).join('');
}

export function renderHelpContent(text) {
  const out = { title: '', subtitle: '', meta: '', html: '' };
  if (!text) return out;

  const parts = [];
  let cards = [];
  let metaDone = false;

  function flushCards() {
    if (cards.length) {
      parts.push(`<div class="help-cards">${cards.join('')}</div>`);
      cards = [];
    }
  }

  text.split(/\n\s*\n/).forEach(raw => {
    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return;
    const first = lines[0];

    // first note line (e.g. "Green Light Project (...) · Workshopmaterialien: Stand ...") -> small meta line without the site name
    if (!metaDone && first.startsWith('-- ') && !parts.length && !out.title) {
      metaDone = true;
      out.meta = lines.join(' ').slice(3).replace(/^\s*Green Light Project\s*(\([^)]*\))?\s*[·|\-–—:]*\s*/i, '').trim();
      return;
    }

    if (first.startsWith('# ')) { out.title = first.slice(2).trim(); return; }
    if (first.startsWith('> ')) { out.subtitle = first.slice(2).trim(); return; }

    if (first.startsWith('@ ')) {
      const [name, url] = first.slice(2).split('|').map(s => s.trim());
      const nameHtml = url
        ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(name)} <span aria-hidden="true">↗</span></a>`
        : escapeHtml(name);
      const rows = lines.slice(1).map(l => {
        const m = l.match(/^([^:]{1,40}):\s*(.+)$/);
        if (!m) return `<p>${escapeHtml(l)}</p>`;
        const label = m[1].trim();
        const isPhone = /^(telefon|phone|tel)$/i.test(label);
        return `<div class="help-field${isPhone ? ' help-field-phone' : ''}">
          <span class="help-label">${escapeHtml(label)}</span>
          <span class="help-value">${isPhone ? helpPhoneLinks(m[2]) : escapeHtml(m[2])}</span>
        </div>`;
      }).join('');
      cards.push(`<article class="help-card"><h3>${nameHtml}</h3>${rows}</article>`);
      return;
    }

    flushCards();

    if (first.startsWith('## ')) { parts.push(`<h2 class="help-h2">${escapeHtml(first.slice(3).trim())}</h2>`); return; }

    if (first.startsWith('!! ')) {
      const body = lines.slice(1).map(l => {
        const m = l.match(/^([^:]{1,40}):\s*(.+)$/);
        return m ? `<p><strong>${escapeHtml(m[1])}:</strong> ${escapeHtml(m[2])}</p>` : `<p>${escapeHtml(l)}</p>`;
      }).join('');
      parts.push(`<aside class="help-notice"><h3>${escapeHtml(first.slice(3).trim())}</h3>${body}</aside>`);
      return;
    }

    if (first.startsWith('-- ')) { parts.push(`<p class="help-note">${helpLinkify(escapeHtml(lines.join(' ').slice(3)))}</p>`); return; }

    parts.push(`<p class="help-text">${helpLinkify(escapeHtml(lines.join(' ')))}</p>`);
  });

  flushCards();
  out.html = (out.meta ? `<p class="help-meta">${escapeHtml(out.meta)}</p>\n` : '') + parts.join('\n');
  return out;
}
