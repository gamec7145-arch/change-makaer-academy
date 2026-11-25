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
    const video = window.CMAVideo.parse(row.youtube_url);
    return video ? video.thumb : "";
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

  // Story video popup (.rv-modal style index.html e ache)
  let modal = null;
  function closeStory() {
    if (!modal) return;
    modal.classList.remove("open");
    modal.querySelector(".rv-frame").replaceChildren();
  }
  function openStory(row) {
    if (!modal) {
      modal = document.createElement("div");
      modal.className = "rv-modal";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.innerHTML = '<div class="rv-wrap" style="position:relative;width:100%;max-width:720px">' +
        '<button type="button" class="rv-x" aria-label="Close">\u00d7</button>' +
        '<div class="rv-box"><div class="rv-frame"></div></div>' +
        '<a class="rv-open" target="_blank" rel="noopener noreferrer" style="display:block;margin-top:12px;text-align:center;color:#fff;font-weight:800">ভিডিও না চললে এখানে চাপ দাও ↗</a></div>';
      document.body.appendChild(modal);
      modal.addEventListener("click", e => { if (e.target === modal || e.target.closest(".rv-x")) closeStory(); });
      document.addEventListener("keydown", e => { if (e.key === "Escape") closeStory(); });
      window.addEventListener("popstate", closeStory);
    }
    const video = window.CMAVideo.parse(row.video_url);
    const frame = modal.querySelector(".rv-frame");
    const open = modal.querySelector(".rv-open");
    const raw = String(row.video_url || "").trim();
    if (video) {
      frame.replaceChildren(window.CMAVideo.player(video, row.title, true));
    } else {
      const note = document.createElement("p");
      note.textContent = "এই ভিডিওর লিংকটি এখানে চালানো যাচ্ছে না।";
      note.style.cssText = "color:#fff;text-align:center;padding:40px 16px;margin:0";
      frame.replaceChildren(note);
    }
    const href = video ? video.url : (/^https?:\/\//i.test(raw) ? raw : "");
    open.style.display = href ? "block" : "none";
    if (href) open.href = href; else open.removeAttribute("href");
    modal.classList.add("open");
  }

  function renderStories(rows) {
    const host = document.getElementById("cmaReviewCarousel");
    if (!host || !rows.length) return;
    host.innerHTML = rows.map((row, index) => {
      const video = window.CMAVideo.parse(row.video_url);
      const thumb = String(row.thumbnail_url || "").trim() || (video ? video.thumb : "");
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
