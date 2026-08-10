import { readFile, writeFile } from 'node:fs/promises';

const mappingSource = await readFile('convex/data/catalog/animal_wikipedia_pages.ts', 'utf8');
const objectSource = mappingSource.slice(mappingSource.indexOf('{'), mappingSource.lastIndexOf('};') + 1);
const titlesByLabel = Function(`"use strict"; return (${objectSource});`)();
const catalogPath = 'convex/data/catalog/core_artwork.generated.json';
const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
const entries = Object.entries(titlesByLabel);
const failures = [];

async function fetchWikipedia(url) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'LammaGame/1.0 artwork-refresh (github.com/alikizaro/bara)' },
    });
    if (response.status !== 429) return response;
    await new Promise((resolve) => setTimeout(resolve, 1000 * (2 ** attempt)));
  }
  throw new Error('Wikipedia API remained rate limited after retries');
}

for (let offset = 0; offset < entries.length; offset += 25) {
  const batch = entries.slice(offset, offset + 25);
  const titles = batch.map(([, title]) => title);
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    prop: 'pageimages|info',
    inprop: 'url',
    piprop: 'thumbnail',
    pithumbsize: '960',
    redirects: '1',
    titles: titles.join('|'),
  });
  const response = await fetchWikipedia(`https://en.wikipedia.org/w/api.php?${params}`);
  if (!response.ok) throw new Error(`Wikipedia API returned HTTP ${response.status}`);
  const data = await response.json();
  const normalized = new Map((data.query?.normalized ?? []).map((item) => [item.from, item.to]));
  const redirects = new Map((data.query?.redirects ?? []).map((item) => [item.from, item.to]));
  const pages = new Map(Object.values(data.query?.pages ?? {}).map((page) => [page.title, page]));

  for (const [label, originalTitle] of batch) {
    const normalizedTitle = normalized.get(originalTitle) ?? originalTitle;
    const finalTitle = redirects.get(normalizedTitle) ?? normalizedTitle;
    const page = pages.get(finalTitle);
    if (!page?.thumbnail?.source) {
      failures.push({ label, title: originalTitle, error: 'No thumbnail' });
      continue;
    }
    catalog.animals[label] = {
      url: page.thumbnail.source,
      sourceUrl: page.fullurl ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(finalTitle)}`,
    };
  }
}

if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exitCode = 1;
} else {
  await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
  console.log(`Refreshed ${entries.length} reviewed animal images.`);
}
