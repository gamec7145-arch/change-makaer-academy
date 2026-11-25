/* =========================================================
   CHANGE MAKER ACADEMY — HOMEPAGE DYNAMIC CONTENT
   - Free Class cards: public active rows from free_videos
   - Student stories: public active rows from student_stories
   - Story videos open in an accessible modal player
========================================================= */
(function () {
  "use strict";

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));

  function youtubeId(value) {
    const input = String(value || "").trim();
    if (/^[\w-]{11}$/.test(input)) return input;
    const patterns = [
      /(?:youtube(?:-nocookie)?\.com\/(?:embed|shorts|live)\/)([\w-]{11})/i,
      /(?:youtu\.be\/)([\w-]{11})/i,
      /[?&]v=([\w-]{11})/i
    ];
    for (const pattern of patterns) { const m = input.match(pattern); if (m) return m[1]; }
    try {
      const u = new URL(input);
      const host = u.hostname.replace(/^www\./i, "").toLowerCase();
      if (host === "youtu.be") return u.pathname.split("/").filter(Boolean)[0] || "";
      if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
        const v = u.searchParams.get("v"); if (v) return v;
        const parts = u.pathname.split("/").filter(Boolean);
        const i = parts.findIndex(x => ["embed", "shorts", "live", "v"].includes(x));
        if (i >= 0) return parts[i + 1] || "";
      }
    } catch (_) {}
    return "";
  }

  function dbReady() {
    return new Promise(async resolve => {
      for (let i = 0; i < 50; i++) {
        const db = window.cmaSupabase;
        if (db && typeof db.from === "function") return resolve(db);
        await wait(150);
      }
      resolve(null);
    });
  }

  function freeImage(row) {
    const explicit = String(row.thumbnail_url || row.home_thumbnail_url || "").trim();
    if (/^https?:\/\//i.test(explicit)) return explicit;
    const id = youtubeId(row.youtube_url);
    return id ? "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg" : "";
  }

  function renderFreeVideos(rows) {
    const host = document.querySelector(".cma-free-classes .cma-videos");
    if (!host || !rows.length) return;
    host.innerHTML = rows.map(row => {
      const image = freeImage(row);
      const batch = String(row.batch || "").toLowerCase() === "hsc" ? "HSC" : "SSC";
      return '<a href="?page=free-video-' + encodeURIComponent(row.id) + '" data-cma-home-class="1">' +
        '<span>' + (image ? '<img src="' + esc(image) + '" alt="" loading="lazy">' : '<b aria-hidden="true">▶</b>') + '</span>' +
        '<b>' + esc(row.title || "ফ্রি ক্লাস") + ' <small>• ' + batch + '</small></b></a>';
    }).join("");
    document.dispatchEvent(new CustomEvent("cma:homepage-content-updated", { detail: { section: "free-classes", count: rows.length } }));
  }

  function ensureStoryModal() {
    let modal = document.getElementById("cmaStoryVideoModal");
    if (modal) return modal;
    const style = document.createElement("style");
    style.id = "cmaStoryVideoModalStyle";
    style.textContent = '#cmaStoryVideoModal{position:fixed;inset:0;z-index:99999;background:rgba(8,13,25,.88);display:none;align-items:center;justify-content:center;padding:18px;box-sizing:border-box}#cmaStoryVideoModal.open{display:flex}#cmaStoryVideoModal .cma-story-dialog{width:min(900px,100%);background:#111827;border-radius:18px;overflow:hidden;position:relative;box-shadow:0 25px 80px rgba(0,0,0,.4)}#cmaStoryVideoModal .cma-story-close{position:absolute;right:10px;top:10px;z-index:2;width:42px;height:42px;border:0;border-radius:50%;background:rgba(0,0,0,.72);color:#fff;font-size:28px;line-height:1;cursor:pointer}#cmaStoryVideoModal .cma-story-frame{aspect-ratio:16/9;background:#000}#cmaStoryVideoModal iframe{width:100%;height:100%;border:0;display:block}#cmaStoryVideoModal .cma-story-title{padding:12px 16px;color:#fff;font-weight:800}';
    document.head.appendChild(style);
    modal = document.createElement("div");
    modal.id = "cmaStoryVideoModal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "Student story video");
    modal.innerHTML = '<div class="cma-story-dialog"><button type="button" class="cma-story-close" aria-label="Close">×</button><div class="cma-story-frame"></div><div class="cma-story-title"></div></div>';
    document.body.appendChild(modal);
    const close = () => { modal.classList.remove("open"); modal.querySelector(".cma-story-frame").innerHTML = ""; };
    modal.querySelector(".cma-story-close").addEventListener("click", close);
    modal.addEventListener("click", e => { if (e.target === modal) close(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
    return modal;
  }

  function openStory(row) {
    const id = youtubeId(row.video_url);
    if (!id) {
      console.warn("Student story has an unsupported YouTube URL", row.id, row.video_url);
      return;
    }
    const modal = ensureStoryModal();
    const frame = modal.querySelector(".cma-story-frame");
    const iframe = document.createElement("iframe");
    iframe.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) + "?autoplay=1&rel=0";
    iframe.title = row.title || "Student story";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    frame.replaceChildren(iframe);
    modal.querySelector(".cma-story-title").textContent = row.title || row.student_name || "শিক্ষার্থীর অভিজ্ঞতা";
    modal.classList.add("open");
  }

  function renderStories(rows) {
    const host = document.getElementById("cmaReviewCarousel");
    if (!host || !rows.length) return;
    host.innerHTML = rows.map((row, index) => {
      const id = youtubeId(row.video_url);
      const thumb = String(row.thumbnail_url || "").trim() || (id ? "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg" : "");
      const title = row.title || row.student_name || "শিক্ষার্থীর অভিজ্ঞতা";
      const sub = [row.student_name, row.class_label].filter(Boolean).join(" • ") || "শিক্ষার্থীর অভিজ্ঞতা";
      return '<a class="cma-review-card" href="#" data-cma-story-index="' + index + '">' +
        '<span class="rv-media"' + (thumb ? ' style="background-image:url(&quot;' + esc(thumb) + '&quot;);background-size:cover;background-position:center"' : '') + '>' +
        '<em class="rv-chip">ভিডিও</em><i class="rv-play"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 001.5.86l11-6.5a1 1 0 000-1.72l-11-6.5A1 1 0 008 5.5z"/></svg></i></span>' +
        '<span class="rv-info"><b>' + esc(title) + '</b><small>' + esc(sub) + '</small></span></a>';
    }).join("");
    host.querySelectorAll("[data-cma-story-index]").forEach(card => {
      card.addEventListener("click", event => {
        event.preventDefault();
        const row = rows[Number(card.getAttribute("data-cma-story-index"))];
        if (row) openStory(row);
      });
    });
    document.dispatchEvent(new CustomEvent("cma:homepage-content-updated", { detail: { section: "student-stories", count: rows.length } }));
  }

  async function fetchRows(db, table) {
    const result = await db.from(table).select("*").eq("is_active", true).order("sort_order", { ascending: true });
    if (result.error) throw result.error;
    return Array.isArray(result.data) ? result.data : [];
  }

  async function init() {
    const db = await dbReady();
    if (!db) { console.warn("Homepage dynamic content: Supabase client not ready"); return; }
    try {
      const rows = await fetchRows(db, "free_videos");
      renderFreeVideos(rows.filter(row => row.is_homepage === true || row.is_homepage === "true"));
    } catch (error) { console.error("Homepage Free Classes could not load:", error); }
    try {
      const stories = await fetchRows(db, "student_stories");
      renderStories(stories);
    } catch (error) { console.error("Homepage Student Stories could not load:", error); }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
