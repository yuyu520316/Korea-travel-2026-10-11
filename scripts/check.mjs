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

// The supplied parallel routes must remain complete and in their original order.
assert.deepEqual(trip.days.slice(0, 6).map(d => d.events.length), [8, 10, 14, 13, 14, 5]);
assert.deepEqual(trip.groups.map(g => g.teams.map(t => t.name)), [['猛男團', '男生團'], ['學姊團', '學弟妹團']]);
assert.equal(trip.days[2].events[8].time, '13:00–15:00', 'Keep the sister route after the junior route, without globally sorting times');
assert.equal(trip.days[5].events[0].time, '23:00–05:00');
assert(trip.days[5].events[0].desc.includes('11/01'), 'Explain the overnight date');
for (const d of [...trip.days, ...trip.personalDays]) for (const e of d.events) {
  assert(e.naverQuery?.trim(), `Missing NAVER search for ${d.date}: ${e.title}`);
  for (const key of e.mapOptions || []) assert(trip.areas[key], `Unknown alternative map ${key}`);
}
// Exercise map generation and day rendering for every event without external map access.
const elements = new Map();
const stub = () => ({innerHTML:'', style:{}, value:'', dataset:{}, children:[],
  addEventListener(){}, setAttribute(){}, append(child){this.children.push(child)},
  replaceChildren(){this.children=[]}, querySelectorAll(){return []},
  querySelector(){return {focus(){}}}});
const document = {getElementById(id){if(!elements.has(id)) elements.set(id,stub());return elements.get(id)},
  createElement:stub, querySelectorAll(){return []}};
const context = vm.createContext({document,localStorage:{getItem(){return null},setItem(){}},Intl,Date,encodeURIComponent});
vm.runInContext(main.match(/<script>([\s\S]*?)<\/script>/)[1], context);
for (let d = 0; d < trip.days.length; d++) {
  vm.runInContext(`day=${d};render()`, context);
  assert.equal((elements.get('timeline').innerHTML.match(/class="event-maps"/g)||[]).length,trip.days[d].events.length);
  for (let e = 0; e < trip.days[d].events.length; e++) {
    vm.runInContext(`showMap(${e})`, context);
    assert.equal(new URL(elements.get('map-link').href).hostname, 'map.naver.com');
    assert.equal(elements.get('map-link').hidden, false);
  }
}
console.log('All group routes, personal plans, overnight timing, day rendering, and NAVER links passed.');
// Guide order must follow the itinerary across categories and preserve links in every filter.
const guideElements = new Map();
const guideDocument = {...document,
  getElementById(id){if(!guideElements.has(id))guideElements.set(id,stub());return guideElements.get(id)},
  querySelector(){return stub()}};
const guideContext = vm.createContext({document:guideDocument,localStorage:{getItem(){return null}},window:{},location:{search:''},URLSearchParams,encodeURIComponent});
vm.runInContext(guide, guideContext);
const guideIDs=Array.from(vm.runInContext('filtered().map(p=>p.id)',guideContext));
assert(guideIDs.indexOf('seorak')<guideIDs.indexOf('sokcho-market'));
assert(guideIDs.indexOf('sokcho-pumpkin')<guideIDs.indexOf('beach'));
assert(guideIDs.indexOf('hongdae-pharmacy')<guideIDs.indexOf('seorak'));
for(const day of ['','10/28','10/29','10/30','10/31','11/01']) for(const category of ['all','food','sight','shopping']){
  guideElements.get('day-filter').value=day;
  vm.runInContext(`type=${JSON.stringify(category)};render()`,guideContext);
  const ids=Array.from(vm.runInContext('filtered().map(p=>p.id)',guideContext));
  const cards=guideElements.get('cards').innerHTML;
  for(const id of ids){
    const card=cards.match(new RegExp(`data-card="${id}"[\\s\\S]*?<\\/article>`))?.[0];
    assert(card?.includes('https://map.naver.com/p/search/'), `Guide card ${id} needs a NAVER link`);
  }
}
console.log('Guide sequence, date/category filters, and per-card NAVER links passed.');
// A fresh release URL must include the exact validated pages and current assets.
const release = JSON.parse(await readFile(path.join(root, 'dist/release.json'), 'utf8'));
assert(/^updated-[a-f0-9]{12}$/.test(release.path));
for (const file of ['index.html','guide.html','shopping.html','guide.js','shopping.js','ui.css','home.css','guide.css','shopping.css']) {
  assert.equal(await readFile(path.join(root,'dist',release.path,file),'utf8'),await readFile(path.join(root,'dist',file),'utf8'));
}
assert(main.includes('10/28 更新版'));
assert(/id="weco-stay"><span[\s\S]*?WECOSTAY Chungmuro/.test(main),'Hotel must be visible before JavaScript runs');
const guideHTML = await readFile(path.join(root,'dist/guide.html'),'utf8');
assert(/src="guide\.js\?v=[a-f0-9]{12}"/.test(guideHTML),'Version guide assets to prevent stale code');
console.log('Fresh release pages, visible lodging, and versioned assets passed.');
// Shopping defaults must merge once without losing saved purchases or re-adding removed brands.
const shopping = await readFile(path.join(root,'dist/shopping.js'),'utf8');
const shoppingStorage = new Map([['seoul-yuhan-buy-list-v1',JSON.stringify([{id:'saved',name:'護手霜',shop:'olive',qty:3,done:true}])]]);
const runShopping = () => {
  const fields = new Map();
  const doc = {getElementById(id){if(!fields.has(id))fields.set(id,stub());return fields.get(id)}};
  const ctx = vm.createContext({document:doc,localStorage:{getItem:k=>shoppingStorage.get(k)||null,setItem:(k,v)=>shoppingStorage.set(k,v)}});
  vm.runInContext(shopping,ctx);
  return ctx;
};
let shoppingContext = runShopping();
let list = JSON.parse(shoppingStorage.get('seoul-yuhan-buy-list-v1'));
assert.deepEqual(list.map(x=>x.name),['護手霜','innisfree','adidas']);
assert.equal(list[0].qty,3);assert.equal(list[0].done,true);
vm.runInContext("items=items.filter(x=>x.name!=='adidas');save()",shoppingContext);
runShopping();
list=JSON.parse(shoppingStorage.get('seoul-yuhan-buy-list-v1'));
assert(!list.some(x=>x.name==='adidas'),'Respect removal after one-time brand addition');
console.log('Shopping brands merge once and preserve existing list state.');
