/* =========================================================
   CHANGE MAKER ACADEMY — HOMEPAGE DYNAMIC FREE CLASS CARDS
   Admin-managed rows live in free_videos with is_homepage=true.
   Clicking a card opens the existing Free Class watch/comments page.
========================================================= */
(function () {
  "use strict";
  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function videoId(url) {
    var m = String(url || "").match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/i);
    return m ? m[1] : (/^[\w-]{11}$/.test(String(url || "")) ? String(url) : "");
  }
  function imageFor(row) {
    var url = String(row.thumbnail_url || row.home_thumbnail_url || "").trim();
    if (/^https:\/\//i.test(url)) return url;
    var id = videoId(row.youtube_url);
    return id ? "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg" : "";
  }
  function render(rows) {
    var host = document.querySelector(".cma-free-classes .cma-videos");
    if (!host || !rows.length) return;
    host.innerHTML = rows.map(function (row) {
      var image = imageFor(row);
      var batch = String(row.batch || "").toLowerCase() === "hsc" ? "HSC" : "SSC";
      return '<a href="?page=free-video-' + encodeURIComponent(row.id) + '" data-cma-home-class="1">' +
        '<span>' + (image ? '<img src="' + escapeHtml(image) + '" alt="" loading="lazy">' : '<b aria-hidden="true">▶</b>') + '</span>' +
        '<b>' + escapeHtml(row.title || "ফ্রি ক্লাস") + ' <small>• ' + batch + '</small></b></a>';
    }).join("");
  }
  async function init() {
    var db = window.cmaSupabase;
    if (!db || typeof db.from !== "function") return;
    try {
      var result = await db.from("free_videos").select("id,title,youtube_url,thumbnail_url,home_thumbnail_url,batch,sort_order")
        .eq("is_homepage", true).eq("is_active", true)
        .order("sort_order", { ascending: true }).limit(12);
      if (!result.error && Array.isArray(result.data)) render(result.data);
    } catch (error) { console.warn("Homepage Free Classes could not load:", error); }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
