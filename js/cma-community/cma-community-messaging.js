
/* ==========================================
   CHANGE MAKER ACADEMY
   COMMUNITY MESSAGING
   PHASE 1 - INBOX + TEXT CHAT
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

  let currentUser = null;
  let activeConversation = null;
  let activeChannel = null;
  let conversationsCache = [];
  let searchValue = "";
  let loading = false;

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

      .cma-msg-info {
        flex:1;
        min-width:0;
      }

      .cma-msg-name {
        font-size:15px;
        font-weight:700;
        margin-bottom:6px;
      }

      .cma-msg-preview {
        color:#b4cbd1;
        font-size:13px;
        overflow:hidden;
        white-space:nowrap;
        text-overflow:ellipsis;
      }

      .cma-msg-time {
        color:#a9c4cb;
        font-size:11px;
        white-space:nowrap;
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
      }

      .cma-chat-person {
        display:flex;
        align-items:center;
        gap:11px;
        flex:1;
        min-width:0;
      }

      .cma-chat-person .cma-msg-avatar {
        width:43px;
        height:43px;
      }

      .cma-chat-person-name {
        font-size:15px;
        font-weight:750;
      }

      .cma-chat-status {
        font-size:12px;
        color:#a9c4cb;
        margin-top:4px;
      }

      .cma-chat-messages {
        flex:1;
        overflow-y:auto;
        padding:20px 14px;
        display:flex;
        flex-direction:column;
        gap:12px;
        overscroll-behavior:contain;
      }

      .cma-chat-bubble {
        max-width:78%;
        width:fit-content;
        padding:11px 15px;
        border-radius:18px;
        font-size:14px;
        line-height:1.55;
        overflow-wrap:anywhere;
        box-shadow:0 2px 8px rgba(0,0,0,.08);
      }

      .cma-chat-mine {
        align-self:flex-end;
        background:#087e70;
        border-bottom-right-radius:5px;
      }

      .cma-chat-theirs {
        align-self:flex-start;
        background:#10505d;
        border-bottom-left-radius:5px;
      }

      .cma-chat-time {
        display:block;
        text-align:right;
        margin-top:5px;
        font-size:10px;
        color:#c0d9dc;
      }

      .cma-chat-form {
        display:flex;
        align-items:center;
        gap:10px;
        padding:13px 14px;
        padding-bottom:max(13px, env(safe-area-inset-bottom));
        background:#092f3c;
        border-top:1px solid rgba(255,255,255,.08);
      }

      .cma-chat-input {
        flex:1;
        min-width:0;
        padding:14px 18px;
        border:1px solid rgba(255,255,255,.06);
        outline:none;
        border-radius:25px;
        background:#174b57;
        color:#fff;
        font-size:14px;
      }

      .cma-chat-input:focus {
        border-color:#08a889;
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
      }

      .cma-chat-send:disabled {
        opacity:.5;
      }

      @media(max-width:480px) {
        .cma-chat-bubble {
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

  async function loadInbox() {
    const user = await getUser();

    if (!user) {
      throw new Error("Please login to use Messages.");
    }

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
        .select("id,conversation_id,sender_id,content,message_type,created_at")
        .in("conversation_id", ids)
        .order("created_at", { ascending: false });

    if (messageError) throw messageError;

    const lastMessages = {};

    (messages || []).forEach(message => {
      if (!lastMessages[message.conversation_id]) {
        lastMessages[message.conversation_id] = message;
      }
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
        lastMessage: last?.content || "Start a conversation",
        lastTime: last?.created_at || conversation.updated_at
      };
    });

    return conversationsCache;
  }

  function renderInbox(rootElement) {
    const filtered = conversationsCache.filter(item =>
      item.name.toLowerCase().includes(searchValue.toLowerCase())
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

                  ${avatar(item.avatar, item.name)}

                  <div class="cma-msg-info">
                    <div class="cma-msg-name">
                      ${esc(item.name)}
                    </div>
                    <div class="cma-msg-preview">
                      ${esc(item.lastMessage)}
                    </div>
                  </div>

                  <div class="cma-msg-time">
                    ${esc(timeAgo(item.lastTime))}
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
      .select("id,conversation_id,sender_id,message_type,content,created_at,edited_at,deleted_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return data || [];
  }

  function renderMessageList(messages) {
    return messages.map(message => {
      const mine = message.sender_id === currentUser.id;

      return `
        <div class="cma-chat-bubble ${
          mine ? "cma-chat-mine" : "cma-chat-theirs"
        }">
          ${message.deleted_at
            ? "<i>This message was deleted</i>"
            : esc(message.content || "")}

          <span class="cma-chat-time">
            ${esc(timeAgo(message.created_at))}
            ${message.edited_at ? " · edited" : ""}
          </span>
        </div>
      `;
    }).join("");
  }

  async function renderChat(rootElement) {
    if (!rootElement || !activeConversation) return;

    const item = activeConversation;

    rootElement.innerHTML = `
      <div class="cma-msg-page">
        <div class="cma-chat-page">

          <header class="cma-msg-header">
            <button class="cma-msg-back"
              data-msg-action="inbox"
              aria-label="Back to Messages">‹</button>

            <div class="cma-chat-person">
              ${avatar(item.avatar, item.name)}
              <div>
                <div class="cma-chat-person-name">
                  ${esc(item.name)}
                </div>
                <div class="cma-chat-status">Offline</div>
              </div>
            </div>
          </header>

          <div class="cma-chat-messages" id="cmaChatMessages">
            <div class="cma-msg-empty">Loading messages...</div>
          </div>

          <form class="cma-chat-form" id="cmaChatForm">
            <input class="cma-chat-input"
              id="cmaChatInput"
              type="text"
              maxlength="5000"
              autocomplete="off"
              placeholder="Write a message...">

            <button class="cma-chat-send"
              type="submit"
              aria-label="Send">➤</button>
          </form>

        </div>
      </div>
    `;

    try {
      const messages = await loadMessages(item.id);

      if (activeConversation?.id !== item.id) return;

      const box = rootElement.querySelector("#cmaChatMessages");

      if (!box) return;

      box.innerHTML = messages.length
        ? renderMessageList(messages)
        : `<div class="cma-msg-empty">Start your conversation.</div>`;

      box.scrollTop = box.scrollHeight;

      subscribeToMessages(item.id);

    } catch (error) {
      console.error("Message loading error:", error);
      notify(error.message || "Could not load messages.", "error");
    }
  }

  function subscribeToMessages(conversationId) {
    if (activeChannel) {
      db.removeChannel(activeChannel);
      activeChannel = null;
    }

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

          const box = root()?.querySelector("#cmaChatMessages");
          if (!box) return;

          try {
            const messages = await loadMessages(conversationId);
            box.innerHTML = messages.length
              ? renderMessageList(messages)
              : `<div class="cma-msg-empty">Start your conversation.</div>`;

            box.scrollTop = box.scrollHeight;
          } catch (error) {
            console.error("Realtime message refresh error:", error);
          }
        }
      )
      .subscribe();
  }

  async function sendMessage(event) {
    event.preventDefault();

    const input = root()?.querySelector("#cmaChatInput");
    const button = root()?.querySelector(".cma-chat-send");

    const content = input?.value.trim();

    if (!content || !activeConversation || loading) return;

    loading = true;
    if (button) button.disabled = true;

    try {
      const user = await getUser();

      const { error } = await db
        .from("cma_messages")
        .insert({
          conversation_id: activeConversation.id,
          sender_id: user.id,
          message_type: "text",
          content: content
        });

      if (error) throw error;

      if (input) input.value = "";

      const { error: updateError } = await db
        .from("cma_conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", activeConversation.id);

      if (updateError) {
        console.warn("Conversation time update:", updateError.message);
      }

      const messages = await loadMessages(activeConversation.id);
      const box = root()?.querySelector("#cmaChatMessages");

      if (box) {
        box.innerHTML = renderMessageList(messages);
        box.scrollTop = box.scrollHeight;
      }

    } catch (error) {
      console.error("Send message error:", error);
      notify(error.message || "Message could not be sent.", "error");
    } finally {
      loading = false;

      const nextButton = root()?.querySelector(".cma-chat-send");
      if (nextButton) nextButton.disabled = false;
    }
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
          lastTime: new Date().toISOString()
        });
      }

      await openConversation(conversationId);

    } catch (error) {
      console.error("Open direct conversation error:", error);
      notify(error.message || "Could not open conversation.", "error");
    }
  }

  function bindEvents(rootElement) {
    if (rootElement.dataset.cmaMessagingBound === "true") return;

    rootElement.dataset.cmaMessagingBound = "true";

    rootElement.addEventListener("click", async event => {
      const button = event.target.closest("[data-msg-action]");
      if (!button) return;

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
    });

    rootElement.addEventListener("submit", event => {
      if (event.target.id === "cmaChatForm") {
        sendMessage(event);
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
    activeConversation = null;
  }

  async function showInbox() {
    const rootElement = root();
    if (!rootElement) return;

    styles();
    bindEvents(rootElement);

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
