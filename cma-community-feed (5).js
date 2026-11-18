
/* =========================================
   CHANGE MAKER ACADEMY
   COMMUNITY FEED MODULE
   Standard Post Card + Composer + Events
   PART 1 OF 3
========================================= */

(function () {
    "use strict";

    const Core = window.CMACommunityCore;

    if (!Core || !Core.db) {
        console.error("Community Core is not loaded.");
        return;
    }

    const db = Core.db;

    const Icons = {
        home: `<svg viewBox="0 0 24 24"><path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-7h6v7"/></svg>`,
        profile: `<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>`,
        friends: `<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
        creator: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="5" rx="1.5"/><rect x="13" y="10" width="8" height="11" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/></svg>`,
        notification: `<svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>`,
        search: `<svg viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg>`,
 message: `<svg viewBox="0 0 24 24"><path d="M21 11.5a8.5 8.5 0 0 1-12.2 7.7L3 21l1.8-5.2A8.5 8.5 0 1 1 21 11.5Z"/><path d="M8 11h8M8 15h5"/></svg>`       
    };

    const Feed = {
        activePostId: null,
        activeReplyId: null,
        activeReplyName: "",
        boundCommentLayers: new WeakSet(),

        openMemberProfile(userId) {
            if (!userId) return;

            window.dispatchEvent(new CustomEvent("cma:navigate", {
                detail: {
                    page: "profile",
                    userId
                }
            }));
        },

        renderComposer() {
            return `
                <section class="cma-composer">

                    <h2 class="cma-composer-title">Create a Post</h2>

                    <div class="cma-composer-top">

                        <div id="cmaComposerAvatar" class="cma-composer-avatar">
                            <svg viewBox="0 0 24 24"
                                width="22" height="22"
                                fill="none" stroke="#FFFFFF"
                                stroke-width="1.7">
                                <circle cx="12" cy="8" r="4"/>
                                <path d="M4 21a8 8 0 0 1 16 0"/>
                            </svg>
                        </div>

                        <textarea
                            class="cma-post-input"
                            id="cmaPostInput"
                            placeholder="What's on your mind?"
                            rows="3"
                            aria-label="Write a post"></textarea>
                    </div>

                    <div class="cma-composer-bottom">

                        <button
                            type="button"
                            class="cma-photo-button"
                            data-cma-action="photo">
                            <svg viewBox="0 0 24 24"
                                width="16" height="16"
                                fill="none" stroke="currentColor"
                                stroke-width="1.8"
                                stroke-linecap="round"
                                stroke-linejoin="round">
                                <rect x="3" y="4" width="18" height="16" rx="2"/>
                                <circle cx="8.5" cy="9" r="1.5"/>
                                <path d="m21 15-5-5L5 20"/>
                            </svg>
                            <span>Add Photo</span>
                        </button>

                        <button
                            type="button"
                            class="cma-post-button"
                            data-cma-action="post">
                            Publish
                        </button>

                    </div>

                    <div
                        id="cmaSelectedPhoto"
                        class="cma-selected-photo"></div>

                </section>
            `;
        },
       async loadComposerAvatar(root) {
    const avatarBox = root?.querySelector("#cmaComposerAvatar");
    const user = Core.getCurrentUser();

    if (!avatarBox || !user) return;

    try {
        const { data, error } = await db
            .from("cma_community_profiles")
            .select("avatar_url")
            .eq("user_id", user.id)
            .maybeSingle();

        if (error) throw error;

        const avatarURL = Core.safeImageURL(data?.avatar_url);

        if (!avatarURL) return;

        const image = document.createElement("img");

        image.src = avatarURL;
        image.alt = "Profile picture";
        image.style.width = "100%";
        image.style.height = "100%";
        image.style.objectFit = "cover";
        image.style.display = "block";

        image.onerror = () => {
            image.remove();
        };

        avatarBox.innerHTML = "";
        avatarBox.appendChild(image);

    } catch (error) {
        console.error("Composer avatar loading error:", error);
    }
},
       

        async renderHome(root) {
            root = root || Core.getRoot?.();
            if (!root) return;

            root.innerHTML = `
                <main class="cma-community">

                    <header class="cma-header">
                        <a href="?" class="cma-header-title"
            style="color:inherit;text-decoration:none;"
            aria-label="Back to main page">
                            <span>Change Maker</span>
                            <span class="cma-green">Community</span>
                        </a>

                        <div style="display:flex;align-items:center;gap:10px;">
    <button class="cma-icon-button"
        type="button" data-cma-page="messaging"
        aria-label="Messages">
        ${Icons.message}
    </button>

    <button class="cma-icon-button"
        type="button" data-cma-action="search"
        aria-label="Search">
        ${Icons.search}
    </button>
</div>
                    </header>

                    <nav class="cma-navigation">

                        <button class="cma-nav-item active"
                            type="button" data-cma-page="home">
                            <span class="cma-nav-icon">${Icons.home}</span>
                            <span>Home</span>
                        </button>

                        <button class="cma-nav-item"
                            type="button" data-cma-page="profile">
                            <span class="cma-nav-icon">${Icons.profile}</span>
                            <span>Profile</span>
                        </button>

                        <button class="cma-nav-item"
                            type="button" data-cma-page="friends">
                            <span class="cma-nav-icon">${Icons.friends}</span>
                            <span>Friends</span>
                        </button>

                        <button class="cma-nav-item"
                            type="button" data-cma-page="creator">
                            <span class="cma-nav-icon">${Icons.creator}</span>
                            <span>Creator Panel</span>
                        </button>

                        <button class="cma-nav-item"
                            type="button" data-cma-page="notifications">
                            <span class="cma-nav-icon">${Icons.notification}</span>
                            <span>Notification</span>
                        </button>

                    </nav>

                    ${this.renderComposer()}

                    <h2 class="cma-section-title">Community Feed</h2>

                    <section class="cma-feed-list" id="cmaFeedList">
                        <div class="cma-empty-feed">
                            <div class="cma-empty-icon">✦</div>
                            <p>Welcome to Change Maker Community</p>
                            <span>Community posts will appear here.</span>
                        </div>
                    </section>

                </main>

                <div id="cmaPostMenuLayer"></div>
                <div id="cmaCommentsLayer"></div>
            `;

            this.bindEvents(root);
           this.loadComposerAvatar(root);
        },

        bindEvents(root) {
            if (!root || root.dataset.cmaFeedBound === "true") return;

            root.dataset.cmaFeedBound = "true";

            root.addEventListener("click", async event => {
                const profileButton = event.target.closest(
                    "[data-cma-open-profile]"
                );

                if (profileButton) {
                    event.preventDefault();
                    event.stopPropagation();

                    this.openMemberProfile(
                        profileButton.dataset.cmaOpenProfile
                    );
                    return;
                }

                const button = event.target.closest(
                    "[data-cma-action], [data-cma-page], " +
                    "[data-cma-post-menu], [data-reaction], " +
                    "[data-cma-comments], [data-cma-remove-photo]"
                );

                if (!button) return;

                if (button.dataset.cmaPage) {
                    window.dispatchEvent(new CustomEvent("cma:navigate", {
                        detail: { page: button.dataset.cmaPage }
                    }));
                    return;
                }

                const action = button.dataset.cmaAction;

                if (action === "search") {
                    window.dispatchEvent(
                        new CustomEvent("cma:open-search")
                    );
                    return;
                }

                if (action === "photo") {
                    if (!Core.requireLogin()) return;

                    document.dispatchEvent(
                        new CustomEvent("cma:select-photo")
                    );
                    return;
                }

                if (action === "post") {
                    if (!Core.requireLogin()) return;

                    const input = root.querySelector("#cmaPostInput");
                    const content = input?.value.trim() || "";

                    const preview = root.querySelector(
                        "#cmaSelectedPhoto"
                    );

                    const photoSelected = !!preview?.querySelector("img");

                    if (!content && !photoSelected) {
                        Core.showNotice(
                            "কিছু লিখো অথবা একটি ছবি নির্বাচন করো।",
                            "error"
                        );
                        return;
                    }

                    document.dispatchEvent(
                        new CustomEvent("cma:submit-post", {
                            detail: { content }
                        })
                    );
                    return;
                }

                if (button.hasAttribute("data-cma-remove-photo")) {
                    document.dispatchEvent(
                        new CustomEvent("cma:remove-photo")
                    );

                    const preview = root.querySelector(
                        "#cmaSelectedPhoto"
                    );

                    if (preview) preview.innerHTML = "";
                    return;
                }

                if (button.dataset.cmaPostMenu) {
                    this.openPostMenu(button.dataset.cmaPostMenu);
                    return;
                }

                if (button.dataset.reaction) {
                    const postId = button.closest(
                        "[data-post-id]"
                    )?.dataset.postId;

                    await this.toggleReaction(
                        postId,
                        button.dataset.reaction
                    );
                    return;
                }

                if (button.dataset.cmaComments) {
                    this.openComments(button.dataset.cmaComments);
                    return;
                }
            });
        },

        showSelectedPhoto(file) {
            const preview = document.getElementById(
                "cmaSelectedPhoto"
            );

            if (!preview || !file) return;

            if (!file.type || !file.type.startsWith("image/")) {
                Core.showNotice(
                    "শুধু Image নির্বাচন করা যাবে।",
                    "error"
                );
                return;
            }

            if (preview.dataset.objectUrl) {
                URL.revokeObjectURL(preview.dataset.objectUrl);
            }

            const url = URL.createObjectURL(file);
            preview.dataset.objectUrl = url;

            preview.innerHTML = `
                <img
                    src="${url}"
                    alt="Selected photo preview"
                    style="max-width:100%;max-height:220px;
                    border-radius:12px;margin-top:10px;">

                <button
                    type="button"
                    data-cma-remove-photo
                    style="display:block;margin-top:6px;">
                    Remove photo
                </button>
            `;
        },

        createPostCard(post) {
            const item = post || {};
            const user = Core.getCurrentUser();

            const authorName =
                item.author_name ||
                item.full_name ||
                item.user_name ||
                "Member";

            const postContent =
                item.content ??
                item.caption ??
                "";

            const author = Core.escapeHTML(authorName);
            const caption = Core.escapeHTML(postContent);

            const time = Core.escapeHTML(
                Core.formatRelativeTime(item.created_at)
            );

            const imageURL = Core.safeImageURL(item.image_url);
            const avatarURL = Core.safeImageURL(item.avatar_url);

            const isOwner =
                !!user &&
                !!item.user_id &&
                item.user_id === user.id;

            const postId = Core.escapeHTML(item.id || "");
            const authorId = Core.escapeHTML(item.user_id || "");

            const avatarHTML = avatarURL
                ? `
                    <img
                        class="cma-avatar"
                        src="${avatarURL}"
                        alt="Profile picture">
                `
                : `<div class="cma-avatar"></div>`;

            const cardHTML = `
                <article
                    class="cma-post-card"
                    data-post-id="${postId}">

                    <div class="cma-post-header">

                        <button
                            type="button"
                            data-cma-open-profile="${authorId}"
                            aria-label="Open ${author}'s profile"
                            style="border:0;background:none;
                            padding:0;cursor:pointer;">
                            ${avatarHTML}
                        </button>

                        <div class="cma-post-author">
                            <button
                                type="button"
                                data-cma-open-profile="${authorId}"
                                style="border:0;background:none;padding:0;
                                color:inherit;font:inherit;
                                font-weight:inherit;cursor:pointer;
                                text-align:left;">
                                <strong>${author}</strong>
                            </button>

                            <span>${time}</span>
                        </div>

                        ${
                            isOwner
                                ? `
                                    <button
                                        class="cma-post-menu"
                                        type="button"
                                        aria-label="Post options"
                                        data-cma-post-menu="${postId}">
                                        ⋯
                                    </button>
                                `
                                : ""
                        }

                    </div>

                    ${
                        caption
                            ? `<div class="cma-post-caption">${caption}</div>`
                            : ""
                    }

                    ${
                        imageURL
                            ? `
                                <img
                                    class="cma-post-image"
                                    src="${imageURL}"
                                    alt="Post image"
                                    loading="lazy">
                            `
                            : ""
                    }

                    <div class="cma-reactions">
                        <button type="button" data-reaction="like"
                            aria-pressed="false">👍</button>
                        <button type="button" data-reaction="love"
                            aria-pressed="false">❤️</button>
                        <button type="button" data-reaction="haha"
                            aria-pressed="false">😂</button>
                        <button type="button" data-reaction="wow"
                            aria-pressed="false">😮</button>
                    </div>

                    <div
                        class="cma-comment-preview"
                        data-cma-random-comment="${postId}">
                        Comments will appear here.
                    </div>

                    <button
                        class="cma-comment-input"
                        type="button"
                        data-cma-comments="${postId}"
                        aria-label="Write a comment">
                        <span class="cma-comment-placeholder">
                            Write a comment...
                        </span>
                        <span class="cma-comment-send-icon"
                            aria-hidden="true">➤</span>
                    </button>

                </article>
            `;

            if (item.id) {
                this.loadMyReaction(item.id);
            }

            return cardHTML;
        },

        async toggleReaction(postId, reactionType) {
            if (!Core.requireLogin() || !postId) return;

            const user = Core.getCurrentUser();
            if (!user) return;

            const allowed = ["like", "love", "haha", "wow"];
            if (!allowed.includes(reactionType)) return;

            try {
                const { data: existing, error: readError } = await db
                    .from("cma_community_reactions")
                    .select("id,reaction_type")
                    .eq("post_id", postId)
                    .eq("user_id", user.id)
                    .maybeSingle();

                if (readError) throw readError;

                if (existing && existing.reaction_type === reactionType) {
                    const { error } = await db
                        .from("cma_community_reactions")
                        .delete()
                        .eq("id", existing.id)
                        .eq("user_id", user.id);

                    if (error) throw error;
                    this.updateReactionUI(postId, null);

                } else if (existing) {
                    const { error } = await db
                        .from("cma_community_reactions")
                        .update({ reaction_type: reactionType })
                        .eq("id", existing.id)
                        .eq("user_id", user.id);

                    if (error) throw error;
                    this.updateReactionUI(postId, reactionType);

                } else {
                    const { error } = await db
                        .from("cma_community_reactions")
                        .insert({
                            post_id: postId,
                            user_id: user.id,
                            reaction_type: reactionType
                        });

                    if (error) throw error;
                    this.updateReactionUI(postId, reactionType);
                }

            } catch (error) {
                console.error("Reaction error:", error);
                Core.showNotice(
                    "Reaction দেওয়া যায়নি। আবার চেষ্টা করো।",
                    "error"
                );
            }
        },

        updateReactionUI(postId, activeType) {
            document.querySelectorAll("[data-post-id]").forEach(card => {
                if (card.dataset.postId !== postId) return;

                card.querySelectorAll("[data-reaction]").forEach(button => {
                    const active =
                        button.dataset.reaction === activeType;

                    button.setAttribute(
                        "aria-pressed",
                        active ? "true" : "false"
                    );

                    button.style.opacity = active ? "1" : "";
                    button.style.filter = active
                        ? "brightness(1.2)"
                        : "";
                });
            });
        },

        async loadMyReaction(postId) {
            if (!postId) return;

            const user = Core.getCurrentUser();
            if (!user) return;

            try {
                const { data, error } = await db
                    .from("cma_community_reactions")
                    .select("reaction_type")
                    .eq("post_id", postId)
                    .eq("user_id", user.id)
                    .maybeSingle();

                if (error) throw error;

                this.updateReactionUI(
                    postId,
                    data?.reaction_type || null
                );

            } catch (error) {
                console.error("My reaction loading error:", error);
            }
        },

        async loadReactionCounts(postId) {
            // Reaction counts are intentionally not displayed.
            return;
        },

        async loadRandomComment(postId) {
            if (!postId) return;

            try {
                const { data, error } = await db
                    .from("cma_community_comments")
                    .select("id,content,created_at,user_id")
                    .eq("post_id", postId)
                    .is("parent_id", null)
                    .order("created_at", { ascending: false })
                    .limit(2);

                if (error) throw error;

                const preview = document.querySelector(
                    `[data-cma-random-comment="${CSS.escape(postId)}"]`
                );

                if (!preview) return;

                if (!data || !data.length) {
                    preview.textContent = "Be the first to comment.";
                    return;
                }

                const userIds = [
                    ...new Set(
                        data.map(item => item.user_id).filter(Boolean)
                    )
                ];

                let profiles = {};

                if (userIds.length) {
                    const { data: profileRows, error: profileError } =
                        await db
                            .from("cma_community_profiles")
                            .select("user_id,full_name")
                            .in("user_id", userIds);

                    if (!profileError) {
                        (profileRows || []).forEach(profile => {
                            profiles[profile.user_id] = profile;
                        });
                    }
                }

                preview.innerHTML = data.reverse().map(comment => {
                    const name = Core.escapeHTML(
                        profiles[comment.user_id]?.full_name || "Member"
                    );

                    const content = Core.escapeHTML(
                        comment.content || ""
                    );

                    return `
                        <div class="cma-comment-preview-item"
                            style="padding:5px 0;overflow-wrap:anywhere;">
                            <strong>${name}</strong>
                            <span>${content}</span>
                        </div>
                    `;
                }).join("");

            } catch (error) {
                console.error("Comment preview error:", error);
            }
        },

        openPostMenu(postId) {
            const user = Core.getCurrentUser();
            if (!user || !postId) return;

            const card = document.querySelector(
                `[data-post-id="${CSS.escape(postId)}"]`
            );

            if (!card) return;

            let menuLayer = document.getElementById("cmaPostMenuLayer");

            if (!menuLayer) {
                menuLayer = document.createElement("div");
                menuLayer.id = "cmaPostMenuLayer";
                document.body.appendChild(menuLayer);
            }

            menuLayer.innerHTML = `
                <div class="cma-post-menu-backdrop"
                    data-cma-close-menu
                    style="position:fixed;inset:0;z-index:9998;">
                </div>

                <div class="cma-post-menu-panel"
                    style="position:fixed;z-index:9999;
                    right:16px;top:120px;background:#103E4C;
                    padding:12px;border-radius:14px;
                    min-width:170px;box-shadow:0 8px 30px #0006;">

                    <button type="button"
                        data-cma-edit="${Core.escapeHTML(postId)}"
                        style="display:block;width:100%;padding:12px;
                        text-align:left;background:transparent;
                        color:white;border:0;">
                        ✏️ Edit Post
                    </button>

                    <button type="button"
                        data-cma-delete="${Core.escapeHTML(postId)}"
                        style="display:block;width:100%;padding:12px;
                        text-align:left;background:transparent;
                        color:#ff8585;border:0;">
                        🗑 Delete Post
                    </button>
                </div>
            `;

            menuLayer.onclick = async event => {
                if (event.target.closest("[data-cma-close-menu]")) {
                    menuLayer.innerHTML = "";
                    return;
                }

                const edit = event.target.closest("[data-cma-edit]");
                const remove = event.target.closest("[data-cma-delete]");

                if (edit) {
                    menuLayer.innerHTML = "";

                    const caption = card.querySelector(
                        ".cma-post-caption"
                    );

                    const newText = window.prompt(
                        "Edit your post:",
                        caption?.textContent || ""
                    );

                    if (newText === null) return;

                    const Main = window.CMACommunityMain;

                    if (Main && typeof Main.updatePost === "function") {
                        await Main.updatePost(postId, newText);
                        return;
                    }

                    // Main-e updatePost na thakle sorasori update
                    try {
                        const { data, error } = await db
                            .from("cma_community_posts")
                            .update({ content: newText.trim() })
                            .eq("id", postId)
                            .eq("user_id", user.id)
                            .select("id");

                        if (error) throw error;
                        if (!data?.length) throw new Error("No permission");

                        if (caption) caption.textContent = newText.trim();
                        Core.showNotice("Post updated.");
                    } catch (error) {
                        console.error("Post edit error:", error);
                        Core.showNotice(
                            "Post edit kora jayni.",
                            "error"
                        );
                    }
                    return;
                }

                if (remove) {
                    menuLayer.innerHTML = "";

                    if (!window.confirm(
                        "তুমি কি নিজের এই Post Delete করতে চাও?"
                    )) {
                        return;
                    }

                    document.dispatchEvent(
                        new CustomEvent("cma:delete-post", {
                            detail: { postId }
                        })
                    );
                }
            };
        },

        async openComments(postId) {
            if (!postId) return;

            this.activePostId = postId;
            this.activeReplyId = null;
            this.activeReplyName = "";

            const layer = document.getElementById("cmaCommentsLayer");
            if (!layer) return;

            layer.innerHTML = `
                <div data-cma-close-comments
                    style="position:fixed;inset:0;
                    background:#0008;z-index:9998;">
                </div>

                <section id="cmaCommentsSheet"
                    style="position:fixed;bottom:0;left:0;right:0;
                    height:75vh;max-height:650px;z-index:9999;
                    background:#073746;color:white;
                    border-radius:20px 20px 0 0;padding:16px;
                    display:flex;flex-direction:column;
                    box-shadow:0 -8px 30px #0005;">

                    <div style="width:42px;height:4px;
                        background:#68DDB9;border-radius:10px;
                        margin:0 auto 14px;">
                    </div>

                    <div style="display:flex;align-items:center;
                        justify-content:space-between;
                        border-bottom:1px solid #245563;
                        padding-bottom:12px;">

                        <strong>Comments</strong>

                        <button type="button"
                            data-cma-close-comments
                            style="background:none;border:0;
                            color:white;font-size:24px;">
                            ×
                        </button>
                    </div>

                    <div id="cmaCommentsList"
                        style="flex:1;overflow-y:auto;padding:12px 0;">
                        Loading comments...
                    </div>

                    <div id="cmaReplyStatus"
                        style="font-size:12px;color:#68DDB9;padding:4px 2px;">
                    </div>

                    <div class="cma-comment-compose">
                        <textarea
                            id="cmaCommentInput"
                            rows="1"
                            placeholder="Write a comment..."
                            aria-label="Write a comment"></textarea>

                        <button type="button"
                            data-cma-send-comment="${Core.escapeHTML(postId)}">
                            Send
                        </button>
                    </div>
                </section>
            `;

            const input = layer.querySelector("#cmaCommentInput");
            if (input) this.autoResizeTextarea(input);

            if (!this.boundCommentLayers.has(layer)) {
                this.boundCommentLayers.add(layer);

                layer.addEventListener("input", event => {
                    if (event.target.id === "cmaCommentInput") {
                        this.autoResizeTextarea(event.target);
                    }
                });

                layer.addEventListener("click", async event => {
                    const profileButton = event.target.closest(
                        "[data-cma-open-profile]"
                    );

                    if (profileButton) {
                        this.openMemberProfile(
                            profileButton.dataset.cmaOpenProfile
                        );
                        return;
                    }

                    const close = event.target.closest(
                        "[data-cma-close-comments]"
                    );

                    if (close) {
                        layer.innerHTML = "";
                        this.activePostId = null;
                        this.activeReplyId = null;
                        this.activeReplyName = "";
                        return;
                    }

                    const reply = event.target.closest("[data-cma-reply]");

                    if (reply) {
                        this.activeReplyId = reply.dataset.cmaReply;
                        this.activeReplyName =
                            reply.dataset.replyName || "Member";

                        const input = layer.querySelector(
                            "#cmaCommentInput"
                        );

                        if (input) {
                            input.placeholder =
                                "Replying to " +
                                this.activeReplyName + "...";
                            input.focus();
                        }

                        const status = layer.querySelector(
                            "#cmaReplyStatus"
                        );

                        if (status) {
                            status.innerHTML = `
                                Replying to
                                <strong>${Core.escapeHTML(this.activeReplyName)}</strong>

                                <button type="button"
                                    data-cma-cancel-reply
                                    style="border:0;background:none;
                                    color:#68DDB9;margin-left:8px;">
                                    Cancel
                                </button>
                            `;
                        }

                        return;
                    }

                    const cancel = event.target.closest(
                        "[data-cma-cancel-reply]"
                    );

                    if (cancel) {
                        this.activeReplyId = null;
                        this.activeReplyName = "";

                        const input = layer.querySelector(
                            "#cmaCommentInput"
                        );

                        if (input) {
                            input.placeholder = "Write a comment...";
                        }

                        const status = layer.querySelector(
                            "#cmaReplyStatus"
                        );

                        if (status) status.innerHTML = "";

                        return;
                    }

                    const editBtn = event.target.closest(
                        "[data-cma-comment-edit]"
                    );

                    if (editBtn) {
                        this.startEditComment(
                            editBtn.dataset.cmaCommentEdit
                        );
                        return;
                    }

                    const saveBtn = event.target.closest(
                        "[data-cma-comment-save]"
                    );

                    if (saveBtn) {
                        await this.saveEditComment(
                            saveBtn.dataset.cmaCommentSave
                        );
                        return;
                    }

                    if (event.target.closest("[data-cma-comment-cancel]")) {
                        await this.loadComments(this.activePostId);
                        return;
                    }

                    const delBtn = event.target.closest(
                        "[data-cma-comment-delete]"
                    );

                    if (delBtn) {
                        await this.deleteComment(
                            delBtn.dataset.cmaCommentDelete
                        );
                        return;
                    }

                    const send = event.target.closest(
                        "[data-cma-send-comment]"
                    );

                    if (send) {
                        await this.sendComment(
                            send.dataset.cmaSendComment
                        );
                    }
                });

                layer.addEventListener("keydown", async event => {
                    if (
                        event.key === "Enter" &&
                        !event.shiftKey &&
                        event.target.id === "cmaCommentInput"
                    ) {
                        event.preventDefault();

                        const sendButton = layer.querySelector(
                            "[data-cma-send-comment]"
                        );

                        if (sendButton) {
                            await this.sendComment(
                                sendButton.dataset.cmaSendComment
                            );
                        }
                    }
                });
            }

            await this.loadComments(postId);
        },
                       
        autoResizeTextarea(textarea) {
            if (!textarea) return;

            textarea.style.height = "auto";

            const maxHeight = 120;
            const nextHeight = Math.min(
                textarea.scrollHeight,
                maxHeight
            );

            textarea.style.height = nextHeight + "px";
            textarea.style.overflowY =
                textarea.scrollHeight > maxHeight ? "auto" : "hidden";
        },

        formatCommentTime(value) {
            if (!value) return "";

            const date = new Date(value);

            if (Number.isNaN(date.getTime())) return "";

            return date.toLocaleString("en-BD", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit"
            });
        },

        async loadComments(postId) {
            const list = document.getElementById("cmaCommentsList");

            if (!list || !db) return;

            list.textContent = "Loading comments...";

            try {
                const { data, error } = await db
                    .from("cma_community_comments")
                    .select("*")
                    .eq("post_id", postId)
                    .order("created_at", { ascending: true });

                if (error) throw error;

                if (!data?.length) {
                    list.innerHTML = `
                        <p style="text-align:center;color:#A8C0CE;
                            padding:30px 0;">
                            No comments yet. Be the first to comment!
                        </p>
                    `;
                    return;
                }

                const userIds = [
                    ...new Set(
                        data.map(item => item.user_id).filter(Boolean)
                    )
                ];

                let profiles = {};

                if (userIds.length) {
                    const { data: profileRows, error: profileError } =
                        await db
                            .from("cma_community_profiles")
                            .select("user_id,full_name,avatar_url")
                            .in("user_id", userIds);

                    if (profileError) {
                        console.error(
                            "Comment profiles error:",
                            profileError
                        );
                    } else {
                        (profileRows || []).forEach(profile => {
                            profiles[profile.user_id] = profile;
                        });
                    }
                }

                const nodes = new Map();

                data.forEach(item => {
                    const profile = profiles[item.user_id] || {};

                    nodes.set(item.id, {
                        ...item,
                        author_name:
                            profile.full_name || "Community Member",
                        avatar_url: profile.avatar_url || "",
                        children: []
                    });
                });

                const rootComments = [];

                nodes.forEach(node => {
                    if (
                        node.parent_id &&
                        nodes.has(node.parent_id)
                    ) {
                        nodes.get(node.parent_id).children.push(node);
                    } else {
                        rootComments.push(node);
                    }
                });

                this.commentNodes = nodes;
                const myUserId = Core.getCurrentUser()?.id || null;

                const renderComment = (comment, level = 0) => {
                    const author = Core.escapeHTML(
                        comment.author_name
                    );

                    const content = Core.escapeHTML(
                        comment.content || ""
                    );

                    const avatar = Core.safeImageURL(
                        comment.avatar_url
                    );

                    const createdTime = this.formatCommentTime(
                        comment.created_at
                    );

                    const authorId = Core.escapeHTML(
                        comment.user_id || ""
                    );

                    const updatedTime =
                        comment.updated_at &&
                        new Date(comment.updated_at).getTime() >
                            new Date(comment.created_at).getTime() + 1000
                            ? this.formatCommentTime(comment.updated_at)
                            : "";

                    const avatarHTML = avatar
                        ? `
                            <img src="${avatar}" alt="Profile picture"
                                style="width:28px;height:28px;
                                border-radius:50%;object-fit:cover;
                                display:block;">
                        `
                        : `
                            <div style="width:28px;height:28px;
                                border-radius:50%;background:#245563;">
                            </div>
                        `;

                    const repliesHTML = comment.children
                        .map(reply => renderComment(reply, level + 1))
                        .join("");

                    const isMine =
                        !!myUserId && comment.user_id === myUserId;

                    const miniBtn =
                        "border:0;background:none;font-size:11px;" +
                        "line-height:1.4;padding:0;cursor:pointer;";

                    return `
                        <div data-comment-id="${Core.escapeHTML(comment.id)}"
                            style="
                            margin-bottom:8px;
                            margin-left:${Math.min(level * 18, 54)}px;
                            min-width:0;
                        ">

                            <div style="
                                display:flex;
                                gap:7px;
                                align-items:flex-start;
                                min-width:0;
                            ">

                                <button type="button"
                                    data-cma-open-profile="${authorId}"
                                    aria-label="Open ${author}'s profile"
                                    style="
                                        border:0;
                                        background:none;
                                        padding:0;
                                        cursor:pointer;
                                        flex-shrink:0;
                                    ">
                                    ${avatarHTML}
                                </button>

                                <div style="
                                    flex:1;
                                    min-width:0;
                                ">

                                    <div style="
                                        display:inline-block;
                                        width:fit-content;
                                        max-width:100%;
                                        box-sizing:border-box;
                                        background:#103E4C;
                                        border-radius:12px;
                                        padding:7px 10px;
                                        vertical-align:top;
                                    ">

                                        <button type="button"
                                            data-cma-open-profile="${authorId}"
                                            style="
                                                border:0;
                                                background:none;
                                                padding:0;
                                                color:inherit;
                                                font-size:12px;
                                                line-height:1.3;
                                                font-weight:700;
                                                cursor:pointer;
                                                text-align:left;
                                                overflow-wrap:anywhere;
                                            ">
                                            ${author}
                                        </button>

                                        <div data-cma-comment-content style="
                                            font-size:13px;
                                            line-height:1.4;
                                            margin-top:3px;
                                            white-space:pre-wrap;
                                            overflow-wrap:anywhere;
                                            word-break:break-word;
                                        ">${content}</div>
                                    </div>

                                    <div style="
                                        display:flex;
                                        flex-wrap:wrap;
                                        gap:8px;
                                        align-items:center;
                                        padding:3px 3px 0;
                                        font-size:10px;
                                        line-height:1.4;
                                        color:#A8C0CE;
                                    ">

                                        <span>${Core.escapeHTML(createdTime)}</span>

                                        ${
                                            updatedTime
                                                ? `<span>Edited: ${Core.escapeHTML(updatedTime)}</span>`
                                                : ""
                                        }

                                        <button type="button"
                                            data-cma-reply="${Core.escapeHTML(comment.id)}"
                                            data-reply-name="${Core.escapeHTML(comment.author_name)}"
                                            style="
                                                border:0;
                                                background:none;
                                                color:#68DDB9;
                                                font-size:11px;
                                                line-height:1.4;
                                                padding:0;
                                                cursor:pointer;
                                            ">
                                            Reply
                                        </button>

                                        ${
                                            isMine
                                                ? `
                                                    <button type="button"
                                                        data-cma-comment-edit="${Core.escapeHTML(comment.id)}"
                                                        style="${miniBtn}color:#A8C0CE;">
                                                        Edit
                                                    </button>
                                                    <button type="button"
                                                        data-cma-comment-delete="${Core.escapeHTML(comment.id)}"
                                                        style="${miniBtn}color:#ff8585;">
                                                        Delete
                                                    </button>
                                                `
                                                : ""
                                        }
                                    </div>
                                </div>
                            </div>

                            ${repliesHTML}
                        </div>
                    `;
                };

                list.innerHTML = rootComments
                    .map(comment => renderComment(comment))
                    .join("");

            } catch (error) {
                console.error("Comments loading error:", error);

                list.innerHTML = `
                    <p style="text-align:center;color:#ff8585;padding:20px;">
                        Comments load করা যায়নি। আবার চেষ্টা করো।
                    </p>
                `;
            }
        },

        startEditComment(id) {
            const wrap = document.querySelector(
                `[data-comment-id="${CSS.escape(id)}"]`
            );

            const box = wrap?.querySelector("[data-cma-comment-content]");
            if (!box) return;

            const original = this.commentNodes?.get(id)?.content || "";

            box.innerHTML = `
                <textarea data-cma-edit-input rows="2"
                    style="width:100%;min-width:200px;box-sizing:border-box;
                    background:#073746;color:#fff;border:1px solid #245563;
                    border-radius:8px;padding:6px;font:inherit;"></textarea>
                <div style="display:flex;gap:10px;margin-top:6px;">
                    <button type="button"
                        data-cma-comment-save="${Core.escapeHTML(id)}"
                        style="border:0;background:#08a889;color:#fff;
                        border-radius:8px;padding:5px 12px;font-size:12px;">
                        Save
                    </button>
                    <button type="button" data-cma-comment-cancel
                        style="border:0;background:none;color:#A8C0CE;
                        font-size:12px;">
                        Cancel
                    </button>
                </div>
            `;

            const ta = box.querySelector("[data-cma-edit-input]");
            ta.value = original;
            ta.focus();
        },

        async saveEditComment(id) {
            const user = Core.getCurrentUser();
            if (!user) return;

            const wrap = document.querySelector(
                `[data-comment-id="${CSS.escape(id)}"]`
            );

            const content = (
                wrap?.querySelector("[data-cma-edit-input]")?.value || ""
            ).trim();

            if (!content) {
                Core.showNotice("Comment khali rakha jabe na.", "error");
                return;
            }

            try {
                const { data, error } = await db
                    .from("cma_community_comments")
                    .update({
                        content,
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", id)
                    .eq("user_id", user.id)
                    .select("id");

                if (error) throw error;

                if (!data?.length) {
                    throw new Error("Permission nai (SQL policy lagbe).");
                }

                await this.loadComments(this.activePostId);
                await this.loadRandomComment(this.activePostId);
                Core.showNotice("Comment updated.");

            } catch (error) {
                console.error("Comment edit error:", error);
                Core.showNotice(
                    "Edit kora jayni. " + (error.message || ""),
                    "error"
                );
            }
        },

        async deleteComment(id) {
            const user = Core.getCurrentUser();
            if (!user) return;

            if (!window.confirm("Ei comment ta delete korte chao?")) return;

            try {
                const { data, error } = await db
                    .from("cma_community_comments")
                    .delete()
                    .eq("id", id)
                    .eq("user_id", user.id)
                    .select("id");

                if (error) {
                    // reply thakle FK atkay: text muche dao
                    if (error.code === "23503") {
                        const { error: softError } = await db
                            .from("cma_community_comments")
                            .update({
                                content: "This comment was deleted",
                                updated_at: new Date().toISOString()
                            })
                            .eq("id", id)
                            .eq("user_id", user.id);

                        if (softError) throw softError;
                    } else {
                        throw error;
                    }
                } else if (!data?.length) {
                    throw new Error("Permission nai (SQL policy lagbe).");
                }

                await this.loadComments(this.activePostId);
                await this.loadRandomComment(this.activePostId);
                Core.showNotice("Comment deleted.");

            } catch (error) {
                console.error("Comment delete error:", error);
                Core.showNotice(
                    "Delete kora jayni. " + (error.message || ""),
                    "error"
                );
            }
        },

        async sendComment(postId) {
            if (!Core.requireLogin()) return;

            const user = Core.getCurrentUser();

            const input = document.querySelector(
                "#cmaCommentInput"
            );

            if (!user || !input || !postId) return;

            const content = input.value.trim();

            if (!content) {
                Core.showNotice("আগে Comment লিখো।", "error");
                return;
            }

            try {
                const { error } = await db
                    .from("cma_community_comments")
                    .insert({
                        post_id: postId,
                        user_id: user.id,
                        parent_id: this.activeReplyId || null,
                        content
                    });

                if (error) throw error;

                input.value = "";
                input.placeholder = "Write a comment...";
                this.autoResizeTextarea(input);

                this.activeReplyId = null;
                this.activeReplyName = "";

                const status = document.querySelector(
                    "#cmaReplyStatus"
                );

                if (status) status.innerHTML = "";

                await this.loadComments(postId);
                await this.loadRandomComment(postId);

                Core.showNotice("Comment posted successfully!");

            } catch (error) {
                console.error("Comment sending error:", error);

                Core.showNotice(
                    "Comment পাঠানো যায়নি। আবার চেষ্টা করো।",
                    "error"
                );
            }
        }
    };

    window.CMACommunityFeed = Feed;

})();


/* =========================================
   RED DOT BADGES (tab bar + message icon)
   Message dot: ready. Baki 3 ta CONFIG-e table nam boshale cholbe.
========================================= */

(function () {
    "use strict";

    const Core = window.CMACommunityCore;
    const db = window.cmaSupabase || Core?.db;
    if (!Core || !db) return;

    /* ---- CONFIG: ekhane table-er nam boshao ----
       table: null thakle oi dot ta off thake.
       userColumn: kar jonno (receiver) / ke likhse (author) column
       mode "mine"   -> userColumn == ami (je row amar jonno)
       mode "others" -> userColumn != ami (onner likha notun post)
       where: extra filter [column, "eq", value]
       sinceSeen: true hole tab-e dhukle dot soriye jay                    */
    const SOURCES = {
        friends: {
            table: null,               // e.g. "cma_friend_requests"
            userColumn: "receiver_id", // je request pabe tar column
            mode: "mine",
            where: [["status", "eq", "pending"]],
            sinceSeen: true,
            show: ["friends", "home"]  // kon kon tab-e dot dekhabe
        },
        notifications: {
            table: null,               // e.g. "cma_notifications"
            userColumn: "user_id",
            mode: "mine",
            where: [["is_read", "eq", false]],
            sinceSeen: true,
            show: ["notifications"]
        },
        creator: {
            table: null,               // e.g. "cma_creator_posts"
            userColumn: "user_id",
            mode: "others",
            where: [],
            sinceSeen: true,
            show: ["creator"]
        }
    };

    const TARGETS = {
        messages: '[data-cma-page="messaging"]',
        friends: '[data-cma-page="friends"] .cma-nav-icon',
        home: '[data-cma-page="home"] .cma-nav-icon',
        notifications: '[data-cma-page="notifications"] .cma-nav-icon',
        creator: '[data-cma-page="creator"] .cma-nav-icon'
    };

    const SEEN_KEYS = {
        friends: "friends",
        notifications: "notifications",
        creator: "creator"
    };

    let myId = null;
    let dots = { messages: false, friends: false, home: false, notifications: false, creator: false };
    let channels = [];
    let timer = null;

    function injectCSS() {
        if (document.getElementById("cmaBadgeStyles")) return;
        const s = document.createElement("style");
        s.id = "cmaBadgeStyles";
        s.textContent = `
            .cma-has-dot { position:relative; }
            .cma-has-dot::after {
                content:"";
                position:absolute;
                top:-2px; right:-4px;
                width:9px; height:9px;
                border-radius:50%;
                background:#ff3b30;
                border:2px solid #073746;
                box-sizing:content-box;
                pointer-events:none;
                z-index:5;
            }
            .cma-icon-button.cma-has-dot::after { top:8px; right:8px; }
        `;
        document.head.appendChild(s);
    }

    function paint() {
        Object.keys(TARGETS).forEach(key => {
            document.querySelectorAll(TARGETS[key]).forEach(el => {
                el.classList.toggle("cma-has-dot", !!dots[key]);
            });
        });
    }

    function seenKey(tab) { return "cma_badge_seen_" + myId + "_" + tab; }

    function getSeen(tab) {
        try { return localStorage.getItem(seenKey(tab)) || new Date(0).toISOString(); }
        catch (e) { return new Date(0).toISOString(); }
    }

    function setSeen(tab) {
        try { localStorage.setItem(seenKey(tab), new Date().toISOString()); } catch (e) {}
    }

    async function checkMessages() {
        const { count, error } = await db
            .from("cma_messages")
            .select("id", { count: "exact", head: true })
            .neq("sender_id", myId)
            .neq("status", "seen")
            .is("deleted_at", null);

        if (error) { console.warn("Badge messages:", error.message); return; }
        dots.messages = (count || 0) > 0;
    }

    async function checkSource(name) {
        const cfg = SOURCES[name];
        if (!cfg.table) return;

        let q = db.from(cfg.table).select("*", { count: "exact", head: true });

        q = cfg.mode === "mine"
            ? q.eq(cfg.userColumn, myId)
            : q.neq(cfg.userColumn, myId);

        (cfg.where || []).forEach(([col, op, val]) => { q = q[op](col, val); });

        if (cfg.sinceSeen) q = q.gt("created_at", getSeen(SEEN_KEYS[name]));

        const { count, error } = await q;
        if (error) { console.warn("Badge " + name + ":", error.message); return; }

        const on = (count || 0) > 0;
        cfg.show.forEach(tab => { dots[tab] = on; });
    }

    async function refreshAll() {
        if (!myId) return;
        try {
            await Promise.all([
                checkMessages(),
                ...Object.keys(SOURCES).map(checkSource)
            ]);
        } catch (e) {
            console.warn("Badge refresh:", e);
        }
        paint();
    }

    function refreshSoon() {
        clearTimeout(timer);
        timer = setTimeout(refreshAll, 350);
    }

    function listen(table) {
        const ch = db
            .channel("cma-badge-" + table + "-" + myId)
            .on("postgres_changes", { event: "*", schema: "public", table }, refreshSoon)
            .subscribe();
        channels.push(ch);
    }

    function stop() {
        channels.forEach(ch => db.removeChannel(ch));
        channels = [];
        Object.keys(dots).forEach(k => { dots[k] = false; });
        paint();
    }

    function start(user) {
        if (!user || myId === user.id) return;
        stop();
        myId = user.id;

        listen("cma_messages");
        Object.keys(SOURCES).forEach(n => {
            if (SOURCES[n].table) listen(SOURCES[n].table);
        });

        refreshAll();
    }

    injectCSS();

    // tab-e dhukle oi tab-er dot soriye dao
    window.addEventListener("cma:navigate", event => {
        const page = event.detail?.page;
        if (!myId || !page) return;

        Object.keys(SOURCES).forEach(name => {
            if (page === name || (name === "friends" && page === "friends")) {
                setSeen(SEEN_KEYS[name]);
                SOURCES[name].show.forEach(tab => { dots[tab] = false; });
            }
        });

        paint();
        refreshSoon();
    });

    // page render holei dot abar boshao
    let paintQueued = false;
    new MutationObserver(() => {
        if (paintQueued) return;
        paintQueued = true;
        requestAnimationFrame(() => { paintQueued = false; paint(); });
    }).observe(document.body, { childList: true, subtree: true });

    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) refreshSoon();
    });

    (async function init() {
        try {
            const { data } = await db.auth.getUser();
            if (data?.user) start(data.user);
        } catch (e) {}
    })();

    db.auth?.onAuthStateChange?.((event, session) => {
        if (session?.user) start(session.user);
        else { myId = null; stop(); }
    });

    window.CMABadges = { refresh: refreshAll };
})();
