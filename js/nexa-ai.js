// ==================================================
// CHANGE MAKER ACADEMY
// NEXA AI: ChatGPT-style study chat
//   - text prosno  -> likhe likhe (streaming) uttor
//   - photo upload -> AI photo pore uttor dey
//   - chat history -> phone-e save (localStorage), drawer theke dekha/delete
// Route (router.js): ?page=demo-ai  (ba ?page=nexa)
// Backend: POST /api/nexa  (api/nexa.js, Gemini free tier)
// ==================================================
(function () {
  "use strict";

  var KEY = "cmaNexaChats";
  var MAX_CHATS = 30;
  var MAX_MSGS_PER_CHAT = 60;
  var SEND_HISTORY = 16;
  var IMG_MAX_SIDE = 1280;   // AI-r jonno photo-r max width/height
  var THUMB_SIDE = 150;      // history-te rakha chhoto copy

  var SUGGESTIONS = [
    "ফটোসিন্থেসিস সহজ করে বুঝিয়ে দাও",
    "পরীক্ষার আগের ৭ দিনের পড়ার রুটিন বানিয়ে দাও",
    "Tense কীভাবে মনে রাখব?"
  ];

  function ico(path, size, sw) {
    return '<svg viewBox="0 0 24 24" width="' + (size || 22) + '" height="' + (size || 22) +
      '" fill="none" stroke="currentColor" stroke-width="' + (sw || 2) +
      '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + path + "</svg>";
  }
  var I = {
    spark: ico('<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>'),
    menu: ico('<path d="M4 7h16M4 12h16M4 17h10"/>'),
    plus: ico('<path d="M12 5v14M5 12h14"/>'),
    cam: ico('<path d="M4 8h3l1.6-2.4h6.8L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.6"/>'),
    send: ico('<path d="M12 19V5M5 12l7-7 7 7"/>', 22, 2.6),
    stop: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2.5"/></svg>',
    close: ico('<path d="M6 6l12 12M18 6L6 18"/>', 18, 2.6),
    trash: ico('<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/>', 19),
    pen: ico('<path d="M4 20h4L19 9l-4-4L4 16z"/>', 26),
    back: ico('<path d="M15 5l-7 7 7 7"/>'),
    home: ico('<path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>')
  };

  var state = { chats: [], id: null, busy: false, pending: null, ctrl: null };
  var els = {};

  // ---------- helpers ----------
  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function uid() { return "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  // ---------- tiny markdown ----------
  function inline(s) {
    return esc(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[\s(])\*([^*\s][^*]*?)\*(?=[\s).,!?:;]|$)/g, "$1<em>$2</em>");
  }
  function renderText(text) {
    var lines = String(text || "").split("\n"), html = "", list = null;
    function close() { if (list) { html += "</" + list + ">"; list = null; } }
    lines.forEach(function (raw) {
      var line = raw.replace(/\s+$/, "");
      var ul = /^\s*[-*•]\s+(.*)$/.exec(line);
      var ol = /^\s*\d+[.)]\s+(.*)$/.exec(line);
      if (ul) {
        if (list !== "ul") { close(); html += "<ul>"; list = "ul"; }
        html += "<li>" + inline(ul[1]) + "</li>";
      } else if (ol) {
        if (list !== "ol") { close(); html += "<ol>"; list = "ol"; }
        html += "<li>" + inline(ol[1]) + "</li>";
      } else if (!line.trim()) {
        close();
      } else {
        close();
        var h = /^#{1,6}\s+(.*)$/.exec(line);
        html += "<p>" + (h ? "<strong>" + inline(h[1]) + "</strong>" : inline(line)) + "</p>";
      }
    });
    close();
    return html;
  }
  function render(text) {
    var parts = String(text || "").split("```"), html = "";
    parts.forEach(function (part, i) {
      if (i % 2 === 1) {
        html += "<pre><code>" + esc(part.replace(/^[^\n]*\n/, "")) + "</code></pre>";
      } else {
        html += renderText(part);
      }
    });
    return html;
  }

  // ---------- storage ----------
  function loadChats() {
    try {
      var d = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (!Array.isArray(d)) return [];
      return d.filter(function (c) { return c && c.id && Array.isArray(c.messages); });
    } catch (e) { return []; }
  }
  function saveChats() {
    state.chats.sort(function (a, b) { return (b.updated || 0) - (a.updated || 0); });
    state.chats = state.chats.slice(0, MAX_CHATS);
    var json;
    try {
      json = JSON.stringify(state.chats);
      localStorage.setItem(KEY, json);
    } catch (e) {
      // jaiga shesh hole chhoto photo-gulo bad diye abar try
      try {
        state.chats.forEach(function (c) { c.messages.forEach(function (m) { delete m.img; }); });
        localStorage.setItem(KEY, JSON.stringify(state.chats));
      } catch (e2) {}
    }
  }
  function current() {
    for (var i = 0; i < state.chats.length; i++) if (state.chats[i].id === state.id) return state.chats[i];
    return null;
  }

  // ---------- styles ----------
  function injectStyles() {
    if (document.getElementById("cmaNexaCss")) return;
    var st = document.createElement("style");
    st.id = "cmaNexaCss";
    st.textContent = [
      ".nx{--ink:#1c2236;--mut:#69728a;--card:#fff;--line:#f0dedd;--soft:#fff2f1;--acc:#d6304a;--grad:linear-gradient(135deg,#ef4a52,#c92a44);--shadow:rgba(201,42,68,.7);",
      " position:relative;display:flex;flex-direction:column;height:calc(100vh - 28px);height:calc(100dvh - 28px);max-width:820px;margin:0 auto;color:var(--ink)}",
      "html[data-theme=\"dark\"]:not(#_) .nx{--ink:#fff;--mut:#9fb0d0;--card:#0e1a36;--line:#1f3263;--soft:#0f1d3f;--acc:#4c93ff;--grad:linear-gradient(135deg,#4c93ff,#2563eb);--shadow:rgba(37,99,235,.8)}",
      ".nx *{box-sizing:border-box}",
      ".nx-head{display:flex;align-items:center;gap:10px;padding:4px 0 10px;flex:0 0 auto}",
      ".nx-ib{flex:0 0 44px;width:44px;height:44px;display:grid;place-items:center;border:0;border-radius:15px;background:var(--soft);color:var(--acc);cursor:pointer;box-shadow:inset 0 0 0 1px var(--line)}",
      ".nx-ib:active{transform:scale(.92)}",
      ".nx-title{flex:1;min-width:0;text-align:center}",
      ".nx-title h1{margin:0;font-size:20px;font-weight:900;line-height:1.2;color:var(--ink)}",
      ".nx-title h1 em{font-style:normal;color:var(--acc)}",
      ".nx-log{flex:1 1 auto;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:4px 2px 14px;display:flex;flex-direction:column;gap:16px}",
      /* welcome */
      ".nx-welcome{margin:auto 0;text-align:center;padding:10px 4px}",
      ".nx-orb{width:64px;height:64px;margin:0 auto 12px;border-radius:22px;display:grid;place-items:center;color:#fff;background:var(--grad);box-shadow:0 16px 28px -14px var(--shadow)}",
      ".nx-orb svg{width:32px;height:32px}",
      ".nx-welcome h2{margin:0 0 6px;font-size:22px;font-weight:900;color:var(--ink)}",
      ".nx-welcome p{margin:0 auto 16px;max-width:420px;color:var(--mut);font-size:15px;line-height:1.6}",
      ".nx-modes{display:grid;grid-template-columns:1fr 1fr;gap:12px;max-width:460px;margin:0 auto 16px}",
      ".nx-mode{display:flex;flex-direction:column;align-items:center;gap:8px;padding:18px 10px;border:1px solid var(--line);border-radius:20px;background:var(--card);color:var(--ink);font:inherit;font-size:15px;font-weight:800;cursor:pointer;box-shadow:0 12px 26px -20px rgba(0,0,0,.5)}",
      ".nx-mode i{width:50px;height:50px;border-radius:17px;display:grid;place-items:center;color:#fff;background:var(--grad);font-style:normal}",
      ".nx-mode small{font-size:12px;font-weight:700;color:var(--mut)}",
      ".nx-mode:active{transform:scale(.97)}",
      ".nx-chips{display:flex;flex-direction:column;gap:8px;max-width:460px;margin:0 auto}",
      ".nx-chip{padding:12px 16px;border-radius:16px;border:1px solid var(--line);background:var(--card);color:var(--ink);font:inherit;font-size:14.5px;font-weight:700;text-align:left;cursor:pointer}",
      ".nx-chip:active{transform:scale(.98)}",
      /* messages */
      ".nx-row{display:flex;gap:10px;align-items:flex-start;min-width:0}",
      ".nx-row.u{justify-content:flex-end}",
      ".nx-av{flex:0 0 30px;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;color:#fff;background:var(--grad);margin-top:2px}",
      ".nx-av svg{width:17px;height:17px}",
      ".nx-body{flex:1;min-width:0;font-size:15.5px;line-height:1.7;color:var(--ink);overflow-wrap:anywhere}",
      ".nx-body p{margin:0 0 9px}.nx-body p:last-child{margin-bottom:0}",
      ".nx-body ul,.nx-body ol{margin:4px 0 9px;padding-left:22px}.nx-body li{margin:3px 0}",
      ".nx-body code{padding:1px 6px;border-radius:6px;background:rgba(127,127,127,.2);font-size:.92em}",
      ".nx-body pre{margin:6px 0 10px;padding:12px;border-radius:12px;background:rgba(127,127,127,.16);overflow-x:auto}",
      ".nx-body pre code{padding:0;background:none;white-space:pre}",
      ".nx-body.err{color:var(--acc)}",
      ".nx-ub{max-width:84%;padding:10px 14px;border-radius:20px;border-bottom-right-radius:6px;color:#fff;background:var(--grad);font-size:15.5px;line-height:1.6;overflow-wrap:anywhere;white-space:pre-wrap}",
      ".nx-ub img{display:block;max-width:170px;max-height:170px;border-radius:12px;margin:0 0 6px;object-fit:cover}",
      ".nx-ub .nx-imgonly{font-size:12.5px;opacity:.85}",
      ".nx-typing{display:inline-flex;gap:5px;padding:8px 2px}",
      ".nx-typing i{width:8px;height:8px;border-radius:50%;background:var(--acc);opacity:.35;animation:nxDot 1.1s infinite ease-in-out}",
      ".nx-typing i:nth-child(2){animation-delay:.18s}.nx-typing i:nth-child(3){animation-delay:.36s}",
      "@keyframes nxDot{0%,80%,100%{transform:translateY(0);opacity:.3}40%{transform:translateY(-5px);opacity:1}}",
      /* input bar */
      ".nx-dock{flex:0 0 auto;padding:6px 0 calc(6px + env(safe-area-inset-bottom))}",
      ".nx-prev{display:none;align-items:center;gap:10px;margin:0 0 8px 4px}",
      ".nx-prev.on{display:flex}",
      ".nx-prev span{position:relative;display:block}",
      ".nx-prev img{display:block;width:62px;height:62px;border-radius:14px;object-fit:cover;border:1px solid var(--line)}",
      ".nx-prev button{position:absolute;top:-7px;right:-7px;width:22px;height:22px;border:0;border-radius:50%;display:grid;place-items:center;background:var(--ink);color:var(--card);cursor:pointer;padding:0}",
      ".nx-prev button svg{width:12px;height:12px}",
      ".nx-prev small{font-size:12.5px;font-weight:700;color:var(--mut)}",
      ".nx-bar{display:flex;align-items:flex-end;gap:8px;padding:6px;border:1.5px solid var(--line);border-radius:26px;background:var(--card);box-shadow:0 12px 28px -20px rgba(0,0,0,.6)}",
      ".nx-bar:focus-within{border-color:var(--acc)}",
      ".nx-cam{flex:0 0 42px;width:42px;height:42px;display:grid;place-items:center;border:0;border-radius:50%;background:var(--soft);color:var(--acc);cursor:pointer}",
      ".nx-input{flex:1;min-width:0;max-height:130px;min-height:42px;padding:10px 4px;border:0;background:transparent;color:var(--ink);font:inherit;font-size:16px;line-height:1.4;resize:none;outline:none}",
      ".nx-input::placeholder{color:var(--mut)}",
      ".nx-send{flex:0 0 42px;width:42px;height:42px;display:grid;place-items:center;border:0;border-radius:50%;color:#fff;background:var(--grad);cursor:pointer}",
      ".nx-send:active{transform:scale(.92)}",
      ".nx-send[disabled]{opacity:.45;cursor:default}",
      ".nx-note{text-align:center;font-size:11.5px;color:var(--mut);padding-top:6px}",
      /* history drawer */
      ".nx-back{display:none;position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,.5)}",
      ".nx-back.on{display:block}",
      ".nx-drawer{position:fixed;top:0;bottom:0;left:0;z-index:9999;width:min(320px,85vw);display:flex;flex-direction:column;transform:translateX(-102%);transition:transform .22s ease;background:var(--card);color:var(--ink);box-shadow:12px 0 40px -18px rgba(0,0,0,.7);padding:calc(14px + env(safe-area-inset-top)) 14px calc(14px + env(safe-area-inset-bottom))}",
      ".nx-drawer.on{transform:none}",
      ".nx-dh{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}",
      ".nx-dh b{font-size:18px;font-weight:900}",
      ".nx-new{display:flex;align-items:center;gap:8px;width:100%;padding:12px 14px;margin-bottom:10px;border:0;border-radius:14px;background:var(--grad);color:#fff;font:inherit;font-size:15px;font-weight:800;cursor:pointer}",
      ".nx-list{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:6px}",
      ".nx-item{display:flex;align-items:center;gap:6px;border-radius:14px;border:1px solid transparent}",
      ".nx-item.on{background:var(--soft);border-color:var(--line)}",
      ".nx-item button.t{flex:1;min-width:0;padding:12px;border:0;background:none;color:inherit;font:inherit;font-size:14.5px;font-weight:700;text-align:left;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".nx-item button.d{flex:0 0 38px;height:38px;display:grid;place-items:center;border:0;background:none;color:var(--mut);cursor:pointer}",
      ".nx-empty{padding:18px 6px;text-align:center;color:var(--mut);font-size:14px}"
    ].join("\n");
    document.head.appendChild(st);
  }

  // ---------- message DOM ----------
  function nearBottom() {
    var l = els.log;
    return l.scrollHeight - l.scrollTop - l.clientHeight < 140;
  }
  function scrollDown(force) {
    if (force || nearBottom()) els.log.scrollTop = els.log.scrollHeight;
  }

  function addUser(m) {
    var row = document.createElement("div");
    row.className = "nx-row u";
    var inner = "";
    if (m.img) inner += '<img alt="" src="' + esc(m.img) + '">';
    if (m.content) inner += esc(m.content);
    else if (m.img) inner += '<span class="nx-imgonly">ছবি পাঠানো হয়েছে</span>';
    row.innerHTML = '<div class="nx-ub">' + inner + "</div>";
    els.log.appendChild(row);
    return row;
  }
  function addAssistant(text, opts) {
    opts = opts || {};
    var row = document.createElement("div");
    row.className = "nx-row a";
    row.innerHTML = '<span class="nx-av">' + I.spark + '</span><div class="nx-body' + (opts.err ? " err" : "") + '"></div>';
    var body = row.lastChild;
    if (opts.typing) body.innerHTML = '<span class="nx-typing"><i></i><i></i><i></i></span>';
    else body.innerHTML = render(text);
    els.log.appendChild(row);
    return body;
  }

  function showWelcome() {
    els.log.innerHTML =
      '<div class="nx-welcome">' +
      '<div class="nx-orb">' + I.spark + "</div>" +
      "<h2>আমি Nexa AI</h2>" +
      "<p>লিখে প্রশ্ন করো, অথবা প্রশ্নের ছবি দাও। আমি পড়ে সহজ করে বুঝিয়ে দেব।</p>" +
      '<div class="nx-modes">' +
      '<button type="button" class="nx-mode" data-mode="text"><i>' + I.pen + "</i>লিখে জিজ্ঞেস করো<small>Text</small></button>" +
      '<button type="button" class="nx-mode" data-mode="photo"><i>' + I.cam.replace('width="22" height="22"', 'width="26" height="26"') + "</i>ছবি দিয়ে জিজ্ঞেস করো<small>Photo</small></button>" +
      "</div>" +
      '<div class="nx-chips">' +
      SUGGESTIONS.map(function (s) { return '<button type="button" class="nx-chip">' + esc(s) + "</button>"; }).join("") +
      "</div></div>";
  }

  function paint() {
    var chat = current();
    els.log.innerHTML = "";
    if (!chat || !chat.messages.length) { showWelcome(); return; }
    chat.messages.forEach(function (m) {
      if (m.role === "user") addUser(m); else addAssistant(m.content, { err: m.err });
    });
    scrollDown(true);
  }

  // ---------- drawer ----------
  function openDrawer(on) {
    els.drawer.classList.toggle("on", on);
    els.backdrop.classList.toggle("on", on);
    if (on) paintList();
  }
  function paintList() {
    if (!state.chats.length) {
      els.list.innerHTML = '<div class="nx-empty">এখনো কোনো চ্যাট নেই।</div>';
      return;
    }
    els.list.innerHTML = state.chats.map(function (c) {
      return '<div class="nx-item' + (c.id === state.id ? " on" : "") + '" data-id="' + esc(c.id) + '">' +
        '<button type="button" class="t">' + esc(c.title || "নতুন চ্যাট") + "</button>" +
        '<button type="button" class="d" aria-label="মুছো">' + I.trash + "</button></div>";
    }).join("");
  }

  // ---------- chat actions ----------
  function newChat() {
    if (state.busy) stop();
    state.id = null;
    clearPending();
    paint();
    openDrawer(false);
  }
  function openChat(id) {
    if (state.busy) stop();
    state.id = id;
    clearPending();
    paint();
    openDrawer(false);
  }
  function deleteChat(id) {
    if (!confirm("এই চ্যাট মুছে ফেলবে?")) return;
    state.chats = state.chats.filter(function (c) { return c.id !== id; });
    saveChats();
    if (state.id === id) { if (state.busy) stop(); state.id = null; paint(); }
    paintList();
  }

  // ---------- photo ----------
  function loadImage(file) {
    return new Promise(function (ok, bad) {
      var url = URL.createObjectURL(file);
      var im = new Image();
      im.onload = function () { URL.revokeObjectURL(url); ok(im); };
      im.onerror = function () { URL.revokeObjectURL(url); bad(new Error("decode")); };
      im.src = url;
    });
  }
  function shrink(im, maxSide, q) {
    var w = im.naturalWidth, h = im.naturalHeight;
    var s = Math.min(1, maxSide / Math.max(w, h));
    var c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w * s));
    c.height = Math.max(1, Math.round(h * s));
    var g = c.getContext("2d");
    g.fillStyle = "#fff";
    g.fillRect(0, 0, c.width, c.height);
    g.drawImage(im, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", q);
  }
  function pickPhoto() { els.file.click(); }
  function onFile() {
    var f = els.file.files && els.file.files[0];
    els.file.value = "";
    if (!f) return;
    if (!/^image\//.test(f.type)) { alert("শুধু ছবি দেওয়া যাবে।"); return; }
    if (f.size > 20 * 1024 * 1024) { alert("ছবিটা অনেক বড়। ছোট ছবি দাও।"); return; }
    loadImage(f).then(function (im) {
      var big = shrink(im, IMG_MAX_SIDE, 0.82);
      var thumb = shrink(im, THUMB_SIDE, 0.6);
      state.pending = { data: big.split(",")[1], mime: "image/jpeg", thumb: thumb };
      els.prevImg.src = thumb;
      els.prev.classList.add("on");
      els.input.focus();
    }).catch(function () {
      alert("ছবিটা খোলা গেল না। JPG বা PNG ছবি দাও।");
    });
  }
  function clearPending() {
    state.pending = null;
    if (els.prev) { els.prev.classList.remove("on"); els.prevImg.removeAttribute("src"); }
  }

  // ---------- send / stream ----------
  function setBusy(v) {
    state.busy = v;
    els.send.innerHTML = v ? I.stop : I.send;
    els.send.setAttribute("aria-label", v ? "থামাও" : "পাঠাও");
  }
  function stop() { if (state.ctrl) { try { state.ctrl.abort(); } catch (e) {} } }
  function autoGrow() {
    els.input.style.height = "auto";
    els.input.style.height = Math.min(els.input.scrollHeight, 130) + "px";
  }

  function send(prefill) {
    if (state.busy) { stop(); return; }
    var text = String(prefill != null ? prefill : els.input.value).trim().slice(0, 2000);
    var img = state.pending;
    if (!text && !img) return;

    var chat = current();
    if (!chat) {
      chat = { id: uid(), title: (text || "ছবি থেকে প্রশ্ন").slice(0, 40), updated: Date.now(), messages: [] };
      state.chats.unshift(chat);
      state.id = chat.id;
    }
    if (els.log.querySelector(".nx-welcome")) els.log.innerHTML = "";

    var userMsg = { role: "user", content: text };
    if (img) userMsg.img = img.thumb;
    chat.messages.push(userMsg);
    chat.updated = Date.now();
    chat.messages = chat.messages.slice(-MAX_MSGS_PER_CHAT);
    saveChats();

    addUser(userMsg);
    els.input.value = "";
    autoGrow();
    clearPending();

    var history = chat.messages.slice(-SEND_HISTORY).map(function (m) {
      return { role: m.role, content: m.content || (m.img ? "[ছবি]" : "") };
    });
    var payload = { messages: history };
    if (img) payload.image = { mime: img.mime, data: img.data };

    var body = addAssistant("", { typing: true });
    scrollDown(true);
    setBusy(true);

    var ctrl = typeof AbortController === "function" ? new AbortController() : null;
    state.ctrl = ctrl;
    var full = "";
    var raf = 0;
    function paintStream() {
      raf = 0;
      var stick = nearBottom();
      body.innerHTML = full ? render(full) : '<span class="nx-typing"><i></i><i></i><i></i></span>';
      if (stick) els.log.scrollTop = els.log.scrollHeight;
    }
    function schedule() { if (!raf) raf = requestAnimationFrame(paintStream); }

    function finish(errText) {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (full) {
        body.innerHTML = render(full);
        if (errText) body.innerHTML += '<p><em>' + esc(errText) + "</em></p>";
        chat.messages.push({ role: "assistant", content: full });
      } else if (errText) {
        body.classList.add("err");
        body.innerHTML = esc(errText);
        // fail hole last user message theke tule dei, jate abar pathano jay
        chat.messages.pop();
        if (userMsg.content) { els.input.value = userMsg.content; autoGrow(); }
        if (img) { state.pending = img; els.prevImg.src = img.thumb; els.prev.classList.add("on"); }
      } else {
        chat.messages.pop();
        body.parentNode.remove();
      }
      chat.updated = Date.now();
      saveChats();
      state.ctrl = null;
      setBusy(false);
      scrollDown(false);
    }

    fetch("/api/nexa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) {
      var type = r.headers.get("content-type") || "";
      if (!r.ok || type.indexOf("text/event-stream") === -1) {
        return r.json().catch(function () { return {}; }).then(function (d) {
          throw new Error(d.error || "Nexa AI উত্তর দিতে পারলো না।");
        });
      }
      var parse = function (line) {
        if (line.indexOf("data:") !== 0) return;
        var j; try { j = JSON.parse(line.slice(5)); } catch (e) { return; }
        if (j.t) { full += j.t; schedule(); }
        if (j.error) throw new Error(j.error);
      };
      if (!r.body || !r.body.getReader) {
        return r.text().then(function (t) { t.split("\n").forEach(parse); });
      }
      var reader = r.body.getReader(), dec = new TextDecoder(), buf = "";
      return (function pump() {
        return reader.read().then(function (x) {
          if (x.done) { if (buf) parse(buf); return; }
          buf += dec.decode(x.value, { stream: true });
          var i;
          while ((i = buf.indexOf("\n")) >= 0) { parse(buf.slice(0, i).replace(/\r$/, "")); buf = buf.slice(i + 1); }
          return pump();
        });
      })();
    }).then(function () {
      finish("");
    }).catch(function (err) {
      var msg;
      if (err && err.name === "AbortError") msg = full ? "" : "";
      else if (navigator.onLine === false) msg = "ইন্টারনেট সংযোগ নেই।";
      else msg = (err && err.message) || "কিছু একটা সমস্যা হয়েছে।";
      finish(msg);
    });
  }

  // ---------- Home e fire jao ----------
  // Nexa page-e site-er header/bottom-nav/back link lukano thake, tai ekhane nijer Home button.
  function goHome() {
    stop();
    openDrawer(false);
    document.body.classList.remove("nexa-active");
    try { history.pushState({}, "", "?"); } catch (e) {}
    if (typeof window.renderRoute === "function") window.renderRoute();
    else window.location.href = "?";
    window.scrollTo(0, 0);
  }

  // ---------- page ----------
  window.renderNexaPage = function () {
    var content = document.getElementById("pageContent");
    if (!content) return;
    injectStyles();
    document.body.classList.add("nexa-active");

    state.chats = loadChats();
    state.id = null;
    state.busy = false;
    state.pending = null;
    state.ctrl = null;

    content.innerHTML =
      '<div class="nx">' +
      '<div class="nx-head">' +
      '<button type="button" class="nx-ib" id="nxHome" aria-label="হোমে ফিরে যাও" title="Home">' + I.home + "</button>" +
      '<button type="button" class="nx-ib" id="nxMenu" aria-label="চ্যাট হিস্ট্রি">' + I.menu + "</button>" +
      '<div class="nx-title"><h1>Nexa <em>AI</em></h1></div>' +
      '<button type="button" class="nx-ib" id="nxNew" aria-label="নতুন চ্যাট">' + I.plus + "</button>" +
      "</div>" +
      '<div class="nx-log" id="nxLog" aria-live="polite"></div>' +
      '<div class="nx-dock">' +
      '<div class="nx-prev" id="nxPrev"><span><img id="nxPrevImg" alt=""><button type="button" id="nxPrevX" aria-label="ছবি সরাও">' + I.close + "</button></span><small>ছবি যোগ হয়েছে</small></div>" +
      '<div class="nx-bar">' +
      '<button type="button" class="nx-cam" id="nxCam" aria-label="ছবি দাও">' + I.cam + "</button>" +
      '<textarea class="nx-input" id="nxInput" rows="1" maxlength="2000" placeholder="প্রশ্ন লেখো..."></textarea>' +
      '<button type="button" class="nx-send" id="nxSend" aria-label="পাঠাও">' + I.send + "</button>" +
      "</div>" +
      '<div class="nx-note">AI ভুল করতে পারে। গুরুত্বপূর্ণ তথ্য শিক্ষকের কাছ থেকে যাচাই করে নাও।</div>' +
      "</div>" +
      '<input type="file" id="nxFile" accept="image/*" hidden>' +
      '<div class="nx-back" id="nxBack"></div>' +
      '<aside class="nx-drawer" id="nxDrawer" aria-label="চ্যাট হিস্ট্রি">' +
      '<div class="nx-dh"><b>চ্যাট হিস্ট্রি</b><button type="button" class="nx-ib" id="nxDClose" aria-label="বন্ধ">' + I.close + "</button></div>" +
      '<button type="button" class="nx-new" id="nxNew2">' + I.plus + " নতুন চ্যাট</button>" +
      '<div class="nx-list" id="nxList"></div>' +
      "</aside>" +
      "</div>";

    var $ = function (id) { return document.getElementById(id); };
    els = {
      log: $("nxLog"), input: $("nxInput"), send: $("nxSend"), file: $("nxFile"),
      prev: $("nxPrev"), prevImg: $("nxPrevImg"),
      drawer: $("nxDrawer"), backdrop: $("nxBack"), list: $("nxList")
    };

    paint();

    els.send.addEventListener("click", function () { send(); });
    els.input.addEventListener("input", autoGrow);
    els.input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey && !/Android|iPhone|iPad/i.test(navigator.userAgent)) {
        e.preventDefault();
        send();
      }
    });
    $("nxCam").addEventListener("click", pickPhoto);
    els.file.addEventListener("change", onFile);
    $("nxPrevX").addEventListener("click", clearPending);
    $("nxHome").addEventListener("click", goHome);
    $("nxMenu").addEventListener("click", function () { openDrawer(true); });
    $("nxDClose").addEventListener("click", function () { openDrawer(false); });
    els.backdrop.addEventListener("click", function () { openDrawer(false); });
    $("nxNew").addEventListener("click", newChat);
    $("nxNew2").addEventListener("click", newChat);

    els.log.addEventListener("click", function (e) {
      var t = e.target;
      var mode = t.closest && t.closest(".nx-mode");
      if (mode) {
        if (mode.getAttribute("data-mode") === "photo") pickPhoto(); else els.input.focus();
        return;
      }
      var chip = t.closest && t.closest(".nx-chip");
      if (chip) send(chip.textContent);
    });
    els.list.addEventListener("click", function (e) {
      var item = e.target.closest && e.target.closest(".nx-item");
      if (!item) return;
      var id = item.getAttribute("data-id");
      if (e.target.closest(".d")) deleteChat(id); else openChat(id);
    });
  };

  // page chhere gele body class tule nei
  window.addEventListener("popstate", function () {
    var p = new URLSearchParams(location.search).get("page");
    if (p !== "demo-ai" && p !== "nexa") document.body.classList.remove("nexa-active");
  });
})();
