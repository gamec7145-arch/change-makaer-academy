// ==================================================
// CHANGE MAKER ACADEMY
// FREE COURSES (student side)
//  - Homepage direct free-class cards (thumbnail + play)
//  - Step by step: Batch > Subject > Chapter > Video posts > Watch + comments
// Data comes from Supabase tables: free_subjects, free_chapters, free_videos, free_comments
// ==================================================
(function () {
  "use strict";

  const sb = () => window.cmaSupabase;
  const $ = id => document.getElementById(id);

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function safeUrl(u) {
    u = String(u || "").trim();
    return /^https?:\/\//i.test(u) ? u : "";
  }
  function ytId(url) {
    url = String(url || "").trim();
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/i);
    if (m) return m[1];
    return /^[\w-]{11}$/.test(url) ? url : "";
  }
  const PLAY_SVG = '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 001.5.86l11-6.5a1 1 0 000-1.72l-11-6.5A1 1 0 008 5.5z"/></svg>';

  // ---------- styles ----------
  const css = document.createElement("style");
  css.id = "cma-free-courses-css";
  css.textContent = `
  .fc-grid{display:grid;gap:18px;grid-template-columns:1fr}
  @media(min-width:700px){.fc-grid{grid-template-columns:repeat(2,1fr)}}
  @media(min-width:1000px){.fc-grid{grid-template-columns:repeat(3,1fr)}}
  .fc-card{display:block;text-decoration:none;color:#1a2238;background:#fff;border:1px solid #f3dcdf;border-radius:26px;overflow:hidden;box-shadow:0 18px 40px -26px rgba(40,30,50,.45);transition:transform .2s}
  .fc-card:active{transform:scale(.985)}
  .fc-thumb{position:relative;aspect-ratio:16/9;background:linear-gradient(135deg,#243b63,#6d8bb0);overflow:hidden}
  .fc-thumb.alt{background:linear-gradient(135deg,#7b1a30,#ec5560)}
  .fc-thumb img{width:100%;height:100%;object-fit:cover;display:block}
  .fc-play{position:absolute;inset:0;display:grid;place-items:center}
  .fc-play span{width:70px;height:70px;border-radius:50%;display:grid;place-items:center;color:#fff;background:rgba(255,255,255,.22);border:3px solid #fff;backdrop-filter:blur(4px);box-shadow:0 10px 30px rgba(0,0,0,.25)}
  .fc-body{padding:16px 18px 20px;text-align:center}
  .fc-body h3{margin:0;font-size:20px;font-weight:800;line-height:1.35}
  .fc-body p{margin:6px 0 0;color:#6b7482;font-size:14px}
  .fc-batch{display:flex;align-items:center;gap:16px;padding:22px;text-decoration:none;color:#1a2238;background:#fff;border:1px solid #f3dcdf;border-radius:26px;box-shadow:0 18px 40px -26px rgba(40,30,50,.45)}
  .fc-batch b{display:grid;place-items:center;width:64px;height:64px;border-radius:20px;color:#fff;font-size:20px;background:linear-gradient(135deg,#ec5560,#c92a44)}
  .fc-batch h3{margin:0;font-size:22px}.fc-batch p{margin:4px 0 0;color:#6b7482}
  .fc-msg{padding:34px 18px;text-align:center;color:#6b7482;font-weight:700}
  .fc-watch{display:grid;gap:18px}
  .fc-player{position:relative;aspect-ratio:16/9;border-radius:22px;overflow:hidden;background:#000;box-shadow:0 18px 40px -22px rgba(0,0,0,.6)}
  .fc-player iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
  .fc-title{margin:4px 0 0;font-size:24px;font-weight:800;color:#1a2238}
  .fc-box{background:#fff;border:1px solid #f3dcdf;border-radius:22px;padding:16px 18px}
  .fc-teacher{display:flex;align-items:center;gap:14px}
  .fc-teacher img,.fc-ava{width:56px;height:56px;border-radius:50%;object-fit:cover;background:linear-gradient(135deg,#ec5560,#c92a44);color:#fff;display:grid;place-items:center;font-weight:800;font-size:22px;flex:0 0 auto}
  .fc-teacher b{display:block;font-size:18px}.fc-teacher small{color:#6b7482}
  .fc-h{margin:6px 0 0;font-size:20px;font-weight:800;color:#1a2238}
  .fc-sheet{display:inline-flex;align-items:center;gap:10px;padding:12px 18px;border-radius:16px;background:#fff0f1;color:#c92a44;font-weight:800;text-decoration:none}
  .fc-list{display:grid;gap:10px}
  .fc-item{display:flex;gap:12px;align-items:center;padding:10px;border-radius:18px;background:#fff;border:1px solid #f3dcdf;text-decoration:none;color:#1a2238}
  .fc-item.on{background:#fff0f1;border-color:#ec5560}
  .fc-item .t{position:relative;flex:0 0 112px;aspect-ratio:16/9;border-radius:12px;overflow:hidden;background:linear-gradient(135deg,#243b63,#6d8bb0)}
  .fc-item .t img{width:100%;height:100%;object-fit:cover;display:block}
  .fc-item b{font-size:15px;line-height:1.35}
  .fc-cm textarea{width:100%;box-sizing:border-box;min-height:84px;padding:12px 14px;border:1px solid #ecd2d6;border-radius:16px;font:inherit;resize:vertical}
  .fc-cm button.post{margin-top:10px;padding:11px 24px;border:0;border-radius:14px;background:linear-gradient(135deg,#ec5560,#c92a44);color:#fff;font:inherit;font-weight:800}
  .fc-cm button.post[disabled]{opacity:.6}
  .fc-c{display:flex;gap:12px;padding:14px 0;border-top:1px solid #f3e4e6}
  .fc-c:first-child{border-top:0}
  .fc-c .ava{width:42px;height:42px;border-radius:50%;object-fit:cover;background:linear-gradient(135deg,#ec5560,#c92a44);color:#fff;display:grid;place-items:center;font-weight:800;flex:0 0 auto}
  .fc-c b{display:block}.fc-c small{color:#8a92a0}.fc-c p{margin:4px 0 0;white-space:pre-wrap;word-break:break-word}
  .fc-c .del{border:0;background:none;color:#c92a44;font-weight:700;padding:0;margin-top:4px}
  /* homepage direct cards */
  .cma-free-direct{display:grid;gap:18px;grid-template-columns:1fr;max-width:640px;margin:18px auto 0}
  @media(min-width:900px){.cma-free-direct{grid-template-columns:repeat(2,1fr);max-width:980px}}
  `;
  document.head.appendChild(css);

  // ---------- shared UI ----------
  function head(label, title, desc, back) {
    if ($("pageLabel")) $("pageLabel").textContent = label || "";
    if ($("pageTitle")) $("pageTitle").textContent = title || "";
    if ($("pageDescription")) $("pageDescription").textContent = desc || "";
    const b = $("backLink");
    if (b) { b.setAttribute("href", back || "?"); b.textContent = (back && back !== "?") ? "← পেছনে যাও" : "← Back to Homepage"; }
    const pb = $("pageBanner"); if (pb) pb.style.display = "none";
    document.title = (title ? title + " | " : "") + "Change Maker Academy";
  }
  function root() { const r = $("pageContent"); if (r) r.innerHTML = ""; return r; }
  function msg(r, text) { r.appendChild(el("div", "fc-msg", text)); }

  function thumbBox(url, alt, play) {
    const t = el("div", "fc-thumb" + (alt ? " alt" : ""));
    const u = safeUrl(url);
    if (u) { const i = document.createElement("img"); i.src = u; i.alt = ""; i.loading = "lazy"; t.appendChild(i); }
    if (play) { const p = el("div", "fc-play"); p.innerHTML = "<span>" + PLAY_SVG + "</span>"; t.appendChild(p); }
    return t;
  }
  function card(href, thumbUrl, title, sub, play, alt) {
    const a = el("a", "fc-card"); a.href = href;
    a.appendChild(thumbBox(thumbUrl, alt, play));
    const b = el("div", "fc-body"); b.appendChild(el("h3", "", title));
    if (sub) b.appendChild(el("p", "", sub));
    a.appendChild(b);
    return a;
  }
  async function query(fn) {
    if (!sb()) throw new Error("no-client");
    const { data, error } = await fn(sb());
    if (error) throw error;
    return data;
  }

  // ---------- pages ----------
  function renderBatches() {
    head("Free Courses", "ফ্রি কোর্স", "তোমার ব্যাচ সিলেক্ট করো", "?");
    const r = root(); const g = el("div", "fc-grid");
    [["ssc", "SSC", "ক্লাস ৯–১০"], ["hsc", "HSC", "ক্লাস ১১–১২"]].forEach(x => {
      const a = el("a", "fc-batch"); a.href = "?page=free-batch-" + x[0];
      a.appendChild(el("b", "", x[1]));
      const d = el("div"); d.appendChild(el("h3", "", x[1] + " ফ্রি ব্যাচ")); d.appendChild(el("p", "", x[2])); a.appendChild(d);
      g.appendChild(a);
    });
    r.appendChild(g);
  }

  async function renderSubjects(batch, ok) {
    batch = batch === "hsc" ? "hsc" : "ssc";
    head("Select Subject", batch.toUpperCase() + " — সাবজেক্ট", "তোমার সাবজেক্টটি সিলেক্ট করো", "?page=free-courses");
    const r = root(); msg(r, "লোড হচ্ছে…");
    try {
      const rows = await query(c => c.from("free_subjects").select("*").eq("batch", batch).eq("is_active", true).order("sort_order", { ascending: true }));
      if (!ok()) return; r.innerHTML = "";
      if (!rows.length) return msg(r, "এই ব্যাচে এখনো কোনো সাবজেক্ট যুক্ত হয়নি।");
      const g = el("div", "fc-grid");
      rows.forEach((s, i) => g.appendChild(card("?page=free-subject-" + s.id, s.thumbnail_url, s.name, "", false, i % 2)));
      r.appendChild(g);
    } catch (e) { if (ok()) { r.innerHTML = ""; msg(r, "ডেটা লোড করা যায়নি। পরে আবার চেষ্টা করো।"); } console.error(e); }
  }

  async function renderChapters(id, ok) {
    head("Select Chapter", "চ্যাপ্টার", "", "?page=free-courses");
    const r = root(); msg(r, "লোড হচ্ছে…");
    try {
      const subj = await query(c => c.from("free_subjects").select("*").eq("id", id).maybeSingle());
      if (!ok()) return;
      if (!subj) { r.innerHTML = ""; return msg(r, "সাবজেক্টটি পাওয়া যায়নি।"); }
      head("Select Chapter", subj.name, "তোমার চ্যাপ্টারটি সিলেক্ট করো", "?page=free-batch-" + subj.batch);
      const rows = await query(c => c.from("free_chapters").select("*").eq("subject_id", id).eq("is_active", true).order("sort_order", { ascending: true }));
      if (!ok()) return; r.innerHTML = "";
      if (!rows.length) return msg(r, "এই সাবজেক্টে এখনো কোনো চ্যাপ্টার যুক্ত হয়নি।");
      const g = el("div", "fc-grid");
      rows.forEach((c2, i) => g.appendChild(card("?page=free-chapter-" + c2.id, c2.thumbnail_url, c2.name, "", false, i % 2)));
      r.appendChild(g);
    } catch (e) { if (ok()) { r.innerHTML = ""; msg(r, "ডেটা লোড করা যায়নি।"); } console.error(e); }
  }

  async function renderVideos(id, ok) {
    head("Free Classes", "ক্লাস", "", "?page=free-courses");
    const r = root(); msg(r, "লোড হচ্ছে…");
    try {
      const ch = await query(c => c.from("free_chapters").select("*").eq("id", id).maybeSingle());
      if (!ok()) return;
      if (!ch) { r.innerHTML = ""; return msg(r, "চ্যাপ্টারটি পাওয়া যায়নি।"); }
      head("Free Classes", ch.name, "ক্লাসটি দেখতে কার্ডে ক্লিক করো", "?page=free-subject-" + ch.subject_id);
      const rows = await query(c => c.from("free_videos").select("*").eq("chapter_id", id).eq("is_active", true).order("sort_order", { ascending: true }));
      if (!ok()) return; r.innerHTML = "";
      if (!rows.length) return msg(r, "এই চ্যাপ্টারে এখনো কোনো ভিডিও যুক্ত হয়নি।");
      const g = el("div", "fc-grid");
      rows.forEach((v, i) => g.appendChild(card("?page=free-video-" + v.id, v.thumbnail_url || v.home_thumbnail_url, v.title, v.teacher_name || "", true, i % 2)));
      r.appendChild(g);
    } catch (e) { if (ok()) { r.innerHTML = ""; msg(r, "ডেটা লোড করা যায়নি।"); } console.error(e); }
  }

  async function renderWatch(id, ok) {
    head("Free Class", "ক্লাস", "", "?");
    const r = root(); msg(r, "লোড হচ্ছে…");
    try {
      const v = await query(c => c.from("free_videos").select("*").eq("id", id).eq("is_active", true).maybeSingle());
      if (!ok()) return; r.innerHTML = "";
      if (!v) return msg(r, "ভিডিওটি পাওয়া যায়নি।");
      head("Free Class", "", "", v.chapter_id ? "?page=free-chapter-" + v.chapter_id : "?");
      const w = el("div", "fc-watch");

      const pl = el("div", "fc-player"); const vid = ytId(v.youtube_url);
      if (vid) {
        const f = document.createElement("iframe");
        f.src = "https://www.youtube-nocookie.com/embed/" + vid + "?rel=0&modestbranding=1";
        f.title = v.title; f.allowFullscreen = true; f.loading = "lazy";
        f.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
        f.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
        pl.appendChild(f);
      } else { pl.appendChild(el("div", "fc-msg", "ভিডিও লিংক সঠিক নয়।")); }
      w.appendChild(pl);
      w.appendChild(el("h2", "fc-title", v.title));

      if (v.teacher_name) {
        const b = el("div", "fc-box fc-teacher");
        const p = safeUrl(v.teacher_photo_url);
        if (p) { const i = document.createElement("img"); i.src = p; i.alt = ""; b.appendChild(i); }
        else b.appendChild(el("div", "fc-ava", v.teacher_name.charAt(0).toUpperCase()));
        const d = el("div"); d.appendChild(el("b", "", v.teacher_name)); d.appendChild(el("small", "", "Course Instructor")); b.appendChild(d);
        w.appendChild(b);
      }

      const sheet = safeUrl(v.sheet_url);
      if (sheet) {
        const b = el("div", "fc-box"); b.appendChild(el("div", "fc-h", "Course Materials"));
        const a = el("a", "fc-sheet", "📄 " + (v.sheet_title || "Lecture Sheet") + " — Open");
        a.href = sheet; a.target = "_blank"; a.rel = "noopener noreferrer"; a.style.marginTop = "12px";
        b.appendChild(a); w.appendChild(b);
      }

      const listHost = el("div"); w.appendChild(listHost);
      const cmHost = el("div"); w.appendChild(cmHost);
      r.appendChild(w);

      if (v.chapter_id) loadRelated(v, listHost, ok);
      loadComments(v.id, cmHost, ok);
    } catch (e) { if (ok()) { r.innerHTML = ""; msg(r, "ভিডিও লোড করা যায়নি।"); } console.error(e); }
  }

  async function loadRelated(v, host, ok) {
    try {
      const rows = await query(c => c.from("free_videos").select("id,title,thumbnail_url,home_thumbnail_url").eq("chapter_id", v.chapter_id).eq("is_active", true).order("sort_order", { ascending: true }));
      if (!ok() || rows.length < 2) return;
      host.appendChild(el("div", "fc-h", "এই চ্যাপ্টারের ভিডিও (" + rows.length + ")"));
      const l = el("div", "fc-list"); l.style.marginTop = "10px";
      rows.forEach(x => {
        const a = el("a", "fc-item" + (x.id === v.id ? " on" : "")); a.href = "?page=free-video-" + x.id;
        const t = el("div", "t"); const u = safeUrl(x.thumbnail_url || x.home_thumbnail_url);
        if (u) { const i = document.createElement("img"); i.src = u; i.alt = ""; i.loading = "lazy"; t.appendChild(i); }
        a.appendChild(t); a.appendChild(el("b", "", x.title)); l.appendChild(a);
      });
      host.appendChild(l);
    } catch (e) { console.error(e); }
  }

  // ---------- comments ----------
  async function currentUser() {
    try { const { data } = await sb().auth.getUser(); return data && data.user ? data.user : null; } catch (e) { return null; }
  }
  function when(s) { try { return new Date(s).toLocaleString("bn-BD", { dateStyle: "medium", timeStyle: "short" }); } catch (e) { return ""; } }

  async function loadComments(videoId, host, ok) {
    host.appendChild(el("div", "fc-h", "Comments"));
    const box = el("div", "fc-box fc-cm"); box.style.marginTop = "10px";
    const form = el("div"); const list = el("div"); list.style.marginTop = "14px";
    box.append(form, list); host.appendChild(box);

    const user = await currentUser(); if (!ok()) return;
    if (!user) {
      const p = el("div", "fc-msg"); p.style.padding = "8px 0";
      p.append("কমেন্ট করতে ");
      const a = el("a", "", "লগইন করো"); a.href = "?page=account"; a.style.color = "#c92a44"; p.appendChild(a);
      form.appendChild(p);
    } else {
      const meta = user.user_metadata || {};
      const name = meta.full_name || meta.name || (user.email || "User").split("@")[0];
      const ta = document.createElement("textarea"); ta.placeholder = "Write a comment…"; ta.maxLength = 1000;
      const bt = el("button", "post", "Post"); bt.type = "button";
      bt.addEventListener("click", async () => {
        const text = ta.value.trim(); if (!text) return;
        bt.disabled = true;
        const { error } = await sb().from("free_comments").insert({
          video_id: videoId, user_id: user.id, user_name: name, avatar_url: meta.avatar_url || meta.picture || null, content: text
        });
        bt.disabled = false;
        if (error) { alert("কমেন্ট করা যায়নি। আবার চেষ্টা করো।"); console.error(error); return; }
        ta.value = ""; refresh();
      });
      form.append(ta, bt);
    }

    async function refresh() {
      try {
        const rows = await query(c => c.from("free_comments").select("*").eq("video_id", videoId).order("created_at", { ascending: false }).limit(100));
        if (!ok()) return; list.innerHTML = "";
        if (!rows.length) { list.appendChild(el("div", "fc-msg", "এখনো কোনো কমেন্ট নেই।")); return; }
        rows.forEach(c => {
          const row = el("div", "fc-c");
          const au = safeUrl(c.avatar_url);
          if (au) { const i = document.createElement("img"); i.className = "ava"; i.src = au; i.alt = ""; row.appendChild(i); }
          else row.appendChild(el("div", "ava", (c.user_name || "U").charAt(0).toUpperCase()));
          const d = el("div"); d.style.minWidth = 0;
          d.appendChild(el("b", "", c.user_name || "User")); d.appendChild(el("small", "", when(c.created_at))); d.appendChild(el("p", "", c.content));
          if (user && c.user_id === user.id) {
            const x = el("button", "del", "মুছে ফেলো"); x.type = "button";
            x.addEventListener("click", async () => { if (!confirm("কমেন্টটি মুছে ফেলবে?")) return; await sb().from("free_comments").delete().eq("id", c.id); refresh(); });
            d.appendChild(x);
          }
          row.appendChild(d); list.appendChild(row);
        });
      } catch (e) { console.error(e); }
    }
    refresh();
  }

  // ---------- router entry ----------
  function render(page, isCurrent) {
    const ok = typeof isCurrent === "function" ? isCurrent : () => true;
    if (page === "free-courses") return renderBatches();
    if (page.startsWith("free-batch-")) return renderSubjects(page.slice(11), ok);
    if (page.startsWith("free-subject-")) return renderChapters(page.slice(13), ok);
    if (page.startsWith("free-chapter-")) return renderVideos(page.slice(13), ok);
    if (page.startsWith("free-video-")) return renderWatch(page.slice(11), ok);
    head("", "পেজটি পাওয়া যায়নি", "", "?"); const r = root(); msg(r, "দুঃখিত, পেজটি খুঁজে পাওয়া যায়নি।");
  }
  window.CMAFree = { render: render };

  // ---------- homepage: direct free-class cards ----------
  async function loadHome() {
    const host = $("cmaFreeDirect"); if (!host) return;
    try {
      const rows = await query(c => c.from("free_videos").select("id,title,home_thumbnail_url,thumbnail_url").eq("show_on_home", true).eq("is_active", true).order("sort_order", { ascending: true }));
      host.innerHTML = "";
      if (!rows.length) return msg(host, "শীঘ্রই ফ্রি ক্লাস যুক্ত হবে।");
      rows.forEach((v, i) => host.appendChild(card("?page=free-video-" + v.id, v.home_thumbnail_url || v.thumbnail_url, v.title, "", true, i % 2)));
    } catch (e) { host.innerHTML = ""; msg(host, "ফ্রি ক্লাস লোড করা যায়নি।"); console.error(e); }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", loadHome); else loadHome();
})();
