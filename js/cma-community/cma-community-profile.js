
/* =========================================
   CHANGE MAKER ACADEMY
   COMMUNITY PROFILE MODULE
   FIXED COMPLETE VERSION - PART 1 OF 2
========================================= */

(function () {
  "use strict";

  const Core = window.CMACommunityCore;
  const db = window.cmaSupabase;

  let activeTab = "posts";
  let lastRenderedRoot = null;
  let lastRenderedUser = null;

  const Icons = {
    home: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7"></path><path d="M5 9v12h14V9"></path><path d="M9 21v-7h6v7"></path></svg>`,
    profile: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"></circle><path d="M4 21a8 8 0 0 1 16 0"></path></svg>`,
    friends: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M20 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
    creator: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="8" height="8" rx="1.5"></rect><rect x="13" y="3" width="8" height="5" rx="1.5"></rect><rect x="13" y="10" width="8" height="11" rx="1.5"></rect><rect x="3" y="13" width="8" height="8" rx="1.5"></rect></svg>`,
    notification: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path><path d="M10 21h4"></path></svg>`,
    search: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"></circle><path d="m16 16 5 5"></path></svg>`
  };

  function escape(value) {
    if (Core && Core.escapeHTML) {
      return Core.escapeHTML(String(value ?? ""));
    }

    return String(value ?? "").replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[char];
    });
  }

  function safeImage(url) {
    if (!url) return "";

    try {
      const parsed = new URL(url);

      if (parsed.protocol === "https:" || parsed.protocol === "http:") {
        return escape(parsed.href);
      }
    } catch (error) {}

    return "";
  }

  function getUser() {
    return Core && Core.getCurrentUser
      ? Core.getCurrentUser()
      : null;
  }

  function getMetadata(user) {
    return user && user.user_metadata
      ? user.user_metadata
      : {};
  }

  function getAvatar(user) {
    const metadata = getMetadata(user);
    return safeImage(metadata.avatar_url || metadata.picture || "");
  }

  function showNotice(message, type) {
    if (Core && Core.showNotice) {
      Core.showNotice(message, type || "info");
    } else {
      alert(message);
    }
  }

  function renderNavigation() {
    return `
      <header class="cma-header">
        <div class="cma-header-title">
          <span>Change Maker</span>
          <span class="cma-green">Community</span>
        </div>

        <button class="cma-icon-button"
          type="button"
          data-cma-profile-action="search"
          aria-label="Search">
          ${Icons.search}
        </button>
      </header>

      <nav class="cma-navigation" aria-label="Community navigation">

        <button class="cma-nav-item"
          type="button" data-cma-profile-page="home">
          <span class="cma-nav-icon">${Icons.home}</span>
          <span>Home</span>
        </button>

        <button class="cma-nav-item active"
          type="button" data-cma-profile-page="profile"
          aria-current="page">
          <span class="cma-nav-icon">${Icons.profile}</span>
          <span>Profile</span>
        </button>

        <button class="cma-nav-item"
          type="button" data-cma-profile-page="friends">
          <span class="cma-nav-icon">${Icons.friends}</span>
          <span>Friends</span>
        </button>

        <button class="cma-nav-item"
          type="button" data-cma-profile-page="creator">
          <span class="cma-nav-icon">${Icons.creator}</span>
          <span>Creator Panel</span>
        </button>

        <button class="cma-nav-item"
          type="button" data-cma-profile-page="notifications">
          <span class="cma-nav-icon">${Icons.notification}</span>
          <span>Notification</span>
        </button>

      </nav>
    `;
  }

  function injectStyles() {
    if (document.getElementById("cma-profile-styles")) return;

    const style = document.createElement("style");
    style.id = "cma-profile-styles";

    style.textContent = `
      .cma-profile {
        width: 100%;
        color: #fff;
      }

      .cma-profile-cover {
        position: relative;
        height: 155px;
        margin-bottom: 55px;
        border-radius: 16px;
        overflow: visible;
        cursor: pointer;
        background: linear-gradient(135deg,#08494B,#052D3B,#08C99A);
      }

      .cma-profile-cover > img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 16px;
        pointer-events: none;
      }

      .cma-profile-avatar {
        position: absolute;
        left: 17px;
        bottom: -43px;
        z-index: 2;
        width: 86px;
        height: 86px;
        border: 4px solid #073746;
        border-radius: 50%;
        background: #103E4C;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        font-size: 35px;
        cursor: pointer;
      }

      .cma-profile-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        pointer-events: none;
      }

      .cma-profile-photo-edit,
      .cma-profile-cover-edit {
        display: none !important;
      }

      .cma-profile-heading {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 10px;
        margin: 0 2px 17px;
      }

      .cma-profile-name {
        font-size: 19px;
        font-weight: 800;
        overflow-wrap: anywhere;
      }

      .cma-profile-id {
        color: #A8C0CE;
        font-size: 11px;
        margin-top: 4px;
      }

      .cma-profile-description {
        color: #A8C0CE;
        font-size: 12px;
        line-height: 1.5;
        margin-top: 6px;
      }

      .cma-profile-edit {
        border: 1px solid #245563;
        border-radius: 20px;
        padding: 8px 12px;
        background: #08494B;
        color: #68DDB9;
        font-family: inherit;
        font-size: 11px;
        font-weight: 700;
        white-space: nowrap;
        cursor: pointer;
      }

      .cma-profile-section {
        background: #08494B;
        border-radius: 15px;
        padding: 14px;
        margin-bottom: 14px;
      }

      .cma-profile-section-title {
        font-size: 14px;
        font-weight: 800;
        margin-bottom: 12px;
      }

      .cma-profile-info-row {
        padding: 9px 0;
        border-bottom: 1px solid #245563;
        font-size: 12px;
        overflow-wrap: anywhere;
      }

      .cma-profile-info-row:last-child {
        border-bottom: 0;
      }

      .cma-profile-info-label {
        color: #A8C0CE;
        display: block;
        font-size: 10px;
        margin-bottom: 4px;
      }

      .cma-profile-tabs {
        display: flex;
        justify-content: space-between;
        gap: 4px;
        border-bottom: 1px solid #245563;
        margin: 15px 0;
      }

      .cma-profile-tab {
        flex: 1;
        padding: 11px 2px;
        border: 0;
        border-bottom: 2px solid transparent;
        background: transparent;
        color: #A8C0CE;
        font-family: inherit;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
      }

      .cma-profile-tab.active {
        color: #08C99A;
        border-bottom-color: #08C99A;
      }

      .cma-profile-empty {
        padding: 28px 12px;
        text-align: center;
        color: #A8C0CE;
        font-size: 12px;
      }

      .cma-profile-modal {
        position: fixed;
        inset: 0;
        z-index: 10000;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 16px;
        background: #000b;
      }

      .cma-profile-modal.show {
        display: flex;
      }

      .cma-profile-modal-content {
        width: 100%;
        max-width: 430px;
        max-height: 85vh;
        overflow-y: auto;
        padding: 18px;
        border-radius: 17px;
        background: #073746;
        border: 1px solid #245563;
      }

      .cma-profile-modal-title {
        font-size: 17px;
        font-weight: 800;
        margin-bottom: 16px;
      }

      .cma-profile-field {
        display: block;
        width: 100%;
        margin-bottom: 13px;
      }

      .cma-profile-field span {
        display: block;
        color: #A8C0CE;
        font-size: 11px;
        margin-bottom: 6px;
      }

      .cma-profile-field input,
      .cma-profile-field textarea {
        width: 100%;
        box-sizing: border-box;
        padding: 11px;
        border: 1px solid #245563;
        border-radius: 10px;
        outline: none;
        background: #052D3B;
        color: #fff;
        font-family: inherit;
        font-size: 13px;
      }

      .cma-profile-field textarea {
        min-height: 75px;
        resize: vertical;
      }

      .cma-profile-save {
        width: 100%;
        padding: 12px;
        border: 0;
        border-radius: 22px;
        background: #08C99A;
        color: #052D3B;
        font-family: inherit;
        font-size: 13px;
        font-weight: 800;
        cursor: pointer;
      }

      .cma-profile-save:disabled {
        opacity: .6;
      }

      .cma-profile-cancel {
        width: 100%;
        padding: 10px;
        margin-top: 7px;
        border: 0;
        background: transparent;
        color: #A8C0CE;
        font-family: inherit;
        cursor: pointer;
      }

      .cma-profile-file-input {
        display: none !important;
      }

      .cma-profile .cma-composer {
        margin-bottom: 15px;
      }

      .cma-profile .cma-composer .cma-avatar {
        flex-shrink: 0;
        overflow: hidden;
      }

      .cma-profile .cma-composer .cma-avatar img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
      }

      .cma-profile-photo-preview {
        display: none;
        padding: 0 12px 12px;
      }

      .cma-profile-photo-preview.show {
        display: block;
      }

      .cma-profile-photo-preview img {
        display: block;
        width: auto;
        max-width: 100%;
        max-height: 220px;
        object-fit: contain;
        border-radius: 12px;
      }

      .cma-profile-photo-remove {
        margin-top: 7px;
        padding: 6px 10px;
        border: 1px solid #245563;
        border-radius: 16px;
        background: #052D3B;
        color: #A8C0CE;
        font-size: 11px;
        cursor: pointer;
      }

      .cma-profile-posts {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
    `;

    document.head.appendChild(style);
  }

  function renderProfileContent(user, isOwnProfile) {
    const metadata = getMetadata(user);

    const name = metadata.full_name ||
      metadata.display_name || "Community Member";

    const description = metadata.short_description || "";
    const institution = metadata.institution || "";
    const mobile = metadata.mobile_number ||
      metadata.phone_number || "";
    const address = metadata.address || "";

    const avatar = getAvatar(user);
    const cover = safeImage(metadata.cover_url);

    return `
      <div class="cma-profile">

        <div class="cma-profile-cover" id="cmaCoverArea">
          ${cover ? `<img src="${cover}" alt="Cover photo">` : ""}

          <div class="cma-profile-avatar" id="cmaAvatarArea">
            ${avatar
              ? `<img src="${avatar}" alt="Profile photo">`
              : "👤"}
          </div>
        </div>

        ${isOwnProfile ? `
          <input class="cma-profile-file-input"
            type="file" id="cmaAvatarFile"
            accept="image/jpeg,image/png,image/webp">

          <input class="cma-profile-file-input"
            type="file" id="cmaCoverFile"
            accept="image/jpeg,image/png,image/webp">
        ` : ""}

        <div class="cma-profile-heading">
          <div>
            <div class="cma-profile-name">${escape(name)}</div>
            <div class="cma-profile-id">
              Member ID: ${escape(user.id || "")}
            </div>
            <div class="cma-profile-description">
              ${escape(description || "Welcome to Change Maker Community.")}
            </div>
          </div>

          ${isOwnProfile ? `
            <button class="cma-profile-edit"
              id="cmaEditProfile" type="button">
              Edit
            </button>
          ` : ""}
        </div>

        <section class="cma-profile-section">
          <div class="cma-profile-section-title">
            Personal Information
          </div>

          <div class="cma-profile-info-row">
            <span class="cma-profile-info-label">Institution</span>
            ${escape(institution || "Not added yet")}
          </div>

          ${isOwnProfile ? `
            <div class="cma-profile-info-row">
              <span class="cma-profile-info-label">Mobile Number</span>
              ${escape(mobile || "Not added yet")}
            </div>

            <div class="cma-profile-info-row">
              <span class="cma-profile-info-label">Address</span>
              ${escape(address || "Not added yet")}
            </div>
          ` : ""}
        </section>

        ${isOwnProfile ? `
        <section class="cma-composer">

          <div class="cma-composer-top">
            <div class="cma-avatar">
              ${avatar
                ? `<img src="${avatar}" alt="Your profile picture">`
                : "👤"}
            </div>

            <textarea
              class="cma-post-input"
              id="cmaPostInput"
              placeholder="What's on your mind?"
              rows="1"
              aria-label="Write a post"
            ></textarea>
          </div>

          <div id="cmaSelectedPhoto" class="cma-selected-photo"></div>

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
        ` : ""}

        <div class="cma-profile-tabs">
          <button class="cma-profile-tab active"
            data-tab="posts" type="button">Posts</button>

          <button class="cma-profile-tab"
            data-tab="photos" type="button">Photos</button>

          <button class="cma-profile-tab"
            data-tab="reacted" type="button">React On</button>

          <button class="cma-profile-tab"
            data-tab="friends" type="button">Friends</button>
        </div>

        <div id="cmaProfileTabContent">
          <div class="cma-profile-empty">
            Loading your posts...
          </div>
        </div>

      </div>

      ${isOwnProfile ? `
      <div class="cma-profile-modal" id="cmaProfileModal">
        <div class="cma-profile-modal-content">

          <div class="cma-profile-modal-title">
            Edit Personal Information
          </div>

          <form id="cmaProfileEditForm">

            <label class="cma-profile-field">
              <span>Full Name</span>
              <input name="full_name" maxlength="80"
                value="${escape(name)}" required>
            </label>

            <label class="cma-profile-field">
              <span>Short Description</span>
              <textarea name="short_description"
                maxlength="180">${escape(description)}</textarea>
            </label>

            <label class="cma-profile-field">
              <span>Institution</span>
              <input name="institution" maxlength="120"
                value="${escape(institution)}">
            </label>

            <label class="cma-profile-field">
              <span>Mobile Number</span>
              <input name="mobile_number" type="tel"
                maxlength="25" value="${escape(mobile)}">
            </label>

            <label class="cma-profile-field">
              <span>Address</span>
              <textarea name="address"
                maxlength="250">${escape(address)}</textarea>
            </label>

            <button class="cma-profile-save" type="submit">
              Save Changes
            </button>

            <button class="cma-profile-cancel"
              type="button" id="cmaProfileCancel">
              Cancel
            </button>

          </form>
        </div>
      </div>
      ` : ""}
    `;
  }

  // =========================================
  // PUBLIC PROFILE LOADING
  // =========================================

  async function loadPublicProfile(userId) {
    if (!db || !userId) {
      throw new Error("Profile information is unavailable.");
    }

    const result = await db
      .from("cma_community_profiles")
      .select("user_id,full_name,short_description,institution,avatar_url")
      .eq("user_id", userId)
      .maybeSingle();

    if (result.error) throw result.error;

    if (!result.data) {
      throw new Error(
        "This member's profile is not available yet."
      );
    }

    return result.data;
  }

  function makeProfileUser(profile) {
    return {
      id: profile.user_id,
      user_metadata: {
        full_name: profile.full_name || "Community Member",
        short_description: profile.short_description || "",
        institution: profile.institution || "",
        avatar_url: profile.avatar_url || ""
      }
    };
  }

  // =========================================
  // PROFILE IMAGE UPLOAD
  // =========================================

  async function uploadProfileImage(file, kind, user, root) {
    if (!db || !db.storage || !db.auth || !user) {
      throw new Error("Storage or login is unavailable.");
    }

    const allowedTypes = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp"
    };

    if (!file || !allowedTypes[file.type]) {
      throw new Error("Only JPG, PNG and WEBP images are allowed.");
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error("Image size must be 5MB or less.");
    }

    showNotice("Uploading image...", "info");

    const path = user.id + "/" + kind + "-" +
      Date.now() + "." + allowedTypes[file.type];

    const uploadResult = await db.storage
      .from("community-media")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type
      });

    if (uploadResult.error) throw uploadResult.error;

    const publicResult = db.storage
      .from("community-media")
      .getPublicUrl(path);

    const imageUrl = publicResult.data &&
      publicResult.data.publicUrl;

    if (!imageUrl) {
      throw new Error("Could not create image URL.");
    }

    const metadata = {
      ...getMetadata(user)
    };

    metadata[
      kind === "avatar" ? "avatar_url" : "cover_url"
    ] = imageUrl;

    const updateResult = await db.auth.updateUser({
      data: metadata
    });

    if (updateResult.error) throw updateResult.error;

    if (Core && Core.loadSession) {
      await Core.loadSession();
    }

    const updatedUser = getUser();

    if (kind === "avatar" && updatedUser) {
      const profileResult = await db
        .from("cma_community_profiles")
        .upsert({
          user_id: updatedUser.id,
          full_name:
            getMetadata(updatedUser).full_name ||
            getMetadata(updatedUser).display_name ||
            "Community Member",
          short_description:
            getMetadata(updatedUser).short_description || "",
          institution:
            getMetadata(updatedUser).institution || "",
          avatar_url: imageUrl,
          updated_at: new Date().toISOString()
        }, {
          onConflict: "user_id"
        });

      if (profileResult.error) {
        console.error(
          "CMA Avatar Profile Sync Error:",
          profileResult.error
        );
      }
    }

    showNotice(
      kind === "avatar"
        ? "Profile picture updated."
        : "Cover photo updated.",
      "success"
    );

    await Profile.render(root);
  }

  // =========================================
  // PROFILE POSTS
  // =========================================

  async function loadUserPosts(user, root) {
    const content = root.querySelector("#cmaProfileTabContent");

    if (!content) return;

    content.innerHTML = `
      <div class="cma-profile-empty">
        Loading posts...
      </div>
    `;

    if (!db || !db.from || !user) {
      content.innerHTML = `
        <div class="cma-profile-empty">
          Could not load posts.
        </div>
      `;
      return;
    }

    try {
      const result = await db
        .from("cma_community_posts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (result.error) throw result.error;

      const posts = result.data || [];

      if (!posts.length) {
        content.innerHTML = `
          <div class="cma-profile-empty">
            No posts shared yet.
          </div>
        `;
        return;
      }

      const Feed = window.CMACommunityFeed;

      if (!Feed || typeof Feed.createPostCard !== "function") {
        content.innerHTML = `
          <div class="cma-profile-empty">
            The post display module is unavailable.
          </div>
        `;
        return;
      }

      const metadata = getMetadata(user);

      const authorName =
        metadata.full_name ||
        metadata.display_name ||
        "Community Member";

      const avatarUrl = getAvatar(user);

      content.innerHTML = `
        <div class="cma-profile-posts">
          ${posts.map(function (post) {
            return Feed.createPostCard({
              id: post.id,
              user_id: post.user_id,
              caption: post.content,
              image_url: post.image_url,
              created_at: post.created_at,
              author_name: authorName,
              avatar_url: avatarUrl
            });
          }).join("")}
        </div>
      `;

      if (typeof Feed.bindEvents === "function") {
        Feed.bindEvents(root);
      }

      if (typeof Feed.loadRandomComment === "function") {
        await Promise.all(
          posts.map(function (post) {
            return Feed.loadRandomComment(post.id);
          })
        );
      }

    } catch (error) {
      console.error("CMA Profile Posts Error:", error);

      content.innerHTML = `
        <div class="cma-profile-empty">
          Could not load posts. Please try again.
        </div>
      `;
    }
  }

  // =========================================
  // CREATE PROFILE POST
  // =========================================

  async function createProfilePost(root, user) {
    if (!db || !user) {
      showNotice("Please log in first.", "error");
      return;
    }

    const textarea = root.querySelector("#cmaProfilePostInput");
    const photoInput = root.querySelector("#cmaProfilePostPhoto");

    const postButton = root.querySelector(
      '[data-cma-profile-action="post"]'
    );

    const content = textarea
      ? textarea.value.trim()
      : "";

    const file = photoInput && photoInput.files
      ? photoInput.files[0]
      : null;

    if (!content && !file) {
      showNotice(
        "Write something or select a photo first.",
        "error"
      );
      return;
    }

    if (file) {
      if (
        !["image/jpeg", "image/png", "image/webp"].includes(file.type)
      ) {
        showNotice(
          "Only JPG, PNG and WEBP images are allowed.",
          "error"
        );
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        showNotice(
          "Image size must be 5MB or less.",
          "error"
        );
        return;
      }
    }

    if (postButton) {
      postButton.disabled = true;
      postButton.textContent = "Posting...";
    }

    try {
      let imageUrl = null;

      if (file) {
        const extension = file.type === "image/jpeg"
          ? "jpg"
          : file.type === "image/png"
            ? "png"
            : "webp";

        const path = user.id + "/post-" +
          Date.now() + "." + extension;

        const uploadResult = await db.storage
          .from("community-media")
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type
          });

        if (uploadResult.error) {
          throw uploadResult.error;
        }

        const publicResult = db.storage
          .from("community-media")
          .getPublicUrl(path);

        imageUrl = publicResult.data &&
          publicResult.data.publicUrl;

        if (!imageUrl) {
          throw new Error("Could not create photo URL.");
        }
      }

      const insertResult = await db
        .from("cma_community_posts")
        .insert({
          user_id: user.id,
          content: content,
          image_url: imageUrl
        });

      if (insertResult.error) {
        throw insertResult.error;
      }

      if (textarea) textarea.value = "";
      if (photoInput) photoInput.value = "";

      const preview = root.querySelector(
        "#cmaProfilePhotoPreview"
      );

      if (preview) {
        preview.innerHTML = "";
        preview.classList.remove("show");
      }

      showNotice(
        "Your post has been published.",
        "success"
      );

      await loadUserPosts(user, root);

      if (
        window.CMACommunityMain &&
        typeof window.CMACommunityMain.loadPosts === "function"
      ) {
        await window.CMACommunityMain.loadPosts();
      }

    } catch (error) {
      console.error("CMA Profile Post Error:", error);

      showNotice(
        error.message || "Could not publish your post.",
        "error"
      );

    } finally {
      if (postButton) {
        postButton.disabled = false;
        postButton.textContent = "Post";
      }
    }
  }

  // =========================================
  // PROFILE EVENTS
  // =========================================

  function bindEvents(root, user, isOwnProfile) {

    root.querySelectorAll("[data-cma-profile-page]")
      .forEach(function (button) {
        button.addEventListener("click", function () {
          const page = button.dataset.cmaProfilePage;

          if (page === "profile") return;

          window.dispatchEvent(
            new CustomEvent("cma:navigate", {
              detail: { page: page }
            })
          );
        });
      });

    const searchButton = root.querySelector(
      '[data-cma-profile-action="search"]'
    );

    if (searchButton) {
      searchButton.addEventListener("click", function () {
        window.dispatchEvent(
          new CustomEvent("cma:open-search")
        );
      });
    }

    // Visitors can view profile tabs but cannot edit or post.
    root.querySelectorAll("[data-tab]").forEach(
      function (button) {
        button.addEventListener("click", async function () {
          activeTab = button.dataset.tab;

          root.querySelectorAll("[data-tab]").forEach(
            function (tab) {
              tab.classList.toggle(
                "active",
                tab === button
              );
            }
          );

          const content = root.querySelector(
            "#cmaProfileTabContent"
          );

          if (!content) return;

          if (activeTab === "posts") {
            await loadUserPosts(user, root);
            return;
          }

          const messages = {
            photos: "Photos will appear here.",
            reacted: "Posts this member reacted to will appear here.",
            friends: "Friends list will appear here."
          };

          content.innerHTML = `
            <div class="cma-profile-empty">
              ${messages[activeTab] || ""}
            </div>
          `;
        });
      }
    );

    if (!isOwnProfile) return;

    const avatarInput = root.querySelector("#cmaAvatarFile");
    const coverInput = root.querySelector("#cmaCoverFile");
    const avatarArea = root.querySelector("#cmaAvatarArea");
    const coverArea = root.querySelector("#cmaCoverArea");

    if (avatarArea && avatarInput) {
      avatarArea.addEventListener("click", function (event) {
        event.stopPropagation();
        avatarInput.click();
      });
    }

    if (coverArea && coverInput) {
      coverArea.addEventListener("click", function (event) {
        if (event.target.closest("#cmaAvatarArea")) return;
        coverInput.click();
      });
    }

    if (avatarInput) {
      avatarInput.addEventListener("change", async function () {
        const file = avatarInput.files &&
          avatarInput.files[0];

        if (file) {
          try {
            await uploadProfileImage(
              file,
              "avatar",
              user,
              root
            );
          } catch (error) {
            console.error("CMA Avatar Upload Error:", error);

            showNotice(
              error.message || "Could not upload profile picture.",
              "error"
            );
          }
        }

        avatarInput.value = "";
      });
    }

    if (coverInput) {
      coverInput.addEventListener("change", async function () {
        const file = coverInput.files &&
          coverInput.files[0];

        if (file) {
          try {
            await uploadProfileImage(
              file,
              "cover",
              user,
              root
            );
          } catch (error) {
            console.error("CMA Cover Upload Error:", error);

            showNotice(
              error.message || "Could not upload cover photo.",
              "error"
            );
          }
        }

        coverInput.value = "";
      });
    }

    const editButton = root.querySelector("#cmaEditProfile");
    const modal = root.querySelector("#cmaProfileModal");
    const cancelButton = root.querySelector("#cmaProfileCancel");
    const editForm = root.querySelector("#cmaProfileEditForm");

    if (editButton && modal) {
      editButton.addEventListener("click", function () {
        modal.classList.add("show");
      });
    }

    if (cancelButton && modal) {
      cancelButton.addEventListener("click", function () {
        modal.classList.remove("show");
      });
    }

    if (modal) {
      modal.addEventListener("click", function (event) {
        if (event.target === modal) {
          modal.classList.remove("show");
        }
      });
    }

    if (editForm) {
      editForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (!db || !db.auth || !user) {
          showNotice("Please log in first.", "error");
          return;
        }

        const formData = new FormData(editForm);

        const fullName = String(
          formData.get("full_name") || ""
        ).trim();

        const shortDescription = String(
          formData.get("short_description") || ""
        ).trim();

        const institution = String(
          formData.get("institution") || ""
        ).trim();

        const mobileNumber = String(
          formData.get("mobile_number") || ""
        ).trim();

        const address = String(
          formData.get("address") || ""
        ).trim();

        if (!fullName) {
          showNotice(
            "Full Name is required.",
            "error"
          );
          return;
        }

        const saveButton = editForm.querySelector(
          ".cma-profile-save"
        );

        if (saveButton) {
          saveButton.disabled = true;
          saveButton.textContent = "Saving...";
        }

        try {
          const result = await db.auth.updateUser({
            data: {
              ...getMetadata(user),
              full_name: fullName,
              short_description: shortDescription,
              institution: institution,
              mobile_number: mobileNumber,
              address: address
            }
          });

          if (result.error) throw result.error;

          if (Core && Core.loadSession) {
            await Core.loadSession();
          }

          const updatedUser = getUser();

          if (updatedUser) {
            const profileResult = await db
              .from("cma_community_profiles")
              .upsert({
                user_id: updatedUser.id,
                full_name: fullName,
                short_description: shortDescription,
                institution: institution,
                avatar_url:
                  getMetadata(updatedUser).avatar_url || "",
                updated_at: new Date().toISOString()
              }, {
                onConflict: "user_id"
              });

            if (profileResult.error) {
              throw profileResult.error;
            }
          }

          showNotice(
            "Profile information updated.",
            "success"
          );

          await Profile.render(root);

        } catch (error) {
          console.error("CMA Profile Save Error:", error);

          showNotice(
            error.message ||
              "Could not save profile information.",
            "error"
          );

          if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent = "Save Changes";
          }
        }
      });
    }

    const photoButton = root.querySelector(
      '[data-cma-profile-action="photo"]'
    );

    const profilePhotoInput = document.createElement("input");

    profilePhotoInput.type = "file";
    profilePhotoInput.id = "cmaProfilePostPhoto";
    profilePhotoInput.accept =
      "image/jpeg,image/png,image/webp";
    profilePhotoInput.className =
      "cma-profile-file-input";

    root.appendChild(profilePhotoInput);

    if (photoButton) {
      photoButton.addEventListener("click", function () {
        if (Core && !Core.requireLogin()) return;
        profilePhotoInput.click();
      });
    }

    profilePhotoInput.addEventListener("change", function () {
      const file = profilePhotoInput.files &&
        profilePhotoInput.files[0];

      const preview = root.querySelector(
        "#cmaProfilePhotoPreview"
      );

      if (!file || !preview) return;

      if (
        !["image/jpeg", "image/png", "image/webp"].includes(file.type)
      ) {
        showNotice(
          "Only JPG, PNG and WEBP images are allowed.",
          "error"
        );
        profilePhotoInput.value = "";
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        showNotice(
          "Image size must be 5MB or less.",
          "error"
        );
        profilePhotoInput.value = "";
        return;
      }

      const objectUrl = URL.createObjectURL(file);

      preview.innerHTML = `
        <img src="${objectUrl}" alt="Selected post photo">
        <button type="button"
          class="cma-profile-photo-remove"
          id="cmaRemoveProfilePostPhoto">
          Remove photo
        </button>
      `;

      preview.classList.add("show");

      const removeButton = preview.querySelector(
        "#cmaRemoveProfilePostPhoto"
      );

      if (removeButton) {
        removeButton.addEventListener("click", function () {
          profilePhotoInput.value = "";
          preview.innerHTML = "";
          preview.classList.remove("show");
          URL.revokeObjectURL(objectUrl);
        });
      }
    });

    const postButton = root.querySelector(
      '[data-cma-profile-action="post"]'
    );

    if (postButton) {
      postButton.addEventListener("click", function () {
        if (Core && !Core.requireLogin()) return;
        createProfilePost(root, user);
      });
    }
  }

  // =========================================
  // PROFILE MODULE
  // =========================================

  const Profile = {

    async refreshPosts() {
      if (!lastRenderedRoot || !lastRenderedUser) return [];
      return loadUserPosts(lastRenderedUser, lastRenderedRoot);
    },

    async render(root, targetUserId = null) {
      if (!root && Core && Core.getRoot) {
        root = Core.getRoot();
      }

      if (!root) {
        console.error("CMA Profile: Page root not found.");
        return false;
      }

      try {
        if (Core && Core.loadSession) {
          await Core.loadSession();
        }

        const loggedInUser = getUser();

        if (!loggedInUser) {
          root.innerHTML = `
            <div class="cma-profile-empty">
              Please log in to view this profile.
            </div>
          `;
          return false;
        }

        const requestedUserId = targetUserId
          ? String(targetUserId).trim()
          : null;

        const isOwnProfile =
          !requestedUserId ||
          requestedUserId === String(loggedInUser.id);

        let profileUser = loggedInUser;

        if (!isOwnProfile) {
          const profileData = await loadPublicProfile(requestedUserId);
          profileUser = makeProfileUser(profileData);
        }

        injectStyles();

        root.innerHTML =
          renderNavigation() +
          renderProfileContent(profileUser, isOwnProfile);

        lastRenderedRoot = root;
        lastRenderedUser = profileUser;

        bindEvents(root, profileUser, isOwnProfile);

        if (
          window.CMACommunityFeed &&
          typeof window.CMACommunityFeed.bindEvents === "function"
        ) {
          window.CMACommunityFeed.bindEvents(root);
        }

        await loadUserPosts(profileUser, root);
        return true;

      } catch (error) {
        console.error("CMA Profile Render Error:", error);

        root.innerHTML = `
          <div class="cma-profile-empty">
            <p>Profile is not available.</p>
            <button type="button" id="cmaProfileGoBack">
              Go Back
            </button>
          </div>
        `;

        const backButton = root.querySelector("#cmaProfileGoBack");

        if (backButton) {
          backButton.addEventListener("click", function () {
            window.history.back();
          });
        }

        return false;
      }
    }
  };

  window.CMACommunityProfile = Profile;

})();
     
