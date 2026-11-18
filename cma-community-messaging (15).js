/* ==========================================
   CHANGE MAKER ACADEMY
   COMMUNITY MESSAGING
   PHASE 3 - INBOX + FULL CHAT + REACTIONS + CALLS
========================================== */

(function () {
  "use strict";

  const Core = window.CMACommunityCore;
  const db = window.cmaSupabase || Core?.db;

  if (!Core || !db) {
    console.error("CMA Messaging: Core or Supabase missing.");
    return;
  }

  const MODULE = window.CMACommunityMessaging =
    window.CMACommunityMessaging || {};

  const BUCKET = "cma-chat-files";
  const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
  // Message-er reaction popup-e shudhu 5ta quick emoji, shesh-e "+" button.
  const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢"];
  const EMOJIS = ("😀 😁 😂 🤣 😊 😍 😘 😎 🥰 😉 😅 😭 😢 😡 😴 🤔 🙄 😇 🥳 😬 " +
    "🤗 😮 😱 🙏 👍 👎 👏 🙌 💪 🤝 ❤️ 💔 🔥 ✨ 🎉 💯 ✅ ❌ 🌹 🌙 ☀️ 🎁").split(" ");

  // Call-er jonno STUN server. Mobile data-te call na lagle TURN server
  // lagbe: window.CMA_ICE_SERVERS = [...] diye override kora jabe.
  const ICE_CONFIG = {
    iceServers: window.CMA_ICE_SERVERS || [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" }
    ]
  };

  /* ---------- State ---------- */

  let currentUser = null;
  let myId = null;
  let myProfile = null;

  let activeConversation = null;
  let activeChannel = null;
  let conversationsCache = [];
  let settingsMap = {};
  let themeMap = {}; // conversation_id -> { bg_url } (duijon-er shared)
  let activeMessages = [];
  let searchValue = "";
  let loading = false;

  let presenceChannel = null;
  let onlineSet = new Set();

  let recorder = null;
  let recCancelled = false;
  let recTimer = null;
  let recSeconds = 0;

  let audioEl = null;
  let audioBtn = null;
  let pickedReaction = "👍";

  let lastTap = 0;
  let lastTapRow = null;
  let tapTimer = null;

  let hiddenFloats = [];
  let floatTimer = null;

  // calls
  let callListener = null;
  const sigChannels = {};
  let call = null;
  let ringTimer = null;
  let audioCtx = null;

  const root = () =>
    Core.getRoot
      ? Core.getRoot()
      : document.getElementById("pageContent");

  /* ---------- Helpers ---------- */

  function esc(value) {
    return Core.escapeHTML
      ? Core.escapeHTML(String(value ?? ""))
      : String(value ?? "").replace(/[&<>"']/g, c => ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        }[c]));
  }

  function notify(message, type = "info") {
    if (Core.showNotice) {
      Core.showNotice(message, type);
    } else {
      console.log(message);
    }
  }

  // Nijer toast: chat page-e Core.showNotice lukiye thakle-o error dekha jabe
  function toast(message, ms = 7000) {
    try {
      document.getElementById("cmaToast")?.remove();

      const el = document.createElement("div");
      el.id = "cmaToast";
      el.textContent = message;
      el.style.cssText =
        "position:fixed;left:12px;right:12px;top:72px;z-index:2147483647;" +
        "padding:12px 14px;border-radius:12px;background:#b3261e;color:#fff;" +
        "font-size:13px;line-height:1.4;box-shadow:0 6px 24px rgba(0,0,0,.5);" +
        "word-break:break-word;";

      el.addEventListener("click", () => el.remove());
      document.body.appendChild(el);
      setTimeout(() => el.remove(), ms);
    } catch (e) {
      console.error(message);
    }
  }

  function timeAgo(value) {
    if (!value) return "";

    const date = new Date(value);
    const seconds = Math.floor((Date.now() - date) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return Math.floor(seconds / 60) + "m";
    if (seconds < 86400) return Math.floor(seconds / 3600) + "h";

    return date.toLocaleDateString();
  }

  function clock(value) {
    if (!value) return "";
    return new Date(value).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function fmtDur(s) {
    s = Number(s) || 0;
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  }

  function isOnline(userId) {
    return !!userId && onlineSet.has(userId);
  }

  /* ---------- Icons (SVG) ---------- */

  const ICONS = {
    back: '<polyline points="15 18 9 12 15 6"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    video: '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>',
    videoOff: '<path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/><line x1="1" y1="1" x2="23" y2="23"/>',
    more: '<circle cx="12" cy="5" r="1.8" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.8" fill="currentColor" stroke="none"/>',
    mic: '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>',
    micOff: '<line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>',
    send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
    clip: '<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
    smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
    play: '<polygon points="7 4 20 12 7 20 7 4" fill="currentColor" stroke="none"/>',
    pause: '<rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
    file: '<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>',
    palette: '<circle cx="13.5" cy="6.5" r="1" fill="currentColor"/><circle cx="17.5" cy="10.5" r="1" fill="currentColor"/><circle cx="8.5" cy="7.5" r="1" fill="currentColor"/><circle cx="6.5" cy="12.5" r="1" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.84-.44-1.13-.29-.29-.44-.65-.44-1.12a1.64 1.64 0 0 1 1.67-1.67h2c3.05 0 5.55-2.5 5.55-5.55C21.97 6.01 17.46 2 12 2z"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    checks: '<polyline points="18 7 9 16 5 12"/><polyline points="23 7 14 16 12 14"/>',
    mail: '<path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><polyline points="22 6 12 13 2 6"/>'
  };

  function ico(name, size = 22) {
    return `<svg class="cma-ico" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ""}</svg>`;
  }

  /* ---------- Settings helpers ---------- */

  function getSettings(conversationId) {
    return settingsMap[conversationId] || {
      bg_url: null,
      reaction: "👍",
      nickname_other: null,
      nickname_me: null
    };
  }

  function displayName(item) {
    return getSettings(item.id).nickname_other || item.name;
  }

  function avatar(url, name) {
    if (url) {
      return `
        <img src="${esc(url)}"
          alt="${esc(name)}"
          class="cma-msg-avatar">
      `;
    }

    return `
      <div class="cma-msg-avatar cma-msg-avatar-fallback">
        ${esc((name || "?").charAt(0).toUpperCase())}
      </div>
    `;
  }

  function callInfo(message) {
    let d = {};
    try { d = JSON.parse(message.content || "{}"); } catch (e) { d = {}; }
    const video = d.callType === "video";
    const missed = d.status !== "completed";
    const name = video ? "video call" : "audio call";
    const text = missed
      ? "Missed " + name
      : (video ? "Video" : "Audio") + " call \u00b7 " + fmtDur(d.duration);
    return { video, missed, text };
  }

  function previewText(message) {
    if (!message) return "Start a conversation";
    if (message.deleted_at) return "This message was deleted";

    switch (message.message_type) {
      case "call": return callInfo(message).text;
      case "image": return "Photo";
      case "video": return "Video";
      case "voice": return "Voice message";
      case "file": return message.file_name || "File";
      default: return message.content || "";
    }
  }

  /* ---------- Styles ---------- */

  function styles() {
    if (document.getElementById("cmaMessagingStyles")) return;

    const style = document.createElement("style");
    style.id = "cmaMessagingStyles";

    style.textContent = `
      .cma-ico {
        display:block;
        fill:none;
        stroke:currentColor;
        stroke-width:2;
        stroke-linecap:round;
        stroke-linejoin:round;
        pointer-events:none;
      }

      .cma-msg-page {
        min-height:100dvh;
        background:#073746;
        color:#fff;
        font-family:inherit;
        padding:0 0 20px;
      }

      .cma-msg-header {
        min-height:68px;
        display:flex;
        align-items:center;
        gap:10px;
        padding:0 14px;
        background:#073746;
        border-bottom:1px solid rgba(255,255,255,.09);
      }

      .cma-msg-back,
      .cma-chat-icon {
        width:42px;
        height:42px;
        flex-shrink:0;
        display:flex;
        align-items:center;
        justify-content:center;
        border:0;
        border-radius:50%;
        background:transparent;
        color:#fff;
        cursor:pointer;
        padding:0;
      }

      .cma-msg-back:active,
      .cma-chat-icon:active {
        background:rgba(255,255,255,.1);
      }

      .cma-msg-title {
        font-size:20px;
        font-weight:750;
        flex:1;
      }

      .cma-msg-search {
        padding:16px;
      }

      .cma-msg-search input {
        width:100%;
        box-sizing:border-box;
        padding:14px 18px;
        border:1px solid rgba(255,255,255,.08);
        border-radius:25px;
        outline:none;
        background:#104b59;
        color:#fff;
        font-size:14px;
      }

      .cma-msg-search input::placeholder {
        color:#a9c4cb;
      }

      .cma-msg-list {
        padding:0 15px;
      }

      .cma-msg-item {
        width:100%;
        display:flex;
        align-items:center;
        gap:13px;
        padding:14px 4px;
        border:0;
        border-bottom:1px solid rgba(255,255,255,.08);
        background:transparent;
        color:#fff;
        text-align:left;
        cursor:pointer;
      }

      .cma-msg-avatar-wrap {
        position:relative;
        flex-shrink:0;
      }

      .cma-msg-avatar {
        width:53px;
        height:53px;
        border-radius:50%;
        object-fit:cover;
        flex-shrink:0;
      }

      .cma-msg-avatar-fallback {
        display:flex;
        align-items:center;
        justify-content:center;
        background:#087d70;
        font-size:21px;
        font-weight:700;
      }

      .cma-msg-dot {
        position:absolute;
        right:1px;
        bottom:1px;
        width:13px;
        height:13px;
        border-radius:50%;
        background:#18d68f;
        border:2px solid #073746;
        display:none;
      }

      .cma-msg-dot.on {
        display:block;
      }

      .cma-msg-info {
        flex:1;
        min-width:0;
      }

      .cma-msg-name {
        font-size:15px;
        font-weight:700;
      }

      .cma-msg-presence {
        font-size:12px;
        margin:2px 0 4px;
        color:#fff;
      }

      .cma-msg-presence.on {
        color:#18d68f;
      }

      .cma-msg-preview {
        color:#b4cbd1;
        font-size:13px;
        overflow:hidden;
        white-space:nowrap;
        text-overflow:ellipsis;
      }

      .cma-msg-side {
        display:flex;
        flex-direction:column;
        align-items:flex-end;
        gap:7px;
      }

      .cma-msg-time {
        color:#a9c4cb;
        font-size:11px;
        white-space:nowrap;
      }

      .cma-msg-unread {
        min-width:20px;
        height:20px;
        padding:0 6px;
        border-radius:10px;
        background:#08a889;
        color:#fff;
        font-size:11px;
        font-weight:700;
        display:flex;
        align-items:center;
        justify-content:center;
      }

      .cma-msg-empty {
        text-align:center;
        padding:65px 20px;
        color:#b4cbd1;
      }

      .cma-msg-empty .cma-ico {
        margin:0 auto 12px;
      }

      /* ----- Chat screen (full screen) ----- */

      .cma-chat-page {
        position:fixed;
        top:0;
        bottom:0;
        left:0;
        right:0;
        width:100%;
        max-width:720px;
        margin:0 auto;
        z-index:10000;
        display:flex;
        flex-direction:column;
        background:#073746;
        overflow:hidden;
      }

      .cma-chat-bg {
        position:absolute;
        inset:0;
        background-size:cover;
        background-position:center;
        z-index:0;
      }

      .cma-chat-bg.has-bg::after {
        content:"";
        position:absolute;
        inset:0;
        background:rgba(3,20,28,.5);
      }

      .cma-chat-page > header,
      .cma-chat-page > .cma-chat-messages,
      .cma-chat-page > .cma-chat-form {
        position:relative;
        z-index:1;
      }

      .cma-chat-page > header {
        background:rgba(7,55,70,.94);
        padding-top:env(safe-area-inset-top);
        flex-shrink:0;
      }

      .cma-chat-person {
        display:flex;
        align-items:center;
        gap:11px;
        flex:1;
        min-width:0;
        cursor:pointer;
      }

      .cma-chat-person .cma-msg-avatar {
        width:43px;
        height:43px;
      }

      .cma-chat-person-name {
        font-size:15px;
        font-weight:750;
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
      }

      .cma-chat-status {
        font-size:12px;
        color:#fff;
        margin-top:3px;
      }

      .cma-chat-status.on {
        color:#18d68f;
      }

      .cma-chat-menu {
        position:absolute;
        right:12px;
        top:calc(62px + env(safe-area-inset-top));
        z-index:20;
        min-width:210px;
        padding:6px;
        border-radius:14px;
        background:rgba(9,47,60,.97);
        border:1px solid rgba(255,255,255,.14);
        box-shadow:0 8px 24px rgba(0,0,0,.35);
        display:none;
      }

      .cma-chat-menu.open {
        display:block;
      }

      .cma-chat-menu button {
        width:100%;
        display:flex;
        align-items:center;
        gap:12px;
        text-align:left;
        padding:12px 14px;
        border:0;
        border-radius:10px;
        background:transparent;
        color:#fff;
        font-size:14px;
        cursor:pointer;
      }

      .cma-chat-menu button:active {
        background:#14485a;
      }

      .cma-chat-messages {
        flex:1;
        min-height:0;
        overflow-y:auto;
        padding:20px 14px;
        display:flex;
        flex-direction:column;
        gap:10px;
        overscroll-behavior:contain;
      }

      .cma-chat-row {
        max-width:78%;
        display:flex;
        flex-direction:column;
      }

      .cma-chat-row.mine {
        align-self:flex-end;
        align-items:flex-end;
      }

      .cma-chat-row.theirs {
        align-self:flex-start;
        align-items:flex-start;
      }

      .cma-chat-bubble {
        width:fit-content;
        max-width:100%;
        padding:11px 15px;
        border-radius:18px;
        font-size:14px;
        line-height:1.55;
        overflow-wrap:anywhere;
        box-shadow:0 2px 8px rgba(0,0,0,.08);
        user-select:none;
        -webkit-user-select:none;
        cursor:pointer;
      }

      .cma-chat-mine {
        background:#087e70;
        border-bottom-right-radius:5px;
      }

      .cma-chat-theirs {
        background:#10505d;
        border-bottom-left-radius:5px;
      }

      .cma-chat-time {
        display:flex;
        align-items:center;
        justify-content:flex-end;
        gap:5px;
        margin-top:5px;
        font-size:10px;
        color:#c0d9dc;
      }

      .cma-tick {
        display:inline-flex;
        color:#c0d9dc;
      }

      .cma-tick.seen {
        color:#4fc3ff;
      }

      .cma-chat-react {
        position:relative;
        z-index:1;
        display:flex;
        gap:3px;
        margin-top:-9px;
        padding:2px 8px;
        font-size:14px;
        border-radius:13px;
        background:#0d3b49;
        border:1px solid rgba(255,255,255,.18);
        cursor:pointer;
      }

      .cma-chat-row.mine .cma-chat-react {
        margin-right:12px;
      }

      .cma-chat-row.theirs .cma-chat-react {
        margin-left:12px;
      }

      .cma-chat-react b {
        margin-left:2px;
        font-size:11px;
        font-weight:600;
        color:#c0d9dc;
      }

      .cma-chat-img,
      .cma-chat-bubble video {
        display:block;
        max-width:100%;
        max-height:300px;
        border-radius:12px;
      }

      .cma-chat-file {
        display:flex;
        align-items:center;
        gap:9px;
        color:#fff;
      }

      .cma-chat-voice {
        display:flex;
        align-items:center;
        gap:10px;
        min-width:180px;
      }

      .cma-chat-voice button {
        width:34px;
        height:34px;
        flex-shrink:0;
        display:flex;
        align-items:center;
        justify-content:center;
        border:0;
        border-radius:50%;
        background:rgba(0,0,0,.25);
        color:#fff;
        cursor:pointer;
        padding:0;
      }

      .cma-chat-wave {
        flex:1;
        height:18px;
        opacity:.7;
        background:repeating-linear-gradient(90deg,#d6eef0 0 2px,transparent 2px 5px);
      }

      /* ----- Reaction popup ----- */

      .cma-react-pop {
        position:absolute;
        z-index:25;
        width:max-content;
        max-width:calc(100% - 16px);
        padding:6px;
        border-radius:26px;
        background:#0b3544;
        border:1px solid rgba(255,255,255,.16);
        box-shadow:0 8px 26px rgba(0,0,0,.45);
      }

      .cma-react-bar {
        display:flex;
        gap:2px;
      }

      .cma-react-bar button {
        border:0;
        background:transparent;
        border-radius:50%;
        padding:5px 7px;
        font-size:26px;
        line-height:1;
        cursor:pointer;
      }

      .cma-react-bar button.sel {
        background:#14485a;
      }

      .cma-react-info {
        padding:4px 12px 4px;
        font-size:12px;
        color:#a9c4cb;
      }

      .cma-react-open {
        display:block;
        width:calc(100% - 8px);
        margin:2px 4px 4px;
        padding:8px;
        border:0;
        border-radius:14px;
        background:#14485a;
        color:#fff;
        font-size:13px;
        cursor:pointer;
      }

      /* ----- Input bar ----- */

      .cma-emoji-panel {
        position:absolute;
        left:12px;
        right:12px;
        bottom:76px;
        z-index:15;
        display:none;
        grid-template-columns:repeat(8,1fr);
        gap:2px;
        max-height:190px;
        overflow:auto;
        padding:8px;
        border-radius:14px;
        background:#092f3c;
        border:1px solid rgba(255,255,255,.12);
      }

      .cma-emoji-panel.open {
        display:grid;
      }

      .cma-emoji-panel button {
        border:0;
        background:transparent;
        font-size:23px;
        padding:4px;
        cursor:pointer;
      }

      .cma-chat-form {
        position:relative;
        display:flex;
        align-items:center;
        gap:8px;
        padding:12px 12px;
        padding-bottom:max(12px, env(safe-area-inset-bottom));
        background:rgba(9,47,60,.96);
        border-top:1px solid rgba(255,255,255,.08);
        flex-shrink:0;
      }

      .cma-chat-inputwrap {
        flex:1;
        min-width:0;
        display:flex;
        align-items:center;
        border-radius:25px;
        background:#174b57;
        border:1px solid rgba(255,255,255,.06);
        padding:0 4px;
      }

      .cma-chat-inputwrap:focus-within {
        border-color:#08a889;
      }

      .cma-chat-tool {
        width:38px;
        height:42px;
        flex-shrink:0;
        display:flex;
        align-items:center;
        justify-content:center;
        border:0;
        background:transparent;
        color:#cfe6ea;
        cursor:pointer;
        padding:0;
      }

      .cma-chat-tool.mic {
        color:#18d68f;
      }

      .cma-chat-input {
        flex:1;
        min-width:0;
        padding:13px 4px;
        border:0;
        outline:none;
        background:transparent;
        color:#fff;
        font-size:15px;
      }

      .cma-chat-input::placeholder {
        color:#b4cbd1;
      }

      .cma-chat-send {
        width:46px;
        height:46px;
        flex-shrink:0;
        display:flex;
        align-items:center;
        justify-content:center;
        border:0;
        border-radius:50%;
        background:#08a889;
        color:#fff;
        cursor:pointer;
        padding:0;
      }

      .cma-chat-send:disabled {
        opacity:.5;
      }

      .cma-chat-rec {
        position:absolute;
        inset:0;
        display:none;
        align-items:center;
        gap:12px;
        padding:0 12px;
        padding-bottom:env(safe-area-inset-bottom);
        background:#092f3c;
        color:#ff8a8a;
        z-index:3;
        font-size:15px;
      }

      .cma-chat-rec .rec-dot {
        width:11px;
        height:11px;
        border-radius:50%;
        background:#ff4d4d;
        animation:cmaPulse 1s infinite;
      }

      .cma-chat-rec .hint {
        flex:1;
        color:#a9c4cb;
        font-size:13px;
      }

      .cma-chat-rec .cma-chat-tool {
        color:#ff8a8a;
      }

      @keyframes cmaPulse {
        0%,100% { opacity:1; }
        50% { opacity:.25; }
      }

      /* ----- Modals ----- */

      .cma-modal {
        position:absolute;
        inset:0;
        z-index:30;
        display:none;
        align-items:center;
        justify-content:center;
        background:rgba(0,0,0,.6);
      }

      .cma-modal.open {
        display:flex;
      }

      .cma-modal-card {
        width:88%;
        max-width:360px;
        padding:18px;
        border-radius:16px;
        background:#092f3c;
        border:1px solid rgba(255,255,255,.14);
      }

      .cma-modal-card label {
        display:block;
        margin-top:12px;
        font-size:12px;
        color:#a9c4cb;
      }

      .cma-modal-card input {
        width:100%;
        box-sizing:border-box;
        margin:6px 0 4px;
        padding:11px 14px;
        border-radius:10px;
        border:1px solid rgba(255,255,255,.12);
        background:#174b57;
        color:#fff;
        font-size:14px;
        outline:none;
      }

      .cma-react-opts {
        display:flex;
        justify-content:center;
        flex-wrap:wrap;
        gap:8px;
        margin:16px 0;
      }

      .cma-react-opts button {
        border:0;
        background:transparent;
        border-radius:12px;
        padding:6px;
        font-size:30px;
        cursor:pointer;
      }

      .cma-react-opts button.sel {
        background:#14485a;
        outline:2px solid #08a889;
      }

      .cma-modal-btns {
        display:flex;
        justify-content:flex-end;
        gap:10px;
        margin-top:14px;
      }

      .cma-modal-btns button {
        padding:9px 16px;
        border:0;
        border-radius:10px;
        background:#14485a;
        color:#fff;
        font-size:14px;
        cursor:pointer;
      }

      .cma-modal-btns button.primary {
        background:#08a889;
        font-weight:700;
      }

      /* ----- Call screen ----- */

      .cma-call-overlay {
        position:fixed;
        inset:0;
        z-index:2147483000;
        background:linear-gradient(180deg,#0a4a5c,#04202b);
        color:#fff;
        font-family:inherit;
        overflow:hidden;
      }

      .cma-call-remote {
        position:absolute;
        inset:0;
        width:100%;
        height:100%;
        object-fit:cover;
        background:#000;
      }

      .cma-call-overlay.audio .cma-call-remote {
        width:1px;
        height:1px;
        opacity:0;
      }

      .cma-call-overlay.video:not([data-state="connected"]) .cma-call-remote {
        opacity:0;
      }

      .cma-call-info {
        position:absolute;
        top:0;
        left:0;
        right:0;
        z-index:2;
        display:flex;
        flex-direction:column;
        align-items:center;
        gap:10px;
        padding-top:max(70px, env(safe-area-inset-top));
        text-shadow:0 1px 6px rgba(0,0,0,.5);
      }

      .cma-call-avatar .cma-msg-avatar {
        width:120px;
        height:120px;
        font-size:46px;
      }

      .cma-call-overlay.video[data-state="connected"] .cma-call-avatar {
        display:none;
      }

      .cma-call-name {
        font-size:24px;
        font-weight:750;
      }

      .cma-call-status {
        font-size:15px;
        color:#d3e6ea;
      }

      .cma-call-local {
        display:none;
        position:absolute;
        right:14px;
        top:max(14px, env(safe-area-inset-top));
        z-index:3;
        width:96px;
        height:140px;
        object-fit:cover;
        border-radius:14px;
        background:#000;
        transform:scaleX(-1);
        border:1px solid rgba(255,255,255,.25);
      }

      .cma-call-overlay.video .cma-call-local {
        display:block;
      }

      .cma-call-ctl {
        position:absolute;
        left:0;
        right:0;
        bottom:max(40px, env(safe-area-inset-bottom));
        z-index:4;
        display:flex;
        justify-content:center;
        gap:26px;
      }

      .cma-call-incoming {
        display:none;
      }

      .cma-call-overlay[data-state="ringing"] .cma-call-incoming {
        display:flex;
      }

      .cma-call-overlay[data-state="ringing"] .cma-call-active {
        display:none;
      }

      .cma-call-overlay.audio .cma-call-btn.cam {
        display:none;
      }

      .cma-call-btn {
        width:64px;
        height:64px;
        display:flex;
        align-items:center;
        justify-content:center;
        border:0;
        border-radius:50%;
        background:rgba(255,255,255,.2);
        color:#fff;
        cursor:pointer;
        padding:0;
      }

      .cma-call-btn.off {
        background:#fff;
        color:#073746;
      }

      .cma-call-btn.red {
        background:#e5484d;
      }

      .cma-call-btn.red svg {
        transform:rotate(135deg);
      }

      .cma-call-btn.green {
        background:#18c27a;
      }

      /* ----- Call log (system message) ----- */

      .cma-chat-calllog {
        align-self:center;
        display:inline-flex;
        align-items:center;
        gap:8px;
        margin:8px auto;
        padding:7px 14px;
        border-radius:16px;
        background:rgba(255,255,255,.10);
        color:#d6eef0;
        font-size:13px;
      }

      .cma-chat-calllog.missed {
        color:#ff8a8a;
      }

      .cma-chat-calllog small {
        font-size:11px;
        opacity:.7;
      }

      /* ----- Reaction: "+" button and full emoji sheet ----- */

      .cma-react-bar button.more {
        font-size:22px;
        background:#14485a;
        width:36px;
        height:36px;
        padding:0;
        align-self:center;
        color:#fff;
      }

      .cma-react-actions {
        display:flex;
        gap:6px;
        margin:4px;
      }

      .cma-react-actions button {
        flex:1;
        padding:8px;
        border:0;
        border-radius:14px;
        background:#14485a;
        color:#fff;
        font-size:13px;
        cursor:pointer;
      }

      .cma-react-actions button.danger {
        color:#ff8a8a;
      }

      .cma-react-sheet {
        position:absolute;
        left:0;
        right:0;
        bottom:0;
        z-index:30;
        max-height:46%;
        overflow-y:auto;
        padding:12px 10px 18px;
        border-radius:20px 20px 0 0;
        background:#0b3544;
        border-top:1px solid rgba(255,255,255,.16);
        box-shadow:0 -8px 26px rgba(0,0,0,.45);
      }

      .cma-react-sheet .grid {
        display:grid;
        grid-template-columns:repeat(8,1fr);
        gap:2px;
      }

      .cma-react-sheet button {
        border:0;
        background:transparent;
        border-radius:10px;
        padding:6px 0;
        font-size:25px;
        line-height:1;
        cursor:pointer;
      }

      .cma-chat-row {
        touch-action:pan-y;
      }

      .cma-chat-row.flash .cma-chat-bubble {
        box-shadow:0 0 0 3px #4fc3ff;
      }

      .cma-reply-bar {
        display:none;
        align-items:center;
        gap:10px;
        padding:8px 14px;
        background:#0b3544;
        border-top:1px solid rgba(255,255,255,.12);
        color:#d6eef0;
      }

      .cma-reply-bar.open {
        display:flex;
      }

      .cma-reply-txt {
        flex:1;
        min-width:0;
        display:flex;
        flex-direction:column;
        padding-left:10px;
        border-left:3px solid #4fc3ff;
        font-size:12px;
      }

      .cma-reply-txt b {
        color:#8fd8ff;
      }

      .cma-reply-txt span {
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
        opacity:.85;
      }

      .cma-reply-bar button {
        border:0;
        background:transparent;
        color:#fff;
        font-size:18px;
        padding:4px 8px;
        cursor:pointer;
      }

      .cma-quote {
        display:flex;
        flex-direction:column;
        margin-bottom:6px;
        padding:6px 10px;
        border-left:3px solid #4fc3ff;
        border-radius:8px;
        background:rgba(0,0,0,.22);
        font-size:12px;
        line-height:1.4;
        cursor:pointer;
      }

      .cma-quote b {
        font-size:11px;
        color:#8fd8ff;
      }

      .cma-quote span {
        max-height:2.8em;
        overflow:hidden;
        opacity:.9;
      }

      .cma-react-typebar {
        display:flex;
        gap:8px;
        align-items:center;
        margin:0 4px 10px;
      }

      .cma-react-typebar input {
        flex:1;
        min-width:0;
        padding:10px 14px;
        border-radius:20px;
        border:1px solid rgba(255,255,255,.2);
        background:#0d3b49;
        color:#fff;
        font-size:18px;
        outline:none;
      }

      .cma-react-typebar button {
        width:38px;
        height:38px;
        padding:0 !important;
        border-radius:50% !important;
        background:#14485a !important;
        color:#fff;
        font-size:16px !important;
      }

      .cma-react-sheet button.sel {
        background:#14485a;
      }

      .cma-modal-card textarea {
        width:100%;
        min-height:90px;
        box-sizing:border-box;
        padding:10px;
        border-radius:12px;
        border:1px solid rgba(255,255,255,.18);
        background:#0d3b49;
        color:#fff;
        font:inherit;
        resize:vertical;
      }

      @media(max-width:480px) {
        .cma-chat-row {
          max-width:84%;
        }

        .cma-msg-list {
          padding:0 12px;
        }
      }

      /* ===== v4: ring avatar, new header, new bubbles ===== */
      .cma-msg-avatar-wrap {
        padding:2px;
        border:1.5px solid rgba(190,198,204,.55);
        border-radius:50%;
        box-sizing:content-box;
        transition:border-color .25s;
      }
      .cma-msg-avatar-wrap.on { border-color:#2ee6a6; }
      .cma-msg-avatar-wrap .cma-msg-avatar { width:48px; height:48px; display:flex; }
      .cma-chat-person .cma-msg-avatar-wrap .cma-msg-avatar { width:36px; height:36px; font-size:16px; }
      .cma-msg-dot, .cma-msg-presence, .cma-chat-status { display:none !important; }

      .cma-chat-page { background:#425a4a; }
      .cma-chat-page > header {
        margin:0;
        padding:calc(6px + env(safe-area-inset-top)) 8px 6px;
        min-height:0;
        gap:4px;
        border-radius:0;
        border-bottom:1px solid rgba(255,255,255,.09);
        background:#0e3d52;
        width:100%;
        box-sizing:border-box;
      }
      .cma-chat-page > header .cma-chat-person { flex:1; min-width:0; justify-content:flex-start; }
      .cma-chat-actions { display:flex; align-items:center; gap:2px; flex-shrink:0; margin-left:auto; }
      .cma-chat-page > header .cma-msg-back,
      .cma-chat-page > header .cma-chat-icon { width:36px; height:36px; }
      .cma-chat-page > header .cma-ico { width:22px; height:22px; }
      .cma-chat-person { gap:9px; }
      .cma-chat-person-name { font-size:16px; font-weight:600; }
      .cma-chat-menu { top:calc(58px + env(safe-area-inset-top)); right:8px; }

      .cma-chat-bubble { padding:12px 18px; border-radius:22px; color:#fff; }
      .cma-chat-mine {
        background:linear-gradient(135deg,#1fa67a,#0e7c7b);
        border-bottom-right-radius:22px;
      }
      .cma-chat-theirs {
        background:linear-gradient(135deg,#2a7be4,#8a45d6);
        border-bottom-left-radius:22px;
      }
      .cma-chat-time, .cma-tick { color:rgba(255,255,255,.78); }
    `;

    document.head.appendChild(style);
  }

  /* ---------- Hide the app's floating call button on message pages ---------- */

  function looksLikeFloatingWidget(el) {
    if (el.closest(".cma-msg-page") || el.closest(".cma-call-overlay")) return false;

    const tag = el.tagName;
    if (tag === "SCRIPT" || tag === "STYLE" || tag === "LINK" || tag === "HEAD") return false;

    const cs = getComputedStyle(el);

    if (cs.position !== "fixed" || cs.display === "none" || cs.visibility === "hidden") {
      return false;
    }

    const r = el.getBoundingClientRect();

    if (r.width < 36 || r.width > 110 || r.height < 36 || r.height > 110) return false;

    return r.right > window.innerWidth * 0.5 &&
           r.bottom > window.innerHeight * 0.45;
  }

  function hideFloatingWidgets() {
    document.body.querySelectorAll("*").forEach(el => {
      if (hiddenFloats.some(h => h.el === el)) return;

      try {
        if (looksLikeFloatingWidget(el)) {
          hiddenFloats.push({ el, prev: el.style.display });
          el.style.setProperty("display", "none", "important");
        }
      } catch (error) {
        /* ignore */
      }
    });
  }

  function stopFloatGuard() {
    if (floatTimer) {
      clearInterval(floatTimer);
      floatTimer = null;
    }

    hiddenFloats.forEach(({ el, prev }) => {
      el.style.removeProperty("display");
      if (prev) el.style.display = prev;
    });

    hiddenFloats = [];
  }

  function startFloatGuard() {
    hideFloatingWidgets();

    if (floatTimer) return;

    floatTimer = setInterval(() => {
      if (!document.querySelector(".cma-msg-page")) {
        stopFloatGuard();
        return;
      }

      hideFloatingWidgets();
    }, 1200);
  }

  /* ---------- Auth / presence ---------- */

  async function getUser() {
    if (currentUser) return currentUser;

    const { data, error } = await db.auth.getUser();

    if (error) throw error;

    currentUser = data?.user || null;
    myId = currentUser?.id || myId;

    if (Core.setCurrentUser) {
      Core.setCurrentUser(currentUser);
    }

    return currentUser;
  }

  function startPresence(user) {
    if (presenceChannel || !user) return;

    presenceChannel = db.channel("cma-online", {
      config: { presence: { key: user.id } }
    });

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        onlineSet = new Set(Object.keys(presenceChannel.presenceState()));
        refreshPresenceUI();
      })
      .subscribe(async status => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({ at: Date.now() });
        }
      });
  }

  function refreshPresenceUI() {
    const el = root();
    if (!el) return;

    el.querySelectorAll("[data-presence-user]").forEach(node => {
      const online = isOnline(node.dataset.presenceUser);

      if (node.classList.contains("cma-msg-dot") ||
          node.classList.contains("cma-msg-avatar-wrap")) {
        node.classList.toggle("on", online);
      } else {
        node.classList.toggle("on", online);
        node.textContent = online ? "Online" : "Offline";
      }
    });

    if (activeConversation) markDeliveredForMe();
  }

  /* ---------- Data ---------- */

  async function loadProfiles(ids) {
    const unique = [...new Set(ids.filter(Boolean))];

    if (!unique.length) return {};

    const { data, error } = await db
      .from("cma_community_profiles")
      .select("user_id,full_name,avatar_url")
      .in("user_id", unique);

    if (error) throw error;

    const map = {};

    (data || []).forEach(profile => {
      map[profile.user_id] = profile;
    });

    return map;
  }

  async function ensureMyProfile() {
    if (myProfile) return myProfile;

    const user = await getUser();
    if (!user) return {};

    try {
      const map = await loadProfiles([user.id]);
      myProfile = map[user.id] || {};
    } catch (error) {
      myProfile = {};
    }

    return myProfile;
  }

  async function loadSettings(user, ids) {
    settingsMap = {};
    if (!ids.length) return;

    const { data, error } = await db
      .from("cma_chat_settings")
      .select("conversation_id,bg_url,reaction,nickname_other,nickname_me")
      .eq("user_id", user.id)
      .in("conversation_id", ids);

    if (error) {
      console.warn("Chat settings:", error.message);
      return;
    }

    (data || []).forEach(row => {
      settingsMap[row.conversation_id] = row;
    });
  }

  async function loadTheme(conversationId) {
    const { data, error } = await db
      .from("cma_chat_themes")
      .select("conversation_id,bg_url")
      .eq("conversation_id", conversationId)
      .maybeSingle();

    if (error) {
      console.warn("Theme load:", error.message);
      return;
    }

    themeMap[conversationId] = data || { bg_url: null };
  }

  function applyThemeToUI(url) {
    const bg = root()?.querySelector("#cmaChatBg");
    if (!bg) return;

    bg.style.backgroundImage = url ? `url('${url}')` : "";
    bg.classList.toggle("has-bg", !!url);
  }

  async function saveTheme(url) {
    if (!activeConversation) return;

    const user = await getUser();
    themeMap[activeConversation.id] = { bg_url: url };

    const { error } = await db
      .from("cma_chat_themes")
      .upsert({
        conversation_id: activeConversation.id,
        bg_url: url,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      }, { onConflict: "conversation_id" });

    if (error) throw error;
  }

  async function saveSettings(patch) {
    if (!activeConversation) return;

    const user = await getUser();
    const next = { ...getSettings(activeConversation.id), ...patch };

    settingsMap[activeConversation.id] = next;

    const { error } = await db
      .from("cma_chat_settings")
      .upsert({
        user_id: user.id,
        conversation_id: activeConversation.id,
        bg_url: next.bg_url || null,
        reaction: next.reaction || "👍",
        nickname_other: next.nickname_other || null,
        nickname_me: next.nickname_me || null
      }, { onConflict: "user_id,conversation_id" });

    if (error) {
      console.error("Save settings error:", error);
      notify("Could not save settings.", "error");
    }
  }

  async function loadInbox() {
    const user = await getUser();

    if (!user) {
      throw new Error("Please login to use Messages.");
    }

    startPresence(user);

    const { data: memberships, error: memberError } =
      await db
        .from("cma_conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

    if (memberError) throw memberError;

    const ids = [
      ...new Set((memberships || []).map(x => x.conversation_id))
    ];

    if (!ids.length) {
      conversationsCache = [];
      return [];
    }

    await loadSettings(user, ids);

    const { data: conversations, error: conversationError } =
      await db
        .from("cma_conversations")
        .select("id,updated_at,conversation_type")
        .in("id", ids)
        .order("updated_at", { ascending: false });

    if (conversationError) throw conversationError;

    const { data: participants, error: participantError } =
      await db
        .from("cma_conversation_participants")
        .select("conversation_id,user_id")
        .in("conversation_id", ids);

    if (participantError) throw participantError;

    const otherIds = (participants || [])
      .filter(p => p.user_id !== user.id)
      .map(p => p.user_id);

    const profiles = await loadProfiles(otherIds);

    const { data: messages, error: messageError } =
      await db
        .from("cma_messages")
        .select("id,conversation_id,sender_id,content,message_type,file_name,status,deleted_at,created_at")
        .in("conversation_id", ids)
        .order("created_at", { ascending: false });

    if (messageError) throw messageError;

    const lastMessages = {};
    const unread = {};
    const toDeliver = new Set();

    (messages || []).forEach(message => {
      if (!lastMessages[message.conversation_id]) {
        lastMessages[message.conversation_id] = message;
      }

      if (message.sender_id !== user.id && message.status !== "seen" && !message.deleted_at) {
        unread[message.conversation_id] =
          (unread[message.conversation_id] || 0) + 1;
      }

      if (message.sender_id !== user.id && message.status === "sent") {
        toDeliver.add(message.conversation_id);
      }
    });

    // Opening the app/inbox means incoming messages are delivered.
    toDeliver.forEach(conversationId => {
      db.rpc("cma_mark_messages", {
        p_conversation_id: conversationId,
        p_status: "delivered"
      }).then(() => {}, () => {});
    });

    conversationsCache = (conversations || []).map(conversation => {
      const participant = (participants || []).find(
        p => p.conversation_id === conversation.id &&
             p.user_id !== user.id
      );

      const profile = profiles[participant?.user_id] || {};
      const last = lastMessages[conversation.id];

      return {
        id: conversation.id,
        userId: participant?.user_id || null,
        name: profile.full_name || "Community Member",
        avatar: profile.avatar_url || "",
        lastMessage: previewText(last),
        lastTime: last?.created_at || conversation.updated_at,
        unread: unread[conversation.id] || 0
      };
    });

    return conversationsCache;
  }

  function renderInbox(rootElement) {
    document.body.classList.remove("cma-chat-open");

    const filtered = conversationsCache.filter(item =>
      (displayName(item) + " " + item.name)
        .toLowerCase()
        .includes(searchValue.toLowerCase())
    );

    rootElement.innerHTML = `
      <div class="cma-msg-page">
        <header class="cma-msg-header">
          <button class="cma-msg-back"
            data-msg-action="home"
            aria-label="Back">${ico("back", 26)}</button>
          <div class="cma-msg-title">Messages</div>
        </header>

        <div class="cma-msg-search">
          <input type="search"
            id="cmaMsgSearch"
            placeholder="Search conversations..."
            value="${esc(searchValue)}">
        </div>

        <div class="cma-msg-list">
          ${
            filtered.length
              ? filtered.map(item => `
                <button class="cma-msg-item"
                  data-msg-action="open"
                  data-conversation="${esc(item.id)}">

                  <div class="cma-msg-avatar-wrap ${isOnline(item.userId) ? "on" : ""}"
                    data-presence-user="${esc(item.userId)}">
                    ${avatar(item.avatar, item.name)}
                  </div>

                  <div class="cma-msg-info">
                    <div class="cma-msg-name">
                      ${esc(displayName(item))}
                    </div>
                    <div class="cma-msg-preview">
                      ${esc(item.lastMessage)}
                    </div>
                  </div>

                  <div class="cma-msg-side">
                    <div class="cma-msg-time">
                      ${esc(timeAgo(item.lastTime))}
                    </div>
                    ${item.unread
                      ? `<div class="cma-msg-unread">${item.unread > 99 ? "99+" : item.unread}</div>`
                      : ""}
                  </div>
                </button>
              `).join("")
              : `
                <div class="cma-msg-empty">
                  ${ico("mail", 38)}
                  <strong>No conversations yet</strong>
                  <p>Your conversations will appear here.</p>
                </div>
              `
          }
        </div>
      </div>
    `;

    const search = rootElement.querySelector("#cmaMsgSearch");

    search?.addEventListener("input", event => {
      searchValue = event.target.value;
      const position = event.target.selectionStart;
      renderInbox(rootElement);

      const next = rootElement.querySelector("#cmaMsgSearch");
      next?.focus();
      next?.setSelectionRange(position, position);
    });
  }

  async function openConversation(conversationId) {
    const item = conversationsCache.find(x => x.id === conversationId);

    if (!item) return;

    activeConversation = item;
    await loadTheme(item.id);
    await renderChat(root());
  }

  function parseReactions(value) {
    if (typeof value === "string") {
      try { value = JSON.parse(value); } catch (e) { value = {}; }
    }

    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : {};
  }

  // Server confirm na kora porjonto local reaction dhore rakhi (stale reload e jate na hare)
  const reactionOverride = {};

  function applyOverride(messageId, map) {
    const o = reactionOverride[messageId];
    if (!o) return map;

    const server = map[myId] || null;

    if (server === o.value || Date.now() - o.at > 15000) {
      delete reactionOverride[messageId];
      return map;
    }

    const next = { ...map };
    if (o.value) next[myId] = o.value; else delete next[myId];
    return next;
  }

  async function loadMessages(conversationId) {
    const { data, error } = await db
      .from("cma_messages")
      .select(`
        id,
        conversation_id,
        sender_id,
        message_type,
        content,
        attachment_url,
        attachment_name,
        reply_to,
        status,
        delivered_at,
        seen_at,
        duration,
        created_at,
        edited_at,
        deleted_at
      `)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Load messages error:", error);
      throw error;
    }

    let rxRows = [];

    try {
      let rx = await db.rpc("cma_get_reactions", {
        p_conversation_id: String(conversationId)
      });

      if (rx.error) {
        // RPC nai hole sorasori table theke pori
        rx = await db
          .from("cma_msg_reactions")
          .select("message_id,user_id,reaction")
          .eq("conversation_id", String(conversationId));
      }

      if (rx.error) throw rx.error;
      rxRows = rx.data || [];
    } catch (rxError) {
      console.warn("Reactions load error:", rxError);

      if (!window.__cmaRxWarned) {
        window.__cmaRxWarned = true;
        toast("Reactions table nai (" + (rxError.code || "") + " " + (rxError.message || "") +
          "). Supabase-e cma-reactions-reply.sql run korun.", 12000);
      }
    }

    const rxMap = {};

    rxRows.forEach(r => {
      const key = String(r.message_id);
      (rxMap[key] = rxMap[key] || {})[r.user_id] = r.reaction;
    });

    return (data || []).map(message => ({
      ...message,
      file_url: message.attachment_url || "",
      file_name: message.attachment_name || "",
      duration: Number(message.duration) || 0,
      status: message.status || "sent",
      reactions: applyOverride(message.id, rxMap[String(message.id)] || {})
    }));
  }

  /* ---------- Message rendering ---------- */

  function tickHTML(message) {
    if (message.status === "seen") {
      return `<span class="cma-tick seen">${ico("checks", 16)}</span>`;
    }

    if (message.status === "delivered") {
      return `<span class="cma-tick">${ico("checks", 16)}</span>`;
    }

    return `<span class="cma-tick">${ico("check", 14)}</span>`;
  }

  function contentHTML(message) {
    if (message.deleted_at) return "<i>This message was deleted</i>";

    switch (message.message_type) {
      case "image":
        return `<img class="cma-chat-img" src="${esc(message.file_url)}" alt="">`;
      case "video":
        return `<video controls playsinline src="${esc(message.file_url)}"></video>`;
      case "file":
        return `<div class="cma-chat-file">${ico("file", 24)}<span>${esc(message.file_name || "File")}</span></div>`;
      case "voice":
        return `<div class="cma-chat-voice">
          <button type="button" data-msg-action="play" data-id="${esc(message.id)}">${ico("play", 18)}</button>
          <div class="cma-chat-wave"></div>
          <span>${esc(fmtDur(message.duration))}</span>
        </div>`;
      default:
        return esc(message.content || "");
    }
  }

  function reactionsHTML(message) {
    const map = message.reactions || {};
    const values = Object.values(map).filter(Boolean);

    if (!values.length) return "";

    const counts = {};
    values.forEach(v => { counts[v] = (counts[v] || 0) + 1; });

    return `<div class="cma-chat-react">${
      Object.entries(counts).map(([emoji, count]) =>
        `<span>${esc(emoji)}${count > 1 ? `<b>${count}</b>` : ""}</span>`
      ).join("")
    }</div>`;
  }

  function renderMessageList(messages) {
    return messages.map(message => {
      if (message.message_type === "call") {
        const info = callInfo(message);

        return `
          <div class="cma-chat-calllog ${info.missed ? "missed" : ""}">
            ${ico(info.video ? "video" : "phone", 16)}
            <span>${esc(info.text)}</span>
            <small>${esc(clock(message.created_at))}</small>
          </div>
        `;
      }

      const mine = message.sender_id === myId;

      return `
        <div class="cma-chat-row ${mine ? "mine" : "theirs"}"
          data-id="${esc(message.id)}">
          <div class="cma-chat-bubble ${
            mine ? "cma-chat-mine" : "cma-chat-theirs"
          }">
            ${quoteHTML(message)}
            ${contentHTML(message)}

            <span class="cma-chat-time">
              <span>${esc(clock(message.created_at))}${message.edited_at ? " · edited" : ""}</span>
              ${mine ? tickHTML(message) : ""}
            </span>
          </div>
          ${reactionsHTML(message)}
        </div>
      `;
    }).join("");
  }

  function paintMessages(force = false) {
    const box = root()?.querySelector("#cmaChatMessages");
    if (!box) return;

    const nearBottom =
      box.scrollHeight - box.scrollTop - box.clientHeight < 140;
    const previous = box.scrollTop;

    closeReactPopup();

    box.innerHTML = activeMessages.length
      ? renderMessageList(activeMessages)
      : `<div class="cma-msg-empty">Start your conversation.</div>`;

    box.scrollTop = force || nearBottom ? box.scrollHeight : previous;
  }

  async function renderChat(rootElement) {
    if (!rootElement || !activeConversation) return;

    const item = activeConversation;
    const settings = getSettings(item.id);
    const themeUrl = (themeMap[item.id] || {}).bg_url || null;

    document.body.classList.add("cma-chat-open");

    rootElement.innerHTML = `
      <div class="cma-msg-page">
        <div class="cma-chat-page">

          <div class="cma-chat-bg ${themeUrl ? "has-bg" : ""}"
            id="cmaChatBg"
            style="${themeUrl ? `background-image:url('${esc(themeUrl)}')` : ""}"></div>

          <header class="cma-msg-header">
            <button class="cma-msg-back"
              data-msg-action="inbox"
              aria-label="Back to Messages">${ico("back", 26)}</button>

            <div class="cma-chat-person" data-msg-action="profile">
              <div class="cma-msg-avatar-wrap ${isOnline(item.userId) ? "on" : ""}"
                data-presence-user="${esc(item.userId)}">
                ${avatar(item.avatar, item.name)}
              </div>
              <div style="min-width:0">
                <div class="cma-chat-person-name" id="cmaChatName">
                  ${esc(displayName(item))}
                </div>
              </div>
            </div>

            <div class="cma-chat-actions">
            <button class="cma-chat-icon" data-msg-action="voice-call"
              aria-label="Voice call">${ico("phone", 22)}</button>
            <button class="cma-chat-icon" data-msg-action="video-call"
              aria-label="Video call">${ico("video", 22)}</button>
            <button class="cma-chat-icon" data-msg-action="menu"
              aria-label="More">${ico("more", 22)}</button>
            </div>
          </header>

          <div class="cma-chat-menu" id="cmaChatMenu">
            <button data-msg-action="theme">${ico("palette", 20)}<span>Change Theme</span></button>
            <button data-msg-action="nicknames">${ico("edit", 20)}<span>Set Nicknames</span></button>
            <button data-msg-action="reaction">${ico("smile", 20)}<span>Change Reaction</span></button>
          </div>

          <div class="cma-chat-messages" id="cmaChatMessages">
            <div class="cma-msg-empty">Loading messages...</div>
          </div>

          <div class="cma-emoji-panel" id="cmaEmojiPanel">
            ${EMOJIS.map(e =>
              `<button type="button" data-msg-action="emoji-pick" data-emoji="${e}">${e}</button>`
            ).join("")}
          </div>

          <div class="cma-reply-bar" id="cmaReplyBar"></div>

          <form class="cma-chat-form" id="cmaChatForm">
            <div class="cma-chat-rec" id="cmaChatRec">
              <button class="cma-chat-tool" type="button"
                data-msg-action="rec-cancel" aria-label="Cancel recording">${ico("trash", 22)}</button>
              <span class="rec-dot"></span>
              <span id="cmaRecTime">0:00</span>
              <span class="hint">Recording...</span>
              <button class="cma-chat-send" type="button"
                data-msg-action="rec-send" aria-label="Send voice">${ico("send", 22)}</button>
            </div>

            <div class="cma-chat-inputwrap">
              <button class="cma-chat-tool mic" type="button"
                data-msg-action="rec-start" aria-label="Voice message">${ico("mic", 22)}</button>

              <input class="cma-chat-input"
                id="cmaChatInput"
                type="text"
                maxlength="5000"
                autocomplete="off"
                placeholder="Write a message...">

              <button class="cma-chat-tool" type="button"
                data-msg-action="emoji" aria-label="Emoji">${ico("smile", 22)}</button>
              <button class="cma-chat-tool" type="button"
                data-msg-action="attach" aria-label="Attach">${ico("clip", 22)}</button>
            </div>

            <button class="cma-chat-send"
              id="cmaChatSend"
              type="submit"
              aria-label="Send">${ico("send", 22)}</button>
          </form>

          <input type="file" id="cmaFileInput" hidden
            accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip">
          <input type="file" id="cmaThemeInput" hidden accept="image/*">

          <div class="cma-modal" id="cmaNickModal">
            <div class="cma-modal-card">
              <strong>Set Nicknames</strong>
              <label>Tumi take ki name dakbe</label>
              <input id="cmaNickOther" maxlength="30">
              <label>Se tomake ki name dakbe</label>
              <input id="cmaNickMe" maxlength="30">
              <div class="cma-modal-btns">
                <button type="button" data-msg-action="nick-cancel">Cancel</button>
                <button type="button" class="primary" data-msg-action="nick-save">Save</button>
              </div>
            </div>
          </div>

          <div class="cma-modal" id="cmaEditModal">
            <div class="cma-modal-card">
              <strong>Edit message</strong>
              <textarea id="cmaEditInput" maxlength="4000"></textarea>
              <div class="cma-modal-btns">
                <button type="button" data-msg-action="edit-cancel">Cancel</button>
                <button type="button" class="primary" data-msg-action="edit-save">Save</button>
              </div>
            </div>
          </div>

          <div class="cma-modal" id="cmaReactModal">
            <div class="cma-modal-card">
              <strong>Change Reaction</strong>
              <div class="cma-react-opts" id="cmaReactOpts"></div>
              <div class="cma-modal-btns">
                <button type="button" data-msg-action="react-cancel">Cancel</button>
                <button type="button" class="primary" data-msg-action="react-save">Save</button>
              </div>
            </div>
          </div>

        </div>
      </div>
    `;

    startFloatGuard();
    bindChatControls(rootElement);

    try {
      activeMessages = await loadMessages(item.id);

      if (activeConversation?.id !== item.id) return;

      paintMessages(true);
      subscribeToMessages(item.id);
      markSeen();
    } catch (error) {
      console.error("Message loading error:", error);
      notify(error.message || "Could not load messages.", "error");
    }
  }

  function subscribeToMessages(conversationId) {
    cleanupChannel();

    const refresh = async () => {
      if (activeConversation?.id !== conversationId) return;

      try {
        activeMessages = await loadMessages(conversationId);
        paintMessages(false);
        renderReplyBar();
        markSeen();
      } catch (error) {
        console.error("Realtime message refresh error:", error);
      }
    };

    activeChannel = db
      .channel("cma-chat-" + conversationId)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cma_messages",
          filter: "conversation_id=eq." + conversationId
        },
        refresh
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cma_msg_reactions",
          filter: "conversation_id=eq." + conversationId
        },
        refresh
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cma_chat_themes",
          filter: "conversation_id=eq." + conversationId
        },
        payload => {
          if (activeConversation?.id !== conversationId) return;
          const row = payload.new || {};
          themeMap[conversationId] = { bg_url: row.bg_url || null };
          applyThemeToUI(row.bg_url || null);
        }
      )
      .subscribe();
  }

  /* ---------- Status (delivered / seen) ---------- */

  async function markSeen() {
    if (!activeConversation || document.hidden || !myId) return;

    const unseen = activeMessages.some(
      m => m.sender_id !== myId && m.status !== "seen"
    );

    if (!unseen) return;

    const now = new Date().toISOString();

    activeMessages.forEach(m => {
      if (m.sender_id !== myId && m.status !== "seen") {
        m.status = "seen";
        m.seen_at = now;
      }
    });

    await db.rpc("cma_mark_messages", {
      p_conversation_id: activeConversation.id,
      p_status: "seen"
    });

    if (activeConversation) {
      const local = conversationsCache.find(c => c.id === activeConversation.id);
      if (local) local.unread = 0;
    }
  }

  async function markDeliveredForMe() {
    if (!activeConversation || !myId) return;

    const pending = activeMessages.some(
      m => m.sender_id !== myId && m.status === "sent"
    );

    if (!pending) return;

    await db.rpc("cma_mark_messages", {
      p_conversation_id: activeConversation.id,
      p_status: "delivered"
    });
  }

  /* ---------- Sending ---------- */

  async function insertMessage(fields) {
    const user = await getUser();
    const peerOnline = isOnline(activeConversation.userId);

    const row = {
      conversation_id: activeConversation.id,
      sender_id: user.id,
      status: peerOnline ? "delivered" : "sent",
      ...fields
    };

    if (replyTo) row.reply_to = replyTo;

    // DB column names: attachment_url / attachment_name
    if ("file_url" in row) {
      row.attachment_url = row.file_url;
      delete row.file_url;
    }

    if ("file_name" in row) {
      row.attachment_name = row.file_name;
      delete row.file_name;
    }

    if (peerOnline) row.delivered_at = new Date().toISOString();

    const { error } = await db.from("cma_messages").insert(row);

    if (error) throw error;

    clearReply();

    const { error: updateError } = await db
      .from("cma_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", activeConversation.id);

    if (updateError) {
      console.warn("Conversation time update:", updateError.message);
    }

    activeMessages = await loadMessages(activeConversation.id);
    paintMessages(true);
  }

  async function sendText() {
    const input = root()?.querySelector("#cmaChatInput");
    const content = input?.value.trim();

    if (!content || !activeConversation || loading) return;

    loading = true;

    try {
      if (input) input.value = "";

      await insertMessage({ message_type: "text", content });
    } catch (error) {
      console.error("Send message error:", error);
      notify(error.message || "Message could not be sent.", "error");
    } finally {
      loading = false;
    }
  }

  async function uploadFile(file, folder) {
    const user = await getUser();
    const name = file.name || "file";
    const ext = (name.split(".").pop() || "bin").toLowerCase();
    const path = `${user.id}/${activeConversation.id}/${folder}-${Date.now()}.${ext}`;

    const { error } = await db.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type || undefined });

    if (error) throw error;

    return db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  async function sendAttachment(file) {
    if (!file || !activeConversation) return;

    notify("Uploading...", "info");

    try {
      const url = await uploadFile(file, "file");

      const type = file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
          ? "video"
          : "file";

      await insertMessage({
        message_type: type,
        file_url: url,
        file_name: file.name
      });
    } catch (error) {
      console.error("Attachment error:", error);
      notify(error.message || "Could not send file.", "error");
    }
  }

  /* ---------- Voice recording (tap mic, then send or delete) ---------- */

  async function startRecording() {
    if (recorder) return;

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      notify("Voice recording is not supported on this browser.", "error");
      return;
    }

    recCancelled = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const media = new MediaRecorder(stream);
      const chunks = [];

      media.ondataavailable = e => chunks.push(e.data);

      media.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        clearInterval(recTimer);

        const panel = root()?.querySelector("#cmaChatRec");
        if (panel) panel.style.display = "none";

        if (recCancelled || recSeconds < 1 || !activeConversation) return;

        try {
          const blob = new Blob(chunks, { type: media.mimeType || "audio/webm" });
          const file = new File([blob], "voice.webm", { type: blob.type });
          const url = await uploadFile(file, "voice");

          await insertMessage({
            message_type: "voice",
            file_url: url,
            duration: recSeconds
          });
        } catch (error) {
          console.error("Voice send error:", error);
          notify(error.message || "Could not send voice message.", "error");
        }
      };

      media.start();
      recorder = media;
      recSeconds = 0;

      const panel = root()?.querySelector("#cmaChatRec");
      const label = root()?.querySelector("#cmaRecTime");
      if (panel) panel.style.display = "flex";
      if (label) label.textContent = "0:00";

      recTimer = setInterval(() => {
        recSeconds += 1;
        const l = root()?.querySelector("#cmaRecTime");
        if (l) l.textContent = fmtDur(recSeconds);
      }, 1000);
    } catch (error) {
      recorder = null;
      notify("Please allow microphone permission.", "error");
    }
  }

  function stopRecording() {
    if (recorder && recorder.state !== "inactive") recorder.stop();
    recorder = null;
  }

  function finishRecording(send) {
    recCancelled = !send;
    stopRecording();
  }

  function bindChatControls(rootElement) {
    const form = rootElement.querySelector("#cmaChatForm");

    bindSwipeReply(rootElement);

    form?.addEventListener("submit", event => {
      event.preventDefault();
      sendText();
    });

    rootElement.querySelector("#cmaFileInput")
      ?.addEventListener("change", event => {
        const file = event.target.files[0];
        event.target.value = "";
        sendAttachment(file);
      });

    rootElement.querySelector("#cmaThemeInput")
      ?.addEventListener("change", async event => {
        const file = event.target.files[0];
        event.target.value = "";
        if (!file || !activeConversation) return;

        notify("Setting theme...", "info");

        try {
          const url = await uploadFile(file, "theme");
          await saveTheme(url);
          applyThemeToUI(url);
        } catch (error) {
          console.error("Theme error:", error);
          notify(error.message || "Could not set theme.", "error");
        }
      });
  }

  /* ---------- Reactions (Messenger style) ---------- */

  function closeReactPopup() {
    document.getElementById("cmaReactPop")?.remove();
  }

  function openReactPopup(messageId) {
    const page = root()?.querySelector(".cma-chat-page");
    if (!page) return;

    const message = activeMessages.find(m => m.id === messageId);
    if (!message || message.deleted_at || message.message_type === "call") return;

    const bubble = page.querySelector(
      `.cma-chat-row[data-id="${CSS.escape(messageId)}"] .cma-chat-bubble`
    );

    if (!bubble) return;

    closeReactPopup();

    const mine = message.sender_id === myId;
    const myReaction = (message.reactions || {})[myId];

    let info = "";

    if (mine) {
      if (message.status === "seen") {
        info = "Seen " + clock(message.seen_at);
      } else if (message.status === "delivered") {
        info = "Delivered";
      } else {
        info = "Sent";
      }
    }

    const canOpen =
      !!message.file_url &&
      (message.message_type === "image" || message.message_type === "file");

    const pop = document.createElement("div");
    pop.id = "cmaReactPop";
    pop.className = "cma-react-pop";

    pop.innerHTML = `
      <div class="cma-react-bar">
        ${QUICK_REACTIONS.map(r => `
          <button type="button"
            class="${r === myReaction ? "sel" : ""}"
            data-msg-action="react-set"
            data-id="${esc(messageId)}"
            data-e="${r}">${r}</button>
        `).join("")}
        <button type="button" class="more"
          data-msg-action="react-more"
          data-id="${esc(messageId)}"
          aria-label="More reactions">+</button>
      </div>
      ${info ? `<div class="cma-react-info">${esc(info)}</div>` : ""}
      ${canOpen
        ? `<button type="button" class="cma-react-open"
             data-msg-action="media-open"
             data-url="${esc(message.file_url)}">Open</button>`
        : ""}
      <div class="cma-react-actions">
        <button type="button"
          data-msg-action="msg-reply"
          data-id="${esc(messageId)}">Reply</button>
        ${mine ? `
          ${message.message_type === "text" ? `<button type="button"
            data-msg-action="msg-edit"
            data-id="${esc(messageId)}">Edit</button>` : ""}
          <button type="button" class="danger"
            data-msg-action="msg-delete"
            data-id="${esc(messageId)}">Delete</button>` : ""}
      </div>
    `;

    page.appendChild(pop);

    const pageRect = page.getBoundingClientRect();
    const bubbleRect = bubble.getBoundingClientRect();
    const w = pop.offsetWidth;
    const h = pop.offsetHeight;

    let top = bubbleRect.top - pageRect.top - h - 8;

    if (top < 76) top = bubbleRect.bottom - pageRect.top + 8;
    if (top + h > pageRect.height - 70) {
      top = Math.max(76, pageRect.height - h - 80);
    }

    let left = mine
      ? bubbleRect.right - pageRect.left - w
      : bubbleRect.left - pageRect.left;

    left = Math.max(8, Math.min(left, pageRect.width - w - 8));

    pop.style.top = top + "px";
    pop.style.left = left + "px";
  }

  // Emoji ber kora: keyboard-er emoji (ba je kono emoji) type/pick korle shei-ta react hoi
  function firstEmoji(text) {
    const re = /(\p{Extended_Pictographic}|\p{Regional_Indicator})/u;

    if (window.Intl && Intl.Segmenter) {
      const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });

      for (const part of seg.segment(text)) {
        if (re.test(part.segment)) return part.segment;
      }

      return "";
    }

    const m = text.match(
      /(\p{Extended_Pictographic}(\uFE0F|\u200D\p{Extended_Pictographic}|[\u{1F3FB}-\u{1F3FF}])*)/u
    );

    return m ? m[0] : "";
  }

  function openFullReactSheet(messageId) {
    const page = root()?.querySelector(".cma-chat-page");
    const message = activeMessages.find(m => m.id === messageId);
    if (!page || !message) return;

    closeReactPopup();

    const mine = (message.reactions || {})[myId];
    const all = [...new Set([...REACTIONS, ...EMOJIS])];

    const sheet = document.createElement("div");
    sheet.id = "cmaReactPop";
    sheet.className = "cma-react-sheet";
    sheet.innerHTML = `
      <div class="cma-react-typebar">
        <input id="cmaReactType" type="text" autocomplete="off"
          autocapitalize="off" spellcheck="false"
          placeholder="Keyboard-er emoji chapun \u{1F642}">
        <button type="button" data-msg-action="react-close">\u2715</button>
      </div>
      <div class="grid">${all.map(e => `
        <button type="button" class="${e === mine ? "sel" : ""}"
          data-msg-action="react-set"
          data-id="${esc(messageId)}"
          data-e="${e}">${e}</button>`).join("")}</div>`;

    page.appendChild(sheet);

    const input = sheet.querySelector("#cmaReactType");

    input.addEventListener("input", () => {
      const emoji = firstEmoji(input.value);

      if (emoji) {
        input.value = "";
        input.blur();
        closeReactPopup();
        setReaction(messageId, emoji);
      } else if (input.value.length > 6) {
        input.value = "";
      }
    });

    // Same tap-er moddhe focus => mobile-e keyboard khule jabe
    input.focus();
  }

  // RPC age try kori; na hole sorasori table update; error hole asol karon dekhai
  async function saveToDb(rpcName, args, fallback) {
    const { error } = await db.rpc(rpcName, args);

    if (!error) return null;

    console.warn(rpcName + " rpc failed:", error);

    if (!fallback) return error;

    const { data, error: e2 } = await fallback();

    if (e2) {
      console.error(rpcName + " fallback failed:", e2);
      return e2;
    }

    if (!data || !data.length) {
      return { message: "Permission denied (database policy) - SQL run korun" };
    }

    return null;
  }

  let editingId = null;

  /* ---------- Reply (swipe) ---------- */

  let replyTo = null;
  let swipedAt = 0;

  function renderReplyBar() {
    const bar = root()?.querySelector("#cmaReplyBar");
    if (!bar) return;

    const m = replyTo && activeMessages.find(x => x.id === replyTo);

    if (!m) {
      replyTo = null;
      bar.classList.remove("open");
      bar.innerHTML = "";
      return;
    }

    const who = m.sender_id === myId ? "You" : displayName(activeConversation);

    bar.innerHTML = `
      <div class="cma-reply-txt">
        <b>Replying to ${esc(who)}</b>
        <span>${esc(previewText(m))}</span>
      </div>
      <button type="button" data-msg-action="reply-cancel" aria-label="Cancel reply">✕</button>
    `;

    bar.classList.add("open");
  }

  function setReply(id) {
    const m = activeMessages.find(x => x.id === id);
    if (!m || m.deleted_at || m.message_type === "call") return;

    replyTo = id;
    renderReplyBar();
    root()?.querySelector("#cmaChatInput")?.focus();
  }

  function clearReply() {
    replyTo = null;
    renderReplyBar();
  }

  function quoteHTML(message) {
    if (!message.reply_to) return "";

    const o = activeMessages.find(x => String(x.id) === String(message.reply_to));
    const who = !o ? "" : (o.sender_id === myId ? "You" : displayName(activeConversation));
    const txt = o ? previewText(o) : "Original message";

    return `<div class="cma-quote" data-msg-action="goto-reply"
      data-id="${esc(o ? o.id : "")}">
      ${who ? `<b>${esc(who)}</b>` : ""}<span>${esc(txt)}</span></div>`;
  }

  // Amar msg => bam dike tan, opponent-er msg => dan dike tan
  function bindSwipeReply(rootElement) {
    const box = rootElement.querySelector("#cmaChatMessages");
    if (!box) return;

    const MAX = 70;
    const THRESHOLD = 55;

    let row = null, id = null, mine = false;
    let sx = 0, sy = 0, dx = 0;
    let active = false, locked = false;

    const reset = () => {
      if (row) {
        row.style.transition = "transform .18s ease";
        row.style.transform = "";
      }
      row = null;
    };

    box.addEventListener("pointerdown", e => {
      if (e.pointerType === "mouse" && e.button !== 0) return;

      const r = e.target.closest(".cma-chat-row");
      if (!r || e.target.closest("video, audio, button, a")) return;

      const m = activeMessages.find(x => x.id === r.dataset.id);
      if (!m || m.deleted_at) return;

      row = r;
      id = m.id;
      mine = m.sender_id === myId;
      sx = e.clientX;
      sy = e.clientY;
      dx = 0;
      active = true;
      locked = false;
    });

    box.addEventListener("pointermove", e => {
      if (!active || !row) return;

      const mx = e.clientX - sx;
      const my = e.clientY - sy;

      if (!locked) {
        if (Math.abs(my) > 10 && Math.abs(my) > Math.abs(mx)) {
          active = false;
          reset();
          return;
        }

        if (Math.abs(mx) < 8) return;

        locked = true;
        row.style.transition = "none";
      }

      dx = mine
        ? Math.max(-MAX, Math.min(0, mx))
        : Math.min(MAX, Math.max(0, mx));

      row.style.transform = `translateX(${dx}px)`;
    });

    const end = () => {
      if (!active) return;
      active = false;

      if (locked) {
        swipedAt = Date.now();

        if (Math.abs(dx) >= THRESHOLD) {
          if (navigator.vibrate) navigator.vibrate(15);
          setReply(id);
        }
      }

      reset();
    };

    box.addEventListener("pointerup", end);
    box.addEventListener("pointercancel", end);
  }

  function openEditModal(messageId) {
    const message = activeMessages.find(m => m.id === messageId);
    if (!message || message.sender_id !== myId || message.deleted_at ||
        message.message_type !== "text") return;

    editingId = messageId;

    const modal = root()?.querySelector("#cmaEditModal");
    const input = root()?.querySelector("#cmaEditInput");
    if (!modal || !input) return;

    input.value = message.content || "";
    modal.classList.add("open");
    input.focus();
  }

  async function saveEdit() {
    const modal = root()?.querySelector("#cmaEditModal");
    const input = root()?.querySelector("#cmaEditInput");
    const message = activeMessages.find(m => m.id === editingId);

    if (!message || !input) return;

    const text = input.value.trim();

    if (!text) {
      notify("Message cannot be empty.", "error");
      return;
    }

    if (text === (message.content || "")) {
      modal?.classList.remove("open");
      editingId = null;
      return;
    }

    const error = await saveToDb(
      "cma_edit_message",
      { p_message_id: message.id, p_content: text },
      () => db.from("cma_messages")
        .update({ content: text, edited_at: new Date().toISOString() })
        .eq("id", message.id)
        .eq("sender_id", myId)
        .select("id")
    );

    if (error) {
      notify("Could not edit: " + (error.message || "unknown error"), "error");
      return;
    }

    message.content = text;
    message.edited_at = new Date().toISOString();
    modal?.classList.remove("open");
    editingId = null;
    paintMessages(false);
  }

  async function deleteMessage(messageId) {
    const message = activeMessages.find(m => m.id === messageId);
    if (!message || message.sender_id !== myId || message.deleted_at) return;

    if (!window.confirm("Delete this message?")) return;

    const fileUrl = message.file_url;

    const error = await saveToDb(
      "cma_delete_message",
      { p_message_id: message.id },
      () => db.from("cma_messages")
        .update({
          deleted_at: new Date().toISOString(),
          content: "",
          attachment_url: null,
          reactions: {}
        })
        .eq("id", message.id)
        .eq("sender_id", myId)
        .select("id")
    );

    if (error) {
      notify("Could not delete: " + (error.message || "unknown error"), "error");
      return;
    }

    message.deleted_at = new Date().toISOString();
    message.content = "";
    message.file_url = "";
    message.reactions = {};
    paintMessages(false);

    // Photo / voice / file hole storage theke-o muche felo (best effort)
    if (fileUrl) {
      const marker = "/" + BUCKET + "/";
      const idx = fileUrl.indexOf(marker);

      if (idx !== -1) {
        const path = decodeURIComponent(
          fileUrl.slice(idx + marker.length).split("?")[0]
        );

        db.storage.from(BUCKET).remove([path]).then(() => {}, () => {});
      }
    }
  }

  async function setReaction(messageId, emoji) {
    const message = activeMessages.find(m => m.id === messageId);
    if (!message || message.deleted_at || !myId ||
        message.message_type === "call") return;

    const before = { ...(message.reactions || {}) };
    const map = { ...(message.reactions || {}) };
    const next = map[myId] === emoji ? null : emoji;

    if (next) {
      map[myId] = next;
    } else {
      delete map[myId];
    }

    message.reactions = map;
    paintMessages(false);

    reactionOverride[messageId] = { value: next || null, at: Date.now() };

    let error = null;

    try {
      let res = await db.rpc("cma_react", {
        p_message_id: String(messageId),
        p_conversation_id: String(message.conversation_id),
        p_reaction: next || null
      });

      // RPC na thakle sorasori table-e likhi
      if (res.error) {
        console.warn("cma_react rpc failed, using table:", res.error);

        if (next) {
          res = await db.from("cma_msg_reactions").upsert({
            message_id: String(messageId),
            conversation_id: String(message.conversation_id),
            user_id: myId,
            reaction: next
          }, { onConflict: "message_id,user_id" });
        } else {
          res = await db.from("cma_msg_reactions")
            .delete()
            .eq("message_id", String(messageId))
            .eq("user_id", myId);
        }
      }

      error = res.error;
    } catch (e) {
      error = e;
    }

    if (error) {
      delete reactionOverride[messageId];
      message.reactions = before;
      paintMessages(false);
      let diag = "";

      try {
        const { data: s } = await db.auth.getSession();
        const authId = s?.session?.user?.id || "NO-SESSION";
        diag = " | myId=" + String(myId).slice(0, 8) +
          " session=" + String(authId).slice(0, 8) +
          " same=" + (authId === myId);
      } catch (e) {
        diag = " | session check failed";
      }

      toast("Reaction save hoy nai: " + (error.code || "") + " " +
        (error.message || "unknown error") + diag, 15000);
    }
  }

  function playVoice(button) {
    const message = activeMessages.find(m => m.id === button.dataset.id);
    if (!message) return;

    if (audioEl && !audioEl.paused && audioEl._id === message.id) {
      audioEl.pause();
      button.innerHTML = ico("play", 18);
      return;
    }

    if (audioEl) {
      audioEl.pause();
      if (audioBtn) audioBtn.innerHTML = ico("play", 18);
    }

    audioEl = new Audio(message.file_url);
    audioEl._id = message.id;
    audioBtn = button;
    audioEl.onended = () => { button.innerHTML = ico("play", 18); };
    audioEl.play().catch(() => {
      button.innerHTML = ico("play", 18);
    });
    button.innerHTML = ico("pause", 18);
  }

  /* ---------- Calls (WebRTC + Supabase Realtime signaling) ---------- */

  function sendSignal(toId, payload) {
    if (!toId || !myId) return Promise.resolve();

    let channel = sigChannels[toId];

    if (!channel) {
      channel = db.channel("cma-call-" + toId);

      channel._ready = new Promise((resolve, reject) => {
        channel.subscribe(status => {
          if (status === "SUBSCRIBED") {
            resolve();
          } else if (["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status)) {
            delete sigChannels[toId];
            reject(new Error(status));
          }
        });
      });

      channel._ready.catch(() => {});
      sigChannels[toId] = channel;
    }

    return channel._ready
      .then(() => channel.send({
        type: "broadcast",
        event: "sig",
        payload: { ...payload, to: toId, from: myId }
      }))
      .catch(error => console.warn("Call signal error:", error));
  }

  // App khola thakle (chat-e na thakleo) incoming message "delivered" hobe
  let deliverChannel = null;

  function startDeliveryListener(user) {
    if (deliverChannel || !user) return;

    deliverChannel = db
      .channel("cma-deliver-" + user.id)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "cma_messages" },
        ({ new: row }) => {
          if (!row || row.sender_id === user.id || row.status !== "sent") return;

          db.rpc("cma_mark_messages", {
            p_conversation_id: row.conversation_id,
            p_status: "delivered"
          }).then(() => {}, () => {});
        }
      )
      .subscribe();
  }

  function startCallListener(user) {
    if (callListener || !user) return;

    callListener = db
      .channel("cma-call-" + user.id)
      .on("broadcast", { event: "sig" }, ({ payload }) => {
        handleSignal(payload);
      })
      .subscribe();
  }

  function getMedia(video) {
    if (!navigator.mediaDevices?.getUserMedia) {
      return Promise.reject(new Error("Calls need HTTPS and a supported browser."));
    }

    return navigator.mediaDevices.getUserMedia({
      audio: true,
      video: video ? { facingMode: "user" } : false
    });
  }

  function newCallId() {
    return (window.crypto?.randomUUID && window.crypto.randomUUID()) ||
      String(Date.now()) + Math.random().toString(16).slice(2);
  }

  function stopRing() {
    if (ringTimer) {
      clearInterval(ringTimer);
      ringTimer = null;
    }
  }

  function beep() {
    try {
      audioCtx = audioCtx ||
        new (window.AudioContext || window.webkitAudioContext)();

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.frequency.value = 480;
      gain.gain.value = 0.05;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (error) {
      /* ignore */
    }
  }

  function startRing() {
    stopRing();

    const tick = () => {
      try {
        if (navigator.vibrate) navigator.vibrate([300, 150, 300]);
      } catch (error) {
        /* ignore */
      }

      beep();
    };

    tick();
    ringTimer = setInterval(tick, 2000);
  }

  function attachCallStreams() {
    const remote = document.getElementById("cmaRemoteVideo");
    const local = document.getElementById("cmaLocalVideo");

    if (remote && call?.remote) {
      remote.srcObject = call.remote;
      const p = remote.play?.();
      if (p && p.catch) p.catch(() => {});
    }

    if (local && call?.local) {
      local.srcObject = call.local;
    }
  }

  function updateCallUI() {
    const el = document.getElementById("cmaCallOverlay");
    if (!el || !call) return;

    el.dataset.state = call.state;

    const status = el.querySelector("#cmaCallStatus");
    if (!status) return;

    const labels = {
      calling: "Calling...",
      ringing: call.video ? "Incoming video call" : "Incoming voice call",
      connecting: "Connecting...",
      connected: fmtDur(call.secs || 0)
    };

    status.textContent = labels[call.state] || "";
  }

  function showCallUI() {
    document.getElementById("cmaCallOverlay")?.remove();

    styles();

    const el = document.createElement("div");
    el.id = "cmaCallOverlay";
    el.className = "cma-call-overlay " + (call.video ? "video" : "audio");
    el.dataset.state = call.state;

    el.innerHTML = `
      <video id="cmaRemoteVideo" class="cma-call-remote" autoplay playsinline></video>

      <div class="cma-call-info">
        <div class="cma-call-avatar">${avatar(call.avatar, call.name)}</div>
        <div class="cma-call-name">${esc(call.name)}</div>
        <div class="cma-call-status" id="cmaCallStatus"></div>
      </div>

      <video id="cmaLocalVideo" class="cma-call-local" autoplay muted playsinline></video>

      <div class="cma-call-ctl cma-call-incoming">
        <button class="cma-call-btn red" data-call-action="decline"
          aria-label="Decline">${ico("phone", 26)}</button>
        <button class="cma-call-btn green" data-call-action="accept"
          aria-label="Accept">${ico(call.video ? "video" : "phone", 26)}</button>
      </div>

      <div class="cma-call-ctl cma-call-active">
        <button class="cma-call-btn" id="cmaCallMute" data-call-action="mute"
          aria-label="Mute">${ico("mic", 24)}</button>
        <button class="cma-call-btn cam" id="cmaCallCam" data-call-action="cam"
          aria-label="Camera">${ico("video", 24)}</button>
        <button class="cma-call-btn red" data-call-action="end"
          aria-label="End call">${ico("phone", 26)}</button>
      </div>
    `;

    document.body.appendChild(el);
    el.addEventListener("click", handleCallClick);

    attachCallStreams();
    updateCallUI();
  }

  function createPeerConnection() {
    const pc = new RTCPeerConnection(ICE_CONFIG);

    call.pc = pc;
    call.remote = new MediaStream();
    call.iceOut = [];

    call.local.getTracks().forEach(track => pc.addTrack(track, call.local));

    pc.ontrack = event => {
      event.streams[0]?.getTracks().forEach(track => {
        if (!call.remote.getTracks().includes(track)) {
          call.remote.addTrack(track);
        }
      });

      attachCallStreams();
    };

    pc.onicecandidate = event => {
      if (!event.candidate || !call || call.pc !== pc) return;

      call.iceOut.push(event.candidate.toJSON());

      if (!call.iceTimer) {
        call.iceTimer = setTimeout(() => {
          if (!call || call.pc !== pc) return;

          const batch = call.iceOut;
          call.iceOut = [];
          call.iceTimer = null;

          sendSignal(call.peerId, {
            kind: "ice",
            callId: call.id,
            candidates: batch
          });
        }, 200);
      }
    };

    const onState = () => {
      if (!call || call.pc !== pc) return;

      const connected =
        pc.connectionState === "connected" ||
        pc.iceConnectionState === "connected" ||
        pc.iceConnectionState === "completed";

      if (connected && call.state !== "connected") {
        call.state = "connected";
        call.secs = 0;

        clearTimeout(call.ringTimeout);
        clearInterval(call.timer);

        call.timer = setInterval(() => {
          if (!call) return;
          call.secs += 1;
          updateCallUI();
        }, 1000);

        updateCallUI();
        attachCallStreams();
      }

      if (pc.connectionState === "failed" || pc.iceConnectionState === "failed") {
        endCall(true, "Call connection failed.");
      }
    };

    pc.onconnectionstatechange = onState;
    pc.oniceconnectionstatechange = onState;

    return pc;
  }

  function flushPendingIce() {
    if (!call?.pc || !call.pc.remoteDescription) return;

    const list = call.pendingIce || [];
    call.pendingIce = [];

    list.forEach(candidate => {
      call.pc.addIceCandidate(candidate).catch(() => {});
    });
  }

  async function startCall(video) {
    if (call) return;

    const item = activeConversation;

    if (!item?.userId) {
      notify("Member information is missing.", "error");
      return;
    }

    try {
      await getUser();
      const me = await ensureMyProfile();

      const stream = await getMedia(video);

      call = {
        id: newCallId(),
        peerId: item.userId,
        name: displayName(item),
        avatar: item.avatar,
        video,
        conversationId: item.id,
        role: "caller",
        state: "calling",
        local: stream,
        pendingIce: []
      };

      createPeerConnection();
      showCallUI();

      sendSignal(item.userId, {
        kind: "invite",
        callId: call.id,
        video,
        name: me.full_name || "Community Member",
        avatar: me.avatar_url || ""
      });

      call.ringTimeout = setTimeout(() => {
        if (call && call.state === "calling") {
          sendSignal(call.peerId, { kind: "end", callId: call.id });
          endCall(false, "No answer.");
        }
      }, 35000);
    } catch (error) {
      console.error("Start call error:", error);
      cleanupCall();
      notify("Could not start the call. Please allow microphone/camera permission.", "error");
    }
  }

  async function acceptCall() {
    if (!call || call.role !== "callee" || call.state !== "ringing") return;

    stopRing();
    clearTimeout(call.ringTimeout);

    try {
      call.local = await getMedia(call.video);
    } catch (error) {
      sendSignal(call.peerId, { kind: "decline", callId: call.id });
      cleanupCall();
      notify("Please allow microphone/camera permission to answer calls.", "error");
      return;
    }

    createPeerConnection();
    call.state = "connecting";

    attachCallStreams();
    updateCallUI();

    sendSignal(call.peerId, { kind: "accept", callId: call.id });
  }

  function declineCall() {
    if (!call) return;

    sendSignal(call.peerId, { kind: "decline", callId: call.id });
    cleanupCall();
  }

  // Call shesh hole chat-e ekta log message (shudhu caller-er client theke, ekbar)
  async function logCall(finished) {
    if (!finished || finished.role !== "caller" || finished.logged ||
        !finished.conversationId || !myId) return;

    finished.logged = true;

    const talked = finished.state === "connected";
    const now = new Date().toISOString();

    try {
      const { error } = await db.from("cma_messages").insert({
        conversation_id: finished.conversationId,
        sender_id: myId,
        message_type: "call",
        content: JSON.stringify({
          callType: finished.video ? "video" : "audio",
          status: talked ? "completed" : "missed",
          duration: talked ? (finished.secs || 0) : 0
        }),
        status: "seen",
        delivered_at: now,
        seen_at: now
      });

      if (error) throw error;

      await db
        .from("cma_conversations")
        .update({ updated_at: now })
        .eq("id", finished.conversationId);

      if (activeConversation?.id === finished.conversationId) {
        activeMessages = await loadMessages(finished.conversationId);
        paintMessages(true);
      }
    } catch (error) {
      console.warn("Call log error:", error);
    }
  }

  function cleanupCall() {
    stopRing();

    const finished = call;
    call = null;

    if (!finished) return;

    clearTimeout(finished.ringTimeout);
    clearTimeout(finished.iceTimer);
    clearInterval(finished.timer);

    logCall(finished);

    try {
      finished.pc?.close();
    } catch (error) {
      /* ignore */
    }

    finished.local?.getTracks().forEach(track => track.stop());

    document.getElementById("cmaCallOverlay")?.remove();
  }

  function endCall(notifyPeer, reason) {
    if (!call) return;

    if (notifyPeer) {
      sendSignal(call.peerId, { kind: "end", callId: call.id });
    }

    cleanupCall();

    if (reason) notify(reason, "info");
  }

  function handleCallClick(event) {
    const button = event.target.closest("[data-call-action]");
    if (!button || !call) return;

    const action = button.dataset.callAction;

    if (action === "accept") acceptCall();
    if (action === "decline") declineCall();
    if (action === "end") endCall(true);

    if (action === "mute" && call.local) {
      const tracks = call.local.getAudioTracks();
      const enable = tracks.length ? !tracks[0].enabled : true;

      tracks.forEach(track => { track.enabled = enable; });

      button.classList.toggle("off", !enable);
      button.innerHTML = ico(enable ? "mic" : "micOff", 24);
    }

    if (action === "cam" && call.local) {
      const tracks = call.local.getVideoTracks();
      const enable = tracks.length ? !tracks[0].enabled : true;

      tracks.forEach(track => { track.enabled = enable; });

      button.classList.toggle("off", !enable);
      button.innerHTML = ico(enable ? "video" : "videoOff", 24);
    }
  }

  async function handleSignal(payload) {
    if (!payload || !myId) return;
    if (payload.to && payload.to !== myId) return;

    const kind = payload.kind;

    if (kind === "invite") {
      if (call) {
        sendSignal(payload.from, { kind: "busy", callId: payload.callId });
        return;
      }

      const known = conversationsCache.find(c => c.userId === payload.from);

      call = {
        id: payload.callId,
        peerId: payload.from,
        name: known ? displayName(known) : (payload.name || "Community Member"),
        avatar: known ? known.avatar : (payload.avatar || ""),
        video: !!payload.video,
        role: "callee",
        state: "ringing",
        pendingIce: []
      };

      showCallUI();
      startRing();

      call.ringTimeout = setTimeout(() => {
        if (call && call.state === "ringing") {
          endCall(false, "Missed call.");
        }
      }, 35000);

      return;
    }

    if (!call || call.id !== payload.callId || call.peerId !== payload.from) return;

    try {
      if (kind === "accept" && call.role === "caller") {
        clearTimeout(call.ringTimeout);
        call.state = "connecting";
        updateCallUI();

        const offer = await call.pc.createOffer();
        await call.pc.setLocalDescription(offer);

        sendSignal(call.peerId, {
          kind: "offer",
          callId: call.id,
          sdp: { type: offer.type, sdp: offer.sdp }
        });
      }

      if (kind === "offer" && call.role === "callee" && call.pc) {
        await call.pc.setRemoteDescription(payload.sdp);
        flushPendingIce();

        const answer = await call.pc.createAnswer();
        await call.pc.setLocalDescription(answer);

        sendSignal(call.peerId, {
          kind: "answer",
          callId: call.id,
          sdp: { type: answer.type, sdp: answer.sdp }
        });
      }

      if (kind === "answer" && call.role === "caller" && call.pc) {
        await call.pc.setRemoteDescription(payload.sdp);
        flushPendingIce();
      }

      if (kind === "ice") {
        for (const candidate of payload.candidates || []) {
          if (call.pc && call.pc.remoteDescription) {
            await call.pc.addIceCandidate(candidate).catch(() => {});
          } else {
            call.pendingIce.push(candidate);
          }
        }
      }

      if (kind === "decline") endCall(false, "Call declined.");
      if (kind === "busy") endCall(false, "User is busy on another call.");
      if (kind === "end") endCall(false, "Call ended.");
    } catch (error) {
      console.error("Call signal handling error:", error);
      endCall(true, "Call failed.");
    }
  }

  /* ---------- Direct open ---------- */

  async function openDirect(userId) {
    if (!userId) {
      notify("Member information is missing.", "error");
      return;
    }

    try {
      const user = await getUser();

      if (!user) throw new Error("Please login first.");

      const { data, error } = await db.rpc(
        "cma_start_direct_conversation",
        { p_other_user_id: userId }
      );

      if (error) throw error;

      const conversationId = data;

      if (!conversationId) {
        throw new Error("Could not open conversation.");
      }

      await loadInbox();

      if (!conversationsCache.some(x => x.id === conversationId)) {
        const profiles = await loadProfiles([userId]);
        const profile = profiles[userId] || {};

        conversationsCache.unshift({
          id: conversationId,
          userId,
          name: profile.full_name || "Community Member",
          avatar: profile.avatar_url || "",
          lastMessage: "Start a conversation",
          lastTime: new Date().toISOString(),
          unread: 0
        });
      }

      styles();
      await openConversation(conversationId);

    } catch (error) {
      console.error("Open direct conversation error:", error);
      notify(error.message || "Could not open conversation.", "error");
    }
  }

  /* ---------- Events ---------- */

  function bindEvents(rootElement) {
    if (rootElement.dataset.cmaMessagingBound === "true") return;

    rootElement.dataset.cmaMessagingBound = "true";

    rootElement.addEventListener("click", async event => {
      const button = event.target.closest("[data-msg-action]");

      // Close the 3-dot menu / reaction popup when tapping elsewhere
      const menu = rootElement.querySelector("#cmaChatMenu");
      if (menu && !(button && button.dataset.msgAction === "menu")) {
        menu.classList.remove("open");
      }

      if (!event.target.closest("#cmaReactPop")) {
        closeReactPopup();
      }

      if (!button) {
        if (Date.now() - swipedAt < 450) return;

        // Tap on any message (text / voice / file / photo) => reaction popup
        const row = event.target.closest(".cma-chat-row");

        if (row && !event.target.closest("video")) {
          const id = row.dataset.id;
          const now = Date.now();

          if (lastTapRow === id && now - lastTap < 320) {
            // Double tap => quick react with the default reaction
            clearTimeout(tapTimer);
            lastTap = 0;
            lastTapRow = null;

            setReaction(id, getSettings(activeConversation.id).reaction || "👍");
            return;
          }

          lastTap = now;
          lastTapRow = id;

          clearTimeout(tapTimer);
          tapTimer = setTimeout(() => openReactPopup(id), 260);
        }

        return;
      }

      const action = button.dataset.msgAction;

      if (action === "home") {
        cleanup();
        window.dispatchEvent(new CustomEvent("cma:navigate", {
          detail: { page: "home" }
        }));
      }

      if (action === "inbox") {
        activeConversation = null;
        cleanupChannel();
        await showInbox();
      }

      if (action === "open") {
        await openConversation(button.dataset.conversation);
      }

      if (action === "profile" && activeConversation?.userId) {
        window.dispatchEvent(new CustomEvent("cma:navigate", {
          detail: { page: "profile", userId: activeConversation.userId }
        }));
      }

      if (action === "voice-call") startCall(false);
      if (action === "video-call") startCall(true);

      if (action === "menu") {
        menu?.classList.toggle("open");
      }

      if (action === "theme") {
        rootElement.querySelector("#cmaThemeInput")?.click();
      }

      if (action === "nicknames") {
        const s = getSettings(activeConversation.id);
        rootElement.querySelector("#cmaNickOther").value = s.nickname_other || "";
        rootElement.querySelector("#cmaNickMe").value = s.nickname_me || "";
        rootElement.querySelector("#cmaNickModal")?.classList.add("open");
      }

      if (action === "nick-cancel") {
        rootElement.querySelector("#cmaNickModal")?.classList.remove("open");
      }

      if (action === "nick-save") {
        await saveSettings({
          nickname_other:
            rootElement.querySelector("#cmaNickOther").value.trim() || null,
          nickname_me:
            rootElement.querySelector("#cmaNickMe").value.trim() || null
        });

        rootElement.querySelector("#cmaNickModal")?.classList.remove("open");

        const name = rootElement.querySelector("#cmaChatName");
        if (name) name.textContent = displayName(activeConversation);
      }

      if (action === "reaction") {
        pickedReaction = getSettings(activeConversation.id).reaction || "👍";

        rootElement.querySelector("#cmaReactOpts").innerHTML = REACTIONS
          .map(r => `<button type="button" data-msg-action="react-pick"
            data-r="${r}" class="${r === pickedReaction ? "sel" : ""}">${r}</button>`)
          .join("");

        rootElement.querySelector("#cmaReactModal")?.classList.add("open");
      }

      if (action === "react-pick") {
        pickedReaction = button.dataset.r;
        rootElement.querySelectorAll("#cmaReactOpts button").forEach(b => {
          b.classList.toggle("sel", b.dataset.r === pickedReaction);
        });
      }

      if (action === "react-cancel") {
        rootElement.querySelector("#cmaReactModal")?.classList.remove("open");
      }

      if (action === "react-save") {
        await saveSettings({ reaction: pickedReaction });
        rootElement.querySelector("#cmaReactModal")?.classList.remove("open");
        notify("Default reaction: " + pickedReaction, "info");
      }

      if (action === "react-set") {
        closeReactPopup();
        setReaction(button.dataset.id, button.dataset.e);
      }

      if (action === "msg-reply") {
        closeReactPopup();
        setReply(button.dataset.id);
      }

      if (action === "reply-cancel") {
        clearReply();
      }

      if (action === "goto-reply" && button.dataset.id) {
        const el = rootElement.querySelector(
          `.cma-chat-row[data-id="${CSS.escape(button.dataset.id)}"]`
        );

        if (el) {
          el.scrollIntoView({ block: "center", behavior: "smooth" });
          el.classList.add("flash");
          setTimeout(() => el.classList.remove("flash"), 1300);
        }
      }

      if (action === "react-close") {
        closeReactPopup();
      }

      if (action === "react-more") {
        openFullReactSheet(button.dataset.id);
      }

      if (action === "msg-edit") {
        closeReactPopup();
        openEditModal(button.dataset.id);
      }

      if (action === "msg-delete") {
        closeReactPopup();
        deleteMessage(button.dataset.id);
      }

      if (action === "edit-cancel") {
        rootElement.querySelector("#cmaEditModal")?.classList.remove("open");
        editingId = null;
      }

      if (action === "edit-save") {
        await saveEdit();
      }

      if (action === "media-open") {
        closeReactPopup();
        window.open(button.dataset.url, "_blank", "noopener");
      }

      if (action === "emoji") {
        rootElement.querySelector("#cmaEmojiPanel")?.classList.toggle("open");
      }

      if (action === "emoji-pick") {
        const input = rootElement.querySelector("#cmaChatInput");
        if (input) {
          input.value += button.dataset.emoji;
          input.focus();
        }
      }

      if (action === "attach") {
        rootElement.querySelector("#cmaFileInput")?.click();
      }

      if (action === "rec-start") startRecording();
      if (action === "rec-cancel") finishRecording(false);
      if (action === "rec-send") finishRecording(true);

      if (action === "play") {
        playVoice(button);
      }
    });
  }

  function cleanupChannel() {
    if (activeChannel) {
      db.removeChannel(activeChannel);
      activeChannel = null;
    }
  }

  function cleanup() {
    cleanupChannel();

    recCancelled = true;
    stopRecording();

    if (audioEl) audioEl.pause();

    clearTimeout(tapTimer);
    closeReactPopup();
    stopFloatGuard();

    activeConversation = null;
    activeMessages = [];
    replyTo = null;
    document.body.classList.remove("cma-chat-open");
  }

  async function showInbox() {
    const rootElement = root();
    if (!rootElement) return;

    styles();
    bindEvents(rootElement);
    startFloatGuard();
    document.body.classList.remove("cma-chat-open");

    rootElement.innerHTML = `
      <div class="cma-msg-page">
        <header class="cma-msg-header">
          <button class="cma-msg-back"
            data-msg-action="home"
            aria-label="Back">${ico("back", 26)}</button>
          <div class="cma-msg-title">Messages</div>
        </header>
        <div class="cma-msg-empty">Loading conversations...</div>
      </div>
    `;

    try {
      await loadInbox();
      renderInbox(rootElement);
    } catch (error) {
      console.error("Inbox loading error:", error);

      rootElement.innerHTML = `
        <div class="cma-msg-page">
          <header class="cma-msg-header">
            <button class="cma-msg-back"
              data-msg-action="home">${ico("back", 26)}</button>
            <div class="cma-msg-title">Messages</div>
          </header>
          <div class="cma-msg-empty">
            Could not load conversations.
            <p>${esc(error.message || "Please try again.")}</p>
          </div>
        </div>
      `;
    }
  }

  async function render(rootElement) {
    cleanup();
    currentUser = null;
    searchValue = "";

    styles();
    bindEvents(rootElement);

    await showInbox();
  }

  /* ---------- Global start (online status + incoming calls anywhere) ---------- */

  async function initGlobal() {
    try {
      const { data } = await db.auth.getUser();
      const user = data?.user;

      if (user) {
        currentUser = user;
        myId = user.id;

        startPresence(user);
        startCallListener(user);
        startDeliveryListener(user);
        ensureMyProfile();
      }
    } catch (error) {
      /* not logged in */
    }
  }

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) markSeen();
  });

  if (db.auth && db.auth.onAuthStateChange) {
    db.auth.onAuthStateChange((event, session) => {
      const user = session?.user || null;

      if (user) {
        myId = user.id;
        startPresence(user);
        startCallListener(user);
        startDeliveryListener(user);
      } else {
        myId = null;
        myProfile = null;
        currentUser = null;

        if (presenceChannel) {
          db.removeChannel(presenceChannel);
          presenceChannel = null;
        }

        if (callListener) {
          db.removeChannel(callListener);
          callListener = null;
        }

        if (deliverChannel) {
          db.removeChannel(deliverChannel);
          deliverChannel = null;
        }
      }
    });
  }

  initGlobal();

  MODULE.render = render;
  MODULE.openDirect = openDirect;
  MODULE.cleanup = cleanup;

})();
