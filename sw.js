/* CMA Service Worker: network-first with timeout, cache fallback.
   Slow/unstable net e-o app khulbe; notun deploy hole auto update hobe. */
const VERSION = "cma-v11";
const CACHE = "cma-cache-" + VERSION;
const CORE = [
  "./", "index.html", "css/style.css", "css/cma-community-design.css?v=2",
  "js/shared.js", "js/home.js", "js/navigation.js", "js/offline-batches.js",
  "js/online-batches.js", "js/exam-preparation.js", "js/study-materials.js",
  "js/supabase-config.js", "js/account.js", "js/app-lock.js", "js/screen-guard.js",
  "js/app-update.js", "js/free-courses.js", "js/class-prep.js", "js/admission.js", "js/teachers.js", "js/router.js", "cma-logo.png",
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
];
const NETWORK_TIMEOUT = 4000;

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      Promise.all(CORE.map((u) =>
        fetch(u, { mode: u.startsWith("http") ? "no-cors" : "same-origin" })
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

function timeoutFetch(req) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), NETWORK_TIMEOUT);
    fetch(req).then((r) => { clearTimeout(t); resolve(r); }, (err) => { clearTimeout(t); reject(err); });
  });
}

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

  // Page navigation: SPA, ?page=... shob index.html diye
  const isNav = req.mode === "navigate";
  e.respondWith(
    timeoutFetch(req).then((r) => {
      if (r && r.ok) {
        const copy = r.clone();
        caches.open(CACHE).then((c) => c.put(isNav ? "index.html" : req, copy));
      }
      return r;
    }).catch(() =>
      caches.match(isNav ? "index.html" : req, { ignoreSearch: false }).then((hit) =>
        hit || caches.match(req, { ignoreSearch: true }) || new Response("Offline", { status: 503 })
      )
    )
  );
});
