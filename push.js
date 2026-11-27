/* CMA: Real push notification (Firebase FCM) - shob user er phone e automatic.
   - Native app e (APK) permission nibe, FCM token Supabase e save korbe.
   - Notification e tap korle oi page e niye jabe.
   - Firebase na thakle (purono APK) kichu kore na, tai app crash korbe na:
     workflow secret GOOGLE_SERVICES_JSON dile UA te "CMAPush" jog hoy, tokhon-i register hoy. */
(function () {
  "use strict";
  var C = window.Capacitor;
  if (!C || !C.isNativePlatform || !C.isNativePlatform()) return;
  if (!/CMAPush/.test(navigator.userAgent)) return;

  var P = (C.Plugins || {});
  var Push = P.PushNotifications;
  var Local = P.LocalNotifications;
  if (!Push) return;

  var CHANNEL = "cma_default";
  var started = false;

  function goTo(page) {
    page = String(page || "").trim();
    if (!page || page === "?") { return; }
    if (page.charAt(0) !== "?") page = "?" + page.replace(/^\/+/, "");
    window.location.href = window.location.origin + "/" + page;
  }

  async function saveToken(token) {
    try {
      var db = window.cmaSupabase;
      if (!db || !token) return;
      var uid = null;
      try { var u = await db.auth.getUser(); uid = u && u.data && u.data.user ? u.data.user.id : null; } catch (e) {}
      var res = await db.rpc("register_device_token", { p_token: token, p_user: uid, p_platform: "android" });
      if (res.error) console.warn("push token save:", res.error.message);
      else localStorage.setItem("cma_push_token", token);
    } catch (e) { console.warn("push token save:", e); }
  }

  async function start() {
    if (started) return;
    started = true;
    try {
      var perm = await Push.checkPermissions();
      if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") perm = await Push.requestPermissions();
      if (perm.receive !== "granted") { started = false; return; }

      try { await Push.createChannel({ id: CHANNEL, name: "Change Maker Academy", description: "Class, PDF ও অন্যান্য আপডেট", importance: 5, visibility: 1 }); } catch (e) {}

      Push.addListener("registration", function (t) { saveToken(t && t.value); });
      Push.addListener("registrationError", function (e) { console.warn("push registration:", e); });

      // App khola thakle FCM nijer notification dekhay na, tai nijera dekhai
      Push.addListener("pushNotificationReceived", async function (n) {
        try {
          if (!Local) return;
          await Local.schedule({ notifications: [{
            id: Math.floor(Date.now() % 2147483000),
            title: n.title || "Change Maker Academy",
            body: n.body || "",
            channelId: CHANNEL,
            extra: n.data || {}
          }] });
        } catch (e) {}
      });
      Push.addListener("pushNotificationActionPerformed", function (a) {
        var d = (a && a.notification && a.notification.data) || {};
        goTo(d.page);
      });
      if (Local && Local.addListener) {
        Local.addListener("localNotificationActionPerformed", function (a) {
          var d = (a && a.notification && a.notification.extra) || {};
          goTo(d.page);
        });
      }

      await Push.register();
    } catch (e) { console.warn("push start:", e); started = false; }
  }

  function boot() { setTimeout(start, 2000); }
  if (document.readyState === "complete") boot();
  else window.addEventListener("load", boot);
  document.addEventListener("visibilitychange", function () { if (!document.hidden && !started) start(); });
})();
