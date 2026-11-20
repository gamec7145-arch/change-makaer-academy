
/* ==========================================
   CHANGE MAKER ACADEMY
   COMMUNITY NOTIFICATIONS
   ========================================== */

(function () {
    "use strict";

    const Core = window.CMACommunityCore;

    if (!Core?.db) {
        console.error("Community Core unavailable.");
        return;
    }

    const db = Core.db;

    let currentUser = null;
    let loading = false;

    const escapeHTML = Core.escapeHTML;

    function notice(message, type = "info") {
        Core.showNotice(message, type);
    }

    function getMessage(item, senderName) {
        const name = escapeHTML(senderName || "A member");

        const messages = {
            reaction: `${name} reacted to your post.`,
            comment: `${name} commented on your post.`,
            reply: `${name} replied to a comment.`,
            friend_request: `${name} sent you a friend request.`,
            friend_accept: `${name} accepted your friend request.`
        };

        return messages[item.notification_type] ||
            "You have a new notification.";
    }

    function getIcon(type) {
        const icons = {
            reaction: "❤️",
            comment: "💬",
            reply: "↩️",
            friend_request: "👤",
            friend_accept: "🤝"
        };

        return icons[type] || "🔔";
    }

    function formatDate(date) {
        if (Core.formatRelativeTime) {
            return Core.formatRelativeTime(date);
        }

        return new Date(date).toLocaleString();
    }

    function styles() {
        return `
        <style>
        .cma-notifications-page {
            padding: 16px;
            color: #fff;
        }

        .cma-notifications-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
            margin-bottom: 18px;
        }

        .cma-notifications-header h2 {
            font-size: 21px;
            margin: 0;
        }

        .cma-notifications-read-all {
            background: transparent;
            border: 0;
            color: #7DB1FF;
            font-size: 12px;
            cursor: pointer;
        }

        .cma-notification-item {
            display: flex;
            gap: 12px;
            align-items: flex-start;
            padding: 14px 0;
            border-bottom: 1px solid #1F3263;
            cursor: pointer;
        }

        .cma-notification-item.unread {
            background: rgba(59,130,246, .07);
        }

        .cma-notification-icon {
            width: 42px;
            height: 42px;
            flex-shrink: 0;
            border-radius: 50%;
            display: grid;
            place-items: center;
            background: #0F1D3F;
            font-size: 18px;
        }

        .cma-notification-content {
            min-width: 0;
            flex: 1;
        }

        .cma-notification-content p {
            margin: 2px 0 6px;
            font-size: 14px;
            line-height: 1.5;
        }

        .cma-notification-time {
            color: #9FB0D0;
            font-size: 11px;
        }

        .cma-notification-unread-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #3B82F6;
            margin-top: 7px;
            flex-shrink: 0;
        }

        .cma-notifications-empty {
            text-align: center;
            color: #9FB0D0;
            padding: 35px 10px;
            font-size: 13px;
        }

        .cma-notifications-error {
            color: #ffaaaa;
            font-size: 13px;
            padding: 15px 0;
        }

        .cma-notification-sender {
            border: 0;
            background: transparent;
            color: #7DB1FF;
            padding: 0;
            font: inherit;
            font-weight: 700;
            cursor: pointer;
        }
        </style>
        `;
    }

    async function loadNotifications(root) {
        if (loading) return;

        loading = true;

        const list = root.querySelector(
            "#cmaNotificationsList"
        );

        const count = root.querySelector(
            "#cmaNotificationsCount"
        );

        if (!list) {
            loading = false;
            return;
        }

        list.innerHTML =
            `<p class="cma-notifications-empty">Loading notifications...</p>`;

        try {
            const { data, error } = await db
                .from("cma_community_notifications")
                .select(
                    "id,recipient_id,sender_id,post_id,target_user_id,notification_type,is_read,created_at"
                )
                .eq("recipient_id", currentUser.id)
                .order("created_at", { ascending: false })
                .limit(100);

            if (error) throw error;

            const notifications = data || [];

            const unread = notifications.filter(
                item => !item.is_read
            ).length;

            if (count) {
                count.textContent = unread
                    ? `${unread} unread`
                    : "All caught up";
            }

            if (!notifications.length) {
                list.innerHTML = `
                    <div class="cma-notifications-empty">
                        <div style="font-size:32px;margin-bottom:10px">
                            🔔
                        </div>
                        You have no notifications yet.
                    </div>
                `;
                loading = false;
                return;
            }

            const senderIds = [
                ...new Set(
                    notifications
                        .map(item => item.sender_id)
                        .filter(Boolean)
                )
            ];

            let profileMap = {};

            if (senderIds.length) {
                const { data: profiles, error: profileError } =
                    await db
                        .from("cma_community_profiles")
                        .select("user_id,full_name,avatar_url")
                        .in("user_id", senderIds);

                if (profileError) {
                    console.error(
                        "Notification profile error:",
                        profileError
                    );
                }

                (profiles || []).forEach(profile => {
                    profileMap[profile.user_id] = profile;
                });
            }

            list.innerHTML = notifications.map(item => {
                const sender = profileMap[item.sender_id];

                const senderName = sender?.full_name ||
                    "A community member";

                const message = getMessage(item, senderName);

                const senderButton = item.sender_id
                    ? `
                        <button
                            type="button"
                            class="cma-notification-sender"
                            data-notification-profile="${escapeHTML(item.sender_id)}"
                        >
                            ${escapeHTML(senderName)}
                        </button>
                    `
                    : escapeHTML(senderName);

                const finalMessage = message.replace(
                    escapeHTML(senderName),
                    senderButton
                );

                return `
                    <article
                        class="cma-notification-item ${
                            item.is_read ? "" : "unread"
                        }"
                        data-notification-id="${escapeHTML(item.id)}"
                        data-notification-type="${escapeHTML(item.notification_type)}"
                        data-notification-post="${escapeHTML(item.post_id || "")}"
                    >
                        <div class="cma-notification-icon">
                            ${getIcon(item.notification_type)}
                        </div>

                        <div class="cma-notification-content">
                            <p>${finalMessage}</p>

                            <span class="cma-notification-time">
                                ${escapeHTML(formatDate(item.created_at))}
                            </span>
                        </div>

                        ${
                            item.is_read
                            ? ""
                            : `<span class="cma-notification-unread-dot"></span>`
                        }
                    </article>
                `;
            }).join("");

        } catch (error) {
            console.error("Notifications loading:", error);

            list.innerHTML = `
                <p class="cma-notifications-error">
                    Notifications could not be loaded.
                    Please refresh and try again.
                </p>
            `;
        }

        loading = false;
    }

    async function markRead(notificationId) {
        const { error } = await db
            .from("cma_community_notifications")
            .update({ is_read: true })
            .eq("id", notificationId)
            .eq("recipient_id", currentUser.id);

        if (error) {
            console.error("Mark notification read:", error);
            return false;
        }

        return true;
    }

    async function markAllRead(root) {
        const button = root.querySelector(
            "#cmaNotificationsReadAll"
        );

        if (button) button.disabled = true;

        const { error } = await db
            .from("cma_community_notifications")
            .update({ is_read: true })
            .eq("recipient_id", currentUser.id)
            .eq("is_read", false);

        if (error) {
            console.error("Mark all read:", error);
            notice("Could not update notifications.", "error");
        } else {
            notice("All notifications marked as read.", "success");
        }

        await loadNotifications(root);

        if (button) button.disabled = false;
    }

    function navigateForNotification(type, postId) {
        if (
            type === "friend_request" ||
            type === "friend_accept"
        ) {
            window.dispatchEvent(
                new CustomEvent("cma:navigate", {
                    detail: { page: "friends" }
                })
            );
            return;
        }

        window.dispatchEvent(
            new CustomEvent("cma:navigate", {
                detail: { page: "home" }
            })
        );

        if (postId) {
            window.dispatchEvent(
                new CustomEvent("cma:open-post-comments", {
                    detail: { postId }
                })
            );
        }
    }

    function bindEvents(root) {
        if (root.dataset.cmaNotificationsBound === "true") {
            return;
        }

        root.dataset.cmaNotificationsBound = "true";

        root.addEventListener("click", async event => {
            const profileButton = event.target.closest(
                "[data-notification-profile]"
            );

            if (profileButton) {
                event.stopPropagation();

                const userId =
                    profileButton.dataset.notificationProfile;

                window.dispatchEvent(
                    new CustomEvent("cma:navigate", {
                        detail: {
                            page: "profile",
                            userId
                        }
                    })
                );

                return;
            }

            if (
                event.target.closest("#cmaNotificationsReadAll")
            ) {
                await markAllRead(root);
                return;
            }

            const item = event.target.closest(
                "[data-notification-id]"
            );

            if (!item) return;

            const id = item.dataset.notificationId;
            const type = item.dataset.notificationType;
            const postId = item.dataset.notificationPost;

            if (item.classList.contains("unread")) {
                await markRead(id);
            }

            navigateForNotification(type, postId);
        });
    }

    async function render(root) {
        root = root || Core.getRoot();

        if (!root) return;

        const session = await Core.loadSession();
        currentUser = session?.user || null;

        if (!currentUser) {
            root.innerHTML = `
                <main class="cma-community">
                    <div class="cma-notifications-page">
                        Please log in to view notifications.
                    </div>
                </main>
            `;
            return;
        }

        root.innerHTML = `
            <main class="cma-community">
                ${styles()}

                <section class="cma-notifications-page">
                    <div class="cma-notifications-header">
                        <div>
                            <h2>Notifications</h2>
                            <div
                                id="cmaNotificationsCount"
                                class="cma-notification-time"
                            ></div>
                        </div>

                        <button
                            type="button"
                            id="cmaNotificationsReadAll"
                            class="cma-notifications-read-all"
                        >
                            Mark all as read
                        </button>
                    </div>

                    <div id="cmaNotificationsList"></div>
                </section>
            </main>
        `;

        bindEvents(root);
        await loadNotifications(root);
    }

    window.CMACommunityNotifications = {
        render,
        refresh: loadNotifications
    };

})();
