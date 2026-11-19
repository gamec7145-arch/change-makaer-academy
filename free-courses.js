// ==================================================
// CHANGE MAKER ACADEMY — FREE COURSES (student side)
// Home: 3 cards (SSC / HSC / Exam Preparation)
// SSC|HSC -> Subjects -> Chapters -> Chapter page (lessons) -> Watch page
// Watch page shows "Video is coming soon" until admin adds a video.
// Supabase tables: free_subjects, free_chapters, free_videos, free_comments
// ==================================================
(function () {
  "use strict";

  const sb = () => window.cmaSupabase;
  const $ = id => document.getElementById(id);
  const bn = n => Number(n).toLocaleString("bn-BD");

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function safeUrl(u) { u = String(u || "").trim(); return /^https?:\/\//i.test(u) ? u : ""; }
  function ytId(url) {
    url = String(url || "").trim();
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/i);
    if (m) return m[1];
    return /^[\w-]{11}$/.test(url) ? url : "";
  }
  const PLAY_SVG = '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 001.5.86l11-6.5a1 1 0 000-1.72l-11-6.5A1 1 0 008 5.5z"/></svg>';
  const CLOCK_SVG = '<svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';

  // ---------- styles ----------
  const css = document.createElement("style");
  css.id = "cma-free-courses-css";
  css.textContent = `
  .fc-grid{display:grid;gap:18px;grid-template-columns:1fr}
  @media(min-width:700px){.fc-grid{grid-template-columns:repeat(2,1fr)}}
  @media(min-width:1000px){.fc-grid{grid-template-columns:repeat(3,1fr)}}
  .fc-card{display:block;text-decoration:none;color:#1a2238;background:#fff;border:1px solid #f3dcdf;border-radius:26px;overflow:hidden;box-shadow:0 18px 40px -26px rgba(40,30,50,.45);transition:transform .2s}
  .fc-card:active{transform:scale(.985)}
  .fc-thumb{position:relative;aspect-ratio:16/9;background:linear-gradient(135deg,#243b63,#6d8bb0);overflow:hidden;display:grid;place-items:center}
  .fc-thumb.c1{background:linear-gradient(135deg,#243b63,#6d8bb0)}
  .fc-thumb.c2{background:linear-gradient(135deg,#7b1a30,#ec5560)}
  .fc-thumb.c3{background:linear-gradient(135deg,#2a1c34,#8a4a8f)}
  .fc-thumb img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
  .fc-ph{position:relative;z-index:1;padding:14px;color:#fff;text-align:center;font-size:24px;font-weight:800;line-height:1.3;text-shadow:0 4px 18px rgba(0,0,0,.3)}
  .fc-play{position:absolute;inset:0;display:grid;place-items:center}
  .fc-play span{width:70px;height:70px;border-radius:50%;display:grid;place-items:center;color:#fff;background:rgba(255,255,255,.22);border:3px solid #fff;backdrop-filter:blur(4px)}
  .fc-body{display:flex;align-items:center;justify-content:center;gap:10px;padding:16px 18px 20px;text-align:center}
  .fc-body h3{margin:0;font-size:20px;font-weight:800;line-height:1.35}
  .fc-body p{margin:4px 0 0;color:#6b7482;font-size:14px}
  .fc-dot{flex:0 0 auto;width:10px;height:10px;border-radius:50%;background:#f4bcc2}
  .fc-intro{text-align:center;color:#6b7482;font-size:16px;line-height:1.7;margin:0 auto 20px;max-width:560px}
  .fc-msg{padding:34px 18px;text-align:center;color:#6b7482;font-weight:700}
  .fc-hero{aspect-ratio:16/9;border-radius:24px;overflow:hidden;position:relative;display:grid;place-items:center;box-shadow:0 18px 40px -22px rgba(0,0,0,.5);background:linear-gradient(135deg,#7b1a30,#ec5560)}
  .fc-hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  .fc-page{display:grid;gap:18px}
  .fc-player{position:relative;aspect-ratio:16/9;border-radius:22px;overflow:hidden;background:#000;box-shadow:0 18px 40px -22px rgba(0,0,0,.6)}
  .fc-player iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
  .fc-soon{display:grid;place-items:center;align-content:center;gap:10px;text-align:center;color:#fff;background:radial-gradient(70% 70% at 100% 0%,rgba(255,255,255,.2),transparent 60%),linear-gradient(135deg,#1a2238,#7b1a30)}
  .fc-soon b{font-size:22px}.fc-soon small{opacity:.8;font-size:14px}
  .fc-title{margin:4px 0 0;font-size:24px;font-weight:800;color:#1a2238}
  .fc-box{background:#fff;border:1px solid #f3dcdf;border-radius:22px;padding:16px 18px}
  .fc-teacher{display:flex;align-items:center;gap:14px}
  .fc-teacher img,.fc-ava{width:56px;height:56px;border-radius:50%;object-fit:cover;background:linear-gradient(135deg,#ec5560,#c92a44);color:#fff;display:grid;place-items:center;font-weight:800;font-size:22px;flex:0 0 auto}
  .fc-teacher b{display:block;font-size:18px}.fc-teacher small{color:#6b7482}
  .fc-h{margin:6px 0 0;font-size:20px;font-weight:800;color:#1a2238}
  .fc-h small{font-weight:600;color:#6b7482;font-size:14px;margin-left:6px}
  .fc-sheet{display:inline-flex;align-items:center;gap:10px;padding:12px 18px;border-radius:16px;background:#fff0f1;color:#c92a44;font-weight:800;text-decoration:none;margin:6px 8px 0 0}
  .fc-list{display:grid;gap:10px}
  .fc-item{display:flex;gap:12px;align-items:center;padding:10px;border-radius:18px;background:#fff;border:1px solid #f3dcdf;text-decoration:none;color:#1a2238}
  .fc-item.on{background:#fff0f1;border-color:#ec5560}
  .fc-item .t{position:relative;flex:0 0 112px;aspect-ratio:16/9;border-radius:12px;overflow:hidden;background:linear-gradient(135deg,#243b63,#6d8bb0);display:grid;place-items:center;color:#fff}
  .fc-item .t img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  .fc-item .t i{position:relative;width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.28);display:grid;place-items:center;font-style:normal}
  .fc-item b{font-size:15px;line-height:1.35;display:block}.fc-item small{color:#8a92a0}
  .fc-cm textarea{width:100%;box-sizing:border-box;min-height:84px;padding:12px 14px;border:1px solid #ecd2d6;border-radius:16px;font:inherit;resize:vertical}
  .fc-cm button.post{margin-top:10px;padding:11px 24px;border:0;border-radius:14px;background:linear-gradient(135deg,#ec5560,#c92a44);color:#fff;font:inherit;font-weight:800}
  .fc-cm button.post[disabled]{opacity:.6}
  .fc-c{display:flex;gap:12px;padding:14px 0;border-top:1px solid #f3e4e6}
  .fc-c:first-child{border-top:0}
  .fc-c .ava{width:42px;height:42px;border-radius:50%;object-fit:cover;background:linear-gradient(135deg,#ec5560,#c92a44);color:#fff;display:grid;place-items:center;font-weight:800;flex:0 0 auto}
  .fc-c b{display:block}.fc-c small{color:#8a92a0}.fc-c p{margin:4px 0 0;white-space:pre-wrap;word-break:break-word}
  .fc-c .del{border:0;background:none;color:#c92a44;font-weight:700;padding:0;margin-top:4px}
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
  function intro(r, text) { r.appendChild(el("p", "fc-intro", text)); }

  function thumbBox(url, title, idx, play) {
    const t = el("div", "fc-thumb c" + ((idx % 3) + 1));
    const u = safeUrl(url);
    if (u) {
      const i = document.createElement("img"); i.src = u; i.alt = ""; i.loading = "lazy";
      i.onerror = function () { i.remove(); if (title) t.insertBefore(el("div", "fc-ph", title), t.firstChild); };
      t.appendChild(i);
    } else if (title) t.appendChild(el("div", "fc-ph", title));
    if (play) { const p = el("div", "fc-play"); p.innerHTML = "<span>" + PLAY_SVG + "</span>"; t.appendChild(p); }
    return t;
  }
  function card(href, thumbUrl, title, idx) {
    const a = el("a", "fc-card"); a.href = href;
    a.appendChild(thumbBox(thumbUrl, title, idx, false));
    const b = el("div", "fc-body"); b.appendChild(el("h3", "", title)); b.appendChild(el("span", "fc-dot"));
    a.appendChild(b);
    return a;
  }
  async function query(fn) {
    if (!sb()) throw new Error("no-client");
    const { data, error } = await fn(sb());
    if (error) throw error;
    return data;
  }

  // ---------- 1) Section page: SSC / HSC / Exam Preparation ----------
  function renderBatches() {
    head("Free Courses", "ফ্রি কোর্স", "তোমার সেকশন সিলেক্ট করো", "?");
    const r = root(); const g = el("div", "fc-grid");
    [["?page=free-batch-ssc", "SSC", "SSC ফ্রি কোর্স"],
     ["?page=free-batch-hsc", "HSC", "HSC ফ্রি কোর্স"],
     ["?page=exam-choose", "EXAM PREPARATION", "Exam Preparation"]].forEach((x, i) => g.appendChild(card(x[0], "", x[2], i)));
    r.appendChild(g);
  }

  // ---------- 2) SSC/HSC -> all subjects ----------
  async function renderSubjects(batch, ok) {
    batch = batch === "hsc" ? "hsc" : "ssc";
    head("Select Subject", batch.toUpperCase() + " — সাবজেক্ট", "", "?page=free-courses");
    const r = root(); msg(r, "লোড হচ্ছে…");
    try {
      const rows = await query(c => c.from("free_subjects").select("*").eq("batch", batch).eq("is_active", true).order("sort_order", { ascending: true }));
      if (!ok()) return; r.innerHTML = "";
      if (!rows.length) return msg(r, "এই সেকশনে এখনো কোনো সাবজেক্ট যুক্ত হয়নি।");
      intro(r, bn(rows.length) + "টি সাবজেক্ট — তোমার সাবজেক্টটি বেছে নাও");
      const g = el("div", "fc-grid");
      rows.forEach((s, i) => g.appendChild(card("?page=free-subject-" + s.id, s.thumbnail_url, s.name, i)));
      r.appendChild(g);
    } catch (e) { if (ok()) { r.innerHTML = ""; msg(r, "ডেটা লোড করা যায়নি। পরে আবার চেষ্টা করো।"); } console.error(e); }
  }

  // ---------- 3) Subject -> all chapters ----------
  async function renderChapters(id, ok) {
    head("Select Chapter", "চ্যাপ্টার", "", "?page=free-courses");
    const r = root(); msg(r, "লোড হচ্ছে…");
    try {
      const subj = await query(c => c.from("free_subjects").select("*").eq("id", id).maybeSingle());
      if (!ok()) return;
      if (!subj) { r.innerHTML = ""; return msg(r, "সাবজেক্টটি পাওয়া যায়নি।"); }
      head("Select Chapter", subj.name, "", "?page=free-batch-" + subj.batch);
      const rows = await query(c => c.from("free_chapters").select("*").eq("subject_id", id).eq("is_active", true).order("sort_order", { ascending: true }));
      if (!ok()) return; r.innerHTML = "";
      if (!rows.length) return msg(r, "এই সাবজেক্টে এখনো কোনো চ্যাপ্টার যুক্ত হয়নি।");
      intro(r, bn(rows.length) + "টি চ্যাপ্টার — তোমার শেখার যাত্রা শুরু করো");
      const g = el("div", "fc-grid");
      rows.forEach((c2, i) => g.appendChild(card("?page=free-chapter-" + c2.id, c2.thumbnail_url, c2.name, i)));
      r.appendChild(g);
    } catch (e) { if (ok()) { r.innerHTML = ""; msg(r, "ডেটা লোড করা যায়নি।"); } console.error(e); }
  }

  // ---------- helpers for lesson list ----------
  function lessonRow(href, thumbUrl, title, sub, on) {
    const a = el("a", "fc-item" + (on ? " on" : "")); a.href = href;
    const t = el("div", "t"); const u = safeUrl(thumbUrl);
    if (u) { const i = document.createElement("img"); i.src = u; i.alt = ""; i.loading = "lazy"; i.onerror = () => i.remove(); t.appendChild(i); }
    const ic = el("i"); ic.innerHTML = PLAY_SVG.replace(/width="28" height="28"/, 'width="16" height="16"'); t.appendChild(ic);
    a.appendChild(t);
    const d = el("div"); d.appendChild(el("b", "", title)); if (sub) d.appendChild(el("small", "", sub)); a.appendChild(d);
    return a;
  }
  function teacherBox(name, photo) {
    const b = el("div", "fc-box fc-teacher");
    const p = safeUrl(photo);
    if (p) { const i = document.createElement("img"); i.src = p; i.alt = ""; b.appendChild(i); }
    else b.appendChild(el("div", "fc-ava", name.charAt(0).toUpperCase()));
    const d = el("div"); d.appendChild(el("b", "", name)); d.appendChild(el("small", "", "Course Instructor")); b.appendChild(d);
    return b;
  }
  function sheetsBox(videos) {
    const withSheet = videos.filter(v => safeUrl(v.sheet_url));
    if (!withSheet.length) return null;
    const b = el("div", "fc-box"); b.appendChild(el("div", "fc-h", "Course Materials"));
    withSheet.forEach(v => {
      const a = el("a", "fc-sheet", "📄 " + (v.sheet_title || "Lecture Sheet") + " — Open");
      a.href = safeUrl(v.sheet_url); a.target = "_blank"; a.rel = "noopener noreferrer"; b.appendChild(a);
    });
    return b;
  }

  // ---------- 4) Chapter page (hero + instructor + lessons + materials) ----------
  async function renderChapterPage(id, ok) {
    head("Free Class", "", "", "?page=free-courses");
    const r = root(); msg(r, "লোড হচ্ছে…");
    try {
      const ch = await query(c => c.from("free_chapters").select("*").eq("id", id).maybeSingle());
      if (!ok()) return;
      if (!ch) { r.innerHTML = ""; return msg(r, "চ্যাপ্টারটি পাওয়া যায়নি।"); }
      head("Free Class", "", "", "?page=free-subject-" + ch.subject_id);
      const vids = await query(c => c.from("free_videos").select("*").eq("chapter_id", id).eq("is_active", true).order("sort_order", { ascending: true }));
      if (!ok()) return; r.innerHTML = "";

      const w = el("div", "fc-page");
      const hero = el("div", "fc-hero"); const hu = safeUrl(ch.thumbnail_url);
      if (hu) { const i = document.createElement("img"); i.src = hu; i.alt = ""; i.onerror = () => { i.remove(); hero.appendChild(el("div", "fc-ph", ch.name)); }; hero.appendChild(i); }
      else hero.appendChild(el("div", "fc-ph", ch.name));
      w.appendChild(hero);
      w.appendChild(el("h2", "fc-title", ch.name));

      const first = vids.find(v => v.teacher_name);
      if (first) w.appendChild(teacherBox(first.teacher_name, first.teacher_photo_url));

      const h = el("div", "fc-h", ch.name); h.appendChild(el("small", "", "(" + bn(Math.max(vids.length, 1)) + " video)")); w.appendChild(h);
      const l = el("div", "fc-list");
      if (vids.length) vids.forEach(v => l.appendChild(lessonRow("?page=free-video-" + v.id, v.thumbnail_url || v.home_thumbnail_url || ch.thumbnail_url, v.title, v.teacher_name || "", false)));
      else l.appendChild(lessonRow("?page=free-video-soon-" + ch.id, ch.thumbnail_url, ch.name, "Video is coming soon", false));
      w.appendChild(l);

      const sb2 = sheetsBox(vids); if (sb2) w.appendChild(sb2);
      r.appendChild(w);
    } catch (e) { if (ok()) { r.innerHTML = ""; msg(r, "ডেটা লোড করা যায়নি।"); } console.error(e); }
  }

  // ---------- 5a) Watch page: placeholder (no video yet) ----------
  async function renderSoon(chId, ok) {
    head("Free Class", "", "", "?page=free-chapter-" + chId);
    const r = root(); msg(r, "লোড হচ্ছে…");
    try {
      const ch = await query(c => c.from("free_chapters").select("*").eq("id", chId).maybeSingle());
      if (!ok()) return; r.innerHTML = "";
      if (!ch) return msg(r, "চ্যাপ্টারটি পাওয়া যায়নি।");
      const w = el("div", "fc-page");
      const pl = el("div", "fc-player fc-soon");
      const ic = el("div"); ic.innerHTML = CLOCK_SVG; pl.appendChild(ic);
      pl.appendChild(el("b", "", "Video is coming soon"));
      pl.appendChild(el("small", "", "ভিডিও শীঘ্রই যুক্ত করা হবে"));
      w.appendChild(pl);
      w.appendChild(el("h2", "fc-title", ch.name));
      const h = el("div", "fc-h", ch.name); h.appendChild(el("small", "", "(১ video)")); w.appendChild(h);
      const l = el("div", "fc-list"); l.appendChild(lessonRow("?page=free-video-soon-" + ch.id, ch.thumbnail_url, ch.name, "Video is coming soon", true)); w.appendChild(l);
      const cm = el("div", "fc-box"); cm.appendChild(el("div", "fc-msg", "ভিডিও যুক্ত হলে এখানে কমেন্ট করতে পারবে।")); w.appendChild(cm);
      r.appendChild(w);
    } catch (e) { if (ok()) { r.innerHTML = ""; msg(r, "পেজ লোড করা যায়নি।"); } console.error(e); }
  }

  // ---------- 5b) Watch page: real video ----------
  async function renderWatch(id, ok) {
    head("Free Class", "", "", "?");
    const r = root(); msg(r, "লোড হচ্ছে…");
    try {
      const v = await query(c => c.from("free_videos").select("*").eq("id", id).eq("is_active", true).maybeSingle());
      if (!ok()) return; r.innerHTML = "";
      if (!v) return msg(r, "ভিডিওটি পাওয়া যায়নি।");
      head("Free Class", "", "", v.chapter_id ? "?page=free-chapter-" + v.chapter_id : "?");
      const w = el("div", "fc-page");

      const pl = el("div", "fc-player"); const vid = ytId(v.youtube_url);
      if (vid) {
        const f = document.createElement("iframe");
        f.src = "https://www.youtube-nocookie.com/embed/" + vid + "?rel=0&modestbranding=1";
        f.title = v.title; f.allowFullscreen = true; f.loading = "lazy";
        f.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
        f.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
        pl.appendChild(f);
      } else {
        pl.className += " fc-soon";
        const ic = el("div"); ic.innerHTML = CLOCK_SVG; pl.appendChild(ic);
        pl.appendChild(el("b", "", "Video is coming soon"));
        pl.appendChild(el("small", "", "ভিডিও শীঘ্রই যুক্ত করা হবে"));
      }
      w.appendChild(pl);
      w.appendChild(el("h2", "fc-title", v.title));
      if (v.teacher_name) w.appendChild(teacherBox(v.teacher_name, v.teacher_photo_url));

      const listHost = el("div"); w.appendChild(listHost);
      const sh = sheetsBox([v]); if (sh) w.appendChild(sh);
      const cmHost = el("div"); w.appendChild(cmHost);
      r.appendChild(w);

      if (v.chapter_id) loadRelated(v, listHost, ok);
      loadComments(v.id, cmHost, ok);
    } catch (e) { if (ok()) { r.innerHTML = ""; msg(r, "ভিডিও লোড করা যায়নি।"); } console.error(e); }
  }

  async function loadRelated(v, host, ok) {
    try {
      const rows = await query(c => c.from("free_videos").select("id,title,thumbnail_url,home_thumbnail_url,teacher_name").eq("chapter_id", v.chapter_id).eq("is_active", true).order("sort_order", { ascending: true }));
      if (!ok() || !rows.length) return;
      const h = el("div", "fc-h", "এই চ্যাপ্টারের ভিডিও"); h.appendChild(el("small", "", "(" + bn(rows.length) + " video)")); host.appendChild(h);
      const l = el("div", "fc-list"); l.style.marginTop = "10px";
      rows.forEach(x => l.appendChild(lessonRow("?page=free-video-" + x.id, x.thumbnail_url || x.home_thumbnail_url, x.title, x.teacher_name || "", x.id === v.id)));
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
    if (page.startsWith("free-chapter-")) return renderChapterPage(page.slice(13), ok);
    if (page.startsWith("free-video-soon-")) return renderSoon(page.slice(16), ok);
    if (page.startsWith("free-video-")) return renderWatch(page.slice(11), ok);
    head("", "পেজটি পাওয়া যায়নি", "", "?"); const r = root(); msg(r, "দুঃখিত, পেজটি খুঁজে পাওয়া যায়নি।");
  }
  window.CMAFree = { render: render };
})();
