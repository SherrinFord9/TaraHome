import {readFile, writeFile, copyFile, mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const built = path.join(here, '.build');
const manifest = JSON.parse(await readFile(path.join(built, '.vite/manifest.json'), 'utf8'));
const entry = manifest['src/configurator.tsx'];
if (!entry?.isEntry) throw new Error('Configurator entry is missing.');
const htmlPath = path.join(root, 'configurator/index.html');
const html = await readFile(htmlPath, 'utf8');
const start = '<!-- configurator:assets:start -->';
const end = '<!-- configurator:assets:end -->';
if (html.split(start).length !== 2 || html.split(end).length !== 2) throw new Error('Expected exactly one configurator asset block.');
const from = html.indexOf(start) + start.length;
const to = html.indexOf(end);
if (to < from) throw new Error('Invalid asset block order.');
const files = new Set();
for (const output of Object.values(manifest)) {
  [output.file, ...(output.css || []), ...(output.assets || [])].forEach(file => files.add(file));
}
for (const file of files) {
  if (!/^assets\/[a-zA-Z0-9_.-]+$/.test(file)) throw new Error(`Unexpected output path: ${file}`);
  await mkdir(path.dirname(path.join(root, file)), {recursive: true});
  await copyFile(path.join(built, file), path.join(root, file));
}
const styles = new Set(entry.css || []);
const imports = new Set();
function visit(key) {
  if (imports.has(key)) return;
  imports.add(key);
  const chunk = manifest[key];
  if (!chunk) throw new Error(`Missing import ${key}`);
  (chunk.css || []).forEach(css => styles.add(css));
  (chunk.imports || []).forEach(visit);
}
(entry.imports || []).forEach(visit);
const tags = [
  `<script type="module" crossorigin src="/${entry.file}"></script>`,
  ...[...imports].map(key => `<link rel="modulepreload" crossorigin href="/${manifest[key].file}">`),
  ...[...styles].map(css => `<link rel="stylesheet" crossorigin href="/${css}">`),
];
// Only this owned block changes. The live metadata, font preload and disabled
// first-paint fallback remain byte-for-byte intact; homepage/blog files are never written.
await writeFile(htmlPath, html.slice(0, from) + '\n    ' + tags.join('\n    ') + '\n    ' + html.slice(to));
console.log(`Published ${files.size} configurator assets; preserved all other page markup.`);
