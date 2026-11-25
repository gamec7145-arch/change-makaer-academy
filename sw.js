/* CMA Service Worker: network-first with timeout, cache fallback.
   Slow/unstable net e-o app khulbe; notun deploy hole auto update hobe. */
const VERSION = "cma-v13";
const CACHE = "cma-cache-" + VERSION;
const CORE = [
  "./", "index.html", "css/style.css", "css/cma-community-design.css?v=2",
  "js/shared.js", "js/home.js", "js/navigation.js", "js/offline-batches.js",
  "js/online-batches.js", "js/exam-preparation.js", "js/study-materials.js",
  "js/supabase-config.js", "js/account.js", "js/app-lock.js", "js/screen-guard.js",
  "js/app-update.js", "js/free-courses.js", "js/class-prep.js", "js/admission.js", "js/teachers.js", "js/guide.js", "js/router.js", "cma-logo.png",
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
];
const NETWORK_TIMEOUT = 8000; // ei somoyer moddhe network na ele cache dekhabe, kintu background e notun ta niye page auto-reload hobe

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      Promise.all(CORE.map((u) =>
        fetch(u, { mode: u.startsWith("http") ? "no-cors" : "same-origin", cache: "reload" })
          .then((r) => c.put(u, r)).catch(() => {})
      ))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Supabase API / realtime / video: kokhono cache korbo na
  if (url.hostname.endsWith("supabase.co") || /youtube|googlevideo|ytimg/.test(url.hostname)) return;
  if (url.pathname.startsWith("/downloads/") || url.pathname === "/version.json" || url.pathname === "/sw.js") return;

  const isFont = /fonts\.(googleapis|gstatic)\.com/.test(url.hostname);
  const isCDN = url.hostname === "cdn.jsdelivr.net";
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin && !isFont && !isCDN) return;

  // Fonts & CDN lib: cache-first (version pinned, kokhono change hoy na)
  if (isFont || isCDN) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((r) => {
        const copy = r.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return r;
      }))
    );
    return;
  }

  // Page navigation + same-origin file: shob shomoy network theke notun ta ante chesta kore.
  // Network dhire hole cache dekhay, kintu notun ta ese gele page ke janiye auto-reload koray.
  const isNav = req.mode === "navigate";
  const key = isNav ? "index.html" : req;

  const fromNetwork = fetch(req, { cache: "no-cache" }).then((r) => {
    if (r && r.ok) {
      const copy = r.clone();
      caches.open(CACHE).then((c) => c.put(key, copy));
    }
    return r;
  });

  const fromCache = () =>
    caches.match(key, { ignoreSearch: false }).then((hit) =>
      hit || caches.match(req, { ignoreSearch: true })
    );

  e.respondWith(
    new Promise((resolve) => {
      let settled = false;
      const timer = setTimeout(() => {
        fromCache().then((hit) => {
          if (hit && !settled) {
            settled = true;
            resolve(hit);
            // cache-er version dekhale, notun ta ashle page reload hobe
            fromNetwork.then((r) => { if (r && r.ok) notifyUpdated(); }).catch(() => {});
          }
        });
      }, NETWORK_TIMEOUT);
      fromNetwork.then((r) => {
        clearTimeout(timer);
        if (!settled) { settled = true; resolve(r); }
      }).catch(() => {
        clearTimeout(timer);
        if (settled) return;
        fromCache().then((hit) => {
          settled = true;
          resolve(hit || new Response("Offline", { status: 503 }));
        });
      });
    })
  );
});

function notifyUpdated() {
  self.clients.matchAll({ type: "window" }).then((list) =>
    list.forEach((c) => c.postMessage({ type: "CMA_UPDATED" }))
  );
}

self.addEventListener("message", (e) => {
  if (e.data === "SKIP_WAITING") self.skipWaiting();
});
