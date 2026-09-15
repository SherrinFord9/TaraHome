import {build} from 'esbuild';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {updateHomepage} from './html.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const site = resolve(here, '..');
const options = {absWorkingDir: here, bundle: true, jsx: 'automatic',
  define: {'process.env.NODE_ENV': '"production"'}};
await mkdir(resolve(here, '.build'), {recursive: true});
const client = await build({...options, entryPoints: ['src/client.tsx'],
  platform: 'browser', format: 'esm', minify: true, target: 'es2020',
  outdir: resolve(site, 'assets'), entryNames: 'homepage-[hash]', metafile: true});
const output = Object.entries(client.metafile.outputs).find(([, data]) => data.entryPoint === 'src/client.tsx');
if (!output) throw new Error('Client entry not emitted');
const entry = '/assets/' + output[0].split('/').at(-1);
const server = resolve(here, '.build/server.mjs');
process.env.NODE_ENV = 'production';
await build({...options, entryPoints: ['src/server.tsx'], platform: 'node', format: 'esm',
  packages: 'external', outfile: server});
const {renderHome} = await import(pathToFileURL(server));
const year = new Date().getUTCFullYear();
const html = renderHome(year);
const target = resolve(site, 'index.html');
const source = await readFile(target, 'utf8');
await writeFile(target, updateHomepage(source, html, entry, year));
console.log(`Homepage generated: ${entry}; ${Buffer.byteLength(html)} bytes of static HTML. Other pages untouched.`);
