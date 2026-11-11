import { readFileSync, writeFileSync } from 'node:fs';

const CHANNEL = 'UCu0kb0PuVHuq2H2ZPYwCJ2w';
const OUT = new URL('../../assets/data/videos.json', import.meta.url);
const FEED = 'https://www.youtube.com/feeds/videos.xml?channel_id=' + CHANNEL;

const res = await fetch(FEED, { headers: { 'User-Agent': 'joemet123.com feed check' } });
if (!res.ok) { console.log('feed returned', res.status, '- keeping the current file'); process.exit(0); }
const xml = await res.text();

const items = [];
for (const entry of xml.split('<entry>').slice(1)) {
  const id = (entry.match(/<yt:videoId>([A-Za-z0-9_-]{6,})<\/yt:videoId>/) || [])[1];
  const title = (entry.match(/<title>([\s\S]*?)<\/title>/) || [])[1];
  const link = (entry.match(/<link rel="alternate" href="(https:\/\/www\.youtube\.com\/[^"]+)"/) || [])[1];
  const published = (entry.match(/<published>([^<]+)<\/published>/) || [])[1];
  if (!id || !title || !link) continue;
  items.push({ title: title.trim(), link, published });
}
if (items.length === 0) { console.log('no entries parsed - keeping the current file'); process.exit(0); }

const next = JSON.stringify({ status: 'ok', items }, null, 1) + '\n';
let prev = '';
try { prev = readFileSync(OUT, 'utf8'); } catch {}
if (prev === next) { console.log('no change'); process.exit(0); }
writeFileSync(OUT, next);
console.log('updated', items.length, 'videos');
