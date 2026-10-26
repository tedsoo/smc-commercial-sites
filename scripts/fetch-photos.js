#!/usr/bin/env node
/*
  Downloads the licensed stock photos listed in data/photos.js into .cache/photos/
  so the site serves them itself (no hotlinking). build.js runs this first.

  - A real photo in src/img/ with the same name always wins and is never downloaded over.
  - This script never fails the build: if a download fails, that slot keeps its
    branded placeholder and the reason is printed in the build log.
*/
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const photos = require('../data/photos');
const CACHE = path.join(ROOT, '.cache', 'photos');
const SRC_IMG = path.join(ROOT, 'src', 'img');

const hasReal = key => ['.webp', '.jpg', '.jpeg', '.png'].some(ext => fs.existsSync(path.join(SRC_IMG, key + ext)));

async function download(key, p) {
  const dest = path.join(CACHE, key + '.jpg');
  if (hasReal(key)) return `${key}: real photo in src/img (stock skipped)`;
  if (fs.existsSync(dest) && fs.statSync(dest).size > 10000) return `${key}: cached`;
  const url = `${p.src}?w=${p.w}&h=${p.h}&fit=crop&crop=${p.crop || 'center'}&q=${p.q || 72}&fm=jpg`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const type = res.headers.get('content-type') || '';
    if (!type.startsWith('image/')) throw new Error('not an image (' + type + ')');
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 10000) throw new Error('file too small');
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buf);
    return `${key}: downloaded (${Math.round(buf.length / 1024)} KB)`;
  } catch (e) {
    return `! ${key}: ${e.name === 'AbortError' ? 'timed out' : e.message} (placeholder used)`;
  } finally {
    clearTimeout(timer);
  }
}

(async () => {
  if (typeof fetch !== 'function') { console.warn('! Node 18+ is needed to download stock photos; placeholders used.'); return; }
  const results = await Promise.all(Object.entries(photos).map(([key, p]) => download(key, p)));
  console.log('Stock photos:\n  ' + results.join('\n  '));
})();
