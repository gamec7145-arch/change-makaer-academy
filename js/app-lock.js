/* =========================================
   CMA APP LOCK
   Shudhu Android app er bhitore kaj kore.
   App khulle ba pause kore abar dhukle login chaibe.
   Browser (Chrome) e kono effect nai.
========================================= */
(function () {
  "use strict";

  var inApp =
    (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) ||
    /CMAApp/i.test(navigator.userAgent);
  if (!inApp) return;

  var hiddenAt = 0;
  var lastFilePick = 0;
  var busy = false;

  // File picker (image upload) khulle app pause hoy; tokhon logout kora jabe na
  document.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest("input[type=file], label")) {
      lastFilePick = Date.now();
    }
  }, true);

  function goLogin() {
    if (/[?&]page=account/.test(location.search)) {
      if (typeof window.renderAccountPage === "function") window.renderAccountPage();
    } else {
      location.href = "?page=account";
    }
  }

  async function lock() {
    if (busy) return;
    busy = true;
    try {
      var client = window.cmaSupabase;
      if (!client) return;
      var res = await client.auth.getSession();
      if (res && res.data && res.data.session) {
        await client.auth.signOut({ scope: "local" });
        window.cmaStudentSession = null;
        goLogin();
      }
    } catch (err) {
      console.error("App lock error:", err);
    } finally {
      busy = false;
    }
  }

  // App prothombar khulle
  window.addEventListener("load", function () { setTimeout(lock, 400); });

  // Pause kore abar dhukle
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") {
      hiddenAt = Date.now();
    } else if (hiddenAt) {
      hiddenAt = 0;
      if (Date.now() - lastFilePick > 60000) lock();
    }
  });
})();
