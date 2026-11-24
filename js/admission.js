// ==================================================
// CHANGE MAKER ACADEMY — ADMISSION (student side)
//
// Home > "Admission" card (Game Changer 2.0 carousel)
//   -> Information form (Enroll)        ?page=adm-start
//   -> Group (Science/Humanities/Biz)   ?page=adm-groups
//   -> Menu (3 options)                 ?page=adm-menu-<group>
//        1) Class                       ?page=adm-classes-<group>     -> ?page=adm-class-<id>  (video + comments)
//        2) Important Practice Sheet    ?page=adm-sheets-<group>      -> ?page=adm-sheet-<id>  (photo + PDF) + search
//        3) MCQ Practice                ?page=adm-mcq-<group>         -> subject -> chapter (+search) -> posts -> exam
//
// Admin panel theke add korar table (SQL: sql/admission-setup.sql):
//   admission_classes, admission_comments, admission_sheets, admission_mcq_posts
// MCQ exam engine = already thaka "Online Examination" (renderOnlineExamStart).
// Design = free-courses.js er .fc-* class gulo (shei file age load hoy).
// ==================================================
(function () {
  "use strict";

  const $ = id => document.getElementById(id);
  const bn = n => Number(n).toLocaleString("bn-BD");
  const sb = () => window.cmaSupabase;

  const T = {
    classes: "admission_classes",
    comments: "admission_comments",
    sheets: "admission_sheets",
    mcq: "admission_mcq_posts"
  };

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
  const DIGITS = { "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4", "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9" };
  function norm(s) { return String(s == null ? "" : s).toLowerCase().replace(/[০-৯]/g, d => DIGITS[d]).trim(); }
  async function query(fn) {
    if (!sb()) throw new Error("no-client");
    const { data, error } = await fn(sb());
    if (error) throw error;
    return data;
  }

  // ---------- group config (class-prep.js er HSC group/subject list-i use hoy) ----------
  const CP = () => (window.CMAClassPrep && window.CMAClassPrep.data) || null;
  const GROUPS_FALLBACK = [["science", "বিজ্ঞান", "বিজ্ঞান"], ["arts", "মানবিক", "মানবিক"], ["commerce", "ব্যবসায় শিক্ষা", "ব্যবসায় শিক্ষা"]];
  const GROUPS = () => (CP() && CP().GROUPS) || GROUPS_FALLBACK;
  function groupOf(key) { return GROUPS().find(g => g[0] === key); }
  function subjectsFor(g) {
    const d = CP(); if (!d || !d.HSC_SUBJECTS) return [];
    const grp = groupOf(g); if (!grp) return d.HSC_SUBJECTS;
    return d.HSC_SUBJECTS.filter(s => s[2] === d.ALL || s[2] === d.OPT || String(s[2]).includes(grp[2]));
  }
  function subjectName(key) {
    const d = CP(); const s = d && d.HSC_SUBJECTS ? d.HSC_SUBJECTS.find(x => x[0] === key) : null;
    return s ? s[1] : key;
  }

  // ---------- session state ----------
  const ENROLL_KEY = "cma-adm-enrolled", GROUP_KEY = "cma-adm-group";
  function enrolled() { try { return sessionStorage.getItem(ENROLL_KEY) === "1"; } catch (e) { return false; } }
  function savedGroup() { try { return sessionStorage.getItem(GROUP_KEY) || ""; } catch (e) { return ""; } }
  function saveGroup(g) { try { sessionStorage.setItem(GROUP_KEY, g); } catch (e) {} }
  const gname = g => (groupOf(g) || [g, g])[1];

  // ---------- styles ----------
  const css = document.createElement("style");
  css.id = "cma-admission-css";
  css.textContent = `
  .adm-chips{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px}
  .adm-chip{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:99px;background:#fff0f1;color:#bd2d43;font-size:12px;font-weight:900}
  .adm-imgs{display:grid;gap:14px}
  .adm-imgs a{display:block;border-radius:18px;overflow:hidden;border:1px solid #f0d9dc;background:#fff;box-shadow:0 16px 36px -26px rgba(29,37,55,.42)}
  .adm-imgs img{display:block;width:100%;height:auto}
  .adm-pdf{width:100%;height:72vh;min-height:420px;border:1px solid #f0d9dc;border-radius:18px;background:#fff}
  .adm-btns{display:flex;flex-wrap:wrap;gap:10px}
  .adm-btns a{flex:1 1 150px}
  .adm-desc{margin:0;color:#4a5366;line-height:1.7;white-space:pre-wrap;word-break:break-word}
  .adm-red{background:linear-gradient(110deg,#e74755,#c92a44)!important;box-shadow:0 12px 25px -17px rgba(201,42,68,.8)!important}
  `;
  document.head.appendChild(css);

  // ---------- shared UI ----------
  function head(label, title, desc, back) {
    if ($("pageLabel")) $("pageLabel").textContent = label || "";
    if ($("pageTitle")) $("pageTitle").textContent = title || "";
    if ($("pageDescription")) $("pageDescription").textContent = desc || "";
    const b = $("backLink");
    if (b) {
      b.setAttribute("href", back || "?");
      b.textContent = (back && back !== "?") ? "← পেছনে যাও" : "← হোমে ফিরে যাও";
    }
    const pb = $("pageBanner"); if (pb) pb.style.display = "none";
    document.title = (title ? title + " | " : "") + "Change Maker Academy";
  }
  function root() { const r = $("pageContent"); if (r) r.innerHTML = ""; return r; }
  function msg(r, text) { r.appendChild(el("div", "fc-msg", text)); }
  function intro(r, text) { r.appendChild(el("p", "fc-intro", text)); }
  function notFound() { head("", "পেজটি পাওয়া যায়নি", "", "?"); msg(root(), "দুঃখিত, পেজটি খুঁজে পাওয়া যায়নি।"); }

  const TARGET_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="#d6304a" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="#d6304a"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4"/></svg>';
  const ART_SVG = '<svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" fill="none" aria-hidden="true"><defs><linearGradient id="fcb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><linearGradient id="fct" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect width="160" height="14" fill="url(#fct)"/><path d="M-6 90L34 0h22L16 90z" fill="url(#fcb)" opacity=".28"/><path d="M96 90L136 0h8L104 90z" fill="#fff" opacity=".05"/><g stroke="currentColor" stroke-width=".7"><circle cx="132" cy="50" r="46" opacity=".13"/><circle cx="132" cy="50" r="34" opacity=".17"/><circle cx="132" cy="50" r="22" opacity=".22"/><circle cx="132" cy="50" r="10" opacity=".3"/><path d="M132 0v100M82 50h100" opacity=".1"/></g><circle cx="132" cy="50" r="2.2" fill="currentColor" opacity=".55"/></svg>';
  const PLAY_SVG = '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 001.5.86l11-6.5a1 1 0 000-1.72l-11-6.5A1 1 0 008 5.5z"/></svg>';
  const CLOCK_SVG = '<svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
  const TAG_TEXT = "Dream it. Crack it.";

  function poster(title) {
    const d = el("div", "fc-ph");
    d.appendChild(el("div", "fc-ph-title" + (String(title).length > 16 ? " long" : ""), title));
    const tag = el("div", "fc-ph-tag");
    tag.innerHTML = TARGET_SVG + "<span>" + TAG_TEXT + "</span>";
    d.appendChild(tag);
    return d;
  }
  function thumbBox(url, title, idx, play) {
    const t = el("div", "fc-thumb c" + ((idx % 3) + 1));
    const u = safeUrl(url);
    const addPoster = function () {
      if (!title) return;
      const art = el("div", "fc-art"); art.innerHTML = ART_SVG; t.appendChild(art);
      t.appendChild(poster(title));
    };
    if (u) {
      const i = document.createElement("img"); i.src = u; i.alt = ""; i.loading = "lazy";
      i.onerror = function () { i.remove(); addPoster(); };
      t.appendChild(i);
    } else addPoster();
    if (play) { const p = el("div", "fc-play"); p.innerHTML = "<span>" + PLAY_SVG + "</span>"; t.appendChild(p); }
    return t;
  }
  function gcCard(href, title, idx, sub) {
    const a = el("a", "fc-card"); a.href = href;
    a.appendChild(thumbBox("", title, idx, false));
    const b = el("div", "fc-body");
    const txt = el("div"); txt.appendChild(el("h3", "", title));
    if (sub) txt.appendChild(el("p", "", sub));
    b.appendChild(txt); b.appendChild(el("span", "fc-dot"));
    a.appendChild(b);
    return a;
  }

  // ---------- enrollment form ----------
  async function getProfileDefaults() {
    try {
      const c = sb();
      if (!c || !c.auth || typeof c.auth.getUser !== "function") return {};
      const res = await c.auth.getUser();
      const user = res && res.data ? res.data.user : null;
      if (!user) return {};
      const meta = user.user_metadata || {};
      return { name: meta.full_name || meta.name || "", email: user.email || "", userId: user.id || null };
    } catch (e) { return {}; }
  }
  async function currentUser() {
    try { const { data } = await sb().auth.getUser(); return data && data.user ? data.user : null; } catch (e) { return null; }
  }

  async function renderForm(ok) {
    head("Student Information", "তথ্য নিশ্চিত করো", "ভর্তি প্রস্তুতিতে প্রবেশের আগে তোমার তথ্যগুলো পূরণ করো।", "?");
    const r = root();
    const wrap = el("div", "fc-enroll-wrap");
    const panel = el("section", "fc-enroll-card");
    panel.appendChild(el("h2", "", "Information"));
    panel.appendChild(el("p", "", "Admission Course-এ প্রবেশের জন্য অনুগ্রহ করে তোমার তথ্য নিশ্চিত করো।"));
    panel.appendChild(el("div", "fc-enroll-rule"));

    const form = el("form", "fc-enroll-form");
    function field(labelText, name, placeholder, type) {
      const g = el("div", "fc-field");
      const lab = el("label", "", labelText); lab.htmlFor = "adm-enroll-" + name;
      const input = el("input");
      input.id = "adm-enroll-" + name; input.name = name; input.type = type || "text";
      input.placeholder = placeholder; input.required = true;
      input.autocomplete = name === "student_name" ? "name" : (name === "email" ? "email" : (name === "phone_number" ? "tel" : "organization"));
      g.append(lab, input); form.appendChild(g);
      return input;
    }
    const nameI = field("Name", "student_name", "তোমার পুরো নাম", "text");
    const emailI = field("Email", "email", "তোমার ইমেইল", "email");
    const phoneI = field("Phone Number", "phone_number", "মোবাইল নম্বর", "tel");
    phoneI.inputMode = "tel"; phoneI.pattern = "[0-9+() -]{8,20}";
    phoneI.title = "৮ থেকে ২০ অক্ষরের একটি বৈধ ফোন নম্বর দাও।";
    const instI = field("Institution", "institution", "তোমার স্কুল বা কলেজের নাম", "text");
    nameI.maxLength = 120; emailI.maxLength = 254; instI.maxLength = 160;

    form.appendChild(el("p", "fc-enroll-privacy", "তোমার দেওয়া তথ্য কোর্সে নিবন্ধনের জন্য সংরক্ষণ করা হবে এবং কেবল অনুমোদিত অ্যাডমিন দেখতে পারবে।"));
    const consent = el("label", "fc-consent");
    const check = el("input"); check.type = "checkbox"; check.required = true;
    consent.append(check, el("span", "", "আমি নিশ্চিত করছি যে দেওয়া তথ্য সঠিক এবং কোর্সে অংশ নেওয়ার জন্য সম্মতি দিচ্ছি।"));
    form.appendChild(consent);

    const status = el("div", "fc-enroll-status");
    status.setAttribute("role", "status"); status.setAttribute("aria-live", "polite");
    form.appendChild(status);

    const actions = el("div", "fc-enroll-actions");
    const cancel = el("a", "fc-enroll-cancel", "Cancel"); cancel.href = "?";
    const submit = el("button", "fc-enroll-submit", "Enroll"); submit.type = "submit";
    actions.append(cancel, submit); form.appendChild(actions);
    panel.appendChild(form); wrap.appendChild(panel); r.appendChild(wrap);

    const defaults = await getProfileDefaults();
    if (!ok()) return;
    if (defaults.name) nameI.value = defaults.name;
    if (defaults.email) emailI.value = defaults.email;

    form.addEventListener("submit", async ev => {
      ev.preventDefault();
      status.textContent = "";
      if (!form.reportValidity()) return;
      submit.disabled = true; submit.textContent = "Saving...";

      // Registration save kora hoy. Table reject korleo student ke dhukte dewa hoy
      // (DB setup somossa hole jeno learner atke na pore).
      try {
        const client = sb();
        if (client) {
          const { error } = await client.from("free_enrollments").insert({
            batch: "admission",
            student_name: nameI.value.trim(),
            email: emailI.value.trim(),
            phone_number: phoneI.value.trim(),
            institution: instI.value.trim(),
            user_id: defaults.userId || null
          });
          if (error) console.warn("Admission enrollment was not saved:", error);
        }
      } catch (e) { console.warn("Admission enrollment was not saved:", e); }

      try { sessionStorage.setItem(ENROLL_KEY, "1"); } catch (e) {}
      if (!ok()) return;
      try { history.replaceState(null, "", "?page=adm-groups"); } catch (e) {}
      renderGroups(ok);
    });
  }

  function ensureEnrolled(ok) {
    if (enrolled()) return true;
    renderForm(ok);
    return false;
  }

  // ---------- Step 2: group ----------
  function renderGroups(ok) {
    if (!ensureEnrolled(ok)) return;
    head("Select Group", "Admission — গ্রুপ", "", "?");
    const r = root();
    intro(r, "তোমার গ্রুপটি বেছে নাও");
    const g = el("div", "fc-grid");
    GROUPS().forEach((x, i) => g.appendChild(gcCard("?page=adm-menu-" + x[0], x[1], i)));
    r.appendChild(g);
  }

  // ---------- Step 3: menu (Class / Important Practice Sheet / MCQ Practice) ----------
  function renderMenu(g, ok) {
    if (!ensureEnrolled(ok)) return;
    if (!groupOf(g)) return renderGroups(ok);
    saveGroup(g);
    head("Admission", "Admission (" + gname(g) + ")", "", "?page=adm-groups");
    const r = root();
    intro(r, "কী নিয়ে প্রস্তুতি নিতে চাও?");
    const grid = el("div", "fc-grid");
    grid.appendChild(gcCard("?page=adm-classes-" + g, "ক্লাস", 0, "ভিডিও ক্লাস ও লেকচার"));
    grid.appendChild(gcCard("?page=adm-sheets-" + g, "ইম্পরট্যান্ট প্র্যাকটিস শিট", 1, "PDF ও ছবি"));
    grid.appendChild(gcCard("?page=adm-mcq-" + g, "MCQ প্র্যাকটিস", 2, "সাবজেক্ট ও চ্যাপ্টার অনুযায়ী"));
    r.appendChild(grid);
  }

  // group filter: group_key null / "all" / chosen group
  function groupFilter(q, g) { return q.or("group_key.is.null,group_key.eq.all,group_key.eq." + g); }

  // ==================================================
  // 1) CLASS
  // ==================================================
  function classCard(c, idx) {
    const href = "?page=adm-class-" + c.id;
    const article = el("article", "fc-video-card");
    const link = el("a", "fc-video-poster-link"); link.href = href;
    link.setAttribute("aria-label", c.title);
    link.appendChild(thumbBox(c.thumbnail_url, c.title, idx, true));
    article.appendChild(link);

    const body = el("div", "fc-body");
    body.appendChild(el("h3", "", c.title));
    if (c.teacher_name) {
      const meta = el("div", "fc-video-meta");
      const av = safeUrl(c.teacher_photo_url);
      if (av) { const im = document.createElement("img"); im.className = "fc-ava"; im.src = av; im.alt = ""; meta.appendChild(im); }
      else meta.appendChild(el("span", "fc-ava", c.teacher_name.charAt(0).toUpperCase()));
      meta.appendChild(el("span", "", c.teacher_name));
      body.appendChild(meta);
    }
    if (c.description) body.appendChild(el("div", "fc-video-meta", c.description));
    if (!ytId(c.youtube_url)) body.appendChild(el("span", "fc-coming-label", "Video is coming soon"));
    const go = el("a", "fc-watch-button adm-red", "Enroll Now →"); go.href = href;
    body.appendChild(go);
    article.appendChild(body);
    return article;
  }

  async function renderClassList(g, ok) {
    if (!ensureEnrolled(ok)) return;
    if (!groupOf(g)) return renderGroups(ok);
    saveGroup(g);
    head("Admission Class", "ক্লাস", "ভর্তি প্রস্তুতির ক্লাসগুলো বেছে নাও", "?page=adm-menu-" + g);
    const r = root(); msg(r, "লোড হচ্ছে…");
    try {
      const rows = await query(c => groupFilter(c.from(T.classes).select("*").eq("is_active", true), g)
        .order("sort_order", { ascending: true }).order("created_at", { ascending: false }));
      if (!ok()) return; r.innerHTML = "";
      if (!rows.length) return msg(r, "এখনো কোনো ক্লাস যুক্ত হয়নি।");
      const w = el("div", "fc-page");
      const h = el("div", "fc-h", "ক্লাসসমূহ"); h.appendChild(el("small", "", "(" + bn(rows.length) + "টি)")); w.appendChild(h);
      const v = el("div", "fc-video-cards");
      rows.forEach((c, i) => v.appendChild(classCard(c, i)));
      w.appendChild(v); r.appendChild(w);
    } catch (e) { if (ok()) { r.innerHTML = ""; msg(r, "ডেটা লোড করা যায়নি। পরে আবার চেষ্টা করো।"); } console.error(e); }
  }

  function when(s) { try { return new Date(s).toLocaleString("bn-BD", { dateStyle: "medium", timeStyle: "short" }); } catch (e) { return ""; } }

  async function renderClass(id, ok) {
    if (!ensureEnrolled(ok)) return;
    head("Admission Class", "", "", "?page=adm-menu-" + (savedGroup() || ""));
    const r = root(); msg(r, "লোড হচ্ছে…");
    try {
      const c = await query(cl => cl.from(T.classes).select("*").eq("id", id).eq("is_active", true).maybeSingle());
      if (!ok()) return; r.innerHTML = "";
      if (!c) return msg(r, "ক্লাসটি পাওয়া যায়নি।");
      const g = savedGroup();
      head("Admission Class", "", "", g && groupOf(g) ? "?page=adm-classes-" + g : "?page=adm-groups");

      const w = el("div", "fc-page");
      const pl = el("div", "fc-player"); const vid = ytId(c.youtube_url);
      if (vid) {
        const f = document.createElement("iframe");
        f.src = "https://www.youtube-nocookie.com/embed/" + vid + "?rel=0&modestbranding=1";
        f.title = c.title; f.allowFullscreen = true; f.loading = "lazy";
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
      w.appendChild(el("h2", "fc-title", c.title));
      if (c.description) { const d = el("div", "fc-box"); d.appendChild(el("p", "adm-desc", c.description)); w.appendChild(d); }

      if (c.teacher_name) {
        const b = el("div", "fc-box fc-teacher");
        const p = safeUrl(c.teacher_photo_url);
        if (p) { const i = document.createElement("img"); i.src = p; i.alt = ""; b.appendChild(i); }
        else b.appendChild(el("div", "fc-ava", c.teacher_name.charAt(0).toUpperCase()));
        const d = el("div"); d.appendChild(el("b", "", c.teacher_name)); d.appendChild(el("small", "", "Course Instructor")); b.appendChild(d);
        w.appendChild(b);
      }
      if (safeUrl(c.sheet_url)) {
        const b = el("div", "fc-box"); b.appendChild(el("div", "fc-h", "Course Materials"));
        const a = el("a", "fc-sheet", "📄 " + (c.sheet_title || "Lecture Sheet") + " — Open");
        a.href = safeUrl(c.sheet_url); a.target = "_blank"; a.rel = "noopener noreferrer"; b.appendChild(a);
        w.appendChild(b);
      }

      const relHost = el("div"); w.appendChild(relHost);
      const cmHost = el("div"); w.appendChild(cmHost);
      r.appendChild(w);
      loadRelated(c, relHost, ok);
      loadComments(c.id, cmHost, ok);
    } catch (e) { if (ok()) { r.innerHTML = ""; msg(r, "ক্লাস লোড করা যায়নি।"); } console.error(e); }
  }

  async function loadRelated(c, host, ok) {
    try {
      const g = savedGroup();
      let q = sb().from(T.classes).select("id,title,thumbnail_url,teacher_name").eq("is_active", true);
      if (g) q = groupFilter(q, g);
      const { data, error } = await q.order("sort_order", { ascending: true }).order("created_at", { ascending: false });
      if (error) throw error;
      if (!ok() || !data || data.length < 2) return;
      const h = el("div", "fc-h", "আরও ক্লাস"); h.appendChild(el("small", "", "(" + bn(data.length) + "টি)")); host.appendChild(h);
      const l = el("div", "fc-list"); l.style.marginTop = "10px";
      data.forEach(x => {
        const a = el("a", "fc-item" + (x.id === c.id ? " on" : "")); a.href = "?page=adm-class-" + x.id;
        const t = el("div", "t"); const u = safeUrl(x.thumbnail_url);
        if (u) { const i = document.createElement("img"); i.src = u; i.alt = ""; i.loading = "lazy"; i.onerror = () => i.remove(); t.appendChild(i); }
        const ic = el("i"); ic.innerHTML = PLAY_SVG.replace(/width="28" height="28"/, 'width="16" height="16"'); t.appendChild(ic);
        a.appendChild(t);
        const d = el("div"); d.appendChild(el("b", "", x.title)); if (x.teacher_name) d.appendChild(el("small", "", x.teacher_name)); a.appendChild(d);
        l.appendChild(a);
      });
      host.appendChild(l);
    } catch (e) { console.error(e); }
  }

  // comments (admission_comments)
  async function loadComments(classId, host, ok) {
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
        const { error } = await sb().from(T.comments).insert({
          class_id: classId, user_id: user.id, user_name: name, avatar_url: meta.avatar_url || meta.picture || null, content: text
        });
        bt.disabled = false;
        if (error) { alert("কমেন্ট করা যায়নি। আবার চেষ্টা করো।"); console.error(error); return; }
        ta.value = ""; refresh();
      });
      form.append(ta, bt);
    }

    async function refresh() {
      try {
        const rows = await query(c => c.from(T.comments).select("*").eq("class_id", classId).order("created_at", { ascending: false }).limit(100));
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
            x.addEventListener("click", async () => { if (!confirm("কমেন্টটি মুছে ফেলবে?")) return; await sb().from(T.comments).delete().eq("id", c.id); refresh(); });
            d.appendChild(x);
          }
          row.appendChild(d); list.appendChild(row);
        });
      } catch (e) { console.error(e); }
    }
    refresh();
  }

  // ==================================================
  // 2) IMPORTANT PRACTICE SHEET
  // ==================================================
  function sheetImages(s) {
    const list = [];
    if (safeUrl(s.image_url)) list.push(safeUrl(s.image_url));
    (Array.isArray(s.image_urls) ? s.image_urls : []).forEach(u => { if (safeUrl(u)) list.push(safeUrl(u)); });
    return list;
  }
  function sheetCard(s, idx) {
    const href = "?page=adm-sheet-" + s.id;
    const article = el("article", "fc-video-card");
    const link = el("a", "fc-video-poster-link"); link.href = href;
    link.setAttribute("aria-label", s.title);
    link.appendChild(thumbBox(s.thumbnail_url || sheetImages(s)[0], s.title, idx, false));
    article.appendChild(link);

    const body = el("div", "fc-body");
    body.appendChild(el("h3", "", s.title));
    const chips = el("div", "adm-chips");
    if (safeUrl(s.pdf_url)) chips.appendChild(el("span", "adm-chip", "📄 PDF"));
    if (sheetImages(s).length) chips.appendChild(el("span", "adm-chip", "🖼 ছবি"));
    if (chips.childNodes.length) body.appendChild(chips);
    if (s.caption) body.appendChild(el("div", "fc-video-meta", s.caption));
    const go = el("a", "fc-watch-button adm-red", "খুলে দেখো →"); go.href = href;
    body.appendChild(go);
    article.appendChild(body);
    return article;
  }

  async function renderSheets(g, ok) {
    if (!ensureEnrolled(ok)) return;
    if (!groupOf(g)) return renderGroups(ok);
    saveGroup(g);
    head("Practice Sheet", "ইম্পরট্যান্ট প্র্যাকটিস শিট", "", "?page=adm-menu-" + g);
    const r = root(); msg(r, "লোড হচ্ছে…");
    try {
      const rows = await query(c => groupFilter(c.from(T.sheets).select("*").eq("is_active", true), g)
        .order("sort_order", { ascending: true }).order("created_at", { ascending: false }));
      if (!ok()) return; r.innerHTML = "";
      const out = el("div"); r.appendChild(out);

      function draw(text) {
        out.innerHTML = "";
        if (!rows.length) return msg(out, "এখনো কোনো প্র্যাকটিস শিট যুক্ত হয়নি।");
        const q = norm(text);
        const list = q ? rows.filter(s => norm([s.title, s.caption].join(" ")).includes(q)) : rows;
        if (!list.length) return msg(out, "কোনো প্র্যাকটিস শিট পাওয়া যায়নি।");
        const w = el("div", "fc-page");
        const h = el("div", "fc-h", "প্র্যাকটিস শিট"); h.appendChild(el("small", "", "(" + bn(list.length) + "টি)")); w.appendChild(h);
        const v = el("div", "fc-video-cards");
        list.forEach((s, i) => v.appendChild(sheetCard(s, i)));
        w.appendChild(v); out.appendChild(w);
      }
      // Header search bar ei page-er sheet gulo filter kore
      if (window.CMAPageSearch) window.CMAPageSearch.register(out, draw, "প্র্যাকটিস শিট খোঁজো…");
      draw("");
    } catch (e) { if (ok()) { r.innerHTML = ""; msg(r, "ডেটা লোড করা যায়নি। পরে আবার চেষ্টা করো।"); } console.error(e); }
  }

  async function renderSheet(id, ok) {
    if (!ensureEnrolled(ok)) return;
    const g = savedGroup();
    head("Practice Sheet", "", "", g && groupOf(g) ? "?page=adm-sheets-" + g : "?page=adm-groups");
    const r = root(); msg(r, "লোড হচ্ছে…");
    try {
      const s = await query(c => c.from(T.sheets).select("*").eq("id", id).eq("is_active", true).maybeSingle());
      if (!ok()) return; r.innerHTML = "";
      if (!s) return msg(r, "প্র্যাকটিস শিটটি পাওয়া যায়নি।");
      head("Practice Sheet", s.title, "", g && groupOf(g) ? "?page=adm-sheets-" + g : "?page=adm-groups");

      const w = el("div", "fc-page");
      w.appendChild(el("h2", "fc-title", s.title));
      if (s.caption) { const d = el("div", "fc-box"); d.appendChild(el("p", "adm-desc", s.caption)); w.appendChild(d); }

      const imgs = sheetImages(s);
      if (imgs.length) {
        const box = el("div", "adm-imgs");
        imgs.forEach(u => {
          const a = el("a"); a.href = u; a.target = "_blank"; a.rel = "noopener noreferrer";
          const im = document.createElement("img"); im.src = u; im.alt = s.title; im.loading = "lazy";
          a.appendChild(im); box.appendChild(a);
        });
        w.appendChild(box);
      }

      const pdf = safeUrl(s.pdf_url);
      if (pdf) {
        const btns = el("div", "adm-btns");
        const open = el("a", "fc-watch-button adm-red", "📄  PDF খুলো");
        open.href = pdf; open.target = "_blank"; open.rel = "noopener noreferrer";
        const dl = el("a", "fc-watch-button", "⬇  ডাউনলোড");
        dl.href = pdf; dl.target = "_blank"; dl.rel = "noopener noreferrer"; dl.setAttribute("download", "");
        btns.append(open, dl); w.appendChild(btns);
        // Inline viewer (phone WebView e PDF iframe kaj kore na, tai Google viewer)
        const f = document.createElement("iframe");
        f.className = "adm-pdf"; f.title = s.title; f.loading = "lazy";
        f.src = "https://docs.google.com/gview?embedded=1&url=" + encodeURIComponent(pdf);
        w.appendChild(f);
      }
      if (!imgs.length && !pdf) w.appendChild(el("div", "fc-msg", "এই পোস্টে এখনো কোনো ফাইল যুক্ত হয়নি।"));
      r.appendChild(w);
    } catch (e) { if (ok()) { r.innerHTML = ""; msg(r, "ডেটা লোড করা যায়নি।"); } console.error(e); }
  }

  // ==================================================
  // 3) MCQ PRACTICE  (group -> subject -> chapter(+search) -> posts -> exam)
  // Posts window.onlineExamPosts e thake (program: "admission"), tai existing exam engine-i chole.
  // ==================================================
  // DEMO post (sotti-i kaj kore) — real post admin panel (admission_mcq_posts) theke ashbe.
  const DEMO = [{
    id: "adm-demo-physics-ch1-01",
    program: "admission", group: "science", subject: "physics", part: null,
    chapter: "1", chapterName: "ভৌত জগৎ ও পরিমাপ",
    title: "ভৌত জগৎ ও পরিমাপ পরীক্ষা",
    caption: "ডেমো পোস্ট — পরিমাপ ও এককের মৌলিক ধারণা যাচাই করো।",
    duration: 5, mcqCount: 5,
    questions: [
      { question: "দৈর্ঘ্যের SI একক কোনটি?", options: ["সেন্টিমিটার", "মিটার", "কিলোমিটার", "ইঞ্চি"], answer: 1 },
      { question: "ভরের SI একক কোনটি?", options: ["গ্রাম", "পাউন্ড", "কিলোগ্রাম", "টন"], answer: 2 },
      { question: "সময়ের SI একক কোনটি?", options: ["মিনিট", "ঘণ্টা", "দিন", "সেকেন্ড"], answer: 3 },
      { question: "কোনটি স্কেলার রাশি?", options: ["বেগ", "ভর", "সরণ", "বল"], answer: 1 },
      { question: "১ কিলোমিটার = কত মিটার?", options: ["১০", "১০০", "১০০০", "১০০০০"], answer: 2 }
    ]
  }];

  function backPageOf(p) {
    return "adm-mcq-chapter-" + (p.group && p.group !== "all" ? p.group : "science") + "-" + p.subject + "-" + encodeURIComponent(p.chapter);
  }
  function addPost(p) {
    if (!Array.isArray(window.onlineExamPosts)) window.onlineExamPosts = [];
    p.backPage = p.backPage || backPageOf(p);
    if (!window.onlineExamPosts.some(x => x.id === p.id)) window.onlineExamPosts.push(p);
  }
  DEMO.forEach(addPost);

  let postsPromise = null;
  function ensurePosts() {
    if (postsPromise) return postsPromise;
    postsPromise = (async function () {
      try {
        const c = sb(); if (!c) { postsPromise = null; return; }
        const { data, error } = await c.from(T.mcq).select("*").eq("is_active", true).order("sort_order", { ascending: true });
        if (error) throw error;
        (data || []).forEach(r => {
          const qs = Array.isArray(r.questions) ? r.questions : [];
          addPost({
            id: String(r.id).indexOf("adm-") === 0 ? String(r.id) : "adm-" + r.id,
            program: "admission", group: r.group_key || "all", subject: r.subject, part: null,
            chapter: String(r.chapter == null ? "" : r.chapter), chapterName: r.chapter_name || "",
            title: r.title, caption: r.caption || "",
            duration: Number(r.duration || 20), mcqCount: qs.length, questions: qs,
            image: safeUrl(r.image_url) || undefined
          });
        });
      } catch (e) { console.warn("Admission MCQ posts could not be loaded:", e); postsPromise = null; }
    })();
    return postsPromise;
  }

  function allPosts(g, subjectKey) {
    const list = Array.isArray(window.onlineExamPosts) ? window.onlineExamPosts : [];
    return list.filter(p =>
      String(p.program || "").toLowerCase() === "admission" &&
      (!p.group || p.group === "all" || p.group === g) &&
      (!subjectKey || String(p.subject || "").toLowerCase() === subjectKey));
  }
  function chaptersOf(g, subjectKey) {
    const map = new Map();
    allPosts(g, subjectKey).forEach(p => {
      const key = String(p.chapter == null ? "" : p.chapter);
      if (!map.has(key)) map.set(key, { key, name: p.chapterName || ("Chapter " + key), count: 0 });
      map.get(key).count++;
    });
    return Array.from(map.values()).sort((a, b) => String(a.key).localeCompare(String(b.key), undefined, { numeric: true }));
  }

  function postCard(p, idx) {
    const title = p.title || "Online Examination";
    const href = "?page=online-exam-start-" + encodeURIComponent(String(p.id || ""));
    const article = el("article", "fc-video-card");
    const link = el("a", "fc-video-poster-link"); link.href = href;
    link.setAttribute("aria-label", "Start " + title);
    link.appendChild(thumbBox(p.image, title, idx || 0, false));
    article.appendChild(link);

    const body = el("div", "fc-body");
    body.appendChild(el("h3", "", title));
    const mcq = Number(p.mcqCount || (p.questions || []).length || 0);
    const dur = Number(p.duration || 0);
    const total = p.totalMarks !== undefined ? Number(p.totalMarks) : mcq * Number(p.marksPerQuestion || 1);
    if (p.chapterName) body.appendChild(el("div", "fc-video-meta", "অধ্যায় " + bn(p.chapter) + " • " + p.chapterName));
    body.appendChild(el("div", "fc-video-meta", bn(dur) + " মিনিট  •  " + bn(mcq) + "টি MCQ  •  " + bn(total) + " নম্বর"));
    if (p.caption) body.appendChild(el("div", "fc-video-meta", p.caption));
    const go = el("a", "fc-watch-button", "✍  Prove Yourself"); go.href = href;
    body.appendChild(go);
    article.appendChild(body);
    return article;
  }

  function renderMcqSubjects(g, ok) {
    if (!ensureEnrolled(ok)) return;
    if (!groupOf(g)) return renderGroups(ok);
    saveGroup(g);
    head("Select Subject", "MCQ প্র্যাকটিস (" + gname(g) + ") — সাবজেক্ট", "", "?page=adm-menu-" + g);
    const r = root();
    const list = subjectsFor(g);
    if (!list.length) return msg(r, "সাবজেক্ট তালিকা লোড করা যায়নি।");
    intro(r, bn(list.length) + "টি সাবজেক্ট — তোমার সাবজেক্টটি বেছে নাও");
    const grid = el("div", "fc-grid");
    const d = CP();
    list.forEach((x, i) => grid.appendChild(gcCard("?page=adm-mcq-subject-" + g + "-" + x[0], x[1], i, x[2] === d.REQ ? "" : x[2])));
    r.appendChild(grid);
  }

  async function renderMcqChapters(g, key, ok) {
    if (!ensureEnrolled(ok)) return;
    if (!groupOf(g)) return renderGroups(ok);
    saveGroup(g);
    head("Select Chapter", subjectName(key), "", "?page=adm-mcq-" + g);
    const r = root(); msg(r, "লোড হচ্ছে…");
    await ensurePosts();
    if (!ok()) return; r.innerHTML = "";

    const out = el("div"); r.appendChild(out);
    const chapters = chaptersOf(g, key);
    const posts = allPosts(g, key);

    function draw(text) {
      out.innerHTML = "";
      const q = norm(text);
      if (!chapters.length) return msg(out, "এই সাবজেক্টে এখনো কোনো চ্যাপ্টার যুক্ত হয়নি।");
      const cs = chapters.filter(c => !q || norm(c.name).includes(q) || norm(c.key).includes(q) || norm("chapter " + c.key).includes(q));
      const ps = q ? posts.filter(p => norm([p.title, p.chapterName, p.chapter, p.caption].join(" ")).includes(q)) : [];
      if (!cs.length && !ps.length) return msg(out, "কোনো চ্যাপ্টার বা পোস্ট পাওয়া যায়নি।");
      if (cs.length) {
        intro(out, bn(cs.length) + "টি চ্যাপ্টার — তোমার শেখার যাত্রা শুরু করো");
        const grid = el("div", "fc-grid");
        cs.forEach((c, i) => grid.appendChild(gcCard("?page=adm-mcq-chapter-" + g + "-" + key + "-" + encodeURIComponent(c.key), c.name, i)));
        out.appendChild(grid);
      }
      if (ps.length) {
        const sec = el("div", "fc-page"); sec.style.marginTop = "26px";
        const h = el("div", "fc-h", "পোস্ট"); h.appendChild(el("small", "", "(" + bn(ps.length) + ")")); sec.appendChild(h);
        const v = el("div", "fc-video-cards");
        ps.forEach((p, i) => v.appendChild(postCard(p, i)));
        sec.appendChild(v); out.appendChild(sec);
      }
    }
    if (window.CMAPageSearch) window.CMAPageSearch.register(out, draw, "চ্যাপ্টারের নাম বা নম্বর খোঁজো…");
    draw("");
  }

  async function renderMcqPosts(g, key, chapterKey, ok) {
    if (!ensureEnrolled(ok)) return;
    if (!groupOf(g)) return renderGroups(ok);
    saveGroup(g);
    head("Practice Exam", "Chapter " + chapterKey, "", "?page=adm-mcq-subject-" + g + "-" + key);
    const r = root(); msg(r, "লোড হচ্ছে…");
    await ensurePosts();
    if (!ok()) return; r.innerHTML = "";
    const list = allPosts(g, key).filter(p => String(p.chapter) === String(chapterKey));
    const title = list.length && list[0].chapterName ? list[0].chapterName : ("Chapter " + chapterKey);
    head("Practice Exam", title, "এই চ্যাপ্টারের পরীক্ষাগুলো বেছে নাও", "?page=adm-mcq-subject-" + g + "-" + key);
    if (!list.length) return msg(r, "এই চ্যাপ্টারে এখনো কোনো পোস্ট যুক্ত হয়নি।");
    const w = el("div", "fc-page");
    const h = el("div", "fc-h", "পরীক্ষাসমূহ"); h.appendChild(el("small", "", "(" + bn(list.length) + " exam)")); w.appendChild(h);
    const v = el("div", "fc-video-cards");
    list.forEach((p, i) => v.appendChild(postCard(p, i)));
    w.appendChild(v); r.appendChild(w);
  }

  // ---------- router entry ----------
  function render(page, isCurrent) {
    const ok = typeof isCurrent === "function" ? isCurrent : () => true;
    let m;
    if (page === "adm-start") return renderForm(ok);       // home card always asks for the form
    if (page === "adm-groups") return renderGroups(ok);
    if ((m = page.match(/^adm-menu-([a-z]+)$/))) return renderMenu(m[1], ok);
    if ((m = page.match(/^adm-classes-([a-z]+)$/))) return renderClassList(m[1], ok);
    if ((m = page.match(/^adm-class-(.+)$/))) return renderClass(m[1], ok);
    if ((m = page.match(/^adm-sheets-([a-z]+)$/))) return renderSheets(m[1], ok);
    if ((m = page.match(/^adm-sheet-(.+)$/))) return renderSheet(m[1], ok);
    if ((m = page.match(/^adm-mcq-subject-([a-z]+)-(.+)$/))) return renderMcqChapters(m[1], m[2], ok);
    if ((m = page.match(/^adm-mcq-chapter-([a-z]+)-(.+)-([^-]+)$/))) return renderMcqPosts(m[1], m[2], decodeURIComponent(m[3]), ok);
    if ((m = page.match(/^adm-mcq-([a-z]+)$/))) return renderMcqSubjects(m[1], ok);
    notFound();
  }
  window.CMAAdmission = { render: render, ensurePosts: ensurePosts };
})();
