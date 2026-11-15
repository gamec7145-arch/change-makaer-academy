/* CHANGE MAKER ACADEMY
   COMMUNITY FEED MODULE
   UPDATED VERSION — PART 1 OF 2
*/

(function () {
  "use strict";

  const Core = window.CMACommunityCore;
  const Feed = {};
  const db = Core ? Core.db : window.cmaSupabase;

  const Icons = {
    home: "⌂",
    profile: "♙",
    friends: "♧",
    creator: "✦",
    notification: "♧",
    search: "⌕",
    more: "⋯",
    close: "×",
    comment: "▢",
    photo: "▧"
  };

  function escapeHTML(value) {
    if (Core && typeof Core.escapeHTML === "function") {
      return Core.escapeHTML(value ?? "");
    }

    return String(value ?? "").replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[char];
    });
  }

  function getCurrentUser() {
    return Core && typeof Core.getCurrentUser === "function"
      ? Core.getCurrentUser()
      : null;
  }

  function safeImage(url) {
    if (!url) return "";

    if (Core && typeof Core.safeImageURL === "function") {
      return Core.safeImageURL(url);
    }

    try {
      const parsed = new URL(url, window.location.origin);
      return ["http:", "https:"].includes(parsed.protocol)
        ? parsed.href
        : "";
    } catch (error) {
      return "";
    }
  }

  function avatarHTML(url, name, className) {
    const image = safeImage(url);
    const label = escapeHTML(name || "Community Member");

    if (image) {
      return `
        <img
          class="${className || "cma-avatar"}"
          src="${escapeHTML(image)}"
          alt="${label}"
          loading="lazy"
          onerror="this.style.display='none';"
        >
      `;
    }

    const initial = label.trim().charAt(0).toUpperCase() || "C";

    return `
      <span class="${className || "cma-avatar"} cma-avatar-fallback">
        ${initial}
      </span>
    `;
  }

  function openMemberProfile(userId) {
    if (!userId) return;

    window.dispatchEvent(
      new CustomEvent("cma:navigate", {
        detail: {
          page: "profile",
          userId: userId
        }
      })
    );
  }

  function authorButton(userId, name) {
    if (!userId) {
      return `<strong>${escapeHTML(name || "Community Member")}</strong>`;
    }

    return `
      <button
        type="button"
        class="cma-author-link"
        data-cma-profile-user="${escapeHTML(userId)}"
      >
        ${escapeHTML(name || "Community Member")}
      </button>
    `;
  }

  Feed.renderHome = function (root) {
    if (!root) return;

    root.innerHTML = `
      <main class="cma-community-home">

        <section class="cma-post-composer">
          <textarea
            id="cmaPostInput"
            placeholder="What's on your mind?"
            rows="2"
          ></textarea>

          <div id="cmaSelectedPhoto"></div>

          <div class="cma-composer-actions">
            <button
              type="button"
              data-cma-action="photo"
            >
              ${Icons.photo} Photo
            </button>

            <button
              type="button"
              data-cma-action="post"
            >
              Post
            </button>
          </div>
        </section>

        <input
          type="file"
          id="cmaFeedPhotoInput"
          accept="image/*"
          hidden
        >

        <section id="cmaFeedList"></section>

        <div
          id="cmaPostMenuLayer"
          class="cma-post-menu-layer"
          hidden
        ></div>

        <div
          id="cmaCommentsLayer"
          class="cma-comments-layer"
          hidden
        ></div>

      </main>
    `;

    Feed.bindEvents(root);
  };

  Feed.bindEvents = function (root) {
    if (!root || root.dataset.cmaFeedBound === "true") return;

    root.dataset.cmaFeedBound = "true";

    root.addEventListener("click", async function (event) {
      const profileButton = event.target.closest(
        "[data-cma-profile-user]"
      );

      if (profileButton) {
        event.preventDefault();
        event.stopPropagation();

        openMemberProfile(
          profileButton.dataset.cmaProfileUser
        );

        return;
      }

      const actionButton = event.target.closest("[data-cma-action]");

      if (actionButton) {
        const action = actionButton.dataset.cmaAction;

        if (action === "photo") {
          const picker = root.querySelector("#cmaFeedPhotoInput");
          if (picker) picker.click();
          return;
        }

        if (action === "post") {
          const input = root.querySelector("#cmaPostInput");

          window.dispatchEvent(
            new CustomEvent("cma:submit-post", {
              detail: {
                content: input ? input.value.trim() : ""
              }
            })
          );

          return;
        }
      }

      const reactionButton = event.target.closest(
        "[data-cma-reaction]"
      );

      if (reactionButton) {
        await Feed.toggleReaction(
          reactionButton.dataset.postId,
          reactionButton.dataset.cmaReaction
        );
        return;
      }

      const commentButton = event.target.closest(
        "[data-cma-comments]"
      );

      if (commentButton) {
        Feed.openComments(commentButton.dataset.cmaComments);
        return;
      }

      const replyButton = event.target.closest(
        "[data-cma-reply]"
      );

      if (replyButton) {
        Feed.showReplyInput(
          replyButton.dataset.cmaReply,
          replyButton.dataset.parentName || ""
        );
        return;
      }

      const sendButton = event.target.closest(
        "[data-cma-send-comment]"
      );

      if (sendButton) {
        await Feed.sendComment(
          sendButton.dataset.postId,
          sendButton.dataset.parentId || null
        );
        return;
      }

      const menuButton = event.target.closest(
        "[data-cma-post-menu]"
      );

      if (menuButton) {
        Feed.openPostMenu(menuButton.dataset.cmaPostMenu);
        return;
      }

      const closeButton = event.target.closest(
        "[data-cma-close-comments]"
      );

      if (closeButton) {
        const layer = root.querySelector("#cmaCommentsLayer");
        if (layer) layer.hidden = true;
        return;
      }
    });

    root.addEventListener("change", function (event) {
      if (event.target.id === "cmaFeedPhotoInput") {
        Feed.showSelectedPhoto(event.target.files?.[0]);
      }
    });
  };

  Feed.showSelectedPhoto = function (file) {
    const preview = document.getElementById("cmaSelectedPhoto");
    if (!preview || !file) return;

    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();

    reader.onload = function () {
      preview.innerHTML = `
        <img
          src="${reader.result}"
          class="cma-selected-photo-preview"
          alt="Selected photo"
        >
        <button
          type="button"
          data-cma-action="remove-photo"
        >
          Remove
        </button>
      `;
    };

    reader.readAsDataURL(file);
  };

  Feed.createPostCard = function (item) {
    if (!item) return "";

    const user = getCurrentUser();
    const isOwner = user && user.id === item.user_id;

    const authorName =
      item.author_name || "Community Member";

    const avatar = avatarHTML(
      item.avatar_url,
      authorName,
      "cma-post-avatar"
    );

    const image = safeImage(item.image_url);

    return `
      <article
        class="cma-post-card"
        data-post-id="${escapeHTML(item.id)}"
      >

        <header class="cma-post-header">

          ${avatar}

          <div class="cma-post-author-info">
            ${authorButton(item.user_id, authorName)}

            <time>
              ${escapeHTML(
                item.created_at
                  ? Core.formatRelativeTime(item.created_at)
                  : ""
              )}
            </time>
          </div>

          ${
            isOwner
              ? `
                <button
                  type="button"
                  class="cma-post-more"
                  data-cma-post-menu="${escapeHTML(item.id)}"
                  aria-label="Post options"
                >
                  ${Icons.more}
                </button>
              `
              : ""
          }

        </header>

        ${
          item.caption || item.content
            ? `
              <div class="cma-post-caption">
                ${escapeHTML(item.caption || item.content)}
              </div>
            `
            : ""
        }

        ${
          image
            ? `
              <img
                class="cma-post-image"
                src="${escapeHTML(image)}"
                alt="Community post image"
                loading="lazy"
              >
            `
            : ""
        }

        <div class="cma-post-reactions">

          <button
            type="button"
            data-cma-reaction="like"
            data-post-id="${escapeHTML(item.id)}"
            aria-label="Like"
          >👍</button>

          <button
            type="button"
            data-cma-reaction="love"
            data-post-id="${escapeHTML(item.id)}"
            aria-label="Love"
          >❤️</button>

          <button
            type="button"
            data-cma-reaction="haha"
            data-post-id="${escapeHTML(item.id)}"
            aria-label="Haha"
          >😂</button>

          <button
            type="button"
            data-cma-reaction="wow"
            data-post-id="${escapeHTML(item.id)}"
            aria-label="Wow"
          >😮</button>

        </div>

        <div
          class="cma-post-comment-preview"
          id="cmaCommentPreview-${escapeHTML(item.id)}"
        ></div>

        <button
          type="button"
          class="cma-view-comments"
          data-cma-comments="${escapeHTML(item.id)}"
        >
          View all comments
        </button>

        <button
          type="button"
          class="cma-write-comment"
          data-cma-comments="${escapeHTML(item.id)}"
        >
          Write a comment...
        </button>

      </article>
    `;
  };
   /* CHANGE MAKER ACADEMY
   COMMUNITY FEED MODULE
   UPDATED VERSION — PART 2 OF 2
*/

  Feed.toggleReaction = async function (postId, reactionType) {
    if (!db || !postId || !reactionType) return;

    const user = getCurrentUser();

    if (!user) {
      if (Core && Core.requireLogin) Core.requireLogin();
      return;
    }

    try {
      const { data: existing, error: findError } = await db
        .from("cma_community_reactions")
        .select("id,reaction_type")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (findError) throw findError;

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
          .upsert(
            {
              post_id: postId,
              user_id: user.id,
              reaction_type: reactionType
            },
            {
              onConflict: "post_id,user_id"
            }
          );

        if (error) throw error;
      }

      // Reaction count বা reactor list এখানে দেখানো হবে না।
      // এগুলোর access Supabase RLS দিয়েও নিয়ন্ত্রণ করতে হবে।

    } catch (error) {
      console.error("Reaction error:", error);

      if (Core && Core.showNotice) {
        Core.showNotice("Reaction দিতে সমস্যা হয়েছে।");
      }
    }
  };


  Feed.loadReactionCounts = async function () {
    // Reaction count UI-তে দেখানো হবে না।
    // Reactor identity প্রকাশ করে এমন query এখানে করা হচ্ছে না।
    return;
  };


  Feed.loadRandomComment = async function (postId) {
    if (!db || !postId) return;

    const preview = document.getElementById(
      "cmaCommentPreview-" + postId
    );

    if (!preview) return;

    try {
      const { data, error } = await db
        .from("cma_community_comments")
        .select("id,user_id,content,created_at")
        .eq("post_id", postId)
        .is("parent_id", null)
        .order("created_at", { ascending: false })
        .limit(2);

      if (error) throw error;

      if (!data || !data.length) {
        preview.innerHTML = "";
        return;
      }

      const userIds = [
        ...new Set(data.map(item => item.user_id).filter(Boolean))
      ];

      let profiles = {};

      if (userIds.length) {
        const { data: profileRows } = await db
          .from("cma_community_profiles")
          .select("user_id,full_name,avatar_url")
          .in("user_id", userIds);

        (profileRows || []).forEach(profile => {
          profiles[profile.user_id] = profile;
        });
      }

      preview.innerHTML = data.map(comment => {
        const profile = profiles[comment.user_id] || {};
        const name = profile.full_name || "Community Member";

        return `
          <div class="cma-comment-preview-item">
            ${avatarHTML(
              profile.avatar_url,
              name,
              "cma-comment-avatar"
            )}

            <div class="cma-comment-preview-content">
              ${authorButton(comment.user_id, name)}
              <span>${escapeHTML(comment.content)}</span>
            </div>
          </div>
        `;
      }).join("");

    } catch (error) {
      console.error("Comment preview error:", error);
    }
  };


  Feed.openPostMenu = function (postId) {
    const layer = document.getElementById("cmaPostMenuLayer");
    const user = getCurrentUser();

    if (!layer || !user || !postId) return;

    layer.hidden = false;

    layer.innerHTML = `
      <div class="cma-post-menu-box">
        <button
          type="button"
          data-cma-edit-post="${escapeHTML(postId)}"
        >
          Edit Post
        </button>

        <button
          type="button"
          data-cma-delete-post="${escapeHTML(postId)}"
        >
          Delete Post
        </button>

        <button
          type="button"
          data-cma-close-post-menu
        >
          Cancel
        </button>
      </div>
    `;

    layer.onclick = async function (event) {
      if (
        event.target === layer ||
        event.target.closest("[data-cma-close-post-menu]")
      ) {
        layer.hidden = true;
        return;
      }

      const deleteButton = event.target.closest(
        "[data-cma-delete-post]"
      );

      if (deleteButton) {
        const id = deleteButton.dataset.cmaDeletePost;

        if (!confirm("Are you sure you want to delete this post?")) {
          return;
        }

        try {
          const { error } = await db
            .from("cma_community_posts")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id);

          if (error) throw error;

          layer.hidden = true;

          window.dispatchEvent(
            new CustomEvent("cma:refresh-feed")
          );

          const card = document.querySelector(
            `[data-post-id="${id}"]`
          );

          if (card) card.remove();

        } catch (error) {
          console.error("Delete post error:", error);
          alert("Post delete করা যায়নি।");
        }

        return;
      }

      const editButton = event.target.closest(
        "[data-cma-edit-post]"
      );

      if (editButton) {
        const id = editButton.dataset.cmaEditPost;

        try {
          const { data: post, error } = await db
            .from("cma_community_posts")
            .select("id,user_id,content")
            .eq("id", id)
            .eq("user_id", user.id)
            .single();

          if (error) throw error;

          const updatedContent = prompt(
            "Edit your post:",
            post.content || ""
          );

          if (updatedContent === null) return;

          const { error: updateError } = await db
            .from("cma_community_posts")
            .update({
              content: updatedContent.trim()
            })
            .eq("id", id)
            .eq("user_id", user.id);

          if (updateError) throw updateError;

          layer.hidden = true;

          window.dispatchEvent(
            new CustomEvent("cma:refresh-feed")
          );

          const card = document.querySelector(
            `[data-post-id="${id}"]`
          );

          if (card) {
            const caption = card.querySelector(".cma-post-caption");

            if (caption) {
              caption.textContent = updatedContent.trim();
            }
          }

        } catch (error) {
          console.error("Edit post error:", error);
          alert("Post edit করা যায়নি।");
        }
      }
    };
  };


  Feed.openComments = async function (postId) {
    const layer = document.getElementById("cmaCommentsLayer");

    if (!layer || !postId) return;

    layer.hidden = false;

    layer.innerHTML = `
      <div class="cma-comments-backdrop"
           data-cma-close-comments></div>

      <section class="cma-comments-sheet">

        <header class="cma-comments-header">
          <strong>Comments</strong>

          <button
            type="button"
            data-cma-close-comments
            aria-label="Close comments"
          >
            ×
          </button>
        </header>

        <div
          class="cma-comments-list"
          id="cmaCommentsList"
        >
          <p>Loading comments...</p>
        </div>

        <div class="cma-comment-input-area">
          <textarea
            id="cmaCommentInput"
            placeholder="Write a comment..."
            rows="1"
          ></textarea>

          <button
            type="button"
            data-cma-send-comment
            data-post-id="${escapeHTML(postId)}"
          >
            Send
          </button>
        </div>

      </section>
    `;

    await Feed.loadComments(postId);
  };


  Feed.formatCommentTime = function (date) {
    if (!date) return "";

    try {
      return new Date(date).toLocaleString("en-BD", {
        dateStyle: "medium",
        timeStyle: "short"
      });
    } catch (error) {
      return "";
    }
  };


  Feed.loadComments = async function (postId) {
    const list = document.getElementById("cmaCommentsList");

    if (!list || !db) return;

    list.innerHTML = "<p>Loading comments...</p>";

    try {
      const { data: comments, error } = await db
        .from("cma_community_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (!comments || !comments.length) {
        list.innerHTML = `
          <p class="cma-no-comments">
            No comments yet. Be the first to comment.
          </p>
        `;
        return;
      }

      const userIds = [
        ...new Set(
          comments.map(comment => comment.user_id).filter(Boolean)
        )
      ];

      let profiles = {};

      if (userIds.length) {
        const { data: profileRows, error: profileError } = await db
          .from("cma_community_profiles")
          .select("user_id,full_name,avatar_url")
          .in("user_id", userIds);

        if (profileError) {
          console.error("Comment profile loading error:", profileError);
        }

        (profileRows || []).forEach(profile => {
          profiles[profile.user_id] = profile;
        });
      }

      const currentUser = getCurrentUser();

      function getCommentAuthor(comment) {
        const profile = profiles[comment.user_id] || {};

        let name = profile.full_name || "Community Member";
        let avatar = profile.avatar_url || "";

        if (currentUser && currentUser.id === comment.user_id) {
          const metadata = currentUser.user_metadata || {};

          name =
            profile.full_name ||
            metadata.full_name ||
            metadata.name ||
            currentUser.email ||
            name;

          avatar =
            profile.avatar_url ||
            metadata.avatar_url ||
            metadata.picture ||
            "";
        }

        return { name, avatar };
      }

      const commentMap = {};
      const rootComments = [];

      comments.forEach(comment => {
        comment.children = [];
        commentMap[comment.id] = comment;
      });

      comments.forEach(comment => {
        if (
          comment.parent_id &&
          commentMap[comment.parent_id]
        ) {
          commentMap[comment.parent_id].children.push(comment);
        } else {
          rootComments.push(comment);
        }
      });

      function renderComment(comment, depth) {
        const author = getCommentAuthor(comment);
        const createdTime = Feed.formatCommentTime(
          comment.created_at
        );

        const updatedTime =
          comment.updated_at &&
          comment.created_at &&
          new Date(comment.updated_at).getTime() >
          new Date(comment.created_at).getTime() + 1000
            ? `
              <span class="cma-comment-edited">
                · Edited ${escapeHTML(
                  Feed.formatCommentTime(comment.updated_at)
                )}
              </span>
            `
            : "";

        const replies = comment.children.map(child => {
          return renderComment(child, depth + 1);
        }).join("");

        return `
          <article
            class="cma-comment-item"
            style="margin-left:${Math.min(depth * 22, 66)}px"
            data-comment-id="${escapeHTML(comment.id)}"
          >

            <div class="cma-comment-row">

              ${avatarHTML(
                author.avatar,
                author.name,
                "cma-comment-avatar"
              )}

              <div class="cma-comment-body">

                <div class="cma-comment-bubble">
                  ${authorButton(comment.user_id, author.name)}

                  <div class="cma-comment-text">
                    ${escapeHTML(comment.content)}
                  </div>
                </div>

                <div class="cma-comment-meta">

                  <time>
                    ${escapeHTML(createdTime)}
                  </time>

                  ${updatedTime}

                  <button
                    type="button"
                    data-cma-reply="${escapeHTML(comment.id)}"
                    data-parent-name="${escapeHTML(author.name)}"
                  >
                    Reply
                  </button>

                </div>

              </div>
            </div>

            <div
              class="cma-comment-replies"
              id="cmaReplies-${escapeHTML(comment.id)}"
            >
              ${replies}
            </div>

          </article>
        `;
      }

      list.innerHTML = rootComments.map(comment => {
        return renderComment(comment, 0);
      }).join("");

    } catch (error) {
      console.error("Load comments error:", error);

      list.innerHTML = `
        <p class="cma-comment-error">
          Comments load করা যায়নি। আবার চেষ্টা করো।
        </p>
      `;
    }
  };


  Feed.showReplyInput = function (parentId, parentName) {
    const list = document.getElementById("cmaCommentsList");

    if (!list) return;

    const oldInput = list.querySelector(".cma-reply-input-area");

    if (oldInput) oldInput.remove();

    const parent = document.getElementById(
      "cmaReplies-" + parentId
    );

    if (!parent) return;

    parent.insertAdjacentHTML(
      "beforeend",
      `
        <div class="cma-reply-input-area">

          <textarea
            id="cmaReplyInput"
            rows="1"
            placeholder="Reply to ${escapeHTML(parentName)}..."
          ></textarea>

          <button
            type="button"
            data-cma-send-comment
            data-post-id="${escapeHTML(
              document.querySelector(
                "[data-cma-send-comment]"
              )?.dataset.postId || ""
            )}"
            data-parent-id="${escapeHTML(parentId)}"
          >
            Reply
          </button>

        </div>
      `
    );

    const input = parent.querySelector("#cmaReplyInput");

    if (input) input.focus();
  };


  Feed.sendComment = async function (postId, parentId) {
    if (!db || !postId) return;

    const user = getCurrentUser();

    if (!user) {
      if (Core && Core.requireLogin) Core.requireLogin();
      return;
    }

    const inputId = parentId
      ? "cmaReplyInput"
      : "cmaCommentInput";

    const input = document.getElementById(inputId);

    if (!input) return;

    const content = input.value.trim();

    if (!content) return;

    try {
      const { error } = await db
        .from("cma_community_comments")
        .insert({
          post_id: postId,
          user_id: user.id,
          parent_id: parentId || null,
          content: content
        });

      if (error) throw error;

      input.value = "";

      await Feed.loadComments(postId);
      await Feed.loadRandomComment(postId);

      window.dispatchEvent(
        new CustomEvent("cma:comment-created", {
          detail: {
            postId: postId,
            parentId: parentId || null
          }
        })
      );

    } catch (error) {
      console.error("Send comment error:", error);

      if (Core && Core.showNotice) {
        Core.showNotice("Comment পাঠানো যায়নি।");
      } else {
        alert("Comment পাঠানো যায়নি।");
      }
    }
  };


  // Remove selected photo
  document.addEventListener("click", function (event) {
    const removeButton = event.target.closest(
      '[data-cma-action="remove-photo"]'
    );

    if (!removeButton) return;

    const preview = document.getElementById("cmaSelectedPhoto");
    const picker = document.getElementById("cmaFeedPhotoInput");

    if (preview) preview.innerHTML = "";
    if (picker) picker.value = "";

    window.dispatchEvent(
      new CustomEvent("cma:remove-photo")
    );
  });


  // Refresh comment preview when comments are updated
  window.addEventListener("cma:comment-created", function (event) {
    const postId = event.detail?.postId;

    if (postId) {
      Feed.loadRandomComment(postId);
    }
  });


  window.CMACommunityFeed = Feed;

})();
