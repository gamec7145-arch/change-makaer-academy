/* =========================================
   CMA SCREEN GUARD
   Shudhu Android app e: Community section e screenshot /
   screen recording block. Baki shob jaygay screenshot kaj korbe.
========================================= */
(function () {
  "use strict";

  var C = window.Capacitor;
  var inApp = C && C.isNativePlatform && C.isNativePlatform();
  if (!inApp || !C.registerPlugin) return;

  var Guard = C.registerPlugin("ScreenGuard");
  var current = null;

  function isCommunity() {
    var page = new URLSearchParams(location.search).get("page") || "";
    return page === "community" || page.indexOf("community-") === 0;
  }

  function sync() {
    var want = isCommunity();
    if (want === current) return;
    current = want;
    Guard.setSecure({ secure: want }).catch(function (e) {
      current = null;
      console.error("ScreenGuard error:", e);
    });
  }

  ["pushState", "replaceState"].forEach(function (name) {
    var orig = history[name];
    history[name] = function () {
      var r = orig.apply(this, arguments);
      setTimeout(sync, 0);
      return r;
    };
  });
  window.addEventListener("popstate", sync);
  document.addEventListener("click", function () { setTimeout(sync, 150); }, true);
  document.addEventListener("visibilitychange", function () { current = null; sync(); });
  setInterval(sync, 1000);
  sync();
})();
