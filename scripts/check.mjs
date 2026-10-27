import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root = fileURLToPath(new URL('../', import.meta.url));
const trip = JSON.parse(await readFile(path.join(root, 'data/trip.json'), 'utf8'));
const places = JSON.parse(await readFile(path.join(root, 'data/places.json'), 'utf8'));
assert.equal(trip.days.length, 7, 'Keep the seven-day itinerary');
for (const day of trip.days) {
  assert(day.date && day.title && Array.isArray(day.events), 'Every day needs a date, title, and events');
  for (const event of day.events) {
    assert(event.time && event.title && event.group, 'Every event needs time, title, and group');
    if (event.place) assert(trip.areas[event.place], `Unknown map area ${event.place}`);
  }
}
const ids = new Set();
for (const place of places) {
  assert(place.id && !ids.has(place.id), `Duplicate or missing place ID: ${place.id}`);
  ids.add(place.id);
  assert(['group', 'solo'].includes(place.scope), `Unknown scope: ${place.scope}`);
  assert(['food', 'sight', 'shopping'].includes(place.type), `Unknown type: ${place.type}`);
  if (place.coord) assert(place.coord.length === 2 && place.coord.every(Number.isFinite), 'Coordinates must be numbers');
  if (place.source) assert(new URL(place.source).protocol === 'https:', 'Sources must use HTTPS');
}
const main = await readFile(path.join(root, 'dist/index.html'), 'utf8');
const guide = await readFile(path.join(root, 'dist/guide.js'), 'utf8');
new vm.Script(main.match(/<script>([\s\S]*?)<\/script>/)[1]);
new vm.Script(guide);
// Guard against the prior layout bug: sections must not sit inside the quick-info grid.
assert(/<\/div>\s*<section id="journey">/.test(main), 'Close quick-info grid before itinerary');
assert(main.includes('href="guide.html"'), 'Keep second-page navigation');
assert(main.includes('中華電信學生漫遊') && main.includes('NT$788'), 'Keep latest roaming price');
assert(!main.includes('NT$709'), 'Remove superseded roaming discount');
assert(main.includes('CI161') && main.includes('41K') && main.includes('CI162'), 'Keep confirmed flights and seat');
assert(main.includes('L YOUNG Inn') && main.includes('2,253'), 'Keep confirmed hotel and cost');
assert(main.includes('大家的 10/28 行程'), 'Keep group arrival itinerary separate');
assert(!JSON.stringify(places).includes('郁萱') && !JSON.stringify(places).includes('慕程'), 'Keep personal allergy identities off public page');
assert(places.filter(p=>p.area === '束草中央市場' && p.ingredients?.length).length >= 7, 'Keep ingredient reminders for market foods');
const returnDay = trip.days.find(day => day.date === '11/3');
assert(returnDay.events.some(event => event.time.includes('09:30')), 'Arrive at ICN by 09:30');
console.log('Data, scripts, navigation, layout guard, and return-flight checks passed.');
