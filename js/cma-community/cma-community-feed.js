
/* =========================================
   CHANGE MAKER ACADEMY
   COMMUNITY FEED MODULE
========================================= */

(function () {
  "use strict";

  const Core = window.CMACommunityCore;

  if (!Core) {
    console.error("Community Core is not loaded.");
    return;
  }

  const Feed = {

    // Homepage render
    async renderHome(root) {
      if (!root) root = Core.getRoot();
      if (!root) return;

      root.innerHTML = `
        <main class="cma-community">

          <!-- HEADER -->
          <header class="cma-header">
            <div class="cma-header-title">
              <span>Change Maker</span>
              <span class="cma-green">Community</span>
            </div>

            <button
              class="cma-icon-button"
              type="button"
              data-cma-action="search"
              aria-label="Search"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="10.8" cy="10.8" r="6.8"></circle>
                <path d="m16 16 5 5"></path>
              </svg>
            </button>
          </header>

          <!-- TOP NAVIGATION -->
          <nav class="cma-navigation">

            <button class="cma-nav-item active"
              data-cma-page="home">
              <span class="cma-nav-icon">⌂</span>
              <span>Home</span>
            </button>

            <button class="cma-nav-item"
              data-cma-page="profile">
              <span class="cma-nav-icon">♙</span>
              <span>Profile</span>
            </button>

            <button class="cma-nav-item"
              data-cma-page="friends">
              <span class="cma-nav-icon">♧</span>
              <span>Friends</span>
            </button>

            <button class="cma-nav-item"
              data-cma-page="creator">
              <span class="cma-nav-icon">♛</span>
              <span>Creator Panel</span>
            </button>

            <button class="cma-nav-item"
              data-cma-page="notifications">
              <span class="cma-nav-icon">♧</span>
              <span>Notification</span>
            </button>

          </nav>

          <!-- POST COMPOSER -->
          <section class="cma-composer">

            <div class="cma-composer-top">
              <div class="cma-avatar">
                ♙
              </div>

              <textarea
                class="cma-post-input"
                id="cmaPostInput"
                placeholder="What's on your mind?"
                rows="1"
                aria-label="Write a post"
              ></textarea>
            </div>

            <div class="cma-composer-bottom">

              <button
                type="button"
                class="cma-photo-button"
                data-cma-action="photo"
              >
                <span>▧</span> Photo
              </button>

              <button
                type="button"
                class="cma-post-button"
                data-cma-action="post"
              >
                Post
              </button>

            </div>
          </section>

          <!-- FEED POSTS -->
          <section
            class="cma-feed-list"
            id="cmaFeedList"
          >

            <div class="cma-empty-feed">
              <div class="cma-empty-icon">✦</div>
              <p>Welcome to Change Maker Community</p>
              <span>Community posts will appear here.</span>
            </div>

          </section>

        </main>
      `;

      this.bindEvents(root);
    },

    // Homepage interactions
    bindEvents(root) {

      if (root.dataset.cmaFeedBound === "true") return;

      root.dataset.cmaFeedBound = "true";

      root.addEventListener("click", function (event) {

        const button = event.target.closest(
          "[data-cma-action], [data-cma-page]"
        );

        if (!button || !root.contains(button)) return;

        // Navigation
        if (button.dataset.cmaPage) {

          window.dispatchEvent(
            new CustomEvent("cma:navigate", {
              detail: {
                page: button.dataset.cmaPage
              }
            })
          );

          return;
        }

        const action = button.dataset.cmaAction;

        // Search
        if (action === "search") {
          window.dispatchEvent(
            new CustomEvent("cma:open-search")
          );
          return;
        }

        // Photo selection
        if (action === "photo") {

          if (!Core.requireLogin()) return;

          window.dispatchEvent(
            new CustomEvent("cma:select-photo")
          );

          return;
        }

        // Create post
        if (action === "post") {

          if (!Core.requireLogin()) return;

          const input = root.querySelector("#cmaPostInput");
          const content = input?.value.trim();

          if (!content) {
            Core.showNotice(
              "Please write something first.",
              "error"
            );
            return;
          }

          window.dispatchEvent(
            new CustomEvent("cma:submit-post", {
              detail: {
                content: content
              }
            })
          );

        }

      });
    },

    // Reusable post card structure
    createPostCard(post) {

      const item = post || {};

      const author = Core.escapeHTML(
        item.author_name || "Member"
      );

      const caption = Core.escapeHTML(
        item.caption || ""
      );

      const time = Core.escapeHTML(
        Core.formatRelativeTime(item.created_at)
      );

      const imageURL = Core.safeImageURL(
        item.image_url
      );

      return `
        <article class="cma-post-card">

          <div class="cma-post-header">

            <div class="cma-avatar">
              ♙
            </div>

            <div class="cma-post-author">
              <strong>${author}</strong>
              <span>${time}</span>
            </div>

            <button
              class="cma-icon-button"
              type="button"
              aria-label="Post options"
              data-cma-post-menu="${Core.escapeHTML(item.id || "")}"
            >⋯</button>

          </div>

          <div class="cma-post-caption">
            ${caption}
          </div>

          ${
            imageURL
              ? `<img
                   class="cma-post-image"
                   src="${imageURL}"
                   alt="Post image"
                   loading="lazy"
                 >`
              : ""
          }

          <div class="cma-reactions">
            <button type="button" data-reaction="like">👍</button>
            <button type="button" data-reaction="love">❤️</button>
            <button type="button" data-reaction="haha">😂</button>
            <button type="button" data-reaction="wow">😮</button>
          </div>

          <div class="cma-comment-preview">
            Comments will appear here.
          </div>

          <button
            class="cma-view-comments"
            type="button"
            data-cma-comments="${Core.escapeHTML(item.id || "")}"
          >
            View all comments
          </button>

          <div class="cma-comment-input">
            <input
              type="text"
              placeholder="Write a comment..."
              aria-label="Write a comment"
            >
            <button type="button" aria-label="Send comment">
              ➤
            </button>
          </div>

        </article>
      `;
    }

  };

  window.CMACommunityFeed = Feed;

})();
