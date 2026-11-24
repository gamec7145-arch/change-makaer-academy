// ==================================================
// CHANGE MAKER ACADEMY — GUIDE (book button, top right)
// Page 1  ?page=guide                  -> search + posts (image, caption, description)
// Page 2  ?page=guide-post-<postId>    -> posts inside (image + caption)
// Page 3  ?page=guide-pdf-<postId>-<itemId> -> PDF viewer (no download / no open-in-new)
//
// Data ashe Supabase (guide_posts, guide_items) theke. Post add/edit/delete hoy
// admin-guide.html theke. Supabase table na thakle niche DEMO_DATA dekhay.
// ==================================================
(function () {
  "use strict";

  const DEMO_DATA = [
    {
      id: "p1",
      title: "HSC ইংরেজি গাইড",
      desc: "HSC ইংরেজি ১ম ও ২য় পত্রের সম্পূর্ণ গাইড ও নোট একসাথে।",
      image: "guides/img/english.svg",
      items: [
        { id: "i1", title: "Chapter 1 — Reading Skill", desc: "প্র্যাকটিস সহ সম্পূর্ণ নোট", image: "guides/img/ch1.svg", pdf: "guides/pdf/demo-1.pdf" },
        { id: "i2", title: "Chapter 2 — Writing Skill", desc: "Paragraph, Letter ও Composition", image: "guides/img/ch2.svg", pdf: "guides/pdf/demo-2.pdf" }
      ]
    },
    {
      id: "p2",
      title: "HSC পদার্থবিজ্ঞান গাইড",
      desc: "পদার্থবিজ্ঞান ১ম পত্রের অধ্যায়ভিত্তিক গাইড।",
      image: "guides/img/physics.svg",
      items: [
        { id: "i1", title: "Chapter 1 — ভৌত জগৎ ও পরিমাপ", desc: "সংক্ষিপ্ত নোট ও সূত্র", image: "guides/img/ch1.svg", pdf: "guides/pdf/demo-2.pdf" }
      ]
    }
  ];

  // pdf.js local copy (CDN dependency nei, offline cache e-o kaj korbe)
  const PDFJS = "guides/lib/pdf.min.mjs";
  const PDFJS_WORKER = "guides/lib/pdf.worker.min.mjs";

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  const css = document.createElement("style");
  css.textContent = `
  .gd-back{display:inline-flex;align-items:center;gap:6px;margin:4px 0 14px;padding:8px 14px;border-radius:99px;background:#fff0f1;color:#c92a44;font-weight:800;text-decoration:none;font-size:15px}
  .gd-head h1{margin:0 0 4px;font-size:26px;font-weight:900;color:#1a2238}
  .gd-head p{margin:0 0 16px;color:#6b7482;font-size:15px;line-height:1.6}
  .gd-search{display:flex;align-items:center;gap:10px;margin:0 0 18px;padding:0 16px;height:52px;border-radius:18px;background:#fff;border:1.5px solid #f3dcdf;box-shadow:0 8px 22px -16px rgba(201,42,68,.5)}
  .gd-search svg{flex:none;color:#c92a44}
  .gd-search input{flex:1;min-width:0;border:0;outline:0;background:transparent;font:inherit;font-size:16px;color:#1a2238}
  .gd-list{display:grid;gap:20px}
  .gd-card{display:block;text-decoration:none;color:#1a2238;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 14px 34px -16px rgba(64,56,140,.32),0 2px 6px rgba(64,56,140,.06);transition:transform .2s}
  .gd-card:active{transform:scale(.985)}
  .gd-card img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;background:#f6e9eb}
  .gd-body{padding:14px 18px 18px}
  .gd-body h3{margin:0 0 6px;font-size:19px;font-weight:800;line-height:1.35}
  .gd-body p{margin:0;color:#6b7482;font-size:14.5px;line-height:1.6}
  .gd-empty{padding:34px 18px;text-align:center;color:#6b7482;font-weight:700;background:#fff;border:1px dashed #f1b0b6;border-radius:22px}
  .gd-viewer{display:grid;gap:12px}
  .gd-pages{display:grid;gap:10px;justify-items:center;background:#e9ebf0;border-radius:16px;padding:10px;min-height:240px}
  .gd-pages canvas{width:100%;height:auto;border-radius:6px;background:#fff;box-shadow:0 4px 14px -6px rgba(0,0,0,.35);-webkit-user-select:none;user-select:none}
  .gd-status{text-align:center;color:#6b7482;font-weight:700;padding:30px 10px}
  `;
  document.head.appendChild(css);

  const SEARCH_SVG = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>';

  function hero(title, desc) {
    const h = el("div", "gd-head");
    h.append(el("h1", "", title));
    if (desc) h.append(el("p", "", desc));
    return h;
  }
  function back(href, label) {
    const a = el("a", "gd-back", "← " + label);
    a.href = href;
    return a;
  }
  function card(href, image, title, desc) {
    const a = el("a", "gd-card");
    a.href = href;
    const b = el("div", "gd-body");
    b.append(el("h3", "", title), el("p", "", desc));
    if (image) {
      const img = el("img");
      img.src = image; img.alt = title; img.loading = "lazy"; img.draggable = false;
      a.append(img);
    }
    a.append(b);
    return a;
  }

  // ---------- data ----------
  const sb = () => window.cmaSupabase;
  const norm = r => ({ id: String(r.id), title: r.title, desc: r.description || "", image: r.image_url || "", pdf: r.pdf_url || "" });

  async function fetchPosts() {
    if (!sb()) return DEMO_DATA;
    const { data, error } = await sb().from("guide_posts").select("*").eq("is_active", true)
      .order("sort_order", { ascending: true }).order("id", { ascending: true });
    if (error) { console.warn("Guide: using demo data", error.message); return DEMO_DATA; }
    return data.map(norm);
  }
  async function fetchPost(id) {
    if (!sb()) return DEMO_DATA.find(p => p.id === id) || null;
    const { data: post, error } = await sb().from("guide_posts").select("*").eq("id", id).eq("is_active", true).maybeSingle();
    if (error) { return DEMO_DATA.find(p => p.id === id) || null; }
    if (!post) return null;
    const { data: items } = await sb().from("guide_items").select("*").eq("post_id", id).eq("is_active", true)
      .order("sort_order", { ascending: true }).order("id", { ascending: true });
    const p = norm(post); p.items = (items || []).map(norm);
    return p;
  }
  function loading(root) { const d = el("div", "gd-status", "লোড হচ্ছে..."); root.append(d); return d; }
  function safeImg(u) { return /^(https?:\/\/|guides\/)/i.test(u || "") ? u : ""; }

  // ---------- page 1 ----------
  async function renderList(root, isCurrent) {
    root.append(back("?", "Back to Homepage"), hero("গাইড", "তোমার প্রয়োজনীয় গাইড ও নোট খুঁজে নাও।"));
    const sbx = el("label", "gd-search");
    sbx.insertAdjacentHTML("beforeend", SEARCH_SVG);
    const input = el("input");
    input.type = "search"; input.placeholder = "গাইড খুঁজুন..."; input.autocomplete = "off";
    sbx.append(input);
    const list = el("div", "gd-list");
    root.append(sbx, list);
    const ld = loading(list);
    const posts = await fetchPosts();
    if (!isCurrent()) return;
    ld.remove();
    function draw() {
      const q = input.value.trim().toLowerCase();
      list.innerHTML = "";
      const rows = posts.filter(p => !q || (p.title + " " + p.desc).toLowerCase().includes(q));
      if (!rows.length) { list.append(el("div", "gd-empty", q ? "কিছু পাওয়া যায়নি।" : "এখনো কোনো গাইড যোগ করা হয়নি।")); return; }
      rows.forEach(p => list.append(card("?page=guide-post-" + p.id, safeImg(p.image), p.title, p.desc)));
    }
    input.addEventListener("input", draw);
    draw();
  }

  // ---------- page 2 ----------
  async function renderPost(root, id, isCurrent) {
    const ld = loading(root);
    const post = await fetchPost(id);
    if (!isCurrent()) return;
    ld.remove();
    if (!post) { root.append(back("?page=guide", "Back"), el("div", "gd-empty", "পোস্টটি পাওয়া যায়নি।")); return; }
    root.append(back("?page=guide", "Back"), hero(post.title, post.desc));
    const list = el("div", "gd-list");
    if (!post.items.length) list.append(el("div", "gd-empty", "এই পোস্টে এখনো কিছু যোগ করা হয়নি।"));
    post.items.forEach(it => list.append(card("?page=guide-pdf-" + post.id + "-" + it.id, safeImg(it.image), it.title, it.desc)));
    root.append(list);
  }

  // ---------- page 3 ----------
  let pdfLibPromise = null;
  function loadPdfJs() {
    if (!pdfLibPromise) {
      pdfLibPromise = import(new URL(PDFJS, document.baseURI).href).then(lib => {
        lib.GlobalWorkerOptions.workerSrc = new URL(PDFJS_WORKER, document.baseURI).href;
        return lib;
      });
      pdfLibPromise.catch(() => { pdfLibPromise = null; });
    }
    return pdfLibPromise;
  }
  async function renderPdf(root, postId, itemId, isCurrent) {
    const ld = loading(root);
    const post = await fetchPost(postId);
    if (!isCurrent()) return;
    ld.remove();
    const item = post && post.items.find(i => i.id === itemId);
    if (!item) { root.append(back("?page=guide", "Back"), el("div", "gd-empty", "পেজটি পাওয়া যায়নি।")); return; }
    root.append(back("?page=guide-post-" + post.id, "Back"), hero(item.title, post.title));
    const wrap = el("div", "gd-viewer");
    const pages = el("div", "gd-pages");
    const status = el("div", "gd-status", item.pdf ? "PDF লোড হচ্ছে..." : "PDF শীঘ্রই আসছে।");
    pages.append(status);
    wrap.append(pages);
    root.append(wrap);
    if (!item.pdf) return;
    pages.addEventListener("contextmenu", e => e.preventDefault());

    loadPdfJs().then(lib => lib.getDocument({ url: new URL(item.pdf, document.baseURI).href }).promise).then(async pdf => {
      status.remove();
      for (let n = 1; n <= pdf.numPages; n++) {
        if (!isCurrent()) return;
        const page = await pdf.getPage(n);
        const vp = page.getViewport({ scale: Math.min(2.5, (window.devicePixelRatio || 1) * 1.6) });
        const cv = document.createElement("canvas");
        cv.width = vp.width; cv.height = vp.height;
        pages.append(cv);
        await page.render({ canvasContext: cv.getContext("2d"), viewport: vp }).promise;
      }
    }).catch(() => {
      status.textContent = "PDF লোড করা যায়নি। ইন্টারনেট চেক করে আবার চেষ্টা করো।";
    });
  }

  // ---------- entry (called from router.js) ----------
  window.CMAGuide = {
    render: function (page, isCurrent) {
      const root = document.getElementById("pageContent");
      if (!root) return false;
      document.title = "গাইড | Change Maker Academy";
      let m;
      if (page === "guide") { renderList(root, isCurrent); return true; }
      if ((m = page.match(/^guide-post-(\w+)$/))) { renderPost(root, m[1], isCurrent); return true; }
      if ((m = page.match(/^guide-pdf-(\w+)-(\w+)$/))) { renderPdf(root, m[1], m[2], isCurrent); return true; }
      return false;
    }
  };
})();
