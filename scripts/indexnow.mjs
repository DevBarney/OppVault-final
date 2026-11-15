// Tells Bing, Yandex and other IndexNow engines which addresses are new or changed.
// Run after a deploy:  node scripts/indexnow.mjs            (sends every sitemap address)
//                      node scripts/indexnow.mjs /path ...  (sends only the paths you list)
// The key below is public by design: the same text sits in public/18d1b15b545615352438af6687e94aac.txt so engines can verify the site.
const HOST = 'www.oppvault.app';
const KEY = '18d1b15b545615352438af6687e94aac';
const ORIGIN = `https://${HOST}`;

async function sitemapUrls() {
  const xml = await (await fetch(`${ORIGIN}/sitemap.xml`)).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

const paths = process.argv.slice(2);
const urlList = paths.length ? paths.map((p) => `${ORIGIN}${p.startsWith('/') ? p : `/${p}`}`) : await sitemapUrls();

for (let i = 0; i < urlList.length; i += 9000) {
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `${ORIGIN}/${KEY}.txt`, urlList: urlList.slice(i, i + 9000) }),
  });
  console.log(`Sent ${Math.min(9000, urlList.length - i)} addresses, status ${res.status}`);
}
