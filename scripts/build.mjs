import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash } from 'node:crypto';
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
main = main.slice(0, begin) + `const P=${safe(trip.areas)};\nconst D=${safe(trip.days)};\nconst G=${safe(trip.groups)};\nconst PERSONAL=${safe(trip.personalDays)};\nconst STAYS=${safe(trip.stays || [])};\n` + main.slice(end);
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


// Content-specific asset URLs prevent an updated HTML page loading old guide code.
const output = path.join(root, 'dist');
const htmlFiles = ['index.html', 'guide.html', 'shopping.html'];
const assets = ['guide.js', 'shopping.js', 'guide.css', 'shopping.css', 'ui.css', 'home.css'];
const assetVersions = new Map();
for (const file of assets) {
  const contents = await readFile(path.join(output, file));
  assetVersions.set(file, createHash('sha256').update(contents).digest('hex').slice(0, 12));
}
const escapeHTML = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
for (const file of htmlFiles) {
  let html = await readFile(path.join(output, file), 'utf8');
  for (const [asset, version] of assetVersions) {
    html = html.replaceAll(`"${asset}"`, `"${asset}?v=${version}"`);
  }
  const announcement = '<aside style="margin:20px 0;padding:16px 18px;border:1px solid #b5d3c3;border-radius:12px;background:#e8f3eb;color:#285e4a;line-height:1.8" aria-label="最新更新"><strong>10/28 更新版</strong><p>已更新行程順序、每項 NAVER Map，以及 10/28、10/29 的 WECOSTAY Chungmuro 住宿。</p><a href="index.html#stays">查看住宿</a> · <a href="guide.html">查看依行程排序的地圖攻略</a></aside>';
  html = html.replace(/<main(\s[^>]*)?>/, match => match + announcement);
  if (file === 'index.html') {
    const stay = trip.stays.find(s => s.id === 'weco');
    if (stay) {
      const address = escapeHTML(stay.address);
      const card = `<article class="stay-card" id="weco-stay"><span class="stay-label">10/28（三）、10/29（四）・2 晚</span><h3>${escapeHTML(stay.name)}</h3><p class="stay-area">${escapeHTML(stay.ko)}・忠武路</p><p>10/28 入住 → 10/30 退房（依兩晚整理）</p><address>${address}<br>${escapeHTML(stay.addressEn)}</address><p>${escapeHTML(stay.note)}</p><div class="stay-links"><a href="https://map.naver.com/p/search/${encodeURIComponent(stay.query)}" target="_blank" rel="noopener noreferrer">NAVER Map 搜尋 ↗</a><a href="${escapeHTML(stay.booking)}" target="_blank" rel="noopener noreferrer">Booking 住宿頁 ↗</a><button data-copy-stay="${address}">複製地址</button></div><small class="stay-copy-status" aria-live="polite"></small></article>`;
      html = html.replace('<article class="stay-card" id="weco-stay"></article>', card);
    }
  }
  await writeFile(path.join(output, file), html);
}
// Publish the exact build at a new path so the user can open it without an old-page cache.
const releaseHash = createHash('sha256');
for (const file of [...htmlFiles, ...assets]) releaseHash.update(await readFile(path.join(output, file)));
const releasePath = 'updated-' + releaseHash.digest('hex').slice(0, 12);
await mkdir(path.join(output, releasePath), { recursive: true });
for (const file of [...htmlFiles, ...assets]) await copyFile(path.join(output, file), path.join(output, releasePath, file));
await writeFile(path.join(output, 'release.json'), JSON.stringify({path:releasePath}) + '\n');
console.log(`Verified-build URL path: /${releasePath}/`);

// Keep the already-shared link working after future itinerary updates.
for (const sharedPath of ['updated-f8515ca4a5bb']) {
  await mkdir(path.join(output, sharedPath), { recursive: true });
  for (const file of [...htmlFiles, ...assets]) await copyFile(path.join(output, file), path.join(output, sharedPath, file));
}
