/* =========================================
   CHANGE MAKER ACADEMY
   COMMUNITY MESSAGES MODULE
   Inbox + personal chat (Supabase + Realtime)
========================================= */

(function () {
    "use strict";

    const Core = window.CMACommunityCore;
    const db = (Core && Core.db) || window.cmaSupabase;

    if (!Core || !db) {
        console.error("Messages: Community Core / Supabase not loaded.");
        return;
    }

    const BUCKET = Core.BUCKET || "community-media";
    const MAX_FILE = 25 * 1024 * 1024;
    const ONLINE_WINDOW_MS = 90 * 1000;
    const HEARTBEAT_MS = 45 * 1000;

    const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🔥", "👏"];
    const EMOJIS = [
        "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "🙂", "😉", "😊", "😍",
        "😘", "😎", "🤩", "🥳", "😇", "🤔", "😐", "😴", "😢", "😭", "😡", "🤯",
        "👍", "👎", "👏", "🙌", "🙏", "💪", "🤝", "👋", "❤️", "💚", "💙", "🔥",
        "✨", "🎉", "💯", "✅", "❌", "⭐", "🌙", "☀️", "🌹", "🎁", "📚", "💡"
    ];

    const S = {
        me: null,
        profiles: {},
        settings: {},
        online: new Set(),
        lastSeen: {},
        unread: 0,
        started: false,
        presenceCh: null,
        messageCh: null,
        inbox: null,   // active inbox view
        chat: null     // active chat view
    };

    /* ---------- helpers ---------- */

    function esc(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function notify(message, type) {
        if (Core.showNotice) Core.showNotice(message, type || "info");
        else console.log(message);
    }

    function getRoot() {
        return Core.getRoot
            ? Core.getRoot()
            : document.getElementById("pageContent");
    }

    function navigate(page, userId) {
        window.dispatchEvent(new CustomEvent("cma:navigate", {
            detail: { page, userId: userId || null }
        }));
    }

    const pad = n => String(n).padStart(2, "0");
    const hm = d => pad(d.getHours()) + ":" + pad(d.getMinutes());
    const dayStart = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());

    function dayDiff(iso) {
        return Math.round((dayStart(new Date()) - dayStart(new Date(iso))) / 864e5);
    }

    function listTime(iso) {
        const d = new Date(iso);
        const diff = dayDiff(iso);
        if (diff <= 0) return hm(d);
        if (diff === 1) return "Yesterday";
        if (diff < 7) return d.toLocaleDateString(undefined, { weekday: "short" });
        return d.toLocaleDateString();
    }

    function keyFor(a, b) {
        return [a, b].sort().join("_");
    }

    function isOnline(userId) {
        if (S.online.has(userId)) return true;
        const seen = S.lastSeen[userId];
        return !!seen && Date.now() - new Date(seen).getTime() < ONLINE_WINDOW_MS;
    }

    function lastSeenText(userId) {
        if (isOnline(userId)) return "Online";
        const seen = S.lastSeen[userId];
        if (!seen) return "Offline";
        const diff = dayDiff(seen);
        if (diff <= 0) return "Last seen " + hm(new Date(seen));
        if (diff === 1) return "Last seen yesterday";
        return "Last seen " + new Date(seen).toLocaleDateString();
    }

    function displayName(userId) {
        const nick = S.settings[userId]?.partner_nickname;
        return nick || S.profiles[userId]?.full_name || "Community Member";
    }

    function preview(m) {
        if (!m) return "";
        if (m.attachment_url) {
            if (m.attachment_type === "image") return "📷 Photo";
            if (m.attachment_type === "video") return "🎥 Video";
            return "📎 " + (m.attachment_name || "File");
        }
        return m.body || "";
    }

    const ICONS = {
        back: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>',
        search: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
        phone: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/></svg>',
        video: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>',
        dots: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>',
        clip: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.4 11-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5"/></svg>',
        smile: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01M15 9h.01"/></svg>',
        send: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M2.5 20.5 22 12 2.5 3.5l.01 6.6L16 12 2.5 13.9z"/></svg>',
        palette: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2a10 10 0 0 0 0 20 2 2 0 0 0 1.5-3.3 2 2 0 0 1 1.5-3.3H17a5 5 0 0 0 5-5C22 6 17.5 2 12 2Z"/></svg>',
        pencil: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>',
        file: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg>'
    };

    function tick(m, mine) {
        if (!mine) return "";
        const one = '<path d="M4 12.5 9 17.5 20 6.5"/>';
        const two = '<path d="M1.5 12.5 6.5 17.5 17.5 6.5"/><path d="M10 16l1.5 1.5L22.5 6.5"/>';
        let cls = "cma-msg-tick";
        let inner = one;
        if (m.seen_at) { cls += " seen"; inner = two; }
        else if (m.delivered_at) { inner = two; }
        else if (m.pending) { cls += " pending"; }
        return '<svg class="' + cls + '" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + inner + "</svg>";
    }

    function avatarHTML(userId, size) {
        const p = S.profiles[userId] || {};
        const name = displayName(userId);
        const initial = esc(name.trim().charAt(0).toUpperCase() || "M");
        const inner = p.avatar_url
            ? '<img src="' + esc(p.avatar_url) + '" alt="" loading="lazy">'
            : "<span>" + initial + "</span>";

        return (
            '<div class="cma-msg-av" style="width:' + size + "px;height:" + size + 'px">' +
            inner +
            '<i class="cma-msg-dot" data-cma-dot="' + esc(userId) + '"' +
            (isOnline(userId) ? "" : " hidden") + "></i></div>"
        );
    }

    function refreshStatus() {
        document.querySelectorAll("[data-cma-dot]").forEach(el => {
            el.hidden = !isOnline(el.dataset.cmaDot);
        });

        document.querySelectorAll("[data-cma-status]").forEach(el => {
            const id = el.dataset.cmaStatus;
            const online = isOnline(id);
            el.classList.toggle("online", online);
            el.textContent = el.dataset.cmaStatusMode === "full"
                ? lastSeenText(id)
                : (online ? "Online" : "Offline");
        });
    }

    /* ---------- data loading ---------- */

    async function getMe() {
        if (S.me) return S.me;

        let user = Core.getCurrentUser ? Core.getCurrentUser() : null;

        if (!user) {
            try {
                const { data } = await db.auth.getUser();
                user = data?.user || null;
            } catch (e) { /* ignore */ }
        }

        S.me = user;
        return user;
    }

    async function loadProfiles(ids) {
        const need = [...new Set(ids.filter(id => id && !S.profiles[id]))];
        if (!need.length) return;

        const { data, error } = await db
            .from("cma_community_profiles")
            .select("user_id, full_name, avatar_url")
            .in("user_id", need);

        if (error) console.error("Messages profiles:", error);
        (data || []).forEach(p => { S.profiles[p.user_id] = p; });
    }

    async function loadSettings() {
        const { data, error } = await db
            .from("cma_chat_settings")
            .select("*")
            .eq("owner_id", S.me.id);

        if (error) console.error("Messages settings:", error);
        (data || []).forEach(s => { S.settings[s.partner_id] = s; });
    }

    async function saveSettings(partnerId, patch) {
        const row = Object.assign({}, S.settings[partnerId], patch, {
            owner_id: S.me.id,
            partner_id: partnerId,
            updated_at: new Date().toISOString()
        });

        const { data, error } = await db
            .from("cma_chat_settings")
            .upsert(row, { onConflict: "owner_id,partner_id" })
            .select()
            .single();

        if (error) throw error;
        S.settings[partnerId] = data;
        return data;
    }

    async function loadLastSeen(ids) {
        if (!ids.length) return;

        const { data } = await db
            .from("cma_user_presence")
            .select("user_id, last_seen")
            .in("user_id", ids);

        (data || []).forEach(r => { S.lastSeen[r.user_id] = r.last_seen; });
    }

    async function markDelivered() {
        await db
            .from("cma_messages")
            .update({ delivered_at: new Date().toISOString() })
            .eq("receiver_id", S.me.id)
            .is("delivered_at", null);
    }

    async function markSeen(partnerId) {
        const now = new Date().toISOString();

        await markDelivered();
        const { error } = await db
            .from("cma_messages")
            .update({ seen_at: now })
            .eq("receiver_id", S.me.id)
            .eq("sender_id", partnerId)
            .is("seen_at", null);

        if (error) console.error("Mark seen:", error);
        refreshUnread();
    }

    async function refreshUnread() {
        if (!S.me) return;

        const { count } = await db
            .from("cma_messages")
            .select("id", { count: "exact", head: true })
            .eq("receiver_id", S.me.id)
            .is("seen_at", null);

        S.unread = count || 0;

        document.querySelectorAll("[data-cma-msg-badge]").forEach(el => {
            el.textContent = S.unread > 99 ? "99+" : String(S.unread);
            el.hidden = !S.unread;
        });

        window.dispatchEvent(new CustomEvent("cma:unread", {
            detail: { count: S.unread }
        }));
    }

    /* ---------- presence + realtime ---------- */

    function heartbeat() {
        if (!S.me) return;
        db.from("cma_user_presence")
            .upsert({ user_id: S.me.id, last_seen: new Date().toISOString() },
                { onConflict: "user_id" })
            .then(() => { }, () => { });
    }

    function startRealtime() {
        S.presenceCh = db.channel("cma-presence", {
            config: { presence: { key: S.me.id } }
        });

        S.presenceCh
            .on("presence", { event: "sync" }, () => {
                S.online = new Set(Object.keys(S.presenceCh.presenceState()));
                refreshStatus();
            })
            .subscribe(status => {
                if (status === "SUBSCRIBED") {
                    S.presenceCh.track({ at: Date.now() });
                }
            });

        S.messageCh = db.channel("cma-messages-" + S.me.id);

        S.messageCh
            .on("postgres_changes",
                { event: "*", schema: "public", table: "cma_messages" },
                onMessageChange)
            .subscribe();

        heartbeat();
        setInterval(heartbeat, HEARTBEAT_MS);

        document.addEventListener("visibilitychange", () => {
            heartbeat();
            if (!document.hidden && chatLive()) markSeen(S.chat.partnerId);
        });
        window.addEventListener("pagehide", heartbeat);
    }

    function onMessageChange(payload) {
        const row = payload.new;
        if (!row || !row.id || !S.me) return;
        if (row.sender_id !== S.me.id && row.receiver_id !== S.me.id) return;

        const incoming = row.receiver_id === S.me.id;

        if (payload.eventType === "INSERT" && incoming) {
            markDelivered();
        }

        if (chatLive() && row.conversation_key === S.chat.key) {
            upsertMessage(S.chat, row);

            if (payload.eventType === "INSERT" && incoming && !document.hidden) {
                markSeen(S.chat.partnerId);
            }

            renderMessages(S.chat);
        }

        if (inboxLive()) scheduleInboxReload();
        refreshUnread();
    }

    function upsertMessage(chat, row) {
        const i = chat.msgs.findIndex(m => m.id === row.id);
        if (i >= 0) chat.msgs[i] = row;
        else chat.msgs.push(row);
        chat.msgs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }

    let inboxTimer = null;
    function scheduleInboxReload() {
        clearTimeout(inboxTimer);
        inboxTimer = setTimeout(() => {
            if (inboxLive()) loadInboxData(S.inbox);
        }, 250);
    }

    const inboxLive = () => !!(S.inbox && document.body.contains(S.inbox.el));
    const chatLive = () => !!(S.chat && document.body.contains(S.chat.el));

    /* ---------- styles ---------- */

    function ensureStyles() {
        if (document.getElementById("cma-messages-styles")) return;

        const style = document.createElement("style");
        style.id = "cma-messages-styles";
        style.textContent = `
.cma-msg-page{position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;background:#04111d;color:#fff;font-family:inherit;overflow:hidden}
.cma-msg-page *{box-sizing:border-box}
.cma-msg-page button{font:inherit;color:inherit;cursor:pointer;border:0;background:none;touch-action:manipulation}
.cma-msg-top{display:flex;align-items:center;gap:12px;padding:calc(env(safe-area-inset-top,0px) + 14px) 16px 10px}
.cma-msg-iconbtn{width:42px;height:42px;display:flex;align-items:center;justify-content:center;border-radius:14px;flex:none}
.cma-msg-iconbtn.box{background:rgba(255,255,255,.05);border:1px solid rgba(8,201,154,.2)}
.cma-msg-title{flex:1;margin:0;font-size:26px;font-weight:700;background:linear-gradient(90deg,#fff 40%,#08C99A);-webkit-background-clip:text;background-clip:text;color:transparent}
.cma-msg-searchbar{margin:6px 16px 12px;display:flex;align-items:center;gap:10px;padding:0 16px;height:48px;border-radius:24px;border:1px solid rgba(8,201,154,.25);background:rgba(255,255,255,.04)}
.cma-msg-searchbar input{flex:1;min-width:0;background:none;border:0;outline:0;color:#fff;font-size:16px}
.cma-msg-searchbar input::placeholder{color:#7fb2c2}
.cma-msg-list{flex:1;overflow-y:auto;padding:0 16px calc(env(safe-area-inset-bottom,0px) + 16px);display:flex;flex-direction:column;gap:10px}
.cma-msg-item{display:flex;align-items:center;gap:14px;width:100%;text-align:left;padding:12px 14px;border-radius:20px;background:rgba(255,255,255,.045)}
.cma-msg-item:active{background:rgba(8,201,154,.12)}
.cma-msg-av{position:relative;flex:none;border-radius:50%;background:#103E4C;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:20px}
.cma-msg-av img{width:100%;height:100%;object-fit:cover;border-radius:50%}
.cma-msg-dot{position:absolute;right:0;bottom:0;width:14px;height:14px;border-radius:50%;background:#08C99A;border:2px solid #04111d}
.cma-msg-dot[hidden]{display:none}
.cma-msg-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.cma-msg-name{font-weight:700;font-size:17px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cma-msg-status{font-size:12px;color:#fff}
.cma-msg-status.online{color:#08C99A}
.cma-msg-last{font-size:14px;color:#7fd9e6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cma-msg-side{display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex:none;font-size:13px;color:#8fc3cf}
.cma-msg-count{min-width:24px;height:24px;padding:0 7px;border-radius:12px;background:#08C99A;color:#04111d;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center}
.cma-msg-empty{margin:40px 0;text-align:center;color:#7fb2c2}
.cma-msg-tick{color:#8fa9b3}
.cma-msg-tick.seen{color:#34b7f1}
.cma-msg-tick.pending{opacity:.5}

.cma-chat-top{display:flex;align-items:center;gap:10px;padding:calc(env(safe-area-inset-top,0px) + 10px) 12px 10px;background:rgba(4,17,29,.88);backdrop-filter:blur(8px);border-bottom:1px solid rgba(255,255,255,.06);position:relative;z-index:3}
.cma-chat-who{flex:1;min-width:0;display:flex;align-items:center;gap:10px}
.cma-chat-name{font-weight:700;font-size:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cma-chat-menu{position:absolute;right:12px;top:calc(env(safe-area-inset-top,0px) + 64px);z-index:10;min-width:210px;padding:8px;border-radius:16px;background:#0b2230;border:1px solid rgba(8,201,154,.3);box-shadow:0 10px 30px rgba(0,0,0,.5)}
.cma-chat-menu button{display:flex;align-items:center;gap:14px;width:100%;padding:12px;border-radius:10px;text-align:left;font-size:15px}
.cma-chat-menu button:active{background:rgba(8,201,154,.15)}
.cma-chat-menu[hidden]{display:none}
.cma-chat-body{position:relative;flex:1;display:flex;flex-direction:column;min-height:0;background-size:cover;background-position:center}
.cma-chat-body.has-theme::before{content:"";position:absolute;inset:0;background:rgba(4,17,29,.35);pointer-events:none}
.cma-chat-scroll{position:relative;flex:1;overflow-y:auto;padding:14px 12px;display:flex;flex-direction:column;gap:6px}
.cma-bub-wrap{display:flex;flex-direction:column;max-width:80%}
.cma-bub-wrap.mine{align-self:flex-end;align-items:flex-end}
.cma-bub-wrap.theirs{align-self:flex-start;align-items:flex-start}
.cma-bub-nick{font-size:11px;color:#9fd8e4;margin:0 6px 2px}
.cma-bub{position:relative;padding:9px 12px 7px;border-radius:16px;background:rgba(18,36,50,.92);font-size:16px;line-height:1.35;word-break:break-word;white-space:pre-wrap;user-select:none;-webkit-user-select:none}
.cma-bub-wrap.mine .cma-bub{background:#0a6b52;border-bottom-right-radius:5px}
.cma-bub-wrap.theirs .cma-bub{border-bottom-left-radius:5px}
.cma-bub.media{padding:5px}
.cma-bub img,.cma-bub video{display:block;max-width:100%;max-height:300px;border-radius:12px}
.cma-bub-meta{display:flex;align-items:center;justify-content:flex-end;gap:4px;margin-top:3px;font-size:11px;color:#a9c3cc;white-space:normal}
.cma-bub.media .cma-bub-meta{padding:0 6px 2px}
.cma-bub-file{display:flex;align-items:center;gap:10px;color:inherit;text-decoration:none;padding:4px 2px}
.cma-bub-file span{word-break:break-all;font-size:14px}
.cma-bub-react{position:absolute;bottom:-12px;right:10px;font-size:15px;padding:1px 6px;border-radius:12px;background:#0b2230;border:1px solid rgba(8,201,154,.4)}
.cma-bub-wrap.theirs .cma-bub-react{right:auto;left:10px}
.cma-bub-wrap.has-react{margin-bottom:10px}
.cma-seenchip{align-self:flex-end;margin:2px 4px;padding:6px 12px;border-radius:14px;font-size:12px;background:rgba(10,34,48,.9);border:1px solid rgba(8,201,154,.25)}
.cma-chat-compose{position:relative;z-index:3;display:flex;align-items:center;gap:8px;padding:10px 12px calc(env(safe-area-inset-bottom,0px) + 10px);background:rgba(4,17,29,.88)}
.cma-chat-inputwrap{flex:1;min-width:0;display:flex;align-items:center;gap:4px;height:50px;padding:0 8px 0 14px;border-radius:26px;background:rgba(255,255,255,.07);border:1px solid rgba(8,201,154,.25)}
.cma-chat-inputwrap input{flex:1;min-width:0;background:none;border:0;outline:0;color:#fff;font-size:16px}
.cma-chat-send{width:50px;height:50px;border-radius:50%;background:#08C99A;color:#04111d;display:flex;align-items:center;justify-content:center;flex:none}
.cma-chat-emoji{position:relative;z-index:3;display:grid;grid-template-columns:repeat(8,1fr);gap:2px;padding:8px 12px;background:#0b2230;border-top:1px solid rgba(255,255,255,.06);max-height:170px;overflow-y:auto}
.cma-chat-emoji[hidden]{display:none}
.cma-chat-emoji button{font-size:24px;padding:6px 0}
.cma-modal-bg{position:fixed;inset:0;z-index:100;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:20px}
.cma-modal{width:100%;max-width:380px;padding:20px;border-radius:20px;background:#0b2230;border:1px solid rgba(8,201,154,.3);color:#fff}
.cma-modal h3{margin:0 0 14px;font-size:18px}
.cma-modal label{display:block;margin:10px 0 6px;font-size:13px;color:#9fd8e4}
.cma-modal input{width:100%;height:46px;padding:0 14px;border-radius:12px;border:1px solid rgba(8,201,154,.3);background:rgba(255,255,255,.06);color:#fff;font-size:16px;outline:0}
.cma-modal-actions{display:flex;gap:10px;margin-top:18px}
.cma-modal-actions button{flex:1;height:44px;border-radius:12px;background:rgba(255,255,255,.08);color:#fff;border:0;font:inherit;cursor:pointer}
.cma-modal-actions button.primary{background:#08C99A;color:#04111d;font-weight:700}
.cma-react-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.cma-react-grid button{font-size:28px;height:56px;border-radius:14px;background:rgba(255,255,255,.06);border:2px solid transparent;cursor:pointer}
.cma-react-grid button.active{border-color:#08C99A;background:rgba(8,201,154,.15)}
`;
        document.head.appendChild(style);
    }

    function mount(root, html) {
        root.innerHTML = html;
        // This page has its own header: remove any other top bar
        setTimeout(() => {
            root.querySelectorAll("[data-cma-topbar]").forEach(el => el.remove());
        }, 50);
        return root.querySelector(".cma-msg-page");
    }

    function modal(html) {
        const bg = document.createElement("div");
        bg.className = "cma-modal-bg";
        bg.innerHTML = '<div class="cma-modal">' + html + "</div>";
        bg.addEventListener("click", e => { if (e.target === bg) bg.remove(); });
        document.body.appendChild(bg);
        return bg;
    }

    /* ---------- INBOX ---------- */

    async function renderInbox(root) {
        root = root || getRoot();
        if (!root) return;

        const me = await getMe();

        if (!me) {
            notify("Please log in to use messages.", "error");
            return;
        }

        ensureStyles();
        S.chat = null;

        const el = mount(root, `
            <main class="cma-msg-page cma-msg-inbox">
                <header class="cma-msg-top">
                    <button class="cma-msg-iconbtn" data-act="back" aria-label="Back">${ICONS.back}</button>
                    <h1 class="cma-msg-title">Messages</h1>
                    <button class="cma-msg-iconbtn box" data-act="search" aria-label="Search">${ICONS.search}</button>
                </header>
                <div class="cma-msg-searchbar">
                    ${ICONS.search}
                    <input type="search" placeholder="Search conversations..." autocomplete="off" maxlength="60">
                </div>
                <section class="cma-msg-list"><p class="cma-msg-empty">Loading...</p></section>
            </main>
        `);

        const view = S.inbox = { el, convs: [], query: "" };
        const input = el.querySelector("input");

        el.addEventListener("click", e => {
            const act = e.target.closest("[data-act]");
            if (act) {
                if (act.dataset.act === "back") navigate("home");
                if (act.dataset.act === "search") input.focus();
                return;
            }

            const item = e.target.closest("[data-open-chat]");
            if (item) renderChat(root, item.dataset.openChat);
        });

        input.addEventListener("input", () => {
            view.query = input.value.trim().toLowerCase();
            paintInbox(view);
        });

        await loadInboxData(view);
    }

    async function loadInboxData(view) {
        const { data, error } = await db
            .from("cma_messages")
            .select("*")
            .or("sender_id.eq." + S.me.id + ",receiver_id.eq." + S.me.id)
            .order("created_at", { ascending: false })
            .limit(1000);

        if (error) {
            console.error("Inbox load:", error);
            view.el.querySelector(".cma-msg-list").innerHTML =
                '<p class="cma-msg-empty">Unable to load messages.</p>';
            return;
        }

        const map = new Map();

        (data || []).forEach(m => {
            const partner = m.sender_id === S.me.id ? m.receiver_id : m.sender_id;
            let c = map.get(partner);

            if (!c) {
                c = { partnerId: partner, last: m, unread: 0 };
                map.set(partner, c);
            }

            if (m.receiver_id === S.me.id && !m.seen_at) c.unread++;
        });

        view.convs = [...map.values()];
        const ids = view.convs.map(c => c.partnerId);

        await Promise.all([loadProfiles(ids), loadSettings(), loadLastSeen(ids)]);

        if (!document.body.contains(view.el)) return;
        paintInbox(view);
        markDelivered();
    }

    function paintInbox(view) {
        const list = view.el.querySelector(".cma-msg-list");
        const q = view.query;

        const rows = view.convs.filter(c => {
            if (!q) return true;
            const p = S.profiles[c.partnerId]?.full_name || "";
            return (displayName(c.partnerId) + " " + p).toLowerCase().includes(q);
        });

        if (!rows.length) {
            list.innerHTML = '<p class="cma-msg-empty">' +
                (q ? "No conversation found." :
                    "No conversations yet. Open a profile and tap Message.") + "</p>";
            return;
        }

        list.innerHTML = rows.map(c => {
            const mine = c.last.sender_id === S.me.id;
            const online = isOnline(c.partnerId);

            return `
                <button class="cma-msg-item" data-open-chat="${esc(c.partnerId)}">
                    ${avatarHTML(c.partnerId, 54)}
                    <div class="cma-msg-info">
                        <span class="cma-msg-name">${esc(displayName(c.partnerId))}</span>
                        <span class="cma-msg-status${online ? " online" : ""}"
                            data-cma-status="${esc(c.partnerId)}">${online ? "Online" : "Offline"}</span>
                        <span class="cma-msg-last">${esc(preview(c.last))}</span>
                    </div>
                    <div class="cma-msg-side">
                        <span>${esc(listTime(c.last.created_at))}</span>
                        ${c.unread
                            ? '<span class="cma-msg-count">' + c.unread + "</span>"
                            : tick(c.last, mine)}
                    </div>
                </button>`;
        }).join("");
    }

    /* ---------- CHAT ---------- */

    async function renderChat(root, partnerId) {
        root = root || getRoot();
        if (!root || !partnerId) return;

        const me = await getMe();

        if (!me) {
            notify("Please log in to use messages.", "error");
            return;
        }

        if (partnerId === me.id) {
            notify("You cannot message yourself.", "info");
            return;
        }

        ensureStyles();
        S.inbox = null;

        await Promise.all([
            loadProfiles([partnerId]),
            loadSettings(),
            loadLastSeen([partnerId])
        ]);

        const key = keyFor(me.id, partnerId);
        const settings = S.settings[partnerId] || {};

        const el = mount(root, `
            <main class="cma-msg-page cma-msg-chatpage">
                <header class="cma-chat-top">
                    <button class="cma-msg-iconbtn" data-act="back" aria-label="Back">${ICONS.back}</button>
                    <div class="cma-chat-who">
                        ${avatarHTML(partnerId, 46)}
                        <div style="min-width:0">
                            <div class="cma-chat-name" data-role="name">${esc(displayName(partnerId))}</div>
                            <div class="cma-msg-status${isOnline(partnerId) ? " online" : ""}"
                                data-cma-status="${esc(partnerId)}" data-cma-status-mode="full">${esc(lastSeenText(partnerId))}</div>
                        </div>
                    </div>
                    <button class="cma-msg-iconbtn" data-act="voice" aria-label="Voice call">${ICONS.phone}</button>
                    <button class="cma-msg-iconbtn" data-act="video" aria-label="Video call">${ICONS.video}</button>
                    <button class="cma-msg-iconbtn" data-act="menu" aria-label="Menu">${ICONS.dots}</button>
                    <div class="cma-chat-menu" hidden>
                        <button data-act="theme">${ICONS.palette}<span>Change Theme</span></button>
                        <button data-act="nick">${ICONS.pencil}<span>Set Nicknames</span></button>
                        <button data-act="reaction">${ICONS.smile}<span>Change Reaction</span></button>
                    </div>
                </header>

                <div class="cma-chat-body" data-role="body">
                    <div class="cma-chat-scroll" data-role="scroll"></div>
                </div>

                <div class="cma-chat-emoji" hidden>
                    ${EMOJIS.map(e => '<button type="button" data-emoji="' + e + '">' + e + "</button>").join("")}
                </div>

                <footer class="cma-chat-compose">
                    <div class="cma-chat-inputwrap">
                        <input type="text" data-role="input" placeholder="Type a message..."
                            autocomplete="off" enterkeyhint="send">
                        <button class="cma-msg-iconbtn" data-act="emoji" aria-label="Emoji">${ICONS.smile}</button>
                        <button class="cma-msg-iconbtn" data-act="attach" aria-label="Attach">${ICONS.clip}</button>
                    </div>
                    <button class="cma-chat-send" data-act="send" aria-label="Send">${ICONS.send}</button>
                </footer>

                <input type="file" data-role="file" hidden
                    accept="image/*,video/*,application/pdf,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip">
                <input type="file" data-role="themefile" accept="image/*" hidden>
            </main>
        `);

        const chat = S.chat = {
            el, key, partnerId, root,
            msgs: [],
            chipFor: null,
            input: el.querySelector('[data-role="input"]')
        };

        applyTheme(chat, settings.theme_url);
        bindChat(chat);

        const { data, error } = await db
            .from("cma_messages")
            .select("*")
            .eq("conversation_key", key)
            .order("created_at", { ascending: true })
            .limit(300);

        if (error) {
            console.error("Chat load:", error);
            notify("Could not load this conversation.", "error");
        }

        chat.msgs = data || [];
        renderMessages(chat, true);

        if (!document.hidden) markSeen(partnerId);
        refreshStatus();
    }

    function applyTheme(chat, url) {
        const body = chat.el.querySelector('[data-role="body"]');
        body.classList.toggle("has-theme", !!url);
        body.style.backgroundImage = url ? 'url("' + String(url).replace(/"/g, "%22") + '")' : "";
    }

    function renderMessages(chat, forceBottom) {
        if (!document.body.contains(chat.el)) return;

        const scroll = chat.el.querySelector('[data-role="scroll"]');
        const nearBottom =
            scroll.scrollHeight - scroll.scrollTop - scroll.clientHeight < 120;

        const myNick = S.settings[chat.partnerId]?.my_nickname || "";
        const theirNick = S.settings[chat.partnerId]?.partner_nickname || "";
        const reaction = S.settings[chat.partnerId]?.reaction || "👍";

        // chip: tapped message, else the last of my messages that was seen
        let chipId = chat.chipFor;
        if (!chipId) {
            const seen = chat.msgs.filter(m => m.sender_id === S.me.id && m.seen_at);
            chipId = seen.length ? seen[seen.length - 1].id : null;
        }

        let prevSender = null;
        let html = "";

        chat.msgs.forEach(m => {
            const mine = m.sender_id === S.me.id;
            const nick = mine ? myNick : theirNick;
            const label = nick && prevSender !== m.sender_id
                ? '<div class="cma-bub-nick">' + esc(nick) + "</div>" : "";
            prevSender = m.sender_id;

            let content = "";
            let media = false;

            if (m.attachment_url) {
                const url = esc(m.attachment_url);

                if (m.attachment_type === "image") {
                    media = true;
                    content += '<a href="' + url + '" target="_blank" rel="noopener"><img src="' + url + '" alt="" loading="lazy"></a>';
                } else if (m.attachment_type === "video") {
                    media = true;
                    content += '<video src="' + url + '" controls preload="metadata" playsinline></video>';
                } else {
                    content += '<a class="cma-bub-file" href="' + url + '" target="_blank" rel="noopener">' +
                        ICONS.file + "<span>" + esc(m.attachment_name || "File") + "</span></a>";
                }
            }

            if (m.body) {
                content += (media ? '<div style="padding:6px 6px 0">' + esc(m.body) + "</div>" : esc(m.body));
            }

            html += `
                <div class="cma-bub-wrap ${mine ? "mine" : "theirs"}${m.reaction ? " has-react" : ""}">
                    ${label}
                    <div class="cma-bub${media ? " media" : ""}" data-msg="${esc(m.id)}">
                        ${content}
                        <div class="cma-bub-meta">
                            <span>${hm(new Date(m.created_at))}</span>${tick(m, mine)}
                        </div>
                        ${m.reaction ? '<span class="cma-bub-react">' + esc(m.reaction) + "</span>" : ""}
                    </div>
                </div>`;

            if (m.id === chipId && mine) {
                let text = "Sent " + hm(new Date(m.created_at));
                if (m.seen_at) text = "✓✓ Seen " + hm(new Date(m.seen_at));
                else if (m.delivered_at) text = "✓✓ Delivered " + hm(new Date(m.delivered_at));
                html += '<div class="cma-seenchip">' + esc(text) + "</div>";
            }
        });

        if (!html) {
            html = '<p class="cma-msg-empty">Say hi 👋 Double-tap a message to react with ' +
                esc(reaction) + "</p>";
        }

        scroll.innerHTML = html;
        if (forceBottom || nearBottom) scroll.scrollTop = scroll.scrollHeight;
    }

    function bindChat(chat) {
        const el = chat.el;
        const menu = el.querySelector(".cma-chat-menu");
        const emojiPanel = el.querySelector(".cma-chat-emoji");
        const fileInput = el.querySelector('[data-role="file"]');
        const themeInput = el.querySelector('[data-role="themefile"]');

        el.addEventListener("click", e => {
            const emoji = e.target.closest("[data-emoji]");

            if (emoji) {
                chat.input.value += emoji.dataset.emoji;
                chat.input.focus();
                return;
            }

            const bub = e.target.closest("[data-msg]");

            if (bub && !e.target.closest("a,video")) {
                const id = bub.dataset.msg;
                const m = chat.msgs.find(x => String(x.id) === id);

                if (m && m.sender_id === S.me.id) {
                    chat.chipFor = chat.chipFor === m.id ? null : m.id;
                    renderMessages(chat);
                }
                return;
            }

            const act = e.target.closest("[data-act]");

            if (!act) {
                menu.hidden = true;
                return;
            }

            const name = act.dataset.act;
            if (name !== "menu") menu.hidden = true;

            if (name === "back") renderInbox(chat.root);
            else if (name === "menu") menu.hidden = !menu.hidden;
            else if (name === "send") sendText(chat);
            else if (name === "emoji") emojiPanel.hidden = !emojiPanel.hidden;
            else if (name === "attach") fileInput.click();
            else if (name === "theme") themeInput.click();
            else if (name === "nick") openNicknames(chat);
            else if (name === "reaction") openReactionPicker(chat);
            else if (name === "voice" || name === "video") {
                notify("Voice and video calls are coming soon.", "info");
            }
        });

        el.addEventListener("dblclick", e => {
            const bub = e.target.closest("[data-msg]");
            if (!bub) return;

            const m = chat.msgs.find(x => String(x.id) === bub.dataset.msg);
            if (m) toggleReaction(chat, m);
        });

        chat.input.addEventListener("keydown", e => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendText(chat);
            }
        });

        fileInput.addEventListener("change", () => {
            const file = fileInput.files && fileInput.files[0];
            fileInput.value = "";
            if (file) sendFile(chat, file);
        });

        themeInput.addEventListener("change", async () => {
            const file = themeInput.files && themeInput.files[0];
            themeInput.value = "";
            if (!file) return;

            if (file.size > 10 * 1024 * 1024) {
                notify("Theme image must be under 10 MB.", "error");
                return;
            }

            try {
                const url = await upload(file, "chat-themes/" + S.me.id);
                await saveSettings(chat.partnerId, { theme_url: url });
                applyTheme(chat, url);
                notify("Chat theme updated.", "success");
            } catch (err) {
                console.error("Theme error:", err);
                notify("Could not change the theme.", "error");
            }
        });
    }

    async function upload(file, folder) {
        const ext = (file.name.split(".").pop() || "bin")
            .toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "bin";
        const path = folder + "/" + Date.now() + "-" +
            Math.random().toString(36).slice(2, 8) + "." + ext;

        const { error } = await db.storage.from(BUCKET).upload(path, file, {
            contentType: file.type || undefined,
            upsert: false
        });

        if (error) throw error;

        return db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    }

    async function insertMessage(chat, fields) {
        const temp = Object.assign({
            id: "tmp-" + Date.now() + Math.random().toString(36).slice(2, 6),
            conversation_key: chat.key,
            sender_id: S.me.id,
            receiver_id: chat.partnerId,
            created_at: new Date().toISOString(),
            delivered_at: null,
            seen_at: null,
            pending: true
        }, fields);

        chat.msgs.push(temp);
        renderMessages(chat, true);

        const { data, error } = await db
            .from("cma_messages")
            .insert(Object.assign({
                conversation_key: chat.key,
                sender_id: S.me.id,
                receiver_id: chat.partnerId
            }, fields))
            .select()
            .single();

        chat.msgs = chat.msgs.filter(m => m.id !== temp.id);

        if (error) {
            console.error("Send error:", error);
            notify("Message could not be sent.", "error");
        } else {
            upsertMessage(chat, data);
        }

        renderMessages(chat, true);
    }

    function sendText(chat) {
        const text = chat.input.value.trim();
        if (!text) return;

        chat.input.value = "";
        chat.chipFor = null;
        insertMessage(chat, { body: text.slice(0, 4000) });
    }

    async function sendFile(chat, file) {
        if (file.size > MAX_FILE) {
            notify("File must be under 25 MB.", "error");
            return;
        }

        notify("Uploading...", "info");

        try {
            const url = await upload(file, "chat/" + chat.key);
            const type = file.type.startsWith("image/") ? "image"
                : file.type.startsWith("video/") ? "video" : "file";

            chat.chipFor = null;
            await insertMessage(chat, {
                attachment_url: url,
                attachment_type: type,
                attachment_name: file.name.slice(0, 120)
            });
        } catch (err) {
            console.error("Upload error:", err);
            notify("Could not upload the file.", "error");
        }
    }

    async function toggleReaction(chat, m) {
        if (String(m.id).startsWith("tmp-")) return;

        const def = S.settings[chat.partnerId]?.reaction || "👍";
        const next = m.reaction === def ? null : def;
        const old = m.reaction;

        m.reaction = next;
        renderMessages(chat);

        const { error } = await db
            .from("cma_messages")
            .update({ reaction: next })
            .eq("id", m.id);

        if (error) {
            console.error("Reaction error:", error);
            m.reaction = old;
            renderMessages(chat);
        }
    }

    function openNicknames(chat) {
        const s = S.settings[chat.partnerId] || {};
        const realName = S.profiles[chat.partnerId]?.full_name || "them";

        const bg = modal(`
            <h3>Set Nicknames</h3>
            <label>Nickname for ${esc(realName)}</label>
            <input data-f="partner" maxlength="30" value="${esc(s.partner_nickname || "")}" placeholder="${esc(realName)}">
            <label>Your nickname</label>
            <input data-f="mine" maxlength="30" value="${esc(s.my_nickname || "")}" placeholder="You">
            <div class="cma-modal-actions">
                <button data-m="cancel">Cancel</button>
                <button class="primary" data-m="save">Save</button>
            </div>
        `);

        bg.addEventListener("click", async e => {
            const btn = e.target.closest("[data-m]");
            if (!btn) return;

            if (btn.dataset.m === "cancel") {
                bg.remove();
                return;
            }

            try {
                await saveSettings(chat.partnerId, {
                    partner_nickname: bg.querySelector('[data-f="partner"]').value.trim() || null,
                    my_nickname: bg.querySelector('[data-f="mine"]').value.trim() || null
                });

                bg.remove();

                if (chatLive()) {
                    const nameEl = chat.el.querySelector('[data-role="name"]');
                    if (nameEl) nameEl.textContent = displayName(chat.partnerId);
                    renderMessages(chat);
                }

                notify("Nicknames saved.", "success");
            } catch (err) {
                console.error("Nickname error:", err);
                notify("Could not save nicknames.", "error");
            }
        });
    }

    function openReactionPicker(chat) {
        const current = S.settings[chat.partnerId]?.reaction || "👍";

        const bg = modal(`
            <h3>Change Reaction</h3>
            <div class="cma-react-grid">
                ${REACTIONS.map(r =>
                    '<button type="button" data-r="' + r + '"' +
                    (r === current ? ' class="active"' : "") + ">" + r + "</button>"
                ).join("")}
            </div>
            <div class="cma-modal-actions"><button data-m="cancel">Close</button></div>
        `);

        bg.addEventListener("click", async e => {
            if (e.target.closest('[data-m="cancel"]')) {
                bg.remove();
                return;
            }

            const btn = e.target.closest("[data-r]");
            if (!btn) return;

            try {
                await saveSettings(chat.partnerId, { reaction: btn.dataset.r });
                bg.remove();
                renderMessages(chat);
                notify("Default reaction changed.", "success");
            } catch (err) {
                console.error("Reaction setting error:", err);
                notify("Could not change the reaction.", "error");
            }
        });
    }

    /* ---------- start-up + routing ---------- */

    async function init() {
        if (S.started) return;

        const me = await getMe();
        if (!me) return;

        S.started = true;
        startRealtime();
        markDelivered();
        refreshUnread();
    }

    function headerButtonHTML() {
        return (
            '<button class="cma-icon-button" type="button" ' +
            'data-cma-profile-action="messages" aria-label="Messages" ' +
            'style="position:relative">' +
            '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/><path d="M8 9h8M8 13h5"/></svg>' +
            '<span data-cma-msg-badge hidden style="position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:#08C99A;color:#04111d;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center">' +
            (S.unread || "") + "</span></button>"
        );
    }

    window.addEventListener("cma:navigate", event => {
        const detail = event.detail || {};

        if (detail.page !== "messages" && detail.page !== "chat") return;

        // wait one tick so the page router finishes first
        setTimeout(() => {
            if (detail.page === "chat" && detail.userId) {
                renderChat(getRoot(), detail.userId);
            } else {
                renderInbox(getRoot());
            }
        }, 30);
    });

    // Wait for the login session, then start presence + realtime
    let tries = 0;
    const waiter = setInterval(async () => {
        tries++;
        await init();
        if (S.started || tries > 20) clearInterval(waiter);
    }, 1500);

    window.CMACommunityMessages = {
        render: renderInbox,
        openChat: renderChat,
        headerButtonHTML,
        refreshUnread,
        init
    };
})();
