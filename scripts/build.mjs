import { spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile, cp } from 'node:fs/promises';
import path from 'node:path';

process.chdir(path.resolve(import.meta.dirname, '..'));
await mkdir('.ucm', { recursive: true });
await mkdir('dist', { recursive: true });
const baseVersion = '7.20.0';
const installedBase = await readFile('.ucm/base-version', 'utf8').catch(() => '');
const source = await readFile('src/site.u', 'utf8');
const transcript = [
  ...(installedBase === baseVersion ? [] : ['```ucm', `campaign/main> lib.install @unison/base/releases/${baseVersion}`, '```']),
  '```unison', source, '```', '```ucm',
  'campaign/main> update',
  'campaign/main> compile campaign.main .ucm/index',
  '```', ''
].join('\n');
await writeFile('.ucm/build.md', transcript);

function ucm(args) {
  const options = { encoding: 'utf8', maxBuffer: 24 * 1024 * 1024, timeout: 300000 };
  // Fixed arguments only. UCM requires UTF-8 console output on Windows.
  const result = process.platform === 'win32'
    ? spawnSync('cmd.exe', ['/d', '/s', '/c', 'chcp 65001 >nul && ucm ' + args.join(' ')], options)
    : spawnSync('ucm', args, options);
  if (result.error || result.status !== 0) {
    process.stderr.write(result.stderr || '');
    process.stderr.write(result.stdout || '');
    throw result.error || new Error(`UCM exited with status ${result.status}`);
  }
  return result.stdout.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');
}

console.log('Typechecking and compiling the Legion Campaign with Unison...');
ucm(['-C', '.ucm', 'transcript.in-place', '.ucm/build.md']);
await writeFile('.ucm/base-version', baseVersion);
const html = ucm(['run.compiled', '.ucm/index.uc']).trim();
if (!html.startsWith('<!doctype html>') || !html.endsWith('</html>')) {
  throw new Error('The Unison executable did not emit a complete HTML document.');
}
await cp('public', 'dist', { recursive: true });
await writeFile('dist/index.html', html + '\n');
await writeFile('dist/.nojekyll', '');
console.log(`Generated dist/index.html with Unison (${Buffer.byteLength(html)} bytes).`);
