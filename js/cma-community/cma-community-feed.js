/* =========================================
   CHANGE MAKER ACADEMY
   COMMUNITY FEED MODULE
   FUNCTIONAL POST SYSTEM
========================================= */

(function () {
  "use strict";

  const Core = window.CMACommunityCore;

  if (!Core) {
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
    search: `<svg viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg>`
  };

  const Feed = {
    activePostId: null,
    activeReplyId: null,

    async renderHome(root) {
      if (!root) root = Core.getRoot();
      if (!root) return;

      root.innerHTML = `
        <main class="cma-community">

          <header class="cma-header">
            <div class="cma-header-title">
              <span>Change Maker</span>
              <span class="cma-green">Community</span>
            </div>
            <button class="cma-icon-button"
              type="button"
              data-cma-action="search"
              aria-label="Search">
              ${Icons.search}
            </button>
          </header>

          <nav class="cma-navigation" aria-label="Community navigation">
            <button class="cma-nav-item active" type="button" data-cma-page="home">
              <span class="cma-nav-icon">${Icons.home}</span>
              <span>Home</span>
            </button>

            <button class="cma-nav-item" type="button" data-cma-page="profile">
              <span class="cma-nav-icon">${Icons.profile}</span>
              <span>Profile</span>
            </button>

            <button class="cma-nav-item" type="button" data-cma-page="friends">
              <span class="cma-nav-icon">${Icons.friends}</span>
              <span>Friends</span>
            </button>

            <button class="cma-nav-item" type="button" data-cma-page="creator">
              <span class="cma-nav-icon">${Icons.creator}</span>
              <span>Creator Panel</span>
            </button>

            <button class="cma-nav-item" type="button" data-cma-page="notifications">
              <span class="cma-nav-icon">${Icons.notification}</span>
              <span>Notification</span>
            </button>
          </nav>

          <section class="cma-composer">
            <div class="cma-composer-top">
              <div class="cma-avatar"></div>
              <textarea
                class="cma-post-input"
                id="cmaPostInput"
                placeholder="What's on your mind?"
                rows="1"
                aria-label="Write a post"
              ></textarea>
            </div>

            <div class="cma-composer-bottom">
              <button type="button"
                class="cma-photo-button"
                data-cma-action="photo">
                <span aria-hidden="true">▧</span>
                Photo
              </button>

              <button type="button"
                class="cma-post-button"
                data-cma-action="post">
                Post
              </button>
            </div>

            <div id="cmaSelectedPhoto" class="cma-selected-photo"></div>
          </section>

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
    },

    bindEvents(root) {
      if (root.dataset.cmaFeedBound === "true") return;
      root.dataset.cmaFeedBound = "true";

      root.addEventListener("click", async (event) => {
        const button = event.target.closest(
          "[data-cma-action], [data-cma-page], [data-cma-post-menu], [data-reaction], [data-cma-comments], [data-cma-send-comment], [data-cma-reply]"
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
          window.dispatchEvent(new CustomEvent("cma:open-search"));
          return;
        }

        if (action === "photo") {
          if (!Core.requireLogin()) return;
          window.dispatchEvent(new CustomEvent("cma:select-photo"));
          return;
        }

        if (action === "post") {
          if (!Core.requireLogin()) return;

          const input = root.querySelector("#cmaPostInput");
          const content = input?.value.trim() || "";
          const photoSelected = !!document.querySelector("#cmaSelectedPhoto img");

          if (!content && !photoSelected) {
            Core.showNotice("কিছু লিখো অথবা একটি ছবি নির্বাচন করো।", "error");
            return;
          }

          window.dispatchEvent(new CustomEvent("cma:submit-post", {
            detail: { content }
          }));
          return;
        }

        if (button.dataset.cmaPostMenu) {
          this.openPostMenu(button.dataset.cmaPostMenu);
          return;
        }

        if (button.dataset.reaction) {
          await this.toggleReaction(
            button.closest("[data-post-id]")?.dataset.postId,
            button.dataset.reaction
          );
          return;
        }

        if (button.dataset.cmaComments) {
          this.openComments(button.dataset.cmaComments);
          return;
        }

        if (button.dataset.cmaSendComment) {
          await this.sendComment(button.dataset.cmaSendComment);
          return;
        }

        if (button.dataset.cmaReply) {
          this.activeReplyId = button.dataset.cmaReply;
          const input = document.querySelector("#cmaCommentInput");
          if (input) {
            input.placeholder = "Write a reply...";
            input.focus();
          }
        }
      });

      root.addEventListener("click", (event) => {
        const remove = event.target.closest("[data-cma-remove-photo]");
        if (!remove) return;

        window.dispatchEvent(new CustomEvent("cma:remove-photo"));

        const preview = root.querySelector("#cmaSelectedPhoto");
        if (preview) preview.innerHTML = "";
      });
    },

    showSelectedPhoto(file) {
      const preview = document.getElementById("cmaSelectedPhoto");
      if (!preview || !file) return;

      const oldURL = preview.dataset.objectUrl;
      if (oldURL) URL.revokeObjectURL(oldURL);

      const url = URL.createObjectURL(file);
      preview.dataset.objectUrl = url;

      preview.innerHTML = `
        <img src="${url}" alt="Selected photo preview"
          style="max-width:100%;max-height:220px;border-radius:12px;margin-top:10px;">
        <button type="button" data-cma-remove-photo
          style="display:block;margin-top:6px;">
          Remove photo
        </button>
      `;
    },
     
    createPostCard(post) {
      const item = post || {};
      const user = Core.getCurrentUser();

      const author = Core.escapeHTML(item.author_name || "Member");
      const caption = Core.escapeHTML(item.caption || "");
      const time = Core.escapeHTML(
        Core.formatRelativeTime(item.created_at)
      );

      const imageURL = Core.safeImageURL(item.image_url);
      const avatarURL = Core.safeImageURL(item.avatar_url);
      const isOwner = !!user && item.user_id === user.id;
      const postId = Core.escapeHTML(item.id || "");

      return `
        <article class="cma-post-card" data-post-id="${postId}">

          <div class="cma-post-header">
            ${
              avatarURL
                ? `<img class="cma-avatar" src="${avatarURL}" alt="Profile picture">`
                : `<div class="cma-avatar"></div>`
            }

            <div class="cma-post-author">
              <strong>${author}</strong>
              <span>${time}</span>
            </div>

            ${
              isOwner
                ? `<button class="cma-icon-button"
                     type="button"
                     aria-label="Post options"
                     data-cma-post-menu="${postId}">⋯</button>`
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
              ? `<img class="cma-post-image"
                   src="${imageURL}"
                   alt="Post image"
                   loading="lazy">`
              : ""
          }

          <div class="cma-reactions">
            <button type="button" data-reaction="like">👍</button>
            <button type="button" data-reaction="love">❤️</button>
            <button type="button" data-reaction="haha">😂</button>
            <button type="button" data-reaction="wow">😮</button>
          </div>

          <div class="cma-comment-preview"
            data-cma-random-comment="${postId}">
            Comments will appear here.
          </div>

          <button class="cma-view-comments"
            type="button"
            data-cma-comments="${postId}">
            Write a comment
          </button>

        </article>
      `;
    },

    async toggleReaction(postId, reactionType) {
      if (!Core.requireLogin()) return;
      if (!postId || !db) return;
       
       async toggleReaction(postId, reactionType) {
  if (!Core.requireLogin()) return;

  console.log("REACTION CLICKED:", postId, reactionType, Core.getCurrentUser());

  if (!postId || !db) return;

      const user = Core.getCurrentUser();
      if (!user) return;

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
        } else {
          const { error } = await db
            .from("cma_community_reactions")
            .upsert({
              post_id: postId,
              user_id: user.id,
              reaction_type: reactionType
            }, {
              onConflict: "post_id,user_id"
            });

          if (error) throw error;
        }

        await this.loadReactionCounts(postId);

      } catch (error) {
        console.error("Reaction error:", error);
        Core.showNotice("Reaction দেওয়া যায়নি। আবার চেষ্টা করো।", "error");
      }
    },

    async loadReactionCounts(postId) {
      if (!db || !postId) return;

      try {
        const { data, error } = await db
          .from("cma_community_reactions")
          .select("reaction_type")
          .eq("post_id", postId);

        if (error) throw error;

        const card = document.querySelector(
          `[data-post-id="${CSS.escape(postId)}"]`
        );

        if (!card) return;

        const counts = {
          like: 0,
          love: 0,
          haha: 0,
          wow: 0
        };

        (data || []).forEach(item => {
          if (counts[item.reaction_type] !== undefined) {
            counts[item.reaction_type]++;
          }
        });

        const buttons = card.querySelectorAll("[data-reaction]");

        buttons.forEach(button => {
          const type = button.dataset.reaction;
          button.dataset.count = counts[type] || 0;
        });

      } catch (error) {
        console.error("Reaction count error:", error);
      }
    },

    async loadRandomComment(postId) {
      if (!db || !postId) return;

      try {
        const { data, error } = await db
          .from("cma_community_comments")
          .select("content,created_at")
          .eq("post_id", postId)
          .is("parent_id", null);

        if (error) throw error;

        const preview = document.querySelector(
          `[data-cma-random-comment="${CSS.escape(postId)}"]`
        );

        if (!preview) return;

        if (!data || !data.length) {
          preview.textContent = "Be the first to comment.";
          return;
        }

        const random = data[Math.floor(Math.random() * data.length)];

        preview.textContent = random.content;

      } catch (error) {
        console.error("Random comment error:", error);
      }
    },

    openPostMenu(postId) {
      const user = Core.getCurrentUser();
      if (!user || !postId) return;

      const card = document.querySelector(
        `[data-post-id="${CSS.escape(postId)}"]`
      );

      if (!card) return;

      const menuLayer = document.getElementById("cmaPostMenuLayer");
      if (!menuLayer) return;

      menuLayer.innerHTML = `
        <div class="cma-post-menu-backdrop"
          data-cma-close-menu></div>

        <div class="cma-post-menu-panel"
          style="position:fixed;z-index:9999;right:16px;top:120px;
          background:#103E4C;padding:12px;border-radius:14px;
          min-width:170px;box-shadow:0 8px 30px #0006;">

          <button type="button" data-cma-edit="${Core.escapeHTML(postId)}"
            style="display:block;width:100%;padding:12px;text-align:left;
            background:transparent;color:white;border:0;">
            ✏️ Edit Post
          </button>

          <button type="button" data-cma-delete="${Core.escapeHTML(postId)}"
            style="display:block;width:100%;padding:12px;text-align:left;
            background:transparent;color:#ff8585;border:0;">
            🗑 Delete Post
          </button>
        </div>
      `;

      menuLayer.onclick = async (event) => {
        if (event.target.closest("[data-cma-close-menu]")) {
          menuLayer.innerHTML = "";
          return;
        }

        const edit = event.target.closest("[data-cma-edit]");
        const remove = event.target.closest("[data-cma-delete]");

        if (edit) {
          menuLayer.innerHTML = "";

          const caption = card.querySelector(".cma-post-caption");
          const currentText = caption?.textContent || "";

          const newText = window.prompt("Edit your post:", currentText);

          if (newText === null) return;

          const { error } = await db
            .from("cma_community_posts")
            .update({ content: newText.trim() })
            .eq("id", postId)
            .eq("user_id", user.id);

          if (error) {
            console.error(error);
            Core.showNotice("Post Edit করা যায়নি।", "error");
            return;
          }

          Core.showNotice("Post Updated Successfully!");

          if (window.CMACommunityMain?.loadPosts) {
            await window.CMACommunityMain.loadPosts();
          }

          if (window.CMACommunityProfile?.loadUserPosts) {
            await window.CMACommunityProfile.loadUserPosts();
          }

          return;
        }

        if (remove) {
          menuLayer.innerHTML = "";

          const confirmed = window.confirm(
            "তুমি কি নিজের এই Post Delete করতে চাও?"
          );

          if (!confirmed) return;

          window.dispatchEvent(new CustomEvent("cma:delete-post", {
            detail: { postId }
          }));
        }
      };
    },

    async openComments(postId) {
      if (!postId) return;

      this.activePostId = postId;
      this.activeReplyId = null;

      const layer = document.getElementById("cmaCommentsLayer");
      if (!layer) return;

      layer.innerHTML = `
        <div data-cma-close-comments
          style="position:fixed;inset:0;background:#0008;z-index:9998;">
        </div>

        <section id="cmaCommentsSheet"
          style="position:fixed;bottom:0;left:0;right:0;
          height:75vh;max-height:650px;z-index:9999;
          background:#073746;color:white;border-radius:20px 20px 0 0;
          padding:16px;display:flex;flex-direction:column;
          box-shadow:0 -8px 30px #0005;">

          <div style="width:42px;height:4px;background:#68DDB9;
            border-radius:10px;margin:0 auto 14px;"></div>

          <div style="display:flex;align-items:center;
            justify-content:space-between;border-bottom:1px solid #245563;
            padding-bottom:12px;">
            <strong>Comments</strong>
            <button type="button" data-cma-close-comments
              style="background:none;border:0;color:white;font-size:24px;">
              ×
            </button>
          </div>

          <div id="cmaCommentsList"
            style="flex:1;overflow-y:auto;padding:12px 0;">
            Loading comments...
          </div>

          <div style="display:flex;gap:8px;padding-top:12px;
            border-top:1px solid #245563;">
            <input id="cmaCommentInput" type="text"
              placeholder="Write a comment..."
              style="flex:1;min-width:0;border:0;outline:0;
              border-radius:20px;padding:12px;background:#103E4C;color:white;">

            <button type="button" data-cma-send-comment="${Core.escapeHTML(postId)}"
              style="border:0;border-radius:20px;padding:0 16px;
              background:#08C99A;color:#052D3B;">
              Send
            </button>
          </div>
        </section>
      `;

      layer.onclick = (event) => {
        if (event.target.closest("[data-cma-close-comments]")) {
          layer.innerHTML = "";
          this.activePostId = null;
          this.activeReplyId = null;
        }
      };

      await this.loadComments(postId);
    },

    async loadComments(postId) {
      const list = document.getElementById("cmaCommentsList");
      if (!list || !db) return;

      try {
        const { data, error } = await db
          .from("cma_community_comments")
          .select("*")
          .eq("post_id", postId)
          .order("created_at", { ascending: true });

        if (error) throw error;

        if (!data || !data.length) {
          list.innerHTML = `
            <p style="text-align:center;color:#A8C0CE;padding:30px 0;">
              No comments yet. Be the first to comment!
            </p>
          `;
          return;
        }

        const comments = data.filter(item => !item.parent_id);
        const replies = data.filter(item => item.parent_id);

        list.innerHTML = comments.map(comment => {
          const commentReplies = replies.filter(
            reply => reply.parent_id === comment.id
          );

          return `
            <div style="padding:10px 0;border-bottom:1px solid #245563;">
              <div style="background:#103E4C;border-radius:14px;padding:12px;">
                <strong>Member</strong>
                <p style="margin:6px 0;white-space:pre-wrap;">
                  ${Core.escapeHTML(comment.content)}
                </p>
              </div>

              <button type="button"
                data-cma-reply="${Core.escapeHTML(comment.id)}"
                style="background:none;border:0;color:#68DDB9;padding:8px;">
                Reply
              </button>

              ${commentReplies.map(reply => `
                <div style="margin:6px 0 6px 25px;background:#08494B;
                  border-radius:12px;padding:10px;">
                  <strong>Member</strong>
                  <p style="margin:5px 0;white-space:pre-wrap;">
                    ${Core.escapeHTML(reply.content)}
                  </p>
                </div>
              `).join("")}
            </div>
          `;
        }).join("");

      } catch (error) {
        console.error("Load comments error:", error);
        list.textContent = "Comments load করা যায়নি।";
      }
    },

    async sendComment(postId) {
      if (!Core.requireLogin()) return;

      const user = Core.getCurrentUser();
      const input = document.getElementById("cmaCommentInput");
      const content = input?.value.trim();

      if (!user || !content || !postId) return;

      try {
        const { error } = await db
          .from("cma_community_comments")
          .insert({
            post_id: postId,
            user_id: user.id,
            parent_id: this.activeReplyId,
            content
          });

        if (error) throw error;

        input.value = "";
        this.activeReplyId = null;
        input.placeholder = "Write a comment...";

        await this.loadComments(postId);

        const preview = document.querySelector(
          `[data-cma-random-comment="${CSS.escape(postId)}"]`
        );

        if (preview) {
          preview.textContent = content;
        }

        Core.showNotice("Comment added!");

      } catch (error) {
        console.error("Send comment error:", error);
        Core.showNotice("Comment পাঠানো যায়নি।", "error");
      }
    }

  };

  window.CMACommunityFeed = Feed;

})();
           
