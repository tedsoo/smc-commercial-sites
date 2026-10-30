#!/usr/bin/env node
/*
  SMC Commercial Properties — static site build (no frameworks, no runtime dependencies).

  Content lives in /data. Templates live in this file. Output goes to /dist.
  Netlify runs `node build.js` on every deploy (see netlify.toml).
  Local preview:  npm install && npm run serve   ->  http://localhost:8080
*/
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'dist');

const site = require('./data/site');
const properties = require('./data/properties');
const tenants = require('./data/tenants');
const news = require('./data/news').slice().sort((a, b) => b.date.localeCompare(a.date));
const photos = require('./data/photos');
const CACHE = path.join(ROOT, '.cache', 'photos');

// Download licensed stock photos (data/photos.js) before rendering. Never fails the build.
try {
  require('child_process').execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'fetch-photos.js')], { stdio: 'inherit', timeout: 120000 });
} catch (e) {
  console.warn('! Stock photo download skipped: ' + e.message);
}

const BUILD_ID = (process.env.COMMIT_REF || '').slice(0, 8) || Date.now().toString(36);
const C = site.contacts;
const B = site.brand;

/* ------------------------------------------------------------------ */
/* Validation — fail loudly on structural errors, list content to verify */
/* ------------------------------------------------------------------ */
const ids = new Set(properties.map(p => p.id));
const errors = [];
const verifyList = [];
properties.forEach(p => {
  ['id', 'slug', 'name', 'city', 'state', 'type', 'tagline', 'cardLine', 'address', 'hours'].forEach(k => {
    if (!p[k] || (Array.isArray(p[k]) && !p[k].length)) errors.push(`Property "${p.id || '?'}" is missing "${k}"`);
  });
  if (p.glaVerify) verifyList.push(`${p.name}: GLA (${p.glaSF ? p.glaSF.toLocaleString('en-US') : '—'} SF, approximate)`);
  if (p.addressVerify) verifyList.push(`${p.name}: published address`);
  (p.availability || []).forEach(a => { if (a.placeholder) verifyList.push(`${p.name}: availability row "${a.use}" is a placeholder`); });
});
tenants.forEach(t => {
  if (!ids.has(t.p)) errors.push(`Tenant "${t.n}" has unknown property "${t.p}"`);
  if (t.verify) verifyList.push(`${(properties.find(p => p.id === t.p) || {}).name}: tenant "${t.n}"`);
});
news.forEach(n => { if (n.property !== 'all' && !ids.has(n.property)) errors.push(`News "${n.title}" has unknown property "${n.property}"`); });
Object.values(C).forEach(c => { if (c.verify) verifyList.push(`Contact: ${c.label} ${c.phone || c.email || ''}`); });
if (errors.length) { console.error('Build failed:\n  - ' + errors.join('\n  - ')); process.exit(1); }

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Number(n).toLocaleString('en-US');
const tel = p => 'tel:+1' + String(p).replace(/\D/g, '');
const byId = id => properties.find(p => p.id === id);
const pageOf = p => `/${p.slug}.html`;
const loc = p => `${p.city}, ${p.state}`;
const verify = reason => `<span class="verify" title="${esc(reason)}">Verify</span>`;
const mapsUrl = p => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(p.mapQuery || p.address.join(', '));
const tenantsAt = id => tenants.filter(t => t.p === id);
const totalGLA = properties.reduce((s, p) => s + (p.glaSF || 0), 0);
const anyApprox = properties.some(p => p.glaApprox);
const glaText = p => p.glaSF ? `${p.glaApprox ? '~' : ''}${fmt(p.glaSF)} SF` : 'Contact leasing';
const glaShort = p => p.glaSF ? `${p.glaApprox ? '~' : ''}${Math.round(p.glaSF / 1000)}K` : '—';
const shortDate = iso => new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

function findAsset(relNoExt, exts = ['.webp', '.jpg', '.jpeg', '.png']) {
  for (const ext of exts) if (fs.existsSync(path.join(SRC, relNoExt + ext))) return '/' + relNoExt + ext;
  return null;
}

const ICON = {
  storefront: '<svg viewBox="0 0 120 84" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M4 80h112"/><path d="M12 80V38h96v42"/><path d="M8 38 16 20h88l8 18z"/><path d="M28 20l-4 18M44 20l-2 18M60 20v18M76 20l2 18M92 20l4 18"/><path d="M8 38c0 5 3 8 8 8s8-3 8-8c0 5 3 8 8 8s8-3 8-8c0 5 3 8 8 8s8-3 8-8c0 5 3 8 8 8s8-3 8-8c0 5 3 8 8 8s8-3 8-8c0 5 3 8 8 8s8-3 8-8"/><path d="M34 6h52v14H34z"/><path d="M22 54h24v26H22zM54 54h16v26H54zM78 54h22v16H78z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.6c0-1.3 0-3-1.9-3s-2.2 1.5-2.2 2.9V21H9z"/></svg>',
  pause: '<svg class="i-pause" viewBox="0 0 14 14" aria-hidden="true"><rect x="2" y="1" width="3.5" height="12" fill="currentColor"/><rect x="8.5" y="1" width="3.5" height="12" fill="currentColor"/></svg>',
  play: '<svg class="i-play" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1.5v11l9-5.5z" fill="currentColor"/></svg>',
};

/** Stock photo for a slot, if listed in data/photos.js and downloaded to the cache. */
const usedStock = new Map();
function stockFor(relNoExt) {
  const key = relNoExt.replace(/^img\//, '');
  const s = photos[key];
  return s && fs.existsSync(path.join(CACHE, key + '.jpg')) ? s : null;
}
/** Public path of a slot's image: real photo first, then stock, else null. */
function imagePath(relNoExt) {
  return findAsset(relNoExt) || (stockFor(relNoExt) ? '/' + relNoExt + '.jpg' : null);
}

/** Photo slot: real photo from src/img, else a licensed stock photo, else a branded placeholder. */
function media(relNoExt, { alt, size, eager = false, prop = null }) {
  const loading = eager ? 'fetchpriority="high"' : 'loading="lazy"';
  const found = findAsset(relNoExt);
  if (found) {
    return `<div class="media"><img src="${found}" alt="${esc(alt)}" ${loading} decoding="async"></div>`;
  }
  const stock = stockFor(relNoExt);
  if (stock) {
    usedStock.set(relNoExt.replace(/^img\//, ''), stock);
    return `<div class="media is-stock"><img src="/${relNoExt}.jpg" alt="${esc(stock.alt)}" ${loading} decoding="async"><span class="stock-tag" aria-hidden="true">Representative photo</span><span class="slot-label">Stock photo · replace with src/${esc(relNoExt)}.jpg · ${esc(size)}</span></div>`;
  }
  const tint = prop && prop.tint ? ` style="--ph-a:${prop.tint[0]};--ph-b:${prop.tint[1]}"` : '';
  return `<div class="media ph"${tint} role="img" aria-label="${esc(alt)}"><span class="ph-mark">${ICON.storefront}</span><span class="slot-label">Photo slot · src/${esc(relNoExt)}.jpg · ${esc(size)}</span></div>`;
}

/* ------------------------------------------------------------------ */
/* Fonts — self-hosted from @fontsource-variable (OFL); Google Fonts fallback */
/* ------------------------------------------------------------------ */
const FONT_FILES = [
  ['@fontsource-variable/geist/files/geist-latin-wght-normal.woff2', 'geist-latin-wght-normal.woff2', 'Geist', 'normal', '100 900'],
  ['@fontsource-variable/playfair-display/files/playfair-display-latin-wght-normal.woff2', 'playfair-display-latin-wght-normal.woff2', 'Playfair Display', 'normal', '400 900'],
  ['@fontsource-variable/playfair-display/files/playfair-display-latin-wght-italic.woff2', 'playfair-display-latin-wght-italic.woff2', 'Playfair Display', 'italic', '400 900'],
];
let selfHostedFonts = true;
const fontFace = [];

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */
const NAV = [
  { key: 'properties', label: 'Properties', href: '/#centers', sub: true },
  { key: 'leasing', label: 'Leasing', href: '/leasing.html' },
  { key: 'directory', label: 'Directory', href: '/directory.html' },
  { key: 'news', label: 'News', href: '/news.html' },
  { key: 'about', label: 'About', href: '/about.html' },
  { key: 'contact', label: 'Contact', href: '/contact.html' },
];

function wordmark() {
  const logo = findAsset('img/brand/logo', ['.svg', '.png']);
  if (logo) return `<a class="wordmark" href="/" aria-label="${esc(B.name)} home"><img src="${logo}" alt="${esc(B.name)}"></a>`;
  return `<a class="wordmark" href="/" aria-label="${esc(B.name)} home"><span class="wm-main">${esc(B.wordmarkMain)}</span><span class="wm-rule" aria-hidden="true"></span><span class="wm-sub">${B.wordmarkSub.map(esc).join('<br>')}</span></a>`;
}

function header(active) {
  const items = NAV.map(n => {
    const cur = n.key === active ? ' aria-current="page"' : '';
    if (!n.sub) return `<li><a href="${n.href}"${cur}>${n.label}</a></li>`;
    const subs = properties.map(p => `<li><a href="${pageOf(p)}"><span class="sn-name">${esc(p.name)}</span><span class="sn-loc">${esc(loc(p))} · ${esc(p.type)}</span></a></li>`).join('');
    return `<li class="has-sub"><a href="${n.href}"${cur}>${n.label}</a><ul class="subnav">${subs}<li><a class="sn-all" href="/#centers">All properties</a></li></ul></li>`;
  }).join('');
  return `<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap header-inner">
    ${wordmark()}
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav"><span class="nav-toggle-bars" aria-hidden="true"></span>Menu</button>
    <nav class="site-nav" id="site-nav" aria-label="Main">
      <ul class="nav-list">${items}</ul>
      <a class="btn btn-gold btn-sm" href="/leasing.html#inquire">Lease with us</a>
    </nav>
  </div>
</header>`;
}

function subscribeBand() {
  const checks = properties.map(p => `<label class="check"><input type="checkbox" name="alerts-${p.id}" value="yes"> ${esc(p.name)}</label>`).join('');
  return `<section class="subscribe section-tight" aria-labelledby="sub-h">
  <div class="wrap subscribe-grid">
    <div>
      <p class="kicker">Stay in the know</p>
      <h2 id="sub-h" class="display-md">Leasing opportunities and center news, by email.</h2>
      <p>Be the first to hear about new space, openings, and events at our centers.</p>
    </div>
    <form name="stay-in-the-know" method="POST" data-netlify="true" netlify-honeypot="bot-field" data-ajax data-success="You’re on the list. Thanks for subscribing." data-fallback="${esc(C.leasing.email)}">
      <input type="hidden" name="form-name" value="stay-in-the-know">
      <p class="hp"><label>Leave this empty <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
      <label class="visually-hidden" for="sub-email">Email address</label>
      <div class="sub-row">
        <input id="sub-email" type="email" name="email" placeholder="Email address" autocomplete="email" required>
        <button class="btn btn-gold" type="submit">Subscribe</button>
      </div>
      <fieldset class="sub-opts">
        <legend>Leasing alerts for</legend>
        <div class="sub-opts-grid">${checks}</div>
      </fieldset>
      <label class="check" style="margin-top:14px"><input type="checkbox" name="center-news" value="yes" checked> Also send center and company news</label>
      <div class="form-status" role="status" aria-live="polite" tabindex="-1"></div>
      <p class="fine">We use your email only to send SMC Commercial updates. See our <a href="${esc(B.privacyUrl)}" rel="noopener">Privacy Policy</a>.</p>
    </form>
  </div>
</section>`;
}

function footer() {
  const propLinks = properties.map(p => `<li><a href="${pageOf(p)}">${esc(p.name)}</a></li>`).join('');
  return `<footer class="site-footer">
  <div class="wrap footer-top">
    <div>
      ${wordmark()}
      <p class="footer-blurb">Neighborhood shopping centers in California and Nevada, owned and managed by ${esc(B.legalName)} — in real estate since ${B.foundedYear}.</p>
      <div class="social"><a href="${esc(B.linkedinUrl)}" rel="noopener" target="_blank" aria-label="LinkedIn">${ICON.linkedin}</a></div>
    </div>
    <div>
      <h2>Properties</h2>
      <ul class="footer-links">${propLinks}<li><a href="/leasing.html#availability">Available space</a></li></ul>
    </div>
    <div>
      <h2>Explore</h2>
      <ul class="footer-links">
        <li><a href="/leasing.html">Leasing</a></li>
        <li><a href="/directory.html">Directory</a></li>
        <li><a href="/news.html">News</a></li>
        <li><a href="/about.html">About</a></li>
        <li><a href="/contact.html">Contact</a></li>
      </ul>
    </div>
    <div class="footer-contact">
      <h2>Contact</h2>
      <p><a href="${tel(C.mainOffice.phone)}">${esc(C.mainOffice.phone)}</a>${C.mainOffice.verify ? verify(C.mainOffice.note) : ''}</p>
      <p><a href="mailto:${esc(C.leasing.email)}">${esc(C.leasing.email)}</a></p>
      <p>${C.corporate.address.map(esc).join('<br>')}</p>
      <p><a href="${esc(B.corporateUrl)}" rel="noopener" target="_blank">standardmanagement.com ↗</a></p>
    </div>
  </div>
  <div class="wrap footer-bottom">
    <span>© <span data-year>${new Date().getFullYear()}</span> ${esc(B.legalName)}. All rights reserved.</span>
    <ul>
      <li><a href="${esc(B.privacyUrl)}" rel="noopener">Privacy Policy</a></li>
      <li><a href="/contact.html#accessibility">Accessibility</a></li>
      ${usedStock.size ? '<li><a href="/photo-credits.html">Photo credits</a></li>' : ''}
      <li><a href="/sitemap.xml">Sitemap</a></li>
    </ul>
  </div>
</footer>`;
}

function previewBadge() {
  return `<aside class="preview-badge" aria-label="Preview notes"><strong>Preview build.</strong> Photo slots and <span class="verify" style="display:inline-block;margin:0">Verify</span> flags only show on preview links, never on the live site.<br><button type="button">Hide</button></aside>`;
}

function layout({ title, description, active, body, subscribe = true, jsonld = null, ogImage = null }) {
  const fullTitle = title ? `${title} | ${B.name} Properties` : `${B.name} Properties | McHenry Village, Northgate Plaza & Lakeside Shopping Center`;
  const og = ogImage || imagePath('img/og') || imagePath(`img/${properties[0].slug}/hero`);
  const fontsHead = selfHostedFonts
    ? FONT_FILES.filter(f => f[3] === 'normal').map(f => `<link rel="preload" href="/assets/fonts/${f[1]}" as="font" type="font/woff2" crossorigin>`).join('\n')
    : `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@300..700&family=Playfair+Display:ital,wght@0,400..700;1,400..700&display=swap">`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#051D35">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(B.name)} Properties">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description)}">
${og ? `<meta property="og:image" content="${esc(site.siteUrl + og)}">` : ''}
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
${fontsHead}
<link rel="stylesheet" href="/assets/css/site.css?v=${BUILD_ID}">
<script>(function(){var h=location.hostname;if(h==='localhost'||h==='127.0.0.1'||h.indexOf('--')>-1||location.protocol==='file:'){document.documentElement.classList.add('is-preview')}})();</script>
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ''}
</head>
<body>
${header(active)}
<main id="main">
${body}
</main>
${subscribe ? subscribeBand() : ''}
${footer()}
${previewBadge()}
<script src="/assets/js/site.js?v=${BUILD_ID}" defer></script>
</body>
</html>
`;
}

/* ------------------------------------------------------------------ */
/* Shared components                                                   */
/* ------------------------------------------------------------------ */
function propertyCard(p, { compact = false } = {}) {
  const count = tenantsAt(p.id).length;
  return `<article class="pcard">
  <a class="pcard-media" href="${pageOf(p)}" tabindex="-1" aria-hidden="true">${media(`img/${p.slug}/hero`, { alt: `${p.name} in ${loc(p)}`, size: '2400×1350', prop: p })}</a>
  <div class="pcard-body">
    <p class="pcard-loc">${esc(loc(p))} · ${esc(p.type)}</p>
    <h3><a href="${pageOf(p)}">${esc(p.name)}</a></h3>
    <p class="pcard-line">${esc(p.cardLine)}</p>
    ${compact ? '' : `<ul class="pcard-meta"><li><b>${glaShort(p)}</b> SF</li><li><b>${count}</b> tenants</li><li>${esc(p.anchors[0])}</li></ul>`}
    <a class="arrow-link" href="${pageOf(p)}">View property</a>
  </div>
</article>`;
}

function newsCard(n, { showProp = true } = {}) {
  const p = n.property === 'all' ? null : byId(n.property);
  const propLine = showProp ? `<p class="news-prop">${p ? `<a href="${pageOf(p)}">${esc(p.name)}</a>` : 'All centers'}</p>` : '';
  const dataProp = n.property === 'all' ? properties.map(x => x.id).join(' ') : n.property;
  return `<article class="news-card" data-filter-item data-prop="${dataProp}" data-name="${esc((n.title + ' ' + n.tag).toLowerCase())}">
  <p class="news-meta"><span>${esc(n.tag)}</span><time datetime="${n.date}">${shortDate(n.date)}</time></p>
  <h3>${esc(n.title)}</h3>
  <p>${esc(n.body)}</p>
  ${propLine}
</article>`;
}

function availabilityRows(list, { withProp = false } = {}) {
  return list.map(({ a, p }) => `<tr data-filter-item data-prop="${p.id}">
  ${withProp ? `<td class="prop-cell" data-label="Property"><a href="${pageOf(p)}#availability">${esc(p.name)}</a><br><span class="muted">${esc(loc(p))}</span></td>` : ''}
  <td data-label="Suite"><span>${esc(a.suite)}${a.placeholder ? verify('Placeholder row — leasing to confirm suite, size and use') : ''}</span></td>
  <td data-label="Size">${a.sf ? `${fmt(a.sf)} SF` : '<span class="muted">Contact leasing</span>'}</td>
  <td data-label="Use">${esc(a.use)}</td>
  <td data-label="Availability"><span class="status">${esc(a.available || 'Now')}</span></td>
</tr>`).join('\n');
}

function availabilityTable(list, { withProp = false } = {}) {
  const cols = withProp ? 5 : 4;
  const rows = availabilityRows(list, { withProp });
  return `<div class="table-wrap"><table class="data">
  <caption class="visually-hidden">Available space</caption>
  <thead><tr>${withProp ? '<th scope="col">Property</th>' : ''}<th scope="col">Suite</th><th scope="col">Size</th><th scope="col">Use</th><th scope="col">Availability</th></tr></thead>
  <tbody>
${rows}
  <tr class="empty-row" data-filter-empty ${list.length ? 'hidden' : ''}><td colspan="${cols}">No listed availability right now. Contact leasing about upcoming opportunities.</td></tr>
  </tbody>
</table></div>`;
}

function tenantTile(t, { withProp = false } = {}) {
  const p = byId(t.p);
  const meta = withProp ? `<a href="${pageOf(p)}#directory">${esc(p.name)}</a> · Suite ${esc(t.s)}` : `Suite ${esc(t.s)}`;
  return `<li class="tenant" data-filter-item data-prop="${t.p}" data-cat="${esc(t.cat)}" data-name="${esc((t.n + ' ' + t.cat + (withProp ? ' ' + p.name : '')).toLowerCase())}">
  <span class="tenant-cat">${esc(t.cat)}</span>
  <span class="tenant-name">${esc(t.n)}${t.verify ? verify('Confirm this tenant is still open — the chain closed many or all locations') : ''}</span>
  <span class="tenant-meta">${meta}</span>
</li>`;
}

function categoryOptions(list) {
  const cats = [...new Set(list.map(t => t.cat))].sort();
  return `<option value="all">All categories</option>` + cats.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
}

function propertyOptions(anyLabel) {
  return `<option value="">${esc(anyLabel)}</option>` + properties.map(p => `<option value="${esc(p.name)}" data-slug="${p.slug}">${esc(p.name)} — ${esc(loc(p))}</option>`).join('');
}

function cardsSection({ id = 'centers', kicker = 'Our properties', title, lede, list = properties, cls = '', cta = '' }) {
  return `<section class="section ${cls}" id="${id}" aria-labelledby="${id}-h">
  <div class="wrap">
    <div class="sec-head">
      <div><p class="kicker">${esc(kicker)}</p><h2 id="${id}-h" class="display-lg">${title}</h2>${lede ? `<p class="lede">${lede}</p>` : ''}</div>
      ${cta}
    </div>
    <div class="card-grid${list.length === 2 ? ' two' : ''}">${list.map(p => propertyCard(p)).join('')}</div>
  </div>
</section>`;
}

function ctaBand(title, text, href, label) {
  return `<section class="cta-band"><div class="wrap"><div><h2>${title}</h2>${text ? `<p>${text}</p>` : ''}</div><a class="btn btn-navy" href="${href}">${esc(label)}</a></div></section>`;
}

/* ------------------------------------------------------------------ */
/* Pages                                                               */
/* ------------------------------------------------------------------ */
const pages = [];

/* Home ------------------------------------------------------------- */
pages.push({
  file: 'index.html',
  title: '',
  active: 'home',
  description: `Neighborhood shopping centers in Modesto, Carson City, and Burbank — McHenry Village, Northgate Plaza, and Lakeside Shopping Center. Leasing, directory, and visitor information.`,
  body: (() => {
    const slides = properties.map((p, i) => `<figure class="hero-slide${i === 0 ? ' is-active' : ''}" aria-hidden="${i === 0 ? 'false' : 'true'}">${media(`img/${p.slug}/hero`, { alt: `${p.name}, ${loc(p)}`, size: '2400×1350', eager: i === 0, prop: p })}</figure>`).join('');
    const tabs = properties.map((p, i) => `<button class="hero-tab${i === 0 ? ' is-active' : ''}" type="button" role="tab" aria-selected="${i === 0}" data-href="${pageOf(p)}" data-name="${esc(p.name)}"><span class="ht-progress" aria-hidden="true"></span><span class="ht-loc">${esc(loc(p))}</span><span class="ht-name">${esc(p.name)}</span></button>`).join('');
    const stats = [
      [String(properties.length), 'Neighborhood centers'],
      [`${anyApprox ? '~' : ''}${Math.round(totalGLA / 1000)}K`, 'Square feet of retail'],
      [String(tenants.length), 'Merchants & services'],
      [String(B.foundedYear), 'Managing real estate since'],
    ];
    const anchors = [...new Set(properties.flatMap(p => p.anchors))];
    return `
<section class="hero hero-home" data-carousel data-interval="7000" aria-roledescription="carousel" aria-label="Featured properties">
  <div class="hero-slides">${slides}</div>
  <div class="hero-shade" aria-hidden="true"></div>
  <div class="wrap hero-content">
    <p class="kicker kicker-light">${esc(B.name)} Properties</p>
    <h1 class="display-xl">Neighborhood retail, <em>managed to a higher standard.</em></h1>
    <p class="hero-lede">Neighborhood shopping centers in Modesto, Carson City, and Burbank — owned and operated by a team that has been managing real estate since ${B.foundedYear}.</p>
    <div class="btn-row">
      <a class="btn btn-gold" href="#centers">Explore our centers</a>
      <a class="btn btn-ghost" href="/leasing.html#availability">Find available space</a>
    </div>
  </div>
  <div class="hero-bar">
    <div class="wrap">
      <div role="tablist" aria-label="Choose a property" style="display:contents">${tabs}</div>
      <div class="hero-tools">
        <a class="arrow-link arrow-light hero-view" href="${pageOf(properties[0])}">View ${esc(properties[0].name)}</a>
        <button class="hero-pause" type="button" aria-label="Pause slideshow">${ICON.pause}${ICON.play}</button>
      </div>
    </div>
  </div>
</section>

${cardsSection({
  title: 'Explore our neighborhood centers.',
  lede: 'Three everyday destinations, each built around the errands, meals, and services people come back for every week.',
  cta: '<a class="btn btn-line" href="/leasing.html#availability">View available space</a>',
})}

<section class="section bg-cream" aria-labelledby="lease-h">
  <div class="wrap split">
    <div class="split-media">${media('img/home/leasing', { alt: 'Storefronts at an SMC shopping center', size: '1600×1280' })}</div>
    <div>
      <p class="kicker">Leasing</p>
      <h2 id="lease-h" class="display-lg">Space to grow, where customers <em>already shop.</em></h2>
      <p class="lede">Our centers are built on weekly trips: groceries, prescriptions, banking, a quick meal. That steady traffic is what helps the shops and restaurants beside them thrive.</p>
      <ul class="checks">
        <li>Anchored by ${anchors.map(esc).join(', ').replace(/, ([^,]*)$/, ', and $1')}</li>
        <li>Daily-needs mix of pharmacy, banking, dining, and services</li>
        <li>Owner-operated management that answers quickly and plans for the long term</li>
      </ul>
      <div class="btn-row">
        <a class="btn btn-navy" href="/leasing.html#availability">See available space</a>
        <a class="btn btn-line" href="/leasing.html#inquire">Talk to leasing</a>
      </div>
    </div>
  </div>
</section>

<section class="section bg-navy" aria-labelledby="about-h">
  <div class="wrap about-band">
    <div>
      <p class="kicker">About SMC</p>
      <h2 id="about-h" class="display-lg">Six decades of <em>hands-on</em> management.</h2>
      <p class="lede">${esc(B.legalName)} was founded in ${B.foundedYear}. Today, as ${esc(B.parentName)}, we bring the same long-term, owner’s perspective to every center we run — responsive service, careful upkeep, and real relationships with the merchants who call our centers home.</p>
      <p style="margin-top:28px"><a class="arrow-link" href="/about.html">Our story</a></p>
    </div>
    <div class="stat-grid">${stats.map(([v, l], i) => `<div class="stat"><span class="stat-val">${esc(v)}</span><span class="stat-lbl">${esc(l)}</span>${i === 1 && anyApprox ? verify('Sum of approximate GLA figures carried over from V8') : ''}</div>`).join('')}</div>
  </div>
</section>

<section class="section" aria-labelledby="news-h">
  <div class="wrap">
    <div class="sec-head">
      <div><p class="kicker">News</p><h2 id="news-h" class="display-lg">The latest from our centers.</h2></div>
      <a class="btn btn-line" href="/news.html">View all news</a>
    </div>
    <div class="news-grid">${news.slice(0, 3).map(n => newsCard(n)).join('')}</div>
  </div>
</section>`;
  })(),
});

/* Property pages ---------------------------------------------------- */
properties.forEach(p => {
  const list = tenantsAt(p.id);
  const others = properties.filter(x => x.id !== p.id);
  const pNews = news.filter(n => n.property === p.id || n.property === 'all').slice(0, 3);
  const brochure = findAsset(`docs/${p.slug}-brochure`, ['.pdf']);
  const dayMap = { 'Monday – Saturday': 'Mo-Sa', 'Monday – Friday': 'Mo-Fr', 'Saturday': 'Sa', 'Sunday': 'Su', 'Daily': 'Mo-Su' };
  const to24 = t => { const m = t.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i); if (!m) return null; let h = +m[1] % 12; if (/pm/i.test(m[3])) h += 12; return `${String(h).padStart(2, '0')}:${m[2]}`; };
  const openingHours = p.hours.map(([d, t]) => { const [a, b] = t.split('–').map(to24); return dayMap[d] && a && b ? `${dayMap[d]} ${a}-${b}` : null; }).filter(Boolean);
  const jsonld = {
    '@context': 'https://schema.org', '@type': 'ShoppingCenter', name: p.name,
    url: site.siteUrl + pageOf(p), description: p.description[0],
    address: { '@type': 'PostalAddress', streetAddress: p.address[0], addressLocality: p.city, addressRegion: p.state, postalCode: p.postalCode, addressCountry: 'US' },
    openingHours,
  };

  pages.push({
    file: `${p.slug}.html`,
    title: `${p.name} — ${loc(p)}`,
    active: 'properties',
    description: `${p.name} is a ${p.type.toLowerCase()} in ${loc(p)} anchored by ${p.anchors.join(' and ')}. Available space, tenant directory, hours, and directions.`,
    jsonld,
    ogImage: imagePath(`img/${p.slug}/hero`),
    body: `
<section class="hero prop-hero" aria-labelledby="prop-h">
  ${media(`img/${p.slug}/hero`, { alt: `${p.name}, ${loc(p)}`, size: '2400×1350', eager: true, prop: p })}
  <div class="hero-shade" aria-hidden="true"></div>
  <div class="wrap">
    <ol class="crumbs"><li><a href="/">Home</a></li><li><a href="/#centers">Properties</a></li><li aria-current="page">${esc(p.name)}</li></ol>
    <p class="kicker kicker-light">${esc(p.type)} · ${esc(loc(p))}</p>
    <h1 id="prop-h">${esc(p.name)}</h1>
    <p class="tagline">${esc(p.tagline)}</p>
    <div class="btn-row">
      <a class="btn btn-gold" href="#availability">Available space</a>
      <a class="btn btn-ghost" href="#directory">Directory</a>
      <a class="btn btn-ghost" href="${mapsUrl(p)}" target="_blank" rel="noopener">Get directions</a>
    </div>
  </div>
</section>

<div class="facts">
  <div class="wrap">
    <dl class="facts-grid">
      <div class="fact"><dt>Gross leasable area</dt><dd>${glaText(p)}${p.glaVerify ? verify('Approximate GLA carried over from V8') : ''}</dd></div>
      <div class="fact"><dt>Tenants</dt><dd>${list.length}</dd></div>
      <div class="fact"><dt>Anchored by</dt><dd><small>${p.anchors.map(esc).join('<br>')}</small></dd></div>
      <div class="fact"><dt>Location</dt><dd><small>${p.address.map(esc).join('<br>')}${p.addressVerify ? verify('Confirm the published address') : ''}</small></dd></div>
    </dl>
  </div>
</div>

<section class="section" aria-labelledby="ov-h">
  <div class="wrap overview">
    <div>
      <p class="kicker">Overview</p>
      <h2 id="ov-h" class="display-md">${esc(p.cardLine)}</h2>
      ${p.description.map(d => `<p class="lede">${esc(d)}</p>`).join('')}
      <ul class="checks">${p.highlights.map(h => `<li>${esc(h)}</li>`).join('')}</ul>
      <div class="btn-row">
        <a class="btn btn-navy" href="/leasing.html?property=${p.slug}#inquire">Leasing inquiry</a>
        <a class="btn btn-line" href="#visit">Hours &amp; location</a>
      </div>
    </div>
    <div class="overview-media">${media(`img/${p.slug}/feature`, { alt: `Storefronts at ${p.name}`, size: '1600×1200', prop: p })}</div>
  </div>
</section>

<section class="section bg-cream" id="availability" aria-labelledby="av-h">
  <div class="wrap">
    <div class="sec-head">
      <div><p class="kicker">Leasing</p><h2 id="av-h" class="display-lg">Available space</h2><p class="lede">Current openings at ${esc(p.name)}. Our leasing team can share site plans, demographics, and terms.</p></div>
      ${brochure ? `<a class="btn btn-line" href="${brochure}" download>Download brochure (PDF)</a>` : ''}
    </div>
    ${availabilityTable((p.availability || []).map(a => ({ a, p })))}
    <div class="leasing-aside">
      <div class="siteplan">${media(`img/${p.slug}/site-plan`, { alt: `${p.name} site plan`, size: '1600×1200', prop: p })}</div>
      <div class="contact-card">
        <p class="kicker">Leasing contact</p>
        <h3>Lease at ${esc(p.name)}</h3>
        <p>Tell us about your concept and space needs, and we’ll follow up within one business day.</p>
        <p><a href="mailto:${esc(C.leasing.email)}?subject=${encodeURIComponent('Leasing inquiry — ' + p.name)}">${esc(C.leasing.email)}</a><br><a href="${tel(C.mainOffice.phone)}">${esc(C.mainOffice.phone)}</a>${C.mainOffice.verify ? verify(C.mainOffice.note) : ''}</p>
        <a class="btn btn-gold" href="/leasing.html?property=${p.slug}#inquire">Start an inquiry</a>
      </div>
    </div>
  </div>
</section>

<section class="section" id="directory" aria-labelledby="dir-h">
  <div class="wrap" data-filter-group="dir-${p.id}">
    <div class="sec-head">
      <div><p class="kicker">Directory</p><h2 id="dir-h" class="display-lg">Shops, dining &amp; services</h2></div>
    </div>
    <div class="filters">
      <div class="field-inline">
        <label class="visually-hidden" for="q-${p.id}">Search tenants</label>
        <input class="input search" id="q-${p.id}" type="search" placeholder="Search ${esc(p.name)}" data-filter-search>
        <label class="visually-hidden" for="c-${p.id}">Category</label>
        <select class="select" id="c-${p.id}" data-filter-cat>${categoryOptions(list)}</select>
      </div>
    </div>
    <p class="result-count" data-filter-count aria-live="polite">Showing ${list.length} of ${list.length}</p>
    <ul class="tenant-grid">${list.map(t => tenantTile(t)).join('')}</ul>
    <p class="no-results" data-filter-empty hidden>No matches. Try a different search or category.</p>
  </div>
</section>

<section class="section bg-cream" id="visit" aria-labelledby="visit-h">
  <div class="wrap">
    <div class="sec-head"><div><p class="kicker">Plan your visit</p><h2 id="visit-h" class="display-lg">Hours &amp; location</h2></div></div>
    <div class="visit-grid">
      <div class="visit-card">
        <h3>Center hours</h3>
        <table class="hours"><tbody>${p.hours.map(([d, t]) => `<tr><th scope="row">${esc(d)}</th><td>${esc(t)}</td></tr>`).join('')}</tbody></table>
        <p class="note">Individual store and restaurant hours may vary.</p>
      </div>
      <div class="visit-card">
        <h3>Location</h3>
        <p>${p.address.map(esc).join('<br>')}</p>
        <a class="btn btn-navy btn-sm" href="${mapsUrl(p)}" target="_blank" rel="noopener">Get directions</a>
      </div>
      <div class="visit-card">
        <h3>Property management</h3>
        <p><a href="mailto:${esc(C.buildingServices.email)}">${esc(C.buildingServices.email)}</a><br>
        Office: <a href="${tel(C.mainOffice.phone)}">${esc(C.mainOffice.phone)}</a>${C.mainOffice.verify ? verify(C.mainOffice.note) : ''}<br>
        After hours: <a href="${tel(C.afterHours.phone)}">${esc(C.afterHours.phone)}</a>${C.afterHours.verify ? verify(C.afterHours.note) : ''}</p>
        <p class="note">For emergencies, call 911.</p>
      </div>
    </div>
  </div>
</section>

${pNews.length ? `<section class="section" aria-labelledby="pn-h">
  <div class="wrap">
    <div class="sec-head"><div><p class="kicker">News</p><h2 id="pn-h" class="display-lg">What’s happening</h2></div><a class="btn btn-line" href="/news.html?property=${p.slug}">All news</a></div>
    <div class="news-grid">${pNews.map(n => newsCard(n, { showProp: false })).join('')}</div>
  </div>
</section>` : ''}

${cardsSection({ id: 'more', kicker: 'More centers', title: 'Explore our other properties.', list: others, cls: 'bg-cream' })}

${ctaBand(`Interested in space at ${esc(p.name)}?`, 'Share your concept and we’ll be in touch within one business day.', `/leasing.html?property=${p.slug}#inquire`, 'Start a leasing inquiry')}`,
  });
});

/* Leasing ------------------------------------------------------------ */
pages.push({
  file: 'leasing.html',
  title: 'Leasing',
  active: 'leasing',
  description: 'Lease retail, restaurant, or service space at McHenry Village (Modesto), Northgate Plaza (Carson City), or Lakeside Shopping Center (Burbank). View availability and start an inquiry.',
  body: (() => {
    const all = [];
    properties.forEach(p => (p.availability || []).forEach(a => all.push({ a, p })));
    const values = [
      ['Anchor-driven traffic', `Our centers are anchored by ${[...new Set(properties.flatMap(p => p.anchors))].join(', ').replace(/, ([^,]*)$/, ', and $1')} — destinations that bring customers back week after week.`],
      ['A daily-needs mix', 'Pharmacies, banks, quick-service dining, and personal services keep our centers busy across the whole day.'],
      ['Owner-operated', 'You work directly with the people who own and manage the property. Decisions are quick and conversations stay straightforward.'],
      ['Space that fits', 'From inline shops to larger-format space, we’ll work with you to find the right size, layout, and terms for your concept.'],
    ];
    return `
<section class="page-hero">
  <div class="wrap">
    <ol class="crumbs"><li><a href="/">Home</a></li><li aria-current="page">Leasing</li></ol>
    <p class="kicker kicker-light">Leasing</p>
    <h1 class="display-xl">The right space, in centers built for <em>everyday trips.</em></h1>
    <p class="lede">Neighborhood shopping centers in Modesto, Carson City, and Burbank, with space for retail, restaurant, and service users.</p>
    <div class="btn-row" style="margin-top:32px">
      <a class="btn btn-gold" href="#availability">See available space</a>
      <a class="btn btn-ghost" href="#inquire">Start an inquiry</a>
    </div>
  </div>
</section>

<section class="section" aria-labelledby="why-h">
  <div class="wrap">
    <div class="sec-head"><div><p class="kicker">Why lease with SMC</p><h2 id="why-h" class="display-lg">Built for the businesses people visit every week.</h2></div></div>
    <div class="values">${values.map(([h, t], i) => `<div class="value"><span class="value-num">0${i + 1}</span><h3>${esc(h)}</h3><p>${esc(t)}</p></div>`).join('')}</div>
  </div>
</section>

<section class="section bg-cream" id="availability" aria-labelledby="avail-h">
  <div class="wrap" data-filter-group="availability">
    <div class="sec-head">
      <div><p class="kicker">Availability</p><h2 id="avail-h" class="display-lg">Available space</h2><p class="lede">Current openings across our centers. Our leasing team confirms sizes and can share site plans and terms.</p></div>
    </div>
    <div class="filters">
      <div class="tabs" role="group" aria-label="Filter by property">
        <button class="tab" type="button" data-filter-tab="all" aria-pressed="true">All centers</button>
        ${properties.map(p => `<button class="tab" type="button" data-filter-tab="${p.id}" data-slug="${p.slug}" aria-pressed="false">${esc(p.name)}</button>`).join('')}
      </div>
    </div>
    ${availabilityTable(all, { withProp: true })}
  </div>
</section>

${cardsSection({ kicker: 'Properties at a glance', title: 'Three centers, three markets.', lede: 'Visit each property page for its tenant mix, site plan, and hours.' })}

<section class="section bg-cream" id="inquire" aria-labelledby="inq-h">
  <div class="wrap contact-layout">
    <div>
      <p class="kicker">Leasing inquiry</p>
      <h2 class="display-lg">Tell us what you’re looking for.</h2>
      <p class="lede">Share a few details about your concept and we’ll follow up within one business day with options that fit.</p>
      <ul class="contact-list" style="margin-top:28px">
        <li><span class="cl-label">Email leasing</span><span class="cl-val"><a href="mailto:${esc(C.leasing.email)}">${esc(C.leasing.email)}</a></span></li>
        <li><span class="cl-label">Call our office</span><span class="cl-val"><a href="${tel(C.mainOffice.phone)}">${esc(C.mainOffice.phone)}</a>${C.mainOffice.verify ? verify(C.mainOffice.note) : ''}</span></li>
        <li><span class="cl-label">Helpful to include</span><span class="cl-sub">Your concept or brand, the size range you need, preferred center, and target opening date.</span></li>
      </ul>
    </div>
    <div class="form-panel">
      <h2 id="inq-h">Leasing inquiry</h2>
      <form name="leasing-inquiry" method="POST" data-netlify="true" netlify-honeypot="bot-field" data-ajax data-success="Thanks — your inquiry is in. Our leasing team will reply within one business day." data-fallback="${esc(C.leasing.email)}">
        <input type="hidden" name="form-name" value="leasing-inquiry">
        <input type="hidden" name="subject" value="Leasing inquiry from the SMC Commercial website">
        <p class="hp"><label>Leave this empty <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
        <div class="form-grid">
          <div class="field"><label for="li-name">Full name *</label><input class="input" id="li-name" name="name" autocomplete="name" required></div>
          <div class="field"><label for="li-co">Company or brand</label><input class="input" id="li-co" name="company" autocomplete="organization"></div>
          <div class="field"><label for="li-email">Email *</label><input class="input" id="li-email" type="email" name="email" autocomplete="email" required></div>
          <div class="field"><label for="li-phone">Phone</label><input class="input" id="li-phone" type="tel" name="phone" autocomplete="tel"></div>
          <div class="field"><label for="li-prop">Property of interest</label><select class="select" id="li-prop" name="property">${propertyOptions('Any / not sure')}</select></div>
          <div class="field"><label for="li-use">Type of use</label><select class="select" id="li-use" name="use"><option value="">Select…</option><option>Retail</option><option>Restaurant / food</option><option>Personal service</option><option>Medical / office</option><option>Other</option></select></div>
          <div class="field"><label for="li-size">Size needed</label><input class="input" id="li-size" name="size" placeholder="e.g., 1,200–2,000 SF"></div>
          <div class="field"><label for="li-when">Timing</label><select class="select" id="li-when" name="timing"><option value="">Select…</option><option>Within 3 months</option><option>3–6 months</option><option>6–12 months</option><option>Just exploring</option></select></div>
          <div class="field full"><label for="li-msg">Tell us about your concept</label><textarea class="input" id="li-msg" name="message" rows="5"></textarea></div>
        </div>
        <div class="form-foot">
          <button class="btn btn-navy" type="submit">Send inquiry</button>
          <p class="fine">We’ll use these details only to respond to your inquiry.</p>
        </div>
        <div class="form-status" role="status" aria-live="polite" tabindex="-1"></div>
      </form>
    </div>
  </div>
</section>`;
  })(),
});

/* Directory ------------------------------------------------------------ */
pages.push({
  file: 'directory.html',
  title: 'Directory',
  active: 'directory',
  description: 'Find stores, restaurants, and services at McHenry Village, Northgate Plaza, and Lakeside Shopping Center.',
  body: `
<section class="page-hero">
  <div class="wrap">
    <ol class="crumbs"><li><a href="/">Home</a></li><li aria-current="page">Directory</li></ol>
    <p class="kicker kicker-light">Directory</p>
    <h1 class="display-xl">Find a store, restaurant, <em>or service.</em></h1>
    <p class="lede">Browse ${tenants.length} merchants across our three centers.</p>
  </div>
</section>
<section class="section">
  <div class="wrap" data-filter-group="directory">
    <div class="filters">
      <div class="tabs" role="group" aria-label="Filter by property">
        <button class="tab" type="button" data-filter-tab="all" aria-pressed="true">All centers</button>
        ${properties.map(p => `<button class="tab" type="button" data-filter-tab="${p.id}" data-slug="${p.slug}" aria-pressed="false">${esc(p.name)}</button>`).join('')}
      </div>
      <div class="field-inline">
        <label class="visually-hidden" for="dq">Search the directory</label>
        <input class="input search" id="dq" type="search" placeholder="Search by name or category" data-filter-search>
        <label class="visually-hidden" for="dc">Category</label>
        <select class="select" id="dc" data-filter-cat>${categoryOptions(tenants)}</select>
      </div>
    </div>
    <p class="result-count" data-filter-count aria-live="polite">Showing ${tenants.length} of ${tenants.length}</p>
    <ul class="tenant-grid">${tenants.map(t => tenantTile(t, { withProp: true })).join('')}</ul>
    <p class="no-results" data-filter-empty hidden>No matches. Try a different search, center, or category.</p>
  </div>
</section>`,
});

/* News ------------------------------------------------------------------- */
pages.push({
  file: 'news.html',
  title: 'News',
  active: 'news',
  description: 'News, events, and announcements from McHenry Village, Northgate Plaza, and Lakeside Shopping Center.',
  body: `
<section class="page-hero">
  <div class="wrap">
    <ol class="crumbs"><li><a href="/">Home</a></li><li aria-current="page">News</li></ol>
    <p class="kicker kicker-light">News</p>
    <h1 class="display-xl">What’s happening at <em>our centers.</em></h1>
    <p class="lede">Leasing announcements, community events, and operating updates for tenants and shoppers.</p>
  </div>
</section>
<section class="section bg-cream">
  <div class="wrap" data-filter-group="news">
    <div class="filters">
      <div class="tabs" role="group" aria-label="Filter by property">
        <button class="tab" type="button" data-filter-tab="all" aria-pressed="true">All centers</button>
        ${properties.map(p => `<button class="tab" type="button" data-filter-tab="${p.id}" data-slug="${p.slug}" aria-pressed="false">${esc(p.name)}</button>`).join('')}
      </div>
    </div>
    <div class="news-grid">${news.map(n => newsCard(n)).join('')}</div>
    <p class="no-results" data-filter-empty hidden>No news for this center yet.</p>
  </div>
</section>`,
});

/* About -------------------------------------------------------------------- */
pages.push({
  file: 'about.html',
  title: 'About',
  active: 'about',
  description: `${B.legalName} has managed real estate since ${B.foundedYear}. Learn how we own and operate our neighborhood shopping centers.`,
  body: (() => {
    const values = [
      ['An owner’s perspective', 'We own and manage our centers, so every decision is made with the long term in mind.'],
      ['Responsive service', 'Tenants reach a real person, and service requests get handled quickly.'],
      ['Merchant partnerships', 'We get to know the businesses in our centers and work with them to grow.'],
      ['Community roots', 'Farmers markets, seasonal events, and well-kept grounds make our centers places people want to be.'],
    ];
    return `
<section class="page-hero">
  <div class="wrap">
    <ol class="crumbs"><li><a href="/">Home</a></li><li aria-current="page">About</li></ol>
    <p class="kicker kicker-light">About SMC</p>
    <h1 class="display-xl">Managing real estate <em>since ${B.foundedYear}.</em></h1>
    <p class="lede">The commercial properties of ${esc(B.legalName)}, today ${esc(B.parentName)}.</p>
  </div>
</section>
<section class="section" aria-labelledby="story-h">
  <div class="wrap split">
    <div class="split-media">${media('img/about/story', { alt: 'An SMC shopping center', size: '1600×1280' })}</div>
    <div class="prose">
      <p class="kicker">Our story</p>
      <h2 id="story-h" class="display-lg">A long view of real estate.</h2>
      <p>${esc(B.legalName)} was founded in ${B.foundedYear} on a simple idea: investors can accomplish more by pooling their capital. More than six decades later, the firm — now ${esc(B.parentName)} — still takes the same disciplined, long-term approach.</p>
      <p>Our commercial portfolio is made up of three neighborhood shopping centers: McHenry Village in Modesto, Northgate Plaza in Carson City, and Lakeside Shopping Center in Burbank. Each one serves its community with the essentials people need every week.</p>
      <p><a class="arrow-link" href="${esc(B.corporateUrl)}" target="_blank" rel="noopener">Visit standardmanagement.com</a></p>
    </div>
  </div>
</section>
<section class="section bg-cream" aria-labelledby="how-h">
  <div class="wrap">
    <div class="sec-head"><div><p class="kicker">How we manage</p><h2 id="how-h" class="display-lg">What tenants and shoppers can count on.</h2></div></div>
    <div class="values">${values.map(([h, t], i) => `<div class="value"><span class="value-num">0${i + 1}</span><h3>${esc(h)}</h3><p>${esc(t)}</p></div>`).join('')}</div>
  </div>
</section>
${cardsSection({ kicker: 'Our properties', title: 'Three neighborhood centers.', lede: '' })}
${ctaBand('Looking for space?', 'See what’s available across our centers.', '/leasing.html#availability', 'View available space')}`;
  })(),
});

/* Contact ------------------------------------------------------------------- */
pages.push({
  file: 'contact.html',
  title: 'Contact',
  active: 'contact',
  subscribe: false,
  description: 'Contact SMC Commercial Properties for leasing, tenant services, and visitor questions about McHenry Village, Northgate Plaza, and Lakeside Shopping Center.',
  body: `
<section class="page-hero">
  <div class="wrap">
    <ol class="crumbs"><li><a href="/">Home</a></li><li aria-current="page">Contact</li></ol>
    <p class="kicker kicker-light">Contact</p>
    <h1 class="display-xl">How can we <em>help?</em></h1>
    <p class="lede">Leasing questions, tenant service requests, or visitor information — reach the right team below.</p>
  </div>
</section>
<section class="section bg-cream">
  <div class="wrap contact-layout">
    <ul class="contact-list">
      <li><span class="cl-label">${esc(C.leasing.label)}</span><span class="cl-val"><a href="mailto:${esc(C.leasing.email)}">${esc(C.leasing.email)}</a></span></li>
      <li><span class="cl-label">${esc(C.buildingServices.label)}</span><span class="cl-val"><a href="mailto:${esc(C.buildingServices.email)}">${esc(C.buildingServices.email)}</a></span><span class="cl-sub">Tenant service requests and property questions</span></li>
      <li><span class="cl-label">${esc(C.mainOffice.label)}</span><span class="cl-val"><a href="${tel(C.mainOffice.phone)}">${esc(C.mainOffice.phone)}</a>${C.mainOffice.verify ? verify(C.mainOffice.note) : ''}</span></li>
      <li><span class="cl-label">${esc(C.afterHours.label)}</span><span class="cl-val"><a href="${tel(C.afterHours.phone)}">${esc(C.afterHours.phone)}</a>${C.afterHours.verify ? verify(C.afterHours.note) : ''}</span><span class="cl-sub">Urgent building issues outside office hours. For emergencies, call 911.</span></li>
      <li><span class="cl-label">${esc(C.corporate.label)}</span><span class="cl-val">${C.corporate.address.map(esc).join('<br>')}</span><span class="cl-sub"><a href="${tel(C.corporate.phone)}">${esc(C.corporate.phone)}</a> · <a href="${esc(B.corporateUrl)}" target="_blank" rel="noopener">standardmanagement.com</a></span></li>
    </ul>
    <div class="form-panel">
      <h2>Send us a message</h2>
      <p class="muted">We reply within one business day.</p>
      <form name="contact" method="POST" data-netlify="true" netlify-honeypot="bot-field" data-ajax data-success="Message received — we’ll follow up within one business day." data-fallback="${esc(C.buildingServices.email)}">
        <input type="hidden" name="form-name" value="contact">
        <input type="hidden" name="subject" value="Message from the SMC Commercial website">
        <p class="hp"><label>Leave this empty <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
        <div class="form-grid">
          <div class="field"><label for="c-name">Full name *</label><input class="input" id="c-name" name="name" autocomplete="name" required></div>
          <div class="field"><label for="c-email">Email *</label><input class="input" id="c-email" type="email" name="email" autocomplete="email" required></div>
          <div class="field"><label for="c-phone">Phone</label><input class="input" id="c-phone" type="tel" name="phone" autocomplete="tel"></div>
          <div class="field"><label for="c-type">Inquiry type</label><select class="select" id="c-type" name="inquiry-type"><option>General question</option><option>Leasing inquiry</option><option>Tenant — service request</option><option>Tenant — billing or lease question</option><option>Visitor / shopper</option><option>Vendor / contractor</option></select></div>
          <div class="field full"><label for="c-prop">Property</label><select class="select" id="c-prop" name="property">${propertyOptions('All / not applicable')}</select></div>
          <div class="field full"><label for="c-msg">Message *</label><textarea class="input" id="c-msg" name="message" rows="6" required></textarea></div>
        </div>
        <div class="form-foot">
          <button class="btn btn-navy" type="submit">Send message</button>
          <p class="fine">Please don’t include account numbers or other sensitive details in this form.</p>
        </div>
        <div class="form-status" role="status" aria-live="polite" tabindex="-1"></div>
      </form>
    </div>
  </div>
</section>
<section class="section-tight" id="accessibility" aria-labelledby="a11y-h">
  <div class="wrap prose">
    <p class="kicker">Accessibility</p>
    <h2 id="a11y-h" class="display-md">We want this site to work for everyone.</h2>
    <p>If you have trouble using any part of this website or need information in another format, email <a href="mailto:${esc(C.buildingServices.email)}">${esc(C.buildingServices.email)}</a> and we’ll help.</p>
  </div>
</section>`,
});

/* Photo credits ------------------------------------------------------------------ */
pages.push({
  file: 'photo-credits.html',
  title: 'Photo credits',
  active: '',
  subscribe: false,
  description: 'Credits and licenses for photography used on the SMC Commercial Properties website.',
  body: (() => {
    const items = [...usedStock.entries()].map(([key, s]) => `<li class="credit">
  <div class="credit-img"><img src="/img/${key}.jpg" alt="${esc(s.alt)}" loading="lazy" decoding="async"></div>
  <p><strong>${esc(s.alt)}</strong><br>Photo by <a href="${esc(s.page)}" target="_blank" rel="noopener">${esc(s.credit)}</a> on ${esc(s.source)} · <a href="${esc(s.licenseUrl)}" target="_blank" rel="noopener">${esc(s.license)}</a></p>
</li>`).join('');
    return `
<section class="page-hero">
  <div class="wrap">
    <ol class="crumbs"><li><a href="/">Home</a></li><li aria-current="page">Photo credits</li></ol>
    <p class="kicker kicker-light">Photo credits</p>
    <h1 class="display-xl">Photography on <em>this site.</em></h1>
    <p class="lede">${items ? 'Some images are licensed stock photography. They are marked “Representative photo” and may not show our properties.' : 'All photos on this site show our properties.'}</p>
  </div>
</section>
<section class="section">
  <div class="wrap">
    ${items ? `<ul class="credits">${items}</ul>` : ''}
  </div>
</section>`;
  })(),
});

/* 404 -------------------------------------------------------------------------- */
pages.push({
  file: '404.html',
  title: 'Page not found',
  active: '',
  subscribe: false,
  description: 'The page you were looking for could not be found.',
  body: `
<section class="page-hero notfound">
  <div class="wrap">
    <p class="kicker kicker-light">404</p>
    <h1 class="display-xl">We couldn’t find <em>that page.</em></h1>
    <p class="lede">It may have moved when we updated the site. Try one of these instead.</p>
    <div class="btn-row" style="margin-top:32px">
      <a class="btn btn-gold" href="/">Home</a>
      ${properties.map(p => `<a class="btn btn-ghost" href="${pageOf(p)}">${esc(p.name)}</a>`).join('')}
    </div>
  </div>
</section>`,
});

/* ------------------------------------------------------------------ */
/* Write output                                                        */
/* ------------------------------------------------------------------ */
function copyDir(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  for (const ent of fs.readdirSync(from, { withFileTypes: true })) {
    if (ent.name.startsWith('.') || ent.name === 'README.md') continue;
    const a = path.join(from, ent.name), b = path.join(to, ent.name);
    if (ent.isDirectory()) copyDir(a, b); else fs.copyFileSync(a, b);
  }
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
copyDir(path.join(SRC, 'assets'), path.join(OUT, 'assets'));
for (const key of usedStock.keys()) {
  fs.mkdirSync(path.dirname(path.join(OUT, 'img', key)), { recursive: true });
  fs.copyFileSync(path.join(CACHE, key + '.jpg'), path.join(OUT, 'img', key + '.jpg'));
}
copyDir(path.join(SRC, 'img'), path.join(OUT, 'img'));
copyDir(path.join(SRC, 'docs'), path.join(OUT, 'docs'));

// Fonts
fs.mkdirSync(path.join(OUT, 'assets/fonts'), { recursive: true });
for (const [from, name, family, style, weight] of FONT_FILES) {
  let src;
  try { src = require.resolve(from); } catch (e) { selfHostedFonts = false; break; }
  fs.copyFileSync(src, path.join(OUT, 'assets/fonts', name));
  fontFace.push(`@font-face{font-family:'${family}';font-style:${style};font-weight:${weight};font-display:swap;src:url(/assets/fonts/${name}) format('woff2-variations'),url(/assets/fonts/${name}) format('woff2');}`);
}
const cssPath = path.join(OUT, 'assets/css/site.css');
if (selfHostedFonts) fs.writeFileSync(cssPath, fontFace.join('\n') + '\n' + fs.readFileSync(cssPath, 'utf8'));
else console.warn('! Font packages not installed — falling back to Google Fonts. Run `npm install` to self-host.');

// Favicon
fs.writeFileSync(path.join(OUT, 'assets/favicon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="10" fill="#051D35"/><text x="32" y="44" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="38" fill="#ffffff">S</text><rect x="16" y="50" width="32" height="2.5" fill="#E69F49"/></svg>`);

// Pages
for (const pg of pages) {
  fs.writeFileSync(path.join(OUT, pg.file), layout(pg));
}

// Sitemap + robots
const urls = pages.filter(p => p.file !== '404.html').map(p => `${site.siteUrl}/${p.file === 'index.html' ? '' : p.file}`);
fs.writeFileSync(path.join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${site.siteUrl}/sitemap.xml\n`);

console.log(`Built ${pages.length} pages to dist/ (build ${BUILD_ID}, fonts ${selfHostedFonts ? 'self-hosted' : 'Google'}).`);
if (verifyList.length) console.log(`\nContent flagged for verification (${verifyList.length}):\n  - ` + verifyList.join('\n  - '));
