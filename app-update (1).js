/* =========================================
   CMA APP UPDATE
   Shudhu Android app e: app khulle notun version ache ki check kore,
   thakle popup dekhay. Update -> app er vitore download -> Install.
========================================= */
(function () {
  "use strict";

  var C = window.Capacitor;
  var inApp = C && C.isNativePlatform && C.isNativePlatform();

  // ---- TEMP DEBUG: shudhu CMA Android app e (UA te "CMAApp") ekta chhoto message dekhay ----
  var isCmaApp = /CMAApp/.test(navigator.userAgent || "");
  function dbg(msg) {
    if (!isCmaApp) return;
    var run = function () {
      var d = document.createElement("div");
      d.textContent = "UPDATE CHECK: " + msg;
      d.style.cssText = "position:fixed;left:12px;right:12px;bottom:90px;z-index:2147483600;background:#1c2236;color:#fff;padding:10px 14px;border-radius:12px;font:13px/1.4 system-ui,sans-serif;text-align:center;opacity:.95";
      d.addEventListener("click", function () { d.remove(); });
      document.body.appendChild(d);
      setTimeout(function () { d.remove(); }, 9000);
    };
    if (document.body) run(); else document.addEventListener("DOMContentLoaded", run);
  }

  if (!inApp || !C.registerPlugin) {
    dbg("native bridge paoa jayni (Capacitor " + (C ? "ache, native noy" : "nei") + ")");
    return;
  }

  var Updater = C.registerPlugin("AppUpdate");
  var checking = false;
  var shown = false;

  function injectStyle() {
    if (document.getElementById("cma-upd-style")) return;
    var s = document.createElement("style");
    s.id = "cma-upd-style";
    s.textContent =
      "#cma-upd{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(20,16,30,.55);font-family:system-ui,-apple-system,sans-serif}" +
      "#cma-upd .box{width:100%;max-width:340px;background:#fff;color:#1C2236;border-radius:20px;padding:22px 20px;text-align:center;box-shadow:0 24px 60px -20px rgba(0,0,0,.5)}" +
      "#cma-upd img{width:56px;height:56px;border-radius:14px;object-fit:contain}" +
      "#cma-upd h3{margin:10px 0 4px;font-size:18px}" +
      "#cma-upd p{margin:4px 0;font-size:14px;color:#69728A;line-height:1.45}" +
      "#cma-upd .ver{font-weight:600;color:#C92A44}" +
      "#cma-upd .bar{height:8px;border-radius:99px;background:#F6DEDD;overflow:hidden;margin:16px 0 4px;display:none}" +
      "#cma-upd .bar i{display:block;height:100%;width:0;background:linear-gradient(135deg,#EF4A52,#C92A44);transition:width .2s}" +
      "#cma-upd .row{display:flex;gap:10px;margin-top:16px}" +
      "#cma-upd button{flex:1;border:0;border-radius:12px;padding:12px;font-size:15px;font-weight:600;cursor:pointer}" +
      "#cma-upd .pri{color:#fff;background:linear-gradient(135deg,#EF4A52,#C92A44)}" +
      "#cma-upd .sec{background:#FFF2F1;color:#69728A}" +
      "#cma-upd button:disabled{opacity:.6}";
    document.head.appendChild(s);
  }

  function showPopup(info, cur) {
    if (shown) return;
    shown = true;
    injectStyle();

    var wrap = document.createElement("div");
    wrap.id = "cma-upd";
    wrap.innerHTML =
      '<div class="box">' +
      '<img src="change-maker-logo.png" alt="">' +
      "<h3>নতুন আপডেট এসেছে</h3>" +
      '<p class="ver">ভার্সন ' + (info.versionName || info.versionCode) + "</p>" +
      '<p class="notes"></p>' +
      '<div class="bar"><i></i></div>' +
      '<p class="status"></p>' +
      '<div class="row"><button class="sec" id="cma-upd-later">পরে</button>' +
      '<button class="pri" id="cma-upd-go">আপডেট করো</button></div>' +
      "</div>";
    document.body.appendChild(wrap);

    var notes = wrap.querySelector(".notes");
    var status = wrap.querySelector(".status");
    var bar = wrap.querySelector(".bar");
    var fill = bar.querySelector("i");
    var go = wrap.querySelector("#cma-upd-go");
    var later = wrap.querySelector("#cma-upd-later");
    var stage = "update";

    notes.textContent = info.notes || "";
    if (info.force) later.style.display = "none";

    later.addEventListener("click", function () {
      wrap.remove();
      shown = false;
    });

    go.addEventListener("click", function () {
      if (stage === "update") startDownload();
      else if (stage === "install") doInstall();
    });

    function startDownload() {
      stage = "busy";
      go.disabled = true;
      later.style.display = "none";
      bar.style.display = "block";
      status.textContent = "ডাউনলোড হচ্ছে… 0%";

      var handle = Updater.addListener("downloadProgress", function (e) {
        fill.style.width = e.percent + "%";
        status.textContent = "ডাউনলোড হচ্ছে… " + e.percent + "%";
      });

      var url = new URL(info.apkUrl, location.origin + "/").href +
        "?v=" + encodeURIComponent(info.versionCode);

      Updater.download({ url: url }).then(function () {
        Promise.resolve(handle).then(function (h) { h && h.remove && h.remove(); });
        fill.style.width = "100%";
        status.textContent = "ডাউনলোড শেষ। ইনস্টল বাটনে ট্যাপ করো।";
        go.textContent = "ইনস্টল করো";
        go.disabled = false;
        stage = "install";
      }).catch(function (err) {
        Promise.resolve(handle).then(function (h) { h && h.remove && h.remove(); });
        status.textContent = "ডাউনলোড হয়নি। ইন্টারনেট চেক করে আবার চেষ্টা করো।";
        go.textContent = "আবার চেষ্টা করো";
        go.disabled = false;
        stage = "update";
        if (!info.force) later.style.display = "";
        console.error("Update download error:", err);
      });
    }

    function doInstall() {
      Updater.install().then(function () {
        status.textContent = "ইনস্টল স্ক্রিনে 'Install' এ ট্যাপ করো।";
      }).catch(function (err) {
        if (err && (err.message === "permission" || err === "permission")) {
          status.textContent =
            "Settings এ 'Allow from this source' অন করে ব্যাক এসো, তারপর আবার ইনস্টলে ট্যাপ করো।";
        } else {
          status.textContent = "ইনস্টল শুরু হয়নি। আবার চেষ্টা করো।";
          console.error("Update install error:", err);
        }
      });
    }
  }

  function check() {
    if (checking || shown) return;
    checking = true;
    Promise.all([
      Updater.getVersion(),
      fetch("version.json?t=" + Date.now(), { cache: "no-store" }).then(function (r) {
        if (!r.ok) throw new Error("version.json " + r.status);
        return r.json();
      })
    ]).then(function (res) {
      var cur = Number(res[0].versionCode);
      var latest = Number(res[1].versionCode);
      dbg("app v" + cur + " | server v" + latest + (latest > cur ? " -> popup" : " -> update nei"));
      if (latest > cur) showPopup(res[1], cur);
    }).catch(function (e) {
      dbg("ERROR: " + ((e && (e.message || e.errorMessage)) || JSON.stringify(e) || e));
      console.error("Update check error:", e);
    }).then(function () {
      checking = false;
      if (!shown) checkWeb();
    });
  }

  // ---- Site (design / logo / content) update: sw.js er VERSION bodlale popup ----
  var WEB_KEY = "cmaWebVer";
  function showWebPopup(newVer) {
    if (shown) return;
    shown = true;
    injectStyle();
    var wrap = document.createElement("div");
    wrap.id = "cma-upd";
    wrap.innerHTML =
      '<div class="box">' +
      '<img src="change-maker-logo.png" alt="">' +
      "<h3>নতুন আপডেট এসেছে</h3>" +
      '<p>অ্যাপের ডিজাইন ও কন্টেন্টে নতুন পরিবর্তন এসেছে।</p>' +
      '<p class="status"></p>' +
      '<div class="row"><button class="sec" id="cma-web-later">পরে</button>' +
      '<button class="pri" id="cma-web-go">আপডেট করো</button></div>' +
      "</div>";
    document.body.appendChild(wrap);
    wrap.querySelector("#cma-web-later").addEventListener("click", function () {
      wrap.remove();
      shown = false;
    });
    wrap.querySelector("#cma-web-go").addEventListener("click", function () {
      wrap.querySelector(".status").textContent = "আপডেট হচ্ছে…";
      try { localStorage.setItem(WEB_KEY, newVer); } catch (e) {}
      var done = function () { location.reload(); };
      if (window.caches && caches.keys) {
        caches.keys().then(function (ks) {
          return Promise.all(ks.map(function (k) { return caches.delete(k); }));
        }).then(done, done);
      } else {
        done();
      }
    });
  }

  function checkWeb() {
    if (shown) return;
    fetch("/sw.js?t=" + Date.now(), { cache: "no-store" })
      .then(function (r) { return r.ok ? r.text() : ""; })
      .then(function (t) {
        var m = t.match(/VERSION\s*=\s*"([^"]+)"/);
        if (!m) return;
        var latest = m[1], old = null;
        try { old = localStorage.getItem(WEB_KEY); } catch (e) {}
        if (!old) { try { localStorage.setItem(WEB_KEY, latest); } catch (e) {} return; }
        if (old !== latest) showWebPopup(latest);
      })
      .catch(function () {});
  }

  // app khulle ar background theke ferot ele check
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", check);
  } else {
    check();
  }
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) check();
  });
})();
