/* ==========================================
   CHANGE MAKER ACADEMY
   COMMUNITY MESSAGING
   PHASE 2 - INBOX + FULL CHAT
   (online status, unread, ticks, seen time, attachments,
    voice, emoji, theme, nicknames, reactions)
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
  const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];
  const EMOJIS = ("😀 😁 😂 🤣 😊 😍 😘 😎 🥰 😉 😅 😭 😢 😡 😴 🤔 🙄 😇 🥳 😬 " +
    "🤗 😮 😱 🙏 👍 👎 👏 🙌 💪 🤝 ❤️ 💔 🔥 ✨ 🎉 💯 ✅ ❌ 🌹 🌙 ☀️ 🎁").split(" ");

  let currentUser = null;
  let activeConversation = null;
  let activeChannel = null;
  let conversationsCache = [];
  let settingsMap = {};
  let activeMessages = [];
  let searchValue = "";
  let loading = false;

  let presenceChannel = null;
  let onlineSet = new Set();

  let recorder = null;
  let recStartX = 0;
  let recCancelled = false;
  let recTimer = null;
  let recSeconds = 0;
  let audioEl = null;
  let pickedReaction = "👍";
  let lastTap = 0;

  const root = () =>
    Core.getRoot
      ? Core.getRoot()
      : document.getElementById("pageContent");

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

  function previewText(message) {
    if (!message) return "Start a conversation";
    if (message.deleted_at) return "This message was deleted";

    switch (message.message_type) {
      case "image": return "📷 Photo";
      case "video": return "🎥 Video";
      case "voice": return "🎤 Voice message";
      case "file": return "📎 " + (message.file_name || "File");
      default: return message.content || "";
    }
  }

  function styles() {
    if (document.getElementById("cmaMessagingStyles")) return;

    const style = document.createElement("style");
    style.id = "cmaMessagingStyles";

    style.textContent = `
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
        gap:12px;
        padding:0 16px;
        background:#073746;
        border-bottom:1px solid rgba(255,255,255,.09);
      }

      .cma-msg-back {
        width:40px;
        height:40px;
        flex-shrink:0;
        border:0;
        border-radius:50%;
        background:transparent;
        color:#fff;
        font-size:27px;
        cursor:pointer;
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

      .cma-chat-page {
        height:calc(100dvh - 1px);
        min-height:500px;
        display:flex;
        flex-direction:column;
        background:#073746;
        position:relative;
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
        background:rgba(7,55,70,.92);
      }

      .cma-chat-icon {
        width:40px;
        height:40px;
        border:0;
        border-radius:50%;
        background:transparent;
        color:#fff;
        font-size:21px;
        cursor:pointer;
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
        top:62px;
        z-index:20;
        min-width:200px;
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
        justify-content:flex-end;
        gap:5px;
        margin-top:5px;
        font-size:10px;
        color:#c0d9dc;
      }

      .cma-tick.seen {
        color:#4fc3ff;
      }

      .cma-chat-react {
        margin-top:-7px;
        padding:0 6px;
        font-size:15px;
        border-radius:12px;
        background:#0d3b49;
        border:1px solid rgba(255,255,255,.14);
      }

      .cma-chat-seen {
        display:none;
        margin-top:3px;
        font-size:11px;
        color:#a9c4cb;
      }

      .cma-chat-seen.open {
        display:block;
      }

      .cma-chat-img,
      .cma-chat-bubble video {
        display:block;
        max-width:100%;
        max-height:300px;
        border-radius:12px;
      }

      .cma-chat-file {
        color:#fff;
        text-decoration:none;
        display:flex;
        gap:8px;
        align-items:center;
      }

      .cma-chat-voice {
        display:flex;
        align-items:center;
        gap:10px;
        min-width:170px;
      }

      .cma-chat-voice button {
        width:32px;
        height:32px;
        border:0;
        border-radius:50%;
        background:rgba(0,0,0,.25);
        color:#fff;
        cursor:pointer;
      }

      .cma-chat-wave {
        flex:1;
        height:18px;
        opacity:.7;
        background:repeating-linear-gradient(90deg,#d6eef0 0 2px,transparent 2px 5px);
      }

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
        display:flex;
        align-items:center;
        gap:8px;
        padding:13px 14px;
        padding-bottom:max(13px, env(safe-area-inset-bottom));
        background:rgba(9,47,60,.95);
        border-top:1px solid rgba(255,255,255,.08);
      }

      .cma-chat-inputwrap {
        flex:1;
        min-width:0;
        display:flex;
        align-items:center;
        border-radius:25px;
        background:#174b57;
        border:1px solid rgba(255,255,255,.06);
      }

      .cma-chat-inputwrap:focus-within {
        border-color:#08a889;
      }

      .cma-chat-tool {
        width:38px;
        height:38px;
        flex-shrink:0;
        border:0;
        background:transparent;
        font-size:19px;
        color:#fff;
        cursor:pointer;
      }

      .cma-chat-input {
        flex:1;
        min-width:0;
        padding:13px 4px;
        border:0;
        outline:none;
        background:transparent;
        color:#fff;
        font-size:14px;
      }

      .cma-chat-input::placeholder {
        color:#b4cbd1;
      }

      .cma-chat-send {
        width:45px;
        height:45px;
        flex-shrink:0;
        border:0;
        border-radius:50%;
        background:#08a889;
        color:#fff;
        font-size:19px;
        cursor:pointer;
        touch-action:none;
      }

      .cma-chat-send:disabled {
        opacity:.5;
      }

      .cma-chat-rec {
        position:absolute;
        inset:0 70px 0 0;
        display:none;
        align-items:center;
        gap:12px;
        padding:0 18px;
        background:#092f3c;
        color:#ff8a8a;
        z-index:3;
        font-size:14px;
      }

      .cma-chat-rec span.hint {
        color:#a9c4cb;
        font-size:12px;
      }

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
        gap:8px;
        margin:16px 0;
        font-size:30px;
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

      @media(max-width:480px) {
        .cma-chat-row {
          max-width:84%;
        }

        .cma-msg-list {
          padding:0 12px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  async function getUser() {
    if (currentUser) return currentUser;

    const { data, error } = await db.auth.getUser();

    if (error) throw error;

    currentUser = data?.user || null;

    if (Core.setCurrentUser) {
      Core.setCurrentUser(currentUser);
    }

    return currentUser;
  }

  /* ---------- Presence (Online / Offline) ---------- */

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

      if (node.classList.contains("cma-msg-dot")) {
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
            aria-label="Back">‹</button>
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

                  <div class="cma-msg-avatar-wrap">
                    ${avatar(item.avatar, item.name)}
                    <span class="cma-msg-dot ${isOnline(item.userId) ? "on" : ""}"
                      data-presence-user="${esc(item.userId)}"></span>
                  </div>

                  <div class="cma-msg-info">
                    <div class="cma-msg-name">
                      ${esc(displayName(item))}
                    </div>
                    <div class="cma-msg-presence ${isOnline(item.userId) ? "on" : ""}"
                      data-presence-user="${esc(item.userId)}">${isOnline(item.userId) ? "Online" : "Offline"}</div>
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
                  <div style="font-size:36px;margin-bottom:12px;">✉</div>
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
    await renderChat(root());
  }

  async function loadMessages(conversationId) {
    const { data, error } = await db
      .from("cma_messages")
      .select("id,conversation_id,sender_id,message_type,content,file_url,file_name,duration,status,delivered_at,seen_at,reaction,created_at,edited_at,deleted_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return data || [];
  }

  /* ---------- Message rendering ---------- */

  function tickHTML(message) {
    if (message.status === "seen") return `<span class="cma-tick seen">✓✓</span>`;
    if (message.status === "delivered") return `<span class="cma-tick">✓✓</span>`;
    return `<span class="cma-tick">✓</span>`;
  }

  function contentHTML(message) {
    if (message.deleted_at) return "<i>This message was deleted</i>";

    switch (message.message_type) {
      case "image":
        return `<img class="cma-chat-img"
          src="${esc(message.file_url)}"
          data-msg-action="view"
          data-url="${esc(message.file_url)}" alt="">`;
      case "video":
        return `<video controls playsinline src="${esc(message.file_url)}"></video>`;
      case "file":
        return `<a class="cma-chat-file" href="${esc(message.file_url)}"
          target="_blank" rel="noopener">📄 <span>${esc(message.file_name || "File")}</span></a>`;
      case "voice":
        return `<div class="cma-chat-voice">
          <button type="button" data-msg-action="play" data-id="${esc(message.id)}">▶</button>
          <div class="cma-chat-wave"></div>
          <span>${esc(fmtDur(message.duration))}</span>
        </div>`;
      default:
        return esc(message.content || "");
    }
  }

  function renderMessageList(messages) {
    return messages.map(message => {
      const mine = message.sender_id === currentUser.id;

      return `
        <div class="cma-chat-row ${mine ? "mine" : "theirs"}"
          data-id="${esc(message.id)}">
          <div class="cma-chat-bubble ${
            mine ? "cma-chat-mine" : "cma-chat-theirs"
          }">
            ${contentHTML(message)}

            <span class="cma-chat-time">
              <span>${esc(clock(message.created_at))}${message.edited_at ? " · edited" : ""}</span>
              ${mine ? tickHTML(message) : ""}
            </span>
          </div>
          ${message.reaction
            ? `<div class="cma-chat-react">${esc(message.reaction)}</div>`
            : ""}
          ${mine
            ? `<div class="cma-chat-seen" id="seen-${esc(message.id)}">${
                message.seen_at
                  ? "Seen " + esc(clock(message.seen_at))
                  : "Not seen yet"
              }</div>`
            : ""}
        </div>
      `;
    }).join("");
  }

  function paintMessages(scroll = true) {
    const box = root()?.querySelector("#cmaChatMessages");
    if (!box) return;

    const openSeen = [...box.querySelectorAll(".cma-chat-seen.open")]
      .map(el => el.id);

    box.innerHTML = activeMessages.length
      ? renderMessageList(activeMessages)
      : `<div class="cma-msg-empty">Start your conversation.</div>`;

    openSeen.forEach(id => {
      document.getElementById(id)?.classList.add("open");
    });

    if (scroll) box.scrollTop = box.scrollHeight;
  }

  async function renderChat(rootElement) {
    if (!rootElement || !activeConversation) return;

    const item = activeConversation;
    const settings = getSettings(item.id);

    document.body.classList.add("cma-chat-open");

    rootElement.innerHTML = `
      <div class="cma-msg-page">
        <div class="cma-chat-page">

          <div class="cma-chat-bg ${settings.bg_url ? "has-bg" : ""}"
            id="cmaChatBg"
            style="${settings.bg_url ? `background-image:url('${esc(settings.bg_url)}')` : ""}"></div>

          <header class="cma-msg-header">
            <button class="cma-msg-back"
              data-msg-action="inbox"
              aria-label="Back to Messages">‹</button>

            <div class="cma-chat-person" data-msg-action="profile">
              <div class="cma-msg-avatar-wrap">
                ${avatar(item.avatar, item.name)}
                <span class="cma-msg-dot ${isOnline(item.userId) ? "on" : ""}"
                  data-presence-user="${esc(item.userId)}"></span>
              </div>
              <div style="min-width:0">
                <div class="cma-chat-person-name" id="cmaChatName">
                  ${esc(displayName(item))}
                </div>
                <div class="cma-chat-status ${isOnline(item.userId) ? "on" : ""}"
                  data-presence-user="${esc(item.userId)}">${isOnline(item.userId) ? "Online" : "Offline"}</div>
              </div>
            </div>

            <button class="cma-chat-icon" data-msg-action="voice-call"
              aria-label="Voice call">📞</button>
            <button class="cma-chat-icon" data-msg-action="video-call"
              aria-label="Video call">🎥</button>
            <button class="cma-chat-icon" data-msg-action="menu"
              aria-label="More">⋮</button>
          </header>

          <div class="cma-chat-menu" id="cmaChatMenu">
            <button data-msg-action="theme">🎨 Change Theme</button>
            <button data-msg-action="nicknames">✏️ Set Nicknames</button>
            <button data-msg-action="reaction">😊 Change Reaction</button>
          </div>

          <div class="cma-chat-messages" id="cmaChatMessages">
            <div class="cma-msg-empty">Loading messages...</div>
          </div>

          <div class="cma-emoji-panel" id="cmaEmojiPanel">
            ${EMOJIS.map(e =>
              `<button type="button" data-msg-action="emoji-pick" data-emoji="${e}">${e}</button>`
            ).join("")}
          </div>

          <form class="cma-chat-form" id="cmaChatForm">
            <div class="cma-chat-rec" id="cmaChatRec">
              <span>🔴</span>
              <span id="cmaRecTime">0:00</span>
              <span class="hint">← swipe left to cancel</span>
            </div>

            <div class="cma-chat-inputwrap">
              <button class="cma-chat-tool" type="button"
                data-msg-action="emoji" aria-label="Emoji">😀</button>

              <input class="cma-chat-input"
                id="cmaChatInput"
                type="text"
                maxlength="5000"
                autocomplete="off"
                placeholder="Write a message...">

              <button class="cma-chat-tool" type="button"
                data-msg-action="attach" aria-label="Attach">📎</button>
            </div>

            <button class="cma-chat-send"
              id="cmaChatSend"
              type="button"
              aria-label="Send">🎤</button>
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
        async () => {
          if (activeConversation?.id !== conversationId) return;

          try {
            activeMessages = await loadMessages(conversationId);
            paintMessages(true);
            markSeen();
          } catch (error) {
            console.error("Realtime message refresh error:", error);
          }
        }
      )
      .subscribe();
  }

  /* ---------- Status (delivered / seen) ---------- */

  async function markSeen() {
    if (!activeConversation || document.hidden || !currentUser) return;

    const unseen = activeMessages.some(
      m => m.sender_id !== currentUser.id && m.status !== "seen"
    );

    if (!unseen) return;

    const now = new Date().toISOString();

    activeMessages.forEach(m => {
      if (m.sender_id !== currentUser.id && m.status !== "seen") {
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
    // Incoming messages count as delivered as soon as this app is open.
    if (!activeConversation || !currentUser) return;

    const pending = activeMessages.some(
      m => m.sender_id !== currentUser.id && m.status === "sent"
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

    if (peerOnline) row.delivered_at = new Date().toISOString();

    const { error } = await db.from("cma_messages").insert(row);

    if (error) throw error;

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
      updateSendButton();

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

  function updateSendButton() {
    const input = root()?.querySelector("#cmaChatInput");
    const button = root()?.querySelector("#cmaChatSend");
    if (!input || !button) return;

    button.textContent = input.value.trim() ? "➤" : "🎤";
  }

  /* ---------- Voice recording ---------- */

  async function startRecording(clientX) {
    recStartX = clientX;
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

  function bindChatControls(rootElement) {
    const input = rootElement.querySelector("#cmaChatInput");
    const send = rootElement.querySelector("#cmaChatSend");
    const form = rootElement.querySelector("#cmaChatForm");

    input?.addEventListener("input", updateSendButton);

    form?.addEventListener("submit", event => {
      event.preventDefault();
      sendText();
    });

    send?.addEventListener("click", () => {
      if (input?.value.trim()) sendText();
    });

    send?.addEventListener("pointerdown", event => {
      if (input?.value.trim()) return;
      send.setPointerCapture(event.pointerId);
      startRecording(event.clientX);
    });

    send?.addEventListener("pointermove", event => {
      if (recorder && recStartX - event.clientX > 80) {
        recCancelled = true;
        stopRecording();
      }
    });

    send?.addEventListener("pointerup", () => {
      if (recorder) stopRecording();
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
          await saveSettings({ bg_url: url });

          const bg = rootElement.querySelector("#cmaChatBg");
          if (bg) {
            bg.style.backgroundImage = `url('${url}')`;
            bg.classList.add("has-bg");
          }
        } catch (error) {
          console.error("Theme error:", error);
          notify(error.message || "Could not set theme.", "error");
        }
      });
  }

  /* ---------- Reactions / audio ---------- */

  async function toggleReaction(messageId) {
    const message = activeMessages.find(m => m.id === messageId);
    if (!message || message.deleted_at) return;

    const wanted = getSettings(activeConversation.id).reaction || "👍";
    const next = message.reaction === wanted ? null : wanted;

    message.reaction = next;
    paintMessages(false);

    const { error } = await db.rpc("cma_set_reaction", {
      p_message_id: messageId,
      p_reaction: next
    });

    if (error) {
      console.error("Reaction error:", error);
      notify("Could not save reaction.", "error");
    }
  }

  function playVoice(button) {
    const message = activeMessages.find(m => m.id === button.dataset.id);
    if (!message) return;

    if (audioEl && !audioEl.paused && audioEl._id === message.id) {
      audioEl.pause();
      button.textContent = "▶";
      return;
    }

    if (audioEl) audioEl.pause();

    audioEl = new Audio(message.file_url);
    audioEl._id = message.id;
    audioEl.onended = () => { button.textContent = "▶"; };
    audioEl.play();
    button.textContent = "⏸";
  }

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

      // Close the 3-dot menu when tapping elsewhere
      const menu = rootElement.querySelector("#cmaChatMenu");
      if (menu && !(button && button.dataset.msgAction === "menu")) {
        menu.classList.remove("open");
      }

      if (!button) {
        // Tap on my message => toggle seen time
        const row = event.target.closest(".cma-chat-row.mine");
        if (row) {
          rootElement
            .querySelector("#seen-" + CSS.escape(row.dataset.id))
            ?.classList.toggle("open");
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

      if (action === "voice-call") {
        notify("Voice call is coming soon.", "info");
      }

      if (action === "video-call") {
        notify("Video call is coming soon.", "info");
      }

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

      if (action === "emoji") {
        rootElement.querySelector("#cmaEmojiPanel")?.classList.toggle("open");
      }

      if (action === "emoji-pick") {
        const input = rootElement.querySelector("#cmaChatInput");
        if (input) {
          input.value += button.dataset.emoji;
          updateSendButton();
          input.focus();
        }
      }

      if (action === "attach") {
        rootElement.querySelector("#cmaFileInput")?.click();
      }

      if (action === "view") {
        window.open(button.dataset.url, "_blank", "noopener");
      }

      if (action === "play") {
        playVoice(button);
      }
    });

    // Double tap / double click on a message => default reaction
    rootElement.addEventListener("dblclick", event => {
      const row = event.target.closest(".cma-chat-row");
      if (row) toggleReaction(row.dataset.id);
    });

    rootElement.addEventListener("touchend", event => {
      const row = event.target.closest(".cma-chat-row");
      if (!row) return;

      const now = Date.now();
      if (now - lastTap < 300) toggleReaction(row.dataset.id);
      lastTap = now;
    });

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) markSeen();
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
    stopRecording();
    if (audioEl) audioEl.pause();
    activeConversation = null;
    activeMessages = [];
    document.body.classList.remove("cma-chat-open");
  }

  async function showInbox() {
    const rootElement = root();
    if (!rootElement) return;

    styles();
    bindEvents(rootElement);
    document.body.classList.remove("cma-chat-open");

    rootElement.innerHTML = `
      <div class="cma-msg-page">
        <header class="cma-msg-header">
          <button class="cma-msg-back"
            data-msg-action="home"
            aria-label="Back">‹</button>
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
              data-msg-action="home">‹</button>
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

  MODULE.render = render;
  MODULE.openDirect = openDirect;
  MODULE.cleanup = cleanup;

})();
