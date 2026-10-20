import { mkdir, readFile, writeFile } from 'node:fs/promises';
const template = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
// Real HTML entries make direct links and reloads work on static hosts too.
for (const [slug, title] of [['websites', 'Сайты и продукты'], ['automation', 'Автоматизация процессов'], ['growth', 'Продвижение и развитие']]) {
  const folder = new URL(`../dist/services/${slug}/`, import.meta.url);
  await mkdir(folder, { recursive: true });
  await writeFile(new URL('index.html', folder), template.replace(/<title>.*?<\/title>/, `<title>${title} — CODEAM</title>`));
}

for (const [slug, title] of [['vesna', 'Весна'], ['diamond', 'Diamond'], ['shchekino', 'Спецтехника Щёкино'], ['silver', 'Сильвер']]) {
  const folder = new URL(`../dist/cases/${slug}/`, import.meta.url);
  await mkdir(folder, { recursive: true });
  await writeFile(new URL('index.html', folder), template.replace(/<title>.*?<\/title>/, `<title>${title} — кейс CODEAM</title>`));
}
