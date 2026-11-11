import { readFileSync, writeFileSync } from 'node:fs';

// Saves the channel's current YouTube live video ID to assets/data/live.json,
// or null while offline. The site reads it to load the right player and chat.
const CHANNEL = 'UCu0kb0PuVHuq2H2ZPYwCJ2w';
const OUT = new URL('../../assets/data/live.json', import.meta.url);

let html;
try {
  const res = await fetch('https://www.youtube.com/channel/' + CHANNEL + '/live', {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'en-US' }
  });
  if (!res.ok) throw new Error('status ' + res.status);
  html = await res.text();
} catch (err) {
  console.log('live check failed (' + err.message + ') - keeping the current file');
  process.exit(0);
}

const id = (html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})"/) || [])[1];
// A stream that is scheduled but not started also carries "isLive":true, next to "isUpcoming":true.
const youtube = id && html.includes('"isLive":true') && !html.includes('"isUpcoming":true') ? id : null;

const next = JSON.stringify({ youtube }) + '\n';
let prev = '';
try { prev = readFileSync(OUT, 'utf8'); } catch {}
if (prev === next) { console.log('no change'); process.exit(0); }
writeFileSync(OUT, next);
console.log(youtube ? 'live: ' + youtube : 'offline');
