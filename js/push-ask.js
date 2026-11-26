/* CMA: app khulle-i notification permission chaibe (Android 13+ er system popup).
   Shudhu permission chay. register() KOKHONO call kore na (Firebase na thakle app crash kore). */
(function () {
  "use strict";
  var C = window.Capacitor;
  if (!C || !C.isNativePlatform || !C.isNativePlatform()) return;

  var asking = false;

  async function ask() {
    if (asking) return;
    asking = true;
    try {
      var P = C.Plugins || {};
      // Local-notification plugin age (Firebase lage na), na thakle push plugin er shudhu permission API
      var N = P.LocalNotifications || P.PushNotifications;
      if (!N || !N.checkPermissions || !N.requestPermissions) return;

      var st = await N.checkPermissions();
      var cur = st.display || st.receive;
      if (cur === "prompt" || cur === "prompt-with-rationale") {
        await N.requestPermissions();
      }
    } catch (e) {
      console.warn("push-ask:", e);
    } finally {
      asking = false;
    }
  }

  function start() { setTimeout(ask, 1500); }
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start);
})();
