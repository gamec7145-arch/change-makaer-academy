
/* =========================================
   CHANGE MAKER ACADEMY
   COMMUNITY FEED MODULE
   SVG ICONS + EXISTING ACTIONS
========================================= */

(function () {
  "use strict";

  const Core = window.CMACommunityCore;

  if (!Core) {
    console.error("Community Core is not loaded.");
    return;
  }

  // Professional outline SVG icons
  const Icons = {

    home: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m3 10 9-7 9 7"></path>
        <path d="M5 9v12h14V9"></path>
        <path d="M9 21v-7h6v7"></path>
      </svg>
    `,

    profile: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="8" r="4"></circle>
        <path d="M4 21a8 8 0 0 1 16 0"></path>
      </svg>
    `,

    friends: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M20 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    `,

    creator: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="3" width="8" height="8" rx="1.5"></rect>
        <rect x="13" y="3" width="8" height="5" rx="1.5"></rect>
        <rect x="13" y="10" width="8" height="11" rx="1.5"></rect>
        <rect x="3" y="13" width="8" height="8" rx="1.5"></rect>
      </svg>
    `,

    notification: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path>
        <path d="M10 21h4"></path>
      </svg>
    `,

    search: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="10.8" cy="10.8" r="6.8"></circle>
        <path d="m16 16 5 5"></path>
      </svg>
    `
  };


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
              ${Icons.search}
            </button>

          </header>


          <!-- TOP NAVIGATION -->
          <nav class="cma-navigation" aria-label="Community navigation">

            <button
              class="cma-nav-item active"
              type="button"
              data-cma-page="home"
              aria-current="page"
            >
              <span class="cma-nav-icon">
                ${Icons.home}
              </span>
              <span>Home</span>
            </button>


            <button
              class="cma-nav-item"
              type="button"
              data-cma-page="profile"
            >
              <span class="cma-nav-icon">
                ${Icons.profile}
              </span>
              <span>Profile</span>
            </button>


            <button
              class="cma-nav-item"
              type="button"
              data-cma-page="friends"
            >
              <span class="cma-nav-icon">
                ${Icons.friends}
              </span>
              <span>Friends</span>
            </button>


            <button
              class="cma-nav-item"
              type="button"
              data-cma-page="creator"
            >
              <span class="cma-nav-icon">
                ${Icons.creator}
              </span>
              <span>Creator Panel</span>
            </button>


            <button
              class="cma-nav-item"
              type="button"
              data-cma-page="notifications"
            >
              <span class="cma-nav-icon">
                ${Icons.notification}
              </span>
              <span>Notification</span>
            </button>

          </nav>


          <!-- POST COMPOSER -->
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

              <button
                type="button"
                class="cma-photo-button"
                data-cma-action="photo"
              >
                <span aria-hidden="true">▧</span>
                Photo
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

          const page = button.dataset.cmaPage;

          window.dispatchEvent(
            new CustomEvent("cma:navigate", {
              detail: {
                page: page
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

            <div class="cma-avatar"></div>

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

            <button
              type="button"
              aria-label="Send comment"
            >
              ➤
            </button>

          </div>

        </article>
      `;
    }

  };


  window.CMACommunityFeed = Feed;

})();
