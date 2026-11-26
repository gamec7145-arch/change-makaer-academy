/* CMA: app jotobar khulbe (ba background theke ferot ashbe) notification off thakle
   shudhu Android er system permission popup chaibe. Nijer kono popup nai.
   register() kokhono call kore na (Firebase chhara app crash kore). */
(function () {
  "use strict";
  var C = window.Capacitor;
  if (!C || !C.isNativePlatform || !C.isNativePlatform()) return;

  var busy = false;
  var lastRun = 0;

  async function check() {
    if (busy) return;
    busy = true;
    try {
      var P = C.Plugins || {};
      var N = P.LocalNotifications || P.PushNotifications;
      if (!N || !N.checkPermissions || !N.requestPermissions) return;

      var st = await N.checkPermissions();
      var cur = st.display || st.receive;
      if (cur === "prompt" || cur === "prompt-with-rationale") {
        await N.requestPermissions();   // Android er system popup
      }
    } catch (e) {
      console.warn("push-ask:", e);
    } finally {
      busy = false;
      lastRun = Date.now();
    }
  }

  function start() { setTimeout(check, 1500); }
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start);

  // Background theke ferot ashle abar check
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && Date.now() - lastRun > 1500) check();
  });
})();
