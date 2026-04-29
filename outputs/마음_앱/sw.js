const CACHE = "maeum-v4";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // API / 외부는 네트워크로만
  if (url.hostname.includes("anthropic.com") ||
      url.hostname.includes("workers.dev") ||
      url.hostname.includes("open-meteo.com")) return;

  // HTML·JS·CSS는 네트워크 우선 (최신 버전 보장), 실패 시 캐시
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(e.request).then(resp => {
        if (e.request.method === "GET" && resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => caches.match(e.request).then(r => r || caches.match("./index.html")))
    );
  }
});
