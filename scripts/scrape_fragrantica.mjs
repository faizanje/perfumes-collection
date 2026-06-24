// Scrape accurate accords / notes / when-to-wear from Fragrantica using the
// local Chrome browser via CDP (real browser on your IP → passes Cloudflare).
// No Apify, no cost. Polite delays, single session, incremental + resumable.
//
//   node scripts/scrape_fragrantica.mjs [limit]
// Reads originals (data/build/originals.json) for slug→url, writes
// data/sources/fragrantica_scraped.json incrementally (resumes, skips done).

import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const ORIG = join(ROOT, "data/build/originals.json");
const OUT = join(ROOT, "data/sources/fragrantica_scraped.json");
const LIMIT = parseInt(process.argv[2] || "0", 10) || Infinity;
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- targets ----
const originals = JSON.parse(readFileSync(ORIG, "utf8"));
const targets = Object.entries(originals)
  // only the ones we don't already have accurate Apify data for
  .filter(([, o]) => o.originalUrl && o.source !== "fragrantica")
  .map(([slug, o]) => ({ slug, url: o.originalUrl, name: o.matchedName }));

const done = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};
const todo = targets.filter((t) => !done[t.slug]).slice(0, LIMIT);
console.log(`${targets.length} have URLs · ${Object.keys(done).length} already scraped · ${todo.length} to do`);
if (!todo.length) process.exit(0);

// ---- CDP plumbing ----
const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
  "--remote-debugging-port=9410", `--user-agent=${UA}`, "about:blank",
]);
await sleep(1600);
const tabs = await (await fetch("http://localhost:9410/json")).json();
const ws = new WebSocket(tabs.find((x) => x.type === "page").webSocketDebuggerUrl);
let id = 0; const pend = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); } };
await new Promise((r) => (ws.onopen = r));
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
await send("Page.enable");
await send("Runtime.enable");

const EXTRACT = `(()=>{
  const out={ok:false};
  const accords=[...document.querySelectorAll('div[style*="width"]')]
    .filter(e=>/rounded-br-lg/.test(e.className)&&e.style.width)
    .map(e=>({name:(e.textContent||'').trim().toLowerCase(),pct:Math.round(parseFloat(e.style.width))}))
    .filter(a=>a.name&&a.name.length<25&&!isNaN(a.pct));
  const txt=document.body?document.body.innerText:'';
  const seg=(re)=>{const m=txt.match(re);return m?m[1]:'';};
  const split=(s)=>s?s.replace(/\\s+and\\s+/gi,', ').split(',').map(x=>x.trim()).filter(Boolean):[];
  let notes={top:split(seg(/Top notes? (?:are|is) ([^;.]+)/i)),
             middle:split(seg(/middle notes? (?:are|is) ([^;.]+)/i)),
             base:split(seg(/base notes? (?:are|is) ([^;.]+)/i))};
  if(!notes.top.length&&!notes.middle.length&&!notes.base.length){
    const all=seg(/(?:fragrance |main )?notes? (?:are|is) ([^.]+)/i);
    notes={top:split(all),middle:[],base:[]};
  }
  const cards=[...document.querySelectorAll('.tw-rating-card,[class*="rating-card"]')];
  const sc=cards.find(c=>/winter/i.test(c.textContent)&&/night/i.test(c.textContent));
  let wtw=null;
  if(sc){
    const bars=[...sc.querySelectorAll('div[style*="width"]')].map(e=>Math.round(parseFloat(e.style.width)));
    const L=['winter','spring','summer','fall','day','night'];
    if(bars.length>=6){wtw={};L.forEach((l,i)=>wtw[l]=isNaN(bars[i])?null:bars[i]);}
  }
  out.ok=accords.length>0||notes.top.length>0;
  out.title=document.title; out.accords=accords; out.notes=notes; out.whenToWear=wtw;
  return out;
})()`;

let okCount = 0, failCount = 0;
for (let i = 0; i < todo.length; i++) {
  const t = todo[i];
  try {
    await send("Page.navigate", { url: t.url });
    await sleep(6500); // let Cloudflare + JS render
    const r = await send("Runtime.evaluate", { returnByValue: true, expression: EXTRACT });
    const data = r.result?.value || { ok: false };
    done[t.slug] = { url: t.url, name: t.name, ...data, scrapedAt: i };
    writeFileSync(OUT, JSON.stringify(done, null, 2));
    if (data.ok) { okCount++; } else { failCount++; }
    const a = (data.accords || []).slice(0, 3).map((x) => `${x.name} ${x.pct}%`).join(", ");
    console.log(`[${i + 1}/${todo.length}] ${data.ok ? "✓" : "✗"} ${t.name}  ${a}`);
  } catch (err) {
    failCount++;
    console.log(`[${i + 1}/${todo.length}] ERROR ${t.name}: ${err.message}`);
  }
  await sleep(1800 + Math.floor((i % 5) * 400)); // polite, slightly varied
}
console.log(`\nDone. ok=${okCount} fail=${failCount}. Output: ${OUT}`);
chrome.kill();
process.exit(0);
