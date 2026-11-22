/* =========================================
   CMA APP UPDATE
   Shudhu Android app e: app khulle notun version ache ki check kore,
   thakle popup dekhay. Update -> app er vitore download -> Install.
========================================= */
(function () {
  "use strict";

  var C = window.Capacitor;
  var inApp = !!(C && C.isNativePlatform && C.isNativePlatform());
  var isCmaApp = /CMAApp/.test(navigator.userAgent || "");
  if (!inApp && !isCmaApp) return;   // normal browser e kichu korbe na

  var Updater = (inApp && C.registerPlugin) ? C.registerPlugin("AppUpdate") : null;
  // Plugin na thakle (purano APK) app er version UA theke pai: "CMAApp/126"
  function uaVersion() {
    var m = /CMAApp\/(\d+)/.exec(navigator.userAgent || "");
    return m ? Number(m[1]) : 0;
  }
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

  function showPopup(info, cur, nativeOK) {
    // Default: Chrome e download. info.installMode === "inapp" hole app er vitore download (plugin lagbe)
    var viaChrome = !nativeOK || info.installMode !== "inapp";
    if (shown) return;
    shown = true;
    injectStyle();

    var wrap = document.createElement("div");
    wrap.id = "cma-upd";
    wrap.innerHTML =
      '<div class="box">' +
      '<img src="change-maker-logo.png" alt="">' +
      "<h3>" + (viaChrome ? "New update available" : "নতুন আপডেট এসেছে") + "</h3>" +
      '<p class="ver">' + (viaChrome ? "Version " : "ভার্সন ") + (info.versionName || info.versionCode) + "</p>" +
      '<p class="notes"></p>' +
      '<div class="bar"><i></i></div>' +
      '<p class="status"></p>' +
      '<div class="row"><button class="sec" id="cma-upd-later">' + (viaChrome ? "Later" : "পরে") + '</button>' +
      '<button class="pri" id="cma-upd-go">' + (viaChrome ? "Install now" : "আপডেট করো") + '</button></div>' +
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

    if (viaChrome) {
      status.textContent = "Chrome will open and download the update. Open the downloaded file to install.";
    }

    go.addEventListener("click", function () {
      if (viaChrome) return openExternal(info);
      if (stage === "update") startDownload();
      else if (stage === "install") doInstall();
    });

    function openExternal(info) {
      // Website er APK link (homepage er install button er link-ei) -> Chrome download kore
      var url = new URL(info.apkUrl, location.origin + "/").href +
        "?v=" + encodeURIComponent(info.versionCode);
      var fallback = function () {
        // Purano APK (native method nei): GitHub link e giye default browser (Chrome) e khulbe
        if (info.externalUrl) location.href = info.externalUrl;
        else { try { window.open(url, "_blank"); } catch (e) {} }
      };
      if (Updater && Updater.openInChrome) {
        Updater.openInChrome({ url: url }).catch(fallback);
      } else {
        fallback();
      }
    }

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

  function installedVersion() {
    if (!Updater) return Promise.resolve({ code: uaVersion(), native: false });
    return Updater.getVersion().then(function (r) {
      return { code: Number(r.versionCode), native: true };
    }).catch(function () {
      return { code: uaVersion(), native: false };   // purano APK: plugin nei
    });
  }

  function check() {
    if (checking || shown) return;
    checking = true;
    Promise.all([
      installedVersion(),
      fetch("version.json?t=" + Date.now(), { cache: "no-store" }).then(function (r) {
        if (!r.ok) throw new Error("version.json " + r.status);
        return r.json();
      })
    ]).then(function (res) {
      var cur = res[0].code;
      var latest = Number(res[1].versionCode);
      if (latest > cur) showPopup(res[1], cur, res[0].native);
    }).catch(function (e) {
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
