import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

process.chdir(path.resolve(import.meta.dirname, '..'));
const html = await readFile('dist/index.html', 'utf8');
assert(html.startsWith('<!doctype html>') && html.trim().endsWith('</html>'), 'Complete generated document');
assert.equal((html.match(/<h1\b/g) || []).length, 1, 'Exactly one page heading');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(ids.length, new Set(ids).size, 'Unique IDs');
for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  const reference = match[1];
  if (reference.startsWith('#')) assert(ids.includes(reference.slice(1)), `Anchor target ${reference}`);
  else if (!reference.startsWith('http') && reference !== './') await access(path.join('dist', reference));
}
const syntax = spawnSync(process.execPath, ['--check', 'public/site.js'], { encoding: 'utf8' });
assert.equal(syntax.status, 0, syntax.stderr);
assert(html.includes('muted playsinline'), 'Safe inline video defaults');
assert(html.includes('poster="assets/legion-poster.jpg"'), 'Static poster fallback');
console.log('Verified generated HTML, asset paths, anchors, and browser-script syntax.');
