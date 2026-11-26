/* CMA: app khulle-i notification permission chaibe (Android 13+ er system popup).
   Shudhu Android app e cholbe; website e kichu korbe na. */
(function () {
  "use strict";
  var C = window.Capacitor;
  if (!C || !C.isNativePlatform || !C.isNativePlatform()) return;

  var KEY = "cma_push_asked_at";

  async function ask() {
    try {
      var P = C.Plugins && C.Plugins.PushNotifications;
      if (!P) return;

      var st = await P.checkPermissions();
      if (st.receive === "granted") { try { await P.register(); } catch (e) {} return; }

      // "denied" hole Android r popup dekhay na (user 2 bar deny korle) - tai shudhu prompt state e chai
      if (st.receive === "prompt" || st.receive === "prompt-with-rationale") {
        var r = await P.requestPermissions();
        try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {}
        if (r.receive === "granted") { try { await P.register(); } catch (e) {} }
      }
    } catch (e) { console.warn("push-ask:", e); }
  }

  // intro/splash shesh hole, ektu por popup ashbe
  function start() { setTimeout(ask, 1500); }
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start);

  // Settings theke permission on kore ferot ashle abar check
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) ask();
  });
})();
