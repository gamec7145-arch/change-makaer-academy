/* CMA: app jotobar khulbe (ba background theke ferot ashbe) notification off thakle permission chaibe.
   1) Permission ekhono chaoa hoy ni / Android popup dekhate pare -> system popup
   2) User ager "Don't allow" dieche (Android ar popup dey na) -> nijer popup + Settings button
   register() kokhono call kore na (Firebase chhara app crash kore). */
(function () {
  "use strict";
  var C = window.Capacitor;
  if (!C || !C.isNativePlatform || !C.isNativePlatform()) return;

  var busy = false;
  var lastRun = 0;

  function notifPlugin() {
    var P = C.Plugins || {};
    return P.LocalNotifications || P.PushNotifications || null;
  }
  function settingsPlugin() {
    try { return C.registerPlugin("NotificationSettings"); } catch (e) { return null; }
  }

  function injectStyle() {
    if (document.getElementById("cma-np-style")) return;
    var s = document.createElement("style");
    s.id = "cma-np-style";
    s.textContent =
      "#cma-np{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(20,16,30,.55);font-family:system-ui,-apple-system,sans-serif}" +
      "#cma-np .box{width:100%;max-width:340px;background:#fff;color:#1C2236;border-radius:20px;padding:22px 20px;text-align:center;box-shadow:0 24px 60px -20px rgba(0,0,0,.5)}" +
      "#cma-np h3{margin:0 0 6px;font-size:18px}" +
      "#cma-np p{margin:4px 0;font-size:14px;color:#69728A;line-height:1.5}" +
      "#cma-np .hint{color:#C92A44;font-size:13px;margin-top:8px;display:none}" +
      "#cma-np .row{display:flex;gap:10px;margin-top:16px}" +
      "#cma-np button{flex:1;border:0;border-radius:12px;padding:12px;font-size:15px;font-weight:600;cursor:pointer}" +
      "#cma-np .pri{color:#fff;background:linear-gradient(135deg,#EF4A52,#C92A44)}" +
      "#cma-np .sec{background:#FFF2F1;color:#69728A}";
    document.head.appendChild(s);
  }

  function closeDialog() {
    var d = document.getElementById("cma-np");
    if (d) d.remove();
  }

  function showDialog() {
    if (document.getElementById("cma-np")) return;
    injectStyle();
    var d = document.createElement("div");
    d.id = "cma-np";
    d.innerHTML =
      '<div class="box">' +
      "<h3>নোটিফিকেশন বন্ধ আছে</h3>" +
      "<p>ক্লাস, পরীক্ষা ও নতুন আপডেট মিস না করতে নোটিফিকেশন চালু করুন।</p>" +
      '<p class="hint">সেটিংস খোলা যায়নি। ফোনের Settings → Apps → Change Maker Academy → Notifications থেকে চালু করুন।</p>' +
      '<div class="row"><button class="sec" type="button" data-a="later">পরে</button>' +
      '<button class="pri" type="button" data-a="open">চালু করুন</button></div></div>';
    d.addEventListener("click", function (e) {
      var a = e.target && e.target.getAttribute && e.target.getAttribute("data-a");
      if (a === "later") { closeDialog(); return; }
      if (a === "open") {
        var S = settingsPlugin();
        if (!S || !S.open) { d.querySelector(".hint").style.display = "block"; return; }
        S.open().catch(function () { d.querySelector(".hint").style.display = "block"; });
      }
    });
    document.body.appendChild(d);
  }

  async function check() {
    if (busy) return;
    busy = true;
    try {
      var N = notifPlugin();
      if (!N || !N.checkPermissions) return;

      var st = await N.checkPermissions();
      var cur = st.display || st.receive;

      if (cur === "granted") { closeDialog(); return; }

      if (cur === "prompt" || cur === "prompt-with-rationale") {
        var r = await N.requestPermissions();
        cur = r.display || r.receive;
        if (cur === "granted") { closeDialog(); return; }
      }
      // denied (ager bar "Don't allow" dieche, Android ar system popup dekhabe na) -> nijer popup
      showDialog();
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

  // Background theke ferot ashle (ba Settings theke ferot ashle) abar check
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && Date.now() - lastRun > 1500) check();
  });
})();
