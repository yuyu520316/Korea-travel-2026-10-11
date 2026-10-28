import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const trip = JSON.parse(await readFile(path.join(root, 'data/trip.json'), 'utf8'));
const places = JSON.parse(await readFile(path.join(root, 'data/places.json'), 'utf8'));
const safe = value => JSON.stringify(value).replaceAll('<', '\\u003c');
await mkdir(path.join(root, 'dist'), { recursive: true });
for (const file of ['index.html', 'guide.html', 'guide.js', 'guide.css', 'shopping.html', 'shopping.js', 'shopping.css', 'ui.css', 'home.css']) {
  await copyFile(path.join(root, 'site', file), path.join(root, 'dist', file));
}
let main = await readFile(path.join(root, 'site/index.html'), 'utf8');
const begin = main.indexOf('const E=');
const end = main.indexOf('let day=', begin);
if (begin < 0 || end < 0) throw new Error('Cannot locate itinerary data in site/index.html');
main = main.slice(0, begin) + `const P=${safe(trip.areas)};\nconst D=${safe(trip.days)};\nconst G=${safe(trip.groups)};\nconst PERSONAL=${safe(trip.personalDays)};\n` + main.slice(end);
await writeFile(path.join(root, 'dist/index.html'), main);
let guide = await readFile(path.join(root, 'site/guide.js'), 'utf8');
const dataStart = guide.indexOf('const spots=');
const dataEnd = guide.indexOf('const $=', dataStart);
if (dataStart < 0 || dataEnd < 0) throw new Error('Cannot locate guide data in site/guide.js');
guide = guide.slice(0, dataStart) + `const spots=${safe(places)};\n` + guide.slice(dataEnd);
await writeFile(path.join(root, 'dist/guide.js'), guide);
// Both /guide and /guide.html work on static hosts.
await writeFile(path.join(root, 'dist/404.html'), '<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><title>找不到這一頁</title><p>這一頁不存在。<a href="./index.html">回到首爾行程</a></p></html>');
await writeFile(path.join(root, 'dist/.nojekyll'), '');
console.log(`Built ${trip.days.length} days and ${places.length} guide places into dist/.`);

