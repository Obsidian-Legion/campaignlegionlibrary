import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pages } from './pages.mjs';

process.chdir(path.resolve(import.meta.dirname, '..'));
for (const { file } of pages) {
  const html = await readFile(`dist/${file}`, 'utf8');
  assert(html.startsWith('<!doctype html>') && html.trim().endsWith('</html>'), `Complete document: ${file}`);
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `Exactly one heading: ${file}`);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size, `Unique IDs: ${file}`);
  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const reference = match[1];
    if (reference.startsWith('#')) assert(ids.includes(reference.slice(1)), `Anchor target ${reference}`);
    else if (!/^(?:https?:|mailto:)/.test(reference) && reference !== './') await access(path.join('dist', reference.split(/[?#]/)[0]));
  }
  for (const [video] of html.matchAll(/<video\b[^>]*>/g)) {
    assert(video.includes('muted playsinline'), 'Safe inline video defaults');
    const poster = video.match(/poster="([^"]+)"/);
    assert(poster, 'Static poster fallback');
    await access(path.join('dist', poster[1]));
  }
}
for (const script of ['public/site.js', 'public/sponsorship.js']) {
  const syntax = spawnSync(process.execPath, ['--check', script], { encoding: 'utf8' });
  assert.equal(syntax.status, 0, syntax.stderr);
}
console.log(`Verified ${pages.length} generated pages, asset paths, anchors, and browser-script syntax.`);
