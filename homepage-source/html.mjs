import {parse} from 'parse5';

function nodes(root) {
  return [root, ...(root.childNodes || []).flatMap(nodes)];
}

const attr = (node, name) => node.attrs?.find(a => a.name === name)?.value;

export function updateHomepage(source, markup, entry, year) {
  if (!/^\/assets\/homepage-[A-Za-z0-9_-]+\.js$/.test(entry)) throw new Error('Invalid homepage entry');
  if (!Number.isInteger(year) || year < 2026) throw new Error('Invalid render year');
  const all = nodes(parse(source, {sourceCodeLocationInfo: true}));
  const one = (predicate, label) => {
    const matches = all.filter(predicate);
    if (matches.length !== 1) throw new Error(`Expected one ${label}, found ${matches.length}`);
    return matches[0];
  };
  const root = one(n => n.tagName === 'div' && attr(n, 'id') === 'root', 'root');
  const style = one(n => n.tagName === 'link' && attr(n, 'href') === '/assets/main-CHkScHI6.css' &&
    ['preload', 'stylesheet'].includes(attr(n, 'rel')), 'canonical stylesheet');
  const loader = one(n => n.tagName === 'script' &&
    (attr(n, 'data-tara-home-entry') !== undefined || n.childNodes?.some(c => c.value?.includes('window.__loadTaraApp'))), 'homepage loader');
  const edits = [
    [root, `<div id="root" data-tara-render-year="${year}">${markup}</div>`],
    [style, '<link rel="stylesheet" href="/assets/main-CHkScHI6.css" crossorigin data-tara-app-css="true" />'],
    // Start immediately after parsing without making document load wait for hydration.
    [loader, `<script type="module" data-tara-home-entry>import(${JSON.stringify(entry)});</script>`],
  ].map(([node, replacement]) => ({...node.sourceCodeLocation, replacement}));
  // Preserve all unrelated bytes, including metadata, analytics, and hero-height caps.
  return edits.sort((a, b) => b.startOffset - a.startOffset).reduce((html, edit) =>
    html.slice(0, edit.startOffset) + edit.replacement + html.slice(edit.endOffset), source);
}
