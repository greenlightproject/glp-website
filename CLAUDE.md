# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Website of the Green Light Project (GLP), a student initiative for consent and sexual education (greenlightproject.eu). The site is plain static HTML/CSS/vanilla JS hosted on Netlify. There is no build step and no test suite. Two Netlify Edge Functions render the database-driven pages. The backend is a hosted Supabase project (Postgres with RLS, Auth, Storage, Edge Functions); its schema, policies and functions are **not** in this repo.

**Content rule from the team:** never edit, add or remove website content (visible text, page titles, meta descriptions, structured-data text, images) without asking first. Technical changes are fine.

## Running locally

```bash
python3 -m http.server 8080          # static pages only; /blog, posts and help pages won't work
npx netlify-cli dev --offline        # full site incl. edge functions, _redirects and _headers (port 8888)
```

`.claude/launch.json` runs the Python server on port 8080 for the static pages (its `cd` path is Ria's machine).

## Deploying

The site is deployed from GitHub through Netlify (push to `main` = live; other branches get their own preview address). The edge functions only go live this way or with `netlify deploy` from the CLI; drag & drop deploys skip them, so the blog would 404. Test every change on a branch/preview before merging to `main`. `netlify.toml` publishes this folder as is (`publish = "."`). `_redirects` keeps repo-only files (`CLAUDE.md`, `netlify/`, `.claude/`) from being served.

## Public site

- **URLs are folders:** `mitmachen/index.html` is served at `/mitmachen/`. Every link and asset path is root-absolute (`/assets/...`, `/kontakt/`). Old `*.html` URLs 301 via `_redirects`.
- **German and English are separate pages.** German lives at `/…` and English at `/en/…`, with translated slugs. The pairs are listed in `PAGES` in `netlify/lib/site.js`, which also feeds the sitemap. The Impressum exists in German only. Each page's `<head>` has a canonical tag, an hreflang pair (`de`, `en`, `x-default`→de), icons and Open Graph tags; `headTags()` in `site.js` produces exactly these lines. The nav's DE/EN switch is a plain `<a class="lang-toggle">` linking to the counterpart page.
- Translatable elements still carry `data-lang="de|en" class="… active"`. CSS (`[data-lang]` / `.active` in style.css) depends on that, so keep both attributes on new elements. Page scripts read the language from `document.documentElement.lang` (e.g. the form label scripts on Kontakt/Mitmachen, and `form-submit.js`).
- **Adding a page** takes four changes: (1) create a DE folder and an EN folder, (2) give each `<head>` the tag block (copy it from a sibling page and change the URLs), (3) add the nav/footer link to every page in both languages, (4) add the pair to `PAGES`.
- Every page loads `assets/css/fonts.css` → `style.css` → `glp.css`. `glp.css` is a redesign layer scoped under `body.glp`. Nav and footer are duplicated in every HTML file, including `_templates/` and the 404 pages.
- **Forms:** Kontakt and Mitmachen call `submitGlpForm(event, type, thanks)` in `assets/js/form-submit.js`. It POSTs to the Supabase Edge Function `send-form` (mail via Resend; returns 429 when rate-limited).
- **Images:** photos and partner logos are served as resized `.webp` copies next to the original JPG/PNG files, which are unused now. Folder names are capitalised (`Team/`, `Partners/`, `Logos/`). The CSS sets sizes via `aspect-ratio`, so don't add `width`/`height` attributes; they'd override it.

## Edge functions (`netlify/edge-functions/`, Deno)

- `blog.js` handles `/blog/*`, `/en/blog/*`, `/hilfe/*` and `/en/help/*`. It fetches posts, categories and `help_resources` from the Supabase REST API, fills a page frame from `_templates/<name>.<de|en>.html` by replacing `<!--@token-->` markers, and returns complete HTML. Responses are cached on the CDN for 60 s. It also 301s legacy URLs (`/blog/post.html?id=N`, `/blog/hilfe.html?id=N`, the three old static post files) and returns `/404.html` or `/en/404.html` for unknown slugs.
- `sitemap.js` builds `/sitemap.xml` from `PAGES` plus every post and help page.
- Shared code lives in `netlify/lib/`: `site.js` holds URLs, `PAGES`, slugs, Supabase access and head tags; `render.js` turns the stored text formats into HTML. Body format: blank lines separate blocks, `**…**` makes a subheading, `-`/`*`/`•` make bullets. Help-page format: `#`, `>`, `##`, `@ Name | url`, `!!`, `--`.
- **Post URLs are frozen in `blog_posts.slug_de` / `slug_en`** (the portal's "Adresse im Web" fields; if left empty on first save they are filled from the title, and later title edits no longer change them). A post without a stored slug falls back to `slugify(title_de)` / `slugify(title_en)`. Changing a stored slug breaks links to the old URL. Help pages use `slugify(city)`.
- The blog overview's category filter (`assets/js/blog-filter.js`) only shows and hides server-rendered cards.

## Member portal (`portal/`)

Unchanged by the SEO work, and `robots.txt` disallows it.
- `portal/index.html` handles Google OAuth login via Supabase Auth; `portal/app.html` is the SPA shell with its own `portal/css/portal.css`.
- `getSessionAndMember()` (`js/auth.js`) loads the user's row from `members`. `member.is_admin` gates the admin pages; RLS does the real enforcement.
- `js/router.js` is a hash router. Pages register `window.GLPPages[key] = { title, adminOnly?, async render(container, ctx) }`.
- **Adding a portal page** takes three changes: (1) create `js/pages/<name>.js`, (2) add its `<script>` to `app.html` before `router.js`, (3) add it to `SIDEBAR_ITEMS` (or `adminItems`) in `js/components/sidebar.js`.
- Scripts are classic globals (`supabaseClient`, `renderRichText`, `escapeHtml`), so their order matters.
- `app.html`/`index.html` add `?v=NN` to their CSS/JS URLs. Bump it after changing a portal asset.
- The portal loads the vendored `assets/js/vendor/supabase-2.117.3.js`.

## Supabase

- Project URL and anon key are hard-coded in `netlify/lib/site.js`, `assets/js/form-submit.js` and `portal/js/supabase-config.js` (public by design; RLS protects data).
- Tables: `members`, `news`, `department_updates`, `events`, `event_registrations`, `library_items`, `library_categories`, `blog_posts`, `blog_categories`, `blog_post_categories`, `help_resources`. Buckets: `profile-pictures`, `library-pdfs`, `help-pdfs`.
